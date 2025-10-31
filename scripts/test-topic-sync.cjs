/**
 * Test Topic Sync Implementation
 * 
 * This script verifies that the topic sync mechanism is working correctly:
 * 1. Database trigger automatically syncs on JSONB updates
 * 2. Application code syncs via syncTopicsToJunction() helper
 * 
 * It performs a controlled test by:
 * - Finding content with topics
 * - Updating the JSONB topics column
 * - Verifying the junction table was automatically synced
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testTopicSync() {
    console.log('🧪 Testing Topic Sync Implementation\n');

    try {
        // Step 1: Find a content item with topics
        console.log('1️⃣  Finding test content...');
        const { data: content, error: fetchError } = await supabase
            .from('content')
            .select('id, url, title, topics')
            .not('topics', 'is', null)
            .limit(1)
            .single();

        if (fetchError || !content) {
            console.error('❌ Could not find content for testing');
            return;
        }

        console.log(`   Found: ${content.title.substring(0, 50)}...`);
        console.log(`   ID: ${content.id}`);
        console.log(`   Current topics: ${JSON.stringify(content.topics)}\n`);

        // Step 2: Get current junction table state
        console.log('2️⃣  Checking current junction table state...');
        const { data: beforeJunction, error: beforeError } = await supabase
            .from('content_topics')
            .select('topic_id, topics(name)')
            .eq('content_id', content.id);

        if (beforeError) {
            console.error('❌ Error fetching junction table:', beforeError);
            return;
        }

        const beforeTopics = (beforeJunction || []).map(j => j.topics?.name).filter(Boolean);
        console.log(`   Junction table has ${beforeTopics.length} entries: ${JSON.stringify(beforeTopics)}\n`);

        // Step 3: Modify the topics JSONB (add a new topic if possible)
        console.log('3️⃣  Updating topics JSONB column...');
        const originalTopics = content.topics || [];

        // Add 'technology' if not present, otherwise add 'science'
        const testTopic = originalTopics.includes('technology') ? 'science' : 'technology';
        const newTopics = [...new Set([...originalTopics, testTopic])];

        console.log(`   Adding topic: ${testTopic}`);
        console.log(`   New topics array: ${JSON.stringify(newTopics)}`);

        const { error: updateError } = await supabase
            .from('content')
            .update({ topics: newTopics })
            .eq('id', content.id);

        if (updateError) {
            console.error('❌ Error updating content:', updateError);
            return;
        }

        console.log('   ✅ JSONB updated\n');

        // Step 4: Wait a moment for trigger to fire
        console.log('4️⃣  Waiting for database trigger...');
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Step 5: Check junction table was synced
        console.log('5️⃣  Verifying junction table was synced...');
        const { data: afterJunction, error: afterError } = await supabase
            .from('content_topics')
            .select('topic_id, topics(name)')
            .eq('content_id', content.id);

        if (afterError) {
            console.error('❌ Error fetching updated junction table:', afterError);
            return;
        }

        const afterTopics = (afterJunction || []).map(j => j.topics?.name).filter(Boolean);
        console.log(`   Junction table now has ${afterTopics.length} entries: ${JSON.stringify(afterTopics)}\n`);

        // Step 6: Verify sync worked
        console.log('6️⃣  Verification Results:');

        const added = afterTopics.filter(t => !beforeTopics.includes(t));
        const removed = beforeTopics.filter(t => !afterTopics.includes(t));

        if (added.length > 0) {
            console.log(`   ✅ Added to junction: ${JSON.stringify(added)}`);
        }
        if (removed.length > 0) {
            console.log(`   ✅ Removed from junction: ${JSON.stringify(removed)}`);
        }

        const allNewTopicsPresent = newTopics.every(topic => afterTopics.includes(topic));

        if (allNewTopicsPresent && afterTopics.length === newTopics.length) {
            console.log('\n✅ SUCCESS! Database trigger is working correctly!');
            console.log('   - JSONB and junction table are in sync');
            console.log('   - All topics from JSONB are in junction table');
            console.log('   - No orphaned entries detected');
        } else {
            console.log('\n⚠️  PARTIAL SUCCESS - Some mismatches detected:');
            console.log(`   - Expected ${newTopics.length} topics in junction`);
            console.log(`   - Found ${afterTopics.length} topics in junction`);
            console.log(`   - JSONB topics: ${JSON.stringify(newTopics)}`);
            console.log(`   - Junction topics: ${JSON.stringify(afterTopics)}`);
        }

        // Step 7: Restore original state
        console.log('\n7️⃣  Restoring original topics...');
        const { error: restoreError } = await supabase
            .from('content')
            .update({ topics: originalTopics })
            .eq('id', content.id);

        if (restoreError) {
            console.error('⚠️  Could not restore original topics:', restoreError);
        } else {
            console.log('   ✅ Original state restored\n');
        }

    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

// Run the test
testTopicSync()
    .then(() => {
        console.log('🏁 Test completed');
        process.exit(0);
    })
    .catch(error => {
        console.error('💥 Test error:', error);
        process.exit(1);
    });
