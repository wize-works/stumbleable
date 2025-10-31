/**
 * Repair Topic Mismatches Script
 * 
 * This script fixes ALL existing mismatches between content.topics TEXT[] and content_topics junction table.
 * It handles BOTH directions:
 * - Positive diffs: Topics in TEXT[] but missing from junction → ADD to junction
 * - Negative diffs: Topics in junction but missing from TEXT[] → REMOVE from junction OR ADD to TEXT[]
 * 
 * Strategy: TEXT[] is source of truth (set by classifiers), junction table is derived.
 * So we sync TEXT[] → junction table (one-way).
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });
const { createClient } = require('@supabase/supabase-js');
const readline = require('readline');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Command line flag for auto-confirm
const autoConfirm = process.argv.includes('--yes') || process.argv.includes('-y');

async function askConfirmation(message) {
    if (autoConfirm) {
        console.log(`${message} (auto-confirmed)`);
        return true;
    }

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    return new Promise((resolve) => {
        rl.question(`${message} (y/N): `, (answer) => {
            rl.close();
            resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
        });
    });
}

async function repairTopicMismatches() {
    console.log('🔧 Topic Mismatch Repair Tool\n');
    console.log('This will sync content.topics TEXT[] → content_topics junction table');
    console.log('Strategy: TEXT[] is source of truth, junction is derived\n');

    try {
        // Step 1: Get all topics
        console.log('1️⃣  Fetching topics...');
        const { data: allTopics, error: topicsError } = await supabase
            .from('topics')
            .select('id, name')
            .order('name');

        if (topicsError) {
            console.error('❌ Error fetching topics:', topicsError);
            return;
        }

        const topicMap = new Map(allTopics.map(t => [t.name, t.id]));
        const topicIdToName = new Map(allTopics.map(t => [t.id, t.name]));
        console.log(`   ✅ Found ${allTopics.length} topics\n`);

        // Step 2: Get all content with topics (batch fetch to avoid 1000 row limit)
        console.log('2️⃣  Fetching content with topics...');
        let allContent = [];
        let from = 0;
        const batchSize = 1000;

        while (true) {
            const { data: batch, error: contentError } = await supabase
                .from('content')
                .select('id, topics')
                .not('topics', 'is', null)
                .range(from, from + batchSize - 1);

            if (contentError) {
                console.error('❌ Error fetching content:', contentError);
                return;
            }

            if (!batch || batch.length === 0) break;

            allContent = allContent.concat(batch);
            from += batchSize;

            if (from % 5000 === 0) {
                console.log(`   ... fetched ${from} items so far`);
            }

            if (batch.length < batchSize) break;
        }

        console.log(`   ✅ Found ${allContent.length} content items with topics\n`);

        // Step 3: Get all junction entries (batch fetch)
        console.log('3️⃣  Fetching junction table entries...');
        let allJunction = [];
        from = 0;

        while (true) {
            const { data: batch, error: junctionError } = await supabase
                .from('content_topics')
                .select('content_id, topic_id')
                .range(from, from + batchSize - 1);

            if (junctionError) {
                console.error('❌ Error fetching junction table:', junctionError);
                return;
            }

            if (!batch || batch.length === 0) break;

            allJunction = allJunction.concat(batch);
            from += batchSize;

            if (from % 5000 === 0) {
                console.log(`   ... fetched ${from} entries so far`);
            }

            if (batch.length < batchSize) break;
        }

        console.log(`   ✅ Found ${allJunction.length} junction entries\n`);

        // Step 4: Build maps for comparison
        console.log('4️⃣  Analyzing mismatches...');

        // Map: content_id → Set of topic IDs from junction table
        const junctionMap = new Map();
        allJunction.forEach(entry => {
            if (!junctionMap.has(entry.content_id)) {
                junctionMap.set(entry.content_id, new Set());
            }
            junctionMap.get(entry.content_id).add(entry.topic_id);
        });

        // Map: content_id → Set of topic IDs from TEXT[] array
        const textArrayMap = new Map();
        let invalidTopicsCount = 0;
        const invalidTopicsSet = new Set();

        allContent.forEach(item => {
            const validTopicIds = new Set();

            if (Array.isArray(item.topics)) {
                item.topics.forEach(topicName => {
                    const topicId = topicMap.get(topicName);
                    if (topicId) {
                        validTopicIds.add(topicId);
                    } else {
                        invalidTopicsCount++;
                        invalidTopicsSet.add(topicName);
                    }
                });
            }

            if (validTopicIds.size > 0) {
                textArrayMap.set(item.id, validTopicIds);
            }
        });

        console.log(`   ℹ️  Found ${invalidTopicsCount} invalid topic references in TEXT[] arrays`);
        console.log(`   ℹ️  Unique invalid topics: ${invalidTopicsSet.size}\n`);

        // Step 5: Calculate what needs to be fixed
        const toAdd = []; // { content_id, topic_id } to add to junction
        const toRemove = []; // { content_id, topic_id } to remove from junction

        // Check each content item
        textArrayMap.forEach((textTopicIds, contentId) => {
            const junctionTopicIds = junctionMap.get(contentId) || new Set();

            // Find missing in junction (need to add)
            textTopicIds.forEach(topicId => {
                if (!junctionTopicIds.has(topicId)) {
                    toAdd.push({ content_id: contentId, topic_id: topicId });
                }
            });

            // Find orphaned in junction (need to remove)
            junctionTopicIds.forEach(topicId => {
                if (!textTopicIds.has(topicId)) {
                    toRemove.push({ content_id: contentId, topic_id: topicId });
                }
            });
        });

        // Also check for content with junction entries but no TEXT[] topics
        junctionMap.forEach((junctionTopicIds, contentId) => {
            if (!textArrayMap.has(contentId)) {
                // Content has junction entries but no valid TEXT[] topics
                junctionTopicIds.forEach(topicId => {
                    toRemove.push({ content_id: contentId, topic_id: topicId });
                });
            }
        });

        console.log('5️⃣  Repair Summary:');
        console.log(`   📊 Missing in junction table: ${toAdd.length} entries`);
        console.log(`   📊 Orphaned in junction table: ${toRemove.length} entries`);
        console.log(`   📊 Total changes needed: ${toAdd.length + toRemove.length}\n`);

        if (toAdd.length === 0 && toRemove.length === 0) {
            console.log('✅ No mismatches found! Data is already in sync.\n');
            return;
        }

        // Show breakdown by topic
        console.log('6️⃣  Changes by Topic:');
        const topicChanges = new Map();

        toAdd.forEach(({ topic_id }) => {
            const name = topicIdToName.get(topic_id);
            if (!topicChanges.has(name)) {
                topicChanges.set(name, { add: 0, remove: 0 });
            }
            topicChanges.get(name).add++;
        });

        toRemove.forEach(({ topic_id }) => {
            const name = topicIdToName.get(topic_id);
            if (!topicChanges.has(name)) {
                topicChanges.set(name, { add: 0, remove: 0 });
            }
            topicChanges.get(name).remove++;
        });

        const sortedTopics = Array.from(topicChanges.entries())
            .sort((a, b) => {
                const totalA = a[1].add + a[1].remove;
                const totalB = b[1].add + b[1].remove;
                return totalB - totalA;
            });

        sortedTopics.slice(0, 20).forEach(([name, { add, remove }]) => {
            const addStr = add > 0 ? `+${add}` : '';
            const removeStr = remove > 0 ? `-${remove}` : '';
            const total = add + remove;
            console.log(`   ${name.padEnd(30)} ${addStr.padStart(6)} ${removeStr.padStart(6)} (${total} changes)`);
        });

        if (sortedTopics.length > 20) {
            console.log(`   ... and ${sortedTopics.length - 20} more topics\n`);
        } else {
            console.log('');
        }

        // Step 6: Confirm and execute
        const confirmed = await askConfirmation('\n⚠️  Proceed with repairs?');

        if (!confirmed) {
            console.log('❌ Repair cancelled by user.\n');
            return;
        }

        console.log('\n7️⃣  Applying repairs...\n');

        let addedCount = 0;
        let removedCount = 0;
        let addErrors = 0;
        let removeErrors = 0;

        // Add missing entries (batch insert)
        if (toAdd.length > 0) {
            console.log(`   ➕ Adding ${toAdd.length} missing junction entries...`);

            const batchSize = 1000;
            for (let i = 0; i < toAdd.length; i += batchSize) {
                const batch = toAdd.slice(i, i + batchSize);
                const entries = batch.map(({ content_id, topic_id }) => ({
                    content_id,
                    topic_id,
                    confidence_score: 0.8 // Default confidence for repair
                }));

                const { error: insertError } = await supabase
                    .from('content_topics')
                    .upsert(entries, {
                        onConflict: 'content_id,topic_id',
                        ignoreDuplicates: true
                    });

                if (insertError) {
                    console.error(`   ⚠️  Error inserting batch ${i}-${i + batch.length}:`, insertError.message);
                    addErrors += batch.length;
                } else {
                    addedCount += batch.length;
                    if ((i + batch.length) % 5000 === 0 || i + batch.length >= toAdd.length) {
                        console.log(`      Progress: ${i + batch.length}/${toAdd.length}`);
                    }
                }
            }
            console.log(`   ✅ Added ${addedCount} entries (${addErrors} errors)\n`);
        }

        // Remove orphaned entries (batch delete)
        if (toRemove.length > 0) {
            console.log(`   🗑️  Removing ${toRemove.length} orphaned junction entries...`);

            // Group by content_id for efficient deletion
            const removeByContent = new Map();
            toRemove.forEach(({ content_id, topic_id }) => {
                if (!removeByContent.has(content_id)) {
                    removeByContent.set(content_id, []);
                }
                removeByContent.get(content_id).push(topic_id);
            });

            for (const [contentId, topicIds] of removeByContent.entries()) {
                const { error: deleteError } = await supabase
                    .from('content_topics')
                    .delete()
                    .eq('content_id', contentId)
                    .in('topic_id', topicIds);

                if (deleteError) {
                    console.error(`   ⚠️  Error removing entries for content ${contentId}:`, deleteError.message);
                    removeErrors += topicIds.length;
                } else {
                    removedCount += topicIds.length;
                }

                if (removedCount % 1000 === 0 || removedCount >= toRemove.length) {
                    console.log(`      Progress: ${removedCount}/${toRemove.length}`);
                }
            }
            console.log(`   ✅ Removed ${removedCount} entries (${removeErrors} errors)\n`);
        }

        // Step 7: Final summary
        console.log('8️⃣  Repair Complete!\n');
        console.log('   📊 Summary:');
        console.log(`      Added to junction:   ${addedCount}`);
        console.log(`      Removed from junction: ${removedCount}`);
        console.log(`      Total changes:       ${addedCount + removedCount}`);
        console.log(`      Errors:              ${addErrors + removeErrors}\n`);

        if (addErrors + removeErrors > 0) {
            console.log('   ⚠️  Some errors occurred during repair. Check logs above for details.\n');
        }

        console.log('   ✅ Topics are now in sync between TEXT[] and junction table!');
        console.log('   ℹ️  Run `node count-topics.js` to verify the repair.\n');

    } catch (error) {
        console.error('❌ Repair failed:', error);
        process.exit(1);
    }
}

// Run the repair
repairTopicMismatches()
    .then(() => {
        console.log('🏁 Repair process completed');
        process.exit(0);
    })
    .catch(error => {
        console.error('💥 Repair process error:', error);
        process.exit(1);
    });
