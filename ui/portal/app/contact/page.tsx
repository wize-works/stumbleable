
export default function ContactPage() {
    return (
        <div className="min-h-screen bg-base-100 py-20 px-4">
            <div className="container mx-auto max-w-4xl">
                {/* Header */}
                <div className="text-center mb-16">
                    <h1 className="text-4xl sm:text-5xl font-bold text-base-content mb-4">
                        Get in Touch
                    </h1>
                    <p className="text-xl text-base-content/70 max-w-2xl mx-auto">
                        Have questions, feedback, or just want to say hello? We'd love to hear from you.
                    </p>
                </div>

                {/* Contact Methods */}
                <div className="grid md:grid-cols-3 gap-6 mb-16">
                    <div className="card bg-base-200 shadow-lg">
                        <div className="card-body text-center">
                            <div className="text-4xl text-primary mb-4">
                                <i className="fa-solid fa-duotone fa-envelope"></i>
                            </div>
                            <h3 className="card-title text-lg justify-center">Email Us</h3>
                            <p className="text-sm text-base-content/70 mb-2">
                                For general inquiries
                            </p>
                            <a href="mailto:hello@stumbleable.com" className="link link-primary">
                                hello@stumbleable.com
                            </a>
                        </div>
                    </div>

                    <div className="card bg-base-200 shadow-lg">
                        <div className="card-body text-center">
                            <div className="text-4xl text-secondary mb-4">
                                <i className="fa-solid fa-duotone fa-headset"></i>
                            </div>
                            <h3 className="card-title text-lg justify-center">Support</h3>
                            <p className="text-sm text-base-content/70 mb-2">
                                Need help? We're here
                            </p>
                            <a href="mailto:support@stumbleable.com" className="link link-primary">
                                support@stumbleable.com
                            </a>
                        </div>
                    </div>

                    <div className="card bg-base-200 shadow-lg">
                        <div className="card-body text-center">
                            <div className="text-4xl text-accent mb-4">
                                <i className="fa-solid fa-duotone fa-briefcase"></i>
                            </div>
                            <h3 className="card-title text-lg justify-center">Business</h3>
                            <p className="text-sm text-base-content/70 mb-2">
                                Partnerships & press
                            </p>
                            <a href="mailto:business@stumbleable.com" className="link link-primary">
                                business@stumbleable.com
                            </a>
                        </div>
                    </div>
                </div>

                {/* Contact Form */}
                <div className="card bg-base-200 shadow-xl">
                    <div className="card-body">
                        <h2 className="card-title text-2xl mb-6">Send us a message</h2>
                        <form className="space-y-6">
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text">Name</span>
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Your name"
                                        className="input input-bordered w-full"
                                        required
                                    />
                                </div>
                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text">Email</span>
                                    </label>
                                    <input
                                        type="email"
                                        placeholder="your@email.com"
                                        className="input input-bordered w-full"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">Subject</span>
                                </label>
                                <input
                                    type="text"
                                    placeholder="What's this about?"
                                    className="input input-bordered w-full"
                                    required
                                />
                            </div>

                            <div className="form-control">
                                <label className="label w-full">
                                    <span className="label-text">Message</span>
                                </label>
                                <textarea
                                    className="textarea textarea-bordered h-32 w-full"
                                    placeholder="Tell us more..."
                                    required
                                ></textarea>
                            </div>

                            <div className="card-actions justify-end">
                                <button type="submit" className="btn btn-primary">
                                    <i className="fa-solid fa-duotone fa-paper-plane mr-2"></i>
                                    Send Message
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                {/* Social Links */}
                <div className="text-center mt-16">
                    <h3 className="text-xl font-semibold text-base-content mb-4">
                        Or connect with us on social media
                    </h3>
                    <div className="flex justify-center gap-4">
                        <a
                            href="https://twitter.com/stumbleable"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-circle btn-lg btn-primary"
                        >
                            <i className="fa-brands fa-twitter text-2xl"></i>
                        </a>
                        <a
                            href="https://facebook.com/stumbleable"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-circle btn-lg btn-primary"
                        >
                            <i className="fa-brands fa-facebook text-2xl"></i>
                        </a>
                        <a
                            href="https://instagram.com/stumbleable"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-circle btn-lg btn-primary"
                        >
                            <i className="fa-brands fa-instagram text-2xl"></i>
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
