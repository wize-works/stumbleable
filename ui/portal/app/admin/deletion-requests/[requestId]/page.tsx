'use client';

import { useToaster } from '@/components/toaster';
import { AdminAPI } from '@/lib/api-client';
import { useAuth, useUser } from '@clerk/nextjs';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface DeletionRequestDetail {
    id: string;
    clerk_user_id: string;
    user_email: string;
    requested_at: string;
    scheduled_deletion_at: string;
    status: 'pending' | 'cancelled' | 'completed';
    cancelled_at?: string;
    completed_at?: string;
    cancellation_reason?: string;
    days_remaining?: number;
    users?: {
        email: string;
        full_name?: string;
        username?: string;
        created_at: string;
    };
}

export default function DeletionRequestDetailPage() {
    const params = useParams();
    const requestId = params?.requestId as string;
    const { user, isLoaded } = useUser();
    const { getToken } = useAuth();
    const router = useRouter();
    const { showToast } = useToaster();

    const [request, setRequest] = useState<DeletionRequestDetail | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showExtendModal, setShowExtendModal] = useState(false);
    const [showNoteModal, setShowNoteModal] = useState(false);
    const [additionalDays, setAdditionalDays] = useState(7);
    const [extensionReason, setExtensionReason] = useState('');
    const [note, setNote] = useState('');

    useEffect(() => {
        if (isLoaded && user && requestId) {
            loadRequest();
        }
    }, [isLoaded, user, requestId]);

    const loadRequest = async () => {
        setIsLoading(true);
        try {
            const token = await getToken();
            if (!token) {
                router.push('/sign-in');
                return;
            }

            const data = await AdminAPI.getDeletionRequest(requestId, token);
            setRequest(data.request);
        } catch (error: any) {
            console.error('Error loading request:', error);
            if (error?.status === 403 || error?.status === 401) {
                showToast('Access denied. Admin role required.', 'error');
                router.push('/dashboard');
            } else {
                showToast('Error loading deletion request', 'error');
                router.push('/admin/deletion-requests');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancel = async () => {
        const reason = prompt('Enter reason for cancelling this deletion request:');
        if (!reason) return;

        try {
            const token = await getToken();
            if (!token) return;

            await AdminAPI.cancelDeletionRequest(requestId, reason, token);
            showToast('Deletion request cancelled successfully', 'success');
            loadRequest();
        } catch (error) {
            console.error('Error cancelling deletion:', error);
            showToast('Error cancelling deletion request', 'error');
        }
    };

    const handleExtend = async () => {
        if (!extensionReason.trim()) {
            showToast('Please enter a reason for the extension', 'error');
            return;
        }

        try {
            const token = await getToken();
            if (!token) return;

            await AdminAPI.extendGracePeriod(requestId, additionalDays, extensionReason, token);
            showToast(`Grace period extended by ${additionalDays} days`, 'success');
            setShowExtendModal(false);
            setExtensionReason('');
            setAdditionalDays(7);
            loadRequest();
        } catch (error) {
            console.error('Error extending grace period:', error);
            showToast('Error extending grace period', 'error');
        }
    };

    const handleAddNote = async () => {
        if (!note.trim()) {
            showToast('Please enter a note', 'error');
            return;
        }

        try {
            const token = await getToken();
            if (!token) return;

            await AdminAPI.addNote(requestId, note, token);
            showToast('Note added successfully', 'success');
            setShowNoteModal(false);
            setNote('');
            loadRequest();
        } catch (error) {
            console.error('Error adding note:', error);
            showToast('Error adding note', 'error');
        }
    };

    const getStatusBadgeClass = (status: string) => {
        switch (status) {
            case 'pending': return 'badge-warning';
            case 'cancelled': return 'badge-info';
            case 'completed': return 'badge-error';
            default: return 'badge-ghost';
        }
    };

    const getDaysRemainingClass = (days: number) => {
        if (days >= 20) return 'text-success';
        if (days >= 10) return 'text-warning';
        if (days >= 3) return 'text-orange-500';
        return 'text-error';
    };

    if (!isLoaded || isLoading) {
        return (
            <div className="h-screen flex items-center justify-center bg-base-100">
                <div className="flex flex-col items-center gap-4">
                    <div className="loading loading-spinner loading-xl text-primary"></div>
                    <span className="text-xl">Loading request details...</span>
                </div>
            </div>
        );
    }

    if (!request) {
        return null;
    }

    return (
        <div className="min-h-screen bg-base-100 py-20 px-4">
            <div className="container mx-auto max-w-4xl">
                {/* Breadcrumb */}
                <div className="text-sm breadcrumbs mb-6">
                    <ul>
                        <li><a onClick={() => router.push('/admin/deletion-requests')}>Admin Dashboard</a></li>
                        <li>Deletion Request Details</li>
                    </ul>
                </div>

                {/* Header */}
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h1 className="text-4xl font-bold text-base-content mb-2">
                            Deletion Request Details
                        </h1>
                        <p className="text-lg text-base-content/70">Request ID: {request.id}</p>
                    </div>
                    <span className={`badge badge-lg ${getStatusBadgeClass(request.status)}`}>
                        {request.status}
                    </span>
                </div>

                {/* User Information */}
                <div className="card bg-base-200 mb-6">
                    <div className="card-body">
                        <h2 className="card-title text-2xl mb-4">
                            <i className="fa-solid fa-user text-primary"></i>
                            User Information
                        </h2>
                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <label className="label">
                                    <span className="label-text font-semibold">Email</span>
                                </label>
                                <p className="text-base-content">{request.user_email}</p>
                            </div>
                            {request.users?.full_name && (
                                <div>
                                    <label className="label">
                                        <span className="label-text font-semibold">Full Name</span>
                                    </label>
                                    <p className="text-base-content">{request.users.full_name}</p>
                                </div>
                            )}
                            {request.users?.username && (
                                <div>
                                    <label className="label">
                                        <span className="label-text font-semibold">Username</span>
                                    </label>
                                    <p className="text-base-content">{request.users.username}</p>
                                </div>
                            )}
                            <div>
                                <label className="label">
                                    <span className="label-text font-semibold">User ID</span>
                                </label>
                                <p className="text-sm font-mono text-base-content/70">{request.clerk_user_id}</p>
                            </div>
                            {request.users?.created_at && (
                                <div>
                                    <label className="label">
                                        <span className="label-text font-semibold">Account Created</span>
                                    </label>
                                    <p className="text-base-content">
                                        {new Date(request.users.created_at).toLocaleDateString()}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Timeline */}
                <div className="card bg-base-200 mb-6">
                    <div className="card-body">
                        <h2 className="card-title text-2xl mb-4">
                            <i className="fa-solid fa-clock text-primary"></i>
                            Timeline
                        </h2>
                        <div className="grid md:grid-cols-2 gap-6">
                            <div>
                                <label className="label">
                                    <span className="label-text font-semibold">Requested At</span>
                                </label>
                                <p className="text-base-content">
                                    {new Date(request.requested_at).toLocaleString()}
                                </p>
                            </div>
                            <div>
                                <label className="label">
                                    <span className="label-text font-semibold">Scheduled Deletion</span>
                                </label>
                                <p className="text-base-content">
                                    {new Date(request.scheduled_deletion_at).toLocaleString()}
                                </p>
                            </div>
                            {request.status === 'pending' && request.days_remaining !== undefined && (
                                <div>
                                    <label className="label">
                                        <span className="label-text font-semibold">Days Remaining</span>
                                    </label>
                                    <p className={`text-2xl font-bold ${getDaysRemainingClass(request.days_remaining)}`}>
                                        {request.days_remaining} days
                                    </p>
                                </div>
                            )}
                            {request.cancelled_at && (
                                <div>
                                    <label className="label">
                                        <span className="label-text font-semibold">Cancelled At</span>
                                    </label>
                                    <p className="text-base-content">
                                        {new Date(request.cancelled_at).toLocaleString()}
                                    </p>
                                </div>
                            )}
                            {request.completed_at && (
                                <div>
                                    <label className="label">
                                        <span className="label-text font-semibold">Completed At</span>
                                    </label>
                                    <p className="text-base-content">
                                        {new Date(request.completed_at).toLocaleString()}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Notes & Reason */}
                {request.cancellation_reason && (
                    <div className="card bg-base-200 mb-6">
                        <div className="card-body">
                            <h2 className="card-title text-2xl mb-4">
                                <i className="fa-solid fa-note-sticky text-primary"></i>
                                Notes & History
                            </h2>
                            <div className="whitespace-pre-wrap text-base-content">
                                {request.cancellation_reason}
                            </div>
                        </div>
                    </div>
                )}

                {/* Actions */}
                {request.status === 'pending' && (
                    <div className="card bg-base-200">
                        <div className="card-body">
                            <h2 className="card-title text-2xl mb-4">
                                <i className="fa-solid fa-wrench text-primary"></i>
                                Admin Actions
                            </h2>
                            <div className="flex flex-wrap gap-4">
                                <button
                                    onClick={handleCancel}
                                    className="btn btn-error"
                                >
                                    <i className="fa-solid fa-ban"></i>
                                    Cancel Deletion
                                </button>
                                <button
                                    onClick={() => setShowExtendModal(true)}
                                    className="btn btn-warning"
                                >
                                    <i className="fa-solid fa-hourglass-half"></i>
                                    Extend Grace Period
                                </button>
                                <button
                                    onClick={() => setShowNoteModal(true)}
                                    className="btn btn-info"
                                >
                                    <i className="fa-solid fa-comment-plus"></i>
                                    Add Note
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Extend Grace Period Modal */}
            {showExtendModal && (
                <div className="modal modal-open">
                    <div className="modal-box">
                        <h3 className="font-bold text-lg mb-4">Extend Grace Period</h3>

                        <div className="form-control mb-4">
                            <label className="label">
                                <span className="label-text font-semibold">Additional Days</span>
                            </label>
                            <input
                                type="number"
                                min="1"
                                max="90"
                                value={additionalDays}
                                onChange={(e) => setAdditionalDays(parseInt(e.target.value) || 1)}
                                className="input input-bordered"
                            />
                        </div>

                        <div className="form-control mb-6">
                            <label className="label">
                                <span className="label-text font-semibold">Reason for Extension</span>
                            </label>
                            <textarea
                                value={extensionReason}
                                onChange={(e) => setExtensionReason(e.target.value)}
                                className="textarea textarea-bordered h-24"
                                placeholder="Enter reason for extending the grace period..."
                            ></textarea>
                        </div>

                        <div className="modal-action">
                            <button onClick={() => setShowExtendModal(false)} className="btn btn-ghost">
                                Cancel
                            </button>
                            <button onClick={handleExtend} className="btn btn-warning">
                                Extend {additionalDays} Days
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Note Modal */}
            {showNoteModal && (
                <div className="modal modal-open">
                    <div className="modal-box">
                        <h3 className="font-bold text-lg mb-4">Add Admin Note</h3>

                        <div className="form-control mb-6">
                            <label className="label">
                                <span className="label-text font-semibold">Note</span>
                            </label>
                            <textarea
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                className="textarea textarea-bordered h-32"
                                placeholder="Enter your note..."
                            ></textarea>
                        </div>

                        <div className="modal-action">
                            <button onClick={() => setShowNoteModal(false)} className="btn btn-ghost">
                                Cancel
                            </button>
                            <button onClick={handleAddNote} className="btn btn-info">
                                Add Note
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
