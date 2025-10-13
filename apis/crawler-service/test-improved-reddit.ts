import { RedditLinkExtractor } from './src/lib/reddit-extractor.js';

async function testImprovedRedditExtraction() {
    console.log('🧪 Testing improved Reddit link extraction...\n');

    const extractor = new RedditLinkExtractor();

    try {
        const testUrl = 'https://www.reddit.com/r/science/.rss';

        console.log(`📡 Extracting from: ${testUrl}`);

        // Extract links (will store in database)
        const links = await extractor.extractLinksFromFeed(testUrl, 'test-source-id');

        console.log(`\n✅ Successfully extracted ${links.length} external links:`);

        links.forEach((link, index) => {
            console.log(`\n${index + 1}. ${link.title}`);
            console.log(`   🔗 External URL: ${link.extractedUrl}`);
            console.log(`   📝 Reddit Post: ${link.originalUrl}`);
            console.log(`   🎯 Subreddit: ${link.subreddit}`);
        });

        // Verify no Reddit URLs were included
        const redditLinks = links.filter(link =>
            link.extractedUrl.includes('reddit.com') || link.extractedUrl.includes('redd.it')
        );

        if (redditLinks.length === 0) {
            console.log('\n🎉 SUCCESS: No Reddit URLs were extracted! Only external links.');
        } else {
            console.log(`\n❌ PROBLEM: Found ${redditLinks.length} Reddit URLs that should have been filtered:`);
            redditLinks.forEach(link => console.log(`   - ${link.extractedUrl}`));
        }

    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

testImprovedRedditExtraction();