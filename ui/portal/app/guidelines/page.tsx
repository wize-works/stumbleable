export default function GuidelinesPage() {
    return (
        <div className="min-h-screen bg-base-100 py-20 px-4">
            <div className="container mx-auto max-w-4xl">
                <h1 className="text-4xl sm:text-5xl font-bold text-base-content mb-4">
                    Community Guidelines
                </h1>
                <p className="text-sm text-base-content/60 mb-12">
                    Last updated: October 1, 2025
                </p>

                <div className="alert alert-info mb-8">
                    <i className="fa-solid fa-heart text-2xl"></i>
                    <div>
                        <h3 className="font-bold">Our Mission</h3>
                        <div className="text-sm">
                            Stumbleable exists to foster discovery, curiosity, and meaningful connections. These guidelines help
                            ensure our community remains welcoming, safe, and inspiring for everyone.
                        </div>
                    </div>
                </div>

                <div className="prose prose-lg max-w-none">
                    <div className="space-y-8">
                        <section>
                            <h2 className="text-2xl font-bold text-base-content mb-4">Core Values</h2>
                            <div className="grid md:grid-cols-2 gap-4 mb-4">
                                <div className="card bg-base-200">
                                    <div className="card-body">
                                        <h3 className="card-title text-lg">
                                            <i className="fa-solid fa-users text-primary"></i>
                                            Respect
                                        </h3>
                                        <p className="text-sm">Treat everyone with kindness and dignity</p>
                                    </div>
                                </div>
                                <div className="card bg-base-200">
                                    <div className="card-body">
                                        <h3 className="card-title text-lg">
                                            <i className="fa-solid fa-sparkles text-secondary"></i>
                                            Curiosity
                                        </h3>
                                        <p className="text-sm">Embrace diverse perspectives and ideas</p>
                                    </div>
                                </div>
                                <div className="card bg-base-200">
                                    <div className="card-body">
                                        <h3 className="card-title text-lg">
                                            <i className="fa-solid fa-shield-check text-accent"></i>
                                            Authenticity
                                        </h3>
                                        <p className="text-sm">Share genuine, quality content</p>
                                    </div>
                                </div>
                                <div className="card bg-base-200">
                                    <div className="card-body">
                                        <h3 className="card-title text-lg">
                                            <i className="fa-solid fa-hands-helping text-success"></i>
                                            Collaboration
                                        </h3>
                                        <p className="text-sm">Build and share together</p>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-base-content mb-4">What We Encourage</h2>
                            <ul className="space-y-3">
                                <li className="flex items-start gap-3">
                                    <i className="fa-solid fa-check-circle text-success text-xl mt-1"></i>
                                    <div>
                                        <strong>Quality Content:</strong> Share interesting, informative, and engaging discoveries
                                    </div>
                                </li>
                                <li className="flex items-start gap-3">
                                    <i className="fa-solid fa-check-circle text-success text-xl mt-1"></i>
                                    <div>
                                        <strong>Thoughtful Curation:</strong> Create lists that tell a story or explore a theme
                                    </div>
                                </li>
                                <li className="flex items-start gap-3">
                                    <i className="fa-solid fa-check-circle text-success text-xl mt-1"></i>
                                    <div>
                                        <strong>Constructive Feedback:</strong> Help improve the community through reporting and suggestions
                                    </div>
                                </li>
                                <li className="flex items-start gap-3">
                                    <i className="fa-solid fa-check-circle text-success text-xl mt-1"></i>
                                    <div>
                                        <strong>Diverse Perspectives:</strong> Share content from various sources and viewpoints
                                    </div>
                                </li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-base-content mb-4">What We Don't Allow</h2>
                            <div className="space-y-4">
                                <div className="alert alert-error">
                                    <i className="fa-solid fa-ban"></i>
                                    <div>
                                        <h4 className="font-bold">Hate Speech & Harassment</h4>
                                        <p className="text-sm">Content that attacks or demeans individuals or groups based on identity</p>
                                    </div>
                                </div>

                                <div className="alert alert-error">
                                    <i className="fa-solid fa-ban"></i>
                                    <div>
                                        <h4 className="font-bold">Violence & Harmful Content</h4>
                                        <p className="text-sm">Content promoting violence, self-harm, or dangerous activities</p>
                                    </div>
                                </div>

                                <div className="alert alert-error">
                                    <i className="fa-solid fa-ban"></i>
                                    <div>
                                        <h4 className="font-bold">Spam & Manipulation</h4>
                                        <p className="text-sm">Artificially inflating engagement, repetitive content, or misleading links</p>
                                    </div>
                                </div>

                                <div className="alert alert-error">
                                    <i className="fa-solid fa-ban"></i>
                                    <div>
                                        <h4 className="font-bold">Illegal Content</h4>
                                        <p className="text-sm">Content that violates laws or promotes illegal activities</p>
                                    </div>
                                </div>

                                <div className="alert alert-error">
                                    <i className="fa-solid fa-ban"></i>
                                    <div>
                                        <h4 className="font-bold">Adult Content</h4>
                                        <p className="text-sm">Sexually explicit material or content not suitable for all ages</p>
                                    </div>
                                </div>

                                <div className="alert alert-error">
                                    <i className="fa-solid fa-ban"></i>
                                    <div>
                                        <h4 className="font-bold">Misinformation</h4>
                                        <p className="text-sm">Deliberately false or misleading information, especially on health or safety topics</p>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-base-content mb-4">Content Submission Guidelines</h2>
                            <p className="text-base-content/80 leading-relaxed mb-4">
                                When submitting content to Stumbleable:
                            </p>
                            <ul className="list-disc list-inside space-y-2 text-base-content/80">
                                <li>Ensure you have the right to share the content</li>
                                <li>Provide accurate titles and descriptions</li>
                                <li>Tag content appropriately with relevant topics</li>
                                <li>Link to original sources when possible</li>
                                <li>Avoid duplicate submissions</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-base-content mb-4">Reporting Content</h2>
                            <p className="text-base-content/80 leading-relaxed mb-4">
                                If you encounter content that violates these guidelines:
                            </p>
                            <ol className="list-decimal list-inside space-y-2 text-base-content/80">
                                <li>Use the report button on the content</li>
                                <li>Select the appropriate violation category</li>
                                <li>Provide additional context if helpful</li>
                                <li>Our moderation team will review within 24 hours</li>
                            </ol>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-base-content mb-4">Enforcement</h2>
                            <p className="text-base-content/80 leading-relaxed mb-4">
                                Violations of these guidelines may result in:
                            </p>
                            <ul className="list-disc list-inside space-y-2 text-base-content/80">
                                <li>Content removal</li>
                                <li>Warning notifications</li>
                                <li>Temporary account suspension</li>
                                <li>Permanent account termination (for severe or repeated violations)</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-base-content mb-4">Appeals</h2>
                            <p className="text-base-content/80 leading-relaxed">
                                If you believe a moderation decision was made in error, you can appeal by contacting:{' '}
                                <a href="mailto:moderation@stumbleable.com" className="link link-primary">
                                    moderation@stumbleable.com
                                </a>
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-base-content mb-4">Questions?</h2>
                            <p className="text-base-content/80 leading-relaxed">
                                For clarification on these guidelines, contact:{' '}
                                <a href="mailto:community@stumbleable.com" className="link link-primary">
                                    community@stumbleable.com
                                </a>
                            </p>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
}
