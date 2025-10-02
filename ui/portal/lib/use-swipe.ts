'use client';

import { useEffect, useRef } from 'react';

interface SwipeHandlers {
    onSwipeLeft?: () => void;
    onSwipeRight?: () => void;
    onSwipeUp?: () => void;
    onSwipeDown?: () => void;
}

interface SwipeOptions {
    threshold?: number; // Minimum distance for a swipe
    preventDefaultTouchmoveEvent?: boolean;
    trackMouse?: boolean;
}

export function useSwipe<T extends HTMLElement = HTMLDivElement>(
    handlers: SwipeHandlers,
    options: SwipeOptions = {}
) {
    const {
        threshold = 50,
        preventDefaultTouchmoveEvent = false,
        trackMouse = false
    } = options;

    const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
    const elementRef = useRef<T | null>(null);

    useEffect(() => {
        const element = elementRef.current;
        if (!element) return;

        const handleTouchStart = (e: TouchEvent) => {
            const touch = e.touches[0];
            touchStartRef.current = {
                x: touch.clientX,
                y: touch.clientY,
                time: Date.now()
            };
        };

        const handleTouchMove = (e: TouchEvent) => {
            if (preventDefaultTouchmoveEvent) {
                e.preventDefault();
            }
        };

        const handleTouchEnd = (e: TouchEvent) => {
            if (!touchStartRef.current) return;

            const touch = e.changedTouches[0];
            const deltaX = touch.clientX - touchStartRef.current.x;
            const deltaY = touch.clientY - touchStartRef.current.y;
            const deltaTime = Date.now() - touchStartRef.current.time;

            // Only consider swipes that are fast enough (within 300ms)
            if (deltaTime > 300) {
                touchStartRef.current = null;
                return;
            }

            const absDeltaX = Math.abs(deltaX);
            const absDeltaY = Math.abs(deltaY);

            // Determine if it's a horizontal or vertical swipe
            if (absDeltaX > absDeltaY) {
                // Horizontal swipe
                if (absDeltaX > threshold) {
                    if (deltaX > 0) {
                        handlers.onSwipeRight?.();
                    } else {
                        handlers.onSwipeLeft?.();
                    }
                }
            } else {
                // Vertical swipe
                if (absDeltaY > threshold) {
                    if (deltaY > 0) {
                        handlers.onSwipeDown?.();
                    } else {
                        handlers.onSwipeUp?.();
                    }
                }
            }

            touchStartRef.current = null;
        };

        // Mouse events for desktop testing
        const handleMouseDown = (e: MouseEvent) => {
            if (!trackMouse) return;
            touchStartRef.current = {
                x: e.clientX,
                y: e.clientY,
                time: Date.now()
            };
        };

        const handleMouseUp = (e: MouseEvent) => {
            if (!trackMouse || !touchStartRef.current) return;

            const deltaX = e.clientX - touchStartRef.current.x;
            const deltaY = e.clientY - touchStartRef.current.y;
            const deltaTime = Date.now() - touchStartRef.current.time;

            if (deltaTime > 300) {
                touchStartRef.current = null;
                return;
            }

            const absDeltaX = Math.abs(deltaX);
            const absDeltaY = Math.abs(deltaY);

            if (absDeltaX > absDeltaY) {
                if (absDeltaX > threshold) {
                    if (deltaX > 0) {
                        handlers.onSwipeRight?.();
                    } else {
                        handlers.onSwipeLeft?.();
                    }
                }
            } else {
                if (absDeltaY > threshold) {
                    if (deltaY > 0) {
                        handlers.onSwipeDown?.();
                    } else {
                        handlers.onSwipeUp?.();
                    }
                }
            }

            touchStartRef.current = null;
        };

        // Add event listeners
        element.addEventListener('touchstart', handleTouchStart, { passive: true });
        element.addEventListener('touchmove', handleTouchMove, { passive: !preventDefaultTouchmoveEvent });
        element.addEventListener('touchend', handleTouchEnd, { passive: true });

        if (trackMouse) {
            element.addEventListener('mousedown', handleMouseDown);
            element.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            element.removeEventListener('touchstart', handleTouchStart);
            element.removeEventListener('touchmove', handleTouchMove);
            element.removeEventListener('touchend', handleTouchEnd);

            if (trackMouse) {
                element.removeEventListener('mousedown', handleMouseDown);
                element.removeEventListener('mouseup', handleMouseUp);
            }
        };
    }, [handlers, threshold, preventDefaultTouchmoveEvent, trackMouse]);

    return elementRef;
}