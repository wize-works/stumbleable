import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTheme } from '../lib/ThemeProvider';
import { useUniversalStyles } from '../lib/useThemedStyles';

type RoundButtonVariant = 'primary' | 'secondary' | 'neutral' | 'ghost' | 'danger';
type RoundButtonSize = 'small' | 'medium' | 'large' | 'xl';

type RoundButtonProps = {
    /** Visual variant of the button */
    variant?: RoundButtonVariant;
    /** Size of the button */
    size?: RoundButtonSize;
    /** FontAwesome icon to display */
    icon?: any;
    /** Text label (optional, for accessibility) */
    label?: string;
    /** Whether the button is disabled */
    disabled?: boolean;
    /** Whether the button is in pressed/active state */
    active?: boolean;
    /** Press handler */
    onPress?: () => void;
    /** Long press handler */
    onLongPress?: () => void;
    /** Accessibility label */
    accessibilityLabel?: string;
    /** Accessibility hint */
    accessibilityHint?: string;
    /** Custom container style */
    style?: any;
    /** Badge count to show in top-right corner */
    badge?: number;
};

export function RoundButton({
    variant = 'neutral',
    size = 'medium',
    icon,
    label,
    disabled = false,
    active = false,
    onPress,
    onLongPress,
    accessibilityLabel,
    accessibilityHint,
    style,
    badge
}: RoundButtonProps) {
    const { theme } = useTheme();
    const styles = useUniversalStyles();

    // Size configurations
    const sizeConfig = {
        small: {
            width: 32,
            height: 32,
            borderRadius: 16,
            iconSize: 14,
            fontSize: theme.typography.fontSizes.xs
        },
        medium: {
            width: 40,
            height: 40,
            borderRadius: 20,
            iconSize: 16,
            fontSize: theme.typography.fontSizes.sm
        },
        large: {
            width: 48,
            height: 48,
            borderRadius: 24,
            iconSize: 18,
            fontSize: theme.typography.fontSizes.base
        },
        xl: {
            width: 56,
            height: 56,
            borderRadius: 28,
            iconSize: 20,
            fontSize: theme.typography.fontSizes.lg
        }
    };

    // Variant configurations
    const variantConfig = {
        primary: {
            backgroundColor: active ? theme.colors.primaryContent : theme.colors.primary,
            borderColor: theme.colors.primary,
            iconColor: active ? theme.colors.primary : theme.colors.primaryContent,
            textColor: active ? theme.colors.primary : theme.colors.primaryContent,
        },
        secondary: {
            backgroundColor: active ? theme.colors.secondaryContent : theme.colors.secondary,
            borderColor: theme.colors.secondary,
            iconColor: active ? theme.colors.secondary : theme.colors.secondaryContent,
            textColor: active ? theme.colors.secondary : theme.colors.secondaryContent,
        },
        neutral: {
            backgroundColor: active ? theme.colors.baseContent : theme.colors.base200,
            borderColor: theme.colors.border,
            iconColor: active ? theme.colors.base200 : theme.colors.baseContent,
            textColor: active ? theme.colors.base200 : theme.colors.baseContent,
        },
        ghost: {
            backgroundColor: active ? theme.colors.base300 : 'transparent',
            borderColor: active ? theme.colors.border : 'transparent',
            iconColor: theme.colors.baseContent,
            textColor: theme.colors.baseContent,
        },
        danger: {
            backgroundColor: active ? theme.colors.errorContent : theme.colors.error,
            borderColor: theme.colors.error,
            iconColor: active ? theme.colors.error : theme.colors.errorContent,
            textColor: active ? theme.colors.error : theme.colors.errorContent,
        }
    };

    const sizeStyles = sizeConfig[size];
    const variantStyles = variantConfig[variant];

    const buttonStyles = [
        {
            width: sizeStyles.width,
            height: sizeStyles.height,
            borderRadius: sizeStyles.borderRadius,
            backgroundColor: disabled ? theme.colors.disabled : variantStyles.backgroundColor,
            borderWidth: variant === 'ghost' && !active ? 0 : 1,
            borderColor: disabled ? theme.colors.border : variantStyles.borderColor,
            justifyContent: 'center' as const,
            alignItems: 'center' as const,
            position: 'relative' as const,
            ...theme.shadows.card,
        },
        style
    ];

    const iconColor = disabled ? theme.colors.placeholder : variantStyles.iconColor;
    const textColor = disabled ? theme.colors.placeholder : variantStyles.textColor;

    return (
        <View style={{ position: 'relative' }}>
            <Pressable
                style={({ pressed }) => [
                    buttonStyles,
                    pressed && !disabled && { opacity: 0.8, transform: [{ scale: 0.95 }] }
                ]}
                onPress={disabled ? undefined : onPress}
                onLongPress={disabled ? undefined : onLongPress}
                disabled={disabled}
                accessibilityRole="button"
                accessibilityLabel={accessibilityLabel || label}
                accessibilityHint={accessibilityHint}
                accessibilityState={{
                    disabled,
                    selected: active
                }}
            >
                {icon && (
                    <FontAwesomeIcon
                        icon={icon as any}
                        size={sizeStyles.iconSize}
                        color={iconColor}
                    />
                )}
                {label && !icon && (
                    <Text style={{
                        fontSize: sizeStyles.fontSize,
                        fontWeight: theme.typography.fontWeights.semibold,
                        color: textColor
                    }}>
                        {label}
                    </Text>
                )}
            </Pressable>

            {/* Badge indicator */}
            {badge !== undefined && badge > 0 && (
                <View style={{
                    position: 'absolute',
                    top: -4,
                    right: -4,
                    minWidth: 18,
                    height: 18,
                    borderRadius: 9,
                    backgroundColor: theme.colors.error,
                    justifyContent: 'center',
                    alignItems: 'center',
                    paddingHorizontal: 4,
                }}>
                    <Text style={{
                        fontSize: 10,
                        fontWeight: theme.typography.fontWeights.bold,
                        color: theme.colors.errorContent,
                        textAlign: 'center'
                    }}>
                        {badge > 99 ? '99+' : badge.toString()}
                    </Text>
                </View>
            )}
        </View>
    );
}

/**
 * Pre-configured round buttons for common use cases
 */

// Reaction bar buttons
export const LikeButton = (props: Omit<RoundButtonProps, 'variant' | 'icon'>) => (
    <RoundButton {...props} variant="primary" icon={require('@awesome.me/kit-240c9f263d/icons/sharp-duotone/solid').faThumbsUp} />
);

export const DislikeButton = (props: Omit<RoundButtonProps, 'variant' | 'icon'>) => (
    <RoundButton {...props} variant="ghost" icon={require('@awesome.me/kit-240c9f263d/icons/sharp-duotone/solid').faThumbsDown} />
);

export const SaveButton = (props: Omit<RoundButtonProps, 'variant' | 'icon'>) => (
    <RoundButton {...props} variant="secondary" icon={require('@awesome.me/kit-240c9f263d/icons/sharp-duotone/solid').faBookmark} />
);

export const ShareButton = (props: Omit<RoundButtonProps, 'variant' | 'icon'>) => (
    <RoundButton {...props} variant="ghost" icon={require('@awesome.me/kit-240c9f263d/icons/sharp-duotone/solid').faShare} />
);

// Theme toggle button
export const ThemeToggleButton = (props: Omit<RoundButtonProps, 'variant'>) => (
    <RoundButton {...props} variant="ghost" />
);

export default RoundButton;