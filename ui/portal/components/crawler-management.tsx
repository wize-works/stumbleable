'use client';

import { useToaster } from '@/components/toaster';
import { CrawlerAPI, UserAPI } from '@/lib/api-client';
import { useAuth } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import JobDetailModal from './job-detail-modal';
import Pagination from './pagination';

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
    const [sourcesLoading, setSourcesLoading] = useState(true);
    const [jobsLoading, setJobsLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingSource, setEditingSource] = useState<CrawlerSource | null>(null);
    const [availableTopics, setAvailableTopics] = useState<Topic[]>([]);
    const [selectedJob, setSelectedJob] = useState<CrawlerJob | null>(null);

    // Pagination state
    const [sourcesPage, setSourcesPage] = useState(1);
    const [sourcesLimit] = useState(10);
    const [sourcesPagination, setSourcesPagination] = useState({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0
    });

    const [jobsPage, setJobsPage] = useState(1);
    const [jobsLimit] = useState(10);
    const [jobsPagination, setJobsPagination] = useState({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0
    });

    // Search and sorting state
    const [sourcesSearch, setSourcesSearch] = useState('');
    const [sourcesSortBy, setSourcesSortBy] = useState<'name' | 'type' | 'domain' | 'last_crawled_at' | null>(null);
    const [sourcesSortOrder, setSourcesSortOrder] = useState<'asc' | 'desc'>('asc');

    const [jobsSearch, setJobsSearch] = useState('');
    const [jobsSortBy, setJobsSortBy] = useState<'started_at' | 'status' | 'items_found' | null>('started_at');
    const [jobsSortOrder, setJobsSortOrder] = useState<'asc' | 'desc'>('desc');

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
        loadTopics();
        loadEnhancementStatus();
    }, []);

    // Load sources when sources parameters change
    useEffect(() => {
        loadSources();
    }, [sourcesPage, sourcesSearch, sourcesSortBy, sourcesSortOrder]);

    // Load jobs when jobs parameters change
    useEffect(() => {
        loadJobs();
    }, [jobsPage, jobsSearch, jobsSortBy, jobsSortOrder]);

    // Handle column header click for sorting
    const handleSourcesSort = (column: typeof sourcesSortBy) => {
        if (sourcesSortBy === column) {
            setSourcesSortOrder(sourcesSortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSourcesSortBy(column);
            setSourcesSortOrder('asc');
        }
    };

    const handleJobsSort = (column: typeof jobsSortBy) => {
        if (jobsSortBy === column) {
            setJobsSortOrder(jobsSortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setJobsSortBy(column);
            setJobsSortOrder('asc');
        }
    };

    // Sort indicator component
    const SortIndicator = ({ column, currentSort, currentOrder }: {
        column: string,
        currentSort: string | null,
        currentOrder: 'asc' | 'desc'
    }) => {
        if (column !== currentSort) return <i className="fa-solid fa-duotone fa-sort text-base-content/30 ml-2" />;
        return currentOrder === 'asc'
            ? <i className="fa-solid fa-duotone fa-sort-up text-primary ml-2" />
            : <i className="fa-solid fa-duotone fa-sort-down text-primary ml-2" />;
    };

    const loadSources = async () => {
        try {
            setSourcesLoading(true);
            const token = await getToken();
            if (!token) {
                showToast('Authentication required', 'error');
                return;
            }

            const sourcesResponse = await CrawlerAPI.getSources(token, {
                page: sourcesPage,
                limit: sourcesLimit,
                search: sourcesSearch || undefined,
                sortBy: sourcesSortBy || undefined,
                sortOrder: sourcesSortOrder
            });

            setSources(sourcesResponse.sources);
            setSourcesPagination(sourcesResponse.pagination);
        } catch (error) {
            console.error('Error loading sources:', error);
            showToast('Failed to load sources', 'error');
        } finally {
            setSourcesLoading(false);
        }
    };

    const loadJobs = async () => {
        try {
            setJobsLoading(true);
            const token = await getToken();
            if (!token) {
                showToast('Authentication required', 'error');
                return;
            }

            const jobsResponse = await CrawlerAPI.getJobs(token, {
                page: jobsPage,
                limit: jobsLimit,
                search: jobsSearch || undefined,
                sortBy: jobsSortBy || undefined,
                sortOrder: jobsSortOrder
            });

            setJobs(jobsResponse.jobs);
            setJobsPagination(jobsResponse.pagination);
        } catch (error) {
            console.error('Error loading jobs:', error);
            showToast('Failed to load jobs', 'error');
        } finally {
            setJobsLoading(false);
        }
    };

    const loadEnhancementStatus = async () => {
        try {
            const token = await getToken();
            if (!token) {
                showToast('Authentication required', 'error');
                return;
            }

            const statusData = await CrawlerAPI.getEnhancementStatus(token);
            setEnhancementStatus(statusData);
        } catch (error) {
            console.error('Error loading enhancement status:', error);
            showToast('Failed to load enhancement status', 'error');
        }
    };

    const loadAllData = () => {
        loadSources();
        loadJobs();
        loadEnhancementStatus();
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
            loadSources();
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
            loadSources();
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
            loadSources();
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
            loadJobs(); // Refresh to show new job
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
            loadEnhancementStatus(); // Refresh status
        } catch (error) {
            console.error('Error enhancing metadata:', error);
            showToast('Failed to enhance metadata', 'error');
        } finally {
            setEnhancementRunning(false);
        }
    };

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
                                        <p className="font-semibold flex items-center gap-2">
                                            <i className="fa-solid fa-duotone fa-robot"></i> Automatic Enhancement Active
                                        </p>
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
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                        <h2 className="card-title">Content Sources ({sourcesPagination.total})</h2>

                        {/* Sources Search */}
                        <div className="form-control w-full md:w-auto">
                            <div className="input-group">
                                <input
                                    type="text"
                                    placeholder="Search sources..."
                                    className="input input-bordered w-full md:w-64"
                                    value={sourcesSearch}
                                    onChange={(e) => {
                                        setSourcesSearch(e.target.value);
                                        setSourcesPage(1); // Reset to first page on search
                                    }}
                                />
                                {sourcesSearch && (
                                    <button
                                        className="btn btn-square"
                                        onClick={() => setSourcesSearch('')}
                                    >
                                        <i className="fa-solid fa-duotone fa-times" />
                                    </button>
                                )}
                                <span className="btn btn-square btn-ghost pointer-events-none">
                                    <i className="fa-solid fa-duotone fa-search" />
                                </span>
                            </div>
                        </div>
                    </div>

                    {sourcesLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="text-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                                <p className="text-base-content/60">Loading sources...</p>
                            </div>
                        </div>
                    ) : sources.length === 0 ? (
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
                                        <th
                                            className="cursor-pointer select-none hover:bg-base-200"
                                            onClick={() => handleSourcesSort('name')}
                                        >
                                            <div className="flex items-center">
                                                Name
                                                <SortIndicator column="name" currentSort={sourcesSortBy} currentOrder={sourcesSortOrder} />
                                            </div>
                                        </th>
                                        <th
                                            className="cursor-pointer select-none hover:bg-base-200"
                                            onClick={() => handleSourcesSort('type')}
                                        >
                                            <div className="flex items-center">
                                                Type
                                                <SortIndicator column="type" currentSort={sourcesSortBy} currentOrder={sourcesSortOrder} />
                                            </div>
                                        </th>
                                        <th
                                            className="cursor-pointer select-none hover:bg-base-200"
                                            onClick={() => handleSourcesSort('domain')}
                                        >
                                            <div className="flex items-center">
                                                URL
                                                <SortIndicator column="domain" currentSort={sourcesSortBy} currentOrder={sourcesSortOrder} />
                                            </div>
                                        </th>
                                        <th>Frequency</th>
                                        <th>Topics</th>
                                        <th>Status</th>
                                        <th
                                            className="cursor-pointer select-none hover:bg-base-200"
                                            onClick={() => handleSourcesSort('last_crawled_at')}
                                        >
                                            <div className="flex items-center">
                                                Last Crawled
                                                <SortIndicator column="last_crawled_at" currentSort={sourcesSortBy} currentOrder={sourcesSortOrder} />
                                            </div>
                                        </th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sources.length === 0 ? (
                                        <tr>
                                            <td colSpan={8} className="text-center py-8">
                                                <p className="text-base-content/60">No sources match your search</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        sources.map((source) => (
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
                                        ))
                                    )}
                                </tbody>
                            </table>

                            {/* Sources Pagination */}
                            {sourcesPagination && (
                                <Pagination
                                    currentPage={sourcesPagination.page}
                                    totalPages={sourcesPagination.totalPages}
                                    total={sourcesPagination.total}
                                    limit={sourcesPagination.limit}
                                    onPageChange={setSourcesPage}
                                />
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Crawl Jobs */}
            <div className="card bg-base-100 shadow-xl">
                <div className="card-body">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                        <h2 className="card-title">Crawl Jobs ({jobsPagination.total})</h2>

                        {/* Jobs Search */}
                        <div className="form-control w-full md:w-auto">
                            <div className="input-group">
                                <input
                                    type="text"
                                    placeholder="Search jobs..."
                                    className="input input-bordered w-full md:w-64"
                                    value={jobsSearch}
                                    onChange={(e) => {
                                        setJobsSearch(e.target.value);
                                        setJobsPage(1); // Reset to first page on search
                                    }}
                                />
                                {jobsSearch && (
                                    <button
                                        className="btn btn-square"
                                        onClick={() => setJobsSearch('')}
                                    >
                                        <i className="fa-solid fa-duotone fa-times" />
                                    </button>
                                )}
                                <span className="btn btn-square btn-ghost pointer-events-none">
                                    <i className="fa-solid fa-duotone fa-search" />
                                </span>
                            </div>
                        </div>
                    </div>

                    {jobsLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="text-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                                <p className="text-base-content/60">Loading jobs...</p>
                            </div>
                        </div>
                    ) : jobs.length === 0 ? (
                        <div className="text-center py-4">
                            <p className="text-base-content/60">No crawl jobs yet</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="table table-zebra">
                                <thead>
                                    <tr>
                                        <th>Source</th>
                                        <th
                                            className="cursor-pointer select-none hover:bg-base-200"
                                            onClick={() => handleJobsSort('started_at')}
                                        >
                                            <div className="flex items-center">
                                                Started
                                                <SortIndicator column="started_at" currentSort={jobsSortBy} currentOrder={jobsSortOrder} />
                                            </div>
                                        </th>
                                        <th
                                            className="cursor-pointer select-none hover:bg-base-200"
                                            onClick={() => handleJobsSort('status')}
                                        >
                                            <div className="flex items-center">
                                                Status
                                                <SortIndicator column="status" currentSort={jobsSortBy} currentOrder={jobsSortOrder} />
                                            </div>
                                        </th>
                                        <th
                                            className="cursor-pointer select-none hover:bg-base-200"
                                            onClick={() => handleJobsSort('items_found')}
                                        >
                                            <div className="flex items-center">
                                                Found
                                                <SortIndicator column="items_found" currentSort={jobsSortBy} currentOrder={jobsSortOrder} />
                                            </div>
                                        </th>
                                        <th>Submitted</th>
                                        <th>Failed</th>
                                        <th>Duration</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {jobs.length === 0 ? (
                                        <tr>
                                            <td colSpan={8} className="text-center py-8">
                                                <p className="text-base-content/60">No jobs match your search</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        jobs.map((job) => {
                                            const source = sources.find(s => s.id === job.source_id);
                                            return (
                                                <tr key={job.id} className="hover:bg-base-200 cursor-pointer" onClick={() => setSelectedJob(job)}>
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
                                                    <td onClick={(e) => e.stopPropagation()}>
                                                        <button
                                                            onClick={() => setSelectedJob(job)}
                                                            className="btn btn-sm btn-ghost"
                                                            title="View Details"
                                                        >
                                                            <i className="fa-solid fa-duotone fa-eye"></i>
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>

                            {/* Jobs Pagination */}
                            {jobsPagination && (
                                <Pagination
                                    currentPage={jobsPagination.page}
                                    totalPages={jobsPagination.totalPages}
                                    total={jobsPagination.total}
                                    limit={jobsPagination.limit}
                                    onPageChange={setJobsPage}
                                />
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Job Detail Modal */}
            {selectedJob && (
                <JobDetailModal
                    job={selectedJob}
                    source={sources.find(s => s.id === selectedJob.source_id)}
                    onClose={() => setSelectedJob(null)}
                    onJobUpdated={loadAllData}
                />
            )}
        </div>
    );
}