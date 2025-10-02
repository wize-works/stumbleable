'use client';

import { useUser } from '@clerk/nextjs';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '../lib/utils';
import { SignInButton } from './sign-in-button';
import { ThemeToggle } from './theme-toggle';
import Logo from './ui/logo';
import { UserMenu } from './user-menu';

const authenticatedNavigation = [
    { name: 'Stumble', href: '/stumble', icon: 'fa-shuffle' },
    { name: 'Submit', href: '/submit', icon: 'fa-plus' },
    { name: 'Lists', href: '/lists', icon: 'fa-list' },
    { name: 'Saved', href: '/saved', icon: 'fa-bookmark' },
    { name: 'Analytics', href: '/analytics', icon: 'fa-chart-bar' },
    { name: 'About', href: '/about', icon: 'fa-info-circle' },
];

const publicNavigation = [
    { name: 'About', href: '/about', icon: 'fa-info-circle' },
];

function AuthSection() {
    const { isSignedIn } = useUser();

    return (
        <div className="flex items-center gap-2">
            {isSignedIn ? (
                <UserMenu />
            ) : (
                <>
                    <Link
                        href="/sign-up"
                        className="btn btn-ghost sm:btn-md px-3 sm:px-4 text-xs sm:text-sm"
                    >
                        <span>Sign Up</span>
                    </Link>
                    <SignInButton />
                </>
            )}
        </div>
    );
}

export function Header() {
    const pathname = usePathname();
    const { isSignedIn } = useUser();

    const navigation = isSignedIn ? authenticatedNavigation : publicNavigation;

    return (
        <header className="sticky top-0 z-50 bg-base-100/80 backdrop-blur-sm border-b border-base-300">
            <div className="mx-auto px-3 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-14 sm:h-16">
                    {/* Logo */}
                    <Link
                        href="/"
                        className="flex items-center space-x-2 text-lg sm:text-xl font-bold text-primary hover:text-primary-focus transition-colors min-w-0"
                    >
                        <Logo size="sm" textSize="xxl" className="text-primary sm:size-md" textMode='full' />
                    </Link>

                    {/* Navigation */}
                    <div className="flex items-center space-x-2">
                        <nav className="flex items-center space-x-1">
                            {navigation.map((item) => {
                                const isActive = pathname === item.href ||
                                    (item.href === '/stumble' && pathname === '/');

                                return (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        className={cn(
                                            'btn transition-colors',
                                            'px-2 sm:px-4 text-xs sm:text-sm',
                                            'touch-manipulation', // Better touch handling
                                            isActive
                                                ? 'btn-primary'
                                                : 'btn-ghost'
                                        )}
                                    >
                                        <span className="hidden sm:inline">{item.name}</span>
                                        <span className="sm:hidden">
                                            <i className={`fa-solid fa-duotone ${item.icon}`}></i>
                                        </span>
                                    </Link>
                                );
                            })}
                        </nav>

                        {/* Theme Toggle */}
                        <ThemeToggle />

                        {/* User Authentication */}
                        <AuthSection />
                    </div>
                </div>
            </div>
        </header>
    );
}