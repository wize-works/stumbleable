'use client';

import { useEffect } from 'react';
import { useClerk, useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';

export default function SignOutPage() {
    const { signOut } = useClerk();
    const { isSignedIn } = useUser();
    const router = useRouter();

    useEffect(() => {
        const performSignOut = async () => {
            console.log('Sign out page loaded, user signed in:', isSignedIn);

            if (!isSignedIn) {
                console.log('User already signed out, redirecting to home');
                router.push('/');
                return;
            }

            try {
                console.log('Attempting to sign out...');

                // Clear any local storage
                if (typeof window !== 'undefined') {
                    localStorage.removeItem('user-preferences');
                    localStorage.removeItem('seen-discoveries');
                    sessionStorage.clear();
                }

                // Perform sign out
                await signOut();

                console.log('Sign out successful, redirecting to home');
                router.push('/');

            } catch (error) {
                console.error('Sign out failed:', error);

                // Force redirect anyway
                if (typeof window !== 'undefined') {
                    localStorage.clear();
                    sessionStorage.clear();
                    window.location.href = '/';
                } else {
                    router.push('/');
                }
            }
        };

        performSignOut();
    }, [isSignedIn, signOut, router]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-base-100">
            <div className="text-center">
                <div className="loading loading-spinner loading-lg text-primary"></div>
                <p className="text-base-content mt-4">Signing you out...</p>
            </div>
        </div>
    );
}