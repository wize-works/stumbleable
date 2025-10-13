import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { ReactNode, createContext, useContext, useEffect, useState } from 'react';
import { Appearance } from 'react-native';
import { Theme, ThemeMode, getTheme } from './theme';

type ThemeContextType = {
    theme: Theme;
    themeMode: ThemeMode;
    isDark: boolean;
    toggleTheme: () => void;
    setThemeMode: (mode: ThemeMode) => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

type ThemeProviderProps = {
    children: ReactNode;
};

const THEME_STORAGE_KEY = '@stumbleable_theme_mode';

export function ThemeProvider({ children }: ThemeProviderProps) {
    const [themeMode, setThemeMode] = useState<ThemeMode>('light');
    const [isLoaded, setIsLoaded] = useState(false);

    // Initialize theme from storage or system preference
    useEffect(() => {
        const initializeTheme = async () => {
            try {
                // Check if user has a saved preference
                const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);

                if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
                    setThemeMode(savedTheme);
                } else {
                    // Fall back to system preference
                    const systemTheme = Appearance.getColorScheme();
                    setThemeMode(systemTheme === 'dark' ? 'dark' : 'light');
                }
            } catch (error) {
                console.log('Error loading theme preference:', error);
                // Default to light theme if there's an error
                setThemeMode('light');
            } finally {
                setIsLoaded(true);
            }
        };

        initializeTheme();
    }, []);

    // Listen for system theme changes
    useEffect(() => {
        const subscription = Appearance.addChangeListener(({ colorScheme }) => {
            // Only update if user hasn't set a manual preference
            AsyncStorage.getItem(THEME_STORAGE_KEY).then((savedTheme: string | null) => {
                if (!savedTheme) {
                    setThemeMode(colorScheme === 'dark' ? 'dark' : 'light');
                }
            });
        }); return () => subscription?.remove();
    }, []);

    const handleSetThemeMode = async (mode: ThemeMode) => {
        try {
            setThemeMode(mode);
            await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
        } catch (error) {
            console.log('Error saving theme preference:', error);
        }
    };

    const toggleTheme = () => {
        const newMode = themeMode === 'light' ? 'dark' : 'light';
        handleSetThemeMode(newMode);
    };

    const theme = getTheme(themeMode);
    const isDark = themeMode === 'dark';

    // Don't render children until theme is loaded
    if (!isLoaded) {
        return null; // Or a loading spinner if you prefer
    }

    return (
        <ThemeContext.Provider
            value={{
                theme,
                themeMode,
                isDark,
                toggleTheme,
                setThemeMode: handleSetThemeMode,
            }}
        >
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme(): ThemeContextType {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}

export default ThemeProvider;