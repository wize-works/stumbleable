'use client';

import { useClerk, useUser } from '@clerk/nextjs';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

export function UserMenu() {
    const { user } = useUser();
    const { signOut } = useClerk();
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // Close menu when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [isOpen]);

    // Close menu on route change
    useEffect(() => {
        setIsOpen(false);
    }, [router]);

    const handleSignOut = () => {
        signOut(() => router.push('/'));
        setIsOpen(false);
    };

    const userInitials = user?.firstName && user?.lastName
        ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
        : user?.emailAddresses[0]?.emailAddress?.[0]?.toUpperCase() || 'U';

    const userName = user?.firstName && user?.lastName
        ? `${user.firstName} ${user.lastName}`
        : user?.emailAddresses[0]?.emailAddress || 'User';

    return (
        <div className="relative" ref={menuRef}>
            {/* User Avatar Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary text-primary-content font-medium text-sm sm:text-base hover:bg-primary-focus transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-base-100"
                aria-label="User menu"
                aria-expanded={isOpen}
            >
                {user?.imageUrl ? (
                    <img
                        src={user.imageUrl}
                        alt={userName}
                        className="w-full h-full rounded-full object-cover"
                    />
                ) : (
                    <span className="select-none">{userInitials}</span>
                )}
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-base-100 rounded-lg shadow-lg border border-base-300 py-2 z-50">
                    {/* User Info */}
                    <div className="px-4 py-3 border-b border-base-300">
                        <div className="flex items-center space-x-3">
                            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-content font-medium">
                                {user?.imageUrl ? (
                                    <img
                                        src={user.imageUrl}
                                        alt={userName}
                                        className="w-full h-full rounded-full object-cover"
                                    />
                                ) : (
                                    <span className="select-none">{userInitials}</span>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-base-content truncate">
                                    {userName}
                                </p>
                                <p className="text-xs text-base-content/60 truncate">
                                    {user?.emailAddresses[0]?.emailAddress}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Menu Items */}
                    <div className="py-1">

                        <Link
                            href="/onboarding"
                            className="flex items-center px-4 py-2 text-sm text-base-content hover:bg-base-200 transition-colors"
                            onClick={() => setIsOpen(false)}
                        >
                            <i className="fa-solid fa-duotone fa-user-cog w-4 h-4 mr-3 text-base-content/60"></i>
                            Preferences
                        </Link>

                        <Link
                            href="/saved"
                            className="flex items-center px-4 py-2 text-sm text-base-content hover:bg-base-200 transition-colors"
                            onClick={() => setIsOpen(false)}
                        >
                            <i className="fa-solid fa-duotone fa-bookmark w-4 h-4 mr-3 text-base-content/60"></i>
                            Saved Items
                        </Link>
                    </div>

                    {/* Divider */}
                    <div className="border-t border-base-300 my-1"></div>

                    {/* Sign Out */}
                    <button
                        onClick={handleSignOut}
                        className="flex items-center w-full px-4 py-2 text-sm text-base-content hover:bg-base-200 transition-colors text-left"
                    >
                        <i className="fa-solid fa-duotone fa-sign-out-alt w-4 h-4 mr-3 text-base-content/60"></i>
                        Sign Out
                    </button>
                </div>
            )}
        </div>
    );
}