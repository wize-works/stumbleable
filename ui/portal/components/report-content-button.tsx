import { useToaster } from '@/components/toaster';
import { useUser } from '@clerk/nextjs';
import React, { useState } from 'react';

interface ReportContentButtonProps {
    discoveryId: string;
    className?: string;
}

export default function ReportContentButton({ discoveryId, className = '' }: ReportContentButtonProps) {
    const { user } = useUser();
    const { showToast } = useToaster();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedReason, setSelectedReason] = useState<string>('');
    const [description, setDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isReported, setIsReported] = useState(false);

    const reportReasons = [
        { value: 'spam', label: 'Spam or promotional content' },
        { value: 'inappropriate', label: 'Inappropriate content' },
        { value: 'broken', label: 'Broken link or not working' },
        { value: 'offensive', label: 'Offensive or hateful content' },
        { value: 'copyright', label: 'Copyright violation' },
        { value: 'other', label: 'Other issue' }
    ];

    const handleSubmitReport = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!user || !selectedReason) return;

        setIsSubmitting(true);

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_DISCOVERY_API_URL}/api/reports`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    discoveryId,
                    reason: selectedReason,
                    description: description.trim() || undefined,
                    userId: user.id
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to submit report');
            }

            setIsReported(true);
            setIsModalOpen(false);

            // Reset form
            setSelectedReason('');
            setDescription('');

            // Show success message
            showToast('Content reported successfully. Moderators will review it shortly.', 'success');

            // Reset reported state after 3 seconds
            setTimeout(() => setIsReported(false), 3000);

        } catch (error) {
            console.error('Error submitting report:', error);
            const errorMessage = error instanceof Error ? error.message : 'Failed to submit report. Please try again.';
            showToast(errorMessage, 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!user) {
        return null; // Don't show report button for unauthenticated users
    }

    if (isReported) {
        return (
            <button className={`btn btn-sm btn-success ${className}`} disabled>
                <i className="fa-solid fa-duotone fa-check mr-1"></i>
                Reported
            </button>
        );
    }

    return (
        <>
            <button
                className={`btn btn-sm btn-ghost ${className}`}
                onClick={() => setIsModalOpen(true)}
                title="Report inappropriate content"
            >
                <i className="fa-solid fa-duotone fa-flag mr-1"></i>
                Report
            </button>

            {/* Report Modal */}
            {isModalOpen && (
                <div className="modal modal-open">
                    <div className="modal-box">
                        <h3 className="font-bold text-lg mb-4">Report Content</h3>

                        <form onSubmit={handleSubmitReport}>
                            <div className="form-control mb-4">
                                <label className="label">
                                    <span className="label-text">Why are you reporting this content?</span>
                                </label>
                                <div className="space-y-2">
                                    {reportReasons.map((reason) => (
                                        <label key={reason.value} className="cursor-pointer label justify-start">
                                            <input
                                                type="radio"
                                                name="reason"
                                                value={reason.value}
                                                checked={selectedReason === reason.value}
                                                onChange={(e) => setSelectedReason(e.target.value)}
                                                className="radio radio-primary mr-3"
                                                required
                                            />
                                            <span className="label-text">{reason.label}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="form-control mb-6">
                                <label className="label">
                                    <span className="label-text">Additional details (optional)</span>
                                </label>
                                <textarea
                                    className="textarea textarea-bordered"
                                    placeholder="Provide more context about the issue..."
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    maxLength={500}
                                    rows={3}
                                />
                                <label className="label">
                                    <span className="label-text-alt">{description.length}/500 characters</span>
                                </label>
                            </div>

                            <div className="modal-action">
                                <button
                                    type="button"
                                    className="btn btn-ghost"
                                    onClick={() => setIsModalOpen(false)}
                                    disabled={isSubmitting}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-error"
                                    disabled={!selectedReason || isSubmitting}
                                >
                                    {isSubmitting ? (
                                        <>
                                            <span className="loading loading-spinner loading-sm mr-2"></span>
                                            Submitting...
                                        </>
                                    ) : (
                                        <>
                                            <i className="fa-solid fa-duotone fa-flag mr-2"></i>
                                            Submit Report
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}