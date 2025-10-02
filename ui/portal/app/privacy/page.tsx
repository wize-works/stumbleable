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

                        <section id="your-rights">
                            <h2 className="text-2xl font-bold text-base-content mb-4">Your Rights</h2>
                            <p className="text-base-content/80 leading-relaxed mb-4">
                                Under GDPR and CCPA, you have comprehensive rights regarding your personal data:
                            </p>

                            <div className="space-y-6">
                                <div className="card bg-base-200 p-4">
                                    <h3 className="text-xl font-semibold text-base-content mb-3 flex items-center gap-2">
                                        <i className="fa-solid fa-duotone fa-eye text-primary"></i>
                                        Right to Access
                                    </h3>
                                    <p className="text-base-content/80 leading-relaxed mb-3">
                                        You can request to see what personal data we hold about you at any time.
                                    </p>
                                    <a href="/data-export" className="link link-primary font-semibold flex items-center gap-2">
                                        <i className="fa-solid fa-download"></i>
                                        Export Your Data
                                        <i className="fa-solid fa-arrow-right text-sm"></i>
                                    </a>
                                </div>

                                <div className="card bg-base-200 p-4">
                                    <h3 className="text-xl font-semibold text-base-content mb-3 flex items-center gap-2">
                                        <i className="fa-solid fa-duotone fa-download text-primary"></i>
                                        Right to Data Portability
                                    </h3>
                                    <p className="text-base-content/80 leading-relaxed mb-3">
                                        You can download your data in a structured, commonly used format (JSON or CSV).
                                        This allows you to move your information to another service if you choose.
                                    </p>
                                    <a href="/data-export" className="link link-primary font-semibold flex items-center gap-2">
                                        <i className="fa-solid fa-file-export"></i>
                                        Download Your Data
                                        <i className="fa-solid fa-arrow-right text-sm"></i>
                                    </a>
                                </div>

                                <div className="card bg-base-200 p-4">
                                    <h3 className="text-xl font-semibold text-base-content mb-3 flex items-center gap-2">
                                        <i className="fa-solid fa-duotone fa-pen text-primary"></i>
                                        Right to Rectification
                                    </h3>
                                    <p className="text-base-content/80 leading-relaxed mb-3">
                                        You can request correction of inaccurate or incomplete personal data.
                                    </p>
                                    <a href="/dashboard" className="link link-primary font-semibold flex items-center gap-2">
                                        <i className="fa-solid fa-user-edit"></i>
                                        Update Your Profile
                                        <i className="fa-solid fa-arrow-right text-sm"></i>
                                    </a>
                                </div>

                                <div className="card bg-base-200 p-4">
                                    <h3 className="text-xl font-semibold text-base-content mb-3 flex items-center gap-2">
                                        <i className="fa-solid fa-duotone fa-trash text-error"></i>
                                        Right to Erasure (\"Right to be Forgotten\")
                                    </h3>
                                    <p className="text-base-content/80 leading-relaxed mb-3">
                                        You can request deletion of your account and all associated data. Your account will be
                                        deactivated immediately, with a 30-day grace period before permanent deletion.
                                    </p>
                                    <div className="alert alert-warning mb-3">
                                        <i className="fa-solid fa-duotone fa-clock"></i>
                                        <div className="text-sm">
                                            <strong>Grace Period:</strong> You have 30 days to cancel your deletion request
                                            and restore your account. After 30 days, all data is permanently deleted.
                                        </div>
                                    </div>
                                    <a href="/data-deletion" className="link link-error font-semibold flex items-center gap-2">
                                        <i className="fa-solid fa-circle-exclamation"></i>
                                        Request Account Deletion
                                        <i className="fa-solid fa-arrow-right text-sm"></i>
                                    </a>
                                </div>

                                <div className="card bg-base-200 p-4">
                                    <h3 className="text-xl font-semibold text-base-content mb-3 flex items-center gap-2">
                                        <i className="fa-solid fa-duotone fa-ban text-primary"></i>
                                        Right to Object
                                    </h3>
                                    <p className="text-base-content/80 leading-relaxed">
                                        You can object to certain types of data processing, including marketing communications
                                        and automated decision-making.
                                    </p>
                                </div>

                                <div className="card bg-base-200 p-4">
                                    <h3 className="text-xl font-semibold text-base-content mb-3 flex items-center gap-2">
                                        <i className="fa-solid fa-duotone fa-pause text-primary"></i>
                                        Right to Restrict Processing
                                    </h3>
                                    <p className="text-base-content/80 leading-relaxed">
                                        You can request that we limit how we use your data while we investigate concerns
                                        or resolve disputes.
                                    </p>
                                </div>
                            </div>

                            <div className="mt-6 p-4 bg-info/10 border-2 border-info rounded-lg">
                                <h4 className="font-semibold text-lg text-base-content mb-2 flex items-center gap-2">
                                    <i className="fa-solid fa-duotone fa-circle-info text-info"></i>
                                    How to Exercise Your Rights
                                </h4>
                                <p className="text-base-content/80 leading-relaxed mb-3">
                                    To exercise any of these rights, you can:
                                </p>
                                <ul className="list-disc list-inside space-y-2 text-base-content/80">
                                    <li>Use the self-service tools linked above</li>
                                    <li>Contact us at: <a href="mailto:privacy@stumbleable.com" className="link link-primary">privacy@stumbleable.com</a></li>
                                    <li>We will respond to your request within 30 days</li>
                                </ul>
                            </div>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-base-content mb-4">Data Security</h2>
                            <p className="text-base-content/80 leading-relaxed mb-4">
                                We implement appropriate technical and organizational measures to protect your data against unauthorized
                                access, alteration, disclosure, or destruction.
                            </p>

                            <div className="space-y-3">
                                <h3 className="text-xl font-semibold text-base-content mb-3">Security Measures</h3>
                                <ul className="list-disc list-inside space-y-2 text-base-content/80">
                                    <li>Industry-standard encryption for data in transit and at rest</li>
                                    <li>Secure authentication via Clerk with modern OAuth flows</li>
                                    <li>Regular security audits and vulnerability assessments</li>
                                    <li>Access controls and role-based permissions</li>
                                    <li>Automated monitoring for suspicious activity</li>
                                    <li>Secure cloud infrastructure with enterprise-grade hosting</li>
                                </ul>
                            </div>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-base-content mb-4">Data Retention</h2>
                            <p className="text-base-content/80 leading-relaxed mb-4">
                                We retain your personal data only as long as necessary for the purposes outlined in this policy.
                            </p>

                            <div className="space-y-4">
                                <div className="card bg-base-200 p-4">
                                    <h3 className="font-semibold text-lg text-base-content mb-2">Active Accounts</h3>
                                    <p className="text-base-content/80 text-sm leading-relaxed">
                                        Your data is retained as long as your account is active and you continue to use our service.
                                    </p>
                                </div>

                                <div className="card bg-base-200 p-4">
                                    <h3 className="font-semibold text-lg text-base-content mb-2">Inactive Accounts</h3>
                                    <p className="text-base-content/80 text-sm leading-relaxed">
                                        If you don't log in for 2 years, we may contact you to confirm if you want to keep your account.
                                        After notification, inactive accounts may be deleted after an additional 6 months.
                                    </p>
                                </div>

                                <div className="card bg-base-200 p-4">
                                    <h3 className="font-semibold text-lg text-base-content mb-2">Deleted Accounts (Grace Period)</h3>
                                    <p className="text-base-content/80 text-sm leading-relaxed mb-2">
                                        When you request account deletion:
                                    </p>
                                    <ul className="list-disc list-inside space-y-1 text-base-content/70 text-sm">
                                        <li><strong>Immediate:</strong> Account deactivated, no longer accessible</li>
                                        <li><strong>30 Days:</strong> Grace period - you can cancel and restore your account</li>
                                        <li><strong>After 30 Days:</strong> All data permanently deleted from our systems</li>
                                    </ul>
                                </div>

                                <div className="card bg-base-200 p-4">
                                    <h3 className="font-semibold text-lg text-base-content mb-2">Legal Requirements</h3>
                                    <p className="text-base-content/80 text-sm leading-relaxed">
                                        Some data may be retained longer if required by law, for fraud prevention, or to resolve disputes.
                                        This includes transaction records, legal communications, and security logs.
                                    </p>
                                </div>

                                <div className="card bg-base-200 p-4">
                                    <h3 className="font-semibold text-lg text-base-content mb-2">Backup Systems</h3>
                                    <p className="text-base-content/80 text-sm leading-relaxed">
                                        Deleted data may persist in backup systems for up to 90 days before being permanently purged.
                                        These backups are encrypted and inaccessible except for disaster recovery.
                                    </p>
                                </div>
                            </div>
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
