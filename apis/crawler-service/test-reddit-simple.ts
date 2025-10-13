import { CrawlerEngine } from './src/lib/crawler.js';
import { supabase } from './src/lib/supabase.js';

async function testRedditCrawl() {
    console.log('🧪 Testing Reddit crawl with updated extraction logic...\n');

    const crawler = new CrawlerEngine();

    try {
        // Get a Reddit source with extract_links enabled
        const { data: source, error: sourceError } = await supabase
            .from('crawler_sources')
            .select('*')
            .eq('url', 'https://www.reddit.com/r/science/.rss')
            .single();

        if (sourceError || !source) {
            console.error('❌ Could not find Reddit science source:', sourceError);
            return;
        }

        console.log(`📋 Source: ${source.name}`);
        console.log(`🔗 Extract Links: ${source.extract_links}`);
        console.log(`📍 Subreddit: ${source.reddit_subreddit}`);
        console.log(`🌐 URL: ${source.url}\n`);

        if (!source.extract_links) {
            console.log('❌ extract_links is still false! The update may not have worked.');
            return;
        }

        console.log('🚀 Starting crawl...');
        const result = await crawler.crawlSource(source);

        console.log(`\n✅ Crawl completed!`);
        console.log(`📊 Items found: ${result.items_found}`);
        console.log(`� Items submitted: ${result.items_submitted}`);
        console.log(`❌ Items failed: ${result.items_failed}`);

        // Check if any Reddit URLs are in the crawler_history (they shouldn't be)
        const { data: history, error: historyError } = await supabase
            .from('crawler_history')
            .select('url')
            .eq('job_id', result.id)
            .limit(5);

        if (!historyError && history) {
            console.log(`\n📋 Sample URLs processed (should be external, not Reddit):`);
            history.forEach((item, index) => {
                console.log(`${index + 1}. ${item.url}`);
                if (item.url.includes('reddit.com')) {
                    console.log('   ⚠️  WARNING: This is still a Reddit URL!');
                }
            });
        }

    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

testRedditCrawl();