/**
 * Domain Reputation Manager
 * H2.2: Comprehensive domain reputation scoring system
 * 
 * Calculates and maintains domain reputation scores based on:
 * - Content quality from the domain
 * - User engagement metrics
 * - Moderation actions
 * - Time-based reputation decay
 */

import { supabase } from './supabase';

export interface DomainReputationMetrics {
    domain: string;
    score: number;
    trust_score: number;
    approved_count: number;
    rejected_count: number;
    flagged_count: number;
    avg_quality_score: number;
    avg_engagement_rate: number;
    total_content: number;
    last_updated: string;
    is_blacklisted: boolean;
}

export interface DomainQualityStats {
    totalContent: number;
    avgQuality: number;
    avgEngagement: number;
    totalViews: number;
    totalLikes: number;
    totalSaves: number;
    totalShares: number;
    totalSkips: number;
}

/**
 * Calculate trust score based on moderation history and content performance
 * Trust score ranges from 0.0 (untrusted) to 1.0 (highly trusted)
 */
function calculateTrustScore(
    approvedCount: number,
    rejectedCount: number,
    flaggedCount: number,
    avgQuality: number,
    avgEngagement: number
): number {
    // Moderation ratio: approved vs rejected
    const totalModerated = approvedCount + rejectedCount;
    const moderationScore = totalModerated > 0
        ? approvedCount / totalModerated
        : 0.5; // Neutral for unmoderated domains

    // Flag penalty
    const flagPenalty = Math.max(0, 1 - (flaggedCount * 0.1)); // -10% per flag

    // Quality and engagement boost
    const qualityBoost = avgQuality * 0.3;
    const engagementBoost = avgEngagement * 0.2;

    // Combine factors
    const trustScore =
        moderationScore * 0.4 +
        qualityBoost +
        engagementBoost +
        flagPenalty * 0.1;

    return Math.max(0, Math.min(1, trustScore));
}

/**
 * Calculate overall reputation score with time decay
 * Reputation score ranges from 0.0 (poor) to 1.0 (excellent)
 */
function calculateReputationScore(
    trustScore: number,
    avgQuality: number,
    avgEngagement: number,
    totalContent: number,
    daysSinceLastContent: number
): number {
    // Base score from trust and quality
    const baseScore = trustScore * 0.6 + avgQuality * 0.4;

    // Engagement multiplier
    const engagementMultiplier = 0.8 + (avgEngagement * 0.4);

    // Volume confidence: more content = more confident score
    const volumeConfidence = Math.min(1, Math.log10(totalContent + 1) / 2);

    // Activity decay: domains inactive for long time get penalized
    const activityDecay = daysSinceLastContent < 90
        ? 1.0
        : Math.exp(-(daysSinceLastContent - 90) / 180); // 6-month decay period

    // Final reputation score
    const reputationScore =
        baseScore *
        engagementMultiplier *
        volumeConfidence *
        activityDecay;

    return Math.max(0, Math.min(1, reputationScore));
}

/**
 * Get quality statistics for a domain
 */
export async function getDomainQualityStats(domain: string): Promise<DomainQualityStats | null> {
    try {
        const { data, error } = await supabase
            .from('content')
            .select(`
                id,
                quality_score,
                content_metrics(
                    engagement_rate,
                    views_count,
                    likes_count,
                    saves_count,
                    shares_count,
                    skip_count
                )
            `)
            .eq('domain', domain)
            .eq('is_active', true);

        if (error || !data || data.length === 0) {
            return null;
        }

        // Aggregate statistics
        let totalQuality = 0;
        let totalEngagement = 0;
        let totalViews = 0;
        let totalLikes = 0;
        let totalSaves = 0;
        let totalShares = 0;
        let totalSkips = 0;
        let countWithMetrics = 0;

        for (const content of data) {
            totalQuality += content.quality_score || 0;

            const metrics = Array.isArray(content.content_metrics)
                ? content.content_metrics[0]
                : content.content_metrics;

            if (metrics) {
                totalEngagement += metrics.engagement_rate || 0;
                totalViews += metrics.views_count || 0;
                totalLikes += metrics.likes_count || 0;
                totalSaves += metrics.saves_count || 0;
                totalShares += metrics.shares_count || 0;
                totalSkips += metrics.skip_count || 0;
                countWithMetrics++;
            }
        }

        const totalContent = data.length;

        return {
            totalContent,
            avgQuality: totalContent > 0 ? totalQuality / totalContent : 0.5,
            avgEngagement: countWithMetrics > 0 ? totalEngagement / countWithMetrics : 0,
            totalViews,
            totalLikes,
            totalSaves,
            totalShares,
            totalSkips
        };

    } catch (error) {
        console.error(`Error getting quality stats for ${domain}:`, error);
        return null;
    }
}

/**
 * Get moderation history for a domain
 */
export async function getDomainModerationHistory(domain: string): Promise<{
    approved: number;
    rejected: number;
    flagged: number;
}> {
    try {
        // Get content IDs from this domain
        const { data: contentData } = await supabase
            .from('content')
            .select('id')
            .eq('domain', domain);

        if (!contentData || contentData.length === 0) {
            return { approved: 0, rejected: 0, flagged: 0 };
        }

        const contentIds = contentData.map(c => c.id);

        // Count moderation actions
        const [approvedData, rejectedData, flaggedData] = await Promise.all([
            supabase
                .from('moderation_queue')
                .select('id', { count: 'exact', head: true })
                .in('content_id', contentIds)
                .eq('status', 'approved'),
            supabase
                .from('moderation_queue')
                .select('id', { count: 'exact', head: true })
                .in('content_id', contentIds)
                .eq('status', 'rejected'),
            supabase
                .from('moderation_queue')
                .select('id', { count: 'exact', head: true })
                .in('content_id', contentIds)
                .eq('is_flagged', true)
        ]);

        return {
            approved: approvedData.count || 0,
            rejected: rejectedData.count || 0,
            flagged: flaggedData.count || 0
        };

    } catch (error) {
        console.error(`Error getting moderation history for ${domain}:`, error);
        return { approved: 0, rejected: 0, flagged: 0 };
    }
}

/**
 * Calculate and update reputation for a single domain
 */
export async function updateDomainReputation(domain: string): Promise<DomainReputationMetrics | null> {
    try {
        console.log(`🔍 Updating reputation for domain: ${domain}`);

        // Get quality stats
        const qualityStats = await getDomainQualityStats(domain);
        if (!qualityStats) {
            console.log(`⚠️ No content found for domain: ${domain}`);
            return null;
        }

        // Get moderation history
        const moderationHistory = await getDomainModerationHistory(domain);

        // Get days since last content
        const { data: latestContent } = await supabase
            .from('content')
            .select('created_at')
            .eq('domain', domain)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        const daysSinceLastContent = latestContent
            ? (Date.now() - new Date(latestContent.created_at).getTime()) / (1000 * 60 * 60 * 24)
            : 365; // Default to 1 year if no content

        // Calculate scores
        const trustScore = calculateTrustScore(
            moderationHistory.approved,
            moderationHistory.rejected,
            moderationHistory.flagged,
            qualityStats.avgQuality,
            qualityStats.avgEngagement
        );

        const reputationScore = calculateReputationScore(
            trustScore,
            qualityStats.avgQuality,
            qualityStats.avgEngagement,
            qualityStats.totalContent,
            daysSinceLastContent
        );

        // Determine if domain should be blacklisted
        const shouldBlacklist =
            moderationHistory.flagged >= 5 || // Too many flags
            (moderationHistory.rejected / Math.max(1, moderationHistory.approved + moderationHistory.rejected)) > 0.8 || // High rejection rate
            reputationScore < 0.2; // Very low reputation

        // Upsert domain reputation
        const { data: reputationData, error: upsertError } = await supabase
            .from('domain_reputation')
            .upsert({
                domain,
                score: reputationScore,
                trust_score: trustScore,
                approved_count: moderationHistory.approved,
                rejected_count: moderationHistory.rejected,
                flagged_count: moderationHistory.flagged,
                avg_quality_score: qualityStats.avgQuality,
                avg_engagement_rate: qualityStats.avgEngagement,
                total_content: qualityStats.totalContent,
                is_blacklisted: shouldBlacklist,
                last_updated: new Date().toISOString()
            }, {
                onConflict: 'domain'
            })
            .select()
            .single();

        if (upsertError) {
            console.error(`Error upserting reputation for ${domain}:`, upsertError);
            return null;
        }

        console.log(`✅ Updated reputation for ${domain}: score=${reputationScore.toFixed(3)}, trust=${trustScore.toFixed(3)}`);

        return reputationData as DomainReputationMetrics;

    } catch (error) {
        console.error(`Error updating domain reputation for ${domain}:`, error);
        return null;
    }
}

/**
 * Update reputation for all domains with recent activity
 */
export async function updateAllDomainReputations(daysThreshold: number = 30): Promise<{
    processed: number;
    updated: number;
    errors: number;
}> {
    console.log('🚀 Starting bulk domain reputation update...');

    try {
        // Get domains with recent activity
        const thresholdDate = new Date(Date.now() - daysThreshold * 24 * 60 * 60 * 1000);

        const { data: domainsData, error: domainsError } = await supabase
            .from('content')
            .select('domain')
            .eq('is_active', true)
            .gte('created_at', thresholdDate.toISOString());

        if (domainsError || !domainsData) {
            console.error('Error fetching domains:', domainsError);
            return { processed: 0, updated: 0, errors: 0 };
        }

        // Get unique domains
        const uniqueDomains = [...new Set(domainsData.map(d => d.domain))];
        console.log(`📊 Found ${uniqueDomains.length} unique domains with recent activity`);

        let updated = 0;
        let errors = 0;

        // Update reputation for each domain
        for (const domain of uniqueDomains) {
            const result = await updateDomainReputation(domain);
            if (result) {
                updated++;
            } else {
                errors++;
            }

            // Small delay to avoid overwhelming the database
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        console.log(`✅ Domain reputation update complete: ${updated} updated, ${errors} errors`);

        return {
            processed: uniqueDomains.length,
            updated,
            errors
        };

    } catch (error) {
        console.error('Error in bulk domain reputation update:', error);
        return { processed: 0, updated: 0, errors: 0 };
    }
}

/**
 * Get reputation metrics for a domain
 */
export async function getDomainReputation(domain: string): Promise<DomainReputationMetrics | null> {
    try {
        const { data, error } = await supabase
            .from('domain_reputation')
            .select('*')
            .eq('domain', domain)
            .single();

        if (error || !data) {
            return null;
        }

        return data as DomainReputationMetrics;

    } catch (error) {
        console.error(`Error fetching reputation for ${domain}:`, error);
        return null;
    }
}

/**
 * Get top-rated domains
 */
export async function getTopDomains(limit: number = 20): Promise<DomainReputationMetrics[]> {
    try {
        const { data, error } = await supabase
            .from('domain_reputation')
            .select('*')
            .eq('is_blacklisted', false)
            .order('score', { ascending: false })
            .limit(limit);

        if (error || !data) {
            return [];
        }

        return data as DomainReputationMetrics[];

    } catch (error) {
        console.error('Error fetching top domains:', error);
        return [];
    }
}

/**
 * Get blacklisted domains
 */
export async function getBlacklistedDomains(): Promise<DomainReputationMetrics[]> {
    try {
        const { data, error } = await supabase
            .from('domain_reputation')
            .select('*')
            .eq('is_blacklisted', true)
            .order('flagged_count', { ascending: false });

        if (error || !data) {
            return [];
        }

        return data as DomainReputationMetrics[];

    } catch (error) {
        console.error('Error fetching blacklisted domains:', error);
        return [];
    }
}

/**
 * Manually blacklist a domain
 */
export async function blacklistDomain(domain: string, reason: string): Promise<boolean> {
    try {
        const { error } = await supabase
            .from('domain_reputation')
            .upsert({
                domain,
                is_blacklisted: true,
                score: 0,
                last_updated: new Date().toISOString()
            }, {
                onConflict: 'domain'
            });

        if (error) {
            console.error(`Error blacklisting domain ${domain}:`, error);
            return false;
        }

        console.log(`🚫 Domain blacklisted: ${domain} (reason: ${reason})`);
        return true;

    } catch (error) {
        console.error(`Error in blacklistDomain:`, error);
        return false;
    }
}

/**
 * Remove domain from blacklist
 */
export async function unblacklistDomain(domain: string): Promise<boolean> {
    try {
        // Recalculate reputation when unblacklisting
        const result = await updateDomainReputation(domain);

        if (!result) {
            return false;
        }

        // Force unblacklist (even if score is low)
        const { error } = await supabase
            .from('domain_reputation')
            .update({ is_blacklisted: false })
            .eq('domain', domain);

        if (error) {
            console.error(`Error unblacklisting domain ${domain}:`, error);
            return false;
        }

        console.log(`✅ Domain unblacklisted: ${domain}`);
        return true;

    } catch (error) {
        console.error(`Error in unblacklistDomain:`, error);
        return false;
    }
}
