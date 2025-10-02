export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-base-100 py-20 px-4">
            <div className="container mx-auto max-w-4xl">
                <h1 className="text-4xl sm:text-5xl font-bold text-base-content mb-4">
                    Privacy Policy
                </h1>
                <p className="text-sm text-base-content/60 mb-12">
                    Last updated: October 1, 2025
                </p>

                <div className="prose prose-lg max-w-none">
                    <div className="space-y-8">
                        <section>
                            <h2 className="text-2xl font-bold text-base-content mb-4">Introduction</h2>
                            <p className="text-base-content/80 leading-relaxed">
                                At Stumbleable, we take your privacy seriously. This Privacy Policy explains how we collect, use,
                                disclose, and safeguard your information when you use our service.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-base-content mb-4">Information We Collect</h2>
                            <h3 className="text-xl font-semibold text-base-content mb-3">Personal Information</h3>
                            <p className="text-base-content/80 leading-relaxed mb-4">
                                When you create an account, we collect:
                            </p>
                            <ul className="list-disc list-inside space-y-2 text-base-content/80 mb-4">
                                <li>Email address</li>
                                <li>Username</li>
                                <li>Profile information (optional)</li>
                            </ul>

                            <h3 className="text-xl font-semibold text-base-content mb-3">Usage Information</h3>
                            <p className="text-base-content/80 leading-relaxed">
                                We collect information about how you interact with Stumbleable, including:
                            </p>
                            <ul className="list-disc list-inside space-y-2 text-base-content/80">
                                <li>Content you discover and interact with</li>
                                <li>Your wildness preferences</li>
                                <li>Saved items and lists</li>
                                <li>Browsing patterns and timestamps</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-base-content mb-4">How We Use Your Information</h2>
                            <p className="text-base-content/80 leading-relaxed mb-4">
                                We use the information we collect to:
                            </p>
                            <ul className="list-disc list-inside space-y-2 text-base-content/80">
                                <li>Provide and improve our discovery service</li>
                                <li>Personalize your content recommendations</li>
                                <li>Communicate with you about updates and features</li>
                                <li>Ensure platform safety and security</li>
                                <li>Analyze usage patterns to enhance user experience</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-base-content mb-4">Data Sharing and Disclosure</h2>
                            <p className="text-base-content/80 leading-relaxed">
                                We do not sell your personal information. We may share your information only in the following circumstances:
                            </p>
                            <ul className="list-disc list-inside space-y-2 text-base-content/80">
                                <li>With your consent</li>
                                <li>To comply with legal obligations</li>
                                <li>To protect our rights and prevent fraud</li>
                                <li>With service providers who assist in operating our platform</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-base-content mb-4">Your Rights</h2>
                            <p className="text-base-content/80 leading-relaxed mb-4">
                                You have the right to:
                            </p>
                            <ul className="list-disc list-inside space-y-2 text-base-content/80">
                                <li>Access your personal data</li>
                                <li>Request correction of inaccurate data</li>
                                <li>Request deletion of your account and data</li>
                                <li>Opt-out of marketing communications</li>
                                <li>Export your data</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-base-content mb-4">Data Security</h2>
                            <p className="text-base-content/80 leading-relaxed">
                                We implement appropriate technical and organizational measures to protect your data against unauthorized
                                access, alteration, disclosure, or destruction.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-base-content mb-4">Contact Us</h2>
                            <p className="text-base-content/80 leading-relaxed">
                                If you have questions about this Privacy Policy, please contact us at:{' '}
                                <a href="mailto:privacy@stumbleable.com" className="link link-primary">
                                    privacy@stumbleable.com
                                </a>
                            </p>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
}
