/**
 * Sync Junction Table to JSONB Topics
 * 
 * This script syncs topics from the content_topics junction table
 * back to the content.topics JSONB column for consistency.
 * 
 * Target: 629 items that have topics in junction table but not in JSONB
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

config({ path: resolve(__dirname, '../apis/discovery-service/.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function syncJunctionToJsonb() {
    console.log('🔄 Starting Junction Table → JSONB Sync...\n');

    // 1. Get all content with JSONB topics
    const { data: jsonbContent } = await supabase
        .from('content')
        .select('id, topics')
        .not('topics', 'is', null);

    const contentWithJsonbTopics = new Set(
        jsonbContent?.filter(item => Array.isArray(item.topics) && item.topics.length > 0).map(c => c.id) || []
    );

    // 2. Get all content_topics with topic names
    const { data: junctionData, error: junctionError } = await supabase
        .from('content_topics')
        .select(`
            content_id,
            topics(name)
        `);

    if (junctionError || !junctionData) {
        console.error('❌ Error fetching junction data:', junctionError);
        return;
    }

    // Group by content_id
    const contentTopicsMap = new Map<string, string[]>();
    (junctionData as any[]).forEach(ct => {
        const contentId = ct.content_id;
        const topicName = ct.topics?.name;

        if (topicName) {
            if (!contentTopicsMap.has(contentId)) {
                contentTopicsMap.set(contentId, []);
            }
            contentTopicsMap.get(contentId)!.push(topicName);
        }
    });

    // 3. Filter for content that has junction topics but no JSONB topics
    const contentToSync = Array.from(contentTopicsMap.entries())
        .filter(([contentId]) => !contentWithJsonbTopics.has(contentId));

    console.log(`📊 Found ${contentToSync.length} items to sync\n`);

    let syncedCount = 0;
    let errorCount = 0;

    // 4. Process in batches
    const batchSize = 50;
    for (let i = 0; i < contentToSync.length; i += batchSize) {
        const batch = contentToSync.slice(i, i + batchSize);
        const batchNumber = Math.floor(i / batchSize) + 1;
        const totalBatches = Math.ceil(contentToSync.length / batchSize);

        console.log(`Processing batch ${batchNumber}/${totalBatches}...`);

        for (const [contentId, topics] of batch) {
            const { error: updateError } = await supabase
                .from('content')
                .update({ topics })
                .eq('id', contentId);

            if (updateError) {
                console.error(`   ❌ Error updating content ${contentId}:`, updateError.message);
                errorCount++;
            } else {
                syncedCount++;
            }
        }

        const processed = Math.min(i + batchSize, contentToSync.length);
        console.log(`   ✅ Synced: ${syncedCount}, ❌ Errors: ${errorCount} (${processed}/${contentToSync.length})\n`);
    }

    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
    console.log(`✅ Sync Complete!`);
    console.log(`   Successfully synced: ${syncedCount}`);
    console.log(`   Errors: ${errorCount}\n`);
}

syncJunctionToJsonb()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('❌ Script failed:', error);
        process.exit(1);
    });
