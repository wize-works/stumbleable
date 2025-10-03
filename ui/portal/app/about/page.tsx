import { StructuredData } from '@/components/structured-data';
import { aboutSchemas } from '@/lib/structured-data';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'About Stumbleable - Bringing Back Web Discovery',
    description: 'Learn about Stumbleable, the modern StumbleUpon alternative. Discover our mission to bring back serendipitous web discovery. Core experience free forever.',
    alternates: {
        canonical: '/about',
    },
    openGraph: {
        title: 'About Stumbleable',
        description: 'Bringing back the joy of web discovery',
        url: 'https://stumbleable.com/about',
        type: 'website',
        images: [
            {
                url: '/og-image-about.png',
                width: 1200,
                height: 630,
                alt: 'About Stumbleable',
            },
        ],
    },
};

export default function AboutPage() {
    return (
        <>
            <StructuredData schemas={aboutSchemas} />
            <div className="min-h-screen bg-base-100">
                <div className="container mx-auto px-4 py-12">
                    <div className="max-w-3xl mx-auto">
                        <h1 className="text-5xl font-bold text-center mb-6 text-base-content">
                            About Stumbleable
                        </h1>
                        <p className="text-xl text-center text-base-content/70 mb-12">
                            Bringing back the joy of serendipitous web discovery
                        </p>

                        <div className="prose prose-lg max-w-none">
                            {/* Origin Story */}
                            <div className="bg-base-200 rounded-2xl p-8 mb-8">
                                <h2 className="text-3xl font-bold mb-4 mt-0">Remember StumbleUpon?</h2>
                                <p className="mb-0">
                                    That magical button that took you to unexpected corners of the internet.
                                    The serendipity. The surprise. The pure joy of discovery.
                                </p>
                            </div>

                            <p className="text-lg">
                                When StumbleUpon shut down in 2018, millions of people lost their favorite way
                                to explore the web. We were among them.
                            </p>

                            <p className="text-lg">
                                <strong>Stumbleable</strong> is our answer—a modern revival of that experience.
                                One button. Curated randomness. Human taste meets AI intelligence.
                            </p>

                            {/* Why We Built This */}
                            <h2 className="text-3xl font-bold mt-12 mb-6">Why We Built This</h2>

                            <div className="grid md:grid-cols-2 gap-6 not-prose mb-8">
                                <div className="card bg-primary/5 border border-primary/20 p-6">
                                    <h3 className="text-xl font-bold mb-3 flex items-center gap-2">
                                        <i className="fa-solid fa-duotone fa-circle-exclamation text-error"></i>
                                        The Problem
                                    </h3>
                                    <ul className="space-y-2 text-base-content/70">
                                        <li>• Social media echo chambers</li>
                                        <li>• Algorithm-driven feeds showing the same content</li>
                                        <li>• Infinite scrolling that wastes time</li>
                                        <li>• Discovery = doom scrolling</li>
                                    </ul>
                                </div>
                                <div className="card bg-success/5 border border-success/20 p-6">
                                    <h3 className="text-xl font-bold mb-3 flex items-center gap-2">
                                        <i className="fa-solid fa-duotone fa-lightbulb text-success"></i>
                                        Our Solution
                                    </h3>
                                    <ul className="space-y-2 text-base-content/70">
                                        <li>• Intentional, one-click discovery</li>
                                        <li>• Quality over virality</li>
                                        <li>• Break out of filter bubbles</li>
                                        <li>• Discovery = genuine surprise</li>
                                    </ul>
                                </div>
                            </div>

                            {/* How It Works */}
                            <h2 className="text-3xl font-bold mt-12 mb-6">How It Works</h2>

                            <p className="text-lg">
                                Our discovery engine balances your interests with controlled randomness.
                                Think of it as a radio dial between familiar and adventurous.
                            </p>

                            <div className="space-y-4 my-8">
                                <div className="flex gap-4 items-start">
                                    <div className="badge badge-primary badge-lg mt-1">1</div>
                                    <div>
                                        <strong className="text-lg">Quality Scoring:</strong>
                                        <p className="mt-1 text-base-content/70">
                                            Every discovery is rated for depth, uniqueness, and craft. We filter out clickbait and low-effort content.
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-4 items-start">
                                    <div className="badge badge-secondary badge-lg mt-1">2</div>
                                    <div>
                                        <strong className="text-lg">Freshness Balance:</strong>
                                        <p className="mt-1 text-base-content/70">
                                            Recent content gets a boost, but timeless pieces remain discoverable. Not everything has to be from today.
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-4 items-start">
                                    <div className="badge badge-accent badge-lg mt-1">3</div>
                                    <div>
                                        <strong className="text-lg">Interest Matching:</strong>
                                        <p className="mt-1 text-base-content/70">
                                            We learn your preferences from your reactions and saved items. Every like or skip makes us smarter.
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-4 items-start">
                                    <div className="badge badge-primary badge-lg mt-1">4</div>
                                    <div>
                                        <strong className="text-lg">Wildness Control:</strong>
                                        <p className="mt-1 text-base-content/70">
                                            You control the chaos. Dial it low for familiar territory, high for complete randomness. Your choice, every time.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Philosophy */}
                            <h2 className="text-3xl font-bold mt-12 mb-6">Our Philosophy</h2>

                            <blockquote className="border-l-4 border-primary pl-6 italic text-xl my-8">
                                "In an age of endless feeds and algorithmic echo chambers,
                                we believe in the power of intentional discovery."
                            </blockquote>

                            <p className="text-lg">
                                Each stumble is a conscious choice to explore, to be surprised, to learn something new.
                                We're not trying to maximize your time on our platform.
                            </p>

                            <p className="text-lg">
                                We're trying to <strong>maximize the quality of your discoveries</strong>.
                            </p>

                            <p className="text-lg">
                                Find something amazing, explore it deeply, then come back when you're ready
                                for the next adventure. That's how discovery should work.
                            </p>

                            {/* Team & Values */}
                            <h2 className="text-3xl font-bold mt-12 mb-6">What We Stand For</h2>

                            <div className="grid gap-4 not-prose">
                                <div className="flex gap-4 items-start p-4 bg-base-200 rounded-lg">
                                    <i className="fa-solid fa-duotone fa-shield-check text-2xl text-primary mt-1"></i>
                                    <div>
                                        <strong className="text-lg">Privacy First:</strong>
                                        <p className="text-base-content/70 mt-1">
                                            Your discovery patterns are yours. We use them only to improve your experience.
                                            No tracking, no selling data, no dark patterns.
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-4 items-start p-4 bg-base-200 rounded-lg">
                                    <i className="fa-solid fa-duotone fa-heart text-2xl text-error mt-1"></i>
                                    <div>
                                        <strong className="text-lg">Quality Over Virality:</strong>
                                        <p className="text-base-content/70 mt-1">
                                            We surface content based on craft and depth, not how many likes it got.
                                            Hidden gems over viral junk, every time.
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-4 items-start p-4 bg-base-200 rounded-lg">
                                    <i className="fa-solid fa-duotone fa-users text-2xl text-success mt-1"></i>
                                    <div>
                                        <strong className="text-lg">Community Driven:</strong>
                                        <p className="text-base-content/70 mt-1">
                                            Anyone can submit amazing sites they find. Our curation team reviews submissions
                                            to maintain quality while keeping the web's diversity alive.
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-4 items-start p-4 bg-base-200 rounded-lg">
                                    <i className="fa-solid fa-duotone fa-gift text-2xl text-accent mt-1"></i>
                                    <div>
                                        <strong className="text-lg">Core Experience Free Forever:</strong>
                                        <p className="text-base-content/70 mt-1">
                                            Discovery will always be free. No ads. No paywalls. No limiting how much you can explore.
                                            We may offer optional creator tools or premium features in the future, but the button that
                                            makes you stumble? That's free, forever.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Current Status */}
                            <h2 className="text-3xl font-bold mt-12 mb-6">Where We Are Today</h2>

                            <p className="text-lg">
                                Stumbleable is currently in <strong>beta</strong>. We're refining the algorithm,
                                expanding our content library, and listening to early users.
                            </p>

                            <p className="text-lg">
                                What's working: The core discovery experience. The wildness control. The keyboard shortcuts.
                            </p>

                            <p className="text-lg">
                                What's coming: Real-time web crawling, community curation tools, personalized lists,
                                and more ways to share discoveries with friends.
                            </p>

                            <div className="card bg-primary/10 border border-primary/20 p-6 mt-8">
                                <p className="text-center text-base-content/80 mb-4">
                                    <strong>Currently in beta:</strong> All discoveries are powered by
                                    curated data. Real web crawling and dynamic content coming soon.
                                </p>
                                <div className="text-center">
                                    <a
                                        href="/stumble"
                                        className="btn btn-primary"
                                    >
                                        Start Your Journey
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}