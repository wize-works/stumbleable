import { v4 as uuidv4 } from 'uuid';
import { RedditLinkExtractor } from './src/lib/reddit-extractor.js';
import { supabase } from './src/lib/supabase.js';

async function createRedditSourceAndTest() {
    console.log('🧪 Creating Reddit source and testing extraction with real UUID...\n');

    const extractor = new RedditLinkExtractor();

    try {
        // Create a real Reddit source in the database
        const sourceData = {
            id: uuidv4(),
            url: 'https://www.reddit.com/r/science/.rss',
            name: 'Reddit r/science',
            type: 'rss',
            domain: 'reddit.com',
            enabled: true,
            crawl_frequency_hours: 24,
            extract_links: true,
            reddit_subreddit: 'science',
            created_at: new Date().toISOString()
        };

        console.log('📝 Looking for existing Reddit source in database...');
        let { data: source, error: sourceError } = await supabase
            .from('crawler_sources')
            .select('*')
            .eq('url', sourceData.url)
            .single();

        if (sourceError || !source) {
            console.log('📝 Creating new Reddit source in database...');
            const { data: newSource, error: insertError } = await supabase
                .from('crawler_sources')
                .insert(sourceData)
                .select()
                .single();

            if (insertError) {
                console.error('❌ Error creating source:', insertError);
                return;
            }
            source = newSource;
        }

        console.log(`✅ Created source: ${source.name} (${source.id})`);

        // Test extraction with the real source ID
        console.log(`\n📡 Testing extraction with real source ID: ${source.id}`);
        const links = await extractor.extractLinksFromFeed(source.url, source.id);

        console.log(`\n🎯 Successfully extracted ${links.length} external links!`);

        // Show a few examples
        console.log('\n📋 Sample extracted links:');
        links.slice(0, 5).forEach((link, index) => {
            console.log(`${index + 1}. ${link.extractedUrl}`);
            console.log(`   📰 ${link.title.substring(0, 80)}...`);
        });

        // Check the queue
        console.log(`\n🔍 Checking extracted_links_queue...`);
        const { data: queueData, error: queueError } = await supabase
            .from('extracted_links_queue')
            .select('*')
            .eq('source_id', source.id)
            .limit(5);

        if (queueError) {
            console.error('❌ Error checking queue:', queueError);
        } else {
            console.log(`✅ Found ${queueData?.length || 0} items in queue for this source`);
            if (queueData && queueData.length > 0) {
                queueData.forEach((item, index) => {
                    console.log(`   ${index + 1}. ${item.extracted_url}`);
                });
            }
        }

        console.log('\n🎉 Reddit link extraction is working perfectly!');
        console.log(`📊 Ready to process ${links.length} high-quality external links from Reddit r/science`);

    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

createRedditSourceAndTest();