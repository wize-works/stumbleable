import { getAuth } from '@clerk/fastify';
import { FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { DiscoveryRepository, EnhancedDiscovery } from '../lib/repository';
import {
    calculateExplorationBoost,
    calculateFreshness,
    calculateOverallScore,
    calculatePersonalizationScore,
    calculatePopularityScore,
    calculateSimilarity,
    generateReason,
    getAgeDays,
    ScoringContext
} from '../lib/scoring';
import { DiscoveryResponse } from '../types';

const repository = new DiscoveryRepository();

// Validation schema for the request - userId comes from Clerk auth
const nextDiscoverySchema = z.object({
    wildness: z.number().min(0).max(100),
    seenIds: z.array(z.string()).optional().default([])
});

interface EnhancedScoredCandidate {
    discovery: EnhancedDiscovery;
    score: number;
    debug: {
        ageDays: number;
        freshness: number;
        similarity: number;
        popularity: number;
        engagement: number;
        quality: number;
    };
}

/**
 * Next discovery route plugin with enhanced algorithm
 */
export const nextDiscoveryRoute: FastifyPluginAsync = async (fastify) => {
    fastify.post<{ Body: { wildness: number; seenIds?: string[] } }>('/next', async (request: FastifyRequest<{ Body: { wildness: number; seenIds?: string[] } }>, reply: FastifyReply) => {
        try {
            // Check authentication
            const auth = getAuth(request as any);
            if (!auth.isAuthenticated) {
                return reply.status(401).send({
                    error: 'User not authenticated'
                });
            }
            const userId = auth.userId;

            // Validate request body
            const validationResult = nextDiscoverySchema.safeParse(request.body);
            if (!validationResult.success) {
                return reply.status(400).send({
                    error: 'Invalid request body',
                    details: validationResult.error.errors
                });
            }

            const { wildness, seenIds } = validationResult.data;

            // Get user preferences and stats
            let user = await repository.getUserById(userId);
            if (!user) {
                // Use default user preferences for new Clerk users
                user = {
                    id: userId,
                    preferredTopics: ['technology', 'science'], // default starter topics
                    wildness: 35 // moderate exploration for new users
                };
            }

            // Get candidate discoveries (excluding already seen and blocked domains)
            let candidates = await repository.getDiscoveriesExcluding(seenIds);

            // Filter out blocked domains
            if (user.blockedDomains && user.blockedDomains.length > 0) {
                candidates = candidates.filter(discovery =>
                    !user.blockedDomains!.includes(discovery.domain)
                );
            }

            if (candidates.length === 0) {
                // If all discoveries have been seen, reset and pick from all
                const allDiscoveries = await repository.getAllDiscoveries();
                if (allDiscoveries.length === 0) {
                    return reply.status(404).send({
                        error: 'No discoveries available'
                    });
                }

                // Return the first one as a fallback
                const fallbackDiscovery = allDiscoveries[0];
                return reply.send({
                    discovery: fallbackDiscovery,
                    score: 0.5,
                    reason: 'Fallback discovery - all content seen',
                    resetRequired: true
                });
            }

            // Get global engagement statistics for relative scoring
            const globalStats = await repository.getGlobalEngagementStats();

            // Get user's interaction history for enhanced personalization (H2.3)
            const interactionHistory = await repository.getUserInteractionHistory(user.id || userId, 100);

            // Create scoring context
            const now = new Date();
            const scoringContext: ScoringContext = {
                userTopics: user.preferredTopics,
                wildness,
                userEngagementHistory: user.engagementHistory,
                timeOfDay: now.getHours(),
                dayOfWeek: now.getDay()
            };

            // Fetch domain reputations for all unique domains (H2.2 - batch optimization)
            const uniqueDomains = [...new Set(candidates.map(c => c.domain))];
            const domainReputations: Record<string, number> = {};

            await Promise.all(
                uniqueDomains.map(async domain => {
                    domainReputations[domain] = await repository.getDomainReputation(domain);
                })
            );

            // Calculate scores for all candidates with enhanced features
            const scoredCandidates: EnhancedScoredCandidate[] = candidates.map(discovery => {
                const ageDays = getAgeDays(discovery.createdAt || new Date().toISOString());

                // Core scoring components
                const freshnessScore = calculateFreshness(ageDays);
                const baseScore = discovery.baseScore || 0.5;
                const qualityScore = discovery.quality || 0.5;

                // H2.2: Domain reputation scoring
                const domainReputation = domainReputations[discovery.domain] || 0.5;

                // Enhanced similarity calculation with topic confidence
                const similarityScore = calculateSimilarity(
                    user!.preferredTopics,
                    discovery.contentTopics || discovery.topics.map(t => ({ name: t, confidence: 0.5 }))
                );

                // H2.3: Personalized scoring using interaction history
                const personalizationScore = Object.keys(interactionHistory.likedTopics).length > 0
                    ? calculatePersonalizationScore(
                        discovery.topics,
                        discovery.domain,
                        interactionHistory,
                        domainReputation
                    )
                    : similarityScore;

                // Popularity scoring with engagement metrics
                const popularityScore = discovery.metrics
                    ? calculatePopularityScore(discovery.metrics, ageDays, globalStats.averageEngagement)
                    : discovery.popularityScore || 0.5;

                // Apply exploration boost based on wildness
                const adjustedSimilarity = calculateExplorationBoost(
                    wildness,
                    personalizationScore, // Use personalized score instead of raw similarity
                    popularityScore
                );

                // Calculate final score with all factors including domain reputation
                const reputationBoost = 0.8 + (domainReputation * 0.4); // 0.8-1.2x multiplier
                const finalScore = calculateOverallScore(
                    baseScore,
                    qualityScore,
                    freshnessScore,
                    popularityScore,
                    adjustedSimilarity,
                    scoringContext
                ) * reputationBoost;

                return {
                    discovery,
                    score: finalScore,
                    debug: {
                        ageDays: Math.round(ageDays * 10) / 10,
                        freshness: Math.round(freshnessScore * 1000) / 1000,
                        similarity: Math.round(adjustedSimilarity * 1000) / 1000,
                        popularity: Math.round(popularityScore * 1000) / 1000,
                        engagement: Math.round((discovery.metrics?.engagement_rate || 0) * 1000) / 1000,
                        quality: qualityScore,
                    }
                };
            });

            // Sort by score (highest first)
            scoredCandidates.sort((a, b) => b.score - a.score);

            // IMPROVED: Session-based randomization to prevent predictable ordering
            // Create a session seed based on user + current hour to vary selection within sessions
            const sessionSeed = (userId.charCodeAt(0) + new Date().getHours()) % 1000;

            // Shuffle the scored candidates using the session seed for consistent variety
            const shuffledCandidates = [...scoredCandidates];
            for (let i = shuffledCandidates.length - 1; i > 0; i--) {
                const j = Math.floor(((sessionSeed + i) * 9301 + 49297) % 233280) / 233280 * (i + 1);
                [shuffledCandidates[i], shuffledCandidates[j]] = [shuffledCandidates[j], shuffledCandidates[i]];
            }

            // Smart selection with variety injection
            const baseRandomness = 0.3; // Always have some randomness
            const wildnessBoost = (wildness / 100) * 0.5; // Wildness adds up to 50% more randomness
            const totalRandomness = Math.min(0.8, baseRandomness + wildnessBoost);

            // Dynamic top candidate count based on wildness and available content
            const minCandidates = Math.max(3, Math.min(10, Math.ceil(candidates.length * 0.1)));
            const maxCandidates = Math.max(8, Math.min(25, Math.ceil(candidates.length * 0.4)));
            const topCount = Math.floor(minCandidates + (maxCandidates - minCandidates) * (wildness / 100));

            // Mix high-scoring and variety candidates
            const topScored = shuffledCandidates.slice(0, Math.ceil(topCount * 0.7)); // 70% top scored
            const varietyCandidates = shuffledCandidates.slice(Math.ceil(topCount * 0.7), topCount); // 30% variety

            // VARIETY INJECTION: Occasionally include content from outside the top candidates
            // This prevents getting stuck in filter bubbles and adds serendipity
            const shouldInjectRandomContent = wildness > 30 && Math.random() < (wildness / 200); // Higher wildness = more random content
            if (shouldInjectRandomContent && shuffledCandidates.length > topCount) {
                const randomContentPool = shuffledCandidates.slice(topCount);
                const randomPick = randomContentPool[Math.floor(Math.random() * Math.min(10, randomContentPool.length))];
                varietyCandidates.push(randomPick);
            }

            const selectionPool = [...topScored, ...varietyCandidates];

            let selectedCandidate: EnhancedScoredCandidate;

            // SAFETY: Ensure we always have candidates to select from
            if (selectionPool.length === 0) {
                // Fallback to any available candidate if pools are empty
                if (shuffledCandidates.length > 0) {
                    selectedCandidate = shuffledCandidates[0];
                } else if (scoredCandidates.length > 0) {
                    selectedCandidate = scoredCandidates[0];
                } else {
                    // This shouldn't happen, but handle gracefully
                    throw new Error('No candidates available for selection');
                }
            } else if (Math.random() < totalRandomness && selectionPool.length > 1) {
                // Weighted random selection with bias toward higher scores but more variety
                const weights = selectionPool.map((c, i) => {
                    const scoreWeight = Math.pow(c.score || 0.5, 0.5); // Reduce score dominance, handle undefined
                    const varietyBonus = i >= topScored.length ? 1.5 : 1; // Boost variety candidates
                    return scoreWeight * varietyBonus;
                });

                const totalWeight = weights.reduce((sum, w) => sum + w, 0);

                if (totalWeight <= 0) {
                    // Fallback if all weights are 0
                    selectedCandidate = selectionPool[0];
                } else {
                    let random = Math.random() * totalWeight;
                    selectedCandidate = selectionPool[0]; // safe fallback

                    for (let i = 0; i < selectionPool.length; i++) {
                        random -= weights[i];
                        if (random <= 0) {
                            selectedCandidate = selectionPool[i];
                            break;
                        }
                    }
                }
            } else {
                // Still pick randomly from top candidates, not always #1
                const randomIndex = Math.floor(Math.random() * Math.min(3, selectionPool.length));
                selectedCandidate = selectionPool[randomIndex] || selectionPool[0]; // Safe fallback
            }

            // FINAL SAFETY CHECK: Ensure selectedCandidate is valid
            if (!selectedCandidate || !selectedCandidate.discovery) {
                fastify.log.error({
                    selectionPoolLength: selectionPool.length,
                    shuffledCandidatesLength: shuffledCandidates.length,
                    scoredCandidatesLength: scoredCandidates.length,
                    candidateCount: candidates.length
                }, 'selectedCandidate is invalid, using fallback');

                // Ultimate fallback
                if (scoredCandidates.length > 0) {
                    selectedCandidate = scoredCandidates[0];
                } else {
                    throw new Error('No valid candidates found after all fallbacks');
                }
            }            // Generate human-readable reason
            const reason = generateReason(
                selectedCandidate.discovery,
                user.preferredTopics,
                selectedCandidate.score,
                scoringContext
            );

            // Record discovery event for analytics
            // Use the database user ID if available, otherwise use Clerk ID
            const userIdForEvent = user.id;

            await repository.recordDiscoveryEvent(
                userIdForEvent,
                selectedCandidate.discovery.id,
                null, // session ID would come from interaction service
                'v2.0', // algorithm version
                wildness,
                {
                    baseScore: selectedCandidate.discovery.baseScore || 0.5,
                    finalScore: selectedCandidate.score,
                    rank: scoredCandidates.findIndex(c => c.discovery.id === selectedCandidate.discovery.id) + 1
                }
            );

            const response: DiscoveryResponse = {
                discovery: selectedCandidate.discovery,
                score: Math.round(selectedCandidate.score * 1000) / 1000,
                reason
            };

            // Log debug info for development - now includes randomization details
            const selectedRank = shuffledCandidates.findIndex(c => c.discovery.id === selectedCandidate.discovery.id) + 1;
            fastify.log.info({
                userId: user.id,
                contentId: selectedCandidate.discovery.id,
                title: selectedCandidate.discovery.title,
                domain: selectedCandidate.discovery.domain,
                score: response.score,
                selectedRank,
                debug: selectedCandidate.debug,
                reason,
                wildness,
                candidateCount: candidates.length,
                sessionSeed,
                randomnessApplied: totalRandomness,
                selectionPoolSize: selectionPool.length
            }, 'Discovery selected with randomization');

            return reply.send(response);

        } catch (error) {
            fastify.log.error(error, 'Error in /next endpoint');
            return reply.status(500).send({
                error: 'Internal server error'
            });
        }
    });
};