/**
 * Discovery scoring algorithms
 * Enhanced version with comprehensive database integration
 */

export interface ScoringContext {
    userTopics: string[];
    wildness: number;
    userEngagementHistory?: {
        likeRate: number;
        saveRate: number;
        skipRate: number;
    };
    timeOfDay?: number; // 0-23
    dayOfWeek?: number; // 0-6
}

export interface ContentMetrics {
    views_count: number;
    likes_count: number;
    saves_count: number;
    shares_count: number;
    skip_count: number;
    engagement_rate: number;
}

/**
 * Calculate freshness score based on age with configurable decay
 * PRD specifies 7-14 day half-life, defaulting to 14 d    // Combine scores
    const engagementPrediction =
        topicScore * 0.35 +
        readingTimeScore * 0.20 +
        qualityScore * 0.25 +
        freshnessScore * 0.20;

    return Math.max(0, Math.min(1, engagementPrediction));
}

/**
 * Calculate engagement quality score based on time spent on page
 * H2.6: Time-on-page tracking for content quality
 * 
 * Uses sigmoid-like curve to score engagement:
 * - Very quick exits (<10s) = low quality signal
 * - Short engagement (10-30s) = moderate quality
 * - Good engagement (30s-3min) = high quality signal
 * - Long engagement (3-10min) = very high quality
 * - Very long (>10min) = cap at max to avoid outliers
 * 
 * @param timeOnPageSeconds - Time user spent on page before interaction
 * @param readingTimeMinutes - Expected reading time for content (optional)
 * @returns Engagement quality score 0-1
 */
export function calculateTimeOnPageScore(
    timeOnPageSeconds: number,
    readingTimeMinutes?: number
): number {
    // Handle edge cases
    if (timeOnPageSeconds <= 0) return 0;

    // Quick exit (< 10 seconds) = low engagement
    if (timeOnPageSeconds < 10) {
        return timeOnPageSeconds / 10 * 0.3; // Max 0.3 for <10s
    }

    // Short engagement (10-30s) = moderate
    if (timeOnPageSeconds < 30) {
        return 0.3 + ((timeOnPageSeconds - 10) / 20) * 0.3; // 0.3 to 0.6
    }

    // Good engagement (30s-3min) = high quality
    if (timeOnPageSeconds < 180) {
        return 0.6 + ((timeOnPageSeconds - 30) / 150) * 0.3; // 0.6 to 0.9
    }

    // Long engagement (3min-10min) = very high quality
    if (timeOnPageSeconds < 600) {
        return 0.9 + ((timeOnPageSeconds - 180) / 420) * 0.1; // 0.9 to 1.0
    }

    // Very long engagement (>10min) = cap at max
    return 1.0;
}

/**
 * Calculate average time-on-page boost for content scoring
 * Rewards content that historically keeps users engaged longer
 * 
 * @param avgTimeOnPage - Average time users spent on this content (seconds)
 * @param sampleSize - Number of interactions with time data
 * @returns Boost multiplier 0.8-1.2
 */
export function calculateTimeOnPageBoost(
    avgTimeOnPage: number | null | undefined,
    sampleSize: number = 0
): number {
    // No data = neutral boost
    if (!avgTimeOnPage || sampleSize < 3) return 1.0;

    // Calculate base quality score
    const qualityScore = calculateTimeOnPageScore(avgTimeOnPage);

    // Apply confidence based on sample size
    // More samples = more confident in the metric
    const confidence = Math.min(1.0, sampleSize / 20); // Full confidence at 20+ samples

    // Convert quality score to boost multiplier
    // 0.0 quality -> 0.8 boost (20% penalty)
    // 0.5 quality -> 1.0 boost (neutral)
    // 1.0 quality -> 1.2 boost (20% bonus)
    const rawBoost = 0.8 + (qualityScore * 0.4);

    // Blend with neutral (1.0) based on confidence
    const boost = (rawBoost * confidence) + (1.0 * (1 - confidence));

    return boost;
}

/**
 * Analyze time-on-page patterns for a user
 * Helps understand user's engagement preferences
 * 
 * @param interactions - User's interaction history with time data
 * @returns User engagement profile
 */
export function analyzeUserTimeOnPagePatterns(
    interactions: Array<{
        timeOnPage: number;
        action: 'like' | 'skip' | 'save';
        readingTime?: number;
    }>
): {
    avgEngagedTime: number;
    avgSkippedTime: number;
    preferredReadingRange: { min: number; max: number };
    quickExitRate: number;
    deepEngagementRate: number;
} {
    const engaged = interactions.filter(i => i.action === 'like' || i.action === 'save');
    const skipped = interactions.filter(i => i.action === 'skip');
    const quickExits = interactions.filter(i => i.timeOnPage < 10);
    const deepEngagement = interactions.filter(i => i.timeOnPage > 180);

    const avgEngagedTime = engaged.length > 0
        ? engaged.reduce((sum, i) => sum + i.timeOnPage, 0) / engaged.length
        : 0;

    const avgSkippedTime = skipped.length > 0
        ? skipped.reduce((sum, i) => sum + i.timeOnPage, 0) / skipped.length
        : 0;

    // Calculate preferred reading time range (25th-75th percentile of engaged content)
    const engagedTimes = engaged
        .map(i => i.timeOnPage)
        .sort((a, b) => a - b);

    const p25Index = Math.floor(engagedTimes.length * 0.25);
    const p75Index = Math.floor(engagedTimes.length * 0.75);

    return {
        avgEngagedTime,
        avgSkippedTime,
        preferredReadingRange: {
            min: engagedTimes[p25Index] || 30,
            max: engagedTimes[p75Index] || 300
        },
        quickExitRate: quickExits.length / Math.max(1, interactions.length),
        deepEngagementRate: deepEngagement.length / Math.max(1, interactions.length)
    };
}
export function calculateFreshness(ageDays: number, decayHalfLife: number = 14): number {
    return Math.exp(-Math.log(2) * ageDays / decayHalfLife);
}

/**
 * Apply Bayesian smoothing to content scores as specified in PRD Section 9
 * Smooths the like rate with a prior to handle content with few interactions
 */
export function applyBayesianSmoothing(
    likes: number,
    totalInteractions: number,
    prior: number = 0.5,
    priorWeight: number = 10
): number {
    if (totalInteractions === 0) return prior;

    // Bayesian smoothing: (likes + prior * priorWeight) / (totalInteractions + priorWeight)
    return (likes + prior * priorWeight) / (totalInteractions + priorWeight);
}

/**
 * Calculate similarity between user topics and item topics with confidence weighting
 */
export function calculateSimilarity(
    userTopics: string[],
    contentTopics: Array<{ name: string, confidence?: number }>
): number {
    if (userTopics.length === 0) return 0.3; // Neutral score for users with no preferences
    if (contentTopics.length === 0) return 0.2; // Low score for uncategorized content

    let totalWeight = 0;
    let matchWeight = 0;

    for (const topic of contentTopics) {
        const confidence = topic.confidence || 0.5;
        totalWeight += confidence;

        if (userTopics.includes(topic.name)) {
            matchWeight += confidence;
        }
    }

    if (totalWeight === 0) return 0.2;

    const matchRatio = matchWeight / totalWeight;
    // Base similarity of 0.3, with bonus for topic matches (can reach 1.0)
    return 0.3 + 0.7 * matchRatio;
}

/**
 * Calculate exploration factor based on wildness setting
 * Balances exploitation (similar content) vs exploration (diverse content)
 */
export function calculateExplorationBoost(
    wildness: number,
    baseSimilarity: number,
    contentPopularity: number = 0.5
): number {
    const wildnessFactor = wildness / 100;

    // Low wildness: heavily favor similar content
    if (wildness < 20) {
        return baseSimilarity * (0.8 + 0.2 * contentPopularity);
    }

    // Medium wildness: balanced approach
    if (wildness < 70) {
        const explorationWeight = (wildness - 20) / 50; // 0 to 1
        const similarityScore = baseSimilarity * (1 - explorationWeight * 0.3);
        const diversityScore = (1 - baseSimilarity) * explorationWeight * 0.5;
        return similarityScore + diversityScore + contentPopularity * 0.2;
    }

    // High wildness: favor diverse and serendipitous content
    const diversityBonus = (1 - baseSimilarity) * 0.7;
    const popularityPenalty = contentPopularity * -0.2; // Slightly favor less popular content
    const randomBoost = Math.random() * 0.3; // Add randomness

    return Math.max(0.1, baseSimilarity * 0.4 + diversityBonus + popularityPenalty + randomBoost);
}

/**
 * Calculate age in days from ISO date string
 */
export function getAgeDays(createdAt: string): number {
    const created = new Date(createdAt);
    const now = new Date();
    const diffMs = now.getTime() - created.getTime();
    return diffMs / (1000 * 60 * 60 * 24);
}

/**
 * Calculate engagement score based on content metrics using Bayesian smoothing
 * Implements the Bayesian smoothing specified in PRD Section 9
 */
export function calculateEngagementScore(metrics: ContentMetrics): number {
    const totalInteractions = metrics.likes_count + metrics.saves_count + metrics.shares_count + metrics.skip_count;

    if (totalInteractions === 0) return 0.5; // Neutral score for new content

    // Calculate positive interactions (likes, saves weighted more than shares)
    const positiveInteractions = metrics.likes_count + metrics.saves_count * 1.2 + metrics.shares_count * 0.8;

    // Apply Bayesian smoothing to the like rate
    const smoothedScore = applyBayesianSmoothing(
        positiveInteractions,
        totalInteractions,
        0.5, // Prior assumption: 50% positive rate
        10   // Prior weight (equivalent to 10 interactions)
    );

    return Math.max(0.1, Math.min(1.0, smoothedScore));
}

/**
 * Calculate popularity score with recency weighting
 */
export function calculatePopularityScore(
    metrics: ContentMetrics,
    ageDays: number,
    globalAverageEngagement: number = 0.3
): number {
    const engagementScore = calculateEngagementScore(metrics);

    // Recent content gets boosted even with lower engagement
    const recencyBoost = Math.exp(-ageDays / 7) * 0.3; // 7-day boost decay

    // Compare to global average
    const relativeScore = engagementScore / Math.max(0.1, globalAverageEngagement);

    return Math.min(1.0, relativeScore + recencyBoost);
}

/**
 * Calculate overall discovery score with multiple factors
 * Implementation of PRD Section 9 formula: final = score0 × (0.5 + 0.5·sim) × (0.6 + 0.4·fresh) × rep
 */
export function calculateOverallScore(
    baseScore: number,
    qualityScore: number,
    freshnessScore: number,
    popularityScore: number,
    similarityScore: number,
    context: ScoringContext
): number {
    // PRD Section 9 formula implementation
    const score0 = baseScore * qualityScore; // Base score with quality
    const simFactor = 0.5 + 0.5 * similarityScore; // Similarity component
    const freshFactor = 0.6 + 0.4 * freshnessScore; // Freshness component  
    const repFactor = popularityScore; // Domain reputation / popularity

    // Core PRD formula
    let finalScore = score0 * simFactor * freshFactor * repFactor;

    // Apply ε-greedy exploration (5-10% as specified in PRD)
    const explorationRate = 0.05 + (context.wildness / 100) * 0.05; // 5-10% based on wildness
    if (Math.random() < explorationRate) {
        // Add exploration boost for diversity
        finalScore += Math.random() * 0.3;
    }

    // Apply contextual modifiers for enhanced experience
    let contextMultiplier = 1.0;

    // Time-based adjustments (if available)
    if (context.timeOfDay !== undefined) {
        // Slightly boost diverse content during peak hours (evening)
        if (context.timeOfDay >= 18 && context.timeOfDay <= 22) {
            contextMultiplier *= (1 + (1 - similarityScore) * 0.1);
        }
    }

    // User engagement history adjustments
    if (context.userEngagementHistory) {
        const { likeRate, skipRate } = context.userEngagementHistory;

        // Users with high skip rate get more diverse content
        if (skipRate > 0.5) {
            contextMultiplier *= (1 + (1 - similarityScore) * 0.15);
        }

        // Users with high like rate get slightly more similar content
        if (likeRate > 0.6) {
            contextMultiplier *= (1 + similarityScore * 0.1);
        }
    }

    return Math.min(1.0, finalScore * contextMultiplier);
}

/**
 * Check if a discovery is trending based on quality and freshness
 * High quality + recent content = trending
 */
export function isTrending(quality: number, ageDays: number): boolean {
    const freshnessScore = calculateFreshness(ageDays);
    const trendScore = quality * freshnessScore;
    return trendScore > 0.6; // High threshold for trending
}

/**
 * Calculate trending score for content
 */
export function calculateTrendingScore(
    metrics: ContentMetrics,
    ageDays: number,
    timeWindow: 'hour' | 'day' | 'week' = 'day'
): number {
    const totalInteractions = metrics.likes_count + metrics.saves_count + metrics.shares_count;
    const totalViews = Math.max(1, metrics.views_count);

    // Engagement velocity (interactions per view)
    const velocity = totalInteractions / totalViews;

    // Time decay based on window
    let timeDecay: number;
    switch (timeWindow) {
        case 'hour':
            timeDecay = Math.exp(-ageDays * 24 / 2); // 2-hour half-life
            break;
        case 'day':
            timeDecay = Math.exp(-ageDays / 1); // 1-day half-life
            break;
        case 'week':
            timeDecay = Math.exp(-ageDays / 3); // 3-day half-life
            break;
    }

    return velocity * timeDecay * Math.min(1.0, totalViews / 100);
}

/**
 * Generate a human-readable reason for why a discovery was recommended
 */
export function generateReason(
    discovery: any,
    userTopics: string[],
    score: number,
    context: ScoringContext
): string {
    const matchingTopics = discovery.topics?.filter((t: any) =>
        userTopics.includes(typeof t === 'string' ? t : t.name)
    ) || [];

    const ageDays = getAgeDays(discovery.createdAt || new Date().toISOString());
    const isRecent = ageDays < 2;
    const isVeryRecent = ageDays < 0.5;
    const isHighQuality = (discovery.quality || discovery.qualityScore || 0.5) > 0.8;
    const isPopular = (discovery.popularityScore || 0) > 0.7;
    const isTrending = (discovery.trendingScore || 0) > 0.6;
    const highWildness = context.wildness > 70;

    // Priority order for reasons
    if (isVeryRecent && isTrending) {
        return `🔥 Breaking: trending content from the last few hours`;
    } else if (matchingTopics.length > 1 && isRecent) {
        const topicNames = matchingTopics.slice(0, 2).map((t: any) => typeof t === 'string' ? t : t.name);
        return `Recent ${topicNames.join(' & ')} content matching your interests`;
    } else if (isTrending && matchingTopics.length > 0) {
        const topicName = typeof matchingTopics[0] === 'string' ? matchingTopics[0] : matchingTopics[0].name;
        return `📈 Trending ${topicName} content people are loving`;
    } else if (isPopular && isHighQuality && matchingTopics.length > 0) {
        const topicName = typeof matchingTopics[0] === 'string' ? matchingTopics[0] : matchingTopics[0].name;
        return `⭐ Popular high-quality ${topicName} content`;
    } else if (matchingTopics.length > 0 && isHighQuality) {
        const topicName = typeof matchingTopics[0] === 'string' ? matchingTopics[0] : matchingTopics[0].name;
        return `Quality ${topicName} content curated for you`;
    } else if (isRecent && isHighQuality) {
        return `Fresh, high-quality content to explore`;
    } else if (highWildness && matchingTopics.length === 0) {
        return `🎲 Serendipitous discovery - time to explore something new!`;
    } else if (matchingTopics.length > 0) {
        const topicNames = matchingTopics.slice(0, 2).map((t: any) => typeof t === 'string' ? t : t.name);
        return `Based on your interest in ${topicNames.join(' and ')}`;
    } else if (isHighQuality) {
        return `Curated high-quality content`;
    } else if (highWildness) {
        return `Wild discovery based on your exploration settings`;
    } else {
        return `Recommended content to discover`;
    }
}

/**
 * Calculate personalized topic affinity score based on user's interaction history
 */
export function calculateTopicAffinity(
    contentTopics: string[],
    likedTopics: Record<string, number>,
    dislikedTopics: Record<string, number>
): number {
    if (contentTopics.length === 0) return 0.5;

    let positiveScore = 0;
    let negativeScore = 0;
    let totalWeight = 0;

    contentTopics.forEach(topic => {
        const likeWeight = likedTopics[topic] || 0;
        const dislikeWeight = dislikedTopics[topic] || 0;

        positiveScore += likeWeight;
        negativeScore += dislikeWeight;
        totalWeight += likeWeight + dislikeWeight;
    });

    if (totalWeight === 0) return 0.5; // No history for these topics

    // Normalize to 0-1 range with bias toward positive interactions
    const netScore = (positiveScore - negativeScore * 0.5) / totalWeight;
    return Math.max(0, Math.min(1, 0.5 + netScore * 0.5));
}

/**
 * Calculate domain affinity based on user's historical interactions with domain
 */
export function calculateDomainAffinity(
    domain: string,
    likedDomains: Record<string, number>
): number {
    const domainInteractions = likedDomains[domain] || 0;

    if (domainInteractions === 0) return 0.5; // Neutral for unknown domains

    // Boost domains user has liked before, with diminishing returns
    return Math.min(1, 0.5 + Math.log(domainInteractions + 1) * 0.2);
}

/**
 * Calculate content similarity score between two sets of topics
 */
export function calculateContentSimilarity(
    topics1: string[],
    topics2: string[]
): number {
    if (topics1.length === 0 || topics2.length === 0) return 0;

    const set1 = new Set(topics1);
    const set2 = new Set(topics2);

    // Jaccard similarity: intersection / union
    const intersection = [...set1].filter(t => set2.has(t)).length;
    const union = new Set([...set1, ...set2]).size;

    return union > 0 ? intersection / union : 0;
}

/**
 * Enhanced personalization score combining multiple signals
 */
export function calculatePersonalizationScore(
    contentTopics: string[],
    contentDomain: string,
    userInteractionHistory: {
        likedTopics: Record<string, number>;
        dislikedTopics: Record<string, number>;
        likedDomains: Record<string, number>;
    },
    domainReputation: number
): number {
    // Topic affinity (most important)
    const topicScore = calculateTopicAffinity(
        contentTopics,
        userInteractionHistory.likedTopics,
        userInteractionHistory.dislikedTopics
    );

    // Domain affinity
    const domainAffinityScore = calculateDomainAffinity(
        contentDomain,
        userInteractionHistory.likedDomains
    );

    // Domain reputation (quality signal)
    const reputationWeight = 0.3;
    const affinityWeight = 0.7;

    // Combine scores: topic affinity is most important, domain signals support
    const personalizedScore =
        topicScore * 0.6 +
        domainAffinityScore * 0.2 +
        domainReputation * 0.2;

    return Math.max(0, Math.min(1, personalizedScore));
}

/**
 * Calculate trending score with time window filtering
 * Only considers engagement within the specified time window
 */
export function calculateWindowedTrendingScore(
    recentMetrics: ContentMetrics,
    ageHours: number,
    windowHours: number
): number {
    // Only calculate if content age is within window
    if (ageHours > windowHours) {
        return 0;
    }

    // Weight more heavily for very recent content
    const recencyMultiplier = 1 + (1 - ageHours / windowHours);

    const totalEngagement =
        recentMetrics.likes_count * 3 +
        recentMetrics.saves_count * 5 +
        recentMetrics.shares_count * 4 +
        recentMetrics.views_count * 1 -
        recentMetrics.skip_count * 2;

    const totalInteractions = Math.max(1,
        recentMetrics.views_count +
        recentMetrics.likes_count +
        recentMetrics.saves_count +
        recentMetrics.skip_count
    );

    const engagementRate = Math.max(0, totalEngagement / totalInteractions);
    const velocity = totalInteractions / Math.max(0.1, ageHours);

    return Math.min(1.0, (engagementRate * velocity * recencyMultiplier) / 5);
}

/**
 * H2.3: Advanced Personalization Functions
 */

/**
 * Calculate time-of-day preference score
 * Users may prefer different content types at different times of day
 */
export function calculateTimeOfDayScore(
    userHistory: Array<{ hour: number; topics: string[]; engagement: 'positive' | 'negative' }>,
    contentTopics: string[],
    currentHour: number
): number {
    // Filter history for similar time of day (±2 hours)
    const relevantHistory = userHistory.filter(item => {
        const hourDiff = Math.abs(item.hour - currentHour);
        return hourDiff <= 2 || hourDiff >= 22; // Account for wrap-around
    });

    if (relevantHistory.length === 0) {
        return 0.5; // Neutral if no history
    }

    // Calculate topic match score for this time
    let positiveMatches = 0;
    let negativeMatches = 0;

    relevantHistory.forEach(item => {
        const hasTopicMatch = item.topics.some(t => contentTopics.includes(t));
        if (hasTopicMatch) {
            if (item.engagement === 'positive') {
                positiveMatches++;
            } else {
                negativeMatches++;
            }
        }
    });

    const totalMatches = positiveMatches + negativeMatches;
    if (totalMatches === 0) {
        return 0.5;
    }

    // Return score based on positive/negative ratio
    return 0.3 + (positiveMatches / totalMatches) * 0.7;
}

/**
 * Calculate content diversity bonus
 * Rewards showing content from topics/domains the user hasn't seen recently
 */
export function calculateDiversityBonus(
    recentlySeenTopics: Record<string, number>, // topic -> count
    recentlySeenDomains: Record<string, number>, // domain -> count
    contentTopics: string[],
    contentDomain: string,
    totalRecentContent: number
): number {
    if (totalRecentContent === 0) {
        return 0.5; // Neutral for new users
    }

    // Calculate topic diversity
    const unseenTopics = contentTopics.filter(t => !recentlySeenTopics[t]);
    const topicDiversityRatio = unseenTopics.length / Math.max(1, contentTopics.length);

    // Calculate domain diversity
    const domainSeenCount = recentlySeenDomains[contentDomain] || 0;
    const domainDiversityScore = 1 - Math.min(1, domainSeenCount / (totalRecentContent * 0.2));

    // Combine scores
    return (topicDiversityRatio * 0.6 + domainDiversityScore * 0.4);
}

/**
 * Calculate user cluster similarity score (collaborative filtering)
 * Users with similar preferences get similar recommendations
 */
export function calculateClusterSimilarity(
    userClusterTopics: Record<string, number>, // topic -> popularity in cluster
    contentTopics: string[]
): number {
    if (Object.keys(userClusterTopics).length === 0 || contentTopics.length === 0) {
        return 0.5;
    }

    let totalScore = 0;
    let maxPossibleScore = 0;

    contentTopics.forEach(topic => {
        const clusterPopularity = userClusterTopics[topic] || 0;
        totalScore += clusterPopularity;
        maxPossibleScore += 1; // Max popularity is 1
    });

    return maxPossibleScore > 0
        ? totalScore / maxPossibleScore
        : 0.5;
}

/**
 * Calculate adaptive wildness recommendation
 * Suggests optimal wildness based on user's engagement patterns
 */
export function calculateAdaptiveWildness(
    currentWildness: number,
    recentEngagement: {
        highSimilarityLikeRate: number; // Like rate for high-similarity content
        lowSimilarityLikeRate: number; // Like rate for diverse content
        skipRate: number;
        totalInteractions: number;
    }
): { suggestedWildness: number; reason: string } {
    if (recentEngagement.totalInteractions < 10) {
        return {
            suggestedWildness: currentWildness,
            reason: 'Not enough interaction history'
        };
    }

    // If user likes diverse content more, suggest higher wildness
    if (recentEngagement.lowSimilarityLikeRate > recentEngagement.highSimilarityLikeRate + 0.2) {
        return {
            suggestedWildness: Math.min(100, currentWildness + 15),
            reason: 'You seem to enjoy diverse content - try increasing wildness!'
        };
    }

    // If user likes similar content more, suggest lower wildness
    if (recentEngagement.highSimilarityLikeRate > recentEngagement.lowSimilarityLikeRate + 0.2) {
        return {
            suggestedWildness: Math.max(0, currentWildness - 15),
            reason: 'You prefer content close to your interests - try lower wildness'
        };
    }

    // High skip rate = need different wildness
    if (recentEngagement.skipRate > 0.6) {
        if (currentWildness < 50) {
            return {
                suggestedWildness: currentWildness + 20,
                reason: 'Skipping a lot? Try exploring more diverse content'
            };
        } else {
            return {
                suggestedWildness: currentWildness - 20,
                reason: 'Skipping a lot? Try content closer to your interests'
            };
        }
    }

    return {
        suggestedWildness: currentWildness,
        reason: 'Your current wildness setting seems optimal'
    };
}

/**
 * Enhanced personalization score with advanced features
 * H2.3: Combines multiple personalization signals
 */
export function calculateEnhancedPersonalization(
    contentTopics: string[],
    contentDomain: string,
    userProfile: {
        interactionHistory: {
            likedTopics: Record<string, number>;
            dislikedTopics: Record<string, number>;
            likedDomains: Record<string, number>;
        };
        recentActivity: {
            seenTopics: Record<string, number>;
            seenDomains: Record<string, number>;
            totalRecent: number;
        };
        timePreferences?: Array<{ hour: number; topics: string[]; engagement: 'positive' | 'negative' }>;
        clusterTopics?: Record<string, number>;
    },
    domainReputation: number,
    currentHour: number
): number {
    // Base personalization (from existing function)
    const basePersonalization = calculatePersonalizationScore(
        contentTopics,
        contentDomain,
        userProfile.interactionHistory,
        domainReputation
    );

    // Diversity bonus (prevent filter bubble)
    const diversityBonus = calculateDiversityBonus(
        userProfile.recentActivity.seenTopics,
        userProfile.recentActivity.seenDomains,
        contentTopics,
        contentDomain,
        userProfile.recentActivity.totalRecent
    );

    // Time-of-day preferences
    const timeOfDayScore = userProfile.timePreferences
        ? calculateTimeOfDayScore(userProfile.timePreferences, contentTopics, currentHour)
        : 0.5;

    // Collaborative filtering via user clusters
    const clusterScore = userProfile.clusterTopics
        ? calculateClusterSimilarity(userProfile.clusterTopics, contentTopics)
        : 0.5;

    // Weighted combination
    const enhancedScore =
        basePersonalization * 0.45 +
        diversityBonus * 0.25 +
        timeOfDayScore * 0.15 +
        clusterScore * 0.15;

    return Math.max(0, Math.min(1, enhancedScore));
}

/**
 * Calculate engagement prediction score
 * Predicts likelihood user will engage positively with content
 */
export function predictEngagement(
    contentFeatures: {
        topics: string[];
        domain: string;
        quality: number;
        readingTime: number;
        ageHours: number;
    },
    userFeatures: {
        avgSessionLength: number; // in minutes
        preferredReadingTime: number; // in minutes
        preferredTopics: string[];
        avgQualityPreference: number;
        timeOfDay: number;
    }
): number {
    // Topic match
    const topicMatches = contentFeatures.topics.filter(t =>
        userFeatures.preferredTopics.includes(t)
    ).length;
    const topicScore = topicMatches / Math.max(1, contentFeatures.topics.length);

    // Reading time match
    const readingTimeDiff = Math.abs(contentFeatures.readingTime - userFeatures.preferredReadingTime);
    const readingTimeScore = Math.max(0, 1 - readingTimeDiff / 30); // 30 min max diff

    // Quality match
    const qualityDiff = Math.abs(contentFeatures.quality - userFeatures.avgQualityPreference);
    const qualityScore = 1 - qualityDiff;

    // Freshness preference (some users prefer new content, others don't care)
    const freshnessScore = contentFeatures.ageHours < 24 ? 1 : 0.8;

    // Combine predictions
    const engagementPrediction =
        topicScore * 0.35 +
        readingTimeScore * 0.20 +
        qualityScore * 0.25 +
        freshnessScore * 0.20;

    return Math.max(0, Math.min(1, engagementPrediction));
}