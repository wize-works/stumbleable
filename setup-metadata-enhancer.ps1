# Metadata Enhancement Script for Stumbleable Content
# This script fetches missing metadata for imported content records

Write-Host "🔍 Setting up metadata enhancement for imported content..." -ForegroundColor Yellow

# First, let's install necessary dependencies for web scraping
Write-Host "📦 Installing required dependencies..." -ForegroundColor Cyan
npm install --save cheerio node-fetch @types/node-fetch

# Create a simple metadata extraction service
$metadataServiceContent = @"
import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
);

interface ExtractedMetadata {
    title?: string;
    description?: string;
    imageUrl?: string;
    author?: string;
    publishedAt?: string;
    wordCount?: number;
    contentText?: string;
}

/**
 * Extract metadata from a webpage URL
 */
async function extractMetadata(url: string): Promise<ExtractedMetadata> {
    try {
        console.log(`📄 Fetching: `${url}`);
        
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            },
            timeout: 10000 // 10 second timeout
        });

        if (!response.ok) {
            throw new Error(`HTTP `${response.status}: `${response.statusText}`);
        }

        const html = await response.text();
        const $ = cheerio.load(html);

        const metadata: ExtractedMetadata = {};

        // Extract title
        metadata.title = 
            $('meta[property="og:title"]').attr('content') ||
            $('meta[name="twitter:title"]').attr('content') ||
            $('title').text() ||
            $('h1').first().text();

        // Extract description
        metadata.description = 
            $('meta[property="og:description"]').attr('content') ||
            $('meta[name="twitter:description"]').attr('content') ||
            $('meta[name="description"]').attr('content');

        // Extract image
        const ogImage = $('meta[property="og:image"]').attr('content');
        const twitterImage = $('meta[name="twitter:image"]').attr('content');
        const firstImg = $('img').first().attr('src');
        
        if (ogImage) metadata.imageUrl = resolveUrl(ogImage, url);
        else if (twitterImage) metadata.imageUrl = resolveUrl(twitterImage, url);
        else if (firstImg) metadata.imageUrl = resolveUrl(firstImg, url);

        // Extract author
        metadata.author = 
            $('meta[name="author"]').attr('content') ||
            $('meta[property="article:author"]').attr('content') ||
            $('.author').first().text() ||
            $('[rel="author"]').first().text();

        // Extract published date
        const publishedDate = 
            $('meta[property="article:published_time"]').attr('content') ||
            $('meta[name="date"]').attr('content') ||
            $('time[datetime]').attr('datetime') ||
            $('.date').first().text();

        if (publishedDate) {
            try {
                metadata.publishedAt = new Date(publishedDate).toISOString();
            } catch (e) {
                // Invalid date format, skip
            }
        }

        // Extract content text (article body)
        const contentSelectors = [
            'article', '.content', '.post-content', '.entry-content', 
            '.article-body', 'main', '.main-content'
        ];

        let contentText = '';
        for (const selector of contentSelectors) {
            const element = $(selector).first();
            if (element.length > 0) {
                contentText = element.text().trim();
                if (contentText.length > 100) break; // Good content found
            }
        }

        if (!contentText) {
            // Fallback to body text, but clean it up
            contentText = $('body').text()
                .replace(/\s+/g, ' ')
                .replace(/\n+/g, ' ')
                .trim()
                .substring(0, 5000); // Limit to 5000 chars
        }

        if (contentText) {
            metadata.contentText = contentText;
            metadata.wordCount = contentText.split(/\s+/).length;
        }

        console.log(`✅ Extracted metadata for: `${url}`);
        return metadata;

    } catch (error) {
        console.error(`❌ Failed to extract metadata from `${url}`:`, error);
        return {};
    }
}

/**
 * Resolve relative URLs to absolute URLs
 */
function resolveUrl(url: string, baseUrl: string): string {
    try {
        return new URL(url, baseUrl).href;
    } catch {
        return url;
    }
}

/**
 * Update content record with extracted metadata  
 */
async function updateContentMetadata(contentId: string, metadata: ExtractedMetadata) {
    const updateData: any = {};
    
    if (metadata.imageUrl) updateData.image_url = metadata.imageUrl;
    if (metadata.author) updateData.author = metadata.author;
    if (metadata.publishedAt) updateData.published_at = metadata.publishedAt;
    if (metadata.wordCount) updateData.word_count = metadata.wordCount;
    if (metadata.contentText) updateData.content_text = metadata.contentText;

    if (Object.keys(updateData).length > 0) {
        const { error } = await supabase
            .from('content')
            .update(updateData)
            .eq('id', contentId);

        if (error) {
            console.error(`Failed to update content `${contentId}`:`, error);
        } else {
            console.log(`📝 Updated content `${contentId}` with `${Object.keys(updateData).length}` fields`);
        }
    }
}

/**
 * Process all content records that need metadata enhancement
 */
async function enhanceAllContent() {
    console.log('🚀 Starting metadata enhancement process...');

    // Get content records that need enhancement (recent imports without metadata)
    const { data: contentRecords, error } = await supabase
        .from('content')
        .select('id, url, title')
        .is('image_url', null)
        .or('author.is.null,published_at.is.null,word_count.is.null')
        .order('created_at', { ascending: false })
        .limit(50); // Process 50 at a time to avoid overwhelming

    if (error) {
        console.error('Error fetching content records:', error);
        return;
    }

    if (!contentRecords || contentRecords.length === 0) {
        console.log('✅ No content records need metadata enhancement');
        return;
    }

    console.log(`📊 Found `${contentRecords.length}` records to enhance`);

    let processed = 0;
    let enhanced = 0;

    for (const record of contentRecords) {
        try {
            console.log(`\\n[`${processed + 1}/`${contentRecords.length}] Processing: `${record.url}`);
            
            const metadata = await extractMetadata(record.url);
            
            if (Object.keys(metadata).length > 0) {
                await updateContentMetadata(record.id, metadata);
                enhanced++;
            }
            
            processed++;
            
            // Rate limiting - wait 1 second between requests
            await new Promise(resolve => setTimeout(resolve, 1000));
            
        } catch (error) {
            console.error(`Error processing `${record.url}`:`, error);
            processed++;
        }
    }

    console.log(`\\n🎉 Enhancement complete!`);
    console.log(`   Processed: `${processed}` records`);
    console.log(`   Enhanced: `${enhanced}` records`);
}

// Run the enhancement process
if (require.main === module) {
    enhanceAllContent()
        .then(() => process.exit(0))
        .catch(error => {
            console.error('Fatal error:', error);
            process.exit(1);
        });
}

export { extractMetadata, updateContentMetadata, enhanceAllContent };
"@

# Save the metadata service
$metadataServiceContent | Out-File -FilePath "enhance-content-metadata.ts" -Encoding UTF8

Write-Host "✅ Created enhance-content-metadata.ts" -ForegroundColor Green

# Create a package.json for the script
$packageContent = @"
{
  "name": "stumbleable-metadata-enhancer",
  "version": "1.0.0",
  "description": "Metadata enhancement service for Stumbleable content",
  "main": "enhance-content-metadata.ts",
  "scripts": {
    "enhance": "tsx enhance-content-metadata.ts",
    "dev": "tsx watch enhance-content-metadata.ts"
  },
  "dependencies": {
    "@supabase/supabase-js": "^2.58.0",
    "cheerio": "^1.0.0-rc.12",
    "node-fetch": "^3.3.2",
    "dotenv": "^16.6.1"
  },
  "devDependencies": {
    "@types/node": "^20.5.0",
    "@types/node-fetch": "^2.6.11",
    "tsx": "^4.6.0",
    "typescript": "^5.1.6"
  }
}
"@

$packageContent | Out-File -FilePath "package.json" -Encoding UTF8

Write-Host "✅ Created package.json for metadata enhancer" -ForegroundColor Green

Write-Host "`n📋 Next Steps:" -ForegroundColor Blue
Write-Host "1. Install dependencies: npm install" -ForegroundColor White
Write-Host "2. Set up environment variables (.env):" -ForegroundColor White
Write-Host "   SUPABASE_URL=your_supabase_url" -ForegroundColor Gray
Write-Host "   SUPABASE_SERVICE_KEY=your_service_key" -ForegroundColor Gray
Write-Host "3. Run the enhancer: npm run enhance" -ForegroundColor White

Write-Host "`n🚀 Features of the metadata enhancer:" -ForegroundColor Yellow
Write-Host "• Extracts Open Graph metadata (title, description, image)" -ForegroundColor White
Write-Host "• Finds author information from various meta tags" -ForegroundColor White
Write-Host "• Extracts published dates from article metadata" -ForegroundColor White
Write-Host "• Counts words and extracts article content text" -ForegroundColor White
Write-Host "• Handles rate limiting (1 second between requests)" -ForegroundColor White
Write-Host "• Processes 50 records at a time to avoid overwhelming" -ForegroundColor White
Write-Host "• Updates only missing fields in the database" -ForegroundColor White

Write-Host "`n⚠️  Important Notes:" -ForegroundColor Red
Write-Host "• This will make HTTP requests to external websites" -ForegroundColor Yellow
Write-Host "• Some sites may block automated requests" -ForegroundColor Yellow
Write-Host "• Processing 2000 records will take ~35 minutes with rate limiting" -ForegroundColor Yellow
Write-Host "• Consider running this in smaller batches during off-peak hours" -ForegroundColor Yellow