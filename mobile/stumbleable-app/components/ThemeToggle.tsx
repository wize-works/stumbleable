import { faMoon, faSun } from '@awesome.me/kit-240c9f263d/icons/sharp-duotone/solid';
import React from 'react';
import { Text, View } from 'react-native';
import { useTheme } from '../lib/ThemeProvider';
import { useUniversalStyles } from '../lib/useThemedStyles';
import RoundButton from './RoundButton';

type ThemeToggleProps = {
    /** Size variant for the toggle button */
    size?: 'small' | 'medium' | 'large';
    /** Show text label alongside icon */
    showLabel?: boolean;
    /** Custom style for container */
    containerStyle?: any;
};

export function ThemeToggle({
    size = 'medium',
    showLabel = false,
    containerStyle
}: ThemeToggleProps) {
    const { theme, isDark, toggleTheme } = useTheme();
    const styles = useUniversalStyles();

    return (
        <View style={[
            showLabel && {
                flexDirection: 'row',
                alignItems: 'center',
                gap: theme.spacing.sm
            },
            containerStyle
        ]}>
            <RoundButton
                variant="ghost"
                size={size}
                icon={isDark ? faSun : faMoon}
                onPress={toggleTheme}
                accessibilityLabel={`Switch to ${isDark ? 'light' : 'dark'} theme`}
                accessibilityHint="Toggles between light and dark appearance modes"
            />

            {showLabel && (
                <Text style={[
                    styles.bodyText,
                    { color: theme.colors.baseContent }
                ]}>
                    {isDark ? 'Light Mode' : 'Dark Mode'}
                </Text>
            )}
        </View>
    );
}

/**
 * Header version with minimal styling for navigation bars
 */
export function HeaderThemeToggle() {
    return (
        <ThemeToggle
            size="small"
            containerStyle={{ marginRight: 8 }}
        />
    );
}

/**
 * Settings version with label for settings screens
 */
export function SettingsThemeToggle() {
    return (
        <ThemeToggle
            size="medium"
            showLabel={true}
            containerStyle={{
                paddingVertical: 12,
                paddingHorizontal: 16,
            }}
        />
    );
}

export default ThemeToggle;