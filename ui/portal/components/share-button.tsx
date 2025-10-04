'use client';

import { useToaster } from '@/components/toaster';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface ShareButtonProps {
    contentId?: string;
    contentTitle?: string;
    disabled?: boolean;
    className?: string;
    size?: 'sm' | 'md' | 'lg';
    variant?: 'circle' | 'normal';
}

export function ShareButton({
    contentId,
    contentTitle,
    disabled = false,
    className = '',
    size = 'md',
    variant = 'circle'
}: ShareButtonProps) {
    const [isOpen, setIsOpen] = useState(false);
    const { showToast } = useToaster();

    // Build shareable URL
    const getShareUrl = () => {
        if (!contentId) return window.location.href;
        const baseUrl = window.location.origin;
        return `${baseUrl}/stumble?id=${contentId}`;
    };

    // Build share text for social media
    const getShareText = () => {
        if (contentTitle) {
            return `Check out this discovery on Stumbleable: ${contentTitle}`;
        }
        return 'Check out this amazing discovery on Stumbleable!';
    };

    const handleCopyLink = async () => {
        const url = getShareUrl();
        try {
            await navigator.clipboard.writeText(url);
            showToast('Link copied to clipboard!', 'success');
            setIsOpen(false);
        } catch (error) {
            console.error('Failed to copy link:', error);
            showToast('Failed to copy link', 'error');
        }
    };

    const handleShareTwitter = () => {
        const url = getShareUrl();
        const text = getShareText();
        const twitterUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
        window.open(twitterUrl, '_blank', 'width=550,height=420');
        setIsOpen(false);
    };

    const handleShareFacebook = () => {
        const url = getShareUrl();
        const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        window.open(facebookUrl, '_blank', 'width=550,height=420');
        setIsOpen(false);
    };

    const handleShareLinkedIn = () => {
        const url = getShareUrl();
        const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
        window.open(linkedInUrl, '_blank', 'width=550,height=420');
        setIsOpen(false);
    };

    const handleShareNative = async () => {
        const url = getShareUrl();
        const text = getShareText();

        if (navigator.share) {
            try {
                await navigator.share({
                    title: contentTitle || 'Stumbleable Discovery',
                    text: text,
                    url: url
                });
                setIsOpen(false);
            } catch (error) {
                // User cancelled or error occurred
                console.log('Share cancelled or failed:', error);
            }
        } else {
            // Fallback to copy link if Web Share API not available
            handleCopyLink();
        }
    };

    const buttonSizeClass = {
        sm: 'btn-sm',
        md: 'btn-md',
        lg: 'btn-lg'
    }[size];

    const buttonVariantClass = variant === 'circle' ? 'btn-circle' : '';

    return (
        <div className="dropdown dropdown-top dropdown-end">
            <button
                onClick={() => setIsOpen(!isOpen)}
                disabled={disabled}
                className={cn(
                    'btn btn-info hover:scale-110 active:scale-95 transition-transform',
                    buttonSizeClass,
                    buttonVariantClass,
                    className
                )}
                title="Share"
            >
                <i className="fa-solid fa-duotone fa-share text-sm sm:text-base"></i>
            </button>

            {isOpen && (
                <ul
                    className="dropdown-content z-[60] menu p-2 shadow-2xl bg-base-100 rounded-box w-52 mb-2 border border-base-300"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Native Share (mobile) */}
                    {typeof navigator !== 'undefined' && typeof navigator.share === 'function' && (
                        <li>
                            <button onClick={handleShareNative} className="flex items-center gap-2">
                                <i className="fa-solid fa-duotone fa-share-nodes text-info"></i>
                                <span>Share...</span>
                            </button>
                        </li>
                    )}

                    {/* Copy Link */}
                    <li>
                        <button onClick={handleCopyLink} className="flex items-center gap-2">
                            <i className="fa-solid fa-duotone fa-link text-info"></i>
                            <span>Copy Link</span>
                        </button>
                    </li>

                    <div className="divider my-1"></div>

                    {/* Social Media Options */}
                    <li>
                        <button onClick={handleShareTwitter} className="flex items-center gap-2">
                            <i className="fa-brands fa-twitter text-[#1DA1F2]"></i>
                            <span>Share on Twitter</span>
                        </button>
                    </li>

                    <li>
                        <button onClick={handleShareFacebook} className="flex items-center gap-2">
                            <i className="fa-brands fa-facebook text-[#1877F2]"></i>
                            <span>Share on Facebook</span>
                        </button>
                    </li>

                    <li>
                        <button onClick={handleShareLinkedIn} className="flex items-center gap-2">
                            <i className="fa-brands fa-linkedin text-[#0A66C2]"></i>
                            <span>Share on LinkedIn</span>
                        </button>
                    </li>
                </ul>
            )}
        </div>
    );
}
