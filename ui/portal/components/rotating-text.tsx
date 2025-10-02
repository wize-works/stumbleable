'use client';

import { useEffect, useState } from 'react';

const phrases = [
    'Infinite Discovery.',
    'Endless Surprises.',
    'Pure Serendipity.',
    'Boundless Wonder.',
    'Limitless Curiosity.',
    'Unexpected Treasures.',
    'Digital Adventure.',
    'Wild Exploration.',
    'Constant Amazement.',
    'Timeless Discovery.',
    'Genuine Surprises.',
    'Random Brilliance.',
    'Curated Magic.',
    'Fresh Perspectives.',
    'Hidden Gems.',
    'Authentic Content.',
    'True Discovery.',
    'Real Adventure.',
    'Organic Wonder.',
    'Natural Curiosity.',
];

const colors = ['text-primary', 'text-secondary', 'text-accent'];

export function RotatingText() {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        const interval = setInterval(() => {
            // Fade out
            setIsVisible(false);

            // Wait for fade out, then change text and fade in
            setTimeout(() => {
                setCurrentIndex((prev) => (prev + 1) % phrases.length);
                setIsVisible(true);
            }, 300); // Half of the transition duration
        }, 3000); // Change every 3 seconds

        return () => clearInterval(interval);
    }, []);

    // Cycle through colors based on current index
    const currentColor = colors[currentIndex % colors.length];

    return (
        <span
            className={`${currentColor} transition-opacity duration-500 ${isVisible ? 'opacity-100' : 'opacity-0'
                }`}
        >
            {phrases[currentIndex]}
        </span>
    );
}
