export default function FeaturesPage() {
    return (
        <div className="min-h-screen bg-base-100">
            {/* Hero Section */}
            <section className="relative py-20 px-4 overflow-hidden">
                {/* Animated Background */}
                <div className="absolute inset-0 -z-10">
                    <div className="absolute top-20 left-10 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse"></div>
                    <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
                </div>

                <div className="max-w-6xl mx-auto text-center">
                    <h1 className="text-5xl md:text-6xl font-bold text-base-content mb-6">
                        Powerful Features for
                        <span className="text-primary"> Endless Discovery</span>
                    </h1>
                    <p className="text-xl text-base-content/70 max-w-3xl mx-auto">
                        Stumbleable combines intelligent algorithms with human curation to deliver
                        the most engaging content discovery experience on the web.
                    </p>
                </div>
            </section>

            {/* Core Features */}
            <section className="py-16 px-4 bg-base-200">
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-4xl font-bold text-center text-base-content mb-16">
                        Core Features
                    </h2>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {/* Feature 1 */}
                        <div className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow">
                            <div className="card-body">
                                <i className="fa-solid fa-duotone fa-bullseye text-4xl text-primary mb-4"></i>
                                <h3 className="card-title text-primary">Smart Discovery</h3>
                                <p className="text-base-content/70">
                                    Our algorithm learns from your reactions to show you content that matches
                                    your interests while introducing delightful surprises.
                                </p>
                            </div>
                        </div>

                        {/* Feature 2 */}
                        <div className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow">
                            <div className="card-body">
                                <i className="fa-solid fa-duotone fa-sliders text-4xl text-secondary mb-4"></i>
                                <h3 className="card-title text-secondary">Wildness Control</h3>
                                <p className="text-base-content/70">
                                    Tune how adventurous your discoveries are. Stay in your comfort zone
                                    or venture into completely new territories.
                                </p>
                            </div>
                        </div>

                        {/* Feature 3 */}
                        <div className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow">
                            <div className="card-body">
                                <i className="fa-solid fa-duotone fa-bolt text-4xl text-accent mb-4"></i>
                                <h3 className="card-title text-accent">Instant Reactions</h3>
                                <p className="text-base-content/70">
                                    Like, skip, save, or share with a single click or keyboard shortcut.
                                    Lightning-fast feedback loop keeps the discoveries flowing.
                                </p>
                            </div>
                        </div>

                        {/* Feature 4 */}
                        <div className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow">
                            <div className="card-body">
                                <i className="fa-solid fa-duotone fa-books text-4xl text-primary mb-4"></i>
                                <h3 className="card-title text-primary">Personal Library</h3>
                                <p className="text-base-content/70">
                                    Save your favorite discoveries to revisit later. Organize and curate
                                    your own collection of amazing content.
                                </p>
                            </div>
                        </div>

                        {/* Feature 5 */}
                        <div className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow">
                            <div className="card-body">
                                <i className="fa-solid fa-duotone fa-palette text-4xl text-secondary mb-4"></i>
                                <h3 className="card-title text-secondary">Topic Interests</h3>
                                <p className="text-base-content/70">
                                    Choose from dozens of topics like Technology, Art, Science, Gaming,
                                    and more to customize your discovery feed.
                                </p>
                            </div>
                        </div>

                        {/* Feature 6 */}
                        <div className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow">
                            <div className="card-body">
                                <i className="fa-solid fa-duotone fa-globe text-4xl text-accent mb-4"></i>
                                <h3 className="card-title text-accent">Community Lists</h3>
                                <p className="text-base-content/70">
                                    Explore curated lists from other users or create your own to share
                                    your favorite discoveries with the community.
                                </p>
                            </div>
                        </div>

                        {/* Feature 7 */}
                        <div className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow">
                            <div className="card-body">
                                <i className="fa-solid fa-duotone fa-keyboard text-4xl text-primary mb-4"></i>
                                <h3 className="card-title text-primary">Keyboard Shortcuts</h3>
                                <p className="text-base-content/70">
                                    Power users rejoice! Navigate and react with keyboard shortcuts.
                                    Space to stumble, arrows to react, S to save.
                                </p>
                            </div>
                        </div>

                        {/* Feature 8 */}
                        <div className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow">
                            <div className="card-body">
                                <i className="fa-solid fa-duotone fa-chart-line text-4xl text-secondary mb-4"></i>
                                <h3 className="card-title text-secondary">Discovery Analytics</h3>
                                <p className="text-base-content/70">
                                    Track your discovery journey with insights into your interests,
                                    most-liked topics, and exploration patterns.
                                </p>
                            </div>
                        </div>

                        {/* Feature 9 */}
                        <div className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow">
                            <div className="card-body">
                                <i className="fa-solid fa-duotone fa-sparkles text-4xl text-accent mb-4"></i>
                                <h3 className="card-title text-accent">Quality Content</h3>
                                <p className="text-base-content/70">
                                    Human-curated and community-moderated content ensures you discover
                                    the best the web has to offer, not clickbait.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Advanced Features */}
            <section className="py-16 px-4">
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-4xl font-bold text-center text-base-content mb-4">
                        Advanced Capabilities
                    </h2>
                    <p className="text-center text-base-content/70 mb-16 max-w-2xl mx-auto">
                        Take your discovery experience to the next level with these powerful tools
                    </p>

                    <div className="grid md:grid-cols-2 gap-12">
                        {/* Content Submission */}
                        <div className="flex gap-6">
                            <i className="fa-solid fa-duotone fa-pen-to-square text-5xl text-primary"></i>
                            <div>
                                <h3 className="text-2xl font-bold text-primary mb-3">Submit Content</h3>
                                <p className="text-base-content/70 mb-4">
                                    Found something amazing? Share it with the community! Submit websites,
                                    articles, videos, and more for others to discover.
                                </p>
                                <ul className="space-y-2 text-sm text-base-content/60">
                                    <li className="flex items-center gap-2">
                                        <i className="fa-solid fa-duotone fa-check text-primary"></i> Automatic metadata extraction
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <i className="fa-solid fa-duotone fa-check text-primary"></i> Content moderation for quality
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <i className="fa-solid fa-duotone fa-check text-primary"></i> Get credit for great submissions
                                    </li>
                                </ul>
                            </div>
                        </div>

                        {/* Content Filtering */}
                        <div className="flex gap-6">
                            <i className="fa-solid fa-duotone fa-filter text-5xl text-secondary"></i>
                            <div>
                                <h3 className="text-2xl font-bold text-secondary mb-3">Smart Filtering</h3>
                                <p className="text-base-content/70 mb-4">
                                    Never see the same content twice. Our system tracks what you've seen
                                    and intelligently filters your feed in real-time.
                                </p>
                                <ul className="space-y-2 text-sm text-base-content/60">
                                    <li className="flex items-center gap-2">
                                        <i className="fa-solid fa-duotone fa-check text-secondary"></i> Automatic duplicate detection
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <i className="fa-solid fa-duotone fa-check text-secondary"></i> Domain-level filtering
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <i className="fa-solid fa-duotone fa-check text-secondary"></i> Respect your skip preferences
                                    </li>
                                </ul>
                            </div>
                        </div>

                        {/* Social Features */}
                        <div className="flex gap-6">
                            <i className="fa-solid fa-duotone fa-users text-5xl text-accent"></i>
                            <div>
                                <h3 className="text-2xl font-bold text-accent mb-3">Social Discovery</h3>
                                <p className="text-base-content/70 mb-4">
                                    Share your favorite discoveries with friends, collaborate on lists,
                                    and see what the community is excited about.
                                </p>
                                <ul className="space-y-2 text-sm text-base-content/60">
                                    <li className="flex items-center gap-2">
                                        <i className="fa-solid fa-duotone fa-check text-accent"></i> Share to social media
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <i className="fa-solid fa-duotone fa-check text-accent"></i> Collaborative lists
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <i className="fa-solid fa-duotone fa-check text-accent"></i> Follow other curators
                                    </li>
                                </ul>
                            </div>
                        </div>

                        {/* Cross-Platform */}
                        <div className="flex gap-6">
                            <i className="fa-solid fa-duotone fa-mobile text-5xl text-primary"></i>
                            <div>
                                <h3 className="text-2xl font-bold text-primary mb-3">Everywhere You Are</h3>
                                <p className="text-base-content/70 mb-4">
                                    Seamless experience across all your devices. Start on desktop,
                                    continue on mobile, pick up where you left off.
                                </p>
                                <ul className="space-y-2 text-sm text-base-content/60">
                                    <li className="flex items-center gap-2">
                                        <i className="fa-solid fa-duotone fa-check text-primary"></i> Responsive web design
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <i className="fa-solid fa-duotone fa-check text-primary"></i> Touch-friendly mobile UI
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <i className="fa-solid fa-duotone fa-check text-primary"></i> Sync across devices
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 px-4 bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-4xl md:text-5xl font-bold text-base-content mb-6">
                        Ready to Start Discovering?
                    </h2>
                    <p className="text-xl text-base-content/70 mb-8">
                        Join thousands of curious minds exploring the best content on the web.
                    </p>
                    <div className="flex gap-4 justify-center flex-wrap">
                        <a href="/sign-up" className="btn btn-primary btn-lg">
                            <i className="fa-solid fa-duotone fa-rocket mr-2"></i>
                            Get Started Free
                        </a>
                        <a href="/explore" className="btn btn-outline btn-lg">
                            <i className="fa-solid fa-duotone fa-compass mr-2"></i>
                            Explore Trending
                        </a>
                    </div>
                </div>
            </section>
        </div>
    );
}
