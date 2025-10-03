/**
 * FAQ Section Component - Reusable accordion for frequently asked questions
 * Optimized for SEO with proper semantic HTML and structured data support
 */

interface FAQItemProps {
    question: string;
    answer: string;
    index: number;
}

function FAQItem({ question, answer, index }: FAQItemProps) {
    const id = `faq-${index}`;

    return (
        <div className="collapse collapse-plus bg-base-200 hover:bg-base-300 transition-colors">
            <input type="radio" name="faq-accordion" id={id} />
            <label htmlFor={id} className="collapse-title text-xl font-medium cursor-pointer">
                {question}
            </label>
            <div className="collapse-content">
                <p className="text-base-content/80 pt-2">{answer}</p>
            </div>
        </div>
    );
}

interface FAQSectionProps {
    title?: string;
    subtitle?: string;
    className?: string;
}

export const faqs = [
    {
        question: 'What is Stumbleable?',
        answer:
            "Stumbleable is a web discovery platform that helps you find amazing websites with one click. It's the best alternative to StumbleUpon, combining curated human taste with AI-powered recommendations.",
    },
    {
        question: 'Is Stumbleable free?',
        answer: 'Yes! Stumbleable is completely free to use. No credit card required, no hidden fees.',
    },
    {
        question: 'How is Stumbleable different from StumbleUpon?',
        answer:
            "Stumbleable builds on the legacy of StumbleUpon with modern features like AI-powered curation, wildness control, custom lists, and a cleaner interface. We focus on quality over quantity and give you more control over your discovery experience.",
    },
    {
        question: 'How does the Wildness feature work?',
        answer:
            "Wildness lets you control how far from your interests you want to explore. Set it low for familiar territory, high for unexpected discoveries. It's like tuning a radio between comfort and adventure.",
    },
    {
        question: 'Can I save websites I discover?',
        answer:
            'Absolutely! Click the bookmark icon on any discovery to save it to your collection. You can organize saves into custom lists and access them anytime from your dashboard.',
    },
    {
        question: 'Does Stumbleable work on mobile?',
        answer:
            'Yes! Stumbleable is fully responsive and works great on mobile devices. You can also install it as a Progressive Web App (PWA) for a native app-like experience.',
    },
    {
        question: 'How do you curate content?',
        answer:
            'We combine AI algorithms with human curation to surface high-quality, interesting content. Our system learns from your reactions (likes, skips, saves) to personalize recommendations while maintaining serendipity.',
    },
    {
        question: 'Can I submit my website to Stumbleable?',
        answer:
            'Yes! We welcome quality content submissions. Visit our Submit page to suggest websites for inclusion in our discovery feed.',
    },
];

export function FAQSection({ title = 'Frequently Asked Questions', subtitle, className = '' }: FAQSectionProps) {
    return (
        <section className={`py-20 px-4 ${className}`}>
            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-12">
                    <h2 className="text-4xl font-bold mb-4">{title}</h2>
                    {subtitle && <p className="text-xl text-base-content/70">{subtitle}</p>}
                </div>
                <div className="space-y-4">
                    {faqs.map((faq, index) => (
                        <FAQItem key={index} {...faq} index={index} />
                    ))}
                </div>
            </div>
        </section>
    );
}
