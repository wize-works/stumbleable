'use client';

import { useState } from 'react';
import { useToaster } from './toaster';

interface ShareModalProps {
    listId: string;
    listTitle: string;
    onClose: () => void;
}

export function ShareModal({ listId, listTitle, onClose }: ShareModalProps) {
    const { showToast } = useToaster();
    const [copied, setCopied] = useState(false);

    const shareUrl = typeof window !== 'undefined'
        ? `${window.location.origin}/lists/${listId}`
        : '';

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(shareUrl);
            setCopied(true);
            showToast('Link copied to clipboard!', 'success');
            setTimeout(() => setCopied(false), 2000);
        } catch (error) {
            showToast('Failed to copy link', 'error');
        }
    };

    const handleShare = async (platform: 'twitter' | 'facebook' | 'linkedin') => {
        const encodedUrl = encodeURIComponent(shareUrl);
        const encodedTitle = encodeURIComponent(`Check out this list: ${listTitle}`);

        const shareUrls = {
            twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
            facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
            linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`
        };

        window.open(shareUrls[platform], '_blank', 'width=600,height=400');
    };

    return (
        <div className="modal modal-open">
            <div className="modal-box">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-lg">Share List</h3>
                    <button onClick={onClose} className="btn btn-sm btn-circle btn-ghost">
                        <i className="fa-solid fa-duotone fa-xmark"></i>
                    </button>
                </div>

                {/* List Preview */}
                <div className="mb-6">
                    <div className="p-4 bg-base-200 rounded-lg">
                        <div className="font-semibold mb-1">{listTitle}</div>
                        <div className="text-sm text-base-content/60 break-all">{shareUrl}</div>
                    </div>
                </div>

                {/* Copy Link */}
                <div className="form-control mb-6">
                    <label className="label">
                        <span className="label-text font-medium">Share Link</span>
                    </label>
                    <div className="join w-full">
                        <input
                            type="text"
                            value={shareUrl}
                            readOnly
                            className="input input-bordered join-item flex-1"
                        />
                        <button
                            onClick={handleCopy}
                            className={`btn join-item ${copied ? 'btn-success' : 'btn-primary'}`}
                        >
                            {copied ? (
                                <>
                                    <i className="fa-solid fa-duotone fa-check mr-2"></i>
                                    Copied!
                                </>
                            ) : (
                                <>
                                    <i className="fa-solid fa-duotone fa-copy mr-2"></i>
                                    Copy
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Social Share Buttons */}
                <div>
                    <label className="label">
                        <span className="label-text font-medium">Share On</span>
                    </label>
                    <div className="flex gap-2">
                        <button
                            onClick={() => handleShare('twitter')}
                            className="btn btn-sm flex-1"
                            style={{ backgroundColor: '#1DA1F2', borderColor: '#1DA1F2', color: 'white' }}
                        >
                            <i className="fa-brands fa-twitter mr-2"></i>
                            Twitter
                        </button>
                        <button
                            onClick={() => handleShare('facebook')}
                            className="btn btn-sm flex-1"
                            style={{ backgroundColor: '#1877F2', borderColor: '#1877F2', color: 'white' }}
                        >
                            <i className="fa-brands fa-facebook mr-2"></i>
                            Facebook
                        </button>
                        <button
                            onClick={() => handleShare('linkedin')}
                            className="btn btn-sm flex-1"
                            style={{ backgroundColor: '#0A66C2', borderColor: '#0A66C2', color: 'white' }}
                        >
                            <i className="fa-brands fa-linkedin mr-2"></i>
                            LinkedIn
                        </button>
                    </div>
                </div>

                <div className="modal-action">
                    <button onClick={onClose} className="btn">
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
