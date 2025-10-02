import Link from 'next/link';

export default function PressPage() {
    return (
        <div className="min-h-screen bg-base-100 py-20 px-4">
            <div className="container mx-auto max-w-5xl">
                {/* Header */}
                <div className="text-center mb-16">
                    <h1 className="text-4xl sm:text-5xl font-bold text-base-content mb-4">
                        Press Kit
                    </h1>
                    <p className="text-xl text-base-content/70 max-w-2xl mx-auto">
                        Resources for media, bloggers, and content creators covering Stumbleable
                    </p>
                </div>

                {/* Quick Info */}
                <div className="card bg-gradient-to-br from-primary/10 to-secondary/10 shadow-xl mb-12">
                    <div className="card-body">
                        <h2 className="card-title text-2xl mb-4">About Stumbleable</h2>
                        <p className="text-base-content/80 leading-relaxed mb-4">
                            Stumbleable is a modern content discovery platform that brings back the joy of serendipitous exploration
                            to the internet. Unlike algorithm-driven feeds, Stumbleable offers users a curated journey through diverse,
                            high-quality content with just one click.
                        </p>
                        <div className="stats stats-vertical md:stats-horizontal shadow mt-4">
                            <div className="stat">
                                <div className="stat-title">Founded</div>
                                <div className="stat-value text-primary">2025</div>
                            </div>
                            <div className="stat">
                                <div className="stat-title">Mission</div>
                                <div className="stat-value text-2xl">Rediscovery</div>
                            </div>
                            <div className="stat">
                                <div className="stat-title">Approach</div>
                                <div className="stat-value text-2xl">Human-First</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Downloads */}
                <div className="grid md:grid-cols-2 gap-6 mb-12">
                    <div className="card bg-base-200 shadow-lg">
                        <div className="card-body">
                            <h3 className="card-title">
                                <i className="fa-solid fa-duotone fa-image text-primary"></i>
                                Brand Assets
                            </h3>
                            <p className="text-sm text-base-content/70 mb-4">
                                Logos, icons, and brand colors in various formats
                            </p>
                            <div className="card-actions">
                                <button className="btn btn-primary btn-sm">
                                    <i className="fa-solid fa-duotone fa-download mr-2"></i>
                                    Download ZIP
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="card bg-base-200 shadow-lg">
                        <div className="card-body">
                            <h3 className="card-title">
                                <i className="fa-solid fa-duotone fa-file-pdf text-secondary"></i>
                                Media Kit
                            </h3>
                            <p className="text-sm text-base-content/70 mb-4">
                                Comprehensive information and screenshots
                            </p>
                            <div className="card-actions">
                                <button className="btn btn-secondary btn-sm">
                                    <i className="fa-solid fa-duotone fa-download mr-2"></i>
                                    Download PDF
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Key Features */}
                <div className="mb-12">
                    <h2 className="text-3xl font-bold text-base-content mb-6">Key Features</h2>
                    <div className="grid md:grid-cols-2 gap-4">
                        {[
                            { title: 'One-Click Discovery', desc: 'Instant access to curated content' },
                            { title: 'Wildness Control', desc: 'Users tune their adventure level' },
                            { title: 'Community Lists', desc: 'Shareable discovery trails' },
                            { title: 'Algorithm-Free', desc: 'Pure serendipity, no manipulation' },
                        ].map((feature, i) => (
                            <div key={i} className="flex items-start gap-3 p-4 bg-base-200 rounded-lg">
                                <i className="fa-solid fa-duotone fa-check-circle text-success text-xl mt-1"></i>
                                <div>
                                    <h4 className="font-semibold text-base-content">{feature.title}</h4>
                                    <p className="text-sm text-base-content/70">{feature.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Contact */}
                <div className="card bg-base-200 shadow-xl">
                    <div className="card-body">
                        <h2 className="card-title text-2xl mb-4">Media Inquiries</h2>
                        <p className="text-base-content/80 mb-6">
                            For interviews, press releases, or additional information, please contact our media team.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <a href="mailto:press@stumbleable.com" className="btn btn-primary">
                                <i className="fa-solid fa-duotone fa-envelope mr-2"></i>
                                press@stumbleable.com
                            </a>
                            <Link href="/contact" className="btn btn-outline">
                                <i className="fa-solid fa-duotone fa-message mr-2"></i>
                                Contact Form
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
