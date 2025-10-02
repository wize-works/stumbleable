'use client';
import Logo from "@/components/ui/logo";
import React from "react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen flex flex-col md:flex-row relative overflow-hidden">
            {/* Animated Background Pattern */}
            <div className="absolute inset-0 bg-gradient-to-br from-base-200 via-base-100 to-base-200 opacity-50"></div>

            {/* Floating Orbs/Shapes - decorative */}
            <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-20 right-20 w-96 h-96 bg-secondary/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
            <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-accent/10 rounded-full blur-3xl animate-pulse delay-500"></div>

            {/* Left side: Branding / Info */}
            <div className="hidden md:flex flex-col justify-center items-center w-1/2 p-12 relative z-10 bg-base-200">
                <div className="max-w-lg space-y-8 text-center">
                    {/* Logo with glow effect */}
                    <div className="flex justify-center mb-8">
                        <div className="relative group">

                            <div className="relative w-32 h-32 rounded-full flex items-center justify-center transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-2xl">
                                <Logo
                                    size="lg"
                                    className="text-primary-content drop-shadow-lg"
                                    textMode="none"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Hero Text */}
                    <div className="space-y-4">
                        <h1 className="text-5xl md:text-6xl font-bold leading-tight text-primary">
                            Discover the Unexpected
                        </h1>
                        <p className="text-xl text-base-content/70 leading-relaxed">
                            One click. One surprise. Infinite possibilities.
                        </p>
                    </div>

                    {/* Feature Pills */}
                    <div className="flex flex-wrap justify-center gap-3 pt-4">
                        <div className="badge badge-lg badge-primary badge-outline gap-2">
                            <i className="fa-solid fa-duotone fa-shuffle"></i>
                            Serendipitous Discovery
                        </div>
                        <div className="badge badge-lg badge-secondary badge-outline gap-2">
                            <i className="fa-solid fa-duotone fa-sparkles"></i>
                            Curated Content
                        </div>
                        <div className="badge badge-lg badge-accent badge-outline gap-2">
                            <i className="fa-solid fa-duotone fa-heart"></i>
                            Personal Collections
                        </div>
                    </div>

                    {/* Decorative Quote */}
                    <div className="pt-8 opacity-60 italic text-base-content/60 border-t border-base-content/10">
                        "Not all who wander are lost... but those who stumble find the most interesting paths."
                    </div>
                </div>
            </div>

            {/* Right side: Auth form */}
            <div className="flex flex-1 items-center justify-center p-6 md:p-12 relative z-10 bg-gradient-to-bl from-primary/95 via-primary to-primary/95">
                {/* Pattern overlay */}
                <div className="absolute inset-0 opacity-5"
                    style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
                    }}>
                </div>

                <div className="w-full max-w-md">
                    {children}
                </div>
            </div>

            {/* Mobile Logo */}
            <div className="md:hidden absolute top-6 left-6 z-20">
                <Logo size="sm" textSize="xl" className="text-base-content" textMode="full" />
            </div>
        </div>
    );
}