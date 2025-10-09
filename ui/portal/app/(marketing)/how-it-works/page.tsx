import { StructuredData } from '@/components/structured-data';
import { createBreadcrumbSchema } from '@/lib/structured-data';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'How It Works - Discover New Websites with Stumbleable',
    description:
        'Learn how Stumbleable helps you discover amazing websites every day. Our simple one-click discovery system combines AI curation with human taste. Free guide!',
    keywords: [
        'how to discover new websites',
        'random website discovery',
        'web discovery guide',
        'find interesting websites',
        'explore the internet',
        'content discovery tutorial',
    ],
    alternates: {
        canonical: '/how-it-works',
    },
    openGraph: {
        title: 'How Stumbleable Works - Web Discovery Made Simple',
        description: 'One button. Amazing discoveries. Learn how our AI-powered system helps you explore the web.',
        url: 'https://stumbleable.com/how-it-works',
        type: 'article',
        images: [
            {
                url: '/og-image-homepage.png',
                width: 1200,
                height: 630,
                alt: 'How Stumbleable Works',
            },
        ],
    },
};

const breadcrumbs = createBreadcrumbSchema([
    { name: 'Home', url: 'https://stumbleable.com' },
    { name: 'How It Works', url: 'https://stumbleable.com/how-it-works' },
]);

export default function HowItWorksPage() {
    return (
        <>
            <StructuredData schemas={breadcrumbs} />
            <div className="min-h-screen bg-base-100">
                {/* Hero Section */}
                <section className="relative py-20 px-4 overflow-hidden">
                    <div className="absolute inset-0 -z-10">
                        <div className="absolute top-20 left-10 w-96 h-96 bg-secondary/20 rounded-full blur-3xl animate-pulse"></div>
                        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
                    </div>

                    <div className="max-w-6xl mx-auto text-center">
                        <h1 className="text-5xl md:text-6xl font-bold text-base-content mb-6">
                            How <span className="text-secondary">Stumbleable</span> Works
                        </h1>
                        <p className="text-xl text-base-content/70 max-w-3xl mx-auto">
                            Discover the magic behind intelligent content discovery that learns what you love
                            and surprises you with what you didn't know you'd love.
                        </p>
                    </div>
                </section>

                {/* The Journey */}
                <section className="py-16 px-4">
                    <div className="max-w-5xl mx-auto">
                        <h2 className="text-4xl font-bold text-center text-base-content mb-16">
                            Your Discovery Journey
                        </h2>

                        <div className="space-y-16">
                            {/* Step 1 */}
                            <div className="flex flex-col md:flex-row gap-8 items-center">
                                <div className="md:w-1/3 flex justify-center">
                                    <div className="w-32 h-32 rounded-full bg-primary/20 flex items-center justify-center">
                                        <span className="text-6xl font-bold text-primary">1</span>
                                    </div>
                                </div>
                                <div className="md:w-2/3">
                                    <h3 className="text-3xl font-bold text-primary mb-4">Choose Your Interests</h3>
                                    <p className="text-base-content/70 text-lg mb-4">
                                        Start by selecting topics that interest you—Technology, Art, Science, Gaming,
                                        Photography, and dozens more. Don't worry, you can always adjust these later.
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        <span className="badge badge-primary badge-lg">Technology</span>
                                        <span className="badge badge-secondary badge-lg">Art</span>
                                        <span className="badge badge-accent badge-lg">Science</span>
                                        <span className="badge badge-primary badge-outline badge-lg">Gaming</span>
                                        <span className="badge badge-secondary badge-outline badge-lg">Photography</span>
                                    </div>
                                </div>
                            </div>

                            {/* Step 2 */}
                            <div className="flex flex-col md:flex-row-reverse gap-8 items-center">
                                <div className="md:w-1/3 flex justify-center">
                                    <div className="w-32 h-32 rounded-full bg-secondary/20 flex items-center justify-center">
                                        <span className="text-6xl font-bold text-secondary">2</span>
                                    </div>
                                </div>
                                <div className="md:w-2/3 md:text-right">
                                    <h3 className="text-3xl font-bold text-secondary mb-4">Hit the Stumble Button</h3>
                                    <p className="text-base-content/70 text-lg mb-4">
                                        Press the big Stumble button (or just hit Spacebar) and we'll instantly show you
                                        a hand-picked piece of content from across the web. Each discovery is carefully
                                        selected based on your interests and our quality standards.
                                    </p>
                                    <div className="inline-flex items-center gap-3 text-base-content/60">
                                        <kbd className="kbd kbd-lg">Space</kbd>
                                        <span>→ Discover something new</span>
                                    </div>
                                </div>
                            </div>

                            {/* Step 3 */}
                            <div className="flex flex-col md:flex-row gap-8 items-center">
                                <div className="md:w-1/3 flex justify-center">
                                    <div className="w-32 h-32 rounded-full bg-accent/20 flex items-center justify-center">
                                        <span className="text-6xl font-bold text-accent">3</span>
                                    </div>
                                </div>
                                <div className="md:w-2/3">
                                    <h3 className="text-3xl font-bold text-accent mb-4">React Instantly</h3>
                                    <p className="text-base-content/70 text-lg mb-4">
                                        Love it? Hit the thumbs up. Not interested? Skip it. Want to read later? Save it.
                                        Your reactions teach our algorithm what you enjoy, making future discoveries
                                        even better.
                                    </p>
                                    <div className="flex gap-4 items-center">
                                        <button className="btn btn-success btn-sm"><i className="fa-solid fa-duotone fa-duotone fa-thumbs-up mr-1"></i> Like</button>
                                        <button className="btn btn-error btn-sm"><i className="fa-solid fa-duotone fa-duotone fa-thumbs-down mr-1"></i> Skip</button>
                                        <button className="btn btn-primary btn-sm"><i className="fa-solid fa-duotone fa-duotone fa-bookmark mr-1"></i> Save</button>
                                        <button className="btn btn-secondary btn-sm"><i className="fa-solid fa-duotone fa-duotone fa-share-nodes mr-1"></i> Share</button>
                                    </div>
                                </div>
                            </div>

                            {/* Step 4 */}
                            <div className="flex flex-col md:flex-row-reverse gap-8 items-center">
                                <div className="md:w-1/3 flex justify-center">
                                    <div className="w-32 h-32 rounded-full bg-primary/20 flex items-center justify-center">
                                        <span className="text-6xl font-bold text-primary">4</span>
                                    </div>
                                </div>
                                <div className="md:w-2/3 md:text-right">
                                    <h3 className="text-3xl font-bold text-primary mb-4">Algorithm Learns & Adapts</h3>
                                    <p className="text-base-content/70 text-lg mb-4">
                                        With every reaction, our discovery algorithm gets smarter. It picks up on patterns,
                                        recognizes your taste, and fine-tunes future recommendations to match what you love.
                                        The more you stumble, the better it gets.
                                    </p>
                                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-lg">
                                        <i className="fa-solid fa-duotone fa-brain text-2xl text-primary"></i>
                                        <span className="text-base-content/70">Machine Learning in Action</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* The Wildness Control */}
                <section className="py-16 px-4 bg-base-200">
                    <div className="max-w-5xl mx-auto">
                        <div className="text-center mb-12">
                            <h2 className="text-4xl font-bold text-base-content mb-4">
                                The <span className="text-secondary">Wildness</span> Control
                            </h2>
                            <p className="text-xl text-base-content/70 max-w-3xl mx-auto">
                                One of Stumbleable's most unique features—tune how adventurous your discoveries are
                            </p>
                        </div>

                        <div className="grid md:grid-cols-3 gap-8">
                            {/* Low Wildness */}
                            <div className="card bg-base-100 shadow-xl">
                                <div className="card-body items-center text-center">
                                    <i className="fa-solid fa-duotone fa-duotone fa-bullseye text-5xl text-primary mb-4"></i>
                                    <h3 className="card-title text-primary">Low Wildness (0-30)</h3>
                                    <p className="text-base-content/70">
                                        Stay close to your known interests. Perfect when you want reliable,
                                        familiar content in the topics you love.
                                    </p>
                                    <div className="w-full bg-base-200 rounded-full h-3 mt-4">
                                        <div className="bg-primary h-3 rounded-full" style={{ width: '25%' }}></div>
                                    </div>
                                </div>
                            </div>

                            {/* Medium Wildness */}
                            <div className="card bg-base-100 shadow-xl border-2 border-secondary">
                                <div className="card-body items-center text-center">
                                    <i className="fa-solid fa-duotone fa-duotone fa-star text-5xl text-secondary mb-4"></i>
                                    <h3 className="card-title text-secondary">Medium Wildness (31-70)</h3>
                                    <p className="text-base-content/70">
                                        The sweet spot! Mix familiar favorites with occasional surprises from
                                        adjacent topics and trending discoveries.
                                    </p>
                                    <div className="w-full bg-base-200 rounded-full h-3 mt-4">
                                        <div className="bg-secondary h-3 rounded-full" style={{ width: '50%' }}></div>
                                    </div>
                                    <div className="badge badge-secondary badge-sm">Recommended</div>
                                </div>
                            </div>

                            {/* High Wildness */}
                            <div className="card bg-base-100 shadow-xl">
                                <div className="card-body items-center text-center">
                                    <i className="fa-solid fa-duotone fa-duotone fa-rocket text-5xl text-accent mb-4"></i>
                                    <h3 className="card-title text-accent">High Wildness (71-100)</h3>
                                    <p className="text-base-content/70">
                                        Maximum adventure! Venture into completely unexpected territory.
                                        You'll discover topics you never knew existed.
                                    </p>
                                    <div className="w-full bg-base-200 rounded-full h-3 mt-4">
                                        <div className="bg-accent h-3 rounded-full" style={{ width: '85%' }}></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-12 p-6 bg-base-100 rounded-lg">
                            <h4 className="text-xl font-bold text-base-content mb-3 flex items-center gap-2">
                                <i className="fa-solid fa-duotone fa-lightbulb text-secondary"></i>
                                Pro Tip
                            </h4>
                            <p className="text-base-content/70">
                                Try starting with medium wildness, then adjust based on your mood. Feeling curious?
                                Crank it up. Need focus? Dial it down. You can change it anytime!
                            </p>
                        </div>
                    </div>
                </section>

                {/* The Algorithm */}
                <section className="py-16 px-4">
                    <div className="max-w-5xl mx-auto">
                        <h2 className="text-4xl font-bold text-center text-base-content mb-4">
                            Behind the Scenes: Our Discovery Algorithm
                        </h2>
                        <p className="text-center text-base-content/70 mb-12 max-w-3xl mx-auto">
                            What makes Stumbleable different from other content platforms
                        </p>

                        <div className="grid md:grid-cols-2 gap-8">
                            <div className="card bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
                                <div className="card-body">
                                    <h3 className="card-title text-primary">
                                        <i className="fa-solid fa-duotone fa-shield-check"></i>
                                        Quality First
                                    </h3>
                                    <p className="text-base-content/70">
                                        Every piece of content is human-curated and community-moderated.
                                        No clickbait, no spam—just genuinely interesting discoveries.
                                    </p>
                                </div>
                            </div>

                            <div className="card bg-gradient-to-br from-secondary/10 to-secondary/5 border border-secondary/20">
                                <div className="card-body">
                                    <h3 className="card-title text-secondary">
                                        <i className="fa-solid fa-duotone fa-chart-line"></i>
                                        Learns from Patterns
                                    </h3>
                                    <p className="text-base-content/70">
                                        Analyzes your reactions across multiple dimensions—topics, formats,
                                        reading time, sources—to understand your unique taste.
                                    </p>
                                </div>
                            </div>

                            <div className="card bg-gradient-to-br from-accent/10 to-accent/5 border border-accent/20">
                                <div className="card-body">
                                    <h3 className="card-title text-accent">
                                        <i className="fa-solid fa-duotone fa-sparkles"></i>
                                        Balances Familiarity & Surprise
                                    </h3>
                                    <p className="text-base-content/70">
                                        Uses collaborative filtering and content-based recommendations to find
                                        the sweet spot between comfort and discovery.
                                    </p>
                                </div>
                            </div>

                            <div className="card bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
                                <div className="card-body">
                                    <h3 className="card-title text-primary">
                                        <i className="fa-solid fa-duotone fa-clock-rotate-left"></i>
                                        Respects Your History
                                    </h3>
                                    <p className="text-base-content/70">
                                        Never shows you the same content twice. Tracks what you've seen,
                                        skipped, and loved to keep discoveries fresh.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* CTA Section */}
                <section className="py-20 px-4 bg-gradient-to-br from-secondary/10 via-accent/10 to-primary/10">
                    <div className="max-w-4xl mx-auto text-center">
                        <h2 className="text-4xl md:text-5xl font-bold text-base-content mb-6">
                            Experience It Yourself
                        </h2>
                        <p className="text-xl text-base-content/70 mb-8">
                            The best way to understand Stumbleable is to try it. Start your discovery journey today.
                        </p>
                        <div className="flex gap-4 justify-center flex-wrap">
                            <a href="/sign-up" className="btn btn-secondary btn-lg">
                                <i className="fa-solid fa-duotone fa-compass mr-2"></i>
                                Start Stumbling
                            </a>
                            <a href="/features" className="btn btn-outline btn-lg">
                                <i className="fa-solid fa-duotone fa-list-check mr-2"></i>
                                See All Features
                            </a>
                        </div>
                    </div>
                </section>
            </div>
        </>
    );
}
