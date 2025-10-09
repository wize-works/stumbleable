'use client';

import { useToaster } from '@/components/toaster';
import { CrawlerAPI, UserAPI } from '@/lib/api-client';
import { useAuth } from '@clerk/nextjs';
import { useEffect, useState } from 'react';

interface CrawlerSource {
    id: string;
    name: string;
    type: 'rss' | 'sitemap' | 'web';
    url: string;
    domain: string;
    crawl_frequency_hours: number;
    topics: string[];
    enabled: boolean;
    created_at: string;
    updated_at: string;
    last_crawled_at?: string;
    next_crawl_at?: string;
}

interface CrawlerJob {
    id: string;
    source_id: string;
    status: 'running' | 'completed' | 'failed';
    started_at: string;
    completed_at?: string;
    items_found: number;
    items_submitted: number;
    items_failed: number;
    error_message?: string;
}

interface EnhancementStatus {
    total_content: number;
    needs_enhancement: number;
    already_scraped: number;
    has_image: number;
    has_author: number;
    has_content: number;
    has_word_count: number;
}

interface Topic {
    id: string;
    name: string;
    category?: string;
}

export default function CrawlerManagement() {
    const { getToken } = useAuth();
    const { showToast } = useToaster();

    const [sources, setSources] = useState<CrawlerSource[]>([]);
    const [jobs, setJobs] = useState<CrawlerJob[]>([]);
    const [enhancementStatus, setEnhancementStatus] = useState<EnhancementStatus | null>(null);
    const [enhancementRunning, setEnhancementRunning] = useState(false);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingSource, setEditingSource] = useState<CrawlerSource | null>(null);
    const [availableTopics, setAvailableTopics] = useState<Topic[]>([]);

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        type: 'rss' as 'rss' | 'sitemap' | 'web',
        url: '',
        crawl_frequency_hours: 24,
        topics: [] as string[],
        enabled: true
    });

    useEffect(() => {
        loadData();
        loadTopics();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const token = await getToken();
            if (!token) {
                showToast('Authentication required', 'error');
                return;
            }

            const [sourcesData, jobsData, statusData] = await Promise.all([
                CrawlerAPI.getSources(token),
                CrawlerAPI.getJobs(token),
                CrawlerAPI.getEnhancementStatus(token)
            ]);
            setSources(sourcesData);
            setJobs(jobsData);
            setEnhancementStatus(statusData);
        } catch (error) {
            console.error('Error loading crawler data:', error);
            showToast('Failed to load crawler data', 'error');
        } finally {
            setLoading(false);
        }
    };

    const loadTopics = async () => {
        try {
            const token = await getToken();
            if (!token) {
                console.warn('No token available for loading topics');
                return;
            }

            console.log('Fetching topics from UserAPI...');
            const topics = await UserAPI.getTopics(token);
            console.log('Topics loaded:', topics);
            setAvailableTopics(topics);
        } catch (error) {
            console.error('Error loading topics:', error);
            showToast('Failed to load topics', 'error');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const token = await getToken();
            if (!token) {
                showToast('Authentication required', 'error');
                return;
            }

            if (editingSource) {
                await CrawlerAPI.updateSource(editingSource.id, formData, token);
                showToast('Source updated successfully', 'success');
            } else {
                await CrawlerAPI.createSource(formData, token);
                showToast('Source created successfully', 'success');
            }

            resetForm();
            loadData();
        } catch (error) {
            console.error('Error saving source:', error);
            showToast('Failed to save source', 'error');
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            type: 'rss',
            url: '',
            crawl_frequency_hours: 24,
            topics: [],
            enabled: true
        });
        setShowAddForm(false);
        setEditingSource(null);
    };

    const handleEdit = (source: CrawlerSource) => {
        setEditingSource(source);
        setFormData({
            name: source.name,
            type: source.type,
            url: source.url,
            crawl_frequency_hours: source.crawl_frequency_hours,
            topics: source.topics,
            enabled: source.enabled
        });
        setShowAddForm(true);
    };

    const handleDelete = async (sourceId: string) => {
        if (!confirm('Are you sure you want to delete this source?')) return;

        try {
            const token = await getToken();
            if (!token) {
                showToast('Authentication required', 'error');
                return;
            }

            await CrawlerAPI.deleteSource(sourceId, token);
            showToast('Source deleted successfully', 'success');
            loadData();
        } catch (error) {
            console.error('Error deleting source:', error);
            showToast('Failed to delete source', 'error');
        }
    };

    const handleToggleEnabled = async (source: CrawlerSource) => {
        try {
            const token = await getToken();
            if (!token) {
                showToast('Authentication required', 'error');
                return;
            }

            await CrawlerAPI.updateSource(source.id, { enabled: !source.enabled }, token);
            showToast(`Source ${source.enabled ? 'disabled' : 'enabled'}`, 'success');
            loadData();
        } catch (error) {
            console.error('Error toggling source:', error);
            showToast('Failed to update source', 'error');
        }
    };

    const handleTriggerCrawl = async (sourceId: string) => {
        try {
            const token = await getToken();
            if (!token) {
                showToast('Authentication required', 'error');
                return;
            }

            await CrawlerAPI.triggerCrawl(sourceId, token);
            showToast('Manual crawl started', 'success');
            loadData(); // Refresh to show new job
        } catch (error) {
            console.error('Error triggering crawl:', error);
            showToast('Failed to start crawl', 'error');
        }
    };

    const handleEnhanceMetadata = async (batchSize: number = 10) => {
        if (!enhancementStatus || enhancementStatus.needs_enhancement === 0) {
            showToast('No content needs enhancement', 'info');
            return;
        }

        try {
            setEnhancementRunning(true);
            const token = await getToken();
            if (!token) {
                showToast('Authentication required', 'error');
                return;
            }

            const result = await CrawlerAPI.enhanceMetadata({ batchSize }, token);
            showToast(
                `Enhanced ${result.enhanced} of ${result.processed} items`,
                result.enhanced > 0 ? 'success' : 'info'
            );
            loadData(); // Refresh status
        } catch (error) {
            console.error('Error enhancing metadata:', error);
            showToast('Failed to enhance metadata', 'error');
        } finally {
            setEnhancementRunning(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-base-content/60">Loading crawler data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-base-content">Crawler Management</h1>
                    <p className="text-base-content/60 mt-2">
                        Manage content sources, RSS feeds, and sitemaps for automatic discovery
                    </p>
                </div>
                <button
                    onClick={() => setShowAddForm(!showAddForm)}
                    className="btn btn-primary"
                >
                    <i className="fa-solid fa-duotone fa-plus mr-2" />
                    Add Source
                </button>
            </div>

            {/* Add/Edit Form */}
            {showAddForm && (
                <div className="card bg-base-100 shadow-xl">
                    <div className="card-body">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="card-title">
                                {editingSource ? 'Edit Source' : 'Add New Source'}
                            </h2>
                            <button
                                onClick={resetForm}
                                className="btn btn-ghost btn-sm"
                            >
                                <i className="fa-solid fa-duotone fa-times" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className='space-y-4'>
                                    <div className="form-control">
                                        <label className="label w-full">
                                            <span className="label-text">Name</span>
                                        </label>
                                        <input
                                            type="text"
                                            className="input input-bordered w-full"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            placeholder="e.g., TechCrunch RSS"
                                            required
                                        />
                                    </div>

                                    <div className="form-control">
                                        <label className="label w-full">
                                            <span className="label-text">Type</span>
                                        </label>
                                        <select
                                            className="select select-bordered w-full"
                                            value={formData.type}
                                            onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                                        >
                                            <option value="rss">RSS Feed</option>
                                            <option value="sitemap">Sitemap</option>
                                            <option value="web">Website (Auto-discover)</option>
                                        </select>
                                    </div>
                                    <div className="form-control">
                                        <label className="label w-full">
                                            <span className="label-text">URL</span>
                                        </label>
                                        <input
                                            type="url"
                                            className="input input-bordered w-full"
                                            value={formData.url}
                                            onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                                            placeholder="https://example.com/feed.xml"
                                            required
                                        />
                                        <label className="label w-full">
                                            <span className="label-text-alt">
                                                {formData.type === 'rss' && 'RSS/Atom feed URL'}
                                                {formData.type === 'sitemap' && 'XML sitemap URL'}
                                                {formData.type === 'web' && 'Website homepage URL (will auto-discover feeds/sitemaps)'}
                                            </span>
                                        </label>
                                        <div className="form-control">
                                            <label className="label w-full">
                                                <span className="label-text">Crawl Frequency (hours)</span>
                                            </label>
                                            <input
                                                type="number"
                                                className="input input-bordered w-full"
                                                value={formData.crawl_frequency_hours}
                                                onChange={(e) => setFormData({ ...formData, crawl_frequency_hours: parseInt(e.target.value) })}
                                                min="1"
                                                max="168"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="form-control">
                                    <label className="label w-full">
                                        <span className="label-text">Topics</span>
                                    </label>

                                    {availableTopics.length === 0 ? (
                                        <div className="flex items-center justify-center p-8 bg-base-200 rounded-lg">
                                            <span className="loading loading-spinner loading-md mr-2"></span>
                                            <span>Loading topics...</span>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 p-4 rounded-lg max-h-64 overflow-y-auto border border-base-300">
                                            {availableTopics.map((topic) => (
                                                <button
                                                    key={topic.id}
                                                    type="button"
                                                    onClick={() => {
                                                        const isSelected = formData.topics.includes(topic.id);
                                                        setFormData({
                                                            ...formData,
                                                            topics: isSelected
                                                                ? formData.topics.filter(id => id !== topic.id)
                                                                : [...formData.topics, topic.id]
                                                        });
                                                    }}
                                                    className={`p-3 rounded-lg border-2 transition-all duration-200 text-left ${formData.topics.includes(topic.id)
                                                        ? 'border-primary bg-primary/10 text-primary'
                                                        : 'border-base-300 hover:border-primary/50'
                                                        }`}
                                                >
                                                    <div className="font-medium capitalize text-sm">{topic.name}</div>
                                                    {topic.category && (
                                                        <div className="text-xs text-base-content/60 mt-1">
                                                            {topic.category}
                                                        </div>
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    <label className="label w-full">
                                        <span className="label-text-alt">
                                            {formData.topics.length > 0
                                                ? `${formData.topics.length} topic${formData.topics.length !== 1 ? 's' : ''} selected`
                                                : 'Click topics to select them'
                                            }
                                        </span>
                                    </label>
                                </div>
                            </div>

                            <div className="form-control">
                                <label className="cursor-pointer label justify-start gap-3">
                                    <input
                                        type="checkbox"
                                        className="checkbox checkbox-primary"
                                        checked={formData.enabled}
                                        onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                                    />
                                    <span className="label-text">Enabled</span>
                                </label>
                            </div>

                            <div className="card-actions justify-end">
                                <button type="button" onClick={resetForm} className="btn btn-ghost">
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    {editingSource ? 'Update Source' : 'Create Source'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Metadata Enhancement Status */}
            {enhancementStatus && (
                <div className="card bg-base-100 shadow-xl">
                    <div className="card-body">
                        <div className="flex justify-between items-center mb-4">
                            <div className="flex-1">
                                <div className='flex flex-col md:flex-row md:items-center md:gap-4 justify-between'>
                                    <div>
                                        <h2 className="card-title">Content Metadata Enhancement</h2>
                                        <p className="text-base-content/60 text-sm mt-1">
                                            Enrich crawled content with missing metadata (images, authors, descriptions)
                                        </p>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <div className="text-xs text-base-content/60 text-center md:text-right mb-1">Manual Enhancement</div>
                                        <div className='flex flex-row gap-2'>
                                            <button
                                                onClick={() => handleEnhanceMetadata(10)}
                                                disabled={enhancementRunning || enhancementStatus.needs_enhancement === 0}
                                                className="btn btn-primary btn-sm"
                                            >
                                                {enhancementRunning ? (
                                                    <>
                                                        <span className="loading loading-spinner loading-xs"></span>
                                                        Processing...
                                                    </>
                                                ) : (
                                                    <>
                                                        <i className="fa-solid fa-duotone fa-wand-magic-sparkles mr-1" />
                                                        Enhance 10
                                                    </>
                                                )}
                                            </button>
                                            <button
                                                onClick={() => handleEnhanceMetadata(50)}
                                                disabled={enhancementRunning || enhancementStatus.needs_enhancement === 0}
                                                className="btn btn-primary btn-sm"
                                            >
                                                <i className="fa-solid fa-duotone fa-wand-magic-sparkles mr-1" />
                                                Enhance 50
                                            </button>
                                            <button
                                                onClick={() => handleEnhanceMetadata(100)}
                                                disabled={enhancementRunning || enhancementStatus.needs_enhancement === 0}
                                                className="btn btn-primary btn-sm"
                                            >
                                                <i className="fa-solid fa-duotone fa-wand-magic-sparkles mr-1" />
                                                Enhance 100
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <div className="alert alert-info mt-3">
                                    <i className="fa-solid fa-duotone fa-robot text-info" />
                                    <div className="flex-1">
                                        <p className="font-semibold">🤖 Automatic Enhancement Active</p>
                                        <p className="text-sm">
                                            The scheduler processes 20 items every 30 minutes automatically.
                                            At {enhancementStatus.needs_enhancement} items remaining, completion in approximately{' '}
                                            <span className="font-semibold">
                                                {Math.ceil((enhancementStatus.needs_enhancement / 20) * 0.5)} hours
                                            </span>.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="mb-6">
                            <div className="flex justify-between text-sm mb-2">
                                <span className="font-semibold">Enhancement Progress</span>
                                <span className="text-base-content/60">
                                    {((enhancementStatus.already_scraped / enhancementStatus.total_content || 0) * 100).toFixed(1)}% Complete
                                </span>
                            </div>
                            <div className="w-full bg-base-300 rounded-full h-4 overflow-hidden">
                                <div
                                    className="bg-gradient-to-r from-success to-primary h-full transition-all duration-500 flex items-center justify-center text-xs text-white font-semibold"
                                    style={{
                                        width: `${((enhancementStatus.already_scraped / enhancementStatus.total_content || 0) * 100).toFixed(1)}%`,
                                        minWidth: '30px'
                                    }}
                                >
                                    {enhancementStatus.already_scraped}/{enhancementStatus.total_content}
                                </div>
                            </div>
                        </div>

                        <div className="stats stats-vertical lg:stats-horizontal shadow w-full">
                            <div className="stat">
                                <div className="stat-title">Total Content</div>
                                <div className="stat-value">{enhancementStatus.total_content}</div>
                                <div className="stat-desc">Items in database</div>
                            </div>

                            <div className="stat">
                                <div className="stat-title">Not Scraped</div>
                                <div className="stat-value text-warning">{enhancementStatus.needs_enhancement}</div>
                                <div className="stat-desc">Never attempted</div>
                            </div>

                            <div className="stat">
                                <div className="stat-title">Already Scraped</div>
                                <div className="stat-value text-success">{enhancementStatus.already_scraped || 0}</div>
                                <div className="stat-desc">
                                    {((enhancementStatus.already_scraped / enhancementStatus.total_content || 0) * 100).toFixed(0)}% complete
                                </div>
                            </div>

                            <div className="stat">
                                <div className="stat-title">Has Image</div>
                                <div className="stat-value ">{enhancementStatus.has_image}</div>
                                <div className="stat-desc">
                                    {((enhancementStatus.has_image / enhancementStatus.total_content) * 100).toFixed(0)}% coverage
                                </div>
                            </div>

                            <div className="stat">
                                <div className="stat-title">Has Author</div>
                                <div className="stat-value ">{enhancementStatus.has_author}</div>
                                <div className="stat-desc">
                                    {((enhancementStatus.has_author / enhancementStatus.total_content) * 100).toFixed(0)}% coverage
                                </div>
                            </div>

                            <div className="stat">
                                <div className="stat-title">Has Content</div>
                                <div className="stat-value ">{enhancementStatus.has_content}</div>
                                <div className="stat-desc">
                                    {((enhancementStatus.has_content / enhancementStatus.total_content) * 100).toFixed(0)}% coverage
                                </div>
                            </div>

                            <div className="stat">
                                <div className="stat-title">Has Word Count</div>
                                <div className="stat-value ">{enhancementStatus.has_word_count}</div>
                                <div className="stat-desc">
                                    {((enhancementStatus.has_word_count / enhancementStatus.total_content) * 100).toFixed(0)}% coverage
                                </div>
                            </div>
                        </div>

                        {enhancementStatus.needs_enhancement > 0 && (
                            <div className="alert alert-info mt-4">
                                <i className="fa-solid fa-duotone fa-info-circle" />
                                <div>
                                    <h3 className="font-bold">About Metadata Enhancement</h3>
                                    <p className="">
                                        This process scrapes missing metadata from crawled URLs. It's rate-limited to avoid
                                        overwhelming servers (500ms between requests). Process {enhancementStatus.needs_enhancement} items
                                        in batches of 10-100.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Sources List */}
            <div className="card bg-base-100 shadow-xl">
                <div className="card-body">
                    <h2 className="card-title mb-4">Content Sources ({sources.length})</h2>

                    {sources.length === 0 ? (
                        <div className="text-center py-8">
                            <i className="fa-solid fa-duotone fa-rss text-4xl text-base-content/30 mb-4" />
                            <p className="text-base-content/60">No content sources configured</p>
                            <p className="text-sm text-base-content/40 mt-2">
                                Add RSS feeds, sitemaps, or websites to start discovering content automatically
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="table table-zebra">
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Type</th>
                                        <th>URL</th>
                                        <th>Frequency</th>
                                        <th>Topics</th>
                                        <th>Status</th>
                                        <th>Last Crawled</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sources.map((source) => (
                                        <tr key={source.id}>
                                            <td className="font-medium">{source.name}</td>
                                            <td>
                                                <div className="badge badge-outline">
                                                    {source.type.toUpperCase()}
                                                </div>
                                            </td>
                                            <td>
                                                <a
                                                    href={source.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="link link-primary "
                                                >
                                                    {source.domain}
                                                </a>
                                            </td>
                                            <td>{source.crawl_frequency_hours}h</td>
                                            <td>
                                                <div className="flex flex-wrap gap-1">
                                                    {source.topics.slice(0, 2).map((topic) => (
                                                        <div key={topic} className="badge badge-ghost badge-sm">
                                                            {topic}
                                                        </div>
                                                    ))}
                                                    {source.topics.length > 2 && (
                                                        <div className="badge badge-ghost badge-sm">
                                                            +{source.topics.length - 2}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td>
                                                <div
                                                    className={`badge ${source.enabled ? 'badge-success' : 'badge-error'
                                                        }`}
                                                >
                                                    {source.enabled ? 'Enabled' : 'Disabled'}
                                                </div>
                                            </td>
                                            <td className="">
                                                {source.last_crawled_at
                                                    ? new Date(source.last_crawled_at).toLocaleDateString()
                                                    : 'Never'
                                                }
                                            </td>
                                            <td>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleEdit(source)}
                                                        className="btn btn-ghost btn-sm"
                                                        title="Edit"
                                                    >
                                                        <i className="fa-solid fa-duotone fa-edit" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleTriggerCrawl(source.id)}
                                                        className="btn btn-primary btn-sm"
                                                        title="Start Manual Crawl"
                                                        disabled={!source.enabled}
                                                    >
                                                        <i className="fa-solid fa-duotone fa-play" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleToggleEnabled(source)}
                                                        className={`btn btn-sm ${source.enabled ? 'btn-warning' : 'btn-success'
                                                            }`}
                                                        title={source.enabled ? 'Disable' : 'Enable'}
                                                    >
                                                        <i className={`fa-solid fa-duotone ${source.enabled ? 'fa-pause' : 'fa-play'
                                                            }`} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(source.id)}
                                                        className="btn btn-error btn-sm"
                                                        title="Delete"
                                                    >
                                                        <i className="fa-solid fa-duotone fa-trash" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Recent Jobs */}
            <div className="card bg-base-100 shadow-xl">
                <div className="card-body">
                    <h2 className="card-title mb-4">Recent Crawl Jobs</h2>

                    {jobs.length === 0 ? (
                        <div className="text-center py-4">
                            <p className="text-base-content/60">No crawl jobs yet</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="table table-zebra">
                                <thead>
                                    <tr>
                                        <th>Source</th>
                                        <th>Started</th>
                                        <th>Status</th>
                                        <th>Found</th>
                                        <th>Submitted</th>
                                        <th>Failed</th>
                                        <th>Duration</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {jobs.slice(0, 10).map((job) => {
                                        const source = sources.find(s => s.id === job.source_id);
                                        return (
                                            <tr key={job.id}>
                                                <td className="font-medium">
                                                    {source ? source.name : 'Unknown Source'}
                                                </td>
                                                <td className="">
                                                    {new Date(job.started_at).toLocaleString()}
                                                </td>
                                                <td>
                                                    <div
                                                        className={`badge ${job.status === 'completed'
                                                            ? 'badge-success'
                                                            : job.status === 'failed'
                                                                ? 'badge-error'
                                                                : 'badge-warning'
                                                            }`}
                                                    >
                                                        {job.status}
                                                    </div>
                                                </td>
                                                <td>{job.items_found}</td>
                                                <td>{job.items_submitted}</td>
                                                <td>{job.items_failed}</td>
                                                <td className="">
                                                    {job.completed_at
                                                        ? `${Math.round(
                                                            (new Date(job.completed_at).getTime() -
                                                                new Date(job.started_at).getTime()) / 1000
                                                        )}s`
                                                        : 'Running...'
                                                    }
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}