/**
 * Universal Theme System for Stumbleable
 * Matches the web application's light and dark themes
 * Based on light.css and dark.css from the web portal
 */

export type Theme = {
    colors: {
        // Brand palette
        primary: string;
        primaryContent: string;
        secondary: string;
        secondaryContent: string;
        accent: string;
        accentContent: string;
        neutral: string;
        neutralContent: string;

        // Base surfaces
        base100: string; // Main background
        base200: string; // Card backgrounds
        base300: string; // Input backgrounds
        baseContent: string; // Main text

        // Status colors
        info: string;
        infoContent: string;
        success: string;
        successContent: string;
        warning: string;
        warningContent: string;
        error: string;
        errorContent: string;

        // UI elements
        border: string;
        placeholder: string;
        disabled: string;
    };
    spacing: {
        xs: number;
        sm: number;
        md: number;
        lg: number;
        xl: number;
        xxl: number;
    };
    borderRadius: {
        small: number;
        medium: number;
        large: number;
        round: number;
    };
    typography: {
        fontSizes: {
            xs: number;
            sm: number;
            base: number;
            lg: number;
            xl: number;
            xxl: number;
            xxxl: number;
        };
        fontWeights: {
            normal: '400' | 'normal';
            medium: '500' | 'medium';
            semibold: '600' | 'semibold';
            bold: '700' | 'bold';
        };
    };
    shadows: {
        card: {
            shadowColor: string;
            shadowOffset: { width: number; height: number };
            shadowOpacity: number;
            shadowRadius: number;
            elevation: number; // Android
        };
        float: {
            shadowColor: string;
            shadowOffset: { width: number; height: number };
            shadowOpacity: number;
            shadowRadius: number;
            elevation: number; // Android
        };
    };
};

export const lightTheme: Theme = {
    colors: {
        // Brand palette — vibrant & uncommon
        primary: '#FF4D6D', // Punchy Pink-Red
        primaryContent: '#FFFFFF',
        secondary: '#00C49A', // Neon Mint
        secondaryContent: '#FFFFFF',
        accent: '#FFD600', // Electric Yellow
        accentContent: '#0B0D10',
        neutral: '#1F262E', // Graphite Anchor
        neutralContent: '#F7F5F2',

        // Base surfaces — warmer canvas than pure white
        base100: '#FFFDF7', // Cream White
        base200: '#F6F0E9',
        base300: '#EDE3D9',
        baseContent: '#1C1A1A',

        // Status — keep clarity, but tuned for harmony
        info: '#0091FF',
        infoContent: '#FFFFFF',
        success: '#17E68F',
        successContent: '#0B0D10',
        warning: '#FF8C42',
        warningContent: '#0B0D10',
        error: '#FF3355',
        errorContent: '#FFFFFF',

        // UI elements
        border: '#E1E5E9',
        placeholder: '#666666',
        disabled: '#A0A0A0',
    },
    spacing: {
        xs: 4,
        sm: 8,
        md: 16,
        lg: 24,
        xl: 32,
        xxl: 48,
    },
    borderRadius: {
        small: 8, // 0.5rem
        medium: 12, // 0.75rem
        large: 20, // 1.25rem (matches --rounded-box)
        round: 999,
    },
    typography: {
        fontSizes: {
            xs: 12,
            sm: 14,
            base: 16,
            lg: 18,
            xl: 20,
            xxl: 24,
            xxxl: 28,
        },
        fontWeights: {
            normal: '400',
            medium: '500',
            semibold: '600',
            bold: '700',
        },
    },
    shadows: {
        card: {
            shadowColor: '#FF4D6D', // Primary color shadow
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.1,
            shadowRadius: 20,
            elevation: 3,
        },
        float: {
            shadowColor: '#FFD600', // Accent color shadow
            shadowOffset: { width: 0, height: 12 },
            shadowOpacity: 0.15,
            shadowRadius: 28,
            elevation: 8,
        },
    },
};

export const darkTheme: Theme = {
    colors: {
        // Brand palette — glowing against dark
        primary: '#FF4D6D', // Punchy Pink-Red
        primaryContent: '#FFFFFF',
        secondary: '#00E6B3', // Vibrant Aqua Mint
        secondaryContent: '#FFFFFF',
        accent: '#FFD600', // Electric Yellow
        accentContent: '#0B0D10',
        neutral: '#0A0F14', // Deep Ink
        neutralContent: '#EDEAE6',

        // Base surfaces — layered dark with subtle warmth
        base100: '#0B0D10', // Near Black
        base200: '#131820',
        base300: '#1A222C',
        baseContent: '#F8F7F4', // High readability

        // Status — glowing & consistent
        info: '#2E9BFF',
        infoContent: '#0B0D10',
        success: '#22F09E',
        successContent: '#0B0D10',
        warning: '#FF914D',
        warningContent: '#0B0D10',
        error: '#FF3355',
        errorContent: '#FFFFFF',

        // UI elements
        border: '#2A3441',
        placeholder: '#8B9299',
        disabled: '#5A6169',
    },
    spacing: {
        xs: 4,
        sm: 8,
        md: 16,
        lg: 24,
        xl: 32,
        xxl: 48,
    },
    borderRadius: {
        small: 8,
        medium: 12,
        large: 20,
        round: 999,
    },
    typography: {
        fontSizes: {
            xs: 12,
            sm: 14,
            base: 16,
            lg: 18,
            xl: 20,
            xxl: 24,
            xxxl: 28,
        },
        fontWeights: {
            normal: '400',
            medium: '500',
            semibold: '600',
            bold: '700',
        },
    },
    shadows: {
        card: {
            shadowColor: '#00E6B3', // Secondary color shadow for dark mode
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.15,
            shadowRadius: 20,
            elevation: 3,
        },
        float: {
            shadowColor: '#FF4D6D', // Primary color shadow for dark mode
            shadowOffset: { width: 0, height: 12 },
            shadowOpacity: 0.25,
            shadowRadius: 28,
            elevation: 8,
        },
    },
};

export type ThemeMode = 'light' | 'dark';

export const getTheme = (mode: ThemeMode): Theme => {
    return mode === 'dark' ? darkTheme : lightTheme;
};