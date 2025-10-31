/**
 * Content Topic Classification
 * 
 * CRITICAL: This classifier ONLY uses the 44 valid topics from the database.
 * It is shared between:
 * - Content submission (/submit endpoint)
 * - Content enhancement (/enhance endpoint)
 * - Backfill scripts
 * 
 * All topic assignments must go through this module to ensure consistency.
 */

import { supabase } from './supabase';

// Cache for valid topics (loaded once at startup)
let validTopicsCache: Set<string> | null = null;

/**
 * Load valid topics from database and cache them
 */
async function loadValidTopics(): Promise<Set<string>> {
    if (validTopicsCache) {
        return validTopicsCache;
    }

    try {
        const { data, error } = await supabase
            .from('topics')
            .select('name')
            .order('name');

        if (error) {
            console.error('❌ Failed to load valid topics from database:', error);
            throw error;
        }

        const topics = (data || []).map(t => t.name);
        validTopicsCache = new Set(topics);

        console.log(`✅ Loaded ${topics.length} valid topics from database`);
        return validTopicsCache;
    } catch (error) {
        console.error('❌ Error loading topics, using fallback list:', error);

        // Fallback to hardcoded list if database is unavailable
        const fallbackTopics = [
            'ai', 'biology-oddities', 'browser-games', 'business', 'communities-forums',
            'culture', 'design-typography', 'digital-art', 'diy-making', 'education',
            'folklore-myth', 'food', 'future-scifi', 'global-voices', 'health',
            'history', 'interactive-storytelling', 'literature-writing', 'mathematical-playgrounds',
            'memes-humor', 'movies', 'music', 'music-sound', 'mysteries-conspiracies',
            'nature-wildlife', 'nostalgia', 'philosophy-thought', 'photography', 'politics',
            'quizzes-puzzles', 'random-generators', 'reading', 'retro-internet', 'science',
            'self-improvement', 'simulations', 'space-astronomy', 'sports', 'streaming',
            'technology', 'travel', 'tv-shows', 'vr-ar-experiments', 'weird-web'
        ];

        validTopicsCache = new Set(fallbackTopics);
        return validTopicsCache;
    }
}

/**
 * Enhanced keyword-based classification - ONLY using valid 44 topics from database
 */
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

/**
 * Domain-based topic mapping
 * Maps specific domains to topics with high confidence
 */
const domainTopicMap: Record<string, string> = {
    // Technology & Development
    'github.com': 'technology',
    'gitlab.com': 'technology',
    'stackoverflow.com': 'technology',
    'codepen.io': 'technology',
    'glitch.com': 'technology',
    'replit.com': 'technology',
    'codesandbox.io': 'technology',

    // Games & Interactive
    'itch.io': 'browser-games',
    'newgrounds.com': 'browser-games',
    'kongregate.com': 'browser-games',
    'armorgames.com': 'browser-games',
    'crazygames.com': 'browser-games',

    // Science & Research
    'arxiv.org': 'science',
    'nature.com': 'science',
    'sciencedirect.com': 'science',
    'pubmed.gov': 'science',

    // Space & Astronomy
    'nasa.gov': 'space-astronomy',
    'esa.int': 'space-astronomy',
    'spaceweather.com': 'space-astronomy',

    // Art & Design
    'behance.net': 'digital-art',
    'dribbble.com': 'design-typography',
    'artstation.com': 'digital-art',
    'deviantart.com': 'digital-art',

    // Music & Sound
    'soundcloud.com': 'music-sound',
    'bandcamp.com': 'music',
    'spotify.com': 'music',
    'freesound.org': 'music-sound',

    // Retro & Archives
    'archive.org': 'retro-internet',
    'neocities.org': 'weird-web',

    // Writing & Literature
    'medium.com': 'literature-writing',
    'substack.com': 'literature-writing',
    'ao3.org': 'literature-writing',

    // Social & Community
    'reddit.com': 'communities-forums',
    'discord.com': 'communities-forums',

    // Business & Finance
    'bloomberg.com': 'business',
    'wsj.com': 'business',
    'forbes.com': 'business',

    // Photography
    'unsplash.com': 'photography',
    'flickr.com': 'photography',
    '500px.com': 'photography'
};

/**
 * Classify content into topics based on URL, title, and description
 * 
 * @param url - Content URL
 * @param title - Content title (optional)
 * @param description - Content description (optional)
 * @returns Array of 1-3 topic names from the valid 44 topics
 */
export async function classifyContent(
    url: string,
    title?: string,
    description?: string
): Promise<string[]> {
    // Ensure valid topics are loaded
    const validTopics = await loadValidTopics();

    const content = `${url} ${title || ''} ${description || ''}`.toLowerCase();
    const topics: Set<string> = new Set();

    // Step 1: Domain-based classification (high confidence)
    try {
        const domain = new URL(url).hostname.toLowerCase().replace(/^www\./, '');

        if (domainTopicMap[domain]) {
            const topic = domainTopicMap[domain];
            if (validTopics.has(topic)) {
                topics.add(topic);
            }
        }
    } catch (error) {
        console.error('Error parsing URL for domain classification:', error);
    }

    // Step 2: Keyword-based classification
    Object.entries(topicKeywords).forEach(([topic, keywords]) => {
        // Only add topics that exist in our valid set
        if (!validTopics.has(topic)) return;

        if (keywords.some(keyword => content.includes(keyword))) {
            topics.add(topic);
        }
    });

    // Step 3: Default fallback
    if (topics.size === 0) {
        topics.add('weird-web'); // Default catch-all for unclassified content
    }

    // Return max 3 topics
    return Array.from(topics).slice(0, 3);
}

/**
 * Validate that topics exist in the database
 * Filters out any invalid topic names
 * 
 * @param topics - Array of topic names to validate
 * @returns Array of only valid topic names
 */
export async function validateTopics(topics: string[]): Promise<string[]> {
    const validTopics = await loadValidTopics();
    return topics.filter(topic => validTopics.has(topic));
}

/**
 * Get topic IDs for topic names (for junction table inserts)
 * 
 * @param topicNames - Array of topic names
 * @returns Array of { name, id } objects for valid topics
 */
export async function getTopicIds(topicNames: string[]): Promise<Array<{ name: string; id: string }>> {
    try {
        const { data, error } = await supabase
            .from('topics')
            .select('id, name')
            .in('name', topicNames);

        if (error) {
            console.error('Error fetching topic IDs:', error);
            return [];
        }

        return data || [];
    } catch (error) {
        console.error('Error in getTopicIds:', error);
        return [];
    }
}
