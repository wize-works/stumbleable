'use client';

import { useToaster } from '@/components/toaster';
import { InteractionAPI, UserAPI } from '@/lib/api-client';
import { useAuth, useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function DataExportPage() {
    const { user, isLoaded, isSignedIn } = useUser();
    const { getToken } = useAuth();
    const router = useRouter();
    const { showToast } = useToaster();
    const [isExporting, setIsExporting] = useState(false);
    const [exportFormat, setExportFormat] = useState<'json' | 'csv'>('json');

    // Redirect to sign-in if not authenticated
    useEffect(() => {
        if (isLoaded && !isSignedIn) {
            router.push('/sign-in');
        }
    }, [isLoaded, isSignedIn, router]);

    const handleExport = async () => {
        if (!user?.id) return;

        setIsExporting(true);
        try {
            const token = await getToken();
            if (!token) {
                showToast('Authentication error. Please sign in again.', 'error');
                return;
            }

            // Gather all user data
            const userData = await UserAPI.getUser(user.id, token);
            const savedContent = await InteractionAPI.getSaved(token);
            const analyticsData = await InteractionAPI.getAnalyticsSummary(token);
            const recentInteractions = await InteractionAPI.getRecentInteractions(token);

            // Compile complete data package
            const exportData = {
                exportDate: new Date().toISOString(),
                exportFormat: exportFormat,
                account: {
                    userId: user.id,
                    email: user.primaryEmailAddress?.emailAddress,
                    fullName: user.fullName,
                    username: user.username,
                    createdAt: user.createdAt,
                    profileImageUrl: user.imageUrl,
                },
                preferences: {
                    preferredTopics: userData.preferredTopics,
                    wildness: userData.wildness,
                    guidelinesAcceptedAt: userData.guidelinesAcceptedAt,
                },
                savedContent: savedContent.map(discovery => ({
                    id: discovery.id,
                    url: discovery.url,
                    title: discovery.title,
                    description: discovery.description,
                    domain: discovery.domain,
                    topics: discovery.topics,
                    savedAt: discovery.createdAt,
                })),
                interactions: recentInteractions.map(interaction => ({
                    action: interaction.action,
                    discoveryId: interaction.discoveryId,
                    timestamp: interaction.at,
                })),
                analytics: {
                    totalInteractions: analyticsData.totalInteractions,
                    byAction: analyticsData.byAction,
                    savedCount: analyticsData.savedCount,
                },
            };

            // Convert to selected format and download
            if (exportFormat === 'json') {
                downloadAsJSON(exportData);
            } else {
                downloadAsCSV(exportData);
            }

            showToast('Your data has been exported successfully!', 'success');
        } catch (error) {
            console.error('Error exporting data:', error);
            showToast('There was an error exporting your data. Please try again.', 'error');
        } finally {
            setIsExporting(false);
        }
    };

    const downloadAsJSON = (data: any) => {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `stumbleable-data-export-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const downloadAsCSV = (data: any) => {
        // Create CSV for saved content
        let csv = 'Saved Content\n';
        csv += 'Title,URL,Domain,Topics,Saved At\n';
        data.savedContent.forEach((item: any) => {
            csv += `"${item.title}","${item.url}","${item.domain}","${item.topics.join('; ')}","${item.savedAt}"\n`;
        });

        csv += '\n\nInteractions\n';
        csv += 'Action,Discovery ID,Timestamp\n';
        data.interactions.forEach((item: any) => {
            csv += `${item.action},${item.discoveryId},${item.timestamp}\n`;
        });

        csv += '\n\nPreferences\n';
        csv += 'Topic,Wildness\n';
        data.preferences.preferredTopics.forEach((topic: string) => {
            csv += `${topic},${data.preferences.wildness}\n`;
        });

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `stumbleable-data-export-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    if (!isLoaded) {
        return (
            <div className="h-screen flex items-center justify-center bg-base-100">
                <div className="flex flex-col items-center gap-4">
                    <div className="loading loading-spinner loading-xl text-primary"></div>
                    <span className="text-xl">Loading...</span>
                </div>
            </div>
        );
    }

    if (!isSignedIn) {
        return null;
    }

    return (
        <div className="min-h-screen bg-base-100 py-20 px-4">
            <div className="container mx-auto max-w-4xl">
                <div className="mb-8">
                    <h1 className="text-4xl sm:text-5xl font-bold text-base-content mb-4">
                        Export Your Data
                    </h1>
                    <p className="text-lg text-base-content/70">
                        Download a complete copy of your Stumbleable data
                    </p>
                </div>

                <div className="space-y-6">
                    {/* Information Card */}
                    <div className="card bg-base-200">
                        <div className="card-body">
                            <h2 className="card-title text-2xl mb-4">
                                <i className="fa-solid fa-duotone fa-info-circle text-primary"></i>
                                What's Included
                            </h2>
                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                                        <i className="fa-solid fa-duotone fa-user text-primary"></i>
                                        Account Information
                                    </h3>
                                    <ul className="list-disc list-inside space-y-1 text-sm text-base-content/80">
                                        <li>User ID and email</li>
                                        <li>Profile details</li>
                                        <li>Account creation date</li>
                                    </ul>
                                </div>

                                <div>
                                    <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                                        <i className="fa-solid fa-duotone fa-sliders text-primary"></i>
                                        Preferences
                                    </h3>
                                    <ul className="list-disc list-inside space-y-1 text-sm text-base-content/80">
                                        <li>Topic preferences</li>
                                        <li>Wildness settings</li>
                                        <li>Guidelines acceptance</li>
                                    </ul>
                                </div>

                                <div>
                                    <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                                        <i className="fa-solid fa-duotone fa-bookmark text-primary"></i>
                                        Saved Content
                                    </h3>
                                    <ul className="list-disc list-inside space-y-1 text-sm text-base-content/80">
                                        <li>All saved discoveries</li>
                                        <li>URLs and titles</li>
                                        <li>Topics and domains</li>
                                        <li>Save timestamps</li>
                                    </ul>
                                </div>

                                <div>
                                    <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                                        <i className="fa-solid fa-duotone fa-chart-line text-primary"></i>
                                        Activity Data
                                    </h3>
                                    <ul className="list-disc list-inside space-y-1 text-sm text-base-content/80">
                                        <li>Recent interactions</li>
                                        <li>Usage statistics</li>
                                        <li>Engagement summary</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Format Selection */}
                    <div className="card bg-base-200">
                        <div className="card-body">
                            <h2 className="card-title text-2xl mb-4">
                                <i className="fa-solid fa-duotone fa-file-export text-primary"></i>
                                Export Format
                            </h2>
                            <p className="text-base-content/80 mb-4">
                                Choose how you'd like to receive your data:
                            </p>
                            <div className="grid md:grid-cols-2 gap-4">
                                <label className={`card bg-base-100 cursor-pointer transition-all ${exportFormat === 'json' ? 'ring-2 ring-primary' : ''}`}>
                                    <div className="card-body">
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="radio"
                                                name="format"
                                                value="json"
                                                checked={exportFormat === 'json'}
                                                onChange={(e) => setExportFormat(e.target.value as 'json' | 'csv')}
                                                className="radio radio-primary"
                                            />
                                            <div className="flex-1">
                                                <h3 className="font-semibold text-lg flex items-center gap-2">
                                                    <i className="fa-solid fa-duotone fa-code text-primary"></i>
                                                    JSON
                                                </h3>
                                                <p className="text-sm text-base-content/70">
                                                    Complete structured data, ideal for developers and full data portability
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </label>

                                <label className={`card bg-base-100 cursor-pointer transition-all ${exportFormat === 'csv' ? 'ring-2 ring-primary' : ''}`}>
                                    <div className="card-body">
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="radio"
                                                name="format"
                                                value="csv"
                                                checked={exportFormat === 'csv'}
                                                onChange={(e) => setExportFormat(e.target.value as 'json' | 'csv')}
                                                className="radio radio-primary"
                                            />
                                            <div className="flex-1">
                                                <h3 className="font-semibold text-lg flex items-center gap-2">
                                                    <i className="fa-solid fa-duotone fa-table text-primary"></i>
                                                    CSV
                                                </h3>
                                                <p className="text-sm text-base-content/70">
                                                    Spreadsheet format, easy to open in Excel or Google Sheets
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Privacy Notice */}
                    <div className="alert alert-info">
                        <i className="fa-solid fa-duotone fa-shield-check text-2xl"></i>
                        <div>
                            <h3 className="font-bold">Your Privacy Matters</h3>
                            <div className="text-sm">
                                Your data export is generated on-demand and downloaded directly to your device.
                                We don't store copies of your export files on our servers.
                            </div>
                        </div>
                    </div>

                    {/* Export Button */}
                    <div className="card bg-primary/10 border-2 border-primary">
                        <div className="card-body">
                            <h2 className="card-title text-2xl mb-4">
                                <i className="fa-solid fa-duotone fa-download text-primary"></i>
                                Ready to Export?
                            </h2>
                            <p className="text-base-content/80 mb-4">
                                Your data will be downloaded as a {exportFormat.toUpperCase()} file.
                                This may take a moment depending on how much data you have.
                            </p>
                            <div className="card-actions justify-end">
                                <button
                                    onClick={handleExport}
                                    disabled={isExporting}
                                    className="btn btn-primary btn-lg"
                                >
                                    {isExporting && <span className="loading loading-spinner"></span>}
                                    {isExporting ? 'Preparing Export...' : `Download ${exportFormat.toUpperCase()} File`}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* FAQ */}
                    <div className="card bg-base-200">
                        <div className="card-body">
                            <h2 className="card-title text-2xl mb-4">
                                <i className="fa-solid fa-duotone fa-circle-question text-primary"></i>
                                Frequently Asked Questions
                            </h2>
                            <div className="space-y-4">
                                <details className="group bg-base-100 hover:bg-base-300 transition-colors rounded-lg">
                                    <summary className="flex items-center justify-between cursor-pointer p-4 text-lg font-medium text-base-content list-none">
                                        <span>How often can I export my data?</span>
                                        <i className="fa-solid fa-duotone fa-chevron-down text-primary transition-transform duration-300 group-open:rotate-180"></i>
                                    </summary>
                                    <div className="px-4 pb-4">
                                        <p className="text-base-content/70 leading-relaxed">
                                            You can export your data as often as you'd like. We recommend doing this regularly
                                            to keep a backup of your discoveries and preferences.
                                        </p>
                                    </div>
                                </details>

                                <details className="group bg-base-100 hover:bg-base-300 transition-colors rounded-lg">
                                    <summary className="flex items-center justify-between cursor-pointer p-4 text-lg font-medium text-base-content list-none">
                                        <span>What format should I choose?</span>
                                        <i className="fa-solid fa-duotone fa-chevron-down text-primary transition-transform duration-300 group-open:rotate-180"></i>
                                    </summary>
                                    <div className="px-4 pb-4">
                                        <p className="text-base-content/70 leading-relaxed">
                                            JSON is recommended for complete data portability and technical use.
                                            CSV is better if you want to view your data in spreadsheet applications like Excel or Google Sheets.
                                        </p>
                                    </div>
                                </details>

                                <details className="group bg-base-100 hover:bg-base-300 transition-colors rounded-lg">
                                    <summary className="flex items-center justify-between cursor-pointer p-4 text-lg font-medium text-base-content list-none">
                                        <span>Is my data secure during export?</span>
                                        <i className="fa-solid fa-duotone fa-chevron-down text-primary transition-transform duration-300 group-open:rotate-180"></i>
                                    </summary>
                                    <div className="px-4 pb-4">
                                        <p className="text-base-content/70 leading-relaxed">
                                            Yes! Your data is downloaded directly to your device through a secure connection.
                                            We don't create copies on our servers or send it through third parties.
                                        </p>
                                    </div>
                                </details>

                                <details className="group bg-base-100 hover:bg-base-300 transition-colors rounded-lg">
                                    <summary className="flex items-center justify-between cursor-pointer p-4 text-lg font-medium text-base-content list-none">
                                        <span>Can I import this data elsewhere?</span>
                                        <i className="fa-solid fa-duotone fa-chevron-down text-primary transition-transform duration-300 group-open:rotate-180"></i>
                                    </summary>
                                    <div className="px-4 pb-4">
                                        <p className="text-base-content/70 leading-relaxed">
                                            The JSON format is designed for data portability. You can use it to migrate to other
                                            services, back up your data, or analyze your usage patterns with your own tools.
                                        </p>
                                    </div>
                                </details>
                            </div>
                        </div>
                    </div>

                    {/* Additional Resources */}
                    <div className="card bg-base-200">
                        <div className="card-body">
                            <h2 className="card-title text-2xl mb-4">
                                <i className="fa-solid fa-duotone fa-life-ring text-primary"></i>
                                Need Help?
                            </h2>
                            <div className="grid md:grid-cols-2 gap-4">
                                <a href="/privacy" className="btn btn-outline">
                                    <i className="fa-solid fa-duotone fa-shield-check"></i>
                                    Privacy Policy
                                </a>
                                <a href="/contact" className="btn btn-outline">
                                    <i className="fa-solid fa-duotone fa-envelope"></i>
                                    Contact Support
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
