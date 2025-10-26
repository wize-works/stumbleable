'use client';

import { useToaster } from '@/components/toaster';
import { ContentAPI, UserAPI, type LaunchPlatform } from '@/lib/api-client';
import { useAuth } from '@clerk/nextjs';
import { useEffect, useState } from 'react';

export default function LaunchPlatformManagement() {
    const { getToken } = useAuth();
    const { showToast } = useToaster();

    const [platforms, setPlatforms] = useState<LaunchPlatform[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingPlatform, setEditingPlatform] = useState<LaunchPlatform | null>(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [isCheckingRole, setIsCheckingRole] = useState(true);

    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        display_name: '',
        url: '',
        launch_date: '',
        sort_order: 0,
        tagline: '',
        description: '',
        color: '#000000',
        icon: '',
        badge_icon: '',
        cta_primary: '',
        cta_secondary: '',
        seo_title: '',
        seo_description: '',
        seo_keywords: [] as string[],
    });

    useEffect(() => {
        checkAdminRole();
    }, []);

    useEffect(() => {
        if (isAdmin) {
            loadPlatforms();
        }
    }, [isAdmin]);

    const checkAdminRole = async () => {
        try {
            const token = await getToken();
            if (!token) {
                setIsAdmin(false);
                setIsCheckingRole(false);
                return;
            }

            const roleData = await UserAPI.getMyRole(token);
            setIsAdmin(roleData.role === 'admin');
        } catch (error) {
            console.error('Error checking role:', error);
            setIsAdmin(false);
        } finally {
            setIsCheckingRole(false);
        }
    };

    const loadPlatforms = async () => {
        try {
            setLoading(true);
            const token = await getToken();
            if (!token) {
                showToast('Authentication required', 'error');
                return;
            }

            const data = await ContentAPI.getAllPlatformsAdmin(token);
            setPlatforms(data);
        } catch (error) {
            console.error('Error loading platforms:', error);
            showToast('Failed to load platforms', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleNameChange = (value: string) => {
        const slug = value
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');

        setFormData({
            ...formData,
            name: value,
            slug,
            display_name: formData.display_name || value,
            seo_title: formData.seo_title || value,
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const token = await getToken();
            if (!token) {
                showToast('Authentication required', 'error');
                return;
            }

            if (editingPlatform) {
                await ContentAPI.updatePlatform(editingPlatform.id, formData, token);
                showToast('Platform updated successfully', 'success');
            } else {
                await ContentAPI.createPlatform(formData, token);
                showToast('Platform created successfully', 'success');
            }

            resetForm();
            loadPlatforms();
        } catch (error) {
            console.error('Error saving platform:', error);
            showToast('Failed to save platform', 'error');
        }
    };

    const handleEdit = (platform: LaunchPlatform) => {
        setEditingPlatform(platform);
        setFormData({
            name: platform.name,
            slug: platform.slug,
            display_name: platform.display_name,
            url: platform.url,
            launch_date: platform.launch_date.split('T')[0],
            sort_order: platform.sort_order,
            tagline: platform.tagline || '',
            description: platform.description || '',
            color: platform.color || '#000000',
            icon: platform.icon || '',
            badge_icon: platform.badge_icon || '',
            cta_primary: platform.cta_primary || '',
            cta_secondary: platform.cta_secondary || '',
            seo_title: platform.seo_title || '',
            seo_description: platform.seo_description || '',
            seo_keywords: Array.isArray(platform.seo_keywords) ? platform.seo_keywords : [],
        });
        setShowForm(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this platform?')) {
            return;
        }

        try {
            const token = await getToken();
            if (!token) {
                showToast('Authentication required', 'error');
                return;
            }

            await ContentAPI.deletePlatform(id, token);
            showToast('Platform deleted successfully', 'success');
            loadPlatforms();
        } catch (error) {
            console.error('Error deleting platform:', error);
            showToast('Failed to delete platform', 'error');
        }
    };

    const handleToggleActive = async (platform: LaunchPlatform) => {
        try {
            const token = await getToken();
            if (!token) {
                showToast('Authentication required', 'error');
                return;
            }

            await ContentAPI.updatePlatform(
                platform.id,
                { is_active: !platform.is_active },
                token
            );
            showToast(
                `Platform ${!platform.is_active ? 'activated' : 'deactivated'} successfully`,
                'success'
            );
            loadPlatforms();
        } catch (error) {
            console.error('Error toggling platform:', error);
            showToast('Failed to update platform', 'error');
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            slug: '',
            display_name: '',
            url: '',
            launch_date: '',
            sort_order: 0,
            tagline: '',
            description: '',
            color: '#000000',
            icon: '',
            badge_icon: '',
            cta_primary: '',
            cta_secondary: '',
            seo_title: '',
            seo_description: '',
            seo_keywords: [],
        });
        setEditingPlatform(null);
        setShowForm(false);
    };

    // Show loading while checking role
    if (isCheckingRole) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-base-content/60">Checking permissions...</p>
                </div>
            </div>
        );
    }

    // Show access denied if not admin
    if (!isAdmin) {
        return (
            <div className="card bg-base-100 shadow-xl">
                <div className="card-body text-center">
                    <i className="fa-solid fa-duotone fa-shield-exclamation text-6xl text-error mb-4" />
                    <h2 className="card-title justify-center">Admin Access Required</h2>
                    <p className="text-base-content/60">
                        You need administrator privileges to access this page.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-base-content">Launch Platform Management</h1>
                    <p className="text-base-content/60 mt-2">
                        Manage landing pages for product launches across different platforms
                    </p>
                </div>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="btn btn-primary"
                >
                    <i className="fa-solid fa-duotone fa-plus mr-2" />
                    Add Platform
                </button>
            </div>

            {/* Add/Edit Form */}
            {showForm && (
                <div className="card bg-base-100 shadow-xl">
                    <div className="card-body">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="card-title">
                                {editingPlatform ? 'Edit Platform' : 'Add New Platform'}
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
                                {/* Basic Info */}
                                <div className="space-y-4">
                                    <div className="form-control">
                                        <label className="label w-full">
                                            <span className="label-text">Name *</span>
                                        </label>
                                        <input
                                            type="text"
                                            className="input input-bordered w-full"
                                            value={formData.name}
                                            onChange={(e) => handleNameChange(e.target.value)}
                                            placeholder="Product Hunt"
                                            required
                                        />
                                    </div>

                                    <div className="form-control">
                                        <label className="label w-full">
                                            <span className="label-text">Slug *</span>
                                        </label>
                                        <input
                                            type="text"
                                            className="input input-bordered w-full"
                                            value={formData.slug}
                                            onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                                            placeholder="product-hunt"
                                            pattern="[a-z0-9-]+"
                                            required
                                        />
                                        <label className="label">
                                            <span className="label-text-alt">URL-friendly identifier</span>
                                        </label>
                                    </div>

                                    <div className="form-control">
                                        <label className="label w-full">
                                            <span className="label-text">Display Name *</span>
                                        </label>
                                        <input
                                            type="text"
                                            className="input input-bordered w-full"
                                            value={formData.display_name}
                                            onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                                            placeholder="Product Hunt"
                                            required
                                        />
                                    </div>

                                    <div className="form-control">
                                        <label className="label w-full">
                                            <span className="label-text">URL *</span>
                                        </label>
                                        <input
                                            type="url"
                                            className="input input-bordered w-full"
                                            value={formData.url}
                                            onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                                            placeholder="https://www.producthunt.com/posts/..."
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Additional Details */}
                                <div className="space-y-4">
                                    <div className="form-control">
                                        <label className="label w-full">
                                            <span className="label-text">Launch Date *</span>
                                        </label>
                                        <input
                                            type="date"
                                            className="input input-bordered w-full"
                                            value={formData.launch_date}
                                            onChange={(e) => setFormData({ ...formData, launch_date: e.target.value })}
                                            required
                                        />
                                    </div>

                                    <div className="form-control">
                                        <label className="label w-full">
                                            <span className="label-text">Sort Order</span>
                                        </label>
                                        <input
                                            type="number"
                                            className="input input-bordered w-full"
                                            value={formData.sort_order}
                                            onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                                        />
                                    </div>

                                    <div className="form-control">
                                        <label className="label w-full">
                                            <span className="label-text">Tagline</span>
                                        </label>
                                        <input
                                            type="text"
                                            className="input input-bordered w-full"
                                            value={formData.tagline}
                                            onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                                            placeholder="Short tagline"
                                        />
                                    </div>

                                    <div className="form-control">
                                        <label className="label w-full">
                                            <span className="label-text">Brand Color</span>
                                        </label>
                                        <input
                                            type="color"
                                            className="input input-bordered w-full h-12"
                                            value={formData.color}
                                            onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Description */}
                            <div className="form-control">
                                <label className="label w-full">
                                    <span className="label-text">Description</span>
                                </label>
                                <textarea
                                    className="textarea textarea-bordered w-full"
                                    rows={3}
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Platform description"
                                />
                            </div>

                            {/* Icons & CTAs */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="form-control">
                                    <label className="label w-full">
                                        <span className="label-text">Icon (Font Awesome class)</span>
                                    </label>
                                    <input
                                        type="text"
                                        className="input input-bordered w-full"
                                        value={formData.icon}
                                        onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                                        placeholder="fa-brands fa-product-hunt"
                                    />
                                </div>

                                <div className="form-control">
                                    <label className="label w-full">
                                        <span className="label-text">Badge Icon (Font Awesome class)</span>
                                    </label>
                                    <input
                                        type="text"
                                        className="input input-bordered w-full"
                                        value={formData.badge_icon}
                                        onChange={(e) => setFormData({ ...formData, badge_icon: e.target.value })}
                                        placeholder="fa-solid fa-rocket"
                                    />
                                </div>

                                <div className="form-control">
                                    <label className="label w-full">
                                        <span className="label-text">Primary CTA</span>
                                    </label>
                                    <input
                                        type="text"
                                        className="input input-bordered w-full"
                                        value={formData.cta_primary}
                                        onChange={(e) => setFormData({ ...formData, cta_primary: e.target.value })}
                                        placeholder="Vote on Product Hunt"
                                    />
                                </div>

                                <div className="form-control">
                                    <label className="label w-full">
                                        <span className="label-text">Secondary CTA</span>
                                    </label>
                                    <input
                                        type="text"
                                        className="input input-bordered w-full"
                                        value={formData.cta_secondary}
                                        onChange={(e) => setFormData({ ...formData, cta_secondary: e.target.value })}
                                        placeholder="Share on Twitter"
                                    />
                                </div>
                            </div>

                            {/* SEO */}
                            <div className="divider">SEO Settings</div>
                            <div className="space-y-4">
                                <div className="form-control">
                                    <label className="label w-full">
                                        <span className="label-text">SEO Title</span>
                                    </label>
                                    <input
                                        type="text"
                                        className="input input-bordered w-full"
                                        value={formData.seo_title}
                                        onChange={(e) => setFormData({ ...formData, seo_title: e.target.value })}
                                        placeholder="Page title for search engines"
                                    />
                                </div>

                                <div className="form-control">
                                    <label className="label w-full">
                                        <span className="label-text">SEO Description</span>
                                    </label>
                                    <textarea
                                        className="textarea textarea-bordered w-full"
                                        rows={2}
                                        value={formData.seo_description}
                                        onChange={(e) => setFormData({ ...formData, seo_description: e.target.value })}
                                        placeholder="Meta description for search engines"
                                    />
                                </div>

                                <div className="form-control">
                                    <label className="label w-full">
                                        <span className="label-text">SEO Keywords</span>
                                    </label>
                                    <input
                                        type="text"
                                        className="input input-bordered w-full"
                                        value={formData.seo_keywords.join(', ')}
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            seo_keywords: e.target.value.split(',').map(k => k.trim()).filter(k => k)
                                        })}
                                        placeholder="comma, separated, keywords"
                                    />
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex justify-end gap-2 pt-4">
                                <button
                                    type="button"
                                    onClick={resetForm}
                                    className="btn btn-ghost"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                >
                                    <i className="fa-solid fa-duotone fa-save mr-2" />
                                    {editingPlatform ? 'Update' : 'Create'} Platform
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Platforms List */}
            <div className="card bg-base-100 shadow-xl">
                <div className="card-body">
                    <h2 className="card-title mb-4">
                        All Platforms ({platforms.length})
                    </h2>

                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <span className="loading loading-spinner loading-lg"></span>
                        </div>
                    ) : platforms.length === 0 ? (
                        <div className="text-center py-12">
                            <i className="fa-solid fa-duotone fa-rocket text-6xl text-base-content/20 mb-4" />
                            <p className="text-base-content/60">No platforms yet. Click "Add Platform" to create one.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="table table-zebra">
                                <thead>
                                    <tr>
                                        <th>Platform</th>
                                        <th>Slug</th>
                                        <th>URL</th>
                                        <th>Status</th>
                                        <th>Sort Order</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {platforms.map((platform) => (
                                        <tr key={platform.id}>
                                            <td>
                                                <div className="flex items-center gap-3">
                                                    <i
                                                        className={`${platform.icon} text-2xl`}
                                                        style={{ color: platform.color }}
                                                    />
                                                    <div>
                                                        <div className="font-bold">{platform.display_name}</div>
                                                        <div className="text-sm text-base-content/60">{platform.tagline}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <code className="text-xs bg-base-200 px-2 py-1 rounded">
                                                    {platform.slug}
                                                </code>
                                            </td>
                                            <td>
                                                <a
                                                    href={platform.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="link link-primary text-sm"
                                                >
                                                    {new URL(platform.url).hostname}
                                                    <i className="fa-solid fa-duotone fa-arrow-up-right-from-square ml-1 text-xs" />
                                                </a>
                                            </td>
                                            <td>
                                                <button
                                                    onClick={() => handleToggleActive(platform)}
                                                    className={`badge ${platform.is_active ? 'badge-success' : 'badge-ghost'
                                                        } cursor-pointer hover:scale-105 transition-transform`}
                                                >
                                                    {platform.is_active ? 'Active' : 'Inactive'}
                                                </button>
                                            </td>
                                            <td>
                                                <span className="font-mono text-sm">{platform.sort_order}</span>
                                            </td>
                                            <td>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleEdit(platform)}
                                                        className="btn btn-ghost btn-sm"
                                                        title="Edit"
                                                    >
                                                        <i className="fa-solid fa-duotone fa-pen-to-square" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(platform.id)}
                                                        className="btn btn-ghost btn-sm text-error"
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
        </div>
    );
}
