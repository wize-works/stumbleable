import { Topic } from './types';

/**
 * Topic catalog for Stumbleable - diverse interests across the spectrum
 */
export const topics: Topic[] = [
    // Arts & Design
    { id: 'art', name: 'Art' },
    { id: 'design', name: 'Design' },
    { id: 'photography', name: 'Photography' },
    { id: 'illustration', name: 'Illustration' },
    { id: 'typography', name: 'Typography' },
    { id: 'architecture', name: 'Architecture' },

    // Crafts & Making
    { id: 'diy', name: 'DIY' },
    { id: 'woodworking', name: 'Woodworking' },
    { id: 'ceramics', name: 'Ceramics' },
    { id: 'textiles', name: 'Textiles' },
    { id: 'metalworking', name: 'Metalworking' },

    // Technology
    { id: 'programming', name: 'Programming' },
    { id: 'web-dev', name: 'Web Development' },
    { id: 'ai', name: 'AI & Machine Learning' },
    { id: 'hardware', name: 'Hardware' },
    { id: 'indie-web', name: 'Indie Web' },

    // Science & Learning
    { id: 'science', name: 'Science' },
    { id: 'psychology', name: 'Psychology' },
    { id: 'astronomy', name: 'Astronomy' },
    { id: 'biology', name: 'Biology' },
    { id: 'physics', name: 'Physics' },

    // Culture & Philosophy
    { id: 'philosophy', name: 'Philosophy' },
    { id: 'history', name: 'History' },
    { id: 'anthropology', name: 'Anthropology' },
    { id: 'literature', name: 'Literature' },

    // Entertainment & Media
    { id: 'music', name: 'Music' },
    { id: 'games', name: 'Games' },
    { id: 'film', name: 'Film' },
    { id: 'podcasts', name: 'Podcasts' },

    // Nature & Outdoors
    { id: 'nature', name: 'Nature' },
    { id: 'gardening', name: 'Gardening' },
    { id: 'hiking', name: 'Hiking' },
    { id: 'wildlife', name: 'Wildlife' },

    // Lifestyle
    { id: 'cooking', name: 'Cooking' },
    { id: 'travel', name: 'Travel' },
    { id: 'wellness', name: 'Wellness' },
    { id: 'minimalism', name: 'Minimalism' },
];

export const topicsById = new Map(topics.map(t => [t.id, t]));