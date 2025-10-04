import { Discovery, Topic, User } from '../types';
import { ContentMetrics } from './scoring';
import { supabase } from './supabase';

/**
 * Enhanced discovery repository with comprehensive database integration
 * Uses Supabase for persistent storage with full schema support
 */

export interface EnhancedDiscovery extends Discovery {
    baseScore?: number;
    popularityScore?: number;
    isActive?: boolean;
    contentTopics?: Array<{ name: string, confidence: number }>;
    metrics?: ContentMetrics;
    trendingScore?: number;
}

export class DiscoveryRepository {
    /**
     * Transform raw database content into EnhancedDiscovery objects
     * OPTIMIZED: Streamlined transformation with fewer conditionals
     */
    private transformContentData(data: any[]): EnhancedDiscovery[] {
        return data.map(item => {
            // Pre-calculate optional values
            const contentTopics = item.content_topics?.map((ct: any) => ({
                name: ct.topics?.name || ct.name,
                confidence: ct.confidence_score || 0.5
            }));

            const metrics = item.content_metrics?.[0];

            return {
                id: item.id,
                url: item.url,
                title: item.title,
                description: item.description || '',
                image: item.image_url || '',
                imageStoragePath: item.image_storage_path,
                faviconUrl: item.favicon_url,
                domain: item.domain,
                topics: item.topics || [],
                readingTime: item.reading_time_minutes || item.reading_time || 5,
                createdAt: item.created_at,
                quality: item.quality_score || 0.5,
                baseScore: item.base_score || 0.5,
                popularityScore: item.popularity_score || 0.5,
                isActive: item.is_active !== false,
                allowsFraming: item.allows_framing,
                contentTopics: contentTopics || [],
                metrics: metrics ? {
                    views_count: metrics.views_count || 0,
                    likes_count: metrics.likes_count || 0,
                    saves_count: metrics.saves_count || 0,
                    shares_count: metrics.shares_count || 0,
                    skip_count: metrics.skip_count || 0,
                    engagement_rate: metrics.engagement_rate || 0
                } : undefined
            };
        });
    }

    /**
     * Get all active discoveries with enhanced data
     */
    async getAllDiscoveries(): Promise<EnhancedDiscovery[]> {
        const { data, error } = await supabase
            .from('content')
            .select(`
                id,
                url,
                title,
                description,
                image_url,
                image_storage_path,
                favicon_url,
                domain,
                topics,
                reading_time_minutes,
                created_at,
                quality_score,
                freshness_score,
                base_score,
                popularity_score,
                is_active,
                allows_framing,
                content_topics!inner(
                    topics!inner(name),
                    confidence_score
                ),
                content_metrics(
                    views_count,
                    likes_count,
                    saves_count,
                    shares_count,
                    skip_count,
                    engagement_rate
                )
            `)
            .eq('is_active', true)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching discoveries:', error);
            return [];
        }

        return this.transformContentData(data || []);
    }

    /**
     * Get discoveries excluding specified IDs with enhanced data
     * OPTIMIZED: Reduced joins and lighter queries for faster response
     */
    async getDiscoveriesExcluding(excludeIds: string[]): Promise<EnhancedDiscovery[]> {
        // Simplified randomization - just use a basic rotation to reduce database load
        const useCreatedAtOrder = Math.floor(Date.now() / (1000 * 60 * 60)) % 2 === 0; // Changes every hour

        // OPTIMIZATION: Fetch only essential fields, reduce join complexity
        let query = supabase
            .from('content')
            .select(`
                id,
                url,
                title,
                description,
                image_url,
                image_storage_path,
                favicon_url,
                domain,
                topics,
                reading_time_minutes,
                created_at,
                quality_score,
                freshness_score,
                base_score,
                popularity_score,
                is_active,
                allows_framing
            `)
            .eq('is_active', true)
            .limit(200); // OPTIMIZATION: Limit result set

        if (excludeIds.length > 0 && excludeIds.length < 50) { // OPTIMIZATION: Skip if too many excludes
            query = query.not('id', 'in', `(${excludeIds.map(id => `"${id}"`).join(',')})`);
        }

        // Apply simplified ordering to reduce database load
        if (useCreatedAtOrder) {
            query = query.order('created_at', { ascending: false });
        } else {
            query = query.order('quality_score', { ascending: false });
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error fetching discoveries excluding IDs:', error);
            return [];
        }

        return this.transformContentData(data || []);
    }

    /**
     * Get discovery by ID
     */
    async getDiscoveryById(id: string): Promise<Discovery | null> {
        const { data, error } = await supabase
            .from('content')
            .select(`
                id,
                url,
                title,
                description,
                image_url,
                domain,
                topics,
                reading_time,
                created_at,
                quality_score,
                allows_framing
            `)
            .eq('id', id)
            .single();

        if (error) {
            console.error('Error fetching discovery by ID:', error);
            return null;
        }

        if (!data) return null;

        return {
            id: data.id,
            url: data.url,
            title: data.title,
            description: data.description || '',
            image: data.image_url || '',
            domain: data.domain,
            topics: data.topics || [],
            readingTime: data.reading_time || 5,
            createdAt: data.created_at,
            quality: data.quality_score || 0.5,
            allowsFraming: data.allows_framing
        };
    }

    /**
     * Get user preferences from the database
     */
    async getUserById(clerkUserId: string): Promise<User | null> {
        try {
            // Try to get user from database first using clerk_user_id
            const { data: userData, error: userError } = await supabase
                .from('users')
                .select(`
                    id,
                    clerk_user_id,
                    user_preferences(
                        wildness,
                        preferred_topics,
                        blocked_domains
                    ),
                    user_stats(
                        like_rate,
                        save_rate,
                        skip_rate,
                        total_discoveries,
                        most_active_hour
                    )
                `)
                .eq('clerk_user_id', clerkUserId)
                .single();

            if (userError || !userData) {
                // Return default user for new users (will be created by user service)
                return {
                    id: clerkUserId, // Use clerk ID as fallback
                    preferredTopics: ['technology', 'science'], // Default starter topics
                    wildness: 35, // Moderate exploration for new users
                    engagementHistory: undefined
                };
            }

            const preferences = userData.user_preferences?.[0];
            const stats = userData.user_stats?.[0];

            return {
                id: userData.id, // Database UUID
                clerkUserId: userData.clerk_user_id, // Clerk user ID
                preferredTopics: preferences?.preferred_topics || ['technology', 'science'],
                wildness: preferences?.wildness || 35,
                blockedDomains: preferences?.blocked_domains || [],
                engagementHistory: stats ? {
                    likeRate: stats.like_rate || 0,
                    saveRate: stats.save_rate || 0,
                    skipRate: stats.skip_rate || 0
                } : undefined,
                totalDiscoveries: stats?.total_discoveries || 0,
                mostActiveHour: stats?.most_active_hour
            };

        } catch (error) {
            console.error('Error fetching user:', error);
            // Return default user on error
            return {
                id: clerkUserId,
                preferredTopics: ['technology', 'science'],
                wildness: 35
            };
        }
    }

    /**
     * Get all topics
     */
    async getAllTopics(): Promise<Topic[]> {
        const { data, error } = await supabase
            .from('topics')
            .select('id, name')
            .order('name');

        if (error) {
            console.error('Error fetching topics:', error);
            return [];
        }

        return data || [];
    }

    /**
     * Get trending content for specified time window
     */
    async getTrendingContent(timeWindow: 'hour' | 'day' | 'week' = 'day', limit: number = 10): Promise<EnhancedDiscovery[]> {
        const { data, error } = await supabase
            .from('trending_content')
            .select(`
                content!inner(
                    id,
                    url,
                    title,
                    description,
                    image_url,
                    domain,
                    topics,
                    reading_time_minutes,
                    created_at,
                    quality_score,
                    base_score,
                    popularity_score,
                    content_topics(
                        topics(name),
                        confidence_score
                    ),
                    content_metrics(
                        views_count,
                        likes_count,
                        saves_count,
                        shares_count,
                        skip_count,
                        engagement_rate
                    )
                ),
                trending_score
            `)
            .eq('time_window', timeWindow)
            .gte('calculated_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Last 24 hours
            .order('trending_score', { ascending: false })
            .limit(limit);

        if (error) {
            console.error('Error fetching trending content:', error);
            return [];
        }

        return data?.map(item => {
            const content = this.transformContentData([item.content])[0];
            return {
                ...content,
                trendingScore: item.trending_score
            };
        }) || [];
    }

    /**
     * Get global engagement statistics for relative scoring
     */
    async getGlobalEngagementStats(): Promise<{ averageEngagement: number; totalContent: number }> {
        const { data, error } = await supabase
            .from('content_metrics')
            .select('engagement_rate')
            .not('engagement_rate', 'is', null);

        if (error) {
            console.error('Error fetching global engagement stats:', error);
            return { averageEngagement: 0.3, totalContent: 0 };
        }

        if (!data || data.length === 0) {
            return { averageEngagement: 0.3, totalContent: 0 };
        }

        const totalEngagement = data.reduce((sum, item) => sum + (item.engagement_rate || 0), 0);
        const averageEngagement = totalEngagement / data.length;

        return {
            averageEngagement: Math.max(0.1, averageEngagement),
            totalContent: data.length
        };
    }

    /**
     * Record a discovery event for analytics
     */
    async recordDiscoveryEvent(
        userId: string,
        contentId: string,
        sessionId: string | null,
        algorithmVersion: string,
        wildness: number,
        scores: {
            baseScore: number;
            finalScore: number;
            rank: number;
        }
    ): Promise<void> {
        try {
            await supabase
                .from('discovery_events')
                .insert({
                    user_id: userId,
                    content_id: contentId,
                    session_id: sessionId,
                    algorithm_version: algorithmVersion,
                    wildness_setting: wildness,
                    base_score: scores.baseScore,
                    final_score: scores.finalScore,
                    rank_in_results: scores.rank
                });
        } catch (error) {
            console.error('Error recording discovery event:', error);
            // Non-critical, don't throw
        }
    }

    /**
     * Get discovery by URL - for content submission deduplication
     */
    async getDiscoveryByUrl(url: string): Promise<Discovery | null> {
        const { data, error } = await supabase
            .from('content')
            .select(`
                id,
                url,
                title,
                description,
                image_url,
                domain,
                topics,
                reading_time_minutes,
                created_at,
                quality_score,
                allows_framing
            `)
            .eq('url', url)
            .single();

        if (error || !data) {
            return null;
        }

        return {
            id: data.id,
            url: data.url,
            title: data.title,
            description: data.description || '',
            image: data.image_url || '',
            domain: data.domain,
            topics: data.topics || [],
            readingTime: data.reading_time_minutes || 5,
            createdAt: data.created_at,
            quality: data.quality_score || 0.5,
            allowsFraming: data.allows_framing
        };
    }

    /**
     * Create new discovery from submitted content
     */
    async createDiscovery(content: {
        url: string;
        title: string;
        description: string;
        domain: string;
        imageUrl?: string;
        imageStoragePath?: string;
        faviconUrl?: string;
        topics: string[];
        readTime: number;
        submittedAt: Date;
        allowsFraming?: boolean;
    }): Promise<Discovery> {
        const { data, error } = await supabase
            .from('content')
            .insert({
                url: content.url,
                title: content.title,
                description: content.description,
                domain: content.domain,
                image_url: content.imageUrl || null,
                image_storage_path: content.imageStoragePath || null,
                favicon_url: content.faviconUrl || null,
                topics: content.topics,
                reading_time_minutes: content.readTime,
                quality_score: 0.7, // Default quality for user-submitted content
                freshness_score: 1.0, // Fresh content
                base_score: 0.5,
                is_active: true,
                allows_framing: content.allowsFraming
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating discovery:', error);
            throw new Error('Failed to create discovery');
        }

        return {
            id: data.id,
            url: data.url,
            title: data.title,
            description: data.description || '',
            image: data.image_url || '',
            domain: data.domain,
            topics: data.topics || [],
            readingTime: data.reading_time_minutes || content.readTime,
            createdAt: data.created_at,
            quality: data.quality_score || 0.7
        };
    }

    /**
     * Get domain reputation score
     */
    async getDomainReputation(domain: string): Promise<number> {
        try {
            const { data, error } = await supabase
                .from('domain_reputation')
                .select('score, approved_count, rejected_count, flagged_count')
                .eq('domain', domain)
                .single();

            if (error || !data) {
                // No reputation data - return neutral score
                return 0.5;
            }

            return Math.max(0, Math.min(1, data.score));
        } catch (error) {
            console.error('Error fetching domain reputation:', error);
            return 0.5; // Default neutral score
        }
    }

    /**
     * OPTIMIZATION: Batch fetch domain reputations for multiple domains in single query
     */
    async getBatchDomainReputations(domains: string[]): Promise<Record<string, number>> {
        if (domains.length === 0) {
            return {};
        }

        try {
            const { data, error } = await supabase
                .from('domain_reputation')
                .select('domain, score')
                .in('domain', domains);

            if (error || !data) {
                // Return neutral scores for all domains
                return domains.reduce((acc, domain) => {
                    acc[domain] = 0.5;
                    return acc;
                }, {} as Record<string, number>);
            }

            // Build reputation map
            const reputations: Record<string, number> = {};

            // First, set all domains to neutral default
            domains.forEach(domain => {
                reputations[domain] = 0.5;
            });

            // Then update with actual scores
            data.forEach(item => {
                reputations[item.domain] = Math.max(0, Math.min(1, item.score));
            });

            return reputations;
        } catch (error) {
            console.error('Error batch fetching domain reputations:', error);
            // Return neutral scores for all domains
            return domains.reduce((acc, domain) => {
                acc[domain] = 0.5;
                return acc;
            }, {} as Record<string, number>);
        }
    }

    /**
     * Get user's interaction history for personalization
     */
    async getUserInteractionHistory(userId: string, limit: number = 100): Promise<{
        likedTopics: Record<string, number>;
        dislikedTopics: Record<string, number>;
        likedDomains: Record<string, number>;
        recentInteractionTypes: string[];
    }> {
        try {
            const { data, error } = await supabase
                .from('user_interactions')
                .select(`
                    interaction_type,
                    content!inner(
                        topics,
                        domain
                    )
                `)
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(limit);

            if (error || !data) {
                return {
                    likedTopics: {},
                    dislikedTopics: {},
                    likedDomains: {},
                    recentInteractionTypes: []
                };
            }

            const likedTopics: Record<string, number> = {};
            const dislikedTopics: Record<string, number> = {};
            const likedDomains: Record<string, number> = {};
            const recentInteractionTypes: string[] = [];

            data.forEach(interaction => {
                const content = interaction.content as any;
                const type = interaction.interaction_type;
                recentInteractionTypes.push(type);

                if (type === 'like' || type === 'save') {
                    // Positive interactions
                    content.topics?.forEach((topic: string) => {
                        likedTopics[topic] = (likedTopics[topic] || 0) + (type === 'save' ? 2 : 1);
                    });
                    if (content.domain) {
                        likedDomains[content.domain] = (likedDomains[content.domain] || 0) + 1;
                    }
                } else if (type === 'skip' || type === 'dislike') {
                    // Negative interactions
                    content.topics?.forEach((topic: string) => {
                        dislikedTopics[topic] = (dislikedTopics[topic] || 0) + 1;
                    });
                }
            });

            return { likedTopics, dislikedTopics, likedDomains, recentInteractionTypes };
        } catch (error) {
            console.error('Error fetching user interaction history:', error);
            return {
                likedTopics: {},
                dislikedTopics: {},
                likedDomains: {},
                recentInteractionTypes: []
            };
        }
    }

    /**
     * Find similar content based on a reference content ID
     */
    async findSimilarContent(contentId: string, limit: number = 10): Promise<EnhancedDiscovery[]> {
        try {
            // First, get the reference content
            const { data: refContent, error: refError } = await supabase
                .from('content')
                .select('topics, domain')
                .eq('id', contentId)
                .single();

            if (refError || !refContent) {
                return [];
            }

            // Find content with overlapping topics
            const { data, error } = await supabase
                .from('content')
                .select(`
                    id,
                    url,
                    title,
                    description,
                    image_url,
                    domain,
                    topics,
                    reading_time_minutes,
                    created_at,
                    quality_score,
                    base_score,
                    popularity_score,
                    is_active,
                    content_topics(
                        topics(name),
                        confidence_score
                    ),
                    content_metrics(
                        views_count,
                        likes_count,
                        saves_count,
                        shares_count,
                        skip_count,
                        engagement_rate
                    )
                `)
                .eq('is_active', true)
                .neq('id', contentId)
                .order('quality_score', { ascending: false })
                .limit(limit * 3); // Get more candidates for filtering

            if (error || !data) {
                return [];
            }

            // Calculate similarity scores and filter
            const refTopics = refContent.topics || [];
            const similarContent = data
                .map(item => {
                    const itemTopics = item.topics || [];
                    const overlap = itemTopics.filter((t: string) => refTopics.includes(t)).length;
                    const similarity = overlap / Math.max(refTopics.length, itemTopics.length);

                    return {
                        content: item,
                        similarity
                    };
                })
                .filter(item => item.similarity > 0) // At least one common topic
                .sort((a, b) => b.similarity - a.similarity)
                .slice(0, limit);

            return this.transformContentData(similarContent.map(item => item.content));
        } catch (error) {
            console.error('Error finding similar content:', error);
            return [];
        }
    }

    /**
     * Get submission statistics
     */
    async getSubmissionStats(): Promise<{
        totalSubmissions: number;
        recentSubmissions: number;
        topDomains: Array<{ domain: string; count: number }>;
        topTopics: Array<{ topic: string; count: number }>;
    }> {
        try {
            // Get total submissions
            const { count: totalSubmissions } = await supabase
                .from('content')
                .select('*', { count: 'exact', head: true });

            // Get recent submissions (last 7 days)
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

            const { count: recentSubmissions } = await supabase
                .from('content')
                .select('*', { count: 'exact', head: true })
                .gte('created_at', sevenDaysAgo.toISOString());

            // Get top domains
            const { data: domainsData } = await supabase
                .from('content')
                .select('domain')
                .limit(1000); // Limit for performance

            const domainCounts: Record<string, number> = {};
            domainsData?.forEach(item => {
                domainCounts[item.domain] = (domainCounts[item.domain] || 0) + 1;
            });

            const topDomains = Object.entries(domainCounts)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 10)
                .map(([domain, count]) => ({ domain, count }));

            // Get top topics (flatten topics arrays and count)
            const { data: topicsData } = await supabase
                .from('content')
                .select('topics')
                .limit(1000);

            const topicCounts: Record<string, number> = {};
            topicsData?.forEach(item => {
                item.topics?.forEach((topic: string) => {
                    topicCounts[topic] = (topicCounts[topic] || 0) + 1;
                });
            });

            const topTopics = Object.entries(topicCounts)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 10)
                .map(([topic, count]) => ({ topic, count }));

            return {
                totalSubmissions: totalSubmissions || 0,
                recentSubmissions: recentSubmissions || 0,
                topDomains,
                topTopics
            };
        } catch (error) {
            console.error('Error getting submission stats:', error);
            return {
                totalSubmissions: 0,
                recentSubmissions: 0,
                topDomains: [],
                topTopics: []
            };
        }
    }

    /**
     * Get content records by specific IDs
     */
    async getContentByIds(contentIds: string[]): Promise<Array<{ id: string; url: string }>> {
        try {
            const { data, error } = await supabase
                .from('content')
                .select('id, url')
                .in('id', contentIds);

            if (error) {
                console.error('Error fetching content by IDs:', error);
                return [];
            }

            return data || [];
        } catch (error) {
            console.error('Error in getContentByIds:', error);
            return [];
        }
    }

    /**
     * Get content records that need metadata enhancement
     */
    async getContentNeedingEnhancement(limit: number = 10): Promise<Array<{ id: string; url: string }>> {
        try {
            const { data, error } = await supabase
                .from('content')
                .select('id, url')
                .or('image_url.is.null,author.is.null,content_text.is.null,word_count.is.null')
                .order('created_at', { ascending: false })
                .limit(limit);

            if (error) {
                console.error('Error fetching content needing enhancement:', error);
                return [];
            }

            return data || [];
        } catch (error) {
            console.error('Error in getContentNeedingEnhancement:', error);
            return [];
        }
    }

    /**
     * Update content metadata
     */
    async updateContentMetadata(contentId: string, metadata: {
        title?: string;
        description?: string;
        imageUrl?: string;
        author?: string;
        publishedAt?: string;
        wordCount?: number;
        contentText?: string;
    }): Promise<void> {
        try {
            const updateData: any = {};

            if (metadata.title) updateData.title = metadata.title;
            if (metadata.description) updateData.description = metadata.description;
            if (metadata.imageUrl) updateData.image_url = metadata.imageUrl;
            if (metadata.author) updateData.author = metadata.author;
            if (metadata.publishedAt) updateData.published_at = metadata.publishedAt;
            if (metadata.wordCount) updateData.word_count = metadata.wordCount;
            if (metadata.contentText) updateData.content_text = metadata.contentText;

            if (Object.keys(updateData).length > 0) {
                const { error } = await supabase
                    .from('content')
                    .update(updateData)
                    .eq('id', contentId);

                if (error) {
                    console.error(`Error updating content ${contentId}:`, error);
                }
            }
        } catch (error) {
            console.error('Error in updateContentMetadata:', error);
        }
    }

    /**
     * Get enhancement statistics
     */
    async getEnhancementStats(): Promise<{
        total: number;
        needsEnhancement: number;
        hasImage: number;
        hasAuthor: number;
        hasContent: number;
        hasWordCount: number;
    }> {
        try {
            const { count: total } = await supabase
                .from('content')
                .select('*', { count: 'exact', head: true });

            const { count: needsEnhancement } = await supabase
                .from('content')
                .select('*', { count: 'exact', head: true })
                .or('image_url.is.null,author.is.null,content_text.is.null,word_count.is.null');

            const { count: hasImage } = await supabase
                .from('content')
                .select('*', { count: 'exact', head: true })
                .not('image_url', 'is', null);

            const { count: hasAuthor } = await supabase
                .from('content')
                .select('*', { count: 'exact', head: true })
                .not('author', 'is', null);

            const { count: hasContent } = await supabase
                .from('content')
                .select('*', { count: 'exact', head: true })
                .not('content_text', 'is', null);

            const { count: hasWordCount } = await supabase
                .from('content')
                .select('*', { count: 'exact', head: true })
                .not('word_count', 'is', null);

            return {
                total: total || 0,
                needsEnhancement: needsEnhancement || 0,
                hasImage: hasImage || 0,
                hasAuthor: hasAuthor || 0,
                hasContent: hasContent || 0,
                hasWordCount: hasWordCount || 0
            };
        } catch (error) {
            console.error('Error getting enhancement stats:', error);
            return {
                total: 0,
                needsEnhancement: 0,
                hasImage: 0,
                hasAuthor: 0,
                hasContent: 0,
                hasWordCount: 0
            };
        }
    }
}