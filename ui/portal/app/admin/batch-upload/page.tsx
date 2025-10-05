import BatchUpload from '@/components/batch-upload';
import Breadcrumbs from '@/components/breadcrumbs';
import { auth } from '@clerk/nextjs/server';
import { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
    title: 'Batch Upload | Stumbleable Admin',
    description: 'Bulk import content from CSV files for Stumbleable.',
};

export default async function BatchUploadPage() {
    const { userId } = await auth();

    if (!userId) {
        redirect('/sign-in');
    }

    // Note: Role checking is done client-side in BatchUpload component
    // Real security is enforced by:
    // 1. Database RLS policies (check user.role = 'admin')
    // 2. API endpoint validation (crawler-service checks admin JWT)
    // 3. Client-side UX (BatchUpload checks and shows appropriate UI)

    return (
        <div className="min-h-screen">
            <div className="container mx-auto px-4 py-8">
                <Breadcrumbs items={[
                    { label: 'Home', href: '/' },
                    { label: 'Admin Dashboard', href: '/admin' },
                    { label: 'Batch Upload', href: '/admin/batch-upload' }
                ]} />

                {/* Info Card */}
                <div className="alert alert-info mb-6">
                    <i className="fa-solid fa-duotone fa-circle-info text-xl"></i>
                    <div>
                        <h3 className="font-bold">About Batch Upload</h3>
                        <div className="text-sm">
                            Upload CSV files with content URLs for bulk processing. The system will automatically
                            crawl each URL, extract metadata, and add the content to the discovery pool.
                        </div>
                    </div>
                </div>

                {/* CSV Format Guide */}
                <div className="card bg-base-200 shadow-md mb-6">
                    <div className="card-body">
                        <h2 className="card-title text-xl mb-4">
                            <i className="fa-solid fa-duotone fa-file-csv text-primary"></i>
                            CSV Format Guide
                        </h2>

                        <div className="space-y-4">
                            <div>
                                <h3 className="font-semibold mb-2">Required Columns:</h3>
                                <ul className="list-disc list-inside space-y-1 text-sm">
                                    <li><code className="badge badge-sm">url</code> - The webpage URL to crawl</li>
                                </ul>
                            </div>

                            <div>
                                <h3 className="font-semibold mb-2">Optional Columns:</h3>
                                <ul className="list-disc list-inside space-y-1 text-sm">
                                    <li><code className="badge badge-sm">title</code> - Content title (auto-extracted if not provided)</li>
                                    <li><code className="badge badge-sm">description</code> - Content description</li>
                                    <li><code className="badge badge-sm">topics</code> - Comma-separated topics (e.g., "tech,ai,ml")</li>
                                    <li><code className="badge badge-sm">author</code> - Content author name</li>
                                    <li><code className="badge badge-sm">published_date</code> - Publication date (ISO 8601 format)</li>
                                    <li><code className="badge badge-sm">image_url</code> - Cover image URL</li>
                                    <li><code className="badge badge-sm">read_time</code> - Reading time in minutes</li>
                                    <li><code className="badge badge-sm">word_count</code> - Article word count</li>
                                </ul>
                            </div>

                            <div className="divider"></div>

                            <div>
                                <h3 className="font-semibold mb-2">Flexible Column Names:</h3>
                                <p className="text-sm text-base-content/70 mb-2">
                                    The system automatically detects column names! You can use variations like:
                                </p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                                    <div>
                                        <strong>For URLs:</strong> url, link, website, webpage, site
                                    </div>
                                    <div>
                                        <strong>For Topics:</strong> topics, tags, categories, keywords
                                    </div>
                                    <div>
                                        <strong>For Dates:</strong> published_date, date, published, pub_date
                                    </div>
                                    <div>
                                        <strong>For Images:</strong> image_url, image, thumbnail, cover
                                    </div>
                                </div>
                            </div>

                            <div className="divider"></div>

                            <div>
                                <h3 className="font-semibold mb-2">Example CSV:</h3>
                                <div className="mockup-code text-xs">
                                    <pre data-prefix="1"><code>url,title,topics,author,published_date</code></pre>
                                    <pre data-prefix="2"><code>https://example.com/article1,Great Article,"tech,ai",John Doe,2025-10-01</code></pre>
                                    <pre data-prefix="3"><code>https://example.com/article2,Another One,"science",Jane Smith,2025-10-02</code></pre>
                                </div>
                            </div>

                            <div className="alert alert-warning">
                                <i className="fa-solid fa-duotone fa-triangle-exclamation"></i>
                                <div className="text-sm">
                                    <strong>Note:</strong> Empty or invalid values in optional fields will be skipped with
                                    warnings logged. The import will continue successfully for valid records.
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Batch Upload Component */}
                <BatchUpload />

                {/* Tips & Best Practices */}
                <div className="card bg-base-200 shadow-md mt-6">
                    <div className="card-body">
                        <h2 className="card-title text-xl mb-4">
                            <i className="fa-solid fa-duotone fa-lightbulb text-warning"></i>
                            Tips & Best Practices
                        </h2>
                        <div className="space-y-3 text-sm">
                            <div className="flex gap-3">
                                <i className="fa-solid fa-duotone fa-check text-success mt-1"></i>
                                <div>
                                    <strong>Quality over quantity:</strong> Ensure URLs are valid and accessible before uploading
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <i className="fa-solid fa-duotone fa-check text-success mt-1"></i>
                                <div>
                                    <strong>Batch size:</strong> Keep batches under 2000 rows for optimal processing
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <i className="fa-solid fa-duotone fa-check text-success mt-1"></i>
                                <div>
                                    <strong>Duplicate handling:</strong> URLs already in the database will be skipped automatically
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <i className="fa-solid fa-duotone fa-check text-success mt-1"></i>
                                <div>
                                    <strong>Processing time:</strong> Large batches may take several minutes to process
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <i className="fa-solid fa-duotone fa-check text-success mt-1"></i>
                                <div>
                                    <strong>Error handling:</strong> Individual row failures won't stop the entire batch
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
