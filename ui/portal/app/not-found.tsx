'use client';

import { useToaster } from '@/components/toaster';
import Link from 'next/link';
import Logo from '../components/ui/logo';

export default function NotFound() {
    const { showToast } = useToaster();

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary/5 via-base-100 to-secondary/5 flex items-center justify-center p-4">
            <div className="max-w-2xl mx-auto text-center">
                {/* Animated 404 with Logo */}
                <div className="mb-8 relative">
                    <div className="text-[12rem] md:text-[16rem] font-black text-primary/10 leading-none select-none">
                        404
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="animate-bounce">
                            <Logo size="xl" logoShadow={true} />
                        </div>
                    </div>
                </div>

                {/* Main Message */}
                <div className="space-y-6 mb-12">
                    <h1 className="text-4xl md:text-6xl font-black text-base-content">
                        Oops! You've Stumbled Upon...
                    </h1>
                    <p className="text-2xl md:text-3xl font-bold text-primary">
                        The Void 🕳️
                    </p>
                    <p className="text-lg md:text-xl text-base-content/70 max-w-xl mx-auto">
                        This page doesn't exist (or maybe it's in another dimension).
                        But hey, that's the beauty of stumbling — sometimes you end up in unexpected places!
                    </p>
                </div>

                {/* Fun Facts/Suggestions */}
                <div className="card bg-base-200/80 backdrop-blur-sm shadow-xl mb-12 max-w-md mx-auto">
                    <div className="card-body">
                        <h3 className="card-title text-lg mb-4">
                            <i className="fa-solid fa-duotone fa-lightbulb text-warning"></i>
                            While You're Here...
                        </h3>
                        <div className="text-left space-y-3 text-sm">
                            <div className="flex items-start gap-3">
                                <span className="text-2xl">🎲</span>
                                <p>
                                    <strong>Did you know?</strong> The average person gets lost on the internet
                                    47 times a day. (We may have made that up.)
                                </p>
                            </div>
                            <div className="flex items-start gap-3">
                                <span className="text-2xl">✨</span>
                                <p>
                                    <strong>Fun fact:</strong> HTTP 404 was named after room 404 at CERN where
                                    the World Wide Web was born!
                                </p>
                            </div>
                            <div className="flex items-start gap-3">
                                <span className="text-2xl">🧭</span>
                                <p>
                                    <strong>Silver lining:</strong> Every wrong turn teaches us something.
                                    Like how you just learned this page doesn't exist!
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                    <Link href="/stumble" className="btn btn-primary btn-lg gap-2 min-w-[200px] group">
                        <Logo size="xs" logoShadow={false} />
                        <span>Start Stumbling</span>
                        <i className="fa-solid fa-duotone fa-arrow-right group-hover:translate-x-1 transition-transform"></i>
                    </Link>
                    <Link href="/" className="btn btn-outline btn-lg gap-2 min-w-[200px]">
                        <i className="fa-solid fa-duotone fa-home"></i>
                        <span>Go Home</span>
                    </Link>
                </div>

                {/* Quick Links */}
                <div className="mt-12 pt-8 border-t border-base-300">
                    <p className="text-sm text-base-content/60 mb-4">Or try one of these:</p>
                    <div className="flex flex-wrap gap-3 justify-center">
                        <Link href="/saved" className="link link-hover text-sm">
                            <i className="fa-solid fa-duotone fa-bookmark mr-1"></i>
                            Saved Items
                        </Link>
                        <Link href="/lists" className="link link-hover text-sm">
                            <i className="fa-solid fa-duotone fa-list mr-1"></i>
                            My Lists
                        </Link>
                        <Link href="/about" className="link link-hover text-sm">
                            <i className="fa-solid fa-duotone fa-info-circle mr-1"></i>
                            About Us
                        </Link>
                        <Link href="/submit" className="link link-hover text-sm">
                            <i className="fa-solid fa-duotone fa-plus-circle mr-1"></i>
                            Submit Content
                        </Link>
                        <Link href="/contact" className="link link-hover text-sm">
                            <i className="fa-solid fa-duotone fa-envelope mr-1"></i>
                            Contact
                        </Link>
                    </div>
                </div>

                {/* Easter Egg */}
                <div className="mt-8">
                    <button
                        className="text-xs text-base-content/30 hover:text-base-content/60 transition-colors"
                        onClick={() => {
                            const messages = [
                                "🎉 You found the secret button!",
                                "🦄 Unicorns are real (citation needed)",
                                "🌈 Keep exploring, adventurer!",
                                "🎪 The internet is your playground",
                                "🎨 Beauty in unexpected places",
                                "🚀 To infinity... and beyond the 404!"
                            ];
                            const message = messages[Math.floor(Math.random() * messages.length)];
                            showToast(message, 'success');
                        }}
                    >
                        psst... click me
                    </button>
                </div>
            </div>
        </div>
    );
}
