'use client';

import { useToaster } from '@/components/toaster';
import { ModerationAPI, ModerationQueueItem } from '@/lib/api-client';
import { useState } from 'react';

interface ModerationQueueTabProps {
    items: ModerationQueueItem[];
    loading: boolean;
    onRefresh: () => void;
    token: string | null;
}

export default function ModerationQueueTab({ items, loading, onRefresh, token }: ModerationQueueTabProps) {
    const { showToast } = useToaster();
    const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
    const [processing, setProcessing] = useState<Set<string>>(new Set());

    const handleToggleSelection = (itemId: string) => {
        const newSelection = new Set(selectedItems);
        if (newSelection.has(itemId)) {
            newSelection.delete(itemId);
        } else {
            newSelection.add(itemId);
        }
        setSelectedItems(newSelection);
    };

    const handleToggleSelectAll = () => {
        if (selectedItems.size === items.length) {
            setSelectedItems(new Set());
        } else {
            setSelectedItems(new Set(items.map(item => item.id)));
        }
    };

    const handleReview = async (itemId: string, status: 'approved' | 'rejected', notes?: string) => {
        if (!token) {
            showToast('Authentication required', 'error');
            return;
        }

        setProcessing(prev => new Set(prev).add(itemId));

        try {
            await ModerationAPI.reviewContent(itemId, status, notes, token);
            showToast(`Content ${status} successfully`, 'success');
            onRefresh();
        } catch (error) {
            console.error('Error reviewing content:', error);
            showToast(`Failed to ${status === 'approved' ? 'approve' : 'reject'} content`, 'error');
        } finally {
            setProcessing(prev => {
                const next = new Set(prev);
                next.delete(itemId);
                return next;
            });
        }
    };

    const handleBulkAction = async (status: 'approved' | 'rejected') => {
        if (!token || selectedItems.size === 0) return;

        const confirmed = confirm(
            `Are you sure you want to ${status === 'approved' ? 'approve' : 'reject'} ${selectedItems.size} item(s)?`
        );

        if (!confirmed) return;

        try {
            const queueIds = Array.from(selectedItems);

            if (status === 'approved') {
                await ModerationAPI.bulkApprove(queueIds, undefined, token);
            } else {
                await ModerationAPI.bulkReject(queueIds, undefined, token);
            }

            showToast(`${selectedItems.size} item(s) ${status} successfully`, 'success');
            setSelectedItems(new Set());
            onRefresh();
        } catch (error) {
            console.error('Error with bulk action:', error);
            showToast('Failed to process bulk action', 'error');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="loading loading-spinner loading-lg"></div>
            </div>
        );
    }

    if (items.length === 0) {
        return (
            <div className="text-center py-12">
                <i className="fa-solid fa-duotone fa-check-circle text-6xl text-success mb-4"></i>
                <h3 className="text-lg font-semibold text-base-content mb-2">No pending content</h3>
                <p className="text-base-content/70">All submitted content has been reviewed.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Bulk Actions Bar */}
            {selectedItems.size > 0 && (
                <div className="bg-primary text-primary-content rounded-lg p-4 flex items-center justify-between">
                    <span className="font-semibold">{selectedItems.size} item(s) selected</span>
                    <div className="flex gap-2">
                        <button
                            className="btn btn-success btn-sm"
                            onClick={() => handleBulkAction('approved')}
                        >
                            <i className="fa-solid fa-duotone fa-check mr-2"></i>
                            Approve Selected
                        </button>
                        <button
                            className="btn btn-error btn-sm"
                            onClick={() => handleBulkAction('rejected')}
                        >
                            <i className="fa-solid fa-duotone fa-times mr-2"></i>
                            Reject Selected
                        </button>
                        <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => setSelectedItems(new Set())}
                        >
                            Clear Selection
                        </button>
                    </div>
                </div>
            )}

            {/* Select All Checkbox */}
            <div className="flex items-center gap-2 mb-4">
                <input
                    type="checkbox"
                    className="checkbox checkbox-sm"
                    checked={selectedItems.size === items.length && items.length > 0}
                    onChange={handleToggleSelectAll}
                />
                <label className="text-sm text-base-content/70">Select all ({items.length})</label>
            </div>

            {/* Queue Items */}
            {items.map((item) => {
                const isProcessing = processing.has(item.id);
                const isSelected = selectedItems.has(item.id);

                return (
                    <div
                        key={item.id}
                        className={`card bg-base-200 shadow-md ${isSelected ? 'ring-2 ring-primary' : ''}`}
                    >
                        <div className="card-body">
                            <div className="flex items-start gap-4">
                                {/* Selection Checkbox */}
                                <input
                                    type="checkbox"
                                    className="checkbox mt-1"
                                    checked={isSelected}
                                    onChange={() => handleToggleSelection(item.id)}
                                    disabled={isProcessing}
                                />

                                {/* Content */}
                                <div className="flex-1">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex-1">
                                            <h3 className="card-title text-base-content">{item.title}</h3>
                                            <a
                                                href={item.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-primary text-sm hover:underline"
                                            >
                                                {item.url}
                                            </a>
                                            {item.description && (
                                                <p className="text-base-content/80 text-sm mt-2">{item.description}</p>
                                            )}
                                        </div>
                                        {item.confidence_score !== undefined && (
                                            <div className="badge badge-warning ml-4">
                                                {Math.round(item.confidence_score * 100)}% confidence
                                            </div>
                                        )}
                                    </div>

                                    {/* Issues */}
                                    {item.issues && item.issues.length > 0 && (
                                        <div className="mb-4">
                                            <p className="text-sm font-semibold text-base-content mb-2">Issues detected:</p>
                                            <div className="flex flex-wrap gap-2">
                                                {item.issues.map((issue, index) => (
                                                    <span key={index} className="badge badge-error badge-sm">
                                                        {issue.replace(/-/g, ' ')}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Metadata */}
                                    <div className="text-sm text-base-content/70 space-y-1">
                                        <p>
                                            Domain: <span className="font-mono">{item.domain}</span>
                                        </p>
                                        <p>Submitted: {new Date(item.created_at).toLocaleString()}</p>
                                        {item.submitted_by_user && (
                                            <p>
                                                By: {item.submitted_by_user.full_name || item.submitted_by_user.email}
                                            </p>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    <div className="card-actions justify-end mt-4">
                                        <button
                                            className="btn btn-success btn-sm"
                                            onClick={() => handleReview(item.id, 'approved')}
                                            disabled={isProcessing}
                                        >
                                            {isProcessing ? (
                                                <span className="loading loading-spinner loading-xs"></span>
                                            ) : (
                                                <i className="fa-solid fa-duotone fa-check mr-2"></i>
                                            )}
                                            Approve
                                        </button>
                                        <button
                                            className="btn btn-error btn-sm"
                                            onClick={() => handleReview(item.id, 'rejected')}
                                            disabled={isProcessing}
                                        >
                                            {isProcessing ? (
                                                <span className="loading loading-spinner loading-xs"></span>
                                            ) : (
                                                <i className="fa-solid fa-duotone fa-times mr-2"></i>
                                            )}
                                            Reject
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
