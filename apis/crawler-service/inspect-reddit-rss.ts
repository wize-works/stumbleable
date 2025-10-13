import Parser from 'rss-parser';

async function inspectRedditRSSStructure() {
    const feedUrl = 'https://www.reddit.com/r/science/.rss';

    // Use browser-like headers to avoid 403
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

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const xmlText = await response.text();
    const parser = new Parser();
    const feed = await parser.parseString(xmlText);

    console.log('=== REDDIT RSS FEED STRUCTURE ===');
    console.log('Feed title:', feed.title);
    console.log('Total items:', feed.items.length);
    console.log('\n=== FIRST ITEM DETAILED INSPECTION ===');

    const firstItem = feed.items[0];
    console.log('All properties of first item:');
    console.log(JSON.stringify(firstItem, null, 2));

    console.log('\n=== CHECKING FOR EXTERNAL LINKS IN MULTIPLE ITEMS ===');

    for (let i = 0; i < Math.min(5, feed.items.length); i++) {
        const item = feed.items[i];
        console.log(`\n--- Item ${i + 1} ---`);
        console.log('Title:', item.title);
        console.log('Link (item.link):', item.link);
        console.log('GUID:', item.guid);

        // Check if there are other URL properties
        console.log('All properties:', Object.keys(item));

        // Look for URLs in content
        const content = item.contentSnippet || item.content || '';
        const urlMatches = content.match(/https?:\/\/[^\s<>"{}|\\^`[\]]+/gi) || [];
        console.log('URLs found in content:', urlMatches);

        // Check if Reddit post links to external content
        if (item.link && !item.link.includes('reddit.com')) {
            console.log('🎯 EXTERNAL LINK FOUND:', item.link);
        }
    }
}

inspectRedditRSSStructure().catch(console.error);