import dotenv from 'dotenv';
import { RedditLinkExtractor } from './src/lib/reddit-extractor';

// Load environment variables
dotenv.config();

async function testRedditRSS() {
    console.log('🧪 Testing Reddit RSS extraction...\n');

    const extractor = new RedditLinkExtractor();
    const testUrl = 'https://www.reddit.com/r/photography/.rss';

    try {
        console.log(`🔍 Testing URL: ${testUrl}`);

        // This will test the fetchRedditRSS method internally
        const links = await extractor.extractLinksFromFeed(testUrl, 'test-source-id');

        console.log(`✅ Success! Extracted ${links.length} links from Reddit RSS`);

        if (links.length > 0) {
            console.log('\n📋 Sample extracted links:');
            links.slice(0, 3).forEach((link, index) => {
                console.log(`${index + 1}. ${link.title}`);
                console.log(`   URL: ${link.extractedUrl}`);
                console.log(`   Priority: ${link.priority}`);
                console.log(`   Subreddit: r/${link.subreddit}\n`);
            });
        }

        console.log('🎉 Reddit RSS extraction test completed successfully!');

    } catch (error) {
        console.error('❌ Reddit RSS test failed:', error);
        process.exit(1);
    }
}

// Run the test
testRedditRSS();