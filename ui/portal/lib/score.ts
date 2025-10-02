/**
 * Scoring functions for discovery recommendation
 */

/**
 * Calculate freshness score based on age (14-day half-life)
 */
export function freshness(ageDays: number): number {
    return Math.exp(-Math.log(2) * ageDays / 14);
}

/**
 * Calculate similarity between user topics and item topics
 */
export function similarity(userTopics: string[], itemTopics: string[]): number {
    const overlap = itemTopics.filter(t => userTopics.includes(t)).length;
    // Base similarity of 0.5, with bonus for topic overlap (soft-capped at 3)
    return 0.5 + 0.5 * Math.min(1, overlap / 3);
}

/**
 * Calculate exploration factor based on wildness setting
 * Higher wildness = more chance to show low-similarity content
 */
export function explorationBoost(wildness: number, baseSimilarity: number): number {
    // wildness is 0-100, convert to 0-1
    const wildnessFactor = wildness / 100;

    // Add some randomness based on wildness
    // High wildness occasionally boosts low-similarity items significantly
    if (Math.random() < wildnessFactor * 0.4) {
        // 40% chance at max wildness to boost exploration
        return Math.random() * 0.8 + 0.2; // Random boost between 0.2-1.0
    }

    return baseSimilarity;
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
 * Calculate overall discovery score
 */
export function calculateScore(
    quality: number,
    freshnessScore: number,
    similarityScore: number
): number {
    return quality * freshnessScore * similarityScore;
}

/**
 * Check if a discovery is trending based on quality and freshness
 * High quality + recent content = trending
 */
export function isTrending(quality: number, ageDays: number): boolean {
    const freshnessScore = freshness(ageDays);
    const trendScore = quality * freshnessScore;
    return trendScore > 0.6; // High threshold for trending
}