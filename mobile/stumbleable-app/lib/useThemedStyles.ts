import { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { Theme } from './theme';
import { useTheme } from './ThemeProvider';
import { createUniversalStyles } from './UniversalStyles';

/**
 * Hook for using the Universal StyleSheet system
 * Provides consistent, pre-defined styles across the entire app
 * 
 * Usage: const styles = useUniversalStyles();
 * Then: <View style={styles.container}>
 */
export function useUniversalStyles() {
    const { theme } = useTheme();

    return useMemo(() => createUniversalStyles(theme), [theme]);
}

/**
 * Hook for creating custom themed StyleSheets when universal styles aren't enough
 * Usage: const customStyles = useThemedStyles(createStyles);
 * 
 * @param createStylesFn Function that receives theme and returns styles object
 * @returns StyleSheet created with current theme
 */
export function useThemedStyles<T extends StyleSheet.NamedStyles<T>>(
    createStylesFn: (theme: Theme) => T
): T {
    const { theme } = useTheme();
    return useMemo(() => StyleSheet.create(createStylesFn(theme)), [theme, createStylesFn]);
}

/**
 * Helper function to create style factories
 * Usage: const createStyles = makeStyles((theme) => ({ ... }));
 *        const styles = useThemedStyles(createStyles);
 */
export function makeStyles<T extends StyleSheet.NamedStyles<T>>(
    createStylesFn: (theme: Theme) => T
) {
    return createStylesFn;
}

// Primary export should be the universal styles hook
export default useUniversalStyles;