/**
 * Sync JSONB Topics to Junction Table
 * 
 * This script syncs topics from the content.topics JSONB column
 * to the content_topics junction table for proper relational queries.
 * 
 * Target: 906 items that have topics in JSONB but not in junction table
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

async function syncJsonbToJunction() {
    console.log('🔄 Starting JSONB → Junction Table Sync...\n');

    // 1. Get all topics for lookup
    const { data: allTopics, error: topicsError } = await supabase
        .from('topics')
        .select('id, name');

    if (topicsError || !allTopics) {
        console.error('❌ Error fetching topics:', topicsError);
        return;
    }

    const topicMap = new Map(allTopics.map(t => [t.name.toLowerCase(), t.id]));
    console.log(`📋 Loaded ${topicMap.size} topics\n`);

    // 2. Get content with junction table entries
    const { data: junctionData } = await supabase
        .from('content_topics')
        .select('content_id');

    const contentIdsWithJunction = new Set(
        junctionData?.map(ct => ct.content_id) || []
    );

    // 3. Get content with JSONB topics
    const { data: jsonbContent, error: jsonbError } = await supabase
        .from('content')
        .select('id, topics')
        .not('topics', 'is', null);

    if (jsonbError || !jsonbContent) {
        console.error('❌ Error fetching JSONB content:', jsonbError);
        return;
    }

    // Filter for content that has JSONB topics but no junction entries
    const contentToSync = jsonbContent.filter(item => {
        const hasJsonbTopics = Array.isArray(item.topics) && item.topics.length > 0;
        const hasJunctionTopics = contentIdsWithJunction.has(item.id);
        return hasJsonbTopics && !hasJunctionTopics;
    });

    console.log(`📊 Found ${contentToSync.length} items to sync\n`);

    let syncedCount = 0;
    let errorCount = 0;
    let skippedCount = 0;

    // 4. Process in batches
    const batchSize = 50;
    for (let i = 0; i < contentToSync.length; i += batchSize) {
        const batch = contentToSync.slice(i, i + batchSize);
        const batchNumber = Math.floor(i / batchSize) + 1;
        const totalBatches = Math.ceil(contentToSync.length / batchSize);

        console.log(`Processing batch ${batchNumber}/${totalBatches}...`);

        for (const item of batch) {
            const topics = item.topics as string[];
            const junctionEntries: Array<{ content_id: string; topic_id: string; confidence_score: number }> = [];

            // Map topic names to IDs
            for (const topicName of topics) {
                const topicId = topicMap.get(topicName.toLowerCase());
                if (topicId) {
                    junctionEntries.push({
                        content_id: item.id,
                        topic_id: topicId,
                        confidence_score: 0.8
                    });
                } else {
                    console.log(`   ⚠️  Topic not found: ${topicName}`);
                }
            }

            if (junctionEntries.length > 0) {
                const { error: insertError } = await supabase
                    .from('content_topics')
                    .insert(junctionEntries);

                if (insertError) {
                    console.error(`   ❌ Error inserting for content ${item.id}:`, insertError.message);
                    errorCount++;
                } else {
                    syncedCount++;
                }
            } else {
                skippedCount++;
            }
        }

        // Progress update
        const processed = Math.min(i + batchSize, contentToSync.length);
        console.log(`   ✅ Synced: ${syncedCount}, ❌ Errors: ${errorCount}, ⊘ Skipped: ${skippedCount} (${processed}/${contentToSync.length})\n`);
    }

    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
    console.log(`✅ Sync Complete!`);
    console.log(`   Successfully synced: ${syncedCount}`);
    console.log(`   Errors: ${errorCount}`);
    console.log(`   Skipped (no valid topics): ${skippedCount}\n`);
}

syncJsonbToJunction()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('❌ Script failed:', error);
        process.exit(1);
    });
