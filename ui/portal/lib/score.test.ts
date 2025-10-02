import {
    calculateScore,
    explorationBoost,
    freshness,
    getAgeDays,
    isTrending,
    similarity
} from '../lib/score';

describe('Score Functions', () => {
    describe('freshness', () => {
        it('should return 1 for age 0 (today)', () => {
            expect(freshness(0)).toBe(1);
        });

        it('should return 0.5 for 14-day half-life', () => {
            const result = freshness(14);
            expect(result).toBeCloseTo(0.5, 2);
        });

        it('should return lower scores for older content', () => {
            expect(freshness(28)).toBeLessThan(freshness(14));
            expect(freshness(14)).toBeLessThan(freshness(7));
        });

        it('should never return negative values', () => {
            expect(freshness(365)).toBeGreaterThan(0);
        });
    });

    describe('similarity', () => {
        it('should return 0.5 for no topic overlap', () => {
            const userTopics = ['tech', 'design'];
            const itemTopics = ['music', 'art'];
            expect(similarity(userTopics, itemTopics)).toBe(0.5);
        });

        it('should return higher scores for topic overlap', () => {
            const userTopics = ['tech', 'design'];
            const itemTopics = ['tech', 'art'];
            const result = similarity(userTopics, itemTopics);
            expect(result).toBeGreaterThan(0.5);
        });

        it('should cap similarity at 1.0', () => {
            const userTopics = ['tech', 'design', 'art'];
            const itemTopics = ['tech', 'design', 'art', 'music'];
            const result = similarity(userTopics, itemTopics);
            expect(result).toBeLessThanOrEqual(1.0);
        });

        it('should handle empty arrays', () => {
            expect(similarity([], [])).toBe(0.5);
            expect(similarity(['tech'], [])).toBe(0.5);
            expect(similarity([], ['tech'])).toBe(0.5);
        });
    });

    describe('explorationBoost', () => {
        it('should return base similarity for low wildness', () => {
            // Mock Math.random to return 0.9 (high value, won't trigger boost)
            const originalRandom = Math.random;
            Math.random = jest.fn(() => 0.9);

            const result = explorationBoost(0, 0.7);
            expect(result).toBe(0.7);

            Math.random = originalRandom;
        });

        it('should potentially boost exploration for high wildness', () => {
            // Mock Math.random to return 0.1 (low value, will trigger boost)
            const originalRandom = Math.random;
            Math.random = jest.fn()
                .mockReturnValueOnce(0.1) // First call for boost check
                .mockReturnValueOnce(0.5); // Second call for random boost value

            const result = explorationBoost(100, 0.3);
            expect(typeof result).toBe('number');
            expect(result).toBeGreaterThanOrEqual(0.2);
            expect(result).toBeLessThanOrEqual(1.0);

            Math.random = originalRandom;
        });
    });

    describe('getAgeDays', () => {
        it('should return 0 for today', () => {
            const today = new Date().toISOString();
            const age = getAgeDays(today);
            expect(age).toBeCloseTo(0, 1);
        });

        it('should return positive values for past dates', () => {
            const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
            const age = getAgeDays(yesterday);
            expect(age).toBeCloseTo(1, 1);
        });

        it('should return larger values for older dates', () => {
            const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
            const age = getAgeDays(oneWeekAgo);
            expect(age).toBeCloseTo(7, 1);
        });
    });

    describe('calculateScore', () => {
        it('should multiply quality, freshness, and similarity', () => {
            const quality = 0.8;
            const freshnessScore = 0.9;
            const similarityScore = 0.7;

            const result = calculateScore(quality, freshnessScore, similarityScore);
            expect(result).toBeCloseTo(0.8 * 0.9 * 0.7, 3);
        });

        it('should return 0 if any factor is 0', () => {
            expect(calculateScore(0, 0.9, 0.7)).toBe(0);
            expect(calculateScore(0.8, 0, 0.7)).toBe(0);
            expect(calculateScore(0.8, 0.9, 0)).toBe(0);
        });

        it('should return 1 if all factors are 1', () => {
            expect(calculateScore(1, 1, 1)).toBe(1);
        });
    });

    describe('isTrending', () => {
        it('should return true for high quality recent content', () => {
            const highQuality = 0.9;
            const recentAge = 1; // 1 day old
            expect(isTrending(highQuality, recentAge)).toBe(true);
        });

        it('should return false for low quality content', () => {
            const lowQuality = 0.3;
            const recentAge = 1;
            expect(isTrending(lowQuality, recentAge)).toBe(false);
        });

        it('should return false for old content even if high quality', () => {
            const highQuality = 0.9;
            const oldAge = 60; // 60 days old
            expect(isTrending(highQuality, oldAge)).toBe(false);
        });

        it('should handle edge cases', () => {
            expect(isTrending(0, 0)).toBe(false);
            expect(isTrending(1, 0)).toBe(true);
        });
    });
});