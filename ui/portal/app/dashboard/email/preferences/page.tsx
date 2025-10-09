'use client';

import { useToaster } from '@/components/toaster';
import { EmailAPI, EmailPreferences } from '@/lib/api-client';
import { useAuth, useUser } from '@clerk/nextjs';
import { useEffect, useState } from 'react';

interface PreferenceGroup {
    title: string;
    description: string;
    preferences: Array<{
        key: keyof EmailPreferences;
        label: string;
        description: string;
    }>;
}

const preferenceGroups: PreferenceGroup[] = [
    {
        title: 'Welcome',
        description: 'Get started with Stumbleable',
        preferences: [
            {
                key: 'welcome_email',
                label: 'Welcome Email',
                description: 'Receive a welcome email when you join Stumbleable',
            },
        ],
    },
    {
        title: 'Weekly Digests',
        description: 'Stay updated with curated content',
        preferences: [
            {
                key: 'weekly_trending',
                label: 'Weekly Trending',
                description: 'Get the most popular discoveries each week',
            },
            {
                key: 'weekly_new',
                label: 'Weekly New Content',
                description: 'Discover fresh content added this week',
            },
            {
                key: 'saved_digest',
                label: 'Saved Items Digest',
                description: 'Weekly summary of your saved discoveries',
            },
        ],
    },
    {
        title: 'Submission Updates',
        description: 'Track your submitted content',
        preferences: [
            {
                key: 'submission_updates',
                label: 'Submission Status',
                description: 'Get notified when your submissions are reviewed',
            },
        ],
    },
    {
        title: 'Engagement',
        description: 'Stay connected with Stumbleable',
        preferences: [
            {
                key: 're_engagement',
                label: 'Re-engagement Reminders',
                description: "We'll remind you when there's new content you might like",
            },
        ],
    },
    {
        title: 'Account Notifications',
        description: 'Important account updates',
        preferences: [
            {
                key: 'account_notifications',
                label: 'Account Notifications',
                description: 'Security alerts, policy updates, and important account info',
            },
        ],
    },
];

export default function EmailPreferencesPage() {
    const { user, isLoaded } = useUser();
    const { getToken } = useAuth();
    const { showToast } = useToaster();
    const [preferences, setPreferences] = useState<EmailPreferences | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);

    useEffect(() => {
        if (isLoaded && user) {
            loadPreferences();
        }
    }, [isLoaded, user]);

    const loadPreferences = async () => {
        if (!user) return;

        try {
            setLoading(true);
            const token = await getToken();
            const prefs = await EmailAPI.getPreferences(user.id, token || '');
            setPreferences(prefs);
        } catch (error) {
            console.error('Failed to load email preferences:', error);
            showToast('Failed to load email preferences', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = (key: keyof EmailPreferences) => {
        if (!preferences) return;

        setPreferences({
            ...preferences,
            [key]: !preferences[key],
        });
        setHasChanges(true);
    };

    const handleSave = async () => {
        if (!user || !preferences) return;

        try {
            setSaving(true);
            const token = await getToken();

            // Extract only the preference fields (exclude metadata)
            const updates = {
                welcome_email: preferences.welcome_email,
                weekly_trending: preferences.weekly_trending,
                weekly_new: preferences.weekly_new,
                saved_digest: preferences.saved_digest,
                submission_updates: preferences.submission_updates,
                re_engagement: preferences.re_engagement,
                account_notifications: preferences.account_notifications,
                unsubscribed_all: preferences.unsubscribed_all,
            };

            const updated = await EmailAPI.updatePreferences(user.id, updates, token || '');
            setPreferences(updated);
            setHasChanges(false);
            showToast('Email preferences saved', 'success');
        } catch (error) {
            console.error('Failed to save email preferences:', error);
            showToast('Failed to save preferences', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleUnsubscribeAll = async () => {
        if (!user) return;

        const confirmed = window.confirm(
            'Are you sure you want to unsubscribe from all emails? You can re-enable them later.'
        );

        if (!confirmed) return;

        try {
            setSaving(true);
            const token = await getToken();
            await EmailAPI.unsubscribeAll(user.id, token || '');
            await loadPreferences(); // Reload to get updated state
            showToast('Unsubscribed from all emails', 'success');
        } catch (error) {
            console.error('Failed to unsubscribe:', error);
            showToast('Failed to unsubscribe', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleResubscribe = async () => {
        if (!user) return;

        try {
            setSaving(true);
            const token = await getToken();
            await EmailAPI.resubscribe(user.id, token || '');
            await loadPreferences(); // Reload to get updated state
            showToast('Successfully resubscribed to emails', 'success');
        } catch (error) {
            console.error('Failed to resubscribe:', error);
            showToast('Failed to resubscribe', 'error');
        } finally {
            setSaving(false);
        }
    };

    if (!isLoaded || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-base-content/60">Loading preferences...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <p className="text-base-content/60">Please sign in to manage email preferences</p>
                </div>
            </div>
        );
    }

    if (!preferences) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <p className="text-error">Failed to load preferences</p>
                    <button onClick={loadPreferences} className="btn btn-primary mt-4">
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-base-100">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-base-content mb-2">Email Preferences</h1>
                    <p className="text-base-content/60">
                        Manage your email notification settings and stay in control of your inbox.
                    </p>
                </div>

                {/* Unsubscribed Banner */}
                {preferences.unsubscribed_all && (
                    <div className="alert alert-warning mb-6">
                        <i className="fa-solid fa-duotone fa-exclamation-triangle" />
                        <div>
                            <h3 className="font-bold">You're unsubscribed from all emails</h3>
                            <p className="text-sm">Re-enable emails below to start receiving notifications again.</p>
                        </div>
                        <button onClick={handleResubscribe} disabled={saving} className="btn btn-sm btn-primary">
                            {saving ? 'Processing...' : 'Resubscribe to All'}
                        </button>
                    </div>
                )}

                {/* Preference Groups */}
                <div className="space-y-6">
                    {preferenceGroups.map((group) => (
                        <div key={group.title} className="card bg-base-200">
                            <div className="card-body">
                                <h2 className="card-title text-xl mb-1">{group.title}</h2>
                                <p className="text-base-content/60 text-sm mb-4">{group.description}</p>

                                <div className="space-y-4">
                                    {group.preferences.map((pref) => (
                                        <div key={pref.key} className="flex items-start gap-4">
                                            <input
                                                type="checkbox"
                                                className="toggle toggle-primary mt-1"
                                                checked={preferences[pref.key] as boolean}
                                                onChange={() => handleToggle(pref.key)}
                                                disabled={preferences.unsubscribed_all || saving}
                                            />
                                            <div className="flex-1">
                                                <h3 className="font-semibold text-base-content">{pref.label}</h3>
                                                <p className="text-sm text-base-content/60">{pref.description}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 mt-8">
                    <button
                        onClick={handleSave}
                        disabled={!hasChanges || saving || preferences.unsubscribed_all}
                        className="btn btn-primary flex-1 sm:flex-none"
                    >
                        {saving ? (
                            <>
                                <span className="loading loading-spinner loading-sm" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <i className="fa-solid fa-duotone fa-check" />
                                Save Preferences
                            </>
                        )}
                    </button>

                    {!preferences.unsubscribed_all && (
                        <button
                            onClick={handleUnsubscribeAll}
                            disabled={saving}
                            className="btn btn-outline btn-error flex-1 sm:flex-none"
                        >
                            <i className="fa-solid fa-duotone fa-ban" />
                            Unsubscribe from All
                        </button>
                    )}
                </div>

                {/* Help Text */}
                <div className="mt-8 p-4 bg-base-200 rounded-lg">
                    <h3 className="font-semibold text-base-content mb-2 flex items-center gap-2">
                        <i className="fa-solid fa-duotone fa-info-circle" />
                        About Email Preferences
                    </h3>
                    <ul className="text-sm text-base-content/60 space-y-1 list-disc list-inside">
                        <li>Changes take effect immediately after saving</li>
                        <li>You can re-enable emails at any time by toggling them back on</li>
                        <li>Unsubscribing from all emails pauses all notifications</li>
                        <li>Important account security emails may still be sent regardless of preferences</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
