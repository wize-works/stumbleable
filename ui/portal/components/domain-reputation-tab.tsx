'use client';

import { useToaster } from '@/components/toaster';
import { DomainReputation, ModerationAPI } from '@/lib/api-client';
import { useState } from 'react';

interface DomainReputationTabProps {
    domains: DomainReputation[];
    loading: boolean;
    onRefresh: () => void;
    token: string | null;
}

export default function DomainReputationTab({ domains, loading, onRefresh, token }: DomainReputationTabProps) {
    const { showToast } = useToaster();
    const [editingDomain, setEditingDomain] = useState<string | null>(null);
    const [editScore, setEditScore] = useState<number>(0);
    const [editNotes, setEditNotes] = useState<string>('');

    const startEditing = (domain: DomainReputation) => {
        setEditingDomain(domain.domain);
        setEditScore(domain.reputation_score);
        setEditNotes('');
    };

    const cancelEditing = () => {
        setEditingDomain(null);
        setEditScore(0);
        setEditNotes('');
    };

    const handleUpdateScore = async (domain: string) => {
        if (!token) {
            showToast('Authentication required', 'error');
            return;
        }

        try {
            await ModerationAPI.updateDomainReputation(domain, editScore, editNotes || undefined, token);
            showToast('Domain reputation updated successfully', 'success');
            cancelEditing();
            onRefresh();
        } catch (error) {
            console.error('Error updating domain reputation:', error);
            showToast('Failed to update domain reputation', 'error');
        }
    };

    const getScoreBadgeClass = (score: number): string => {
        if (score >= 80) return 'badge-success';
        if (score >= 60) return 'badge-info';
        if (score >= 40) return 'badge-warning';
        return 'badge-error';
    };

    const getScoreLabel = (score: number): string => {
        if (score >= 80) return 'Excellent';
        if (score >= 60) return 'Good';
        if (score >= 40) return 'Fair';
        if (score >= 20) return 'Poor';
        return 'Very Poor';
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="loading loading-spinner loading-lg"></div>
            </div>
        );
    }

    if (domains.length === 0) {
        return (
            <div className="text-center py-12">
                <i className="fa-solid fa-duotone fa-globe text-6xl text-base-content/30 mb-4"></i>
                <h3 className="text-lg font-semibold text-base-content mb-2">No domains tracked</h3>
                <p className="text-base-content/70">Domain reputations will appear here as content is moderated.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {domains.map((domain) => {
                const isEditing = editingDomain === domain.domain;

                return (
                    <div key={domain.domain} className="card bg-base-200 shadow-md">
                        <div className="card-body">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex-1">
                                    <h3 className="card-title text-base-content font-mono">{domain.domain}</h3>
                                    <div className="flex items-center gap-2 mt-2">
                                        <div className={`badge ${getScoreBadgeClass(domain.reputation_score)} badge-lg`}>
                                            {domain.reputation_score} / 100
                                        </div>
                                        <span className="text-sm text-base-content/70">
                                            ({getScoreLabel(domain.reputation_score)})
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Stats */}
                            <div className="bg-base-300 rounded-lg p-3 mb-4">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                    <div>
                                        <p className="text-base-content/70">Total Submissions</p>
                                        <p className="text-lg font-bold text-base-content">
                                            {domain.total_submissions}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-base-content/70">Approved</p>
                                        <p className="text-lg font-bold text-success">
                                            {domain.approved_count}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-base-content/70">Rejected</p>
                                        <p className="text-lg font-bold text-error">
                                            {domain.rejected_count}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-base-content/70">Flagged</p>
                                        <p className="text-lg font-bold text-warning">
                                            {domain.flagged_count}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Notes */}
                            {domain.moderator_notes && (
                                <div className="alert alert-info mb-4">
                                    <i className="fa-solid fa-duotone fa-info-circle"></i>
                                    <div>
                                        <p className="text-sm font-semibold">Notes:</p>
                                        <p className="text-sm">{domain.moderator_notes}</p>
                                    </div>
                                </div>
                            )}

                            {/* Metadata */}
                            <div className="text-xs text-base-content/60 mb-4">
                                <p>First seen: {new Date(domain.created_at).toLocaleDateString()}</p>
                                <p>Last updated: {new Date(domain.updated_at).toLocaleDateString()}</p>
                            </div>

                            {/* Edit Mode */}
                            {isEditing ? (
                                <div className="space-y-4">
                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text">Reputation Score (0-100)</span>
                                        </label>
                                        <input
                                            type="range"
                                            min="0"
                                            max="100"
                                            value={editScore}
                                            onChange={(e) => setEditScore(Number(e.target.value))}
                                            className="range range-primary"
                                            step="5"
                                        />
                                        <div className="flex justify-between text-xs text-base-content/60 px-2 mt-1">
                                            <span>0</span>
                                            <span>25</span>
                                            <span>50</span>
                                            <span>75</span>
                                            <span>100</span>
                                        </div>
                                        <div className="text-center mt-2">
                                            <span className={`badge ${getScoreBadgeClass(editScore)} badge-lg`}>
                                                {editScore} - {getScoreLabel(editScore)}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text">Notes (optional)</span>
                                        </label>
                                        <textarea
                                            className="textarea textarea-bordered"
                                            placeholder="Add notes about this domain..."
                                            value={editNotes}
                                            onChange={(e) => setEditNotes(e.target.value)}
                                            rows={3}
                                        />
                                    </div>

                                    <div className="card-actions justify-end">
                                        <button className="btn btn-ghost btn-sm" onClick={cancelEditing}>
                                            Cancel
                                        </button>
                                        <button
                                            className="btn btn-primary btn-sm"
                                            onClick={() => handleUpdateScore(domain.domain)}
                                        >
                                            <i className="fa-solid fa-duotone fa-save mr-2"></i>
                                            Save Changes
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="card-actions justify-end">
                                    <button
                                        className="btn btn-primary btn-sm"
                                        onClick={() => startEditing(domain)}
                                    >
                                        <i className="fa-solid fa-duotone fa-edit mr-2"></i>
                                        Edit Score
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
