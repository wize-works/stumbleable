export default function DMCAPage() {
    return (
        <div className="min-h-screen bg-base-100 py-20 px-4">
            <div className="container mx-auto max-w-4xl">
                <h1 className="text-4xl sm:text-5xl font-bold text-base-content mb-4">
                    DMCA Copyright Policy
                </h1>
                <p className="text-sm text-base-content/60 mb-12">
                    Last updated: October 1, 2025
                </p>

                <div className="prose prose-lg max-w-none">
                    <div className="space-y-8">
                        <section>
                            <h2 className="text-2xl font-bold text-base-content mb-4">Copyright Infringement Notification</h2>
                            <p className="text-base-content/80 leading-relaxed">
                                Stumbleable respects the intellectual property rights of others and expects users to do the same.
                                If you believe that your copyrighted work has been copied in a way that constitutes copyright
                                infringement and is accessible on Stumbleable, please notify our copyright agent.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-base-content mb-4">Filing a DMCA Notice</h2>
                            <p className="text-base-content/80 leading-relaxed mb-4">
                                To file a notice of copyright infringement with us, you must provide a written communication
                                that includes substantially the following:
                            </p>
                            <ul className="list-decimal list-inside space-y-3 text-base-content/80">
                                <li>
                                    A physical or electronic signature of a person authorized to act on behalf of the owner
                                    of an exclusive right that is allegedly infringed.
                                </li>
                                <li>
                                    Identification of the copyrighted work claimed to have been infringed, or, if multiple
                                    copyrighted works are covered by a single notification, a representative list of such works.
                                </li>
                                <li>
                                    Identification of the material that is claimed to be infringing or to be the subject of
                                    infringing activity and that is to be removed or access to which is to be disabled, and
                                    information reasonably sufficient to permit us to locate the material.
                                </li>
                                <li>
                                    Information reasonably sufficient to permit us to contact you, such as an address, telephone
                                    number, and, if available, an email address.
                                </li>
                                <li>
                                    A statement that you have a good faith belief that use of the material in the manner
                                    complained of is not authorized by the copyright owner, its agent, or the law.
                                </li>
                                <li>
                                    A statement that the information in the notification is accurate, and under penalty of
                                    perjury, that you are authorized to act on behalf of the owner of an exclusive right
                                    that is allegedly infringed.
                                </li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-base-content mb-4">Designated Copyright Agent</h2>
                            <div className="card bg-base-200 shadow-lg">
                                <div className="card-body">
                                    <h3 className="card-title">Contact Information</h3>
                                    <div className="space-y-2 text-base-content/80">
                                        <p>
                                            <strong>Email:</strong>{' '}
                                            <a href="mailto:dmca@stumbleable.com" className="link link-primary">
                                                dmca@stumbleable.com
                                            </a>
                                        </p>
                                        <p>
                                            <strong>Attention:</strong> DMCA Copyright Agent
                                        </p>
                                        <p className="text-sm italic">
                                            Please allow 2-3 business days for email responses.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-base-content mb-4">Counter-Notification</h2>
                            <p className="text-base-content/80 leading-relaxed mb-4">
                                If you believe that material you posted was removed or access to it was disabled by mistake or
                                misidentification, you may file a counter-notification with us by providing the following information:
                            </p>
                            <ul className="list-decimal list-inside space-y-3 text-base-content/80">
                                <li>Your physical or electronic signature.</li>
                                <li>
                                    Identification of the material that has been removed or to which access has been disabled
                                    and the location at which the material appeared before it was removed or access to it was disabled.
                                </li>
                                <li>
                                    A statement under penalty of perjury that you have a good faith belief that the material
                                    was removed or disabled as a result of mistake or misidentification.
                                </li>
                                <li>
                                    Your name, address, and telephone number, and a statement that you consent to the jurisdiction
                                    of the Federal District Court for the judicial district in which your address is located, or
                                    if your address is outside of the United States, for any judicial district in which Stumbleable
                                    may be found, and that you will accept service of process from the person who provided
                                    notification of the alleged infringement.
                                </li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-base-content mb-4">Repeat Infringer Policy</h2>
                            <p className="text-base-content/80 leading-relaxed">
                                In accordance with the DMCA and other applicable law, Stumbleable has adopted a policy of terminating,
                                in appropriate circumstances and at our sole discretion, users who are deemed to be repeat infringers.
                                We may also, at our sole discretion, limit access to Stumbleable and/or terminate the accounts of
                                any users who infringe any intellectual property rights of others, whether or not there is any
                                repeat infringement.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-base-content mb-4">False Claims</h2>
                            <div className="alert alert-warning">
                                <i className="fa-solid fa-duotone fa-exclamation-triangle"></i>
                                <div>
                                    <h4 className="font-bold">Important Notice</h4>
                                    <p className="text-sm">
                                        Please note that under Section 512(f) of the DMCA, any person who knowingly materially
                                        misrepresents that material or activity is infringing may be subject to liability for
                                        damages. Don't make false claims!
                                    </p>
                                </div>
                            </div>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-base-content mb-4">Processing Time</h2>
                            <p className="text-base-content/80 leading-relaxed">
                                We will review and process all complete DMCA notices within 2-3 business days. You will receive
                                a confirmation email when your notice has been received and again when action has been taken.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-base-content mb-4">Questions</h2>
                            <p className="text-base-content/80 leading-relaxed">
                                For questions about our DMCA policy or procedures, contact our legal team at:{' '}
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
