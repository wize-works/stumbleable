'use client';

import { ApiError, UserAPI } from '@/lib/api-client';
import { useAuth, useUser } from '@clerk/nextjs';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface UserInitializationState {
    isInitialized: boolean;
    isInitializing: boolean;
    error: string | null;
    retryInitialization: () => void;
}

const UserInitializationContext = createContext<UserInitializationState | null>(null);

// Cache key for sessionStorage
const USER_INIT_CACHE_KEY = 'stumbleable_user_initialized';

interface UserInitializationProviderProps {
    children: ReactNode;
}

export function UserInitializationProvider({ children }: UserInitializationProviderProps) {
    const { user, isLoaded, isSignedIn } = useUser();
    const { getToken } = useAuth();
    const [isInitialized, setIsInitialized] = useState(false);
    const [isInitializing, setIsInitializing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const initializeUser = async () => {
        // Don't run if not loaded, not signed in, or no user ID
        if (!isLoaded || !isSignedIn || !user?.id) {
            return;
        }

        // Check if we've already initialized this user in this session
        const cacheKey = `${USER_INIT_CACHE_KEY}_${user.id}`;
        const cachedResult = sessionStorage.getItem(cacheKey);

        if (cachedResult === 'success') {
            console.log('UserInitializationProvider: User already initialized this session, skipping check');
            setIsInitialized(true);
            return;
        }

        // Don't run multiple times simultaneously
        if (isInitializing) {
            return;
        }

        setIsInitializing(true);
        setError(null);

        try {
            const token = await getToken();
            if (!token) {
                console.log('No token available, user may still be authenticating');
                setIsInitializing(false);
                return;
            }

            console.log('UserInitializationProvider: Checking if user exists in database...');

            // Try to get existing user
            try {
                await UserAPI.getUser(user.id, token);
                console.log('UserInitializationProvider: User exists in database');

                // Cache the successful result for this session
                sessionStorage.setItem(cacheKey, 'success');
                setIsInitialized(true);
            } catch (error) {
                // If user doesn't exist (404), create them with Clerk data
                if (error instanceof ApiError && error.status === 404) {
                    console.log('UserInitializationProvider: User not found, creating in database with Clerk data...');

                    // Extract user data from Clerk
                    const clerkUserData = {
                        email: user.primaryEmailAddress?.emailAddress || '',
                        fullName: user.fullName || '',
                        imageUrl: user.imageUrl || '',
                        // Set sensible defaults for preferences
                        preferredTopics: ['technology', 'culture', 'science'],
                        wildness: 35
                    };

                    console.log('UserInitializationProvider: Creating user with data:', {
                        id: user.id,
                        email: clerkUserData.email,
                        name: clerkUserData.fullName
                    });

                    await UserAPI.createUser(user.id, token, clerkUserData);

                    console.log('UserInitializationProvider: User successfully created in database with Clerk data');

                    // Cache the successful result for this session
                    sessionStorage.setItem(cacheKey, 'success');
                    setIsInitialized(true);
                } else {
                    // Other API errors (401, 500, etc.)
                    console.error('UserInitializationProvider: Error checking user existence:', error);
                    throw error;
                }
            }
        } catch (error) {
            console.error('UserInitializationProvider: Critical error ensuring user exists:', error);
            setError(error instanceof ApiError ? error.message : 'System error during user initialization');
        } finally {
            setIsInitializing(false);
        }
    };

    const retryInitialization = () => {
        if (user?.id) {
            const cacheKey = `${USER_INIT_CACHE_KEY}_${user.id}`;
            sessionStorage.removeItem(cacheKey);
            setError(null);
            setIsInitialized(false);
            initializeUser();
        }
    };

    useEffect(() => {
        initializeUser();
    }, [isLoaded, isSignedIn, user?.id]);

    // Clear cache if user changes
    useEffect(() => {
        if (user?.id) {
            const cacheKey = `${USER_INIT_CACHE_KEY}_${user.id}`;
            const cachedResult = sessionStorage.getItem(cacheKey);
            if (!cachedResult) {
                setIsInitialized(false);
            }
        } else {
            setIsInitialized(false);
        }
    }, [user?.id]);

    return (
        <UserInitializationContext.Provider
            value={{
                isInitialized,
                isInitializing,
                error,
                retryInitialization
            }}
        >
            {children}
        </UserInitializationContext.Provider>
    );
}

export function useUserInitialization(): UserInitializationState {
    const context = useContext(UserInitializationContext);
    if (!context) {
        throw new Error('useUserInitialization must be used within a UserInitializationProvider');
    }
    return context;
}