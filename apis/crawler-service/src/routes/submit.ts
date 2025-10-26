import { FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { EmailClient } from '../lib/email-client';
import { captureContentMedia } from '../lib/image-capture';
import { ContentModerationService } from '../lib/moderation';
import { DiscoveryRepository } from '../lib/repository';
import { supabase } from '../lib/supabase';

const repository = new DiscoveryRepository();
const moderationService = new ContentModerationService();

// Validation schema for content submission
const submitContentSchema = z.object({
    url: z.string().url('Must be a valid URL'),
    title: z.string().optional(),
    description: z.string().optional(),
    topics: z.array(z.string()).max(5).optional(),
    userId: z.string().optional() // For future user attribution
});

// URL validation and sanitization
function sanitizeUrl(url: string): string {
    try {
        const urlObj = new URL(url);

        // Only allow HTTPS protocol for security
        if (urlObj.protocol !== 'https:') {
            throw new Error('Only HTTPS URLs are allowed. Please use a secure connection.');
        }

        // Remove tracking parameters
        const trackingParams = [
            'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
            'fbclid', 'gclid', 'ref', 'source'
        ];

        trackingParams.forEach(param => {
            urlObj.searchParams.delete(param);
        });

        return urlObj.toString();
    } catch (error) {
        throw new Error('Invalid URL format');
    }
}

// Extract metadata from URL
async function extractMetadata(url: string): Promise<{
    title?: string;
    description?: string;
    image?: string;
    favicon?: string;
    domain: string;
    allowsFraming?: boolean;
}> {
    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Stumbleable Content Bot 1.0'
            },
            signal: AbortSignal.timeout(10000) // 10 second timeout
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        // Check if content allows iframe embedding
        const xFrameOptions = response.headers.get('x-frame-options');
        const cspHeader = response.headers.get('content-security-policy');

        let allowsFraming = true; // Assume it allows unless we find blocking headers

        // Check X-Frame-Options header
        if (xFrameOptions) {
            const xFrameValue = xFrameOptions.toLowerCase();
            if (xFrameValue === 'deny' || xFrameValue === 'sameorigin') {
                allowsFraming = false;
                console.log(`[Submit] Content blocks framing via X-Frame-Options: ${xFrameOptions}`);
            }
        }

        // Check CSP frame-ancestors directive
        if (cspHeader && allowsFraming) {
            const frameAncestors = cspHeader.match(/frame-ancestors\s+([^;]+)/i);
            if (frameAncestors) {
                const directive = frameAncestors[1].trim().toLowerCase();
                // Check if frame-ancestors blocks external framing
                if (directive === "'none'" || directive === "'self'") {
                    allowsFraming = false;
                    console.log(`[Submit] Content blocks framing via CSP frame-ancestors: ${directive}`);
                } else if (directive === '*') {
                    // Bare * means allow from anywhere - do nothing, stays true
                    console.log(`[Submit] CSP frame-ancestors: ${directive} - allows framing from anywhere`);
                } else if (!directive.includes('https:') && !directive.includes('http:')) {
                    // If no scheme specified (https:/http:), it's domain-restricted and blocks us
                    allowsFraming = false;
                    console.log(`[Submit] Content blocks framing via CSP frame-ancestors (domain-restricted): ${directive}`);
                }
            }
        }

        const html = await response.text();
        const domain = new URL(url).hostname;

        // Extract title
        const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
        const title = titleMatch ? titleMatch[1].trim() : undefined;

        // Extract meta description
        const descMatch = html.match(/<meta[^>]*name=["\']description["\'][^>]*content=["\']([^"']+)["\'][^>]*>/i) ||
            html.match(/<meta[^>]*content=["\']([^"']+)["\'][^>]*name=["\']description["\'][^>]*>/i);
        const description = descMatch ? descMatch[1].trim() : undefined;

        // Extract Open Graph image
        const imageMatch = html.match(/<meta[^>]*property=["\']og:image["\'][^>]*content=["\']([^"']+)["\'][^>]*>/i) ||
            html.match(/<meta[^>]*content=["\']([^"']+)["\'][^>]*property=["\']og:image["\'][^>]*>/i);
        let image = imageMatch ? imageMatch[1] : undefined;

        // Make image absolute URL
        if (image && !image.startsWith('http')) {
            image = new URL(image, url).toString();
        }

        // Extract favicon
        const faviconMatch = html.match(/<link[^>]*rel=["\'](?:shortcut )?icon["\'][^>]*href=["\']([^"']+)["\'][^>]*>/i) ||
            html.match(/<link[^>]*href=["\']([^"']+)["\'][^>]*rel=["\'](?:shortcut )?icon["\'][^>]*>/i);
        let favicon = faviconMatch ? faviconMatch[1] : '/favicon.ico';

        // Make favicon absolute URL
        if (favicon && !favicon.startsWith('http')) {
            favicon = new URL(favicon, url).toString();
        }

        return {
            title,
            description,
            image,
            favicon,
            domain,
            allowsFraming
        };
    } catch (error) {
        console.error('Error extracting metadata:', error);
        const domain = new URL(url).hostname;
        return { domain };
    }
}

// Classify content into topics based on URL and metadata
export function classifyContent(url: string, title?: string, description?: string): string[] {
    const content = `${url} ${title || ''} ${description || ''}`.toLowerCase();
    const topics: string[] = [];

    // Enhanced keyword-based classification with new playful topics
    const topicKeywords: Record<string, string[]> = {
        // Core anchors
        'technology': ['tech', 'software', 'computer', 'programming', 'code', 'digital', 'app', 'startup'],
        'ai': ['ai', 'artificial intelligence', 'machine learning', 'ml', 'neural network', 'deep learning', 'gpt', 'llm', 'chatbot', 'transformer'],
        'science': ['science', 'research', 'study', 'discovery', 'lab', 'experiment', 'nature'],
        'business': ['business', 'finance', 'market', 'economy', 'company', 'entrepreneur', 'investment'],
        'culture': ['art', 'film', 'culture', 'creative', 'fashion', 'entertainment'],
        'education': ['learn', 'education', 'course', 'tutorial', 'guide', 'how-to', 'university', 'school'],
        'health': ['health', 'fitness', 'medical', 'wellness', 'nutrition', 'exercise', 'mental'],
        'politics': ['politics', 'government', 'policy', 'election', 'democracy', 'law', 'legal'],
        'sports': ['sport', 'team', 'player', 'match', 'competition', 'athletics'],
        'food': ['food', 'recipe', 'cooking', 'restaurant', 'chef', 'kitchen', 'meal'],
        'travel': ['travel', 'trip', 'vacation', 'destination', 'tourism', 'journey'],

        // Creativity & Expression
        'digital-art': ['digital art', 'glitch', 'generative', 'interactive art', 'ai art', 'creative coding'],
        'music-sound': ['music', 'sound', 'audio', 'instrument', 'compose', 'synthesizer', 'beat'],
        'literature-writing': ['writing', 'poetry', 'story', 'literature', 'zine', 'fanfiction', 'creative writing'],
        'design-typography': ['design', 'typography', 'font', 'ui', 'ux', 'interface', 'layout'],

        // Curiosity & Oddities
        'random-generators': ['generator', 'random', 'generate', 'create', 'maker', 'builder'],
        'weird-web': ['weird', 'strange', 'unusual', 'quirky', 'odd', 'bizarre', 'useless'],
        'retro-internet': ['retro', 'vintage', 'old web', 'geocities', 'nostalgia', '90s', 'early internet'],
        'mysteries-conspiracies': ['mystery', 'conspiracy', 'unexplained', 'secret', 'hidden', 'paranormal'],
        'quizzes-puzzles': ['quiz', 'puzzle', 'riddle', 'brain teaser', 'challenge', 'test', 'trivia'],

        // Play & Interaction
        'browser-games': ['game', 'play', 'browser game', 'web game', 'interactive', 'arcade'],
        'simulations': ['simulation', 'simulator', 'model', 'physics', 'virtual', 'sandbox'],
        'vr-ar-experiments': ['vr', 'ar', 'virtual reality', 'augmented reality', 'immersive', '3d'],
        'interactive-storytelling': ['interactive story', 'choose your own', 'narrative', 'branching'],

        // Human Experience
        'history': ['history', 'historical', 'archive', 'timeline', 'past', 'heritage'],
        'folklore-myth': ['folklore', 'myth', 'legend', 'story', 'tradition', 'cultural'],
        'global-voices': ['global', 'international', 'perspective', 'voice', 'world', 'culture'],
        'nostalgia': ['nostalgia', 'nostalgic', 'childhood', 'retro', 'memory', 'throwback'],

        // Knowledge Frontiers
        'space-astronomy': ['space', 'astronomy', 'cosmic', 'universe', 'planet', 'nasa', 'telescope'],
        'future-scifi': ['future', 'sci-fi', 'science fiction', 'futuristic', 'cyberpunk', 'speculative'],
        'mathematical-playgrounds': ['math', 'mathematics', 'fractal', 'geometry', 'equation', 'proof'],
        'biology-oddities': ['biology', 'creature', 'organism', 'microscopic', 'species', 'nature'],

        // Personal & Social
        'self-improvement': ['productivity', 'self improvement', 'habit', 'goal', 'motivation', 'growth'],
        'philosophy-thought': ['philosophy', 'philosophical', 'ethics', 'meaning', 'existence', 'thought'],
        'memes-humor': ['meme', 'funny', 'humor', 'comedy', 'joke', 'lol', 'internet humor'],
        'communities-forums': ['community', 'forum', 'discussion', 'group', 'social', 'chat']
    };

    // Check for domain-based classification
    const domain = new URL(url).hostname.toLowerCase();

    // Technology & Programming
    if (domain.includes('github.com') || domain.includes('stackoverflow.com') || domain.includes('codepen.io')) {
        topics.push('technology');
    }
    // Science & Research
    else if (domain.includes('arxiv.org') || domain.includes('nature.com') || domain.includes('sciencedirect.com')) {
        topics.push('science');
    }
    // Business & Finance
    else if (domain.includes('bloomberg.com') || domain.includes('wsj.com') || domain.includes('forbes.com')) {
        topics.push('business');
    }
    // Creative & Art
    else if (domain.includes('behance.net') || domain.includes('dribbble.com') || domain.includes('artstation.com')) {
        topics.push('digital-art');
    }
    // Games & Interactive
    else if (domain.includes('itch.io') || domain.includes('newgrounds.com') || domain.includes('kongregate.com')) {
        topics.push('browser-games');
    }
    // Weird Web & Experiments
    else if (domain.includes('neocities.org') || domain.includes('glitch.com') || domain.length < 10) {
        topics.push('weird-web');
    }
    // Music & Sound
    else if (domain.includes('soundcloud.com') || domain.includes('bandcamp.com') || domain.includes('freesound.org')) {
        topics.push('music-sound');
    }
    // Space & Astronomy
    else if (domain.includes('nasa.gov') || domain.includes('esa.int') || domain.includes('spaceweather.com')) {
        topics.push('space-astronomy');
    }
    // Retro & Nostalgia
    else if (domain.includes('archive.org') || domain.includes('oldgames.sk') || domain.includes('flashpoint')) {
        topics.push('retro-internet');
    }

    // Keyword-based classification
    Object.entries(topicKeywords).forEach(([topic, keywords]) => {
        if (keywords.some(keyword => content.includes(keyword))) {
            topics.push(topic);
        }
    });

    // Return unique topics, max 3
    return [...new Set(topics)].slice(0, 3);
}

/**
 * Content submission routes
 */
export const submitRoutes: FastifyPluginAsync = async (fastify) => {

    // Submit new content
    fastify.post<{ Body: any }>('/submit', async (request: FastifyRequest<{ Body: any }>, reply: FastifyReply) => {
        try {
            const validationResult = submitContentSchema.safeParse(request.body);
            if (!validationResult.success) {
                return reply.status(400).send({
                    error: 'Invalid request body',
                    details: validationResult.error.errors
                });
            }

            const { url: rawUrl, title: providedTitle, description: providedDescription, topics: providedTopics } = validationResult.data;

            // Sanitize and validate URL
            const url = sanitizeUrl(rawUrl);

            // Check if URL already exists
            const existingDiscovery = await repository.getDiscoveryByUrl(url);
            if (existingDiscovery) {
                return reply.status(409).send({
                    error: 'Content already exists',
                    discovery: existingDiscovery
                });
            }

            // Extract metadata
            const metadata = await extractMetadata(url);

            // Use provided data or fallback to extracted metadata
            const title = providedTitle || metadata.title || `Content from ${metadata.domain}`;
            const description = providedDescription || metadata.description || '';

            // Classify content or use provided topics
            const topics = providedTopics && providedTopics.length > 0
                ? providedTopics
                : classifyContent(url, title, description);

            // Moderate content before creating discovery (pass userId for trust check)
            const moderationResult = await moderationService.moderateContent(
                url,
                title,
                description,
                validationResult.data.userId
            );

            // Update domain reputation
            await moderationService.updateDomainReputation(metadata.domain, moderationResult.approved);

            // Handle moderation results
            if (moderationResult.recommendation === 'reject') {
                const rejectionMessage = moderationService.generateRejectionMessage(moderationResult.issues);
                const suggestions = moderationService.getSuggestions(moderationResult.issues);

                fastify.log.warn({
                    url,
                    title,
                    issues: moderationResult.issues,
                    confidence: moderationResult.confidence,
                    message: rejectionMessage
                }, 'Content rejected by moderation');

                return reply.status(400).send({
                    error: 'Content rejected',
                    reason: rejectionMessage,
                    details: {
                        issues: moderationResult.issues,
                        suggestions: suggestions,
                        confidence: moderationResult.confidence
                    }
                });
            }

            // Get internal user UUID from Clerk ID if provided (needed for both moderation queue and discovery)
            let internalUserId: string | undefined;
            if (validationResult.data.userId) {
                try {
                    const { data: userData, error: userError } = await supabase
                        .from('users')
                        .select('id')
                        .eq('clerk_user_id', validationResult.data.userId)
                        .single();

                    if (userData && !userError) {
                        internalUserId = userData.id;
                        fastify.log.info({
                            clerkUserId: validationResult.data.userId,
                            internalUserId
                        }, 'Resolved internal user ID for submission tracking');
                    } else {
                        fastify.log.warn({
                            clerkUserId: validationResult.data.userId,
                            error: userError
                        }, 'Could not resolve internal user ID - submission will not be tracked to user');
                    }
                } catch (lookupError) {
                    fastify.log.warn({
                        error: lookupError,
                        clerkUserId: validationResult.data.userId
                    }, 'Error looking up internal user ID');
                }
            }

            if (moderationResult.recommendation === 'review') {
                // Add to moderation queue for manual review
                const queueId = await moderationService.addToModerationQueue({
                    url,
                    title,
                    description,
                    domain: metadata.domain,
                    issues: moderationResult.issues,
                    confidence: moderationResult.confidence,
                    submittedBy: internalUserId // Use internal UUID, not Clerk ID
                });

                fastify.log.info({
                    url,
                    title,
                    queueId,
                    issues: moderationResult.issues
                }, 'Content added to moderation queue');

                // Send submission received email (don't block response)
                if (internalUserId) {
                    // Get user email from Clerk user ID
                    const { data: userData } = await supabase
                        .from('users')
                        .select('email')
                        .eq('id', internalUserId)
                        .single();

                    if (userData?.email) {
                        EmailClient.sendSubmissionReceivedEmail(
                            internalUserId,
                            userData.email,
                            title,
                            url
                        ).catch(err => {
                            fastify.log.error({ error: err, userId: internalUserId }, 'Failed to queue submission received email');
                        });
                    }
                }

                return reply.status(202).send({
                    message: 'Content submitted for review',
                    status: 'pending_review',
                    queueId,
                    reason: 'Content requires manual review before publication'
                });
            }

            // Content approved - create discovery

            // Capture images and favicons (store locally instead of hotlinking)
            let imageStoragePath: string | undefined;
            let faviconUrl: string | undefined;

            try {
                const captureResult = await captureContentMedia(
                    url, // Will be used as contentId temporarily
                    metadata.image || null,
                    metadata.domain
                );

                imageStoragePath = captureResult.imageStoragePath;
                faviconUrl = captureResult.faviconUrl;

                fastify.log.info({
                    url,
                    hasImage: !!imageStoragePath,
                    hasFavicon: !!faviconUrl
                }, 'Media capture completed');
            } catch (captureError) {
                fastify.log.warn({
                    error: captureError,
                    url
                }, 'Failed to capture media, will use fallbacks');
            }

            const discovery = await repository.createDiscovery({
                url,
                title,
                description,
                domain: metadata.domain,
                imageUrl: metadata.image, // Keep original as fallback
                imageStoragePath, // New: local storage path
                faviconUrl: faviconUrl || metadata.favicon, // Prefer stored favicon
                topics,
                readTime: Math.max(1, Math.floor((title.length + description.length) / 200)), // Estimate read time
                submittedAt: new Date(),
                allowsFraming: metadata.allowsFraming,
                submittedBy: internalUserId // Track who submitted this content (internal UUID, not Clerk ID)
            });

            fastify.log.info({
                url,
                title,
                topics,
                moderation: {
                    approved: moderationResult.approved,
                    confidence: moderationResult.confidence
                }
            }, 'New content submitted and approved');

            return reply.status(201).send({
                message: 'Content submitted successfully',
                discovery,
                moderation: {
                    status: 'approved',
                    confidence: moderationResult.confidence
                }
            });

        } catch (error) {
            fastify.log.error(error, 'Error in POST /submit');

            if (error instanceof Error) {
                if (error.message.includes('Invalid URL') || error.message.includes('Only HTTP')) {
                    return reply.status(400).send({
                        error: error.message
                    });
                }
            }

            return reply.status(500).send({
                error: 'Internal server error'
            });
        }
    });

    // Get submission statistics (for future use)
    fastify.get('/submit/stats', async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            const stats = await repository.getSubmissionStats();
            return reply.send(stats);
        } catch (error) {
            fastify.log.error(error, 'Error in GET /submit/stats');
            return reply.status(500).send({
                error: 'Internal server error'
            });
        }
    });
};