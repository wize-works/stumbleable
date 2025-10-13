import { faRefresh } from '@awesome.me/kit-240c9f263d/icons/classic/solid';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import React, { useState } from 'react';
import { Animated, Pressable, Text, View, ViewStyle } from 'react-native';
import { useTheme } from '../lib/ThemeProvider';
import { useUniversalStyles } from '../lib/useThemedStyles';

interface StumbleButtonProps {
    onPress?: () => void;
    disabled?: boolean;
    loading?: boolean;
    style?: ViewStyle;
}

export function StumbleButton({ onPress, disabled = false, loading = false, style }: StumbleButtonProps) {
    const { theme } = useTheme();
    const styles = useUniversalStyles();
    const [pressAnim] = useState(new Animated.Value(1));

    const handlePressIn = () => {
        Animated.spring(pressAnim, {
            toValue: 0.95,
            useNativeDriver: true,
        }).start();
    };

    const handlePressOut = () => {
        Animated.spring(pressAnim, {
            toValue: 1,
            useNativeDriver: true,
        }).start();
    };

    const handlePress = () => {
        if (!disabled && !loading && onPress) {
            onPress();
        }
    };

    const buttonStyle = [
        styles.stumbleButton,
        {
            backgroundColor: disabled || loading ? theme.colors.neutral : theme.colors.primary,
            borderColor: theme.colors.primary,
        },
        style,
    ];

    const textStyle = {
        color: disabled || loading ? theme.colors.neutralContent : theme.colors.primaryContent,
    };

    return (
        <View style={styles.stumbleButtonContainer}>
            <Animated.View
                style={[
                    { transform: [{ scale: pressAnim }] }
                ]}
            >
                <Pressable
                    style={buttonStyle}
                    onPress={handlePress}
                    onPressIn={handlePressIn}
                    onPressOut={handlePressOut}
                    disabled={disabled || loading}
                    accessibilityRole="button"
                    accessibilityLabel={loading ? "Loading new discovery" : "Stumble to discover something new"}
                    accessibilityHint="Press to get a new discovery. You can also press the spacebar."
                >
                    <View style={styles.stumbleButtonContent}>
                        <FontAwesomeIcon
                            icon={faRefresh as any}
                            size={24}
                            color={textStyle.color}
                            style={[
                                styles.stumbleButtonIcon,
                                loading && { transform: [{ rotate: '360deg' }] }
                            ]}
                        />
                        <Text style={[styles.stumbleButtonText, textStyle]}>
                            {loading ? 'Finding...' : 'Stumble'}
                        </Text>
                        <Text style={[styles.stumbleButtonSubtext, { color: theme.colors.baseContent + '80' }]}>
                            Press Space or tap here
                        </Text>
                    </View>
                </Pressable>
            </Animated.View>
        </View>
    );
}