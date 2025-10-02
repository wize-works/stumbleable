import Link from 'next/link';

export default function Home() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-base-100 to-base-200">
            <div className="container mx-auto px-4 py-20">
                <div className="max-w-4xl mx-auto text-center">
                    {/* Hero Section */}
                    <div className="mb-12">
                        <h1 className="text-5xl sm:text-6xl font-bold text-base-content mb-6">
                            Stumbleable
                        </h1>
                        <p className="text-xl sm:text-2xl text-base-content/80 mb-8 leading-relaxed">
                            One button. Curated randomness.<br />
                            Human taste + AI vibes.
                        </p>
                        <p className="text-lg text-base-content/60 mb-12 max-w-2xl mx-auto">
                            Rediscover the joy of serendipity. Each click takes you somewhere
                            new, interesting, and completely unexpected. No infinite scroll,
                            no algorithm fatigue—just pure discovery.
                        </p>
                    </div>

                    {/* CTA */}
                    <div className="mb-16">
                        <Link
                            href="/stumble"
                            className="btn btn-primary btn-lg text-xl px-12 py-4 h-auto min-h-0 shadow-xl hover:shadow-2xl transition-all duration-200 transform hover:scale-105"
                        >
                            Start Stumbling
                        </Link>
                    </div>

                    {/* Features */}
                    <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
                        <div className="card bg-base-100 shadow-lg">
                            <div className="card-body text-center">
                                <div className="text-4xl mb-4">
                                    <i className="fa-solid fa-duotone fa-bullseye"></i>
                                </div>
                                <h3 className="text-lg font-semibold mb-2">Curated Discovery</h3>
                                <p className="text-base-content/70 text-sm">
                                    Quality content from across the web, filtered for relevance and interest.
                                </p>
                            </div>
                        </div>

                        <div className="card bg-base-100 shadow-lg">
                            <div className="card-body text-center">
                                <div className="text-4xl mb-4">
                                    <i className="fa-solid fa-duotone fa-dice"></i>
                                </div>
                                <h3 className="text-lg font-semibold mb-2">Controlled Chaos</h3>
                                <p className="text-base-content/70 text-sm">
                                    Adjust your wildness level to balance familiar interests with surprising discoveries.
                                </p>
                            </div>
                        </div>

                        <div className="card bg-base-100 shadow-lg">
                            <div className="card-body text-center">
                                <div className="text-4xl mb-4">
                                    <i className="fa-solid fa-duotone fa-bolt"></i>
                                </div>
                                <h3 className="text-lg font-semibold mb-2">Lightning Fast</h3>
                                <p className="text-base-content/70 text-sm">
                                    One button, keyboard shortcuts, and instant reactions. No friction, just flow.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}