/**
 * Content to Topic Alignment Analysis Script
 * 
 * This script analyzes the current state of topic assignments across all content:
 * - Total content count
 * - Content with topics in JSONB column
 * - Content with topics in content_topics junction table
 * - Content with no topics at all
 * - Topic distribution analysis
 * - Recommendations for backfilling
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
config({ path: resolve(__dirname, '../apis/discovery-service/.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_KEY environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

interface TopicStats {
    topicName: string;
    contentCount: number;
    avgConfidence?: number;
}

async function analyzeTopicAlignment() {
    console.log('🔍 Starting Content-to-Topic Alignment Analysis...\n');

    // 1. Total content count
    const { count: totalContent, error: totalError } = await supabase
        .from('content')
        .select('*', { count: 'exact', head: true });

    if (totalError) {
        console.error('❌ Error fetching total content:', totalError);
        return;
    }

    console.log(`📊 Total Content Items: ${totalContent}\n`);

    // 2. Content with topics in JSONB column
    const { data: jsonbTopics, error: jsonbError } = await supabase
        .from('content')
        .select('id, topics')
        .not('topics', 'is', null);

    if (jsonbError) {
        console.error('❌ Error fetching JSONB topics:', jsonbError);
        return;
    }

    const contentWithJsonbTopics = jsonbTopics?.filter(
        item => Array.isArray(item.topics) && item.topics.length > 0
    ) || [];

    console.log(`📋 Content with Topics in JSONB Column:`);
    console.log(`   Total: ${contentWithJsonbTopics.length}`);
    console.log(`   Percentage: ${((contentWithJsonbTopics.length / (totalContent || 1)) * 100).toFixed(2)}%\n`);

    // 3. Content with topics in junction table
    const { data: junctionTopics, error: junctionError } = await supabase
        .from('content_topics')
        .select('content_id');

    if (junctionError) {
        console.error('❌ Error fetching junction table topics:', junctionError);
        return;
    }

    const uniqueContentWithJunctionTopics = new Set(
        junctionTopics?.map(ct => ct.content_id) || []
    );

    console.log(`🔗 Content with Topics in Junction Table (content_topics):`);
    console.log(`   Total: ${uniqueContentWithJunctionTopics.size}`);
    console.log(`   Percentage: ${((uniqueContentWithJunctionTopics.size / (totalContent || 1)) * 100).toFixed(2)}%\n`);

    // 4. Content with NO topics at all
    // First get all content without junction table entries
    const contentIdsWithJunction = Array.from(uniqueContentWithJunctionTopics);

    const { data: noTopicsData, error: noTopicsError } = await supabase
        .from('content')
        .select('id, url, title, topics');

    if (noTopicsError) {
        console.error('❌ Error fetching content without topics:', noTopicsError);
        return;
    }

    // Filter for content with no topics in either place
    const contentWithNoTopics = noTopicsData?.filter(item => {
        const hasJunctionTopics = contentIdsWithJunction.includes(item.id);
        const hasJsonbTopics = Array.isArray(item.topics) && item.topics.length > 0;
        return !hasJunctionTopics && !hasJsonbTopics;
    }) || [];

    console.log(`❌ Content with NO Topics (neither JSONB nor junction table):`);
    console.log(`   Total: ${contentWithNoTopics.length}`);
    console.log(`   Percentage: ${((contentWithNoTopics.length / (totalContent || 1)) * 100).toFixed(2)}%\n`);

    // 5. Content with topics in BOTH places
    const contentInBoth = contentWithJsonbTopics.filter(
        item => uniqueContentWithJunctionTopics.has(item.id)
    );

    console.log(`✅ Content with Topics in BOTH JSONB and Junction Table:`);
    console.log(`   Total: ${contentInBoth.length}`);
    console.log(`   Percentage: ${((contentInBoth.length / (totalContent || 1)) * 100).toFixed(2)}%\n`);

    // 6. Content with topics ONLY in JSONB (needs junction table sync)
    const onlyJsonb = contentWithJsonbTopics.filter(
        item => !uniqueContentWithJunctionTopics.has(item.id)
    );

    console.log(`⚠️  Content with Topics ONLY in JSONB (needs junction sync):`);
    console.log(`   Total: ${onlyJsonb.length}`);
    console.log(`   Percentage: ${((onlyJsonb.length / (totalContent || 1)) * 100).toFixed(2)}%\n`);

    // 7. Content with topics ONLY in junction table (unusual)
    const onlyJunction = Array.from(uniqueContentWithJunctionTopics).filter(
        contentId => !contentWithJsonbTopics.some(item => item.id === contentId)
    );

    console.log(`🔄 Content with Topics ONLY in Junction Table (unusual):`);
    console.log(`   Total: ${onlyJunction.length}`);
    console.log(`   Percentage: ${((onlyJunction.length / (totalContent || 1)) * 100).toFixed(2)}%\n`);

    // 8. Topic distribution in junction table
    const { data: topicDistribution, error: distError } = await supabase
        .from('content_topics')
        .select(`
            topic_id,
            topics(name),
            confidence_score
        `);

    if (distError) {
        console.error('❌ Error fetching topic distribution:', distError);
        return;
    }

    const topicStats: Map<string, TopicStats> = new Map();
    let totalConfidenceSum = 0;
    let confidenceCount = 0;

    topicDistribution?.forEach((ct: any) => {
        const topicName = ct.topics?.name || 'Unknown';
        const existing = topicStats.get(topicName);

        if (existing) {
            existing.contentCount++;
            if (ct.confidence_score) {
                const currentAvg = existing.avgConfidence || 0;
                const currentCount = existing.contentCount - 1;
                existing.avgConfidence = (currentAvg * currentCount + ct.confidence_score) / existing.contentCount;
            }
        } else {
            topicStats.set(topicName, {
                topicName,
                contentCount: 1,
                avgConfidence: ct.confidence_score || undefined
            });
        }

        if (ct.confidence_score) {
            totalConfidenceSum += ct.confidence_score;
            confidenceCount++;
        }
    });

    const sortedTopics = Array.from(topicStats.values())
        .sort((a, b) => b.contentCount - a.contentCount);

    console.log(`📊 Topic Distribution in Junction Table:`);
    console.log(`   Total Topics Used: ${sortedTopics.length}`);
    console.log(`   Average Confidence: ${(totalConfidenceSum / (confidenceCount || 1)).toFixed(3)}\n`);

    console.log(`   Top 15 Topics by Content Count:`);
    sortedTopics.slice(0, 15).forEach((stat, index) => {
        const confidence = stat.avgConfidence ? ` (avg confidence: ${stat.avgConfidence.toFixed(3)})` : '';
        console.log(`   ${(index + 1).toString().padStart(2)}. ${stat.topicName.padEnd(20)} - ${stat.contentCount.toString().padStart(5)} items${confidence}`);
    });

    // 9. Sample of content without topics
    if (contentWithNoTopics.length > 0) {
        console.log(`\n📝 Sample Content Without Topics (first 10):`);
        contentWithNoTopics.slice(0, 10).forEach((item, index) => {
            console.log(`   ${index + 1}. ${item.title}`);
            console.log(`      URL: ${item.url}`);
        });
    }

    // 10. Summary and Recommendations
    console.log(`\n\n📈 SUMMARY & RECOMMENDATIONS\n`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

    const percentWithNoTopics = (contentWithNoTopics.length / (totalContent || 1)) * 100;
    const percentOnlyJsonb = (onlyJsonb.length / (totalContent || 1)) * 100;

    if (percentWithNoTopics > 10) {
        console.log(`🚨 CRITICAL: ${percentWithNoTopics.toFixed(1)}% of content has NO topics assigned!`);
        console.log(`   → Run backfill script to classify ${contentWithNoTopics.length} items\n`);
    }

    if (percentOnlyJsonb > 5) {
        console.log(`⚠️  WARNING: ${percentOnlyJsonb.toFixed(1)}% of content has topics only in JSONB column!`);
        console.log(`   → Sync ${onlyJsonb.length} items to content_topics junction table\n`);
    }

    if (onlyJunction.length > 0) {
        console.log(`ℹ️  INFO: ${onlyJunction.length} items have topics only in junction table`);
        console.log(`   → Consider syncing to JSONB column for consistency\n`);
    }

    const wellAlignedPercent = (contentInBoth.length / (totalContent || 1)) * 100;
    console.log(`✅ ${wellAlignedPercent.toFixed(1)}% of content is well-aligned (topics in both places)\n`);

    console.log(`Recommended Actions:`);
    console.log(`1. Run backfill script for ${contentWithNoTopics.length} items with no topics`);
    console.log(`2. Sync ${onlyJsonb.length} items from JSONB to junction table`);
    console.log(`3. Consider reverse sync for ${onlyJunction.length} junction-only items`);
    console.log(`4. Goal: Achieve 100% alignment with topics in both JSONB and junction table\n`);
}

// Run the analysis
analyzeTopicAlignment()
    .then(() => {
        console.log('✅ Analysis complete!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Analysis failed:', error);
        process.exit(1);
    });
