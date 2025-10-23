import { StructuredData } from '@/components/structured-data';
import { createBreadcrumbSchema } from '@/lib/structured-data';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Interactive Demo - See Stumbleable in Action',
    description:
        'Experience Stumbleable firsthand with our interactive demo. See how one-click discovery, smart algorithms, and wildness control make exploring the web magical.',
    keywords: [
        'stumbleable demo',
        'web discovery demo',
        'content discovery tutorial',
        'stumbleupon alternative demo',
        'interactive demo',
        'try stumbleable',
    ],
    alternates: {
        canonical: '/demo',
    },
    openGraph: {
        title: 'Try Stumbleable - Interactive Demo',
        description: 'See Stumbleable in action! One button. Endless discoveries. Experience the magic yourself.',
        url: 'https://stumbleable.com/demo',
        type: 'website',
        images: [
            {
                url: '/og-image-homepage.png',
                width: 1200,
                height: 630,
                alt: 'Stumbleable Interactive Demo',
            },
        ],
    },
};

const breadcrumbs = createBreadcrumbSchema([
    { name: 'Home', url: 'https://stumbleable.com' },
    { name: 'Demo', url: 'https://stumbleable.com/demo' },
]);

export default function DemoPage() {
    return (
        <>
            <StructuredData schemas={breadcrumbs} />
            <div className="min-h-screen bg-base-100">
                {/* Hero Section */}
                <section className="relative py-16 px-4 overflow-hidden">
                    {/* Animated Background */}
                    <div className="absolute inset-0 -z-10">
                        <div className="absolute top-20 left-10 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse"></div>
                        <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
                    </div>

                    <div className="max-w-7xl mx-auto text-center">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full mb-6">
                            <i className="fa-solid fa-duotone fa-play text-primary"></i>
                            <span className="text-sm font-semibold text-primary">Interactive Demo</span>
                        </div>
                        <h1 className="text-5xl md:text-6xl font-bold text-base-content mb-6">
                            See <span className="text-primary">Stumbleable</span> in Action
                        </h1>
                        <p className="text-xl text-base-content/70 max-w-3xl mx-auto mb-8">
                            Watch how one button unlocks endless discovery. Experience the magic of serendipitous
                            exploration, intelligent personalization, and instant reactions—all in under 2 minutes.
                        </p>
                    </div>
                </section>

                {/* Interactive Demo Embed */}
                <section className="py-8 px-4">
                    <div className="max-w-7xl mx-auto">
                        <div className="card bg-base-200 shadow-2xl overflow-hidden">
                            <div className="card-body p-0">
                                {/* Demo Player */}
                                <div className="relative w-full" style={{ paddingBottom: 'calc(47.4479% + 41px)' }}>
                                    <iframe
                                        src="https://demo.arcade.software/rcfUvQLSEQUB91jUpXO3?embed&embed_mobile=tab&embed_desktop=inline&show_copy_link=true"
                                        title="Stumbleable Interactive Demo"
                                        className="absolute top-0 left-0 w-full h-full"
                                        style={{ border: 0, colorScheme: 'light' }}
                                        loading="lazy"
                                        allow="clipboard-write"
                                        allowFullScreen
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* What You'll See */}
                <section className="py-16 px-4 bg-base-200">
                    <div className="max-w-6xl mx-auto">
                        <h2 className="text-4xl font-bold text-center text-base-content mb-4">
                            What You'll Experience
                        </h2>
                        <p className="text-center text-base-content/70 mb-12 max-w-2xl mx-auto">
                            This demo walks you through the core Stumbleable experience
                        </p>

                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {/* Feature 1 */}
                            <div className="card bg-base-100 shadow-lg hover:shadow-xl transition-shadow">
                                <div className="card-body items-center text-center">
                                    <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-4">
                                        <i className="fa-solid fa-duotone fa-hand-pointer text-2xl text-primary"></i>
                                    </div>
                                    <h3 className="font-bold text-primary">One-Click Discovery</h3>
                                    <p className="text-sm text-base-content/70">
                                        See how easy it is to find amazing content with just one button press
                                    </p>
                                </div>
                            </div>

                            {/* Feature 2 */}
                            <div className="card bg-base-100 shadow-lg hover:shadow-xl transition-shadow">
                                <div className="card-body items-center text-center">
                                    <div className="w-16 h-16 rounded-full bg-secondary/20 flex items-center justify-center mb-4">
                                        <i className="fa-solid fa-duotone fa-sliders text-2xl text-secondary"></i>
                                    </div>
                                    <h3 className="font-bold text-secondary">Wildness Control</h3>
                                    <p className="text-sm text-base-content/70">
                                        Watch how adjusting wildness changes your discovery experience
                                    </p>
                                </div>
                            </div>

                            {/* Feature 3 */}
                            <div className="card bg-base-100 shadow-lg hover:shadow-xl transition-shadow">
                                <div className="card-body items-center text-center">
                                    <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center mb-4">
                                        <i className="fa-solid fa-duotone fa-thumbs-up text-2xl text-accent"></i>
                                    </div>
                                    <h3 className="font-bold text-accent">Instant Reactions</h3>
                                    <p className="text-sm text-base-content/70">
                                        Experience how quick feedback shapes your personalized feed
                                    </p>
                                </div>
                            </div>

                            {/* Feature 4 */}
                            <div className="card bg-base-100 shadow-lg hover:shadow-xl transition-shadow">
                                <div className="card-body items-center text-center">
                                    <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-4">
                                        <i className="fa-solid fa-duotone fa-bookmark text-2xl text-primary"></i>
                                    </div>
                                    <h3 className="font-bold text-primary">Save & Organize</h3>
                                    <p className="text-sm text-base-content/70">
                                        See how easy it is to build your personal discovery library
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Key Features Highlight */}
                <section className="py-16 px-4">
                    <div className="max-w-6xl mx-auto">
                        <div className="text-center mb-12">
                            <h2 className="text-4xl font-bold text-base-content mb-4">
                                Why Stumbleable is Different
                            </h2>
                            <p className="text-xl text-base-content/70 max-w-3xl mx-auto">
                                Not just another content aggregator—it's a serendipity engine designed for discovery
                            </p>
                        </div>

                        <div className="grid md:grid-cols-3 gap-8">
                            {/* Benefit 1 */}
                            <div className="relative p-8 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
                                <div className="absolute -top-4 -left-4 w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white font-bold text-xl shadow-lg">
                                    1
                                </div>
                                <h3 className="text-2xl font-bold text-primary mb-4 mt-2">No Infinite Scroll</h3>
                                <p className="text-base-content/70 mb-4">
                                    Unlike social feeds that trap you for hours, Stumbleable shows one discovery at a time.
                                    You're in control of your time.
                                </p>
                                <ul className="space-y-2">
                                    <li className="flex items-start gap-2 text-sm text-base-content/60">
                                        <i className="fa-solid fa-duotone fa-check text-primary mt-1"></i>
                                        <span>Intentional browsing, not mindless scrolling</span>
                                    </li>
                                    <li className="flex items-start gap-2 text-sm text-base-content/60">
                                        <i className="fa-solid fa-duotone fa-check text-primary mt-1"></i>
                                        <span>Quality over quantity</span>
                                    </li>
                                    <li className="flex items-start gap-2 text-sm text-base-content/60">
                                        <i className="fa-solid fa-duotone fa-check text-primary mt-1"></i>
                                        <span>Full attention on each discovery</span>
                                    </li>
                                </ul>
                            </div>

                            {/* Benefit 2 */}
                            <div className="relative p-8 rounded-2xl bg-gradient-to-br from-secondary/10 to-secondary/5 border border-secondary/20">
                                <div className="absolute -top-4 -left-4 w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-white font-bold text-xl shadow-lg">
                                    2
                                </div>
                                <h3 className="text-2xl font-bold text-secondary mb-4 mt-2">Smart Algorithms</h3>
                                <p className="text-base-content/70 mb-4">
                                    Our discovery engine learns from your reactions to deliver increasingly personalized
                                    content while maintaining serendipity.
                                </p>
                                <ul className="space-y-2">
                                    <li className="flex items-start gap-2 text-sm text-base-content/60">
                                        <i className="fa-solid fa-duotone fa-check text-secondary mt-1"></i>
                                        <span>Machine learning that respects your taste</span>
                                    </li>
                                    <li className="flex items-start gap-2 text-sm text-base-content/60">
                                        <i className="fa-solid fa-duotone fa-check text-secondary mt-1"></i>
                                        <span>Balance between familiar and surprising</span>
                                    </li>
                                    <li className="flex items-start gap-2 text-sm text-base-content/60">
                                        <i className="fa-solid fa-duotone fa-check text-secondary mt-1"></i>
                                        <span>Gets better with every stumble</span>
                                    </li>
                                </ul>
                            </div>

                            {/* Benefit 3 */}
                            <div className="relative p-8 rounded-2xl bg-gradient-to-br from-accent/10 to-accent/5 border border-accent/20">
                                <div className="absolute -top-4 -left-4 w-12 h-12 rounded-full bg-accent flex items-center justify-center text-white font-bold text-xl shadow-lg">
                                    3
                                </div>
                                <h3 className="text-2xl font-bold text-accent mb-4 mt-2">Human-Curated</h3>
                                <p className="text-base-content/70 mb-4">
                                    Every piece of content is reviewed by real humans and community-moderated.
                                    No AI slop, no clickbait.
                                </p>
                                <ul className="space-y-2">
                                    <li className="flex items-start gap-2 text-sm text-base-content/60">
                                        <i className="fa-solid fa-duotone fa-check text-accent mt-1"></i>
                                        <span>Quality standards enforced</span>
                                    </li>
                                    <li className="flex items-start gap-2 text-sm text-base-content/60">
                                        <i className="fa-solid fa-duotone fa-check text-accent mt-1"></i>
                                        <span>Community-driven moderation</span>
                                    </li>
                                    <li className="flex items-start gap-2 text-sm text-base-content/60">
                                        <i className="fa-solid fa-duotone fa-check text-accent mt-1"></i>
                                        <span>Authentic web exploration</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </section>

                {/* How It Works Quick */}
                <section className="py-16 px-4 bg-base-200">
                    <div className="max-w-5xl mx-auto">
                        <h2 className="text-4xl font-bold text-center text-base-content mb-12">
                            Getting Started is Simple
                        </h2>

                        <div className="flex flex-col md:flex-row items-center justify-center gap-8">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-white font-bold text-2xl shadow-lg">
                                    1
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg text-base-content">Sign Up Free</h3>
                                    <p className="text-sm text-base-content/70">No credit card required</p>
                                </div>
                            </div>

                            <span className='hidden md:block'><i className="fa-solid fa-duotone fa-arrow-right text-2xl text-base-content/30"></i></span>
                            <span className='block md:hidden'><i className="fa-solid fa-duotone fa-arrow-down text-2xl text-base-content/30"></i></span>

                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center text-white font-bold text-2xl shadow-lg">
                                    2
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg text-base-content">Pick Interests</h3>
                                    <p className="text-sm text-base-content/70">Choose topics you love</p>
                                </div>
                            </div>

                            <span className='hidden md:block'><i className="fa-solid fa-duotone fa-arrow-right text-2xl text-base-content/30"></i></span>
                            <span className='block md:hidden'><i className="fa-solid fa-duotone fa-arrow-down text-2xl text-base-content/30"></i></span>

                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 rounded-full bg-accent flex items-center justify-center text-white font-bold text-2xl shadow-lg">
                                    3
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg text-base-content">Start Stumbling</h3>
                                    <p className="text-sm text-base-content/70">Discover amazing content</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* CTA Section */}
                <section className="py-20 px-4">
                    <div className="max-w-4xl mx-auto text-center">
                        <h2 className="text-4xl md:text-5xl font-bold text-base-content mb-6">
                            Ready to Start Your Discovery Journey?
                        </h2>
                        <p className="text-xl text-base-content/70 mb-8">
                            Join thousands of curious minds exploring the best content on the web.
                            Sign up free—no credit card required.
                        </p>
                        <div className="flex gap-4 justify-center flex-wrap">
                            <a href="/sign-up" className="btn btn-primary btn-lg">
                                <i className="fa-solid fa-duotone fa-rocket mr-2"></i>
                                Start Stumbling Free
                            </a>
                            <a href="/how-it-works" className="btn btn-outline btn-lg">
                                <i className="fa-solid fa-duotone fa-circle-question mr-2"></i>
                                Learn How It Works
                            </a>
                        </div>
                        <p className="text-sm text-base-content/60 mt-6">
                            Free forever. No credit card required. Start discovering in 60 seconds.
                        </p>
                    </div>
                </section>

                {/* Social Proof */}
                {/* <section className="py-16 px-4">
                    <div className="max-w-6xl mx-auto">
                        <h2 className="text-4xl font-bold text-center text-base-content mb-12">
                            Join Thousands of Happy Discoverers
                        </h2>

                        <div className="grid md:grid-cols-3 gap-8">
                            <div className="card bg-base-200 shadow-lg">
                                <div className="card-body">
                                    <div className="flex items-center gap-1 text-warning mb-2">
                                        <i className="fa-solid fa-star"></i>
                                        <i className="fa-solid fa-star"></i>
                                        <i className="fa-solid fa-star"></i>
                                        <i className="fa-solid fa-star"></i>
                                        <i className="fa-solid fa-star"></i>
                                    </div>
                                    <p className="text-base-content/80 italic mb-4">
                                        "Finally, a way to browse the web without getting sucked into endless feeds.
                                        I've rediscovered the joy of finding cool stuff!"
                                    </p>
                                    <div className="flex items-center gap-3">
                                        <div className="avatar placeholder">
                                            <div className="bg-primary text-primary-content rounded-full w-10">
                                                <span className="text-sm">SK</span>
                                            </div>
                                        </div>
                                        <div>
                                            <p className="font-semibold text-sm">Sarah K.</p>
                                            <p className="text-xs text-base-content/60">Designer</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="card bg-base-200 shadow-lg">
                                <div className="card-body">
                                    <div className="flex items-center gap-1 text-warning mb-2">
                                        <i className="fa-solid fa-star"></i>
                                        <i className="fa-solid fa-star"></i>
                                        <i className="fa-solid fa-star"></i>
                                        <i className="fa-solid fa-star"></i>
                                        <i className="fa-solid fa-star"></i>
                                    </div>
                                    <p className="text-base-content/80 italic mb-4">
                                        "The wildness slider is genius. I can tune my exploration based on my mood.
                                        Adventurous on weekends, focused during work."
                                    </p>
                                    <div className="flex items-center gap-3">
                                        <div className="avatar placeholder">
                                            <div className="bg-secondary text-secondary-content rounded-full w-10">
                                                <span className="text-sm">MC</span>
                                            </div>
                                        </div>
                                        <div>
                                            <p className="font-semibold text-sm">Mike C.</p>
                                            <p className="text-xs text-base-content/60">Developer</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="card bg-base-200 shadow-lg">
                                <div className="card-body">
                                    <div className="flex items-center gap-1 text-warning mb-2">
                                        <i className="fa-solid fa-star"></i>
                                        <i className="fa-solid fa-star"></i>
                                        <i className="fa-solid fa-star"></i>
                                        <i className="fa-solid fa-star"></i>
                                        <i className="fa-solid fa-star"></i>
                                    </div>
                                    <p className="text-base-content/80 italic mb-4">
                                        "This is what StumbleUpon should have become. The algorithm actually gets me,
                                        and I'm finding sites I never would have discovered otherwise."
                                    </p>
                                    <div className="flex items-center gap-3">
                                        <div className="avatar placeholder">
                                            <div className="bg-accent text-accent-content rounded-full w-10">
                                                <span className="text-sm">JL</span>
                                            </div>
                                        </div>
                                        <div>
                                            <p className="font-semibold text-sm">Jessica L.</p>
                                            <p className="text-xs text-base-content/60">Writer</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section> */}

                {/* Stats */}
                <section className="py-16 px-4 bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5">
                    <div className="max-w-6xl mx-auto">
                        <div className="grid md:grid-cols-4 gap-8 text-center">
                            <div>
                                <div className="text-5xl font-bold text-primary mb-2">10K+</div>
                                <p className="text-base-content/70">Active Users</p>
                            </div>
                            <div>
                                <div className="text-5xl font-bold text-secondary mb-2">50K+</div>
                                <p className="text-base-content/70">Curated Discoveries</p>
                            </div>
                            <div>
                                <div className="text-5xl font-bold text-accent mb-2">100K+</div>
                                <p className="text-base-content/70">Monthly Stumbles</p>
                            </div>
                            <div>
                                <div className="text-5xl font-bold text-primary mb-2">95%</div>
                                <p className="text-base-content/70">Satisfaction Rate</p>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </>
    );
}
