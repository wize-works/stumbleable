import { UserAPI } from '@/lib/api-client';
import { useAuth, useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export function useOnboardingCheck() {
    const { user, isLoaded } = useUser();
    const { getToken } = useAuth();
    const router = useRouter();
    const [needsOnboarding, setNeedsOnboarding] = useState<boolean | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function checkOnboardingStatus() {
            if (!isLoaded || !user?.id) {
                setLoading(false);
                return;
            }

            try {
                const token = await getToken();
                if (!token) {
                    setLoading(false);
                    return;
                }

                // Try to get the user profile
                const userProfile = await UserAPI.getUser(user.id, token);

                // Check if user has meaningful preferences set AND has accepted guidelines
                const hasPreferences = userProfile.preferredTopics.length > 0;
                const hasAcceptedGuidelines = !!userProfile.guidelinesAcceptedAt;

                // User needs onboarding if they don't have preferences OR haven't accepted guidelines
                setNeedsOnboarding(!hasPreferences || !hasAcceptedGuidelines);
            } catch (error) {
                // If user doesn't exist (404), they need onboarding
                if (error instanceof Error && error.message.includes('404')) {
                    setNeedsOnboarding(true);
                } else {
                    console.error('Error checking onboarding status:', error);
                    setNeedsOnboarding(false);
                }
            } finally {
                setLoading(false);
            }
        }

        checkOnboardingStatus();
    }, [isLoaded, user?.id, getToken]);

    const redirectToOnboarding = () => {
        router.push('/onboarding');
    };

    const skipOnboarding = () => {
        setNeedsOnboarding(false);
    };

    return {
        needsOnboarding,
        loading,
        redirectToOnboarding,
        skipOnboarding
    };
}