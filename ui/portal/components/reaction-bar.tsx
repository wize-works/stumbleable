'use client';

import { Interaction } from '../data/types';
import { cn } from '../lib/utils';
import { AddToListButton } from './add-to-list-button';
import ReportContentButton from './report-content-button';
import { ShareButton } from './share-button';
import Logo from './ui/logo';
import { VerticalMenu } from './vertical-menu';

interface ReactionBarProps {
    onReaction: (action: Interaction['action']) => void;
    onStumble?: () => void;
    isSaved?: boolean;
    isLiked?: boolean;
    isSkipped?: boolean;
    discoveryId?: string; // For "Add to List" and "Report" functionality
    discoveryTitle?: string; // For share functionality
    discoveryUrl?: string; // For external link functionality
    className?: string;
    disabled?: boolean;
    floating?: boolean;
    onAddedToList?: (listId: string, listTitle: string) => void;
    onReportSuccess?: () => void; // Callback when content is successfully reported
}

export function ReactionBar({
    onReaction,
    onStumble,
    isSaved = false,
    isLiked = false,
    isSkipped = false,
    discoveryId,
    discoveryTitle,
    discoveryUrl,
    className = '',
    disabled = false,
    floating = true,
    onAddedToList,
    onReportSuccess
}: ReactionBarProps) {
    if (floating) {
        return (
            <div className={cn("fixed bottom-4 sm:bottom-6 left-1/2 transform -translate-x-1/2 z-40", className)}>
                <div className="flex items-center gap-2 sm:gap-3 bg-base-100/95 backdrop-blur-lg rounded-full px-4 sm:px-6 py-2 sm:py-3 shadow-2xl border border-base-300">

                    <button
                        onClick={() => onReaction('save')}
                        className={cn(
                            "btn btn-circle btn-sm sm:btn-md hover:scale-110 active:scale-95 transition-transform touch-manipulation",
                            isSaved ? 'btn-warning' : 'btn-outline btn-warning'
                        )}
                        title="Save (S)"
                        disabled={disabled}
                    >
                        <i className="fa-solid fa-duotone fa-bookmark text-sm sm:text-base"></i>
                    </button>
                    <button
                        onClick={() => onReaction('up')}
                        className={cn(
                            "btn btn-circle btn-sm sm:btn-md hover:scale-110 active:scale-95 transition-transform touch-manipulation",
                            isLiked ? 'btn-success' : 'btn-success btn-outline'
                        )}
                        title="Like (↑)"
                        disabled={disabled}
                    >
                        <i className="fa-solid fa-duotone fa-thumbs-up text-sm sm:text-base"></i>
                    </button>

                    {/* Central Stumble Button */}
                    {onStumble && (
                        <button
                            onClick={onStumble}
                            disabled={disabled}
                            className="btn btn-circle btn-md sm:btn-lg btn-primary hover:bg-primary/20 btn-outline hover:scale-110 active:scale-95 transition-transform shadow-lg touch-manipulation mx-1"
                            title="Stumble (Space)"
                        >
                            <Logo size='xs' className="sm:size-sm" logoShadow={false} />
                        </button>
                    )}

                    <button
                        onClick={() => onReaction('down')}
                        className={cn(
                            "btn btn-circle btn-sm sm:btn-md hover:scale-110 active:scale-95 transition-transform touch-manipulation",
                            isSkipped ? 'btn-error' : 'btn-error btn-outline'
                        )}
                        title="Skip (↓)"
                        disabled={disabled}
                    >
                        <i className="fa-solid fa-duotone fa-thumbs-down text-sm sm:text-base"></i>
                    </button>

                    {/* More Actions Menu */}
                    <VerticalMenu disabled={disabled}>
                        {/* Share button with dropdown */}
                        <div className='tooltip tooltip-right' data-tip='Share'>
                            <ShareButton
                                contentId={discoveryId}
                                contentTitle={discoveryTitle}
                                disabled={disabled}
                                size="md"
                                variant="circle"
                                className="hover:scale-110 active:scale-95 transition-transform"
                            />
                        </div>

                        {/* Add to List button */}
                        {discoveryId && (
                            <div className='tooltip tooltip-right' data-tip='Add to List'>
                                <AddToListButton
                                    discoveryId={discoveryId}
                                    onAdded={(listId, listTitle) => {
                                        onAddedToList?.(listId, listTitle);
                                    }}
                                    size="md"
                                    variant="circle"
                                    className="btn-accent hover:scale-110 active:scale-95 transition-transform"
                                />
                            </div>
                        )}

                        {/* External Link button */}
                        {discoveryUrl && (
                            <div className='tooltip tooltip-right' data-tip='Open in New Tab'>
                                <a
                                    href={discoveryUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn btn-circle btn-md btn-secondary hover:scale-110 active:scale-95 transition-transform touch-manipulation"
                                    aria-label="Open in new tab"
                                >
                                    <i className="fa-solid fa-duotone fa-external-link text-base"></i>
                                </a>
                            </div>
                        )}

                        {/* Report button */}
                        {discoveryId && (
                            <ReportContentButton
                                discoveryId={discoveryId}
                                className="btn-circle btn-error hover:scale-110 active:scale-95 transition-transform"
                                onReportSuccess={onReportSuccess}
                            />
                        )}
                    </VerticalMenu>
                </div>
            </div>
        );
    }

    // Legacy inline version for backward compatibility
    const reactions = [
        {
            action: 'up' as const,
            icon: 'fa-solid fa-duotone fa-thumbs-up',
            label: 'Like',
            shortcut: '↑',
            className: 'btn-success',
        },
        {
            action: 'down' as const,
            icon: 'fa-solid fa-duotone fa-thumbs-down',
            label: 'Skip',
            shortcut: '↓',
            className: 'btn-error',
        },
        {
            action: 'save' as const,
            icon: 'fa-solid fa-duotone fa-bookmark',
            label: 'Save',
            shortcut: 'S',
            className: 'btn-warning',
        },
        {
            action: 'share' as const,
            icon: 'fa-solid fa-duotone fa-share',
            label: 'Share',
            shortcut: '⇧S',
            className: 'btn-info',
        },
    ];

    return (
        <div className={cn('flex items-center justify-center gap-3 p-4', className)}>
            {reactions.map(({ action, icon, label, shortcut, className: btnClass }) => {
                const isActiveAction = action === 'save' && isSaved;

                return (
                    <button
                        key={action}
                        onClick={() => onReaction(action)}
                        disabled={disabled}
                        className={cn(
                            'btn btn-sm sm:btn-md flex items-center gap-2 min-w-[80px] sm:min-w-[100px]',
                            btnClass,
                            isActiveAction && 'btn-active',
                            'hover:scale-105 active:scale-95 transition-transform'
                        )}
                        title={`${label} (${shortcut})`}
                    >
                        <i className={`${icon} text-base`}></i>
                        <span className="hidden sm:inline text-sm">{label}</span>
                        <span className="text-xs opacity-60 hidden sm:inline">({shortcut})</span>
                    </button>
                );
            })}
        </div>
    );
}