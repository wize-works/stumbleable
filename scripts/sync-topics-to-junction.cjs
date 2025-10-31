/**
 * Sync Topics to Junction Table
 * 
 * This script syncs topics from the content.topics JSONB column to the content_topics junction table.
 * 
 * Background:
 * - The content table has a topics column (JSONB array) for denormalized storage
 * - The content_topics junction table was added later for relational queries
 * - The createDiscovery() code SHOULD populate both, but appears not to be working
 * - This creates a massive data mismatch (e.g., sports: 2,061 JSONB vs 55 junction)
 * 
 * What this script does:
 * 1. Fetches all content items that have topics in JSONB column
 * 2. For each item, looks up the topic IDs from the topics table
 * 3. Inserts missing entries into content_topics junction table
 * 4. Skips entries that already exist (deduplication)
 * 
 * Usage:
 *   node scripts/sync-topics-to-junction.js
 */

const { createClient } = require('@supabase/supabase-js');
const readline = require('readline');
require('dotenv').config({ path: require('path').join(__dirname, '.env') });

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function ask(question) {
    return new Promise(resolve => rl.question(question, resolve));
}

async function main() {
    const autoConfirm = process.argv.includes('--yes');

    console.log('\n🔍 Topic Junction Table Sync Tool\n');
    console.log('This script will sync topics from content.topics (JSONB) to content_topics (junction table)');
    console.log('It will skip entries that already exist to avoid duplicates.\n');

    // Step 1: Count content items with topics
    console.log('📊 Analyzing content...\n');

    const { data: allContent, error: contentError } = await supabase
        .from('content')
        .select('id, topics')
        .not('topics', 'is', null);

    if (contentError) {
        console.error('❌ Error fetching content:', contentError);
        process.exit(1);
    }

    const contentWithTopics = allContent.filter(item =>
        item.topics && Array.isArray(item.topics) && item.topics.length > 0
    );

    console.log(`Total content items: ${allContent.length.toLocaleString()}`);
    console.log(`Content with topics: ${contentWithTopics.length.toLocaleString()}`);

    // Step 2: Count existing junction table entries
    const { data: existingJunction, error: junctionError } = await supabase
        .from('content_topics')
        .select('content_id, topic_id');

    if (junctionError) {
        console.error('❌ Error fetching junction table:', junctionError);
        process.exit(1);
    }

    console.log(`Existing junction entries: ${existingJunction.length.toLocaleString()}\n`);

    // Step 3: Create a Set of existing entries for fast lookup
    const existingSet = new Set(
        existingJunction.map(entry => `${entry.content_id}:${entry.topic_id}`)
    );

    // Step 4: Get all topics from topics table
    const { data: allTopics, error: topicsError } = await supabase
        .from('topics')
        .select('id, name');

    if (topicsError) {
        console.error('❌ Error fetching topics:', topicsError);
        process.exit(1);
    }

    const topicNameToId = new Map(
        allTopics.map(topic => [topic.name.toLowerCase(), topic.id])
    );

    console.log(`📚 Found ${allTopics.length} topics in topics table\n`);

    // Step 5: Build list of inserts needed
    const insertsNeeded = [];
    const stats = {
        itemsProcessed: 0,
        itemsWithValidTopics: 0,
        totalTopicsInJsonb: 0,
        alreadyInJunction: 0,
        needsInsert: 0,
        unknownTopics: new Set()
    };

    console.log('🔍 Analyzing what needs to be synced...\n');

    for (const content of contentWithTopics) {
        stats.itemsProcessed++;
        let hasValidTopic = false;

        for (const topicName of content.topics) {
            stats.totalTopicsInJsonb++;
            const topicId = topicNameToId.get(topicName.toLowerCase());

            if (!topicId) {
                stats.unknownTopics.add(topicName);
                continue;
            }

            hasValidTopic = true;
            const key = `${content.id}:${topicId}`;

            if (existingSet.has(key)) {
                stats.alreadyInJunction++;
            } else {
                stats.needsInsert++;
                insertsNeeded.push({
                    content_id: content.id,
                    topic_id: topicId,
                    confidence_score: 0.8 // Default confidence
                });
            }
        }

        if (hasValidTopic) {
            stats.itemsWithValidTopics++;
        }

        if (stats.itemsProcessed % 1000 === 0) {
            process.stdout.write(`\rProcessed ${stats.itemsProcessed.toLocaleString()} items...`);
        }
    }

    console.log(`\r✅ Processed ${stats.itemsProcessed.toLocaleString()} items\n`);

    // Step 6: Display summary
    console.log('📊 SYNC ANALYSIS SUMMARY:\n');
    console.log(`Content items with topics in JSONB: ${stats.itemsWithValidTopics.toLocaleString()}`);
    console.log(`Total topic assignments in JSONB:  ${stats.totalTopicsInJsonb.toLocaleString()}`);
    console.log(`Already in junction table:          ${stats.alreadyInJunction.toLocaleString()}`);
    console.log(`Need to be inserted:                ${stats.needsInsert.toLocaleString()}\n`);

    if (stats.unknownTopics.size > 0) {
        console.log(`⚠️  WARNING: Found ${stats.unknownTopics.size} topic(s) in JSONB that don't exist in topics table:`);
        const sortedUnknown = Array.from(stats.unknownTopics).sort();
        sortedUnknown.slice(0, 10).forEach(topic => console.log(`   - ${topic}`));
        if (sortedUnknown.length > 10) {
            console.log(`   ... and ${sortedUnknown.length - 10} more\n`);
        }
    }

    if (insertsNeeded.length === 0) {
        console.log('✅ No sync needed - junction table is already up to date!\n');
        rl.close();
        return;
    }

    // Step 7: Confirm before proceeding
    console.log(`\n⚠️  This will insert ${insertsNeeded.length.toLocaleString()} new entries into content_topics table.\n`);

    if (!autoConfirm) {
        const answer = await ask('Do you want to proceed? (yes/no): ');
        if (answer.toLowerCase() !== 'yes') {
            console.log('\n❌ Sync cancelled by user\n');
            rl.close();
            return;
        }
    } else {
        console.log('Auto-confirming (--yes flag provided)\n');
    }

    // Step 8: Insert in batches (use upsert to handle duplicates gracefully)
    console.log('\n📝 Inserting junction table entries...\n');
    const BATCH_SIZE = 1000;
    let inserted = 0;
    let skipped = 0;
    let errors = 0;

    for (let i = 0; i < insertsNeeded.length; i += BATCH_SIZE) {
        const batch = insertsNeeded.slice(i, i + BATCH_SIZE);

        // Use upsert with onConflict to skip duplicates instead of erroring
        const { data, error: insertError } = await supabase
            .from('content_topics')
            .upsert(batch, {
                onConflict: 'content_id,topic_id',
                ignoreDuplicates: true
            })
            .select();

        if (insertError) {
            console.error(`❌ Error inserting batch ${Math.floor(i / BATCH_SIZE) + 1}:`, insertError);
            errors += batch.length;
        } else {
            const actualInserted = data?.length || 0;
            inserted += actualInserted;
            skipped += (batch.length - actualInserted);
        }

        process.stdout.write(`\rProgress: ${inserted.toLocaleString()} inserted, ${skipped.toLocaleString()} skipped / ${insertsNeeded.length.toLocaleString()} total (${Math.round((inserted + skipped) / insertsNeeded.length * 100)}%)`);

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
    }    // Step 9: Final summary
    console.log('\n');
    console.log('\n✅ SYNC COMPLETE!\n');
    console.log(`Successfully inserted: ${inserted.toLocaleString()}`);
    console.log(`Skipped (duplicates):  ${skipped.toLocaleString()}`);
    if (errors > 0) {
        console.log(`Failed to insert:      ${errors.toLocaleString()}`);
    }
    console.log('\n💡 Tip: Run "node scripts/count-topics.cjs" to verify the sync worked\n');

    rl.close();
}

main().catch(error => {
    console.error('\n❌ Unexpected error:', error);
    rl.close();
    process.exit(1);
});
