/**
 * Count Content Items by Topic
 * 
 * This script shows how many content items are assigned to each topic.
 * Useful for understanding content distribution and identifying gaps.
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_KEY environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function countTopics() {
    console.log('🔍 Analyzing content by topic...\n');

    try {
        // Get all topics
        console.log('📚 Fetching topics from database...');
        const { data: topics, error: topicsError } = await supabase
            .from('topics')
            .select('id, name, description, color')
            .order('name');

        if (topicsError) {
            throw new Error(`Failed to fetch topics: ${topicsError.message}`);
        }

        console.log(`✅ Found ${topics.length} topics\n`);

        // Count content items per topic using the junction table
        console.log('📊 Counting content items per topic...\n');

        const topicCounts = [];

        for (const topic of topics) {
            // Count using junction table
            const { count: junctionCount, error: junctionError } = await supabase
                .from('content_topics')
                .select('*', { count: 'exact', head: true })
                .eq('topic_id', topic.id);

            if (junctionError) {
                console.error(`⚠️ Error counting junction for ${topic.name}:`, junctionError.message);
                continue;
            }

            // Count using JSONB array (for comparison)
            const { count: jsonbCount, error: jsonbError } = await supabase
                .from('content')
                .select('*', { count: 'exact', head: true })
                .contains('topics', [topic.name]);

            if (jsonbError) {
                console.error(`⚠️ Error counting JSONB for ${topic.name}:`, jsonbError.message);
                continue;
            }

            topicCounts.push({
                name: topic.name,
                description: topic.description,
                color: topic.color,
                junctionCount: junctionCount || 0,
                jsonbCount: jsonbCount || 0
            });
        }

        // Sort by junction count (descending)
        topicCounts.sort((a, b) => b.junctionCount - a.junctionCount);

        // Display results
        console.log('═'.repeat(100));
        console.log('📊 CONTENT COUNT BY TOPIC');
        console.log('═'.repeat(100));
        console.log('');

        topicCounts.forEach(topic => {
            const countStr = `${topic.junctionCount.toLocaleString()}`.padStart(6);
            const nameStr = topic.name.padEnd(30);
            const mismatch = topic.junctionCount !== topic.jsonbCount ? ' ⚠️' : '';

            console.log(`${countStr}  ${nameStr}  ${topic.description || ''}${mismatch}`);
        });        // Summary statistics
        console.log('\n');
        console.log('═'.repeat(100));
        console.log('📈 SUMMARY');
        console.log('═'.repeat(100));

        const totalContentWithTopics = topicCounts.reduce((sum, t) => sum + t.junctionCount, 0);
        const topicsWithContent = topicCounts.filter(t => t.junctionCount > 0).length;
        const topicsWithoutContent = topicCounts.filter(t => t.junctionCount === 0).length;
        const avgPerTopic = totalContentWithTopics / topicsWithContent;

        console.log(`Total content assignments: ${totalContentWithTopics.toLocaleString()}`);
        console.log(`Topics with content:       ${topicsWithContent} / ${topics.length}`);
        console.log(`Topics without content:    ${topicsWithoutContent}`);
        console.log(`Average per topic:         ${avgPerTopic.toFixed(1)}`);

        // Show top 10 topics
        console.log('\n');
        console.log('🏆 TOP 10 TOPICS');
        console.log('─'.repeat(100));
        topicCounts.slice(0, 10).forEach((topic, index) => {
            const rank = `${index + 1}.`.padEnd(4);
            const count = `${topic.junctionCount.toLocaleString()}`.padStart(6);
            console.log(`${rank}${count}  ${topic.name}`);
        });

        // Show topics without content
        const emptyTopics = topicCounts.filter(t => t.junctionCount === 0);
        if (emptyTopics.length > 0) {
            console.log('\n');
            console.log('⚠️  TOPICS WITHOUT CONTENT');
            console.log('─'.repeat(100));
            emptyTopics.forEach(topic => {
                console.log(`   - ${topic.name}`);
            });
        }

        // Check for mismatches between junction table and JSONB
        const mismatches = topicCounts.filter(t => t.junctionCount !== t.jsonbCount);
        if (mismatches.length > 0) {
            console.log('\n');
            console.log('⚠️  DATA MISMATCHES (Junction Table ≠ JSONB Array)');
            console.log('─'.repeat(100));
            mismatches.forEach(topic => {
                console.log(`   ${topic.name}: Junction=${topic.junctionCount}, JSONB=${topic.jsonbCount}`);
            });
        }

        console.log('\n');

    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

countTopics();
