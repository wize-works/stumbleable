'use client';

import { useToaster } from '@/components/toaster';
import { useAuth, useUser } from '@clerk/nextjs';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { EmptyState } from '../../components/empty-state';
import { ListsAPI, UserAPI, UserList } from '../../lib/api-client';

export default function ListsPage() {
    const { getToken, isSignedIn } = useAuth();
    const { user } = useUser();
    const { showToast } = useToaster();
    const [dbUserId, setDbUserId] = useState<string | null>(null);
    const [lists, setLists] = useState<UserList[]>([]);
    const [publicLists, setPublicLists] = useState<UserList[]>([]);
    const [followedLists, setFollowedLists] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [activeTab, setActiveTab] = useState<'my-lists' | 'public' | 'followed'>('my-lists');

    // Get database user ID
    useEffect(() => {
        async function loadUserId() {
            if (!user?.id) return;

            try {
                const token = await getToken();
                if (token) {
                    const userData = await UserAPI.initializeUser(user.id, token);
                    setDbUserId(userData.id);
                }
            } catch (error) {
                console.error('Failed to load user:', error);
            }
        }

        loadUserId();
    }, [user?.id, getToken]);

    // Fetch user's lists
    useEffect(() => {
        async function loadLists() {
            if (!isSignedIn || !dbUserId) {
                setLoading(false);
                return;
            }

            try {
                const token = await getToken();
                if (token) {
                    const response = await ListsAPI.getUserLists(dbUserId, token);
                    setLists(response.lists);
                }
            } catch (error) {
                console.error('Failed to load lists:', error);
            } finally {
                setLoading(false);
            }
        }

        loadLists();
    }, [getToken, isSignedIn, dbUserId]);

    // Fetch public lists
    useEffect(() => {
        async function loadPublicLists() {
            try {
                const response = await ListsAPI.getPublicLists(20, 0);
                setPublicLists(response.lists);
            } catch (error) {
                console.error('Failed to load public lists:', error);
            }
        }

        if (activeTab === 'public') {
            loadPublicLists();
        }
    }, [activeTab]);

    // Fetch followed lists
    useEffect(() => {
        async function loadFollowedLists() {
            if (!dbUserId) return;

            try {
                const token = await getToken();
                if (token) {
                    const response = await ListsAPI.getFollowedLists(dbUserId, token);
                    setFollowedLists(response.lists);
                }
            } catch (error) {
                console.error('Failed to load followed lists:', error);
            }
        }

        if (activeTab === 'followed' && dbUserId) {
            loadFollowedLists();
        }
    }, [activeTab, dbUserId, getToken]);

    // Create list handler
    const handleCreateList = async (data: { title: string; description: string; icon: string; isPublic: boolean }) => {
        if (!dbUserId) return;

        try {
            const token = await getToken();
            if (!token) return;

            const response = await ListsAPI.createList(dbUserId, {
                title: data.title,
                description: data.description,
                emoji: data.icon,
                isPublic: data.isPublic
            }, token);
            setLists(prev => [response.list, ...prev]);
            setShowCreateModal(false);
            showToast('List created successfully!', 'success');
        } catch (error) {
            console.error('Failed to create list:', error);
            showToast('Failed to create list', 'error');
        }
    };

    // Toggle visibility handler
    const handleToggleVisibility = async (listId: string, currentlyPublic: boolean) => {
        try {
            const token = await getToken();
            if (!token) return;

            await ListsAPI.toggleVisibility(listId, !currentlyPublic, token);
            setLists(prev => prev.map(l =>
                l.id === listId ? { ...l, is_public: !currentlyPublic } : l
            ));
            showToast(`List is now ${!currentlyPublic ? 'public' : 'private'}`, 'success');
        } catch (error) {
            console.error('Failed to toggle visibility:', error);
            showToast('Failed to update list visibility', 'error');
        }
    };

    // Delete list handler
    const handleDeleteList = async (listId: string) => {
        if (!confirm('Are you sure you want to delete this list?')) return;

        try {
            const token = await getToken();
            if (!token) return;

            await ListsAPI.deleteList(listId, token);
            setLists(prev => prev.filter(l => l.id !== listId));
            showToast('List deleted', 'info');
        } catch (error) {
            console.error('Failed to delete list:', error);
            showToast('Failed to delete list', 'error');
        }
    };

    if (!isSignedIn) {
        return (
            <div className="min-h-screen bg-base-100">
                <div className="container mx-auto px-4 py-8">
                    <EmptyState
                        illustration="lists"
                        title="Sign in to Create Lists"
                        description="Save and organize your favorite discoveries into custom collections."
                        action={{
                            label: 'Sign In',
                            href: '/sign-in'
                        }}
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-base-100">
            <div className="container mx-auto px-4 py-8 max-w-7xl">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-4xl font-bold mb-2">Discovery Lists</h1>
                        <p className="text-base-content/60">Organize your discoveries into custom collections</p>
                    </div>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="btn btn-primary gap-2"
                    >
                        <i className="fa-solid fa-duotone fa-plus"></i>
                        New List
                    </button>
                </div>

                {/* Tabs */}
                <div className="tabs tabs-lift mb-6 bg-base-200">
                    <button
                        className={`tab ${activeTab === 'my-lists' ? 'tab-active' : ''}`}
                        onClick={() => setActiveTab('my-lists')}
                    >
                        <i className="fa-solid fa-duotone fa-list mr-2"></i>
                        My Lists ({lists.length})
                    </button>
                    <button
                        className={`tab ${activeTab === 'followed' ? 'tab-active' : ''}`}
                        onClick={() => setActiveTab('followed')}
                    >
                        <i className="fa-solid fa-duotone fa-heart mr-2"></i>
                        Followed ({followedLists.length})
                    </button>
                    <button
                        className={`tab ${activeTab === 'public' ? 'tab-active' : ''}`}
                        onClick={() => setActiveTab('public')}
                    >
                        <i className="fa-solid fa-duotone fa-globe mr-2"></i>
                        Discover
                    </button>
                </div>

                {/* Content */}
                {loading ? (
                    <div className="flex justify-center py-12">
                        <span className="loading loading-spinner loading-lg"></span>
                    </div>
                ) : activeTab === 'my-lists' ? (
                    lists.length === 0 ? (
                        <EmptyState
                            illustration="lists"
                            title="No Lists Yet"
                            description="Create your first list to start organizing your discoveries."
                            action={{
                                label: 'Create List',
                                onClick: () => setShowCreateModal(true)
                            }}
                        />
                    ) : (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {lists.map(list => (
                                <ListCard
                                    key={list.id}
                                    list={list}
                                    onDelete={handleDeleteList}
                                    onToggleVisibility={handleToggleVisibility}
                                    showActions
                                />
                            ))}
                        </div>
                    )
                ) : activeTab === 'followed' ? (
                    followedLists.length === 0 ? (
                        <EmptyState
                            illustration="lists"
                            title="No Followed Lists"
                            description="Discover and follow public lists from the community."
                            action={{
                                label: 'Discover Lists',
                                onClick: () => setActiveTab('public')
                            }}
                        />
                    ) : (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {followedLists.map(item => (
                                <ListCard
                                    key={item.list_id}
                                    list={item.user_lists}
                                    showActions={false}
                                />
                            ))}
                        </div>
                    )
                ) : (
                    publicLists.length === 0 ? (
                        <EmptyState
                            illustration="lists"
                            title="No Public Lists Yet"
                            description="Check back later to discover curated collections from the community."
                        />
                    ) : (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {publicLists.map(list => (
                                <ListCard key={list.id} list={list} showActions={false} />
                            ))}
                        </div>
                    )
                )}

                {/* Create List Modal */}
                {showCreateModal && (
                    <CreateListModal
                        onClose={() => setShowCreateModal(false)}
                        onCreate={handleCreateList}
                    />
                )}
            </div>
        </div>
    );
}

// List Card Component
function ListCard({
    list,
    onDelete,
    onToggleVisibility,
    showActions
}: {
    list: UserList;
    onDelete?: (id: string) => void;
    onToggleVisibility?: (id: string, isPublic: boolean) => void;
    showActions: boolean;
}) {
    const [isTogglingVisibility, setIsTogglingVisibility] = useState(false);

    const handleVisibilityToggle = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!onToggleVisibility || isTogglingVisibility) return;

        setIsTogglingVisibility(true);
        try {
            await onToggleVisibility(list.id, list.is_public || false);
        } finally {
            setIsTogglingVisibility(false);
        }
    };

    return (
        <Link href={`/lists/${list.id}`}>
            <div className="card bg-base-200 hover:bg-base-300 shadow-lg hover:shadow-xl transition-all cursor-pointer h-full">
                <div className="card-body">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2 flex-1">
                            {list.emoji && <i className={`${list.emoji} text-xl text-primary`}></i>}
                            <h3 className="card-title text-lg">{list.title}</h3>
                        </div>
                        <div className="flex items-center gap-2">
                            {showActions && onToggleVisibility && (
                                <button
                                    onClick={handleVisibilityToggle}
                                    className="btn btn-xs btn-ghost"
                                    title={list.is_public ? 'Make Private' : 'Make Public'}
                                    disabled={isTogglingVisibility}
                                >
                                    {isTogglingVisibility ? (
                                        <span className="loading loading-spinner loading-xs"></span>
                                    ) : list.is_public ? (
                                        <i className="fa-solid fa-duotone fa-lock-open text-success"></i>
                                    ) : (
                                        <i className="fa-solid fa-duotone fa-lock text-base-content/60"></i>
                                    )}
                                </button>
                            )}
                            {!showActions && list.is_public && (
                                <i className="fa-solid fa-duotone fa-globe text-info" title="Public"></i>
                            )}
                        </div>
                    </div>

                    {list.description && (
                        <p className="text-base-content/70 text-sm line-clamp-2">{list.description}</p>
                    )}

                    <div className="flex items-center gap-4 text-sm text-base-content/60 mt-auto">
                        <span>
                            <i className="fa-solid fa-duotone fa-bookmark mr-1"></i>
                            {list.item_count || 0} {list.item_count === 1 ? 'item' : 'items'}
                        </span>
                        {(list.follower_count || 0) > 0 && (
                            <span>
                                <i className="fa-solid fa-duotone fa-heart mr-1"></i>
                                {list.follower_count}
                            </span>
                        )}
                    </div>

                    {showActions && onDelete && (
                        <div className="card-actions justify-end mt-2">
                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    onDelete(list.id);
                                }}
                                className="btn btn-sm btn-ghost btn-error"
                            >
                                <i className="fa-solid fa-duotone fa-trash"></i>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </Link>
    );
}

// Create List Modal Component
function CreateListModal({
    onClose,
    onCreate
}: {
    onClose: () => void;
    onCreate: (data: { title: string; description: string; icon: string; isPublic: boolean }) => void;
}) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [selectedIcon, setSelectedIcon] = useState('fa-solid fa-duotone fa-bookmark');
    const [isPublic, setIsPublic] = useState(false);

    // Common list icons
    const listIcons = [
        { icon: 'fa-solid fa-duotone fa-bookmark', label: 'Bookmark' },
        { icon: 'fa-solid fa-duotone fa-star', label: 'Star' },
        { icon: 'fa-solid fa-duotone fa-heart', label: 'Heart' },
        { icon: 'fa-solid fa-duotone fa-book', label: 'Book' },
        { icon: 'fa-solid fa-duotone fa-lightbulb', label: 'Idea' },
        { icon: 'fa-solid fa-duotone fa-rocket', label: 'Rocket' },
        { icon: 'fa-solid fa-duotone fa-folder', label: 'Folder' },
        { icon: 'fa-solid fa-duotone fa-list', label: 'List' },
        { icon: 'fa-solid fa-duotone fa-graduation-cap', label: 'Learn' },
        { icon: 'fa-solid fa-duotone fa-briefcase', label: 'Work' },
        { icon: 'fa-solid fa-duotone fa-code', label: 'Code' },
        { icon: 'fa-solid fa-duotone fa-palette', label: 'Design' },
        { icon: 'fa-solid fa-duotone fa-music', label: 'Music' },
        { icon: 'fa-solid fa-duotone fa-film', label: 'Video' },
        { icon: 'fa-solid fa-duotone fa-gamepad', label: 'Gaming' },
        { icon: 'fa-solid fa-duotone fa-utensils', label: 'Food' },
        { icon: 'fa-solid fa-duotone fa-plane', label: 'Travel' },
        { icon: 'fa-solid fa-duotone fa-dumbbell', label: 'Fitness' },
        { icon: 'fa-solid fa-duotone fa-camera', label: 'Photo' },
        { icon: 'fa-solid fa-duotone fa-pencil', label: 'Writing' },
    ];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) return;
        onCreate({ title, description, icon: selectedIcon, isPublic });
    };

    return (
        <div className="modal modal-open">
            <div className="modal-box max-w-md">
                <h3 className="font-bold text-lg mb-4">Create New List</h3>
                <form onSubmit={handleSubmit}>
                    <div className="form-control mb-4">
                        <label className="label">
                            <span className="label-text">Icon</span>
                        </label>
                        <div className="grid grid-cols-5 gap-2">
                            {listIcons.map((iconItem) => (
                                <button
                                    key={iconItem.icon}
                                    type="button"
                                    onClick={() => setSelectedIcon(iconItem.icon)}
                                    className={`btn btn-square btn-sm ${selectedIcon === iconItem.icon
                                        ? 'btn-primary'
                                        : 'btn-ghost'
                                        }`}
                                    title={iconItem.label}
                                >
                                    <i className={`${iconItem.icon} text-xl`}></i>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="form-control mb-4">
                        <label className="label w-full">
                            <span className="label-text">Title *</span>
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="input input-bordered w-full"
                            placeholder="My Awesome Collection"
                            required
                            maxLength={200}
                        />
                    </div>

                    <div className="form-control mb-4">
                        <label className="label w-full">
                            <span className="label-text">Description (optional)</span>
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="textarea textarea-bordered w-full"
                            placeholder="What's this list about?"
                            rows={3}
                            maxLength={1000}
                        ></textarea>
                    </div>

                    <div className="form-control mb-6">
                        <label className="label cursor-pointer justify-start gap-3">
                            <input
                                type="checkbox"
                                checked={isPublic}
                                onChange={(e) => setIsPublic(e.target.checked)}
                                className="checkbox checkbox-primary"
                            />
                            <div>
                                <span className="label-text font-medium">Make this list public</span>
                                <p className="text-xs text-base-content/60 mt-1">
                                    Others can view and follow your list
                                </p>
                            </div>
                        </label>
                    </div>

                    <div className="modal-action">
                        <button type="button" onClick={onClose} className="btn btn-ghost">
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={!title.trim()}>
                            Create List
                        </button>
                    </div>
                </form>
            </div>
            <div className="modal-backdrop" onClick={onClose}></div>
        </div>
    );
}