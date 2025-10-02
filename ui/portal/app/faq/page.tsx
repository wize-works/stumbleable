export default function FAQPage() {
    const faqs = [
        {
            category: "Getting Started",
            questions: [
                {
                    q: "What is Stumbleable?",
                    a: "Stumbleable is a modern content discovery platform that helps you find amazing content from across the web. Instead of endless scrolling, you get one curated discovery at a time, perfectly matched to your interests."
                },
                {
                    q: "Is Stumbleable free?",
                    a: "Yes! Stumbleable is completely free to use. Sign up, choose your interests, and start discovering great content immediately."
                },
                {
                    q: "How do I get started?",
                    a: "Simply sign up for a free account, select a few topics you're interested in, and hit the Stumble button. That's it! You can refine your interests and preferences anytime from your dashboard."
                },
                {
                    q: "Do I need to create an account?",
                    a: "While you can browse trending content without an account, creating one unlocks the full experience—personalized recommendations, saved discoveries, lists, and more."
                }
            ]
        },
        {
            category: "Discovery",
            questions: [
                {
                    q: "How does the discovery algorithm work?",
                    a: "Our algorithm learns from your reactions (likes, skips, saves) to understand what you enjoy. It considers your chosen topics, content preferences, and the 'wildness' setting to serve up the perfect mix of familiar favorites and exciting new discoveries."
                },
                {
                    q: "What is the Wildness control?",
                    a: "Wildness lets you control how adventurous your discoveries are. Low wildness (0-30) keeps recommendations close to your known interests. Medium (31-70) adds variety. High wildness (71-100) ventures into unexpected territory for maximum serendipity."
                },
                {
                    q: "Will I see the same content twice?",
                    a: "No! Our system tracks everything you've seen and ensures you never get duplicate discoveries. Your feed stays fresh and exciting."
                },
                {
                    q: "Can I control what types of content I see?",
                    a: "Absolutely! You can choose from dozens of topics in your preferences, adjust your wildness setting, and your reactions (likes/skips) continuously refine what you'll see next."
                }
            ]
        },
        {
            category: "Features",
            questions: [
                {
                    q: "What are the keyboard shortcuts?",
                    a: "Space = Next discovery, ↑ (Up Arrow) = Like, ↓ (Down Arrow) = Skip, S = Save, Shift+S = Share. Power users love navigating entirely with the keyboard!"
                },
                {
                    q: "Can I save discoveries for later?",
                    a: "Yes! Click the Save button (or press S) on any discovery to add it to your personal library. Access your saved items anytime from the main menu."
                },
                {
                    q: "What are Community Lists?",
                    a: "Lists are curated collections of related discoveries. You can create your own lists, share them with others, and explore lists created by the community. Think of them as playlists for web content."
                },
                {
                    q: "Can I share discoveries with friends?",
                    a: "Definitely! Every discovery has a Share button that lets you post to social media, copy a link, or send via email. Spread the love!"
                }
            ]
        },
        {
            category: "Content",
            questions: [
                {
                    q: "Where does the content come from?",
                    a: "Content is submitted by our community and curated by our team. Every submission goes through moderation to ensure quality. We value interesting, well-crafted content over clickbait."
                },
                {
                    q: "Can I submit content?",
                    a: "Yes! Once you're signed in, use the Submit page to share websites, articles, videos, or anything else you think the community would love. Quality submissions earn recognition in the community."
                },
                {
                    q: "How do you ensure content quality?",
                    a: "All submissions are reviewed by our moderation team. We also use community signals (reactions, reports) to maintain quality standards. Our goal is genuine discovery, not viral clickbait."
                },
                {
                    q: "What types of content can I discover?",
                    a: "Everything! Articles, blogs, interactive sites, tools, galleries, videos, games, portfolios—anything interesting on the web. We focus on quality and variety."
                }
            ]
        },
        {
            category: "Account & Privacy",
            questions: [
                {
                    q: "Is my data private?",
                    a: "Yes. We take privacy seriously. Your reactions and preferences are used only to improve your recommendations. We never sell your data. Read our full Privacy Policy for details."
                },
                {
                    q: "Can I delete my account?",
                    a: "Yes. You can delete your account anytime from your dashboard settings. All your data will be permanently removed."
                },
                {
                    q: "How do I change my topics or preferences?",
                    a: "Visit your Dashboard or Preferences page to adjust your topics, wildness setting, and other personalization options anytime."
                },
                {
                    q: "Can I use Stumbleable on mobile?",
                    a: "Absolutely! Stumbleable works great on mobile browsers. The interface is fully responsive and touch-friendly. Swipe gestures work too!"
                }
            ]
        },
        {
            category: "Troubleshooting",
            questions: [
                {
                    q: "The content isn't loading. What should I do?",
                    a: "First, check your internet connection. If the problem persists, try refreshing the page or clearing your browser cache. Still stuck? Contact us through the Contact page."
                },
                {
                    q: "I'm seeing content I don't like. How do I fix this?",
                    a: "Use the Skip (thumbs down) button to tell us what you don't enjoy. The algorithm learns fast. You can also adjust your topics and wildness settings in your preferences."
                },
                {
                    q: "How do I report inappropriate content?",
                    a: "Every discovery has a report option in the menu. We review all reports quickly and take action as needed. Thank you for helping keep Stumbleable great!"
                },
                {
                    q: "I found a bug. Where do I report it?",
                    a: "We appreciate bug reports! Use our Contact page to send details about what you experienced. Include screenshots if possible."
                }
            ]
        }
    ];

    return (
        <div className="min-h-screen bg-base-100">
            {/* Hero Section */}
            <section className="py-20 px-4 bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10">
                <div className="max-w-4xl mx-auto text-center">
                    <h1 className="text-5xl md:text-6xl font-bold text-base-content mb-6">
                        Frequently Asked <span className="text-primary">Questions</span>
                    </h1>
                    <p className="text-xl text-base-content/70">
                        Everything you need to know about Stumbleable
                    </p>
                </div>
            </section>

            {/* FAQ Content */}
            <section className="py-16 px-4">
                <div className="max-w-4xl mx-auto space-y-12">
                    {faqs.map((section) => (
                        <div key={section.category}>
                            <h2 className="text-3xl font-bold text-base-content mb-6 flex items-center gap-3">
                                <span className="w-2 h-8 bg-primary rounded-full"></span>
                                {section.category}
                            </h2>

                            <div className="space-y-4">
                                {section.questions.map((faq, index) => (
                                    <div key={index} className="collapse collapse-plus bg-base-200 hover:bg-base-300 transition-colors">
                                        <input type="radio" name={`faq-${section.category}`} />
                                        <div className="collapse-title text-xl font-medium text-base-content">
                                            {faq.q}
                                        </div>
                                        <div className="collapse-content">
                                            <p className="text-base-content/70 leading-relaxed">
                                                {faq.a}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Still Have Questions */}
            <section className="py-16 px-4 bg-base-200">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-3xl font-bold text-base-content mb-4">
                        Still Have Questions?
                    </h2>
                    <p className="text-base-content/70 mb-8">
                        Can't find what you're looking for? We're here to help!
                    </p>
                    <div className="flex gap-4 justify-center flex-wrap">
                        <a href="/contact" className="btn btn-primary btn-lg">
                            <i className="fa-solid fa-envelope mr-2"></i>
                            Contact Support
                        </a>
                        <a href="/how-it-works" className="btn btn-outline btn-lg">
                            <i className="fa-solid fa-book mr-2"></i>
                            How It Works
                        </a>
                    </div>
                </div>
            </section>

            {/* Quick Links */}
            <section className="py-16 px-4">
                <div className="max-w-4xl mx-auto">
                    <h3 className="text-2xl font-bold text-center text-base-content mb-8">
                        Helpful Resources
                    </h3>
                    <div className="grid md:grid-cols-3 gap-6">
                        <a href="/features" className="card bg-base-100 shadow-lg hover:shadow-xl transition-shadow">
                            <div className="card-body items-center text-center">
                                <i className="fa-solid fa-list-check text-4xl text-primary mb-3"></i>
                                <h4 className="card-title text-base">Features</h4>
                                <p className="text-sm text-base-content/60">
                                    Explore all capabilities
                                </p>
                            </div>
                        </a>

                        <a href="/guidelines" className="card bg-base-100 shadow-lg hover:shadow-xl transition-shadow">
                            <div className="card-body items-center text-center">
                                <i className="fa-solid fa-shield-halved text-4xl text-secondary mb-3"></i>
                                <h4 className="card-title text-base">Guidelines</h4>
                                <p className="text-sm text-base-content/60">
                                    Community standards
                                </p>
                            </div>
                        </a>

                        <a href="/privacy" className="card bg-base-100 shadow-lg hover:shadow-xl transition-shadow">
                            <div className="card-body items-center text-center">
                                <i className="fa-solid fa-lock text-4xl text-accent mb-3"></i>
                                <h4 className="card-title text-base">Privacy</h4>
                                <p className="text-sm text-base-content/60">
                                    Your data protection
                                </p>
                            </div>
                        </a>
                    </div>
                </div>
            </section>
        </div>
    );
}
