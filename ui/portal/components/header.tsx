'use client';

import { useUser } from '@clerk/nextjs';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '../lib/utils';
import { SignInButton } from './sign-in-button';
import Logo from './ui/logo';
import { UserMenu } from './user-menu';

const navigation = [
    { name: 'Stumble', href: '/stumble' },
    { name: 'Submit', href: '/submit' },
    { name: 'Lists', href: '/lists' },
    { name: 'Saved', href: '/saved' },
    { name: 'Analytics', href: '/analytics' },
    { name: 'About', href: '/about' },
];

function AuthSection() {
    const { isSignedIn } = useUser();

    return (
        <div className="flex items-center">
            {isSignedIn ? <UserMenu /> : <SignInButton />}
        </div>
    );
}

export function Header() {
    const pathname = usePathname();

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
                                            'btn btn-sm sm:btn-md transition-colors min-h-[2.5rem] sm:min-h-[3rem]',
                                            'px-2 sm:px-4 text-xs sm:text-sm',
                                            'touch-manipulation', // Better touch handling
                                            isActive
                                                ? 'btn-primary'
                                                : 'btn-ghost'
                                        )}
                                    >
                                        <span className="hidden sm:inline">{item.name}</span>
                                        <span className="sm:hidden">
                                            {item.name === 'Stumble' && <i className="fa-solid fa-duotone fa-shuffle"></i>}
                                            {item.name === 'Submit' && <i className="fa-solid fa-duotone fa-plus"></i>}
                                            {item.name === 'Lists' && <i className="fa-solid fa-duotone fa-list"></i>}
                                            {item.name === 'Saved' && <i className="fa-solid fa-duotone fa-bookmark"></i>}
                                            {item.name === 'Analytics' && <i className="fa-solid fa-duotone fa-chart-bar"></i>}
                                            {item.name === 'About' && <i className="fa-solid fa-duotone fa-info-circle"></i>}
                                        </span>
                                    </Link>
                                );
                            })}
                        </nav>

                        {/* User Authentication */}
                        <AuthSection />
                    </div>
                </div>
            </div>
        </header>
    );
}