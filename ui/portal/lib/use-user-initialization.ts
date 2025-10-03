/**
 * Hook to ensure user exists in database on protected pages
 * Redirects to onboarding if user doesn't exist (handles orphaned Clerk users)
 */

import { ApiError, UserAPI } from '@/lib/api-client';
import { useAuth, useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface UseUserInitializationResult {
    userExists: boolean | null; // null = loading, true = exists, false = doesn't exist
    isLoading: boolean;
    error: string | null;
}

export function useUserInitialization(): UseUserInitializationResult {
    const { user, isLoaded, isSignedIn } = useUser();
    const { getToken } = useAuth();
    const router = useRouter();
    const [userExists, setUserExists] = useState<boolean | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function checkUserExists() {
            if (!isLoaded || !isSignedIn || !user?.id) {
                setIsLoading(false);
                return;
            }

            try {
                const token = await getToken();
                if (!token) {
                    setError('No authentication token available');
                    setIsLoading(false);
                    return;
                }

                // Try to get user from our database
                await UserAPI.getUser(user.id, token);

                console.log('User exists in database');
                setUserExists(true);
                setIsLoading(false);
            } catch (error) {
                console.error('Error checking user existence:', error);

                if (error instanceof ApiError && error.status === 404) {
                    // User doesn't exist in our database - redirect to onboarding
                    console.log('User not found in database, redirecting to onboarding for account setup');
                    setUserExists(false);
                    setIsLoading(false);

                    // Redirect to onboarding where user creation will be handled
                    router.push('/onboarding');
                    return;
                }

                if (error instanceof ApiError && error.status === 401) {
                    setError('Authentication failed');
                    setIsLoading(false);
                    return;
                }

                // Other errors (service unavailable, etc.)
                setError(error instanceof ApiError ? error.message : 'Unknown error');
                setIsLoading(false);
            }
        }

        checkUserExists();
    }, [isLoaded, isSignedIn, user?.id, getToken, router]);

    return {
        userExists,
        isLoading,
        error
    };
}