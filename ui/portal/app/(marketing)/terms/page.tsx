export default function TermsPage() {
    return (
        <div className="min-h-screen bg-base-100 py-20 px-4">
            <div className="container mx-auto max-w-4xl">
                <h1 className="text-4xl sm:text-5xl font-bold text-base-content mb-4">
                    Terms of Service
                </h1>
                <p className="text-sm text-base-content/60 mb-12">
                    Last updated: October 1, 2025
                </p>

                <div className="prose prose-lg max-w-none">
                    <div className="space-y-8">
                        <section>
                            <h2 className="text-2xl font-bold text-base-content mb-4">Agreement to Terms</h2>
                            <p className="text-base-content/80 leading-relaxed">
                                By accessing and using Stumbleable, you agree to be bound by these Terms of Service and all applicable
                                laws and regulations. If you do not agree with any of these terms, you are prohibited from using our service.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-base-content mb-4">Use of Service</h2>
                            <h3 className="text-xl font-semibold text-base-content mb-3">Eligibility</h3>
                            <p className="text-base-content/80 leading-relaxed mb-4">
                                You must be at least 13 years old to use Stumbleable. By using our service, you represent that you meet this requirement.
                            </p>

                            <h3 className="text-xl font-semibold text-base-content mb-3">Account Responsibilities</h3>
                            <p className="text-base-content/80 leading-relaxed mb-4">
                                You are responsible for:
                            </p>
                            <ul className="list-disc list-inside space-y-2 text-base-content/80">
                                <li>Maintaining the confidentiality of your account credentials</li>
                                <li>All activities that occur under your account</li>
                                <li>Notifying us immediately of any unauthorized access</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-base-content mb-4">User Content</h2>
                            <h3 className="text-xl font-semibold text-base-content mb-3">Your Content</h3>
                            <p className="text-base-content/80 leading-relaxed mb-4">
                                When you submit, post, or share content on Stumbleable:
                            </p>
                            <ul className="list-disc list-inside space-y-2 text-base-content/80 mb-4">
                                <li>You retain ownership of your content</li>
                                <li>You grant us a license to use, display, and distribute your content on the platform</li>
                                <li>You represent that you have the rights to share the content</li>
                                <li>You agree not to post illegal, harmful, or offensive content</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-base-content mb-4">Prohibited Conduct</h2>
                            <p className="text-base-content/80 leading-relaxed mb-4">
                                You agree not to:
                            </p>
                            <ul className="list-disc list-inside space-y-2 text-base-content/80">
                                <li>Use the service for any illegal purpose</li>
                                <li>Harass, abuse, or harm other users</li>
                                <li>Spam or manipulate the platform</li>
                                <li>Attempt to gain unauthorized access to our systems</li>
                                <li>Interfere with the proper functioning of the service</li>
                                <li>Scrape or collect data without permission</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-base-content mb-4">Intellectual Property</h2>
                            <p className="text-base-content/80 leading-relaxed">
                                The Stumbleable service, including its design, features, graphics, and code, is protected by copyright,
                                trademark, and other intellectual property laws. You may not copy, modify, distribute, or create
                                derivative works without our express permission.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-base-content mb-4">Termination</h2>
                            <p className="text-base-content/80 leading-relaxed">
                                We reserve the right to suspend or terminate your account at any time for violations of these Terms,
                                with or without notice. You may also terminate your account at any time through your account settings.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-base-content mb-4">Disclaimer of Warranties</h2>
                            <p className="text-base-content/80 leading-relaxed">
                                Stumbleable is provided "as is" without warranties of any kind, either express or implied. We do not
                                guarantee that the service will be uninterrupted, secure, or error-free.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-base-content mb-4">Limitation of Liability</h2>
                            <p className="text-base-content/80 leading-relaxed">
                                To the maximum extent permitted by law, Stumbleable shall not be liable for any indirect, incidental,
                                special, consequential, or punitive damages arising from your use of the service.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-base-content mb-4">Changes to Terms</h2>
                            <p className="text-base-content/80 leading-relaxed">
                                We may update these Terms from time to time. We will notify you of significant changes by email or
                                through the service. Your continued use after such changes constitutes acceptance of the new Terms.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-base-content mb-4">Contact</h2>
                            <p className="text-base-content/80 leading-relaxed">
                                For questions about these Terms, contact us at:{' '}
                                <a href="mailto:legal@stumbleable.com" className="link link-primary">
                                    legal@stumbleable.com
                                </a>
                            </p>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
}
