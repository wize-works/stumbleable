import { StyleSheet } from 'react-native';
import { Theme } from './theme';

/**
 * Universal StyleSheet for Stumbleable Mobile
 * Provides consistent, reusable styles across the entire application
 * Based on the web application's design system
 */

export const createUniversalStyles = (theme: Theme) => StyleSheet.create({
    // === LAYOUT CONTAINERS ===
    container: {
        flex: 1,
        backgroundColor: theme.colors.base100,
    },

    containerPadded: {
        flex: 1,
        backgroundColor: theme.colors.base100,
        paddingHorizontal: theme.spacing.lg,
    },

    centeredContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.colors.base100,
        paddingHorizontal: theme.spacing.lg,
    },

    formContainer: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: theme.spacing.lg,
    },

    // === CARDS & SURFACES ===
    card: {
        backgroundColor: theme.colors.base200,
        borderRadius: theme.borderRadius.large,
        padding: theme.spacing.lg,
        marginBottom: theme.spacing.md,
        borderWidth: 1,
        borderColor: theme.colors.border,
        ...theme.shadows.card,
    },

    cardElevated: {
        backgroundColor: theme.colors.base200,
        borderRadius: theme.borderRadius.large,
        padding: theme.spacing.lg,
        marginBottom: theme.spacing.md,
        borderWidth: 1,
        borderColor: theme.colors.border,
        ...theme.shadows.float,
    },

    surface: {
        backgroundColor: theme.colors.base200,
        borderRadius: theme.borderRadius.medium,
        padding: theme.spacing.md,
    },

    // === TYPOGRAPHY ===
    title: {
        fontSize: theme.typography.fontSizes.xxxl,
        fontWeight: theme.typography.fontWeights.bold,
        textAlign: 'center',
        marginBottom: theme.spacing.sm,
        color: theme.colors.baseContent,
    },

    subtitle: {
        fontSize: theme.typography.fontSizes.base,
        textAlign: 'center',
        marginBottom: theme.spacing.xl,
        color: theme.colors.placeholder,
    },

    heading: {
        fontSize: theme.typography.fontSizes.xl,
        fontWeight: theme.typography.fontWeights.semibold,
        color: theme.colors.baseContent,
        marginBottom: theme.spacing.md,
    },

    bodyText: {
        fontSize: theme.typography.fontSizes.base,
        fontWeight: theme.typography.fontWeights.normal,
        color: theme.colors.baseContent,
        lineHeight: 24,
    },

    captionText: {
        fontSize: theme.typography.fontSizes.sm,
        fontWeight: theme.typography.fontWeights.medium,
        color: theme.colors.placeholder,
    },

    linkText: {
        fontSize: theme.typography.fontSizes.base,
        fontWeight: theme.typography.fontWeights.semibold,
        color: theme.colors.primary,
    },

    // === FORM ELEMENTS ===
    input: {
        backgroundColor: theme.colors.base200,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.md,
        borderRadius: theme.borderRadius.medium,
        marginBottom: theme.spacing.md,
        fontSize: theme.typography.fontSizes.base,
        borderWidth: 1,
        borderColor: theme.colors.border,
        color: theme.colors.baseContent,
    },

    inputFocused: {
        borderColor: theme.colors.primary,
        borderWidth: 2,
    },

    inputError: {
        borderColor: theme.colors.error,
        borderWidth: 2,
    },

    // === BUTTONS ===
    button: {
        backgroundColor: theme.colors.primary,
        paddingVertical: theme.spacing.md,
        paddingHorizontal: theme.spacing.lg,
        borderRadius: theme.borderRadius.medium,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: theme.spacing.sm,
        marginBottom: theme.spacing.lg,
        ...theme.shadows.card,
    },

    buttonSecondary: {
        backgroundColor: theme.colors.secondary,
        paddingVertical: theme.spacing.md,
        paddingHorizontal: theme.spacing.lg,
        borderRadius: theme.borderRadius.medium,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: theme.spacing.sm,
        marginBottom: theme.spacing.lg,
        ...theme.shadows.card,
    },

    buttonOutline: {
        backgroundColor: 'transparent',
        paddingVertical: theme.spacing.md,
        paddingHorizontal: theme.spacing.lg,
        borderRadius: theme.borderRadius.medium,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: theme.spacing.sm,
        marginBottom: theme.spacing.lg,
        borderWidth: 2,
        borderColor: theme.colors.primary,
    },

    buttonDisabled: {
        opacity: 0.6,
    },

    buttonText: {
        color: theme.colors.primaryContent,
        fontSize: theme.typography.fontSizes.base,
        fontWeight: theme.typography.fontWeights.semibold,
    },

    buttonTextSecondary: {
        color: theme.colors.secondaryContent,
        fontSize: theme.typography.fontSizes.base,
        fontWeight: theme.typography.fontWeights.semibold,
    },

    buttonTextOutline: {
        color: theme.colors.primary,
        fontSize: theme.typography.fontSizes.base,
        fontWeight: theme.typography.fontWeights.semibold,
    },

    // === SOCIAL AUTHENTICATION ===
    socialButtons: {
        gap: theme.spacing.md,
        marginBottom: theme.spacing.lg,
    },

    socialButtonsRow: {
        flexDirection: 'row',
        gap: theme.spacing.md,
        marginBottom: theme.spacing.lg,
    },

    socialButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: theme.spacing.md,
        paddingHorizontal: theme.spacing.lg,
        borderRadius: theme.borderRadius.medium,
        borderWidth: 1,
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.base200,
        gap: theme.spacing.sm,
    },

    socialButtonRow: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: theme.spacing.md,
        borderRadius: theme.borderRadius.medium,
        borderWidth: 1,
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.base200,
        gap: theme.spacing.sm,
    },

    socialButtonGoogle: {
        borderColor: theme.colors.info,
    },

    socialButtonFacebook: {
        borderColor: theme.colors.info,
    },

    socialButtonText: {
        fontSize: theme.typography.fontSizes.base,
        fontWeight: theme.typography.fontWeights.semibold,
        color: theme.colors.baseContent,
    },

    // === DIVIDERS ===
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: theme.spacing.lg,
    },

    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: theme.colors.border,
    },

    dividerText: {
        marginHorizontal: theme.spacing.md,
        color: theme.colors.placeholder,
        fontSize: theme.typography.fontSizes.sm,
    },

    // === NAVIGATION & LAYOUT ===
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: theme.spacing.lg,
    },

    footerText: {
        color: theme.colors.placeholder,
        fontSize: theme.typography.fontSizes.base,
    },

    row: {
        flexDirection: 'row',
        alignItems: 'center',
    },

    rowSpaced: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },

    column: {
        flexDirection: 'column',
    },

    // === UTILITIES ===
    flex1: {
        flex: 1,
    },

    textCenter: {
        textAlign: 'center',
    },

    textLeft: {
        textAlign: 'left',
    },

    textRight: {
        textAlign: 'right',
    },

    marginBottomMd: {
        marginBottom: theme.spacing.md,
    },

    marginBottomLg: {
        marginBottom: theme.spacing.lg,
    },

    paddingHorizontalMd: {
        paddingHorizontal: theme.spacing.md,
    },

    paddingHorizontalLg: {
        paddingHorizontal: theme.spacing.lg,
    },

    // === DISCOVERY CARD STYLES ===
    discoveryCard: {
        backgroundColor: theme.colors.base200,
        borderRadius: theme.borderRadius.large,
        margin: theme.spacing.lg,
        borderWidth: 1,
        borderColor: theme.colors.border,
        overflow: 'hidden',
        ...theme.shadows.card,
    },

    discoveryCardImage: {
        width: '100%',
        height: 200,
        resizeMode: 'cover',
    },

    discoveryCardContent: {
        padding: theme.spacing.lg,
    },

    discoveryCardTitle: {
        fontSize: theme.typography.fontSizes.lg,
        fontWeight: theme.typography.fontWeights.semibold,
        color: theme.colors.baseContent,
        marginBottom: theme.spacing.sm,
    },

    discoveryCardDescription: {
        fontSize: theme.typography.fontSizes.base,
        color: theme.colors.placeholder,
        lineHeight: 22,
        marginBottom: theme.spacing.md,
    },

    discoveryCardDomain: {
        fontSize: theme.typography.fontSizes.sm,
        color: theme.colors.primary,
        fontWeight: theme.typography.fontWeights.medium,
    },

    // === REACTION BAR ===
    reactionBar: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        backgroundColor: theme.colors.base200,
        paddingVertical: theme.spacing.md,
        paddingHorizontal: theme.spacing.lg,
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
    },

    reactionButton: {
        alignItems: 'center',
        justifyContent: 'center',
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: theme.colors.base100,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },

    reactionButtonLike: {
        backgroundColor: theme.colors.success + '20', // 20% opacity
        borderColor: theme.colors.success,
    },

    reactionButtonDislike: {
        backgroundColor: theme.colors.error + '20', // 20% opacity
        borderColor: theme.colors.error,
    },

    reactionButtonSave: {
        backgroundColor: theme.colors.accent + '20', // 20% opacity
        borderColor: theme.colors.accent,
    },

    reactionButtonShare: {
        backgroundColor: theme.colors.info + '20', // 20% opacity
        borderColor: theme.colors.info,
    },

    // === ROUND BUTTONS ===
    roundButton: {
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        ...theme.shadows.card,
    },

    roundButtonSmall: {
        width: 32,
        height: 32,
        borderRadius: 16,
    },

    roundButtonMedium: {
        width: 40,
        height: 40,
        borderRadius: 20,
    },

    roundButtonLarge: {
        width: 48,
        height: 48,
        borderRadius: 24,
    },

    roundButtonXL: {
        width: 56,
        height: 56,
        borderRadius: 28,
    },

    // Round button variants
    roundButtonPrimary: {
        backgroundColor: theme.colors.primary,
        borderColor: theme.colors.primary,
    },

    roundButtonSecondary: {
        backgroundColor: theme.colors.secondary,
        borderColor: theme.colors.secondary,
    },

    roundButtonNeutral: {
        backgroundColor: theme.colors.base200,
        borderColor: theme.colors.border,
    },

    roundButtonGhost: {
        backgroundColor: 'transparent',
        borderColor: 'transparent',
    },

    roundButtonDanger: {
        backgroundColor: theme.colors.error,
        borderColor: theme.colors.error,
    },

    // === STUMBLE BUTTON ===
    stumbleButtonContainer: {
        alignItems: 'center',
        marginVertical: theme.spacing.xl,
    },

    stumbleButton: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: theme.spacing.xl,
        paddingHorizontal: theme.spacing.xxl,
        borderRadius: theme.borderRadius.large,
        borderWidth: 2,
        minHeight: 100,
        minWidth: 200,
        ...theme.shadows.float,
    },

    stumbleButtonContent: {
        alignItems: 'center',
        gap: theme.spacing.sm,
    },

    stumbleButtonIcon: {
        marginBottom: theme.spacing.xs,
    },

    stumbleButtonText: {
        fontSize: theme.typography.fontSizes.xl,
        fontWeight: theme.typography.fontWeights.bold,
        textAlign: 'center',
    },

    stumbleButtonSubtext: {
        fontSize: theme.typography.fontSizes.sm,
        textAlign: 'center',
        opacity: 0.7,
        marginTop: theme.spacing.xs,
    },

    // === FLOATING REACTION BAR ===
    floatingReactionBar: {
        position: 'absolute',
        bottom: theme.spacing.lg,
        left: '50%',
        transform: [{ translateX: -150 }], // Half of estimated width
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: theme.spacing.md,
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.md,
        borderRadius: theme.borderRadius.round,
        borderWidth: 1,
        minWidth: 300,
    },

    // === MORE ACTIONS MODAL ===
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: theme.spacing.lg,
    },

    moreActionsMenu: {
        backgroundColor: 'white',
        borderRadius: theme.borderRadius.large,
        borderWidth: 1,
        padding: theme.spacing.lg,
        minWidth: 250,
        maxWidth: 300,
        ...theme.shadows.float,
    },

    modalTitle: {
        fontSize: theme.typography.fontSizes.lg,
        fontWeight: theme.typography.fontWeights.bold,
        textAlign: 'center',
        marginBottom: theme.spacing.lg,
    },

    moreActionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: theme.spacing.md,
        paddingHorizontal: theme.spacing.sm,
        gap: theme.spacing.md,
        borderRadius: theme.borderRadius.medium,
    },

    moreActionText: {
        fontSize: theme.typography.fontSizes.base,
        fontWeight: theme.typography.fontWeights.medium,
    },

    cancelAction: {
        marginTop: theme.spacing.md,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
        paddingTop: theme.spacing.md,
        justifyContent: 'center',
    },

    // === STUMBLE PAGE - FULL SCREEN LAYOUT ===
    topControlsBar: {
        backgroundColor: 'white',
        borderBottomWidth: 1,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
    },

    topControlsContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.sm,
        minHeight: 0,
    },

    domainBadge: {
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: theme.spacing.xs,
        borderRadius: theme.borderRadius.small,
        flexShrink: 0,
    },

    domainText: {
        fontSize: theme.typography.fontSizes.xs,
        fontWeight: theme.typography.fontWeights.medium,
    },

    discoveryTitle: {
        fontSize: theme.typography.fontSizes.sm,
        fontWeight: theme.typography.fontWeights.semibold,
        flex: 1,
        minWidth: 0,
    },

    discoveryReason: {
        fontSize: theme.typography.fontSizes.xs,
        fontStyle: 'italic',
        marginTop: theme.spacing.xs,
        paddingHorizontal: theme.spacing.xs,
    },

    // === WEBVIEW AND LOADING STATES ===
    webViewLoading: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
    },

    loadingText: {
        fontSize: theme.typography.fontSizes.base,
        textAlign: 'center',
    },

    initialLoading: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: theme.spacing.lg,
    },

    loadingTitle: {
        fontSize: theme.typography.fontSizes.xl,
        fontWeight: theme.typography.fontWeights.bold,
        textAlign: 'center',
        marginBottom: theme.spacing.sm,
    },

    loadingSubtitle: {
        fontSize: theme.typography.fontSizes.base,
        textAlign: 'center',
    },

    webViewErrorBanner: {
        position: 'absolute',
        top: theme.spacing.lg,
        left: theme.spacing.md,
        right: theme.spacing.md,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: theme.spacing.md,
        borderRadius: theme.borderRadius.medium,
        borderWidth: 1,
        ...theme.shadows.card,
    },

    errorBannerText: {
        fontSize: theme.typography.fontSizes.sm,
        flex: 1,
        marginRight: theme.spacing.sm,
    },

    viewDetailsButton: {
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
        borderRadius: theme.borderRadius.small,
    },

    viewDetailsButtonText: {
        fontSize: theme.typography.fontSizes.sm,
        fontWeight: theme.typography.fontWeights.semibold,
    },

    loadingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
    },

    loadingOverlayText: {
        fontSize: theme.typography.fontSizes.xl,
        fontWeight: theme.typography.fontWeights.semibold,
        textAlign: 'center',
        marginBottom: theme.spacing.sm,
    },

    loadingOverlaySubtext: {
        fontSize: theme.typography.fontSizes.sm,
        textAlign: 'center',
    },

    // === DISCOVERY MODAL ===
    modalContainer: {
        flex: 1,
    },

    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: theme.spacing.lg,
        borderBottomWidth: 1,
    },

    stumbleModalTitle: {
        fontSize: theme.typography.fontSizes.xl,
        fontWeight: theme.typography.fontWeights.bold,
    },

    closeButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },

    closeButtonText: {
        fontSize: theme.typography.fontSizes.lg,
        fontWeight: theme.typography.fontWeights.bold,
    },

    modalContent: {
        flex: 1,
        padding: theme.spacing.lg,
    },
});