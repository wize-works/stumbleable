import Image from 'next/image';
import Link from 'next/link';
import { ManageCookiesButton } from './manage-cookies-button';
import Logo from './ui/logo';

export function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-base-200 border-t border-base-300">
            <div className="container mx-auto px-4 py-12">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
                    {/* Brand Column */}
                    <div className="space-y-4">
                        <Link href="/" className="inline-block">
                            <Logo size="sm" textSize="xl" textMode="full" className="text-base-content" />
                        </Link>
                        <p className="text-sm text-base-content/60">
                            Rediscover the joy of the internet. One click at a time.
                        </p>
                        {/* Social Links */}
                        <div className="flex gap-3">
                            <a
                                href="https://twitter.com/stumbleable"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn btn-circle btn-ghost btn-sm hover:bg-primary hover:text-primary-content transition-colors"
                                aria-label="Twitter"
                            >
                                <i className="fa-brands fa-twitter text-lg"></i>
                            </a>
                            <a
                                href="https://www.facebook.com/people/Stumbleable/61581412786114/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn btn-circle btn-ghost btn-sm hover:bg-primary hover:text-primary-content transition-colors"
                                aria-label="Facebook"
                            >
                                <i className="fa-brands fa-facebook text-lg"></i>
                            </a>
                            <a
                                href="https://instagram.com/stumbleable"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn btn-circle btn-ghost btn-sm hover:bg-primary hover:text-primary-content transition-colors"
                                aria-label="Instagram"
                            >
                                <i className="fa-brands fa-instagram text-lg"></i>
                            </a>
                            <a
                                href="https://github.com/wize-works/stumbleable"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn btn-circle btn-ghost btn-sm hover:bg-primary hover:text-primary-content transition-colors"
                                aria-label="GitHub"
                            >
                                <i className="fa-brands fa-github text-lg"></i>
                            </a>
                            <a
                                href="https://www.tiktok.com/@stumbleable"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn btn-circle btn-ghost btn-sm hover:bg-primary hover:text-primary-content transition-colors"
                                aria-label="TikTok"
                            >
                                <i className="fa-brands fa-tiktok text-lg"></i>
                            </a>
                            <a
                                href="https://www.linkedin.com/showcase/stumbleable"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn btn-circle btn-ghost btn-sm hover:bg-primary hover:text-primary-content transition-colors"
                                aria-label="LinkedIn"
                            >
                                <i className="fa-brands fa-linkedin text-lg"></i>
                            </a>
                            <a
                                href="https://www.reddit.com/user/stumbleable/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn btn-circle btn-ghost btn-sm hover:bg-primary hover:text-primary-content transition-colors"
                                aria-label="Reddit"
                            >
                                <i className="fa-brands fa-reddit text-lg"></i>
                            </a>
                        </div>
                        {/* ProductHunt Badge */}
                        <a
                            href="https://www.producthunt.com/products/stumbleable?embed=true&utm_source=badge-featured&utm_medium=badge&utm_source=badge-stumbleable"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-block mt-2"
                        >
                            <Image
                                src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=1022563&theme=light"
                                alt="stumbleable - Rediscover the magic of web discovery! | Product Hunt"
                                width={250}
                                height={54}
                                unoptimized
                            />
                        </a>
                    </div>

                    {/* Product Column */}
                    <div>
                        <h3 className="font-semibold text-base-content mb-4">Product</h3>
                        <ul className="space-y-2">
                            <li>
                                <Link href="/demo" className="text-sm text-base-content/60 hover:text-primary transition-colors flex items-center gap-1.5">
                                    <i className="fa-solid fa-duotone fa-play text-xs"></i>
                                    Demo
                                </Link>
                            </li>
                            <li>
                                <Link href="/features" className="text-sm text-base-content/60 hover:text-primary transition-colors">
                                    Features
                                </Link>
                            </li>
                            <li>
                                <Link href="/how-it-works" className="text-sm text-base-content/60 hover:text-primary transition-colors">
                                    How It Works
                                </Link>
                            </li>
                            <li>
                                <Link href="/explore" className="text-sm text-base-content/60 hover:text-primary transition-colors">
                                    Explore Trending
                                </Link>
                            </li>
                            <li>
                                <Link href="/faq" className="text-sm text-base-content/60 hover:text-primary transition-colors">
                                    FAQ
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Company Column */}
                    <div>
                        <h3 className="font-semibold text-base-content mb-4">Company</h3>
                        <ul className="space-y-2">
                            <li>
                                <Link href="/about" className="text-sm text-base-content/60 hover:text-primary transition-colors">
                                    About
                                </Link>
                            </li>
                            <li>
                                <span className="text-sm text-base-content/60 flex items-center gap-2">
                                    Blog
                                    <span className="badge badge-xs badge-secondary">coming soon</span>
                                </span>
                            </li>
                            <li>
                                <span className="text-sm text-base-content/60 flex items-center gap-2">
                                    Careers
                                    <span className="badge badge-xs badge-secondary">coming soon</span>
                                </span>
                            </li>
                            <li>
                                <Link href="/contact" className="text-sm text-base-content/60 hover:text-primary transition-colors">
                                    Contact
                                </Link>
                            </li>
                            <li>
                                <Link href="/press" className="text-sm text-base-content/60 hover:text-primary transition-colors">
                                    Press Kit
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Legal Column */}
                    <div>
                        <h3 className="font-semibold text-base-content mb-4">Legal</h3>
                        <ul className="space-y-2">
                            <li>
                                <Link href="/privacy" className="text-sm text-base-content/60 hover:text-primary transition-colors">
                                    Privacy Policy
                                </Link>
                            </li>
                            <li>
                                <Link href="/terms" className="text-sm text-base-content/60 hover:text-primary transition-colors">
                                    Terms of Service
                                </Link>
                            </li>
                            <li>
                                <Link href="/cookies" className="text-sm text-base-content/60 hover:text-primary transition-colors">
                                    Cookie Policy
                                </Link>
                            </li>
                            <li>
                                <ManageCookiesButton />
                            </li>
                            <li>
                                <Link href="/guidelines" className="text-sm text-base-content/60 hover:text-primary transition-colors">
                                    Community Guidelines
                                </Link>
                            </li>
                            <li>
                                <Link href="/dmca" className="text-sm text-base-content/60 hover:text-primary transition-colors">
                                    DMCA
                                </Link>
                            </li>
                            <li>
                                <Link href="/dashboard/data-export" className="text-sm text-base-content/60 hover:text-primary transition-colors">
                                    Export Your Data
                                </Link>
                            </li>
                            <li>
                                <Link href="/data-deletion" className="text-sm text-base-content/60 hover:text-primary transition-colors">
                                    Delete My Data
                                </Link>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="pt-8 border-t border-base-300">
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                        <p className="text-sm text-base-content/60">
                            © {currentYear} Stumbleable. All rights reserved.
                        </p>
                        <div className="flex items-center gap-4 text-sm text-base-content/60">
                            <span>Made with <i className="fa-solid fa-duotone fa-heart text-error"></i> for curious minds</span>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}
