'use client';

import { useEffect, useState } from 'react';

interface KeyboardShortcutsProps {
    onStumble: () => void;
    onLike: () => void;
    onSkip: () => void;
    onSave: () => void;
    onShare: () => void;
    disabled?: boolean;
}

export function KeyboardShortcuts({
    onStumble,
    onLike,
    onSkip,
    onSave,
    onShare,
    disabled = false,
}: KeyboardShortcutsProps) {
    const [showHelp, setShowHelp] = useState(false);

    useEffect(() => {
        if (disabled) return;

        function handleKeyDown(event: KeyboardEvent) {
            // Don't trigger shortcuts if user is typing in an input
            if (
                event.target instanceof HTMLInputElement ||
                event.target instanceof HTMLTextAreaElement ||
                event.target instanceof HTMLSelectElement
            ) {
                return;
            }

            switch (event.key) {
                case ' ':
                    event.preventDefault();
                    onStumble();
                    break;
                case 'ArrowUp':
                    event.preventDefault();
                    onLike();
                    break;
                case 'ArrowDown':
                    event.preventDefault();
                    onSkip();
                    break;
                case 's':
                case 'S':
                    event.preventDefault();
                    if (event.shiftKey) {
                        onShare();
                    } else {
                        onSave();
                    }
                    break;
                case '?':
                    event.preventDefault();
                    setShowHelp(prev => !prev);
                    break;
                case 'Escape':
                    setShowHelp(false);
                    break;
            }
        }

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [disabled, onStumble, onLike, onSkip, onSave, onShare]);

    return (
        <>
            {/* Help trigger button */}
            <button
                onClick={() => setShowHelp(prev => !prev)}
                className="btn btn-circle btn-sm btn-ghost fixed bottom-4 right-4 z-40"
                title="Keyboard shortcuts (?)"
            >
                <span className="text-lg">?</span>
            </button>

            {/* Help modal */}
            {showHelp && (
                <div className="modal modal-open">
                    <div className="modal-box">
                        <h3 className="font-bold text-lg mb-4">Keyboard Shortcuts</h3>

                        <div className="space-y-3">
                            <ShortcutItem shortcut="Space" description="Get next discovery" />
                            <ShortcutItem shortcut="↑" description="Like current discovery" />
                            <ShortcutItem shortcut="↓" description="Skip current discovery" />
                            <ShortcutItem shortcut="S" description="Save current discovery" />
                            <ShortcutItem shortcut="Shift + S" description="Share current discovery" />
                            <ShortcutItem shortcut="?" description="Show/hide this help" />
                            <ShortcutItem shortcut="Escape" description="Close dialogs" />
                        </div>

                        <div className="modal-action">
                            <button
                                className="btn btn-primary"
                                onClick={() => setShowHelp(false)}
                            >
                                Got it!
                            </button>
                        </div>
                    </div>

                    <div
                        className="modal-backdrop"
                        onClick={() => setShowHelp(false)}
                    />
                </div>
            )}
        </>
    );
}

function ShortcutItem({ shortcut, description }: { shortcut: string; description: string }) {
    return (
        <div className="flex items-center justify-between">
            <span className="text-base-content/80">{description}</span>
            <kbd className="kbd kbd-sm">{shortcut}</kbd>
        </div>
    );
}