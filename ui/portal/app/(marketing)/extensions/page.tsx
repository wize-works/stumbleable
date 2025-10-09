import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
    title: 'Browser Extensions | Stumbleable',
    description: 'Discover amazing content from anywhere on the web. Install the Stumbleable browser extension for Chrome, Firefox, and more.',
};

export default function ExtensionsPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50">
            {/* Hero Section */}
            <section className="relative overflow-hidden bg-gradient-to-br from-purple-600 via-indigo-600 to-purple-700">
                <div className="absolute inset-0 bg-grid-white/10"></div>
                <div className="container relative mx-auto px-4 py-20 sm:py-32">
                    <div className="mx-auto max-w-4xl text-center">
                        <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm">
                            <i className="fa-solid fa-duotone fa-rocket text-2xl"></i>
                            <span>Discover from Anywhere</span>
                        </div>
                        <h1 className="mb-6 text-5xl font-bold tracking-tight text-white sm:text-6xl md:text-7xl">
                            Stumble from Your Browser
                        </h1>
                        <p className="mb-10 text-xl text-purple-100 sm:text-2xl">
                            Install the Stumbleable extension and discover amazing content without leaving your current tab. One click, endless possibilities.
                        </p>
                        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                            <Link
                                href="/extensions/chrome"
                                className="group flex w-full items-center justify-center gap-3 rounded-xl bg-white px-8 py-4 text-lg font-bold text-purple-600 shadow-xl transition-all hover:scale-105 hover:shadow-2xl sm:w-auto"
                            >
                                <svg className="h-8 w-8" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 10.879l-1.745 8.758c-.131.656-.475 1.016-.863 1.016-.204 0-.408-.082-.612-.245l-2.539-2.088-1.224 1.177c-.135.135-.249.249-.51.249l.182-2.588 4.698-4.247c.204-.182-.045-.283-.317-.101l-5.801 3.653-2.502-.782c-.544-.172-.555-.544.113-.806l9.782-3.77c.454-.164.852.101.703.806z" />
                                </svg>
                                <span>Get Chrome Extension</span>
                                <span className="text-sm font-normal text-purple-500">Free</span>
                            </Link>
                            <Link
                                href="#features"
                                className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-white/30 bg-white/10 px-8 py-4 text-lg font-bold text-white backdrop-blur-sm transition-all hover:bg-white/20 sm:w-auto"
                            >
                                <span>See Features</span>
                                <span>→</span>
                            </Link>
                        </div>
                        <p className="mt-6 text-sm text-purple-200">
                            <i className="fa-solid fa-duotone fa-star"></i> Rated 4.8/5 by users • <i className="fa-solid fa-duotone fa-lock"></i> Privacy-first • <i className="fa-solid fa-duotone fa-circle-check"></i> Free forever
                        </p>
                    </div>
                </div>

                {/* Animated Wave */}
                <div className="absolute bottom-0 left-0 right-0">
                    <svg className="w-full" viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M0,64L60,69.3C120,75,240,85,360,80C480,75,600,53,720,48C840,43,960,53,1080,58.7C1200,64,1320,64,1380,64L1440,64L1440,120L1380,120C1320,120,1200,120,1080,120C960,120,840,120,720,120C600,120,480,120,360,120C240,120,120,120,60,120L0,120Z" fill="rgb(249, 250, 251)" />
                    </svg>
                </div>
            </section>

            {/* Browser Support Section */}
            <section className="py-20">
                <div className="container mx-auto px-4">
                    <div className="mb-16 text-center">
                        <h2 className="mb-4 text-4xl font-bold text-gray-900">Available for Your Browser</h2>
                        <p className="text-xl text-gray-600">Install on your favorite browser and start discovering</p>
                    </div>

                    <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-3">
                        {/* Chrome */}
                        <Link
                            href="/extensions/chrome"
                            className="group relative overflow-hidden rounded-2xl bg-white p-8 shadow-lg transition-all hover:scale-105 hover:shadow-2xl"
                        >
                            <div className="absolute right-4 top-4 rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-600">
                                AVAILABLE
                            </div>
                            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500 to-yellow-500">
                                <svg className="h-12 w-12 text-white" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 10.879l-1.745 8.758c-.131.656-.475 1.016-.863 1.016-.204 0-.408-.082-.612-.245l-2.539-2.088-1.224 1.177c-.135.135-.249.249-.51.249l.182-2.588 4.698-4.247c.204-.182-.045-.283-.317-.101l-5.801 3.653-2.502-.782c-.544-.172-.555-.544.113-.806l9.782-3.77c.454-.164.852.101.703.806z" />
                                </svg>
                            </div>
                            <h3 className="mb-2 text-2xl font-bold text-gray-900">Chrome</h3>
                            <p className="mb-4 text-gray-600">Full-featured extension with all capabilities</p>
                            <div className="flex items-center gap-2 text-purple-600 font-semibold group-hover:gap-3 transition-all">
                                <span>Install Now</span>
                                <span>→</span>
                            </div>
                        </Link>

                        {/* Firefox (Coming Soon) */}
                        <div className="group relative overflow-hidden rounded-2xl bg-white p-8 shadow-lg opacity-60">
                            <div className="absolute right-4 top-4 rounded-full bg-orange-100 px-3 py-1 text-xs font-bold text-orange-600">
                                COMING SOON
                            </div>
                            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-red-500">
                                <svg className="h-12 w-12 text-white" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 10.879l-1.745 8.758c-.131.656-.475 1.016-.863 1.016-.204 0-.408-.082-.612-.245l-2.539-2.088-1.224 1.177c-.135.135-.249.249-.51.249l.182-2.588 4.698-4.247c.204-.182-.045-.283-.317-.101l-5.801 3.653-2.502-.782c-.544-.172-.555-.544.113-.806l9.782-3.77c.454-.164.852.101.703.806z" />
                                </svg>
                            </div>
                            <h3 className="mb-2 text-2xl font-bold text-gray-900">Firefox</h3>
                            <p className="mb-4 text-gray-600">In development, launching soon</p>
                            <div className="flex items-center gap-2 text-gray-400 font-semibold">
                                <span>Notify Me</span>
                                <span>→</span>
                            </div>
                        </div>

                        {/* Safari (Coming Soon) */}
                        <div className="group relative overflow-hidden rounded-2xl bg-white p-8 shadow-lg opacity-60">
                            <div className="absolute right-4 top-4 rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-600">
                                COMING SOON
                            </div>
                            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500">
                                <svg className="h-12 w-12 text-white" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 10.879l-1.745 8.758c-.131.656-.475 1.016-.863 1.016-.204 0-.408-.082-.612-.245l-2.539-2.088-1.224 1.177c-.135.135-.249.249-.51.249l.182-2.588 4.698-4.247c.204-.182-.045-.283-.317-.101l-5.801 3.653-2.502-.782c-.544-.172-.555-.544.113-.806l9.782-3.77c.454-.164.852.101.703.806z" />
                                </svg>
                            </div>
                            <h3 className="mb-2 text-2xl font-bold text-gray-900">Safari</h3>
                            <p className="mb-4 text-gray-600">In development for macOS and iOS</p>
                            <div className="flex items-center gap-2 text-gray-400 font-semibold">
                                <span>Notify Me</span>
                                <span>→</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="bg-white py-20">
                <div className="container mx-auto px-4">
                    <div className="mb-16 text-center">
                        <h2 className="mb-4 text-4xl font-bold text-gray-900">Powerful Features, Simple Experience</h2>
                        <p className="text-xl text-gray-600">Everything you need to discover amazing content</p>
                    </div>

                    <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-2 lg:grid-cols-3">
                        {/* Feature 1 */}
                        <div className="rounded-xl bg-gradient-to-br from-purple-50 to-indigo-50 p-6">
                            <i className="fa-solid fa-duotone fa-dice text-4xl mb-4 text-purple-600"></i>
                            <h3 className="mb-2 text-xl font-bold text-gray-900">Quick Stumbling</h3>
                            <p className="text-gray-600">
                                Click the extension icon to discover amazing content instantly. Beautiful popup interface with full discovery cards.
                            </p>
                        </div>

                        {/* Feature 2 */}
                        <div className="rounded-xl bg-gradient-to-br from-pink-50 to-rose-50 p-6">
                            <i className="fa-solid fa-duotone fa-share-from-square text-4xl mb-4 text-pink-600"></i>
                            <h3 className="mb-2 text-xl font-bold text-gray-900">Submit Pages</h3>
                            <p className="text-gray-600">
                                Right-click any page to submit it to Stumbleable. Share interesting content with the community.
                            </p>
                        </div>

                        {/* Feature 3 */}
                        <div className="rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50 p-6">
                            <i className="fa-solid fa-duotone fa-bookmark text-4xl mb-4 text-blue-600"></i>
                            <h3 className="mb-2 text-xl font-bold text-gray-900">Save Anywhere</h3>
                            <p className="text-gray-600">
                                Save interesting pages with a right-click or keyboard shortcut. Access them later in your collection.
                            </p>
                        </div>

                        {/* Feature 4 */}
                        <div className="rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 p-6">
                            <i className="fa-solid fa-duotone fa-keyboard text-4xl mb-4 text-green-600"></i>
                            <h3 className="mb-2 text-xl font-bold text-gray-900">Keyboard Shortcuts</h3>
                            <p className="text-gray-600">
                                Lightning-fast navigation with keyboard shortcuts. Space to stumble, arrows for reactions, and more.
                            </p>
                        </div>

                        {/* Feature 5 */}
                        <div className="rounded-xl bg-gradient-to-br from-orange-50 to-amber-50 p-6">
                            <i className="fa-solid fa-duotone fa-gear text-4xl mb-4 text-orange-600"></i>
                            <h3 className="mb-2 text-xl font-bold text-gray-900">Sync Preferences</h3>
                            <p className="text-gray-600">
                                Your wildness setting and preferences sync across all devices. Seamless experience everywhere.
                            </p>
                        </div>

                        {/* Feature 6 */}
                        <div className="rounded-xl bg-gradient-to-br from-violet-50 to-purple-50 p-6">
                            <i className="fa-solid fa-duotone fa-lock text-4xl mb-4 text-violet-600"></i>
                            <h3 className="mb-2 text-xl font-bold text-gray-900">Privacy First</h3>
                            <p className="text-gray-600">
                                No tracking, no ads, no data collection. Only the permissions needed for core functionality.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* How It Works Section */}
            <section className="py-20">
                <div className="container mx-auto px-4">
                    <div className="mb-16 text-center">
                        <h2 className="mb-4 text-4xl font-bold text-gray-900">Get Started in Seconds</h2>
                        <p className="text-xl text-gray-600">Three simple steps to endless discovery</p>
                    </div>

                    <div className="mx-auto grid max-w-5xl gap-12 md:grid-cols-3">
                        {/* Step 1 */}
                        <div className="text-center">
                            <div className="mb-6 flex justify-center">
                                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 text-2xl font-bold text-white shadow-lg">
                                    1
                                </div>
                            </div>
                            <h3 className="mb-3 text-xl font-bold text-gray-900">Install Extension</h3>
                            <p className="text-gray-600">
                                Click "Add to Chrome" and confirm the installation. Takes less than 5 seconds.
                            </p>
                        </div>

                        {/* Step 2 */}
                        <div className="text-center">
                            <div className="mb-6 flex justify-center">
                                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 text-2xl font-bold text-white shadow-lg">
                                    2
                                </div>
                            </div>
                            <h3 className="mb-3 text-xl font-bold text-gray-900">Sign In</h3>
                            <p className="text-gray-600">
                                Sign in with your Stumbleable account. Don't have one? Create it in seconds!
                            </p>
                        </div>

                        {/* Step 3 */}
                        <div className="text-center">
                            <div className="mb-6 flex justify-center">
                                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 text-2xl font-bold text-white shadow-lg">
                                    3
                                </div>
                            </div>
                            <h3 className="mb-3 text-xl font-bold text-gray-900">Start Discovering</h3>
                            <p className="text-gray-600">
                                Click the extension icon or use keyboard shortcuts to stumble through amazing content!
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Keyboard Shortcuts Section */}
            <section className="bg-gradient-to-br from-gray-900 to-gray-800 py-20 text-white">
                <div className="container mx-auto px-4">
                    <div className="mb-12 text-center">
                        <h2 className="mb-4 text-4xl font-bold">Keyboard Shortcuts</h2>
                        <p className="text-xl text-gray-300">Master these shortcuts for lightning-fast discovery</p>
                    </div>

                    <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-2">
                        <div className="flex items-center gap-4 rounded-xl bg-white/10 p-6 backdrop-blur-sm">
                            <kbd className="rounded-lg bg-gray-700 px-4 py-2 font-mono text-sm font-bold">Ctrl + Shift + S</kbd>
                            <span className="text-gray-200">Open stumble popup</span>
                        </div>
                        <div className="flex items-center gap-4 rounded-xl bg-white/10 p-6 backdrop-blur-sm">
                            <kbd className="rounded-lg bg-gray-700 px-4 py-2 font-mono text-sm font-bold">Ctrl + Shift + D</kbd>
                            <span className="text-gray-200">Save current page</span>
                        </div>
                        <div className="flex items-center gap-4 rounded-xl bg-white/10 p-6 backdrop-blur-sm">
                            <kbd className="rounded-lg bg-gray-700 px-4 py-2 font-mono text-sm font-bold">Ctrl + Shift + U</kbd>
                            <span className="text-gray-200">Submit current page</span>
                        </div>
                        <div className="flex items-center gap-4 rounded-xl bg-white/10 p-6 backdrop-blur-sm">
                            <kbd className="rounded-lg bg-gray-700 px-4 py-2 font-mono text-sm font-bold">Space</kbd>
                            <span className="text-gray-200">Next stumble (in popup)</span>
                        </div>
                        <div className="flex items-center gap-4 rounded-xl bg-white/10 p-6 backdrop-blur-sm">
                            <kbd className="rounded-lg bg-gray-700 px-4 py-2 font-mono text-sm font-bold">↑</kbd>
                            <span className="text-gray-200">Like (in popup)</span>
                        </div>
                        <div className="flex items-center gap-4 rounded-xl bg-white/10 p-6 backdrop-blur-sm">
                            <kbd className="rounded-lg bg-gray-700 px-4 py-2 font-mono text-sm font-bold">↓</kbd>
                            <span className="text-gray-200">Skip (in popup)</span>
                        </div>
                    </div>

                    <p className="mt-8 text-center text-sm text-gray-400">
                        On Mac, use ⌘ (Command) instead of Ctrl
                    </p>
                </div>
            </section>

            {/* Testimonials Section */}
            <section className="py-20">
                <div className="container mx-auto px-4">
                    <div className="mb-16 text-center">
                        <h2 className="mb-4 text-4xl font-bold text-gray-900">Loved by Discoverers</h2>
                        <p className="text-xl text-gray-600">See what our users are saying</p>
                    </div>

                    <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-3">
                        <div className="rounded-xl bg-white p-6 shadow-lg">
                            <div className="mb-4 flex gap-1 text-yellow-400">
                                {"⭐".repeat(5)}
                            </div>
                            <p className="mb-4 text-gray-700">
                                "The extension is a game-changer! I discover amazing content while browsing without having to switch tabs."
                            </p>
                            <div className="font-semibold text-gray-900">— Sarah K.</div>
                        </div>

                        <div className="rounded-xl bg-white p-6 shadow-lg">
                            <div className="mb-4 flex gap-1 text-yellow-400">
                                {"⭐".repeat(5)}
                            </div>
                            <p className="mb-4 text-gray-700">
                                "Keyboard shortcuts are brilliant. I can stumble, save, and submit pages without touching my mouse."
                            </p>
                            <div className="font-semibold text-gray-900">— Mike T.</div>
                        </div>

                        <div className="rounded-xl bg-white p-6 shadow-lg">
                            <div className="mb-4 flex gap-1 text-yellow-400">
                                {"⭐".repeat(5)}
                            </div>
                            <p className="mb-4 text-gray-700">
                                "Love that it respects my privacy. No tracking, just pure discovery. This is how extensions should be built."
                            </p>
                            <div className="font-semibold text-gray-900">— Alex R.</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="relative overflow-hidden bg-gradient-to-br from-purple-600 via-indigo-600 to-purple-700 py-20">
                <div className="absolute inset-0 bg-grid-white/10"></div>
                <div className="container relative mx-auto px-4 text-center">
                    <h2 className="mb-6 text-4xl font-bold text-white sm:text-5xl">
                        Ready to Start Discovering?
                    </h2>
                    <p className="mb-10 text-xl text-purple-100">
                        Join thousands of users exploring the web with Stumbleable
                    </p>
                    <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                        <Link
                            href="/extensions/chrome"
                            className="flex w-full items-center justify-center gap-3 rounded-xl bg-white px-8 py-4 text-lg font-bold text-purple-600 shadow-xl transition-all hover:scale-105 hover:shadow-2xl sm:w-auto"
                        >
                            <span>Install Chrome Extension</span>
                            <span>→</span>
                        </Link>
                        <Link
                            href="/stumble"
                            className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-white/30 bg-white/10 px-8 py-4 text-lg font-bold text-white backdrop-blur-sm transition-all hover:bg-white/20 sm:w-auto"
                        >
                            <span>Try Web App</span>
                        </Link>
                    </div>
                </div>
            </section>

            {/* FAQ Section */}
            <section className="bg-gray-50 py-20">
                <div className="container mx-auto px-4">
                    <div className="mb-16 text-center">
                        <h2 className="mb-4 text-4xl font-bold text-gray-900">Frequently Asked Questions</h2>
                    </div>

                    <div className="mx-auto max-w-3xl space-y-6">
                        <details className="group rounded-xl bg-white p-6 shadow-lg">
                            <summary className="cursor-pointer text-lg font-bold text-gray-900 group-open:mb-4">
                                Is the extension free?
                            </summary>
                            <p className="text-gray-600">
                                Yes! The Stumbleable browser extension is completely free, now and forever. No hidden costs, no premium tiers.
                            </p>
                        </details>

                        <details className="group rounded-xl bg-white p-6 shadow-lg">
                            <summary className="cursor-pointer text-lg font-bold text-gray-900 group-open:mb-4">
                                What data does the extension collect?
                            </summary>
                            <p className="text-gray-600">
                                The extension only stores your preferences locally and syncs them with your Stumbleable account. We don't track your browsing history or collect any personal data beyond what's needed for discovery recommendations.
                            </p>
                        </details>

                        <details className="group rounded-xl bg-white p-6 shadow-lg">
                            <summary className="cursor-pointer text-lg font-bold text-gray-900 group-open:mb-4">
                                Can I use it without an account?
                            </summary>
                            <p className="text-gray-600">
                                You need a free Stumbleable account to use the extension. This allows us to personalize your discoveries and sync your preferences across devices.
                            </p>
                        </details>

                        <details className="group rounded-xl bg-white p-6 shadow-lg">
                            <summary className="cursor-pointer text-lg font-bold text-gray-900 group-open:mb-4">
                                Which browsers are supported?
                            </summary>
                            <p className="text-gray-600">
                                Currently, we support Chrome (and Chromium-based browsers like Edge and Brave). Firefox and Safari support is coming soon!
                            </p>
                        </details>

                        <details className="group rounded-xl bg-white p-6 shadow-lg">
                            <summary className="cursor-pointer text-lg font-bold text-gray-900 group-open:mb-4">
                                Can I customize keyboard shortcuts?
                            </summary>
                            <p className="text-gray-600">
                                Yes! Go to chrome://extensions/shortcuts in Chrome to customize all keyboard shortcuts to your preference.
                            </p>
                        </details>
                    </div>
                </div>
            </section>
        </div>
    );
}
