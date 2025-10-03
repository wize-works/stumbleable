'use client';

import { useUserInitialization } from '@/lib/user-initialization-context';

/**
 * UserInitializer - Error handling UI for user initialization
 * This component shows error states when user initialization fails
 * 
 * Should be used with UserInitializationProvider in the root layout
 */
export function UserInitializer() {
    const { error, retryInitialization } = useUserInitialization();

    // Show error state if critical error occurred
    if (error) {
        return (
            <div className="fixed inset-0 bg-base-100 flex items-center justify-center z-50">
                <div className="card bg-error text-error-content shadow-xl max-w-md">
                    <div className="card-body text-center">
                        <h2 className="card-title">System Error</h2>
                        <p>Unable to initialize your account. Please try refreshing the page or contact support.</p>
                        <div className="card-actions justify-center mt-4">
                            <button
                                className="btn btn-outline btn-error-content"
                                onClick={() => window.location.reload()}
                            >
                                Refresh Page
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Component renders nothing when working normally
    return null;
}