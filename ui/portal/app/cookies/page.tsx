export default function CookiesPage() {
    return (
        <div className="min-h-screen bg-base-100 py-20 px-4">
            <div className="container mx-auto max-w-4xl">
                <h1 className="text-4xl sm:text-5xl font-bold text-base-content mb-4">
                    Cookie Policy
                </h1>
                <p className="text-sm text-base-content/60 mb-12">
                    Last updated: October 1, 2025
                </p>

                <div className="prose prose-lg max-w-none">
                    <div className="space-y-8">
                        <section>
                            <h2 className="text-2xl font-bold text-base-content mb-4">What Are Cookies?</h2>
                            <p className="text-base-content/80 leading-relaxed">
                                Cookies are small text files that are stored on your device when you visit a website. They help us
                                provide you with a better experience by remembering your preferences and understanding how you use our service.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-base-content mb-4">How We Use Cookies</h2>

                            <h3 className="text-xl font-semibold text-base-content mb-3">Essential Cookies</h3>
                            <p className="text-base-content/80 leading-relaxed mb-4">
                                These cookies are necessary for the website to function properly. They enable core functionality such as:
                            </p>
                            <ul className="list-disc list-inside space-y-2 text-base-content/80 mb-4">
                                <li>Authentication and account access</li>
                                <li>Security features</li>
                                <li>Session management</li>
                            </ul>

                            <h3 className="text-xl font-semibold text-base-content mb-3">Preference Cookies</h3>
                            <p className="text-base-content/80 leading-relaxed mb-4">
                                These cookies remember your choices and settings:
                            </p>
                            <ul className="list-disc list-inside space-y-2 text-base-content/80 mb-4">
                                <li>Theme preferences (light/dark mode)</li>
                                <li>Wildness level settings</li>
                                <li>Language preferences</li>
                            </ul>

                            <h3 className="text-xl font-semibold text-base-content mb-3">Analytics Cookies</h3>
                            <p className="text-base-content/80 leading-relaxed mb-4">
                                We use analytics cookies to understand how you use Stumbleable:
                            </p>
                            <ul className="list-disc list-inside space-y-2 text-base-content/80">
                                <li>Page views and navigation patterns</li>
                                <li>Feature usage statistics</li>
                                <li>Error tracking and performance monitoring</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-base-content mb-4">Third-Party Cookies</h2>
                            <p className="text-base-content/80 leading-relaxed mb-4">
                                We may use third-party services that set their own cookies:
                            </p>
                            <ul className="list-disc list-inside space-y-2 text-base-content/80">
                                <li>Authentication providers (Clerk)</li>
                                <li>Analytics services</li>
                                <li>Content delivery networks</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-base-content mb-4">Managing Cookies</h2>
                            <p className="text-base-content/80 leading-relaxed mb-4">
                                You can control cookies through your browser settings:
                            </p>
                            <ul className="list-disc list-inside space-y-2 text-base-content/80 mb-4">
                                <li>Block all cookies</li>
                                <li>Block third-party cookies only</li>
                                <li>Delete cookies when you close your browser</li>
                                <li>Review and delete individual cookies</li>
                            </ul>
                            <div className="alert alert-info">
                                <i className="fa-solid fa-info-circle"></i>
                                <span>
                                    Note: Blocking essential cookies may affect the functionality of Stumbleable.
                                </span>
                            </div>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-base-content mb-4">Updates to This Policy</h2>
                            <p className="text-base-content/80 leading-relaxed">
                                We may update this Cookie Policy from time to time. Any changes will be posted on this page with an
                                updated "Last Updated" date.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-base-content mb-4">Contact Us</h2>
                            <p className="text-base-content/80 leading-relaxed">
                                If you have questions about our use of cookies, please contact us at:{' '}
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
