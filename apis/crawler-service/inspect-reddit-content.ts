import { load } from 'cheerio';
import Parser from 'rss-parser';

async function inspectRedditRSSContent() {
    const feedUrl = 'https://www.reddit.com/r/science/.rss';

    const response = await fetch(feedUrl, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/115.0',
            'Accept': 'application/rss+xml, application/xml, text/xml, */*',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate, br',
            'DNT': '1',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1'
        }
    });

    const xmlText = await response.text();
    const parser = new Parser();
    const feed = await parser.parseString(xmlText);

    console.log('=== EXAMINING REDDIT CONTENT FOR EXTERNAL LINKS ===');

    for (let i = 0; i < Math.min(5, feed.items.length); i++) {
        const item = feed.items[i];
        console.log(`\n--- Item ${i + 1}: ${item.title?.substring(0, 80)}... ---`);

        const content = item.content || '';

        if (content) {
            console.log('\n📄 RAW CONTENT (first 500 chars):');
            console.log(content.substring(0, 500) + '...');

            // Parse HTML content
            const $ = load(content);
            console.log('\n🔗 EXTRACTING LINKS FROM HTML:');

            const externalLinks: { url: string; text: string }[] = [];
            $('a[href]').each((_, element) => {
                const href = $(element).attr('href');
                const text = $(element).text().trim();
                if (href && href.startsWith('http') && !href.includes('reddit.com')) {
                    externalLinks.push({ url: href, text });
                }
            });

            if (externalLinks.length > 0) {
                console.log('🎯 EXTERNAL LINKS FOUND:');
                externalLinks.forEach(link => {
                    console.log(`  - ${link.url} (${link.text})`);
                });
            } else {
                console.log('❌ No external links found in this post');
            }
        } else {
            console.log('❌ No content field found');
        }
    }
}

inspectRedditRSSContent().catch(console.error);