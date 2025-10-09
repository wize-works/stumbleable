import { StructuredData } from '@/components/structured-data';
import { createBreadcrumbSchema } from '@/lib/structured-data';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
    title: 'Best StumbleUpon Alternative 2025 | Stumbleable',
    description:
        'Looking for the best StumbleUpon alternative? Stumbleable brings back serendipitous web discovery with modern features. Free, fast, and better than the original. Try it now!',
    keywords: [
        'stumbleupon alternative',
        'stumbleupon replacement',
        'stumbleupon successor',
        'random website discovery',
        'web exploration tool',
        'content discovery platform',
    ],
    alternates: {
        canonical: '/alternatives/stumbleupon',
    },
    openGraph: {
        title: 'Best StumbleUpon Alternative 2025 | Stumbleable',
        description: 'Miss StumbleUpon? Stumbleable is the modern alternative you\'ve been waiting for.',
        url: 'https://stumbleable.com/alternatives/stumbleupon',
        type: 'article',
        images: [
            {
                url: '/og-image-alternatives.png',
                width: 1200,
                height: 630,
                alt: 'Stumbleable - Best StumbleUpon Alternative',
            },
        ],
    },
};

const breadcrumbs = createBreadcrumbSchema([
    { name: 'Home', url: 'https://stumbleable.com' },
    { name: 'Alternatives', url: 'https://stumbleable.com/alternatives' },
    { name: 'StumbleUpon Alternative', url: 'https://stumbleable.com/alternatives/stumbleupon' },
]);

export default function StumbleUponAlternativePage() {
    return (
        <>
            <StructuredData schemas={breadcrumbs} />
            <div className="min-h-screen bg-base-100">
                <div className="container mx-auto px-4 py-12 max-w-4xl">
                    {/* Breadcrumbs */}
                    <nav className="text-sm breadcrumbs mb-8">
                        <ul>
                            <li>
                                <Link href="/">Home</Link>
                            </li>
                            <li>
                                <Link href="/alternatives">Alternatives</Link>
                            </li>
                            <li>StumbleUpon Alternative</li>
                        </ul>
                    </nav>

                    {/* Hero Section */}
                    <div className="text-center mb-12">
                        <h1 className="text-5xl font-bold mb-6 leading-tight">
                            The Best StumbleUpon Alternative in 2025
                        </h1>
                        <p className="text-xl text-base-content/70 mb-8">
                            Stumbleable brings back the magic of serendipitous web discovery—with modern features,
                            better UX, and the same one-click joy you remember.
                        </p>
                        <Link href="/stumble" className="btn btn-primary btn-lg">
                            <i className="fa-solid fa-duotone fa-dice"></i>
                            Try Stumbleable Free
                        </Link>
                    </div>

                    {/* Article Content */}
                    <article className="prose prose-lg max-w-none">
                        {/* Introduction */}
                        <h2>Why StumbleUpon Fans Are Switching to Stumbleable</h2>

                        <p>
                            If you're reading this, chances are you miss StumbleUpon.
                        </p>

                        <p>
                            That magical button that took you to unexpected corners of the internet.
                            The serendipity. The surprise. The pure joy of discovery.
                        </p>

                        <div className="not-prose bg-warning/10 border-l-4 border-warning p-6 rounded-r-lg my-6">
                            <p className="text-base-content/80 mb-0">
                                <strong className="text-warning-content">Remember this feeling?</strong> One click,
                                infinite possibilities. That's what we're bringing back.
                            </p>
                        </div>

                        <h3>What Happened to StumbleUpon?</h3>

                        <p>
                            When StumbleUpon shut down in 2018, millions of users lost their favorite way to explore the web.
                        </p>

                        <p>
                            Mix.com tried to fill the void. But it never quite captured the original magic.
                            The interface was clunky. The algorithm felt off. Something essential was missing.
                        </p>

                        <h3>Enter Stumbleable</h3>

                        <p>
                            We've taken everything you loved about StumbleUpon and rebuilt it for 2025.
                        </p>

                        <p>
                            <strong>Better technology.</strong> Smarter curation. Features the original never had.
                        </p>

                        {/* Comparison Table */}
                        <h2>Stumbleable vs StumbleUpon: Feature Comparison</h2>
                        <div className="overflow-x-auto not-prose mb-8">
                            <table className="table table-zebra w-full">
                                <thead>
                                    <tr>
                                        <th>Feature</th>
                                        <th>StumbleUpon (RIP 2018)</th>
                                        <th className="bg-primary/10">Stumbleable (2025)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td className="font-semibold">One-Click Discovery</td>
                                        <td><i className="fa-solid fa-duotone fa-check text-success"></i> Yes</td>
                                        <td className="bg-primary/10"><i className="fa-solid fa-duotone fa-check text-success"></i> Yes</td>
                                    </tr>
                                    <tr>
                                        <td className="font-semibold">Wildness Control</td>
                                        <td><i className="fa-solid fa-duotone fa-xmark text-error"></i> No</td>
                                        <td className="bg-primary/10"><i className="fa-solid fa-duotone fa-check text-success"></i> Yes (0-100 slider)</td>
                                    </tr>
                                    <tr>
                                        <td className="font-semibold">AI-Powered Curation</td>
                                        <td><i className="fa-solid fa-duotone fa-xmark text-error"></i> Basic algorithm</td>
                                        <td className="bg-primary/10"><i className="fa-solid fa-duotone fa-check text-success"></i> Advanced AI + human curation</td>
                                    </tr>
                                    <tr>
                                        <td className="font-semibold">Custom Lists</td>
                                        <td><i className="fa-solid fa-duotone fa-xmark text-error"></i> Limited</td>
                                        <td className="bg-primary/10"><i className="fa-solid fa-duotone fa-check text-success"></i> Unlimited lists</td>
                                    </tr>
                                    <tr>
                                        <td className="font-semibold">Keyboard Shortcuts</td>
                                        <td><i className="fa-solid fa-duotone fa-xmark text-error"></i> No</td>
                                        <td className="bg-primary/10"><i className="fa-solid fa-duotone fa-check text-success"></i> Full keyboard navigation</td>
                                    </tr>
                                    <tr>
                                        <td className="font-semibold">Dark Mode</td>
                                        <td><i className="fa-solid fa-duotone fa-xmark text-error"></i> No</td>
                                        <td className="bg-primary/10"><i className="fa-solid fa-duotone fa-check text-success"></i> Automatic + manual toggle</td>
                                    </tr>
                                    <tr>
                                        <td className="font-semibold">Mobile Experience</td>
                                        <td><i className="fa-solid fa-duotone fa-triangle-exclamation text-warning"></i> Okay</td>
                                        <td className="bg-primary/10"><i className="fa-solid fa-duotone fa-check text-success"></i> Excellent (PWA ready)</td>
                                    </tr>
                                    <tr>
                                        <td className="font-semibold">Page Load Speed</td>
                                        <td><i className="fa-solid fa-duotone fa-triangle-exclamation text-warning"></i> Slow</td>
                                        <td className="bg-primary/10"><i className="fa-solid fa-duotone fa-check text-success"></i> Lightning fast</td>
                                    </tr>
                                    <tr>
                                        <td className="font-semibold">Price</td>
                                        <td>Free (with ads)</td>
                                        <td className="bg-primary/10">100% Free (no ads)</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* What Made StumbleUpon Great */}
                        <h2>What Made StumbleUpon So Special?</h2>

                        <p>Before we dive into why Stumbleable is better, let's remember what made StumbleUpon great:</p>

                        <div className="not-prose grid md:grid-cols-2 gap-4 my-6">
                            <div className="card bg-base-200 p-5">
                                <h4 className="font-bold text-lg mb-2 flex items-center gap-2">
                                    <i className="fa-solid fa-duotone fa-hand-pointer text-primary"></i>
                                    One-Click Simplicity
                                </h4>
                                <p className="text-base-content/70">
                                    No endless scrolling. Just hit the button and discover something new.
                                </p>
                            </div>
                            <div className="card bg-base-200 p-5">
                                <h4 className="font-bold text-lg mb-2 flex items-center gap-2">
                                    <i className="fa-solid fa-duotone fa-sparkles text-secondary"></i>
                                    Pure Serendipity
                                </h4>
                                <p className="text-base-content/70">
                                    You never knew what you'd find next. That's the whole point.
                                </p>
                            </div>
                            <div className="card bg-base-200 p-5">
                                <h4 className="font-bold text-lg mb-2 flex items-center gap-2">
                                    <i className="fa-solid fa-duotone fa-circle-nodes text-accent"></i>
                                    Breaking Filter Bubbles
                                </h4>
                                <p className="text-base-content/70">
                                    Social media shows you what you already like. StumbleUpon showed you what you didn't know you'd love.
                                </p>
                            </div>
                            <div className="card bg-base-200 p-5">
                                <h4 className="font-bold text-lg mb-2 flex items-center gap-2">
                                    <i className="fa-solid fa-duotone fa-crown text-warning"></i>
                                    Quality Over Quantity
                                </h4>
                                <p className="text-base-content/70">
                                    Curated content from real people, not just viral junk.
                                </p>
                            </div>
                        </div>

                        <p>
                            <strong>Stumbleable preserves all of these core principles</strong> while fixing the problems
                            that plagued StumbleUpon in its final years.
                        </p>

                        {/* What's Better About Stumbleable */}
                        <h2>5 Ways Stumbleable Improves on StumbleUpon</h2>

                        <div className="not-prose bg-gradient-to-r from-primary/5 to-secondary/5 border border-primary/20 rounded-2xl p-6 mb-8">
                            <h3 className="text-2xl font-bold mb-4">
                                <span className="badge badge-primary badge-lg mr-3">1</span>
                                Wildness Control: Tune Your Adventure
                            </h3>

                            <p className="text-base-content/80 mb-4">
                                StumbleUpon had a binary choice: stick to your interests or venture randomly.
                            </p>

                            <p className="text-base-content/80 mb-4">
                                Stumbleable's <strong>Wildness slider</strong> gives you precise control over your discovery journey.
                            </p>

                            <div className="grid md:grid-cols-3 gap-4 mt-4">
                                <div className="bg-base-100 rounded-lg p-4">
                                    <div className="text-sm font-bold text-success mb-2 flex items-center gap-2">
                                        <i className="fa-solid fa-duotone fa-bullseye"></i> Low (0-30)
                                    </div>
                                    <p className="text-sm text-base-content/70">
                                        Familiar territory. Content closely aligned with your interests.
                                    </p>
                                </div>
                                <div className="bg-base-100 rounded-lg p-4">
                                    <div className="text-sm font-bold text-warning mb-2 flex items-center gap-2">
                                        <i className="fa-solid fa-duotone fa-bolt"></i> Medium (30-70)
                                    </div>
                                    <p className="text-sm text-base-content/70">
                                        The sweet spot. Surprises that still feel relevant.
                                    </p>
                                </div>
                                <div className="bg-base-100 rounded-lg p-4">
                                    <div className="text-sm font-bold text-error mb-2 flex items-center gap-2">
                                        <i className="fa-solid fa-duotone fa-fire"></i> High (70-100)
                                    </div>
                                    <p className="text-sm text-base-content/70">
                                        Pure chaos. Completely random discoveries.
                                    </p>
                                </div>
                            </div>

                            <p className="text-base-content/80 mt-4 italic">
                                It's like having a volume knob for serendipity. Monday morning? Keep it low.
                                Friday night? Crank it to 100.
                            </p>
                        </div>

                        <div className="not-prose bg-gradient-to-r from-secondary/5 to-accent/5 border border-secondary/20 rounded-2xl p-6 mb-8">
                            <h3 className="text-2xl font-bold mb-4">
                                <span className="badge badge-secondary badge-lg mr-3">2</span>
                                Modern, Lightning-Fast Interface
                            </h3>

                            <p className="text-base-content/80 mb-4">
                                StumbleUpon's interface felt dated even in 2015. By 2018, it was practically ancient.
                            </p>

                            <p className="text-base-content/80 mb-4">
                                Stumbleable is built with cutting-edge web technology (Next.js 15, React 19):
                            </p>

                            <div className="space-y-3">
                                <div className="flex items-start gap-3">
                                    <i className="fa-solid fa-duotone fa-bolt text-xl text-warning mt-1"></i>
                                    <div>
                                        <strong>Instant page loads</strong>
                                        <p className="text-sm text-base-content/70">No more waiting 3-5 seconds per stumble</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <i className="fa-solid fa-duotone fa-wand-magic-sparkles text-xl text-primary mt-1"></i>
                                    <div>
                                        <strong>Smooth animations</strong>
                                        <p className="text-sm text-base-content/70">Modern, polished UI that feels premium</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <i className="fa-solid fa-duotone fa-mobile-screen-button text-xl text-success mt-1"></i>
                                    <div>
                                        <strong>Responsive design</strong>
                                        <p className="text-sm text-base-content/70">Works perfectly on any screen size</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <i className="fa-solid fa-duotone fa-moon text-xl text-accent mt-1"></i>
                                    <div>
                                        <strong>Dark mode</strong>
                                        <p className="text-sm text-base-content/70">Easy on the eyes, especially at night</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="not-prose bg-gradient-to-r from-accent/5 to-primary/5 border border-accent/20 rounded-2xl p-6 mb-8">
                            <h3 className="text-2xl font-bold mb-4">
                                <span className="badge badge-accent badge-lg mr-3">3</span>
                                Smarter AI + Human Curation
                            </h3>

                            <p className="text-base-content/80 mb-4">
                                StumbleUpon's recommendation engine was good for 2008. But AI has come a long way.
                            </p>

                            <p className="text-base-content/80 mb-4">
                                Stumbleable combines the best of both worlds:
                            </p>

                            <div className="space-y-3">
                                <div className="flex items-start gap-3">
                                    <i className="fa-solid fa-duotone fa-brain text-xl text-primary mt-1"></i>
                                    <div>
                                        <strong>Modern machine learning</strong>
                                        <p className="text-sm text-base-content/70">Learns from your reactions (likes, skips, saves)</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <i className="fa-solid fa-duotone fa-filter text-xl text-secondary mt-1"></i>
                                    <div>
                                        <strong>Quality scoring</strong>
                                        <p className="text-sm text-base-content/70">Filters out clickbait and low-quality content</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <i className="fa-solid fa-duotone fa-user-check text-xl text-accent mt-1"></i>
                                    <div>
                                        <strong>Human curation</strong>
                                        <p className="text-sm text-base-content/70">Our team reviews submissions for quality</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <i className="fa-solid fa-duotone fa-clock-rotate-left text-xl text-warning mt-1"></i>
                                    <div>
                                        <strong>Freshness balancing</strong>
                                        <p className="text-sm text-base-content/70">Mix of recent and timeless content</p>
                                    </div>
                                </div>
                            </div>

                            <p className="text-base-content/80 mt-4 font-bold">
                                Result: Better recommendations that actually surprise and delight.
                            </p>
                        </div>

                        <div className="not-prose bg-gradient-to-r from-primary/5 to-warning/5 border border-primary/20 rounded-2xl p-6 mb-8">
                            <h3 className="text-2xl font-bold mb-4">
                                <span className="badge badge-primary badge-lg mr-3">4</span>
                                Keyboard Shortcuts for Power Users
                            </h3>

                            <p className="text-base-content/80 mb-4">
                                StumbleUpon required clicking. Stumbleable lets you fly through discoveries with your keyboard:
                            </p>

                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="flex items-center gap-3 bg-base-100 rounded-lg p-3">
                                    <kbd className="kbd kbd-sm">Space</kbd>
                                    <span className="text-sm">Next discovery</span>
                                </div>
                                <div className="flex items-center gap-3 bg-base-100 rounded-lg p-3">
                                    <kbd className="kbd kbd-sm">↑</kbd>
                                    <span className="text-sm">Like</span>
                                </div>
                                <div className="flex items-center gap-3 bg-base-100 rounded-lg p-3">
                                    <kbd className="kbd kbd-sm">↓</kbd>
                                    <span className="text-sm">Skip</span>
                                </div>
                                <div className="flex items-center gap-3 bg-base-100 rounded-lg p-3">
                                    <kbd className="kbd kbd-sm">S</kbd>
                                    <span className="text-sm">Save</span>
                                </div>
                                <div className="flex items-center gap-3 bg-base-100 rounded-lg p-3 md:col-span-2">
                                    <kbd className="kbd kbd-sm">Shift</kbd>+<kbd className="kbd kbd-sm">S</kbd>
                                    <span className="text-sm">Share</span>
                                </div>
                            </div>

                            <p className="text-base-content/80 mt-4 italic">
                                Once you go keyboard, you never go back.
                            </p>
                        </div>

                        <div className="not-prose bg-gradient-to-r from-success/5 to-primary/5 border border-success/20 rounded-2xl p-6 mb-8">
                            <h3 className="text-2xl font-bold mb-4">
                                <span className="badge badge-success badge-lg mr-3">5</span>
                                True Cross-Platform Experience
                            </h3>

                            <p className="text-base-content/80 mb-4">
                                StumbleUpon had separate apps for web, iOS, and Android—and they were all different.
                            </p>

                            <p className="text-base-content/80 mb-4">
                                Stumbleable is a <strong>Progressive Web App (PWA)</strong> that works everywhere:
                            </p>

                            <div className="space-y-3">
                                <div className="flex items-start gap-3">
                                    <i className="fa-solid fa-duotone fa-check-circle text-xl text-success mt-1"></i>
                                    <span className="text-base-content/80">Install on any device (iPhone, Android, desktop)</span>
                                </div>
                                <div className="flex items-start gap-3">
                                    <i className="fa-solid fa-duotone fa-check-circle text-xl text-success mt-1"></i>
                                    <span className="text-base-content/80">Works offline (save discoveries to read later)</span>
                                </div>
                                <div className="flex items-start gap-3">
                                    <i className="fa-solid fa-duotone fa-check-circle text-xl text-success mt-1"></i>
                                    <span className="text-base-content/80">Same experience everywhere (no "premium" mobile app)</span>
                                </div>
                                <div className="flex items-start gap-3">
                                    <i className="fa-solid fa-duotone fa-check-circle text-xl text-success mt-1"></i>
                                    <span className="text-base-content/80">No app store required (just add to home screen)</span>
                                </div>
                            </div>
                        </div>

                        {/* Migration Guide */}
                        <h2>Switching from StumbleUpon (or Mix) to Stumbleable</h2>

                        <p className="text-lg">
                            Ready to make the switch? Here's how to recreate your StumbleUpon experience on Stumbleable:
                        </p>

                        <div className="not-prose space-y-6 my-8">
                            <div className="flex gap-4 items-start">
                                <div className="badge badge-primary badge-lg shrink-0 mt-1">1</div>
                                <div>
                                    <h3 className="text-xl font-bold mb-2">Create Your Free Account</h3>
                                    <p className="text-base-content/70">
                                        Visit{' '}
                                        <Link href="/sign-up" className="link link-primary">
                                            stumbleable.com/sign-up
                                        </Link>{' '}
                                        and create your account.
                                    </p>
                                    <p className="text-sm text-base-content/60 mt-1">
                                        Takes 30 seconds. No credit card required.
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-4 items-start">
                                <div className="badge badge-secondary badge-lg shrink-0 mt-1">2</div>
                                <div>
                                    <h3 className="text-xl font-bold mb-2">Set Your Interests</h3>
                                    <p className="text-base-content/70">
                                        During onboarding, select topics you're interested in.
                                    </p>
                                    <p className="text-sm text-base-content/60 mt-1">
                                        Don't overthink it—you can always adjust later. The algorithm learns from your reactions anyway.
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-4 items-start">
                                <div className="badge badge-accent badge-lg shrink-0 mt-1">3</div>
                                <div>
                                    <h3 className="text-xl font-bold mb-2">Start Stumbling!</h3>
                                    <p className="text-base-content/70">
                                        Hit that big <strong>Stumble</strong> button and let the magic begin.
                                    </p>
                                    <p className="text-sm text-base-content/60 mt-1">
                                        Use the Wildness slider to dial in your preferred chaos level.
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-4 items-start">
                                <div className="badge badge-success badge-lg shrink-0 mt-1">4</div>
                                <div>
                                    <h3 className="text-xl font-bold mb-2">Customize Your Experience</h3>
                                    <ul className="space-y-2 text-base-content/70">
                                        <li>• Create lists to organize your saves (like StumbleUpon's collections)</li>
                                        <li>• Adjust your wildness preference in settings</li>
                                        <li>• Enable keyboard shortcuts if you're a power user</li>
                                        <li>• Install as a PWA for quick access</li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        {/* Other Alternatives */}
                        <h2>Other StumbleUpon Alternatives (And Why Stumbleable Is Better)</h2>

                        <p className="text-lg mb-6">
                            There are other options out there, but here's why Stumbleable stands out:
                        </p>

                        <div className="not-prose space-y-6 mb-8">
                            <div className="card bg-base-200 p-6">
                                <h3 className="text-xl font-bold mb-3">Mix.com (Official Successor)</h3>
                                <div className="space-y-2">
                                    <p className="text-base-content/80">
                                        <strong className="text-error">The problem:</strong> Mix tried to be a social network + discovery tool.
                                    </p>
                                    <p className="text-base-content/70 text-sm">
                                        It's cluttered, slow, and the algorithm pushes popular content over quality content.
                                    </p>
                                    <p className="text-base-content/80 mt-3">
                                        <strong className="text-success">Why Stumbleable wins:</strong> We focus purely on discovery.
                                        One button. Clean interface. No social media nonsense.
                                    </p>
                                </div>
                            </div>

                            <div className="card bg-base-200 p-6">
                                <h3 className="text-xl font-bold mb-3">Cloudhiker.net</h3>
                                <div className="space-y-2">
                                    <p className="text-base-content/80">
                                        <strong className="text-error">The problem:</strong> Basic random website generator.
                                        No personalization, no curation, just pure randomness.
                                    </p>
                                    <p className="text-base-content/80 mt-3">
                                        <strong className="text-success">Why Stumbleable wins:</strong> We balance serendipity with relevance.
                                        Random is fun, but personalized random is better.
                                    </p>
                                </div>
                            </div>

                            <div className="card bg-base-200 p-6">
                                <h3 className="text-xl font-bold mb-3">Wiby.me</h3>
                                <div className="space-y-2">
                                    <p className="text-base-content/80">
                                        <strong className="text-error">The problem:</strong> Focuses only on "old web" nostalgia.
                                        Great niche, but limited appeal.
                                    </p>
                                    <p className="text-base-content/80 mt-3">
                                        <strong className="text-success">Why Stumbleable wins:</strong> We include vintage web gems
                                        AND modern content. Best of both worlds.
                                    </p>
                                </div>
                            </div>

                            <div className="card bg-base-200 p-6">
                                <h3 className="text-xl font-bold mb-3">Reddit's Random Subreddit Button</h3>
                                <div className="space-y-2">
                                    <p className="text-base-content/80">
                                        <strong className="text-error">The problem:</strong> Limited to Reddit.
                                        Often lands you in dead or weird subreddits.
                                    </p>
                                    <p className="text-base-content/80 mt-3">
                                        <strong className="text-success">Why Stumbleable wins:</strong> We surface the entire web,
                                        not just one platform.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* FAQ */}
                        <h2>Frequently Asked Questions</h2>

                        <div className="not-prose space-y-4 my-8">
                            <div className="collapse collapse-plus bg-base-200">
                                <input type="radio" name="faq-accordion" defaultChecked />
                                <div className="collapse-title text-lg font-bold">
                                    Is Stumbleable really free?
                                </div>
                                <div className="collapse-content">
                                    <p className="text-base-content/70">
                                        Yes! The core discovery experience is 100% free. No ads, no credit card required.
                                        We may offer optional creator tools or premium features in the future, but discovering
                                        amazing websites will always be free.
                                    </p>
                                </div>
                            </div>

                            <div className="collapse collapse-plus bg-base-200">
                                <input type="radio" name="faq-accordion" />
                                <div className="collapse-title text-lg font-bold">
                                    Will my old StumbleUpon account work?
                                </div>
                                <div className="collapse-content">
                                    <p className="text-base-content/70">
                                        Unfortunately no—StumbleUpon's data is gone. But you can recreate your
                                        interests in minutes during onboarding.
                                    </p>
                                </div>
                            </div>

                            <div className="collapse collapse-plus bg-base-200">
                                <input type="radio" name="faq-accordion" />
                                <div className="collapse-title text-lg font-bold">
                                    Can I import my Mix.com favorites?
                                </div>
                                <div className="collapse-content">
                                    <p className="text-base-content/70">
                                        Not yet, but we're working on it! For now, you can manually save your
                                        favorites as you rediscover them.
                                    </p>
                                </div>
                            </div>

                            <div className="collapse collapse-plus bg-base-200">
                                <input type="radio" name="faq-accordion" />
                                <div className="collapse-title text-lg font-bold">
                                    How do you make money if it's free?
                                </div>
                                <div className="collapse-content">
                                    <p className="text-base-content/70">
                                        Great question! We're currently self-funded. In the future, we may add
                                        optional creator monetization tools or premium features for publishers, but
                                        discovering websites will always be free for everyone.
                                    </p>
                                </div>
                            </div>

                            <div className="collapse collapse-plus bg-base-200">
                                <input type="radio" name="faq-accordion" />
                                <div className="collapse-title text-lg font-bold">
                                    Can I submit my website?
                                </div>
                                <div className="collapse-content">
                                    <p className="text-base-content/70">
                                        Absolutely! Visit our{' '}
                                        <Link href="/submit" className="link link-primary">
                                            Submit page
                                        </Link>{' '}
                                        to suggest your site (or any great site you find) for inclusion.
                                    </p>
                                </div>
                            </div>

                            <div className="collapse collapse-plus bg-base-200">
                                <input type="radio" name="faq-accordion" />
                                <div className="collapse-title text-lg font-bold">
                                    Do you have a mobile app?
                                </div>
                                <div className="collapse-content">
                                    <p className="text-base-content/70">
                                        We're a Progressive Web App, which means you can install Stumbleable on any
                                        device (iPhone, Android, desktop) without an app store. Just visit stumbleable.com
                                        on your phone and "Add to Home Screen."
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Conclusion */}
                        <h2>The Verdict: Best StumbleUpon Alternative in 2025</h2>

                        <p className="text-lg">
                            StumbleUpon created a magical way to explore the internet.
                        </p>

                        <p className="text-lg">
                            Mix.com tried to replace it but missed the mark. Other alternatives are either
                            too random, too niche, or too outdated.
                        </p>

                        <div className="not-prose bg-primary/5 border-l-4 border-primary p-6 rounded-r-lg my-6">
                            <p className="text-lg font-bold text-primary-content mb-0">
                                Stumbleable is different.
                            </p>
                        </div>

                        <p className="text-lg">
                            We've taken the soul of StumbleUpon and given it a modern, faster, smarter body.
                        </p>

                        <h3>The result?</h3>

                        <div className="not-prose grid md:grid-cols-2 gap-4 my-6">
                            <div className="flex gap-3 items-start">
                                <i className="fa-solid fa-duotone fa-circle-check text-2xl text-success mt-1"></i>
                                <div>
                                    <strong>Same one-click simplicity</strong>
                                    <p className="text-sm text-base-content/70">The magic button you remember</p>
                                </div>
                            </div>
                            <div className="flex gap-3 items-start">
                                <i className="fa-solid fa-duotone fa-circle-check text-2xl text-success mt-1"></i>
                                <div>
                                    <strong>Better algorithm</strong>
                                    <p className="text-sm text-base-content/70">AI + human curation</p>
                                </div>
                            </div>
                            <div className="flex gap-3 items-start">
                                <i className="fa-solid fa-duotone fa-circle-check text-2xl text-success mt-1"></i>
                                <div>
                                    <strong>More control</strong>
                                    <p className="text-sm text-base-content/70">Wildness slider for perfect balance</p>
                                </div>
                            </div>
                            <div className="flex gap-3 items-start">
                                <i className="fa-solid fa-duotone fa-circle-check text-2xl text-success mt-1"></i>
                                <div>
                                    <strong>Faster performance</strong>
                                    <p className="text-sm text-base-content/70">Modern tech stack</p>
                                </div>
                            </div>
                            <div className="flex gap-3 items-start">
                                <i className="fa-solid fa-duotone fa-circle-check text-2xl text-success mt-1"></i>
                                <div>
                                    <strong>Better design</strong>
                                    <p className="text-sm text-base-content/70">Dark mode, keyboard shortcuts, PWA</p>
                                </div>
                            </div>
                            <div className="flex gap-3 items-start">
                                <i className="fa-solid fa-duotone fa-circle-check text-2xl text-success mt-1"></i>
                                <div>
                                    <strong>Discovery always free</strong>
                                    <p className="text-sm text-base-content/70">Core experience free forever, no ads</p>
                                </div>
                            </div>
                        </div>

                        <p className="text-xl font-bold text-center my-8">
                            If you miss StumbleUpon, <span className="text-primary">Stumbleable is your new home</span>.
                        </p>

                        {/* CTA */}
                        <div className="not-prose text-center my-12 p-8 bg-primary/10 rounded-2xl">
                            <h3 className="text-3xl font-bold mb-4">Ready to Start Exploring?</h3>
                            <p className="text-lg text-base-content/70 mb-6">
                                Join thousands of curious minds rediscovering the joy of the web.
                            </p>
                            <Link href="/stumble" className="btn btn-primary btn-lg">
                                <i className="fa-solid fa-duotone fa-dice"></i>
                                Try Stumbleable Free
                            </Link>
                            <p className="text-sm text-base-content/50 mt-4">
                                No credit card required • Discovery free forever • No ads
                            </p>
                        </div>

                        {/* Related Links */}
                        <div className="not-prose mt-12 p-6 bg-base-200 rounded-lg">
                            <h3 className="text-xl font-bold mb-4">Related Articles</h3>
                            <ul className="space-y-2">
                                <li>
                                    <Link href="/how-it-works" className="link link-primary">
                                        How Stumbleable Works: A Complete Guide
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/features" className="link link-primary">
                                        Features That Make Stumbleable Different
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/about" className="link link-primary">
                                        About Stumbleable: Our Story
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/submit" className="link link-primary">
                                        Submit Your Website to Stumbleable
                                    </Link>
                                </li>
                            </ul>
                        </div>
                    </article>
                </div>
            </div>
        </>
    );
}
