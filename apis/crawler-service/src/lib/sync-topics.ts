/**
 * Topic Synchronization Utilities
 * 
 * CRITICAL: Content topics are stored in TWO places:
 * 1. content.topics (JSONB array) - for denormalized fast reads
 * 2. content_topics (junction table) - for relational queries and filtering
 * 
 * These MUST stay in sync. This file provides utilities to ensure synchronization.
 */

import { supabase } from './supabase';

/**
 * Synchronizes topics from content.topics JSONB to content_topics junction table
 * 
 * This function ensures the relational junction table matches the JSONB array.
 * It handles:
 * - Deleting orphaned junction entries (topics removed from JSONB)
 * - Adding missing junction entries (topics added to JSONB)
 * 
 * @param contentId - The content ID to sync
 * @param topicNames - Array of topic names from the JSONB column
 * @returns Success status and details
 */
export async function syncTopicsToJunction(
    contentId: string,
    topicNames: string[]
): Promise<{ success: boolean; added: number; removed: number; error?: string }> {
    try {
        // Step 1: Look up topic IDs from topic names
        const { data: topicRecords, error: topicError } = await supabase
            .from('topics')
            .select('id, name')
            .in('name', topicNames);

        if (topicError) {
            console.error('Error fetching topic IDs:', topicError);
            return { success: false, added: 0, removed: 0, error: topicError.message };
        }

        const validTopicIds = (topicRecords || []).map(t => t.id);

        // Step 2: Get existing junction entries for this content
        const { data: existingJunction, error: junctionFetchError } = await supabase
            .from('content_topics')
            .select('topic_id')
            .eq('content_id', contentId);

        if (junctionFetchError) {
            console.error('Error fetching existing content_topics:', junctionFetchError);
            return { success: false, added: 0, removed: 0, error: junctionFetchError.message };
        }

        const existingTopicIds = (existingJunction || []).map(e => e.topic_id);

        // Step 3: Calculate differences
        const toAdd = validTopicIds.filter(id => !existingTopicIds.includes(id));
        const toRemove = existingTopicIds.filter(id => !validTopicIds.includes(id));

        let added = 0;
        let removed = 0;

        // Step 4: Remove orphaned entries
        if (toRemove.length > 0) {
            const { error: deleteError } = await supabase
                .from('content_topics')
                .delete()
                .eq('content_id', contentId)
                .in('topic_id', toRemove);

            if (deleteError) {
                console.error('Error removing orphaned content_topics:', deleteError);
            } else {
                removed = toRemove.length;
                console.log(`🗑️ Removed ${removed} orphaned topic links for content ${contentId}`);
            }
        }

        // Step 5: Add missing entries
        if (toAdd.length > 0) {
            const newEntries = toAdd.map(topicId => ({
                content_id: contentId,
                topic_id: topicId,
                confidence_score: 0.8 // Default confidence for sync operations
            }));

            const { error: insertError } = await supabase
                .from('content_topics')
                .insert(newEntries);

            if (insertError) {
                console.error('Error inserting content_topics:', insertError);
            } else {
                added = toAdd.length;
                console.log(`➕ Added ${added} topic links for content ${contentId}`);
            }
        }

        // Step 6: Report results
        if (added === 0 && removed === 0) {
            console.log(`✅ Topics already in sync for content ${contentId}`);
        } else {
            console.log(`🔄 Synced topics for content ${contentId}: +${added}, -${removed}`);
        }

        return { success: true, added, removed };

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('Unexpected error in syncTopicsToJunction:', error);
        return { success: false, added: 0, removed: 0, error: errorMessage };
    }
}

/**
 * Batch sync multiple content items
 * Useful for repair scripts or bulk operations
 * 
 * @param items - Array of {contentId, topicNames} to sync
 * @returns Summary of sync operations
 */
export async function batchSyncTopics(
    items: Array<{ contentId: string; topicNames: string[] }>
): Promise<{ total: number; succeeded: number; failed: number; totalAdded: number; totalRemoved: number }> {
    let succeeded = 0;
    let failed = 0;
    let totalAdded = 0;
    let totalRemoved = 0;

    for (const item of items) {
        const result = await syncTopicsToJunction(item.contentId, item.topicNames);
        if (result.success) {
            succeeded++;
            totalAdded += result.added;
            totalRemoved += result.removed;
        } else {
            failed++;
        }
    }

    return {
        total: items.length,
        succeeded,
        failed,
        totalAdded,
        totalRemoved
    };
}
