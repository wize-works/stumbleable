import {
    faBookmark,
    faEllipsisVertical,
    faExternalLink,
    faFlag,
    faPlus,
    faRefresh,
    faShare,
    faThumbsDown,
    faThumbsUp
} from '@awesome.me/kit-240c9f263d/icons/sharp-duotone/solid';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import React, { useState } from 'react';
import { Linking, Modal, Pressable, Text, View, ViewStyle } from 'react-native';
import { useTheme } from '../lib/ThemeProvider';
import { useUniversalStyles } from '../lib/useThemedStyles';

type ReactionBarProps = {
    /** Current user reaction state */
    isSaved?: boolean;
    isLiked?: boolean;
    isSkipped?: boolean;

    /** Action handlers */
    onReaction?: (action: 'up' | 'down' | 'save' | 'share') => void;
    onStumble?: () => void;
    onAddToList?: () => void;
    onReport?: () => void;

    /** Content data for external actions */
    discoveryId?: string;
    discoveryTitle?: string;
    discoveryUrl?: string;

    /** UI state */
    disabled?: boolean;
    className?: string;
    style?: ViewStyle;
};

/**
 * Reaction Bar Component
 * 
 * A floating bottom bar matching the web application's reaction bar design exactly.
 * Features: Save, Like, Central Stumble, Skip, More Actions (Share, Add to List, External Link, Report)
 * 
 * Usage:
 * ```tsx
 * <ReactionBar
 *   isLiked={userReaction === 'like'}
 *   isSaved={isSaved}
 *   onReaction={(action) => handleReaction(action)}
 *   onStumble={() => handleStumble()}
 *   discoveryUrl="https://example.com"
 *   discoveryTitle="Amazing Discovery"
 *   discoveryId="123"
 * />
 * ```
 */
export function ReactionBar({
    isSaved = false,
    isLiked = false,
    isSkipped = false,
    onReaction,
    onStumble,
    onAddToList,
    onReport,
    discoveryId,
    discoveryTitle,
    discoveryUrl,
    disabled = false,
    style
}: ReactionBarProps) {
    const { theme } = useTheme();
    const styles = useUniversalStyles();
    const [showMoreActions, setShowMoreActions] = useState(false);

    const handleReaction = (action: 'up' | 'down' | 'save' | 'share') => {
        onReaction?.(action);
    };

    const handleShare = () => {
        if (discoveryUrl && discoveryTitle) {
            // In a real app, this would use React Native's Share API
            console.log('Share:', { url: discoveryUrl, title: discoveryTitle });
        }
        handleReaction('share');
        setShowMoreActions(false);
    };

    const handleExternalLink = () => {
        if (discoveryUrl) {
            Linking.openURL(discoveryUrl);
        }
        setShowMoreActions(false);
    };

    const handleAddToList = () => {
        onAddToList?.();
        setShowMoreActions(false);
    };

    const handleReport = () => {
        onReport?.();
        setShowMoreActions(false);
    };

    // Create the floating bottom reaction bar
    const ReactionButton = ({
        icon,
        onPress,
        active = false,
        variant = 'outline',
        size = 40,
        accessibilityLabel
    }: {
        icon: any;
        onPress: () => void;
        active?: boolean;
        variant?: 'outline' | 'filled';
        size?: number;
        accessibilityLabel: string;
    }) => (
        <Pressable
            onPress={onPress}
            disabled={disabled}
            accessibilityRole="button"
            accessibilityLabel={accessibilityLabel}
            style={[
                {
                    width: size,
                    height: size,
                    borderRadius: size / 2,
                    backgroundColor: active
                        ? theme.colors.primary
                        : variant === 'filled'
                            ? theme.colors.primary
                            : 'transparent',
                    borderWidth: 1,
                    borderColor: active || variant === 'filled'
                        ? theme.colors.primary
                        : theme.colors.border,
                    alignItems: 'center',
                    justifyContent: 'center',
                    ...theme.shadows.card,
                },
                disabled && { opacity: 0.5 }
            ]}
        >
            <FontAwesomeIcon
                icon={icon as any}
                size={16}
                color={active || variant === 'filled'
                    ? theme.colors.primaryContent
                    : theme.colors.baseContent}
            />
        </Pressable>
    );

    // Central Stumble Button (larger)
    const StumbleButton = () => (
        <Pressable
            onPress={onStumble}
            disabled={disabled}
            accessibilityRole="button"
            accessibilityLabel="Stumble to next discovery"
            style={[
                {
                    width: 56,
                    height: 56,
                    borderRadius: 28,
                    backgroundColor: theme.colors.primary,
                    borderWidth: 2,
                    borderColor: theme.colors.primary,
                    alignItems: 'center',
                    justifyContent: 'center',
                    ...theme.shadows.float,
                    marginHorizontal: theme.spacing.sm,
                },
                disabled && { opacity: 0.5 }
            ]}
        >
            <FontAwesomeIcon
                icon={faRefresh as any}
                size={20}
                color={theme.colors.primaryContent}
            />
        </Pressable>
    );

    return (
        <>
            {/* Main Floating Reaction Bar */}
            <View style={[
                styles.floatingReactionBar,
                {
                    backgroundColor: theme.colors.base100 + 'F0', // 95% opacity
                    borderColor: theme.colors.border,
                    ...theme.shadows.float,
                },
                style
            ]}>
                {/* Save Button */}
                <ReactionButton
                    icon={faBookmark}
                    onPress={() => handleReaction('save')}
                    active={isSaved}
                    accessibilityLabel="Save"
                />

                {/* Like Button */}
                <ReactionButton
                    icon={faThumbsUp}
                    onPress={() => handleReaction('up')}
                    active={isLiked}
                    accessibilityLabel="Like"
                />

                {/* Central Stumble Button */}
                <StumbleButton />

                {/* Skip Button */}
                <ReactionButton
                    icon={faThumbsDown}
                    onPress={() => handleReaction('down')}
                    active={isSkipped}
                    accessibilityLabel="Skip"
                />

                {/* More Actions Button */}
                <ReactionButton
                    icon={faEllipsisVertical}
                    onPress={() => setShowMoreActions(true)}
                    accessibilityLabel="More actions"
                />
            </View>

            {/* More Actions Modal */}
            <Modal
                visible={showMoreActions}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowMoreActions(false)}
            >
                <Pressable
                    style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}
                    onPress={() => setShowMoreActions(false)}
                >
                    <View style={[
                        styles.moreActionsMenu,
                        {
                            backgroundColor: theme.colors.base100,
                            borderColor: theme.colors.border,
                        }
                    ]}>
                        <Text style={[
                            styles.modalTitle,
                            { color: theme.colors.baseContent }
                        ]}>
                            More Actions
                        </Text>

                        {/* Share */}
                        <Pressable
                            style={styles.moreActionItem}
                            onPress={handleShare}
                        >
                            <FontAwesomeIcon
                                icon={faShare as any}
                                size={18}
                                color={theme.colors.baseContent}
                            />
                            <Text style={[styles.moreActionText, { color: theme.colors.baseContent }]}>
                                Share
                            </Text>
                        </Pressable>

                        {/* Add to List */}
                        {discoveryId && (
                            <Pressable
                                style={styles.moreActionItem}
                                onPress={handleAddToList}
                            >
                                <FontAwesomeIcon
                                    icon={faPlus as any}
                                    size={18}
                                    color={theme.colors.accent}
                                />
                                <Text style={[styles.moreActionText, { color: theme.colors.baseContent }]}>
                                    Add to List
                                </Text>
                            </Pressable>
                        )}

                        {/* External Link */}
                        {discoveryUrl && (
                            <Pressable
                                style={styles.moreActionItem}
                                onPress={handleExternalLink}
                            >
                                <FontAwesomeIcon
                                    icon={faExternalLink as any}
                                    size={18}
                                    color={theme.colors.secondary}
                                />
                                <Text style={[styles.moreActionText, { color: theme.colors.baseContent }]}>
                                    Open in Browser
                                </Text>
                            </Pressable>
                        )}

                        {/* Report */}
                        {discoveryId && (
                            <Pressable
                                style={styles.moreActionItem}
                                onPress={handleReport}
                            >
                                <FontAwesomeIcon
                                    icon={faFlag as any}
                                    size={18}
                                    color={theme.colors.error}
                                />
                                <Text style={[styles.moreActionText, { color: theme.colors.baseContent }]}>
                                    Report Content
                                </Text>
                            </Pressable>
                        )}

                        {/* Cancel */}
                        <Pressable
                            style={[styles.moreActionItem, styles.cancelAction]}
                            onPress={() => setShowMoreActions(false)}
                        >
                            <Text style={[styles.moreActionText, { color: theme.colors.baseContent }]}>
                                Cancel
                            </Text>
                        </Pressable>
                    </View>
                </Pressable>
            </Modal>
        </>
    );
}

export default ReactionBar;