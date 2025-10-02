export default function AboutPage() {
    return (
        <div className="min-h-screen bg-base-100">
            <div className="container mx-auto px-4 py-12">
                <div className="max-w-3xl mx-auto prose prose-lg">
                    <h1 className="text-4xl font-bold text-center mb-8 text-base-content">
                        About Stumbleable
                    </h1>

                    <div className="text-lg text-base-content/80 space-y-6">
                        <p>
                            Remember the magic of StumbleUpon? That pure joy of hitting a button
                            and discovering something completely unexpected? We do too.
                        </p>

                        <p>
                            <strong>Stumbleable</strong> brings back that serendipitous discovery experience
                            for the modern web. One button. Curated randomness. Human taste meets AI vibes.
                        </p>

                        <h2 className="text-2xl font-bold text-base-content mt-8 mb-4">
                            How It Works
                        </h2>

                        <p>
                            We use a simple but effective algorithm that balances your interests
                            with controlled randomness:
                        </p>

                        <ul className="list-disc list-inside space-y-2 text-base-content/70">
                            <li>
                                <strong>Quality scoring:</strong> Every discovery is rated for depth,
                                uniqueness, and craft
                            </li>
                            <li>
                                <strong>Freshness decay:</strong> Recent content gets a boost, but
                                timeless pieces remain discoverable
                            </li>
                            <li>
                                <strong>Interest matching:</strong> We learn your preferences from
                                your reactions and saved items
                            </li>
                            <li>
                                <strong>Wildness control:</strong> Dial up the chaos to venture into
                                completely unfamiliar territory
                            </li>
                        </ul>

                        <h2 className="text-2xl font-bold text-base-content mt-8 mb-4">
                            The Philosophy
                        </h2>

                        <p>
                            In an age of endless feeds and algorithmic echo chambers, we believe
                            in the power of intentional discovery. Each stumble is a conscious
                            choice to explore, to be surprised, to learn something new.
                        </p>

                        <p>
                            We&apos;re not trying to maximize your time on platform. We&apos;re trying to
                            maximize the quality of your discoveries. Find something amazing,
                            explore it deeply, then come back when you&apos;re ready for the next adventure.
                        </p>

                        <h2 className="text-2xl font-bold text-base-content mt-8 mb-4">
                            Privacy & Data
                        </h2>

                        <p>
                            Your discovery patterns are yours. We store your preferences locally
                            and use them only to improve your future discoveries. No tracking,
                            no selling your data, no dark patterns.
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
    );
}