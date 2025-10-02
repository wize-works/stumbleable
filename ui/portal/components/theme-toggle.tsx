'use client';

import { useEffect, useState } from 'react';

export function ThemeToggle() {
    const [theme, setTheme] = useState<'light' | 'dark'>('light');
    const [mounted, setMounted] = useState(false);

    // Only run on client side after mount
    useEffect(() => {
        setMounted(true);
        // Get theme from localStorage or default to light
        const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
        if (savedTheme) {
            setTheme(savedTheme);
            document.documentElement.setAttribute('data-theme', savedTheme);
        } else {
            // Check system preference
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            const initialTheme = prefersDark ? 'dark' : 'light';
            setTheme(initialTheme);
            document.documentElement.setAttribute('data-theme', initialTheme);
        }
    }, []);

    const toggleTheme = () => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
    };

    // Prevent flash of unstyled content
    if (!mounted) {
        return (
            <button
                className="btn btn-ghost btn-circle"
                aria-label="Toggle theme"
                disabled
            >
                <i className="fa-solid fa-duotone fa-circle-notch fa-spin text-lg sm:text-xl"></i>
            </button>
        );
    }

    return (
        <button
            onClick={toggleTheme}
            className="btn btn-ghost btn-circle"
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
            {theme === 'light' ? (
                <i className="fa-solid fa-duotone fa-moon text-lg sm:text-xl"></i>
            ) : (
                <i className="fa-solid fa-duotone fa-sun text-lg sm:text-xl"></i>
            )}
        </button>
    );
}
