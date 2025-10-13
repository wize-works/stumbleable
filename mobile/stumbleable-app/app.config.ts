import { ConfigContext, ExpoConfig } from '@expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
    ...config,
    name: 'Stumbleable',
    slug: 'stumbleable-app',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'automatic',
    newArchEnabled: true,
    scheme: 'stumbleable',
    splash: {
        image: './assets/splash-icon.png',
        resizeMode: 'contain',
        backgroundColor: '#ffffff'
    },
    ios: {
        supportsTablet: true,
        bundleIdentifier: 'com.wizeworks.stumbleable'
    },
    android: {
        adaptiveIcon: {
            foregroundImage: './assets/adaptive-icon.png',
            backgroundColor: '#ffffff'
        },
        edgeToEdgeEnabled: true,
        predictiveBackGestureEnabled: false,
        package: 'com.wizeworks.stumbleable'
    },
    web: {
        favicon: './assets/favicon.png'
    },
    extra: {
        // Environment variables accessible via Constants.expoConfig.extra
        clerkPublishableKey: process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY,
        discoveryApiUrl: process.env.EXPO_PUBLIC_DISCOVERY_API_URL,
        interactionApiUrl: process.env.EXPO_PUBLIC_INTERACTION_API_URL,
        userApiUrl: process.env.EXPO_PUBLIC_USER_API_URL,
        moderationApiUrl: process.env.EXPO_PUBLIC_MODERATION_API_URL,
    },
    plugins: [
        'expo-router',
        [
            '@clerk/clerk-expo',
            {
                scheme: 'stumbleable'
            }
        ]
    ]
});