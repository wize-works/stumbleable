'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from '../lib/utils';

interface VerticalMenuProps {
    children: React.ReactNode[];
    triggerIcon?: string;
    triggerClassName?: string;
    disabled?: boolean;
}

export function VerticalMenu({
    children,
    triggerIcon = 'fa-bars',
    triggerClassName = '',
    disabled = false
}: VerticalMenuProps) {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // Close menu when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            const target = event.target as HTMLElement;

            // Don't close if clicking inside the menu
            if (menuRef.current && menuRef.current.contains(target)) {
                return;
            }

            // Don't close if clicking inside a modal/dialog
            if (target.closest('dialog, [role="dialog"], .modal')) {
                console.log('[VerticalMenu] Click inside modal detected, keeping menu open');
                return;
            }

            // Don't close if clicking on a modal backdrop (let the modal handle it)
            if (target.classList.contains('modal-backdrop') || target.closest('.modal-backdrop')) {
                console.log('[VerticalMenu] Click on modal backdrop, keeping menu open');
                return;
            }

            // Otherwise, close the menu
            console.log('[VerticalMenu] Click outside detected, closing menu');
            setIsOpen(false);
        }

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [isOpen]);

    return (
        <div ref={menuRef} className="relative inline-block">
            {/* Trigger Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                disabled={disabled}
                className={cn(
                    'btn btn-circle btn-info btn-outline',
                    'hover:scale-110 active:scale-95 transition-all touch-manipulation',
                    isOpen && 'btn-active',
                    triggerClassName
                )}
                title="More actions"
                aria-label="More actions"
                aria-expanded={isOpen}
            >
                <i
                    className={cn(
                        'fa-solid fa-duotone transition-transform duration-300',
                        triggerIcon,
                        isOpen && 'rotate-90'
                    )}
                ></i>
            </button>

            {/* Vertical Menu Stack */}
            {isOpen && (
                <>
                    {/* Backdrop overlay */}
                    <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />

                    {/* Menu items container - vertical stack going up */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 flex flex-col-reverse gap-2">
                        {children.map((child, index) => (
                            <div
                                key={index}
                                className="transition-all duration-300 ease-out"
                                style={{
                                    opacity: isOpen ? 1 : 0,
                                    transform: isOpen ? 'translateY(0)' : 'translateY(20px)',
                                    transitionDelay: `${index * 50}ms`
                                }}
                            >
                                {child}
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
