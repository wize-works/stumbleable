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
import { resolve } from 'path';

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

    // Enhanced keyword-based classification
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
        'music-sound': ['music', 'sound', 'audio', 'instrument', 'compose', 'synthesizer', 'beat', 'song', 'album', 'artist', 'band', 'concert', 'spotify', 'soundcloud'],
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
        let skipped = 0;
        let failed = 0;

        for (const item of content) {
            processed++;

            try {
                // Skip if already has topics
                if (item.topics && Array.isArray(item.topics) && item.topics.length > 0) {
                    skipped++;
                    if (processed % 100 === 0) {
                        console.log(`⏩ Progress: ${processed}/${content.length} (${updated} updated, ${skipped} skipped, ${failed} failed)`);
                    }
                    continue;
                }

                // Classify content
                const topics = classifyContent(item.url, item.title, item.description);

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

                // Progress update every 100 items
                if (processed % 100 === 0) {
                    console.log(`⏩ Progress: ${processed}/${content.length} (${updated} updated, ${skipped} skipped, ${failed} failed)`);
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
        console.log(`   - Skipped (already had topics): ${skipped}`);
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
