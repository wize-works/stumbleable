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
    { name: 'Explore', href: '/explore', icon: 'fa-compass' },
    { name: 'About', href: '/about', icon: 'fa-info-circle' },
];

const publicNavigation = [
    { name: 'Explore', href: '/explore', icon: 'fa-compass' },
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
                    {/* Logo - Icon only on mobile, full on desktop */}
                    <Link
                        href="/"
                        className="flex items-center text-lg sm:text-xl font-bold text-primary hover:text-primary-focus transition-colors min-w-0"
                    >
                        {/* Mobile: Icon only */}
                        <div className="sm:hidden">
                            <Logo size="sm" textMode='none' />
                        </div>
                        {/* Desktop: Full logo with text */}
                        <div className="hidden sm:block">
                            <Logo size="sm" textSize="xxl" textMode='full' />
                        </div>
                    </Link>

                    {/* Navigation */}
                    <div className="flex items-center space-x-2">
                        {/* Stumble Button - Always visible */}
                        <Link
                            href="/stumble"
                            className={cn(
                                'btn transition-colors',
                                'px-3 sm:px-4 text-xs sm:text-sm',
                                'touch-manipulation',
                                (pathname === '/stumble' || pathname === '/')
                                    ? 'btn-primary'
                                    : 'btn-ghost'
                            )}
                        >
                            <i className="fa-solid fa-duotone fa-shuffle sm:mr-2"></i>
                            <span className="hidden sm:inline">Stumble</span>
                        </Link>

                        {/* Desktop Navigation - Hidden on mobile */}
                        <nav className="hidden sm:flex items-center space-x-1">
                            {navigation.slice(1).map((item) => {
                                const isActive = pathname === item.href;

                                return (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        className={cn(
                                            'btn transition-colors',
                                            'px-4 text-sm',
                                            'touch-manipulation',
                                            isActive
                                                ? 'btn-primary'
                                                : 'btn-ghost'
                                        )}
                                    >
                                        {item.name}
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