import Breadcrumbs from '@/components/breadcrumbs';
import { currentUser } from '@clerk/nextjs/server';

export default async function Dashboard() {
    const user = await currentUser();
    return (
        <div className="min-h-screen bg-base-100 py-20 px-4">
            <div className="container mx-auto max-w-6xl">
                <Breadcrumbs items={[
                    { label: 'Home', href: '/' },
                    { label: 'Dashboard', href: '/dashboard' }
                ]} />

                <div className="mb-8">
                    <h1 className="text-4xl sm:text-5xl font-bold text-base-content mb-4">
                        Dashboard
                    </h1>
                    <p className="text-lg text-base-content/70">
                        Welcome back, {user?.firstName || user?.username || 'Explorer'}
                    </p>
                    <p className="text-sm text-base-content/60">
                        {user?.primaryEmailAddress?.emailAddress}
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                    {/* Account Overview */}
                    <div className="card bg-base-200">
                        <div className="card-body">
                            <h2 className="card-title text-2xl mb-4">
                                <i className="fa-solid fa-duotone fa-user-circle text-primary"></i>
                                Account Overview
                            </h2>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-base-content/70">Member Since</span>
                                    <span className="font-semibold">
                                        {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', {
                                            month: 'long',
                                            year: 'numeric'
                                        }) : 'N/A'}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-base-content/70">User ID</span>
                                    <span className="font-mono text-sm">{user?.id?.slice(0, 12)}...</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-base-content/70">Email Verified</span>
                                    <span className="badge badge-success gap-2">
                                        <i className="fa-solid fa-duotone fa-check"></i>
                                        Yes
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="card bg-base-200">
                        <div className="card-body">
                            <h2 className="card-title text-2xl mb-4">
                                <i className="fa-solid fa-duotone fa-bolt text-primary"></i>
                                Quick Actions
                            </h2>
                            <div className="space-y-2">
                                <a href="/stumble" className="btn btn-primary btn-block justify-start">
                                    <i className="fa-solid fa-duotone fa-shuffle"></i>
                                    Start Stumbling
                                </a>
                                <a href="/dashboard/saved" className="btn btn-ghost btn-block justify-start">
                                    <i className="fa-solid fa-duotone fa-bookmark"></i>
                                    View Saved Content
                                </a>
                                <a href="/dashboard/preferences" className="btn btn-ghost btn-block justify-start">
                                    <i className="fa-solid fa-duotone fa-sliders"></i>
                                    Update Preferences
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* Data & Privacy */}
                    <div className="card bg-base-200 md:col-span-2">
                        <div className="card-body">
                            <h2 className="card-title text-2xl mb-4">
                                <i className="fa-solid fa-duotone fa-shield-check text-primary"></i>
                                Data & Privacy
                            </h2>
                            <p className="text-base-content/70 mb-4">
                                Manage your personal data and privacy settings. You have full control over your information.
                            </p>
                            <div className="grid md:grid-cols-4 gap-4">
                                <a href="/dashboard/email/preferences" className="card bg-base-100 hover:bg-base-300 transition-colors">
                                    <div className="card-body">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="w-12 h-12 rounded-full bg-warning/20 flex items-center justify-center">
                                                <i className="fa-solid fa-duotone fa-envelope text-warning text-xl"></i>
                                            </div>
                                            <h3 className="card-title text-lg">Email Settings</h3>
                                        </div>
                                        <p className="text-sm text-base-content/70">
                                            Manage your email notification preferences and subscriptions
                                        </p>
                                        <div className="card-actions mt-4">
                                            <span className="text-sm text-primary font-semibold flex items-center gap-1">
                                                Manage Emails
                                                <i className="fa-solid fa-duotone fa-arrow-right"></i>
                                            </span>
                                        </div>
                                    </div>
                                </a>

                                <a href="/dashboard/data-export" className="card bg-base-100 hover:bg-base-300 transition-colors">
                                    <div className="card-body">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="w-12 h-12 rounded-full bg-info/20 flex items-center justify-center">
                                                <i className="fa-solid fa-duotone fa-download text-info text-xl"></i>
                                            </div>
                                            <h3 className="card-title text-lg">Export Data</h3>
                                        </div>
                                        <p className="text-sm text-base-content/70">
                                            Download a complete copy of your data in JSON or CSV format
                                        </p>
                                        <div className="card-actions mt-4">
                                            <span className="text-sm text-primary font-semibold flex items-center gap-1">
                                                Download Now
                                                <i className="fa-solid fa-duotone fa-arrow-right"></i>
                                            </span>
                                        </div>
                                    </div>
                                </a>

                                <a href="/privacy" className="card bg-base-100 hover:bg-base-300 transition-colors">
                                    <div className="card-body">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="w-12 h-12 rounded-full bg-success/20 flex items-center justify-center">
                                                <i className="fa-solid fa-duotone fa-file-shield text-success text-xl"></i>
                                            </div>
                                            <h3 className="card-title text-lg">Privacy Policy</h3>
                                        </div>
                                        <p className="text-sm text-base-content/70">
                                            Learn how we collect, use, and protect your personal information
                                        </p>
                                        <div className="card-actions mt-4">
                                            <span className="text-sm text-primary font-semibold flex items-center gap-1">
                                                Read Policy
                                                <i className="fa-solid fa-duotone fa-arrow-right"></i>
                                            </span>
                                        </div>
                                    </div>
                                </a>

                                <a href="/data-deletion" className="card bg-base-100 hover:bg-base-300 transition-colors border-2 border-error/20">
                                    <div className="card-body">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="w-12 h-12 rounded-full bg-error/20 flex items-center justify-center">
                                                <i className="fa-solid fa-duotone fa-trash-can text-error text-xl"></i>
                                            </div>
                                            <h3 className="card-title text-lg">Delete Account</h3>
                                        </div>
                                        <p className="text-sm text-base-content/70">
                                            Permanently remove your account and all associated data
                                        </p>
                                        <div className="card-actions mt-4">
                                            <span className="text-sm text-error font-semibold flex items-center gap-1">
                                                Request Deletion
                                                <i className="fa-solid fa-duotone fa-arrow-right"></i>
                                            </span>
                                        </div>
                                    </div>
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* Resources */}
                    <div className="card bg-base-200 md:col-span-2">
                        <div className="card-body">
                            <h2 className="card-title text-2xl mb-4">
                                <i className="fa-solid fa-duotone fa-circle-info text-primary"></i>
                                Resources & Support
                            </h2>
                            <div className="grid md:grid-cols-4 gap-3">
                                <a href="/about" className="btn btn-outline btn-sm">
                                    <i className="fa-solid fa-duotone fa-info-circle"></i>
                                    About
                                </a>
                                <a href="/guidelines" className="btn btn-outline btn-sm">
                                    <i className="fa-solid fa-duotone fa-gavel"></i>
                                    Guidelines
                                </a>
                                <a href="/contact" className="btn btn-outline btn-sm">
                                    <i className="fa-solid fa-duotone fa-envelope"></i>
                                    Contact
                                </a>
                                <a href="/faq" className="btn btn-outline btn-sm">
                                    <i className="fa-solid fa-duotone fa-circle-question"></i>
                                    FAQ
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}