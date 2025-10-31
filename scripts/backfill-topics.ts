/**
 * Backfill Topics Script
 * 
 * This script analyzes all existing content in the database and assigns topics based on:
 * - URL patterns
 * - Title keywords
 * - Description keywords
 * 
 * It populates both:
 * 1. The topics JSONB column in the content table
 * 2. The content_topics relational table for proper discovery queries
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from discovery-service
config({ path: resolve(__dirname, '../apis/discovery-service/.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_KEY environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Topic classification function (same as in submit.ts)
function classifyContent(url: string, title?: string, description?: string): string[] {
    const content = `${url} ${title || ''} ${description || ''}`.toLowerCase();
    const topics: string[] = [];

    // Enhanced keyword-based classification - ONLY using valid 44 topics from database
    const topicKeywords: Record<string, string[]> = {
        // Core topics
        'technology': ['tech', 'software', 'computer', 'programming', 'code', 'digital', 'app', 'startup', 'developer', 'coding'],
        'ai': ['ai', 'artificial intelligence', 'machine learning', 'ml', 'neural network', 'deep learning', 'gpt', 'llm', 'chatbot', 'transformer'],
        'science': ['science', 'research', 'study', 'discovery', 'lab', 'experiment', 'scientific'],
        'business': ['business', 'finance', 'market', 'economy', 'company', 'entrepreneur', 'investment', 'startup', 'commerce'],
        'culture': ['culture', 'cultural', 'art', 'artist', 'creative', 'fashion', 'entertainment', 'media'],
        'education': ['learn', 'education', 'course', 'tutorial', 'guide', 'how-to', 'university', 'school', 'teach'],
        'health': ['health', 'fitness', 'medical', 'wellness', 'nutrition', 'exercise', 'mental health'],
        'politics': ['politics', 'government', 'policy', 'election', 'democracy', 'law', 'legal', 'vote'],
        'sports': ['sport', 'team', 'player', 'match', 'competition', 'athletics', 'game', 'nfl', 'nba', 'soccer'],
        'food': ['food', 'recipe', 'cooking', 'restaurant', 'chef', 'kitchen', 'meal', 'cuisine'],
        'travel': ['travel', 'trip', 'vacation', 'destination', 'tourism', 'journey', 'explore'],

        // Creativity & Expression
        'digital-art': ['digital art', 'glitch', 'generative', 'interactive art', 'ai art', 'creative coding', 'glitch art'],
        'music-sound': ['music', 'sound', 'audio', 'instrument', 'compose', 'synthesizer', 'beat', 'song', 'album', 'artist', 'band', 'concert'],
        'music': ['spotify', 'soundcloud', 'bandcamp', 'playlist', 'musician'],
        'literature-writing': ['writing', 'poetry', 'story', 'literature', 'zine', 'fanfiction', 'creative writing', 'author', 'book'],
        'design-typography': ['typography', 'font', 'ui', 'ux', 'interface', 'layout', 'graphic design'],
        'photography': ['photography', 'photo', 'camera', 'photographer', 'instagram'],

        // Curiosity & Oddities
        'random-generators': ['generator', 'random', 'generate', 'create', 'maker', 'builder', 'procedural'],
        'weird-web': ['weird', 'strange', 'unusual', 'quirky', 'odd', 'bizarre', 'useless', 'experimental'],
        'retro-internet': ['retro', 'vintage', 'old web', 'geocities', '90s', 'early internet', 'web 1.0'],
        'nostalgia': ['nostalgia', 'nostalgic', 'childhood', 'throwback', '80s', '70s', 'classic'],
        'mysteries-conspiracies': ['mystery', 'conspiracy', 'unexplained', 'secret', 'hidden', 'paranormal', 'ufo'],
        'quizzes-puzzles': ['quiz', 'puzzle', 'riddle', 'brain teaser', 'challenge', 'test', 'trivia', 'word game'],

        // Play & Interaction
        'browser-games': ['game', 'play', 'browser game', 'web game', 'arcade', 'flash game', 'html5 game'],
        'simulations': ['simulation', 'simulator', 'model', 'physics', 'virtual', 'sandbox'],
        'vr-ar-experiments': ['vr', 'ar', 'virtual reality', 'augmented reality', 'immersive', '3d', 'webxr'],
        'interactive-storytelling': ['interactive story', 'choose your own', 'narrative', 'branching', 'text adventure'],

        // Human Experience
        'history': ['history', 'historical', 'archive', 'timeline', 'past', 'heritage', 'ancient'],
        'folklore-myth': ['folklore', 'myth', 'legend', 'fairy tale', 'tradition', 'mythology'],
        'global-voices': ['global', 'international', 'perspective', 'world', 'multicultural'],
        'philosophy-thought': ['philosophy', 'philosophical', 'ethics', 'meaning', 'existence', 'thought', 'existential'],

        // Knowledge Frontiers
        'space-astronomy': ['space', 'astronomy', 'cosmic', 'universe', 'planet', 'nasa', 'telescope', 'mars', 'moon'],
        'future-scifi': ['future', 'sci-fi', 'science fiction', 'futuristic', 'cyberpunk', 'speculative'],
        'mathematical-playgrounds': ['math', 'mathematics', 'fractal', 'geometry', 'equation', 'proof', 'algorithm'],
        'biology-oddities': ['biology', 'creature', 'organism', 'microscopic', 'species', 'evolution'],
        'nature-wildlife': ['nature', 'wildlife', 'animal', 'environment', 'ecosystem', 'conservation'],

        // Personal & Social
        'self-improvement': ['productivity', 'self improvement', 'habit', 'goal', 'motivation', 'growth', 'mindfulness'],
        'memes-humor': ['meme', 'funny', 'humor', 'comedy', 'joke', 'lol', 'internet humor', 'parody'],
        'communities-forums': ['community', 'forum', 'discussion', 'group', 'social', 'chat', 'reddit'],

        // Media & Entertainment
        'movies': ['movie', 'film', 'cinema', 'hollywood', 'documentary'],
        'tv-shows': ['tv show', 'television', 'series', 'episode', 'streaming'],
        'streaming': ['netflix', 'hulu', 'disney+', 'stream', 'watch online'],
        'reading': ['read', 'ebook', 'kindle', 'goodreads', 'literary'],

        // DIY & Making
        'diy-making': ['diy', 'maker', 'craft', 'handmade', 'build', 'create', 'tinker']
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
    else if (domain.includes('soundcloud.com') || domain.includes('bandcamp.com') || domain.includes('freesound.org') || domain.includes('spotify.com')) {
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

async function backfillTopics() {
    console.log('🔍 Starting topic backfill process...\n');

    try {
        // Step 1: Get all topics from database
        console.log('📚 Fetching topics from database...');
        const { data: allTopics, error: topicsError } = await supabase
            .from('topics')
            .select('id, name');

        if (topicsError) {
            throw new Error(`Failed to fetch topics: ${topicsError.message}`);
        }

        const topicMap = new Map(allTopics.map(t => [t.name, t.id]));
        console.log(`✅ Found ${allTopics.length} topics in database\n`);

        // Step 2: Get all content (fetch in batches to avoid 1000 row limit)
        console.log('📄 Fetching content to classify...');
        let allContent: any[] = [];
        let from = 0;
        const batchSize = 1000;

        while (true) {
            const { data: batch, error: contentError } = await supabase
                .from('content')
                .select('id, url, title, description, topics')
                .eq('is_active', true)
                .range(from, from + batchSize - 1);

            if (contentError) {
                throw new Error(`Failed to fetch content: ${contentError.message}`);
            }

            if (!batch || batch.length === 0) {
                break;
            }

            allContent = allContent.concat(batch);
            from += batchSize;

            if (batch.length < batchSize) {
                break; // Last batch
            }
        }

        const content = allContent;
        console.log(`✅ Found ${content.length} content items\n`);

        // Step 3: Classify and update each content item
        let processed = 0;
        let updated = 0;
        let reclassified = 0;
        let failed = 0;

        for (const item of content) {
            processed++;

            try {
                // Track if this is a reclassification (had invalid topics)
                const hadTopics = item.topics && Array.isArray(item.topics) && item.topics.length > 0;

                // Classify content (will overwrite any existing invalid topics)
                const topics = await classifyContent(item.url, item.title, item.description);

                if (topics.length === 0) {
                    // Assign default topic
                    topics.push('weird-web');
                }

                // Update topics JSONB column
                const { error: updateError } = await supabase
                    .from('content')
                    .update({ topics })
                    .eq('id', item.id);

                if (updateError) {
                    console.error(`❌ Failed to update content ${item.id}:`, updateError.message);
                    failed++;
                    continue;
                }

                // Delete old junction table entries (in case they had invalid topics)
                await supabase
                    .from('content_topics')
                    .delete()
                    .eq('content_id', item.id);

                // Insert into content_topics junction table
                const topicIds = topics
                    .map(topicName => topicMap.get(topicName))
                    .filter(id => id !== undefined);

                if (topicIds.length > 0) {
                    const contentTopics = topicIds.map(topicId => ({
                        content_id: item.id,
                        topic_id: topicId,
                        confidence_score: 0.7 // Moderate confidence for automated classification
                    }));

                    const { error: junctionError } = await supabase
                        .from('content_topics')
                        .insert(contentTopics);

                    if (junctionError) {
                        console.error(`⚠️ Failed to link topics for content ${item.id}:`, junctionError.message);
                        // Don't count as failed since JSONB was updated
                    }
                }

                updated++;
                if (hadTopics) {
                    reclassified++;
                }

                // Progress update every 100 items
                if (processed % 100 === 0) {
                    console.log(`⏩ Progress: ${processed}/${content.length} (${updated} updated, ${reclassified} reclassified, ${failed} failed)`);
                }

            } catch (error) {
                console.error(`❌ Error processing content ${item.id}:`, error);
                failed++;
            }
        }

        console.log('\n✅ Backfill complete!');
        console.log(`📊 Summary:`);
        console.log(`   - Total processed: ${processed}`);
        console.log(`   - Updated: ${updated}`);
        console.log(`   - Reclassified (had invalid topics): ${reclassified}`);
        console.log(`   - Failed: ${failed}`);

    } catch (error) {
        console.error('\n❌ Fatal error during backfill:', error);
        process.exit(1);
    }
}

// Run the backfill
backfillTopics()
    .then(() => {
        console.log('\n🎉 Topic backfill completed successfully!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n💥 Backfill failed:', error);
        process.exit(1);
    });
