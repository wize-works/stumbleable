import { supabase } from './supabase';

export interface ContentSafetyResult {
    isSafe: boolean;
    confidence: number;
    flags: string[];
    reason?: string;
}

export interface SpamDetectionResult {
    isSpam: boolean;
    confidence: number;
    reasons: string[];
}

export interface DomainReputation {
    domain: string;
    score: number; // 0-1, higher is better
    submissionCount: number;
    flaggedCount: number;
    lastUpdated: Date;
}

export interface UserTrustInfo {
    trustLevel: number;
    submissionsApproved: number;
    submissionsRejected: number;
}

// Trust thresholds for moderation decisions
const TRUST_THRESHOLDS = {
    AUTO_APPROVE: 0.80,   // 80%+ trust = auto-approve
    REQUIRES_REVIEW: 0.50, // 50-80% trust = needs review
    LIKELY_REJECT: 0.30    // <30% trust = additional scrutiny
};

const DOMAIN_THRESHOLDS = {
    TRUSTED: 0.80,         // Known good domains
    NEUTRAL: 0.50,         // New/unknown domains
    SUSPICIOUS: 0.30       // Flagged domains
};

/**
 * Content Quality and Safety Service
 * Handles content filtering, spam detection, and domain reputation
 */
export class ContentModerationService {

    /**
     * Check if content is safe for general audiences
     */
    async checkContentSafety(url: string, title: string, description: string): Promise<ContentSafetyResult> {
        const content = `${title} ${description}`.toLowerCase();
        const flags: string[] = [];
        let isSafe = true;
        let confidence = 0.9;

        // NSFW keyword detection
        const nsfwKeywords = [
            'porn', 'xxx', 'sex', 'nude', 'naked', 'adult', 'nsfw',
            'explicit', 'mature', 'erotic', 'sexual', 'strip', 'cam',
            'escort', 'dating', 'hookup', 'fetish', 'bdsm'
        ];

        const foundNsfwKeywords = nsfwKeywords.filter(keyword => content.includes(keyword));
        if (foundNsfwKeywords.length > 0) {
            flags.push('nsfw-keywords');
            isSafe = false;
            confidence = 0.8;
        }

        // Violence/harmful content detection
        const violenceKeywords = [
            'violence', 'kill', 'murder', 'death', 'suicide', 'harm',
            'weapon', 'gun', 'bomb', 'terrorist', 'hate', 'nazi'
        ];

        const foundViolenceKeywords = violenceKeywords.filter(keyword => content.includes(keyword));
        if (foundViolenceKeywords.length > 0) {
            flags.push('violence-keywords');
            isSafe = false;
            confidence = 0.85;
        }

        // Domain-based safety checks
        const domain = new URL(url).hostname.toLowerCase();

        // URL shorteners (exact matches)
        const urlShorteners = [
            'bit.ly', 'tinyurl.com', 'shortened.link', 't.co', 'goo.gl', 'ow.ly'
        ];

        // NSFW domains (partial matches for subdomains)
        const nsfwDomainKeywords = ['adult', 'xxx', 'porn', 'sex', 'casino', 'gambling'];

        // Check for URL shorteners (exact match)
        if (urlShorteners.includes(domain)) {
            flags.push('url-shortener');
            isSafe = false;
            confidence = 0.7;
        }

        // Check for NSFW keywords in domain (must be in domain name, not TLD)
        const domainWithoutTld = domain.split('.').slice(0, -1).join('.');
        if (nsfwDomainKeywords.some(keyword => domainWithoutTld.includes(keyword))) {
            flags.push('suspicious-domain');
            isSafe = false;
            confidence = 0.7;
        }

        // Check domain reputation (only flag severely bad domains)
        const domainRep = await this.getDomainReputation(domain);
        if (domainRep && domainRep.score < 0.2 && domainRep.submissionCount > 3) {
            flags.push('low-domain-reputation');
            isSafe = false;
            confidence = Math.min(confidence, 0.6);
        }

        return {
            isSafe,
            confidence,
            flags,
            reason: flags.length > 0 ? `Content flagged for: ${flags.join(', ')}` : undefined
        };
    }

    /**
     * Detect spam and low-quality content
     */
    async detectSpam(url: string, title: string, description: string): Promise<SpamDetectionResult> {
        const content = `${title} ${description}`.toLowerCase();
        const reasons: string[] = [];
        let isSpam = false;
        let confidence = 0.1;

        // SEO spam indicators
        const seoSpamIndicators = [
            'seo', 'backlinks', 'rank higher', 'guaranteed traffic',
            'buy now', 'limited time', 'act fast', 'urgent',
            'make money', 'work from home', 'get rich',
            'click here', 'visit now', 'special offer'
        ];

        const foundSeoSpam = seoSpamIndicators.filter(indicator => content.includes(indicator));
        if (foundSeoSpam.length >= 2) {
            reasons.push('seo-spam-keywords');
            isSpam = true;
            confidence += 0.3;
        }

        // Promotional content detection
        const promoKeywords = [
            'sale', 'discount', 'coupon', 'promo', 'deal',
            'free shipping', 'limited offer', 'price drop'
        ];

        const foundPromoKeywords = promoKeywords.filter(keyword => content.includes(keyword));
        if (foundPromoKeywords.length >= 2) {
            reasons.push('promotional-content');
            confidence += 0.2;
        }

        // Content quality checks
        if (title.length < 10) {
            reasons.push('title-too-short');
            confidence += 0.1;
        }

        if (title.split(' ').length < 3) {
            reasons.push('title-too-few-words');
            confidence += 0.1;
        }

        // Excessive capitalization
        const uppercaseRatio = (title.match(/[A-Z]/g) || []).length / title.length;
        if (uppercaseRatio > 0.5 && title.length > 10) {
            reasons.push('excessive-caps');
            isSpam = true;
            confidence += 0.2;
        }

        // Repetitive patterns
        const words = title.toLowerCase().split(' ');
        const uniqueWords = new Set(words);
        if (words.length > 5 && uniqueWords.size / words.length < 0.6) {
            reasons.push('repetitive-content');
            confidence += 0.2;
        }

        // Domain reputation check
        const domain = new URL(url).hostname.toLowerCase();
        const domainRep = await this.getDomainReputation(domain);
        if (domainRep && domainRep.flaggedCount > domainRep.submissionCount * 0.3) {
            reasons.push('high-flag-rate-domain');
            isSpam = true;
            confidence += 0.3;
        }

        // Final spam determination
        if (confidence > 0.4 || reasons.length >= 3) {
            isSpam = true;
        }

        return {
            isSpam,
            confidence: Math.min(confidence, 1.0),
            reasons
        };
    }

    /**
     * Get or create domain reputation record
     */
    async getDomainReputation(domain: string): Promise<DomainReputation | null> {
        try {
            const { data, error } = await supabase
                .from('domain_reputation')
                .select('*')
                .eq('domain', domain)
                .single();

            if (error && error.code !== 'PGRST116') { // PGRST116 = not found
                console.error('Error fetching domain reputation:', error);
                return null;
            }

            if (!data) {
                // Create new reputation record
                const newRep: Omit<DomainReputation, 'lastUpdated'> = {
                    domain,
                    score: 0.7, // Default neutral score
                    submissionCount: 0,
                    flaggedCount: 0
                };

                const { data: created, error: createError } = await supabase
                    .from('domain_reputation')
                    .insert({
                        domain: newRep.domain,
                        score: newRep.score,
                        submission_count: newRep.submissionCount,
                        flagged_count: newRep.flaggedCount,
                        last_updated: new Date().toISOString()
                    })
                    .select()
                    .single();

                if (createError) {
                    console.error('Error creating domain reputation:', createError);
                    return null;
                }

                return {
                    domain: created.domain,
                    score: created.score,
                    submissionCount: created.submission_count,
                    flaggedCount: created.flagged_count,
                    lastUpdated: new Date(created.last_updated)
                };
            }

            return {
                domain: data.domain,
                score: data.score,
                submissionCount: data.submission_count,
                flaggedCount: data.flagged_count,
                lastUpdated: new Date(data.last_updated)
            };

        } catch (error) {
            console.error('Error in getDomainReputation:', error);
            return null;
        }
    }

    /**
     * Update domain reputation after content submission
     */
    async updateDomainReputation(domain: string, wasAccepted: boolean): Promise<void> {
        try {
            const current = await this.getDomainReputation(domain);
            if (!current) return;

            const newSubmissionCount = current.submissionCount + 1;
            const newFlaggedCount = wasAccepted ? current.flaggedCount : current.flaggedCount + 1;

            // Calculate new score (simple algorithm - can be improved)
            const flaggedRatio = newFlaggedCount / newSubmissionCount;
            const newScore = Math.max(0.1, Math.min(1.0, 1.0 - flaggedRatio));

            await supabase
                .from('domain_reputation')
                .update({
                    score: newScore,
                    submission_count: newSubmissionCount,
                    flagged_count: newFlaggedCount,
                    last_updated: new Date().toISOString()
                })
                .eq('domain', domain);

        } catch (error) {
            console.error('Error updating domain reputation:', error);
        }
    }

    /**
     * Get submitter trust level from database
     */
    async getSubmitterTrustLevel(userId?: string): Promise<number> {
        // Anonymous or missing user = low trust
        if (!userId) {
            console.log('[Moderation] Anonymous submission - low trust (0.30)');
            return 0.30;
        }

        try {
            const { data, error } = await supabase
                .from('users')
                .select('trust_level, submissions_approved, submissions_rejected')
                .eq('id', userId)
                .single();

            if (error) {
                console.error('[Moderation] Error fetching user trust:', error);
                return 0.50; // Default neutral on error
            }

            if (!data) {
                console.log('[Moderation] User not found - neutral trust (0.50)');
                return 0.50;
            }

            const trustLevel = data.trust_level || 0.50;
            console.log('[Moderation] User trust level:', {
                userId,
                trustLevel,
                approved: data.submissions_approved,
                rejected: data.submissions_rejected
            });

            return trustLevel;
        } catch (error) {
            console.error('[Moderation] Exception getting submitter trust:', error);
            return 0.50; // Default neutral on exception
        }
    }

    /**
     * Comprehensive content quality check with trust-based decisions
     */
    async moderateContent(
        url: string,
        title: string,
        description: string,
        submittedBy?: string
    ): Promise<{
        approved: boolean;
        confidence: number;
        issues: string[];
        recommendation: 'approve' | 'reject' | 'review';
        trustScore?: number;
        domainScore?: number;
    }> {
        // Run safety and spam checks
        const [safetyResult, spamResult] = await Promise.all([
            this.checkContentSafety(url, title, description),
            this.detectSpam(url, title, description)
        ]);

        const issues: string[] = [];
        let approved = true;
        let recommendation: 'approve' | 'reject' | 'review' = 'approve';

        // Safety violations are automatic rejections (regardless of trust)
        if (!safetyResult.isSafe) {
            console.log('[Moderation] Safety violation detected - rejecting', {
                url,
                flags: safetyResult.flags
            });
            approved = false;
            recommendation = 'reject';
            issues.push(...safetyResult.flags);

            const confidence = Math.min(safetyResult.confidence, 1.0 - spamResult.confidence);
            return {
                approved,
                confidence,
                issues,
                recommendation
            };
        }

        // High confidence spam is rejected (regardless of trust)
        if (spamResult.isSpam && spamResult.confidence > 0.7) {
            console.log('[Moderation] High confidence spam detected - rejecting', {
                url,
                confidence: spamResult.confidence,
                reasons: spamResult.reasons
            });
            approved = false;
            recommendation = 'reject';
            issues.push(...spamResult.reasons);

            const confidence = Math.min(safetyResult.confidence, 1.0 - spamResult.confidence);
            return {
                approved,
                confidence,
                issues,
                recommendation
            };
        }

        // Get trust scores for balanced decision
        const submitterTrust = await this.getSubmitterTrustLevel(submittedBy);
        const domain = new URL(url).hostname;
        const domainRep = await this.getDomainReputation(domain);
        const domainScore = domainRep?.score || 0.50;

        // Combined trust score (weighted: 60% submitter, 40% domain)
        const combinedTrustScore = (submitterTrust * 0.6) + (domainScore * 0.4);

        console.log('[Moderation] Trust analysis:', {
            url,
            submitterTrust,
            domainScore,
            combinedTrustScore,
            spamConfidence: spamResult.confidence,
            isSpam: spamResult.isSpam
        });

        // Medium confidence spam - trust determines outcome
        if (spamResult.isSpam && spamResult.confidence > 0.4) {
            issues.push(...spamResult.reasons);

            // High trust can override medium spam concerns
            if (combinedTrustScore >= TRUST_THRESHOLDS.AUTO_APPROVE) {
                console.log('[Moderation] Medium spam but high trust - approving with review flag');
                approved = true;
                recommendation = 'approve';
                issues.push('approved-despite-spam-due-to-trust');
            } else {
                console.log('[Moderation] Medium spam + medium/low trust - sending to review');
                approved = false;
                recommendation = 'review';
            }
        }
        // No spam detected - trust-based decision
        else {
            // High trust (0.8+) = auto-approve
            if (combinedTrustScore >= TRUST_THRESHOLDS.AUTO_APPROVE) {
                console.log('[Moderation] High trust - auto-approving');
                approved = true;
                recommendation = 'approve';
            }
            // Medium trust (0.5-0.8) = review queue
            else if (combinedTrustScore >= TRUST_THRESHOLDS.REQUIRES_REVIEW) {
                console.log('[Moderation] Medium trust - sending to review');
                approved = false;
                recommendation = 'review';
                issues.push('new-submitter-requires-review');
            }
            // Low trust (<0.5) = review with scrutiny
            else {
                console.log('[Moderation] Low trust - sending to review with scrutiny');
                approved = false;
                recommendation = 'review';
                issues.push('low-trust-requires-review');
            }
        }

        const confidence = Math.min(safetyResult.confidence, 1.0 - spamResult.confidence);

        return {
            approved,
            confidence,
            issues,
            recommendation,
            trustScore: combinedTrustScore,
            domainScore
        };
    }

    /**
     * Generate user-friendly rejection message from moderation issues
     */
    generateRejectionMessage(issues: string[]): string {
        const issueMessages: Record<string, string> = {
            // Safety issues
            'nsfw-keywords': 'Content contains adult or explicit material',
            'violence-keywords': 'Content contains violent or harmful material',
            'url-shortener': 'URL shorteners are not allowed. Please submit the final destination URL',
            'suspicious-domain': 'Domain appears to contain inappropriate content keywords',
            'low-domain-reputation': 'Domain has a history of low-quality or problematic content',

            // Spam issues
            'seo-spam-keywords': 'Content appears to be SEO spam or promotional',
            'promotional-content': 'Content is primarily promotional or advertising',
            'title-too-short': 'Title is too short or uninformative',
            'title-too-few-words': 'Title does not provide enough information',
            'excessive-caps': 'Title uses excessive capitalization',
            'repetitive-content': 'Content appears repetitive or low-quality',
            'high-flag-rate-domain': 'Domain has a high rate of flagged content'
        };

        const messages = issues
            .map(issue => issueMessages[issue])
            .filter(msg => msg !== undefined);

        if (messages.length === 0) {
            return 'Content does not meet our quality and safety standards';
        }

        if (messages.length === 1) {
            return messages[0];
        }

        return 'Multiple issues detected: ' + messages.join('; ');
    }

    /**
     * Get recommendations for fixing rejected content
     */
    getSuggestions(issues: string[]): string[] {
        const suggestions: string[] = [];

        if (issues.some(i => i.includes('title'))) {
            suggestions.push('Use a more descriptive and informative title');
        }

        if (issues.some(i => i.includes('promotional') || i.includes('spam'))) {
            suggestions.push('Remove promotional language and focus on the content value');
        }

        if (issues.some(i => i.includes('caps'))) {
            suggestions.push('Use normal capitalization in the title');
        }

        if (issues.some(i => i.includes('domain'))) {
            suggestions.push('Consider submitting content from more established sources');
        }

        if (issues.some(i => i.includes('repetitive'))) {
            suggestions.push('Ensure the content is unique and not repetitive');
        }

        if (suggestions.length === 0) {
            suggestions.push('Review our content guidelines and try submitting different content');
        }

        return suggestions;
    }

    /**
     * Add content to moderation queue
     */
    async addToModerationQueue(contentData: {
        url: string;
        title: string;
        description: string;
        domain: string;
        issues: string[];
        confidence: number;
        submittedBy?: string;
    }): Promise<string | null> {
        try {
            const { data, error } = await supabase
                .from('moderation_queue')
                .insert({
                    url: contentData.url,
                    title: contentData.title,
                    description: contentData.description,
                    domain: contentData.domain,
                    issues: contentData.issues,
                    confidence_score: contentData.confidence,
                    submitted_by: contentData.submittedBy,
                    status: 'pending',
                    created_at: new Date().toISOString()
                })
                .select('id')
                .single();

            if (error) {
                console.error('Error adding to moderation queue:', error);
                return null;
            }

            return data.id;
        } catch (error) {
            console.error('Error in addToModerationQueue:', error);
            return null;
        }
    }
}