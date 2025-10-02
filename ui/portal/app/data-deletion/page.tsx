'use client';

import { useToaster } from '@/components/toaster';
import { UserAPI } from '@/lib/api-client';
import { useAuth, useUser } from '@clerk/nextjs';
import { useState } from 'react';

export default function DataDeletionPage() {
    const { user, isSignedIn } = useUser();
    const { signOut, getToken } = useAuth();
    const { showToast } = useToaster();
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [confirmText, setConfirmText] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);

    const handleRequestDeletion = async () => {
        if (confirmText.toLowerCase() !== 'delete my account') {
            showToast('Please type "DELETE MY ACCOUNT" to confirm', 'error');
            return;
        }

        if (!user?.id) {
            showToast('Unable to identify user. Please sign in again.', 'error');
            return;
        }

        setIsDeleting(true);

        try {
            const token = await getToken();
            if (!token) {
                showToast('Authentication error. Please sign in again.', 'error');
                return;
            }

            // Request account deletion via API
            const result = await UserAPI.requestDeletion(user.id, token);

            showToast('Your deletion request has been submitted. You have 30 days to cancel.', 'success');

            // Sign out the user
            setTimeout(() => {
                signOut();
            }, 2000);
        } catch (error) {
            console.error('Error requesting deletion:', error);
            showToast('There was an error processing your request. Please contact support.', 'error');
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="min-h-screen bg-base-100 py-20 px-4">
            <div className="container mx-auto max-w-4xl">
                <div className="mb-8">
                    <h1 className="text-4xl sm:text-5xl font-bold text-base-content mb-4">
                        Data Deletion Request
                    </h1>
                    <p className="text-lg text-base-content/70">
                        We respect your right to privacy and control over your personal data.
                    </p>
                </div>

                <div className="space-y-6">
                    {/* Information Card */}
                    <div className="card bg-base-200">
                        <div className="card-body">
                            <h2 className="card-title text-2xl mb-4">
                                <i className="fa-solid fa-duotone fa-info-circle text-primary"></i>
                                What Gets Deleted
                            </h2>
                            <div className="space-y-4">
                                <div>
                                    <h3 className="font-semibold text-lg mb-2">Account Information</h3>
                                    <ul className="list-disc list-inside space-y-1 text-base-content/80">
                                        <li>Your profile information (name, email, username)</li>
                                        <li>Account credentials and authentication data</li>
                                        <li>Profile picture and avatar</li>
                                    </ul>
                                </div>

                                <div>
                                    <h3 className="font-semibold text-lg mb-2">Activity Data</h3>
                                    <ul className="list-disc list-inside space-y-1 text-base-content/80">
                                        <li>Your discovery history and interactions (likes, saves, skips)</li>
                                        <li>Saved content and personal lists</li>
                                        <li>Comments and feedback you've provided</li>
                                        <li>Analytics and usage data</li>
                                    </ul>
                                </div>

                                <div>
                                    <h3 className="font-semibold text-lg mb-2">Preferences</h3>
                                    <ul className="list-disc list-inside space-y-1 text-base-content/80">
                                        <li>Topic preferences and interests</li>
                                        <li>Wildness settings and customizations</li>
                                        <li>Blocked domains and filters</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Important Notice */}
                    <div className="alert alert-warning">
                        <i className="fa-solid fa-duotone fa-triangle-exclamation text-2xl"></i>
                        <div>
                            <h3 className="font-bold">This Action is Permanent</h3>
                            <div className="text-sm">
                                Once your account is deleted, we cannot recover your data. Please make sure you've downloaded any content you want to keep before proceeding.
                            </div>
                        </div>
                    </div>

                    {/* Timeline */}
                    <div className="card bg-base-200">
                        <div className="card-body">
                            <h2 className="card-title text-2xl mb-4">
                                <i className="fa-solid fa-duotone fa-clock text-primary"></i>
                                Deletion Timeline
                            </h2>
                            <ul className="timeline timeline-vertical">
                                <li>
                                    <div className="timeline-start timeline-box">
                                        <strong>Immediate</strong>
                                        <p className="text-sm">Your account is deactivated and you're logged out</p>
                                    </div>
                                    <div className="timeline-middle">
                                        <i className="fa-solid fa-duotone fa-circle-check text-primary"></i>
                                    </div>
                                    <hr className="bg-primary" />
                                </li>
                                <li>
                                    <hr className="bg-primary" />
                                    <div className="timeline-middle">
                                        <i className="fa-solid fa-duotone fa-circle-check text-primary"></i>
                                    </div>
                                    <div className="timeline-end timeline-box">
                                        <strong>30 Days</strong>
                                        <p className="text-sm">Grace period - you can still recover your account by contacting support</p>
                                    </div>
                                    <hr />
                                </li>
                                <li>
                                    <hr />
                                    <div className="timeline-start timeline-box">
                                        <strong>After 30 Days</strong>
                                        <p className="text-sm">All your data is permanently deleted from our systems</p>
                                    </div>
                                    <div className="timeline-middle">
                                        <i className="fa-solid fa-duotone fa-trash-can text-error"></i>
                                    </div>
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* Alternatives */}
                    <div className="card bg-base-200">
                        <div className="card-body">
                            <h2 className="card-title text-2xl mb-4">
                                <i className="fa-solid fa-duotone fa-lightbulb text-primary"></i>
                                Before You Go
                            </h2>
                            <p className="text-base-content/80 mb-4">
                                If you're concerned about privacy or data usage, consider these alternatives:
                            </p>
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="card bg-base-100">
                                    <div className="card-body">
                                        <h3 className="card-title text-lg">
                                            <i className="fa-solid fa-duotone fa-pause text-warning"></i>
                                            Deactivate Temporarily
                                        </h3>
                                        <p className="text-sm text-base-content/70">
                                            Take a break without losing your data. You can reactivate anytime.
                                        </p>
                                    </div>
                                </div>
                                <a href="/data-export" className="card bg-base-100 hover:bg-base-200 transition-colors">
                                    <div className="card-body">
                                        <h3 className="card-title text-lg">
                                            <i className="fa-solid fa-duotone fa-download text-info"></i>
                                            Download Your Data
                                        </h3>
                                        <p className="text-sm text-base-content/70">
                                            Export your saved content and lists before deleting.
                                        </p>
                                    </div>
                                </a>
                                <div className="card bg-base-100">
                                    <div className="card-body">
                                        <h3 className="card-title text-lg">
                                            <i className="fa-solid fa-duotone fa-shield text-success"></i>
                                            Review Privacy Settings
                                        </h3>
                                        <p className="text-sm text-base-content/70">
                                            Adjust what data we collect and how we use it.
                                        </p>
                                    </div>
                                </div>
                                <div className="card bg-base-100">
                                    <div className="card-body">
                                        <h3 className="card-title text-lg">
                                            <i className="fa-solid fa-duotone fa-envelope text-primary"></i>
                                            Contact Support
                                        </h3>
                                        <p className="text-sm text-base-content/70">
                                            Share your concerns - we're here to help improve your experience.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Deletion Form */}
                    {isSignedIn ? (
                        <div className="card bg-error/10 border-2 border-error">
                            <div className="card-body">
                                <h2 className="card-title text-2xl text-error mb-4">
                                    <i className="fa-solid fa-duotone fa-circle-exclamation"></i>
                                    Delete My Account
                                </h2>

                                {!showConfirmation ? (
                                    <div className="space-y-4">
                                        <p className="text-base-content/80">
                                            Logged in as: <strong>{user?.primaryEmailAddress?.emailAddress}</strong>
                                        </p>
                                        <p className="text-base-content/80">
                                            Are you sure you want to permanently delete your Stumbleable account? This cannot be undone.
                                        </p>
                                        <div className="card-actions justify-end">
                                            <a href="/dashboard" className="btn btn-ghost">
                                                No, Keep My Account
                                            </a>
                                            <button
                                                onClick={() => setShowConfirmation(true)}
                                                className="btn btn-error"
                                            >
                                                Yes, Delete My Account
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <p className="text-base-content/80 font-semibold">
                                            Final Confirmation Required
                                        </p>
                                        <p className="text-base-content/70 text-sm">
                                            To confirm deletion, please type <strong>DELETE MY ACCOUNT</strong> below:
                                        </p>
                                        <input
                                            type="text"
                                            value={confirmText}
                                            onChange={(e) => setConfirmText(e.target.value)}
                                            placeholder="DELETE MY ACCOUNT"
                                            className="input input-bordered w-full"
                                            disabled={isDeleting}
                                        />
                                        <div className="card-actions justify-end">
                                            <button
                                                onClick={() => {
                                                    setShowConfirmation(false);
                                                    setConfirmText('');
                                                }}
                                                className="btn btn-ghost"
                                                disabled={isDeleting}
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={handleRequestDeletion}
                                                className="btn btn-error"
                                                disabled={isDeleting || confirmText.toLowerCase() !== 'delete my account'}
                                            >
                                                {isDeleting && <span className="loading loading-spinner"></span>}
                                                Permanently Delete Account
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="card bg-base-200">
                            <div className="card-body">
                                <h2 className="card-title text-2xl mb-4">
                                    <i className="fa-solid fa-duotone fa-lock text-primary"></i>
                                    Sign In Required
                                </h2>
                                <p className="text-base-content/80 mb-4">
                                    You must be signed in to request account deletion.
                                </p>
                                <div className="card-actions">
                                    <a href="/sign-in" className="btn btn-primary">
                                        Sign In
                                    </a>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Contact Information */}
                    <div className="card bg-base-200">
                        <div className="card-body">
                            <h2 className="card-title text-2xl mb-4">
                                <i className="fa-solid fa-duotone fa-message-question text-primary"></i>
                                Need Help?
                            </h2>
                            <p className="text-base-content/80 mb-4">
                                If you have questions about data deletion or need assistance:
                            </p>
                            <ul className="space-y-2 text-base-content/80">
                                <li className="flex items-center gap-2">
                                    <i className="fa-solid fa-duotone fa-envelope text-primary"></i>
                                    Email us at: <a href="mailto:privacy@stumbleable.com" className="link link-primary">privacy@stumbleable.com</a>
                                </li>
                                <li className="flex items-center gap-2">
                                    <i className="fa-solid fa-duotone fa-book text-primary"></i>
                                    Read our: <a href="/privacy" className="link link-primary">Privacy Policy</a>
                                </li>
                                <li className="flex items-center gap-2">
                                    <i className="fa-solid fa-duotone fa-shield-check text-primary"></i>
                                    Learn about your: <a href="/privacy#your-rights" className="link link-primary">Data Rights</a>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
