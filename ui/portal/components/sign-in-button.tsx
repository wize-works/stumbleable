'use client';

import { useClerk } from '@clerk/nextjs';

export function SignInButton() {
    const { openSignIn } = useClerk();

    return (
        <button
            onClick={() => openSignIn()}
            className="btn btn-primary btn-sm sm:btn-md px-3 sm:px-4 text-xs sm:text-sm"
        >
            <i className="fa-solid fa-duotone fa-sign-in-alt mr-1 sm:mr-2"></i>
            <span className="hidden sm:inline">Sign In</span>
            <span className="sm:hidden">Sign In</span>
        </button>
    );
}