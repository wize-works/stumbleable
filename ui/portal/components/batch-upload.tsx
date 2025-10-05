'use client';

import { useToaster } from '@/components/toaster';
import { CrawlerAPI } from '@/lib/api-client';
import { useAuth } from '@clerk/nextjs';
import { useState } from 'react';

interface BatchUploadResult {
    success: boolean;
    columnMapping?: {
        [key: string]: string | null;
    };
    detectedColumns?: string[];
    summary: {
        totalRows: number;
        processed: number;
        succeeded: number;
        failed: number;
    };
    results: Array<{
        row: number;
        url: string;
        success: boolean;
        contentId?: string;
        error?: string;
    }>;
}

export default function BatchUploadComponent() {
    const { getToken } = useAuth();
    const { showToast } = useToaster();

    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [result, setResult] = useState<BatchUploadResult | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            if (!selectedFile.name.toLowerCase().endsWith('.csv')) {
                showToast('Please select a CSV file', 'error');
                return;
            }
            if (selectedFile.size > 10 * 1024 * 1024) {
                showToast('File size must be less than 10MB', 'error');
                return;
            }
            setFile(selectedFile);
            setResult(null);
        }
    };

    const handleUpload = async () => {
        if (!file) {
            showToast('Please select a file first', 'error');
            return;
        }

        try {
            setUploading(true);
            const token = await getToken();
            if (!token) {
                showToast('Authentication required', 'error');
                return;
            }

            const uploadResult = await CrawlerAPI.batchUpload(file, token);
            setResult(uploadResult);

            if (uploadResult.success) {
                showToast(
                    `Batch upload completed: ${uploadResult.summary.succeeded} succeeded, ${uploadResult.summary.failed} failed`,
                    uploadResult.summary.failed > 0 ? 'warning' : 'success'
                );
            } else {
                showToast('Batch upload failed', 'error');
            }
        } catch (error) {
            console.error('Upload error:', error);
            showToast(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
        } finally {
            setUploading(false);
        }
    };

    const downloadErrorReport = () => {
        if (!result) return;

        const failures = result.results.filter(r => !r.success);
        if (failures.length === 0) return;

        const csvContent = [
            ['Row', 'URL', 'Error'],
            ...failures.map(f => [f.row, f.url, f.error || 'Unknown error'])
        ]
            .map(row => row.map(cell => `"${cell}"`).join(','))
            .join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `batch-upload-errors-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="card bg-base-200 shadow-md">
            <div className="card-body">
                <h2 className="card-title text-xl mb-4">
                    <i className="fa-solid fa-duotone fa-file-arrow-up text-primary"></i>
                    Batch Content Upload
                </h2>

                {/* File Upload */}
                <div className="form-control">
                    <label className="label">
                        <span className="label-text font-semibold">Select CSV File</span>
                        <span className="label-text-alt">Max 10MB, 2000 rows</span>
                    </label>
                    <div className="flex gap-2">
                        <input
                            type="file"
                            accept=".csv"
                            onChange={handleFileChange}
                            className="file-input file-input-bordered file-input-primary w-full"
                            disabled={uploading}
                        />
                        <button
                            onClick={handleUpload}
                            disabled={!file || uploading}
                            className="btn btn-primary"
                        >
                            {uploading ? (
                                <>
                                    <span className="loading loading-spinner loading-sm"></span>
                                    Processing...
                                </>
                            ) : (
                                <>
                                    <i className="fa-solid fa-duotone fa-upload"></i>
                                    Upload
                                </>
                            )}
                        </button>
                    </div>
                    {file && (
                        <label className="label">
                            <span className="label-text-alt">
                                <i className="fa-solid fa-duotone fa-file-csv text-success"></i>
                                {' '}{file.name} ({(file.size / 1024).toFixed(1)} KB)
                            </span>
                        </label>
                    )}
                </div>

                {/* Results */}
                {result && (
                    <div className="mt-6">
                        <div className="divider">Upload Results</div>

                        {/* Column Mapping */}
                        {result.columnMapping && result.detectedColumns && (
                            <div className="alert alert-success mb-4">
                                <i className="fa-solid fa-duotone fa-table-columns"></i>
                                <div className="flex-1">
                                    <h3 className="font-bold">Detected Columns</h3>
                                    <div className="text-xs mt-1 space-y-1">
                                        {Object.entries(result.columnMapping).map(([ourField, csvColumn]) => (
                                            csvColumn && (
                                                <div key={ourField} className="badge badge-sm badge-outline gap-1">
                                                    <span className="text-primary font-semibold">{ourField}</span>
                                                    <i className="fa-solid fa-arrow-left text-xs opacity-50"></i>
                                                    <span>{csvColumn}</span>
                                                </div>
                                            )
                                        ))}
                                    </div>
                                    {result.detectedColumns.length > Object.values(result.columnMapping).filter(Boolean).length && (
                                        <p className="text-xs opacity-70 mt-2">
                                            <i className="fa-solid fa-duotone fa-info-circle"></i>
                                            {' '}Unmapped columns: {result.detectedColumns.filter(col =>
                                                !Object.values(result.columnMapping || {}).includes(col)
                                            ).join(', ')}
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Summary */}
                        <div className="stats stats-vertical lg:stats-horizontal shadow w-full mb-4">
                            <div className="stat">
                                <div className="stat-figure text-primary">
                                    <i className="fa-solid fa-duotone fa-file text-3xl"></i>
                                </div>
                                <div className="stat-title">Total Rows</div>
                                <div className="stat-value text-primary">{result.summary.totalRows}</div>
                            </div>
                            <div className="stat">
                                <div className="stat-figure text-success">
                                    <i className="fa-solid fa-duotone fa-check-circle text-3xl"></i>
                                </div>
                                <div className="stat-title">Succeeded</div>
                                <div className="stat-value text-success">{result.summary.succeeded}</div>
                            </div>
                            <div className="stat">
                                <div className="stat-figure text-error">
                                    <i className="fa-solid fa-duotone fa-times-circle text-3xl"></i>
                                </div>
                                <div className="stat-title">Failed</div>
                                <div className="stat-value text-error">{result.summary.failed}</div>
                            </div>
                        </div>

                        {/* Errors */}
                        {result.summary.failed > 0 && (
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="font-semibold text-error">
                                        <i className="fa-solid fa-duotone fa-exclamation-triangle"></i>
                                        {' '}Failed Rows ({result.summary.failed})
                                    </h3>
                                    <button
                                        onClick={downloadErrorReport}
                                        className="btn btn-sm btn-outline btn-error"
                                    >
                                        <i className="fa-solid fa-duotone fa-download"></i>
                                        Download Error Report
                                    </button>
                                </div>
                                <div className="overflow-x-auto max-h-96">
                                    <table className="table table-sm table-zebra">
                                        <thead>
                                            <tr>
                                                <th>Row</th>
                                                <th>URL</th>
                                                <th>Error</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {result.results
                                                .filter(r => !r.success)
                                                .map((r, idx) => (
                                                    <tr key={idx}>
                                                        <td>{r.row}</td>
                                                        <td className="truncate max-w-xs">
                                                            <a
                                                                href={r.url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="link link-hover text-xs"
                                                            >
                                                                {r.url}
                                                            </a>
                                                        </td>
                                                        <td className="text-error text-xs">{r.error}</td>
                                                    </tr>
                                                ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* Success Message */}
                        {result.summary.failed === 0 && (
                            <div className="alert alert-success">
                                <i className="fa-solid fa-duotone fa-check-circle"></i>
                                <span>
                                    All {result.summary.succeeded} rows processed successfully!
                                    Content is now pending moderation.
                                </span>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
