import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
    title: 'Chrome Extension | Stumbleable',
    description: 'Install the Stumbleable Chrome extension and discover amazing content from anywhere on the web. Quick stumbling, keyboard shortcuts, and seamless integration.',
};

export default function ChromeExtensionPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50">
            {/* Hero Section */}
            <section className="relative overflow-hidden bg-gradient-to-br from-red-500 via-yellow-500 to-red-600">
                <div className="absolute inset-0 bg-grid-white/10"></div>
                <div className="container relative mx-auto px-4 py-20 sm:py-32">
                    <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2">
                        <div>
                            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm">
                                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 10.879l-1.745 8.758c-.131.656-.475 1.016-.863 1.016-.204 0-.408-.082-.612-.245l-2.539-2.088-1.224 1.177c-.135.135-.249.249-.51.249l.182-2.588 4.698-4.247c.204-.182-.045-.283-.317-.101l-5.801 3.653-2.502-.782c-.544-.172-.555-.544.113-.806l9.782-3.77c.454-.164.852.101.703.806z" />
                                </svg>
                                <span>For Chrome Browser</span>
                            </div>
                            <h1 className="mb-6 text-5xl font-bold tracking-tight text-white sm:text-6xl md:text-7xl">
                                Stumbleable for Chrome
                            </h1>
                            <p className="mb-8 text-xl text-white/90">
                                Discover amazing content without leaving your browser. One click, endless possibilities.
                            </p>
                            <div className="flex flex-col gap-4 sm:flex-row">
                                <a
                                    href="#install"
                                    className="group flex items-center justify-center gap-3 rounded-xl bg-white px-8 py-4 text-lg font-bold text-red-600 shadow-xl transition-all hover:scale-105 hover:shadow-2xl"
                                >
                                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                    </svg>
                                    <span>Add to Chrome</span>
                                    <span className="text-sm font-normal text-red-500">Free</span>
                                </a>
                                <Link
                                    href="#features"
                                    className="flex items-center justify-center gap-2 rounded-xl border-2 border-white/30 bg-white/10 px-8 py-4 text-lg font-bold text-white backdrop-blur-sm transition-all hover:bg-white/20"
                                >
                                    <span>Learn More</span>
                                    <span>→</span>
                                </Link>
                            </div>
                            <div className="mt-6 flex items-center gap-6 text-white/90">
                                <div className="flex items-center gap-2">
                                    <i className="fa-solid fa-duotone fa-star text-2xl"></i>
                                    <span className="font-semibold">4.8/5</span>
                                </div>
                                <div className="h-6 w-px bg-white/30"></div>
                                <div className="flex items-center gap-2">
                                    <i className="fa-solid fa-duotone fa-users text-2xl"></i>
                                    <span className="font-semibold">10K+ Users</span>
                                </div>
                                <div className="h-6 w-px bg-white/30"></div>
                                <div className="flex items-center gap-2">
                                    <i className="fa-solid fa-duotone fa-lock text-2xl"></i>
                                    <span className="font-semibold">Privacy First</span>
                                </div>
                            </div>
                        </div>

                        {/* Extension Screenshot/Preview */}
                        <div className="relative">
                            <div className="rounded-2xl bg-white p-4 shadow-2xl">
                                <div className="aspect-video rounded-lg bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center">
                                    <div className="text-center">
                                        <i className="fa-solid fa-duotone fa-dice text-6xl mb-4 text-purple-600"></i>
                                        <div className="text-gray-700 font-semibold">Extension Preview</div>
                                        <div className="text-sm text-gray-500">Screenshot coming soon</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Wave */}
                <div className="absolute bottom-0 left-0 right-0">
                    <svg className="w-full" viewBox="0 0 1440 120" fill="none">
                        <path d="M0,64L60,69.3C120,75,240,85,360,80C480,75,600,53,720,48C840,43,960,53,1080,58.7C1200,64,1320,64,1380,64L1440,64L1440,120L1380,120C1320,120,1200,120,1080,120C960,120,840,120,720,120C600,120,480,120,360,120C240,120,120,120,60,120L0,120Z" fill="rgb(249, 250, 251)" />
                    </svg>
                </div>
            </section>

            {/* Installation Section */}
            <section id="install" className="py-20">
                <div className="container mx-auto px-4">
                    <div className="mb-16 text-center">
                        <h2 className="mb-4 text-4xl font-bold text-gray-900">Install in Seconds</h2>
                        <p className="text-xl text-gray-600">Get started with three simple steps</p>
                    </div>

                    <div className="mx-auto max-w-4xl">
                        <div className="space-y-8">
                            {/* Step 1 */}
                            <div className="flex items-start gap-6 rounded-2xl bg-white p-8 shadow-lg">
                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-red-500 to-yellow-500 text-xl font-bold text-white">
                                    1
                                </div>
                                <div className="flex-1">
                                    <h3 className="mb-2 text-2xl font-bold text-gray-900">Add to Chrome</h3>
                                    <p className="mb-4 text-gray-600">
                                        Click the button below to visit the Chrome Web Store and install the extension with one click.
                                    </p>
                                    <a
                                        href="https://chrome.google.com/webstore"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-red-500 to-yellow-500 px-6 py-3 font-bold text-white transition-all hover:scale-105 hover:shadow-lg"
                                    >
                                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                        </svg>
                                        <span>Add to Chrome - It's Free</span>
                                    </a>
                                </div>
                            </div>

                            {/* Step 2 */}
                            <div className="flex items-start gap-6 rounded-2xl bg-white p-8 shadow-lg">
                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 text-xl font-bold text-white">
                                    2
                                </div>
                                <div className="flex-1">
                                    <h3 className="mb-2 text-2xl font-bold text-gray-900">Sign In</h3>
                                    <p className="mb-4 text-gray-600">
                                        Click the extension icon in your toolbar and sign in with your Stumbleable account. Don't have one? Create it in seconds!
                                    </p>
                                    <Link
                                        href="/sign-up"
                                        className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-6 py-3 font-bold text-white transition-all hover:bg-purple-700"
                                    >
                                        <span>Create Free Account</span>
                                        <span>→</span>
                                    </Link>
                                </div>
                            </div>

                            {/* Step 3 */}
                            <div className="flex items-start gap-6 rounded-2xl bg-white p-8 shadow-lg">
                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-emerald-500 text-xl font-bold text-white">
                                    3
                                </div>
                                <div className="flex-1">
                                    <h3 className="mb-2 text-2xl font-bold text-gray-900">Start Discovering!</h3>
                                    <p className="text-gray-600">
                                        Click the extension icon or press <kbd className="rounded bg-gray-200 px-2 py-1 font-mono text-sm">Ctrl+Shift+S</kbd> to start stumbling through amazing content!
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Development Installation */}
                        <details className="mt-8 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 p-6">
                            <summary className="cursor-pointer text-lg font-bold text-gray-900">
                                Developer? Install from Source →
                            </summary>
                            <div className="mt-4 space-y-4 text-gray-700">
                                <p>If you want to install the extension from source code:</p>
                                <ol className="list-inside list-decimal space-y-2 pl-4">
                                    <li>Clone the Stumbleable repository</li>
                                    <li>Navigate to <code className="rounded bg-gray-200 px-2 py-1 text-sm">extensions/chrome</code></li>
                                    <li>Run <code className="rounded bg-gray-200 px-2 py-1 text-sm">npm install && npm run build</code></li>
                                    <li>Open <code className="rounded bg-gray-200 px-2 py-1 text-sm">chrome://extensions/</code></li>
                                    <li>Enable "Developer mode"</li>
                                    <li>Click "Load unpacked" and select the <code className="rounded bg-gray-200 px-2 py-1 text-sm">dist</code> folder</li>
                                </ol>
                                <a href="https://github.com/wize-works/stumbleable" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-purple-600 hover:underline">
                                    <span>View on GitHub</span>
                                    <span>→</span>
                                </a>
                            </div>
                        </details>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="bg-white py-20">
                <div className="container mx-auto px-4">
                    <div className="mb-16 text-center">
                        <h2 className="mb-4 text-4xl font-bold text-gray-900">Everything You Need</h2>
                        <p className="text-xl text-gray-600">Powerful features for seamless discovery</p>
                    </div>

                    <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-2">
                        {/* Feature: Quick Stumbling */}
                        <div className="rounded-2xl bg-gradient-to-br from-purple-50 to-indigo-50 p-8">
                            <i className="fa-solid fa-duotone fa-dice text-5xl mb-4 text-purple-600"></i>
                            <h3 className="mb-3 text-2xl font-bold text-gray-900">Quick Stumbling</h3>
                            <p className="mb-4 text-gray-700">
                                Click the extension icon to open a beautiful popup with full discovery cards. See images, titles, descriptions, and topics—all without leaving your current page.
                            </p>
                            <ul className="space-y-2 text-gray-600">
                                <li className="flex items-center gap-2">
                                    <i className="fa-solid fa-duotone fa-check text-green-500"></i>
                                    <span>Beautiful popup interface</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <i className="fa-solid fa-duotone fa-check text-green-500"></i>
                                    <span>Like, skip, save, or visit</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <i className="fa-solid fa-duotone fa-check text-green-500"></i>
                                    <span>Wildness control slider</span>
                                </li>
                            </ul>
                        </div>

                        {/* Feature: Context Menu */}
                        <div className="rounded-2xl bg-gradient-to-br from-pink-50 to-rose-50 p-8">
                            <i className="fa-solid fa-duotone fa-share-from-square text-5xl mb-4 text-pink-600"></i>
                            <h3 className="mb-3 text-2xl font-bold text-gray-900">Right-Click Actions</h3>
                            <p className="mb-4 text-gray-700">
                                Right-click any page or link to quickly submit it to Stumbleable or save it to your collection. Share interesting content with the community effortlessly.
                            </p>
                            <ul className="space-y-2 text-gray-600">
                                <li className="flex items-center gap-2">
                                    <i className="fa-solid fa-duotone fa-check text-green-500"></i>
                                    <span>Submit current page</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <i className="fa-solid fa-duotone fa-check text-green-500"></i>
                                    <span>Save for later</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <i className="fa-solid fa-duotone fa-check text-green-500"></i>
                                    <span>Works on links too</span>
                                </li>
                            </ul>
                        </div>

                        {/* Feature: Keyboard Shortcuts */}
                        <div className="rounded-2xl bg-gradient-to-br from-blue-50 to-cyan-50 p-8">
                            <i className="fa-solid fa-duotone fa-keyboard text-5xl mb-4 text-blue-600"></i>
                            <h3 className="mb-3 text-2xl font-bold text-gray-900">Keyboard Shortcuts</h3>
                            <p className="mb-4 text-gray-700">
                                Navigate at the speed of thought with powerful keyboard shortcuts. Stumble, save, and submit without touching your mouse.
                            </p>
                            <div className="space-y-2">
                                <div className="flex items-center gap-3 text-sm">
                                    <kbd className="rounded bg-white px-3 py-1.5 font-mono font-bold shadow">Ctrl+Shift+S</kbd>
                                    <span className="text-gray-600">Open popup</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm">
                                    <kbd className="rounded bg-white px-3 py-1.5 font-mono font-bold shadow">Ctrl+Shift+D</kbd>
                                    <span className="text-gray-600">Save page</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm">
                                    <kbd className="rounded bg-white px-3 py-1.5 font-mono font-bold shadow">Ctrl+Shift+U</kbd>
                                    <span className="text-gray-600">Submit page</span>
                                </div>
                            </div>
                        </div>

                        {/* Feature: Preferences Sync */}
                        <div className="rounded-2xl bg-gradient-to-br from-orange-50 to-amber-50 p-8">
                            <i className="fa-solid fa-duotone fa-gear text-5xl mb-4 text-orange-600"></i>
                            <h3 className="mb-3 text-2xl font-bold text-gray-900">Seamless Sync</h3>
                            <p className="mb-4 text-gray-700">
                                Your wildness preference and settings sync automatically across all your devices. Pick up where you left off, anywhere.
                            </p>
                            <ul className="space-y-2 text-gray-600">
                                <li className="flex items-center gap-2">
                                    <i className="fa-solid fa-duotone fa-check text-green-500"></i>
                                    <span>Chrome Sync Storage</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <i className="fa-solid fa-duotone fa-check text-green-500"></i>
                                    <span>Real-time updates</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <i className="fa-solid fa-duotone fa-check text-green-500"></i>
                                    <span>Cross-device continuity</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* Keyboard Shortcuts Reference */}
            <section className="bg-gradient-to-br from-gray-900 to-gray-800 py-20 text-white">
                <div className="container mx-auto px-4">
                    <div className="mb-12 text-center">
                        <h2 className="mb-4 text-4xl font-bold">Complete Keyboard Reference</h2>
                        <p className="text-xl text-gray-300">Master these shortcuts to become a power user</p>
                    </div>

                    <div className="mx-auto max-w-5xl">
                        <div className="mb-8 rounded-xl bg-white/10 p-6 backdrop-blur-sm">
                            <h3 className="mb-4 text-xl font-bold">Global Shortcuts (work anywhere)</h3>
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="flex items-center justify-between rounded-lg bg-gray-800 p-4">
                                    <span className="text-gray-200">Open stumble popup</span>
                                    <kbd className="rounded bg-gray-700 px-4 py-2 font-mono text-sm font-bold">Ctrl + Shift + S</kbd>
                                </div>
                                <div className="flex items-center justify-between rounded-lg bg-gray-800 p-4">
                                    <span className="text-gray-200">Save current page</span>
                                    <kbd className="rounded bg-gray-700 px-4 py-2 font-mono text-sm font-bold">Ctrl + Shift + D</kbd>
                                </div>
                                <div className="flex items-center justify-between rounded-lg bg-gray-800 p-4">
                                    <span className="text-gray-200">Submit current page</span>
                                    <kbd className="rounded bg-gray-700 px-4 py-2 font-mono text-sm font-bold">Ctrl + Shift + U</kbd>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-xl bg-white/10 p-6 backdrop-blur-sm">
                            <h3 className="mb-4 text-xl font-bold">Popup Shortcuts (when popup is open)</h3>
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="flex items-center justify-between rounded-lg bg-gray-800 p-4">
                                    <span className="text-gray-200">Next stumble</span>
                                    <kbd className="rounded bg-gray-700 px-4 py-2 font-mono text-sm font-bold">Space / Enter</kbd>
                                </div>
                                <div className="flex items-center justify-between rounded-lg bg-gray-800 p-4">
                                    <span className="text-gray-200">Like discovery</span>
                                    <kbd className="rounded bg-gray-700 px-4 py-2 font-mono text-sm font-bold">↑</kbd>
                                </div>
                                <div className="flex items-center justify-between rounded-lg bg-gray-800 p-4">
                                    <span className="text-gray-200">Skip discovery</span>
                                    <kbd className="rounded bg-gray-700 px-4 py-2 font-mono text-sm font-bold">↓</kbd>
                                </div>
                                <div className="flex items-center justify-between rounded-lg bg-gray-800 p-4">
                                    <span className="text-gray-200">Save discovery</span>
                                    <kbd className="rounded bg-gray-700 px-4 py-2 font-mono text-sm font-bold">S</kbd>
                                </div>
                                <div className="flex items-center justify-between rounded-lg bg-gray-800 p-4">
                                    <span className="text-gray-200">Visit page</span>
                                    <kbd className="rounded bg-gray-700 px-4 py-2 font-mono text-sm font-bold">V</kbd>
                                </div>
                            </div>
                        </div>

                        <p className="mt-6 text-center text-sm text-gray-400">
                            <i className="fa-solid fa-duotone fa-lightbulb"></i> On Mac, use ⌘ (Command) instead of Ctrl • Customize shortcuts at chrome://extensions/shortcuts
                        </p>
                    </div>
                </div>
            </section>

            {/* Privacy Section */}
            <section className="py-20">
                <div className="container mx-auto px-4">
                    <div className="mx-auto max-w-4xl text-center">
                        <i className="fa-solid fa-duotone fa-lock text-6xl mb-6 text-green-600"></i>
                        <h2 className="mb-4 text-4xl font-bold text-gray-900">Your Privacy Matters</h2>
                        <p className="mb-8 text-xl text-gray-600">
                            We believe in building extensions the right way—with respect for your privacy and data.
                        </p>

                        <div className="grid gap-6 text-left md:grid-cols-3">
                            <div className="rounded-xl bg-white p-6 shadow-lg">
                                <i className="fa-solid fa-duotone fa-ban text-3xl mb-3 text-red-600"></i>
                                <h3 className="mb-2 font-bold text-gray-900">No Tracking</h3>
                                <p className="text-sm text-gray-600">
                                    We don't track your browsing history or monitor what pages you visit.
                                </p>
                            </div>
                            <div className="rounded-xl bg-white p-6 shadow-lg">
                                <i className="fa-solid fa-duotone fa-chart-simple text-3xl mb-3 text-blue-600"></i>
                                <h3 className="mb-2 font-bold text-gray-900">Minimal Data</h3>
                                <p className="text-sm text-gray-600">
                                    We only store your preferences and authentication—nothing more.
                                </p>
                            </div>
                            <div className="rounded-xl bg-white p-6 shadow-lg">
                                <i className="fa-solid fa-duotone fa-check-circle text-3xl mb-3 text-green-600"></i>
                                <h3 className="mb-2 font-bold text-gray-900">Open Source</h3>
                                <p className="text-sm text-gray-600">
                                    All our code is open source. You can audit exactly what we're doing.
                                </p>
                            </div>
                        </div>

                        <div className="mt-8">
                            <Link href="/privacy" className="text-purple-600 hover:underline">
                                Read our full Privacy Policy →
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Support Section */}
            <section className="bg-gray-50 py-20">
                <div className="container mx-auto px-4">
                    <div className="mx-auto max-w-4xl">
                        <h2 className="mb-12 text-center text-4xl font-bold text-gray-900">Need Help?</h2>

                        <div className="grid gap-8 md:grid-cols-2">
                            <div className="rounded-xl bg-white p-6 shadow-lg">
                                <h3 className="mb-4 text-xl font-bold text-gray-900">Common Issues</h3>
                                <ul className="space-y-3 text-gray-700">
                                    <li>
                                        <strong>Extension not working?</strong>
                                        <p className="text-sm text-gray-600">Make sure you're signed in to your Stumbleable account.</p>
                                    </li>
                                    <li>
                                        <strong>Shortcuts not responding?</strong>
                                        <p className="text-sm text-gray-600">Check for conflicts at chrome://extensions/shortcuts</p>
                                    </li>
                                    <li>
                                        <strong>API errors?</strong>
                                        <p className="text-sm text-gray-600">Verify your network connection and try refreshing.</p>
                                    </li>
                                </ul>
                            </div>

                            <div className="rounded-xl bg-white p-6 shadow-lg">
                                <h3 className="mb-4 text-xl font-bold text-gray-900">Get Support</h3>
                                <div className="space-y-4">
                                    <Link href="/faq" className="flex items-center gap-2 text-purple-600 hover:underline">
                                        <i className="fa-solid fa-duotone fa-book"></i>
                                        <span>View Full FAQ</span>
                                    </Link>
                                    <Link href="/contact" className="flex items-center gap-2 text-purple-600 hover:underline">
                                        <i className="fa-solid fa-duotone fa-envelope"></i>
                                        <span>Contact Support</span>
                                    </Link>
                                    <a href="https://github.com/wize-works/stumbleable/issues" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-purple-600 hover:underline">
                                        <i className="fa-solid fa-duotone fa-bug"></i>
                                        <span>Report a Bug</span>
                                    </a>
                                    <a href="https://github.com/wize-works/stumbleable" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-purple-600 hover:underline">
                                        <i className="fa-solid fa-duotone fa-code"></i>
                                        <span>View Source Code</span>
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="relative overflow-hidden bg-gradient-to-br from-red-500 via-yellow-500 to-red-600 py-20">
                <div className="absolute inset-0 bg-grid-white/10"></div>
                <div className="container relative mx-auto px-4 text-center">
                    <h2 className="mb-6 text-4xl font-bold text-white sm:text-5xl">
                        Ready to Discover?
                    </h2>
                    <p className="mb-10 text-xl text-white/90">
                        Join thousands of users exploring the web with Stumbleable
                    </p>
                    <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                        <a
                            href="https://chrome.google.com/webstore"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex w-full items-center justify-center gap-3 rounded-xl bg-white px-8 py-4 text-lg font-bold text-red-600 shadow-xl transition-all hover:scale-105 hover:shadow-2xl sm:w-auto"
                        >
                            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            <span>Install Chrome Extension</span>
                        </a>
                        <Link
                            href="/extensions"
                            className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-white/30 bg-white/10 px-8 py-4 text-lg font-bold text-white backdrop-blur-sm transition-all hover:bg-white/20 sm:w-auto"
                        >
                            <span>View All Extensions</span>
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
}
