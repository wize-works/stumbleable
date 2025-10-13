import { faExternalLink, faGlobe } from '@awesome.me/kit-240c9f263d/icons/sharp-duotone/solid';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import React from 'react';
import { Image, Linking, Pressable, Text, View } from 'react-native';
import { Discovery } from '../lib/api-client';
import { useTheme } from '../lib/ThemeProvider';
import { useUniversalStyles } from '../lib/useThemedStyles';

// Extended Discovery type for display purposes
export type DiscoveryWithReason = Discovery & {
    reason?: string; // Why this was recommended
};

type DiscoveryCardProps = {
    discovery: DiscoveryWithReason;
    /** Whether to show the rationale for this discovery */
    showReason?: boolean;
    /** Whether there was a WebView error loading this content */
    hasWebViewError?: boolean;
    /** Custom container style */
    style?: any;
};

/**
 * DiscoveryCard Component
 * 
 * Displays a discoverable piece of content with image, title, description,
 * and metadata. Matches the web application's discovery card design.
 * 
 * Features:
 * - Tappable to open external URL
 * - Domain chip with favicon styling
 * - Optional read time estimation
 * - Topic tags
 * - Discovery reason explanation
 * - Responsive image handling
 */
export function DiscoveryCard({
    discovery,
    showReason = true,
    hasWebViewError = false,
    style
}: DiscoveryCardProps) {
    const { theme } = useTheme();
    const styles = useUniversalStyles();

    const handleOpenUrl = async () => {
        try {
            const supported = await Linking.canOpenURL(discovery.url);
            if (supported) {
                await Linking.openURL(discovery.url);
            } else {
                console.warn("Can't open URL:", discovery.url);
            }
        } catch (error) {
            console.error("Error opening URL:", error);
        }
    };

    return (
        <View style={[styles.cardElevated, style]}>
            {/* Image */}
            {discovery.image && (
                <View style={{
                    width: '100%',
                    height: 200,
                    borderRadius: theme.borderRadius.large,
                    overflow: 'hidden',
                    marginBottom: theme.spacing.md,
                }}>
                    <Image
                        source={{ uri: discovery.image }}
                        style={{
                            width: '100%',
                            height: '100%',
                        }}
                        resizeMode="cover"
                    />
                </View>
            )}

            {/* Domain Chip */}
            <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: theme.spacing.sm,
            }}>
                <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: theme.colors.primary + '20', // 20% opacity
                    paddingHorizontal: theme.spacing.sm,
                    paddingVertical: theme.spacing.xs,
                    borderRadius: theme.borderRadius.small,
                    marginRight: 'auto', // Push read time to right
                }}>
                    <FontAwesomeIcon
                        icon={faGlobe as any}
                        size={12}
                        color={theme.colors.primary}
                    />
                    <Text style={{
                        fontSize: theme.typography.fontSizes.xs,
                        fontWeight: theme.typography.fontWeights.semibold,
                        color: theme.colors.primary,
                        marginLeft: theme.spacing.xs,
                    }}>
                        {discovery.domain}
                    </Text>
                </View>

                {/* Read Time */}
                {discovery.readingTime && (
                    <Text style={[
                        styles.captionText,
                        { color: theme.colors.placeholder }
                    ]}>
                        {discovery.readingTime} min read
                    </Text>
                )}
            </View>

            {/* Title */}
            <Pressable onPress={handleOpenUrl}>
                <View style={{
                    flexDirection: 'row',
                    alignItems: 'flex-start',
                    marginBottom: theme.spacing.sm,
                }}>
                    <Text style={[
                        styles.heading,
                        {
                            color: theme.colors.baseContent,
                            flex: 1,
                            lineHeight: 24,
                        }
                    ]}>
                        {discovery.title}
                    </Text>
                    <FontAwesomeIcon
                        icon={faExternalLink as any}
                        size={16}
                        color={theme.colors.placeholder}
                        style={{ marginLeft: theme.spacing.sm }}
                    />
                </View>
            </Pressable>

            {/* Description */}
            {discovery.description && (
                <Text style={[
                    styles.bodyText,
                    {
                        color: theme.colors.placeholder,
                        lineHeight: 20,
                        marginBottom: theme.spacing.md,
                    }
                ]}>
                    {discovery.description}
                </Text>
            )}

            {/* Topics */}
            {discovery.topics && discovery.topics.length > 0 && (
                <View style={{
                    flexDirection: 'row',
                    flexWrap: 'wrap',
                    marginBottom: showReason ? theme.spacing.md : 0,
                    gap: theme.spacing.xs,
                }}>
                    {discovery.topics.map((topic, index) => (
                        <View
                            key={index}
                            style={{
                                backgroundColor: theme.colors.base300,
                                paddingHorizontal: theme.spacing.sm,
                                paddingVertical: theme.spacing.xs,
                                borderRadius: theme.borderRadius.small,
                            }}
                        >
                            <Text style={{
                                fontSize: theme.typography.fontSizes.xs,
                                color: theme.colors.baseContent,
                                fontWeight: theme.typography.fontWeights.medium,
                            }}>
                                {topic}
                            </Text>
                        </View>
                    ))}
                </View>
            )}

            {/* WebView Error Information */}
            {hasWebViewError && (
                <View style={{
                    backgroundColor: theme.colors.warning + '20',
                    borderColor: theme.colors.warning,
                    borderWidth: 1,
                    borderRadius: theme.borderRadius.medium,
                    padding: theme.spacing.md,
                    marginBottom: showReason && discovery.reason ? theme.spacing.md : 0,
                }}>
                    <Text style={{
                        fontSize: theme.typography.fontSizes.sm,
                        fontWeight: theme.typography.fontWeights.semibold,
                        color: theme.colors.baseContent,
                        marginBottom: theme.spacing.xs,
                    }}>
                        ⚠️ Display Issue Detected
                    </Text>
                    <Text style={{
                        fontSize: theme.typography.fontSizes.xs,
                        color: theme.colors.baseContent,
                        lineHeight: 16,
                    }}>
                        This website may have restrictions that prevent it from displaying properly in the mobile app.
                        You can still open it in your browser by tapping the title above.
                    </Text>
                </View>
            )}

            {/* Discovery Reason */}
            {showReason && discovery.reason && (
                <View style={{
                    borderTopWidth: 1,
                    borderTopColor: theme.colors.border,
                    paddingTop: theme.spacing.sm,
                }}>
                    <Text style={{
                        fontSize: theme.typography.fontSizes.xs,
                        color: theme.colors.placeholder,
                        fontStyle: 'italic',
                        lineHeight: 16,
                    }}>
                        💡 {discovery.reason}
                    </Text>
                </View>
            )}
        </View>
    );
}

export default DiscoveryCard;