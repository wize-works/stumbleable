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
    calculateTimeOnPageBoost,
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

            // PERFORMANCE: First get user to access their preferred topics for better candidate filtering
            const user = await repository.getUserById(userId);
            const userPrefs = user || {
                id: userId,
                preferredTopics: ['technology', 'science'],
                wildness: 35
            };

            // CRITICAL FIX: Fetch user's permanently skipped content
            // Users should NEVER see content they've explicitly skipped, even across sessions
            const skippedContentIds = await repository.getUserSkippedContentIds(userPrefs.id || userId);

            // Combine session seenIds with permanently skipped content
            const allExcludedIds = [...new Set([...seenIds, ...skippedContentIds])];

            fastify.log.info({
                userId: userPrefs.id || userId,
                sessionSeenCount: seenIds.length,
                permanentlySkippedCount: skippedContentIds.length,
                totalExcludedCount: allExcludedIds.length
            }, 'Excluding content from discovery');

            // Now fetch candidates WITH topic context for better diversity
            // IMPORTANT: Using allExcludedIds instead of just seenIds to exclude skipped content
            const [candidates, globalStats] = await Promise.all([
                repository.getDiscoveriesExcluding(allExcludedIds, userPrefs.preferredTopics),
                repository.getGlobalEngagementStats() // Fetch global stats in parallel
            ]);

            // Fetch time-on-page metrics for all candidate content (for engagement quality boost)
            const contentIds = candidates.map(c => c.id);
            const timeOnPageMetrics = await repository.getBatchTimeOnPageMetrics(contentIds);

            // Filter out blocked domains
            let filteredCandidates = candidates;
            if (userPrefs.blockedDomains && userPrefs.blockedDomains.length > 0) {
                filteredCandidates = candidates.filter(discovery =>
                    !userPrefs.blockedDomains!.includes(discovery.domain)
                );
            }

            if (filteredCandidates.length === 0) {
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

            // PERFORMANCE: Fetch interaction history with reduced limit for speed
            const interactionHistory = await repository.getUserInteractionHistory(userPrefs.id || userId, 50);

            // Create scoring context
            const now = new Date();
            const scoringContext: ScoringContext = {
                userTopics: userPrefs.preferredTopics,
                wildness,
                userEngagementHistory: userPrefs.engagementHistory,
                timeOfDay: now.getHours(),
                dayOfWeek: now.getDay()
            };

            // OPTIMIZATION: Batch fetch domain reputations in single query
            const uniqueDomains = [...new Set(filteredCandidates.map(c => c.domain))];
            const domainReputations = await repository.getBatchDomainReputations(uniqueDomains);

            // Calculate scores for all candidates with enhanced features
            const scoredCandidates: EnhancedScoredCandidate[] = filteredCandidates.map(discovery => {
                const ageDays = getAgeDays(discovery.createdAt || new Date().toISOString());

                // Core scoring components
                const freshnessScore = calculateFreshness(ageDays);
                const baseScore = discovery.baseScore || 0.5;
                const qualityScore = discovery.quality || 0.5;

                // H2.2: Domain reputation scoring
                const domainReputation = domainReputations[discovery.domain] || 0.5;

                // Enhanced similarity calculation with topic confidence
                const similarityScore = calculateSimilarity(
                    userPrefs.preferredTopics,
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

                // CRITICAL FIX: Significantly boost topic matching for user preferences
                // Users with selected topics should see content matching those topics
                const topicMatchCount = discovery.topics.filter(t => userPrefs.preferredTopics.includes(t)).length;
                const topicBoost = topicMatchCount > 0 ? 1.0 + (topicMatchCount * 0.5) : 0.8;

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

                // H2.6: Apply time-on-page boost for engagement quality
                const timeMetrics = timeOnPageMetrics[discovery.id];
                const timeOnPageBoost = timeMetrics
                    ? calculateTimeOnPageBoost(timeMetrics.avgTime, timeMetrics.sampleSize)
                    : 1.0; // Neutral if no data

                // Calculate final score with all factors including:
                // - Domain reputation
                // - Time-on-page quality
                // - Topic matching boost (CRITICAL FIX: significantly increases weight for matching topics)
                const reputationBoost = 0.8 + (domainReputation * 0.4); // 0.8-1.2x multiplier
                const finalScore = calculateOverallScore(
                    baseScore,
                    qualityScore,
                    freshnessScore,
                    popularityScore,
                    adjustedSimilarity,
                    scoringContext
                ) * reputationBoost * timeOnPageBoost * topicBoost;

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

            // RANDOMIZATION: Use Fisher-Yates shuffle for true randomness
            // This ensures different results each time instead of being locked to an hourly seed
            const shuffledCandidates = [...scoredCandidates];
            for (let i = shuffledCandidates.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
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
                if (randomContentPool.length > 0) {
                    const randomPick = randomContentPool[Math.floor(Math.random() * Math.min(10, randomContentPool.length))];
                    if (randomPick) { // Safety check: ensure randomPick is not undefined
                        varietyCandidates.push(randomPick);
                    }
                }
            }

            // Filter out any null/undefined values before creating selection pool
            const selectionPool = [...topScored, ...varietyCandidates].filter(c => c != null);

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
                    // Additional safety: validate candidate and score
                    if (!c || typeof c.score !== 'number') {
                        request.log.warn({ candidate: c }, 'Invalid candidate in selection pool');
                        return 0.5; // Fallback weight for invalid candidates
                    }
                    const scoreWeight = Math.pow(c.score, 0.5); // Reduce score dominance
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
                userPrefs.preferredTopics,
                selectedCandidate.score,
                scoringContext
            );

            // Record discovery event for analytics
            // Use the database user ID if available, otherwise use Clerk ID
            const userIdForEvent = userPrefs.id;

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
                userId: userPrefs.id,
                contentId: selectedCandidate.discovery.id,
                title: selectedCandidate.discovery.title,
                domain: selectedCandidate.discovery.domain,
                score: response.score,
                selectedRank,
                debug: selectedCandidate.debug,
                reason,
                wildness,
                candidateCount: filteredCandidates.length,
                randomnessApplied: totalRandomness,
                selectionPoolSize: selectionPool.length
            }, 'Discovery selected with true randomization');

            return reply.send(response);

        } catch (error) {
            fastify.log.error(error, 'Error in /next endpoint');
            return reply.status(500).send({
                error: 'Internal server error'
            });
        }
    });
};