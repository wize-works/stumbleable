'use client';

import Link from 'next/link';

export function SignInButton() {
    return (
        <Link
            href="/sign-in"
            className="btn btn-primary"
        >
            <i className="fa-solid fa-duotone fa-sign-in-alt mr-1"></i>
            <span className="hidden sm:inline">Sign In</span>
            <span className="sm:hidden">Sign In</span>
        </Link>
    );
}