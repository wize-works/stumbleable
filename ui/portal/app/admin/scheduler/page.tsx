'use client';

import Breadcrumbs from '@/components/breadcrumbs';
import { useToaster } from '@/components/toaster';
import { JobExecution, JobStats, ScheduledJob, SchedulerAPI } from '@/lib/api-client';
import { useAuth, useUser } from '@clerk/nextjs';
import { useEffect, useState } from 'react';

export default function SchedulerManagementPage() {
    const { getToken } = useAuth();
    const { user } = useUser();
    const { showToast } = useToaster();
    const [jobs, setJobs] = useState<ScheduledJob[]>([]);
    const [selectedJob, setSelectedJob] = useState<ScheduledJob | null>(null);
    const [executions, setExecutions] = useState<JobExecution[]>([]);
    const [stats, setStats] = useState<JobStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [executing, setExecuting] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Cron editor state
    const [editingCron, setEditingCron] = useState<{ jobName: string; expression: string } | null>(null);
    const [cronError, setCronError] = useState<string | null>(null);
    const [savingCron, setSavingCron] = useState(false);

    // Confirmation dialog state
    const [confirmation, setConfirmation] = useState<{
        action: string;
        jobName: string;
        onConfirm: () => void;
    } | null>(null);

    useEffect(() => {
        loadJobs();
    }, []);

    const loadJobs = async () => {
        try {
            setLoading(true);
            const token = await getToken();
            if (!token) return;

            const jobsData = await SchedulerAPI.getScheduledJobs(token);
            setJobs(jobsData);
        } catch (err: any) {
            console.error('Failed to load jobs:', err);
            setError(err.message || 'Failed to load scheduled jobs');
        } finally {
            setLoading(false);
        }
    };

    const loadJobDetails = async (jobName: string) => {
        try {
            const token = await getToken();
            if (!token) return;

            const job = jobs.find((j) => j.name === jobName);
            if (!job) return;

            setSelectedJob(job);

            // Load execution history
            const historyData = await SchedulerAPI.getJobHistory(jobName, token, 10, 0);
            setExecutions(historyData.executions);

            // Load statistics
            const statsData = await SchedulerAPI.getJobStats(jobName, token, 30);
            setStats(statsData.stats);
        } catch (err: any) {
            console.error('Failed to load job details:', err);
        }
    };

    const handleTriggerJob = async (jobName: string) => {
        try {
            setExecuting(jobName);
            const token = await getToken();
            if (!token || !user) return;

            await SchedulerAPI.triggerJob(jobName, user.id, token);

            // Reload jobs and details
            await loadJobs();
            if (selectedJob?.name === jobName) {
                await loadJobDetails(jobName);
            }

            showToast(`Job ${jobName} triggered successfully!`, 'success');
        } catch (err: any) {
            console.error('Failed to trigger job:', err);
            showToast(`Failed to trigger job: ${err.message}`, 'error');
        } finally {
            setExecuting(null);
        }
    };

    const handleToggleJob = async (jobName: string, enabled: boolean) => {
        const action = enabled ? 'disable' : 'enable';
        const job = jobs.find(j => j.name === jobName);

        setConfirmation({
            action: `${action} ${job?.displayName || jobName}`,
            jobName,
            onConfirm: async () => {
                try {
                    const token = await getToken();
                    if (!token) return;

                    if (enabled) {
                        await SchedulerAPI.disableJob(jobName, token);
                    } else {
                        await SchedulerAPI.enableJob(jobName, token);
                    }

                    // Reload jobs
                    await loadJobs();
                    if (selectedJob?.name === jobName) {
                        await loadJobDetails(jobName);
                    }
                } catch (err: any) {
                    console.error('Failed to toggle job:', err);
                    showToast(`Failed to ${action} job: ${err.message}`, 'error');
                } finally {
                    setConfirmation(null);
                }
            }
        });
    };

    const handleEditCron = (jobName: string, currentExpression: string) => {
        setEditingCron({ jobName, expression: currentExpression });
        setCronError(null);
    };

    const handleSaveCron = async () => {
        if (!editingCron) return;

        try {
            setSavingCron(true);
            setCronError(null);

            const token = await getToken();
            if (!token) return;

            await SchedulerAPI.updateJobCron(editingCron.jobName, editingCron.expression, token);

            // Reload jobs
            await loadJobs();
            if (selectedJob?.name === editingCron.jobName) {
                await loadJobDetails(editingCron.jobName);
            }

            setEditingCron(null);
        } catch (err: any) {
            console.error('Failed to update cron:', err);
            setCronError(err.message || 'Failed to update schedule');
        } finally {
            setSavingCron(false);
        }
    };

    const describeCronExpression = (cron: string): string => {
        // Basic cron description - can be enhanced with a library like cronstrue
        const parts = cron.trim().split(/\s+/);
        if (parts.length !== 5 && parts.length !== 6) return cron;

        const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;

        try {
            // Simple patterns
            if (cron === '0 9 * * MON') return 'Every Monday at 9:00 AM';
            if (cron === '0 9 * * *') return 'Every day at 9:00 AM';
            if (cron === '0 */6 * * *') return 'Every 6 hours';
            if (cron === '*/30 * * * *') return 'Every 30 minutes';
            if (cron === '0 0 * * *') return 'Daily at midnight';
            if (cron === '0 0 * * 0') return 'Every Sunday at midnight';
            if (cron === '0 0 1 * *') return 'Monthly on the 1st at midnight';

            // Generic description
            let desc = 'Runs ';
            if (minute === '0' && hour !== '*') desc += `at ${hour}:00 `;
            else if (minute.startsWith('*/')) desc += `every ${minute.slice(2)} minutes `;

            if (dayOfWeek !== '*') {
                const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                const dayIndex = parseInt(dayOfWeek);
                if (!isNaN(dayIndex)) desc += `on ${days[dayIndex]} `;
            }

            return desc.trim() || cron;
        } catch {
            return cron;
        }
    };

    const formatDuration = (ms: number | null) => {
        if (!ms) return 'N/A';
        if (ms < 1000) return `${ms}ms`;
        const seconds = Math.floor(ms / 1000);
        if (seconds < 60) return `${seconds}s`;
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}m ${remainingSeconds}s`;
    };

    const formatDate = (date: string | null) => {
        if (!date) return 'Never';
        return new Date(date).toLocaleString();
    };

    const getStatusBadge = (status: string | null) => {
        if (!status) return <span className="badge">Unknown</span>;
        if (status === 'completed') return <span className="badge badge-success">Completed</span>;
        if (status === 'failed') return <span className="badge badge-error">Failed</span>;
        if (status === 'running') return <span className="badge badge-warning">Running</span>;
        return <span className="badge">{status}</span>;
    };

    if (loading) {
        return (
            <div className="container mx-auto p-6">
                <div className="flex items-center justify-center min-h-[400px]">
                    <span className="loading loading-spinner loading-lg"></span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mx-auto p-6">
                <div className="alert alert-error">
                    <i className="fa-solid fa-duotone fa-triangle-exclamation"></i>
                    <span>{error}</span>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6 space-y-6">
            <Breadcrumbs items={[
                { label: 'Home', href: '/' },
                { label: 'Admin Dashboard', href: '/admin' },
                { label: 'Job Scheduler', href: '/admin/scheduler' }
            ]} />

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Job Scheduler</h1>
                    <p className="text-base-content/70 mt-2">
                        Manage scheduled jobs and view execution history
                    </p>
                </div>
                <button onClick={loadJobs} className="btn btn-primary">
                    <i className="fa-solid fa-duotone fa-rotate"></i>
                    Refresh
                </button>
            </div>

            {/* Jobs Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {jobs.map((job) => (
                    <div
                        key={job.name}
                        className={`card bg-base-200 shadow-md hover:shadow-lg transition-shadow cursor-pointer ${selectedJob?.name === job.name ? 'ring-2 ring-primary' : ''
                            } ${!job.enabled ? 'opacity-60' : ''}`}
                        onClick={() => loadJobDetails(job.name)}
                    >
                        <div className="card-body">
                            {/* Header */}
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <h3 className="card-title text-lg">{job.displayName}</h3>
                                        {!job.enabled && (
                                            <span className="badge badge-sm badge-ghost">Disabled</span>
                                        )}
                                    </div>
                                    <p className="text-sm text-base-content/70 mt-1">{job.description}</p>
                                </div>
                                <div className="form-control tooltip tooltip-left" data-tip={job.enabled ? "Disable job" : "Enable job"}>
                                    <input
                                        type="checkbox"
                                        className="toggle toggle-success"
                                        checked={job.enabled}
                                        onChange={(e) => {
                                            e.stopPropagation();
                                            handleToggleJob(job.name, job.enabled);
                                        }}
                                    />
                                </div>
                            </div>

                            {/* Schedule */}
                            <div className="space-y-2 mt-4">
                                <div className="flex items-center justify-between gap-2 text-sm">
                                    <div className="flex items-center gap-2 flex-1">
                                        <i className="fa-solid fa-duotone fa-clock w-4"></i>
                                        <span className="font-mono text-xs">{job.cronExpression}</span>
                                    </div>
                                    <button
                                        className="btn btn-xs btn-ghost"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleEditCron(job.name, job.cronExpression);
                                        }}
                                        title="Edit schedule"
                                    >
                                        <i className="fa-solid fa-duotone fa-edit"></i>
                                    </button>
                                </div>
                                <div className="text-xs text-base-content/60 italic pl-6">
                                    {describeCronExpression(job.cronExpression)}
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                    <i className="fa-solid fa-duotone fa-calendar w-4"></i>
                                    <span className="text-base-content/70">
                                        Next: {formatDate(job.nextRunAt)}
                                    </span>
                                </div>
                            </div>

                            {/* Stats */}
                            <div className="stats stats-vertical mt-4 bg-base-100">
                                <div className="stat py-2 px-3">
                                    <div className="stat-title text-xs">Total Runs</div>
                                    <div className="stat-value text-lg">{job.totalRuns}</div>
                                </div>
                                <div className="stat py-2 px-3">
                                    <div className="stat-title text-xs">Success Rate</div>
                                    <div className="stat-value text-lg">
                                        {job.totalRuns > 0
                                            ? Math.round((job.successfulRuns / job.totalRuns) * 100)
                                            : 0}
                                        %
                                    </div>
                                </div>
                            </div>

                            {/* Last Run */}
                            <div className="mt-4 text-sm">
                                <div className="flex items-center justify-between">
                                    <span className="text-base-content/70">Last Run:</span>
                                    {getStatusBadge(job.lastRunStatus)}
                                </div>
                                <div className="text-base-content/70 mt-1">
                                    {formatDate(job.lastRunAt)}
                                </div>
                                {job.lastRunDuration && (
                                    <div className="text-base-content/70 mt-1">
                                        Duration: {formatDuration(job.lastRunDuration)}
                                    </div>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="card-actions mt-4">
                                <button
                                    className="btn btn-sm btn-primary w-full"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleTriggerJob(job.name);
                                    }}
                                    disabled={executing === job.name}
                                >
                                    {executing === job.name ? (
                                        <>
                                            <span className="loading loading-spinner loading-xs"></span>
                                            Running...
                                        </>
                                    ) : (
                                        <>
                                            <i className="fa-solid fa-duotone fa-play"></i>
                                            Trigger Now
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Job Details Panel */}
            {selectedJob && (
                <div className="card bg-base-200 shadow-lg">
                    <div className="card-body">
                        <h2 className="card-title text-2xl mb-4">
                            {selectedJob.displayName} - Details
                        </h2>

                        {/* Statistics */}
                        {stats && (
                            <div className="mb-6">
                                <h3 className="text-lg font-semibold mb-3">Last 30 Days Statistics</h3>
                                <div className="stats stats-horizontal shadow w-full">
                                    <div className="stat">
                                        <div className="stat-title">Total Executions</div>
                                        <div className="stat-value text-primary">{stats.total_executions}</div>
                                    </div>
                                    <div className="stat">
                                        <div className="stat-title">Successful</div>
                                        <div className="stat-value text-success">{stats.successful_executions}</div>
                                    </div>
                                    <div className="stat">
                                        <div className="stat-title">Failed</div>
                                        <div className="stat-value text-error">{stats.failed_executions}</div>
                                    </div>
                                    <div className="stat">
                                        <div className="stat-title">Avg Duration</div>
                                        <div className="stat-value text-sm">
                                            {formatDuration(stats.avg_duration_ms)}
                                        </div>
                                    </div>
                                    <div className="stat">
                                        <div className="stat-title">Items Processed</div>
                                        <div className="stat-value text-sm">{stats.total_items_processed}</div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Execution History */}
                        <div>
                            <h3 className="text-lg font-semibold mb-3">Recent Executions</h3>
                            <div className="overflow-x-auto">
                                <table className="table table-zebra">
                                    <thead>
                                        <tr>
                                            <th>Started</th>
                                            <th>Status</th>
                                            <th>Duration</th>
                                            <th>Processed</th>
                                            <th>Success</th>
                                            <th>Failed</th>
                                            <th>Triggered By</th>
                                            <th>Error</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {executions.length === 0 ? (
                                            <tr>
                                                <td colSpan={8} className="text-center text-base-content/70">
                                                    No executions yet
                                                </td>
                                            </tr>
                                        ) : (
                                            executions.map((execution) => (
                                                <tr key={execution.id}>
                                                    <td className="text-sm">{formatDate(execution.started_at)}</td>
                                                    <td>{getStatusBadge(execution.status)}</td>
                                                    <td className="text-sm">
                                                        {formatDuration(execution.duration_ms)}
                                                    </td>
                                                    <td>{execution.items_processed}</td>
                                                    <td className="text-success">{execution.items_succeeded}</td>
                                                    <td className="text-error">{execution.items_failed}</td>
                                                    <td>
                                                        <span className="badge badge-sm">
                                                            {execution.triggered_by}
                                                        </span>
                                                    </td>
                                                    <td className="text-sm text-error max-w-xs truncate">
                                                        {execution.error_message || '-'}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Cron Editor Modal */}
            {editingCron && (
                <div className="modal modal-open">
                    <div className="modal-box max-w-2xl">
                        <h3 className="font-bold text-lg mb-4">Edit Schedule</h3>

                        <div className="space-y-4">
                            <div>
                                <label className="label">
                                    <span className="label-text font-semibold">Cron Expression</span>
                                </label>
                                <input
                                    type="text"
                                    className={`input input-bordered w-full font-mono ${cronError ? 'input-error' : ''}`}
                                    value={editingCron.expression}
                                    onChange={(e) => {
                                        setEditingCron({ ...editingCron, expression: e.target.value });
                                        setCronError(null);
                                    }}
                                    placeholder="0 9 * * MON"
                                />
                                {cronError && (
                                    <label className="label">
                                        <span className="label-text-alt text-error">{cronError}</span>
                                    </label>
                                )}
                            </div>

                            <div className="bg-base-200 p-4 rounded-lg">
                                <p className="text-sm font-semibold mb-2">Preview:</p>
                                <p className="text-base-content/70">
                                    {describeCronExpression(editingCron.expression)}
                                </p>
                            </div>

                            <div className="bg-info/10 p-4 rounded-lg">
                                <p className="text-sm font-semibold mb-2">
                                    <i className="fa-solid fa-duotone fa-info-circle mr-2"></i>
                                    Cron Format Guide
                                </p>
                                <div className="text-xs space-y-1 text-base-content/70">
                                    <p><code className="bg-base-300 px-1 rounded">* * * * *</code> = minute hour day month weekday</p>
                                    <p><code className="bg-base-300 px-1 rounded">0 9 * * *</code> = Daily at 9:00 AM</p>
                                    <p><code className="bg-base-300 px-1 rounded">0 9 * * MON</code> = Every Monday at 9:00 AM</p>
                                    <p><code className="bg-base-300 px-1 rounded">*/30 * * * *</code> = Every 30 minutes</p>
                                    <p><code className="bg-base-300 px-1 rounded">0 */6 * * *</code> = Every 6 hours</p>
                                </div>
                            </div>
                        </div>

                        <div className="modal-action">
                            <button
                                className="btn btn-ghost"
                                onClick={() => {
                                    setEditingCron(null);
                                    setCronError(null);
                                }}
                                disabled={savingCron}
                            >
                                Cancel
                            </button>
                            <button
                                className="btn btn-primary"
                                onClick={handleSaveCron}
                                disabled={savingCron}
                            >
                                {savingCron ? (
                                    <>
                                        <span className="loading loading-spinner loading-xs"></span>
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <i className="fa-solid fa-duotone fa-save"></i>
                                        Save Schedule
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Confirmation Dialog */}
            {confirmation && (
                <div className="modal modal-open">
                    <div className="modal-box">
                        <h3 className="font-bold text-lg">Confirm Action</h3>
                        <p className="py-4">
                            Are you sure you want to <strong>{confirmation.action}</strong>?
                        </p>
                        <div className="modal-action">
                            <button
                                className="btn btn-ghost"
                                onClick={() => setConfirmation(null)}
                            >
                                Cancel
                            </button>
                            <button
                                className="btn btn-primary"
                                onClick={confirmation.onConfirm}
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
