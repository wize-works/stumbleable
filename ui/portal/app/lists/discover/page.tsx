'use client';

import { EmptyState } from '@/components/empty-state';
import { useToaster } from '@/components/toaster';
import { ListsAPI, UserAPI, UserList } from '@/lib/api-client';
import { useAuth, useUser } from '@clerk/nextjs';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function DiscoverListsPage() {
    const { getToken, isSignedIn } = useAuth();
    const { user } = useUser();
    const { showToast } = useToaster();
    const [dbUserId, setDbUserId] = useState<string | null>(null);
    const [lists, setLists] = useState<UserList[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(0);
    const [followedListIds, setFollowedListIds] = useState<Set<string>>(new Set());
    const ITEMS_PER_PAGE = 12;

    // Get database user ID
    useEffect(() => {
        async function loadUserId() {
            if (!user?.id) return;

            try {
                const token = await getToken();
                if (token) {
                    const userData = await UserAPI.initializeUser(user.id, token);
                    setDbUserId(userData.id);

                    // Load followed lists to track which ones user follows
                    const followedResponse = await ListsAPI.getFollowedLists(userData.id, token);
                    const followedIds = new Set(
                        followedResponse.lists.map((item: any) => item.list_id)
                    );
                    setFollowedListIds(followedIds);
                }
            } catch (error) {
                console.error('Failed to load user:', error);
            }
        }

        if (isSignedIn) {
            loadUserId();
        }
    }, [user?.id, getToken, isSignedIn]);

    // Fetch public lists
    useEffect(() => {
        async function loadLists() {
            setLoading(true);
            try {
                const response = await ListsAPI.getPublicLists(
                    ITEMS_PER_PAGE,
                    page * ITEMS_PER_PAGE,
                    searchQuery || undefined
                );
                setLists(response.lists);
                setTotal(response.total);
            } catch (error) {
                console.error('Failed to load public lists:', error);
                showToast('Failed to load lists', 'error');
            } finally {
                setLoading(false);
            }
        }

        loadLists();
    }, [page, searchQuery]);

    const handleSearch = (query: string) => {
        setSearchQuery(query);
        setPage(0); // Reset to first page on new search
    };

    const handleFollow = async (listId: string) => {
        if (!isSignedIn || !dbUserId) {
            showToast('Please sign in to follow lists', 'warning');
            return;
        }

        try {
            const token = await getToken();
            if (!token) return;

            await ListsAPI.followList(listId, dbUserId, token, false);
            setFollowedListIds(prev => new Set([...prev, listId]));

            // Update follower count in UI
            setLists(prev => prev.map(list =>
                list.id === listId
                    ? { ...list, follower_count: (list.follower_count || 0) + 1 }
                    : list
            ));

            showToast('List followed!', 'success');
        } catch (error) {
            console.error('Failed to follow list:', error);
            showToast('Failed to follow list', 'error');
        }
    };

    const handleUnfollow = async (listId: string) => {
        if (!dbUserId) return;

        try {
            const token = await getToken();
            if (!token) return;

            await ListsAPI.unfollowList(listId, dbUserId, token);
            setFollowedListIds(prev => {
                const newSet = new Set(prev);
                newSet.delete(listId);
                return newSet;
            });

            // Update follower count in UI
            setLists(prev => prev.map(list =>
                list.id === listId
                    ? { ...list, follower_count: Math.max((list.follower_count || 0) - 1, 0) }
                    : list
            ));

            showToast('List unfollowed', 'info');
        } catch (error) {
            console.error('Failed to unfollow list:', error);
            showToast('Failed to unfollow list', 'error');
        }
    };

    const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

    return (
        <div className="min-h-screen bg-base-100">
            <div className="container mx-auto px-4 py-8 max-w-7xl">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-4">
                        <Link href="/lists" className="btn btn-ghost btn-sm">
                            <i className="fa-solid fa-duotone fa-arrow-left"></i>
                        </Link>
                        <div>
                            <h1 className="text-4xl font-bold">Discover Lists</h1>
                            <p className="text-base-content/60">Browse curated collections from the community</p>
                        </div>
                    </div>

                    {/* Search Bar */}
                    <div className="form-control max-w-md">
                        <div className="input-group">
                            <input
                                type="text"
                                placeholder="Search lists..."
                                className="input input-bordered w-full"
                                value={searchQuery}
                                onChange={(e) => handleSearch(e.target.value)}
                            />
                            <button className="btn btn-square">
                                <i className="fa-solid fa-duotone fa-search"></i>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Stats */}
                {!loading && total > 0 && (
                    <div className="stats shadow mb-6">
                        <div className="stat">
                            <div className="stat-figure text-primary">
                                <i className="fa-solid fa-duotone fa-globe text-3xl"></i>
                            </div>
                            <div className="stat-title">Public Lists</div>
                            <div className="stat-value text-primary">{total}</div>
                            <div className="stat-desc">Curated by the community</div>
                        </div>
                    </div>
                )}

                {/* Content */}
                {loading ? (
                    <div className="flex justify-center py-12">
                        <span className="loading loading-spinner loading-lg"></span>
                    </div>
                ) : lists.length === 0 ? (
                    <EmptyState
                        illustration="lists"
                        title={searchQuery ? 'No Lists Found' : 'No Public Lists Yet'}
                        description={
                            searchQuery
                                ? 'Try a different search term'
                                : 'Check back later to discover curated collections from the community.'
                        }
                        action={searchQuery ? {
                            label: 'Clear Search',
                            onClick: () => handleSearch('')
                        } : undefined}
                    />
                ) : (
                    <>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                            {lists.map(list => (
                                <PublicListCard
                                    key={list.id}
                                    list={list}
                                    isFollowing={followedListIds.has(list.id)}
                                    onFollow={handleFollow}
                                    onUnfollow={handleUnfollow}
                                    isSignedIn={!!isSignedIn}
                                />
                            ))}
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex justify-center gap-2">
                                <button
                                    className="btn btn-sm"
                                    disabled={page === 0}
                                    onClick={() => setPage(p => p - 1)}
                                >
                                    <i className="fa-solid fa-duotone fa-chevron-left"></i>
                                    Previous
                                </button>
                                <div className="flex items-center gap-2 px-4">
                                    <span className="text-sm">
                                        Page {page + 1} of {totalPages}
                                    </span>
                                </div>
                                <button
                                    className="btn btn-sm"
                                    disabled={page >= totalPages - 1}
                                    onClick={() => setPage(p => p + 1)}
                                >
                                    Next
                                    <i className="fa-solid fa-duotone fa-chevron-right"></i>
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

// Public List Card Component
function PublicListCard({
    list,
    isFollowing,
    onFollow,
    onUnfollow,
    isSignedIn
}: {
    list: UserList;
    isFollowing: boolean;
    onFollow: (id: string) => void;
    onUnfollow: (id: string) => void;
    isSignedIn: boolean;
}) {
    const [isProcessing, setIsProcessing] = useState(false);

    const handleFollowToggle = async () => {
        setIsProcessing(true);
        try {
            if (isFollowing) {
                await onUnfollow(list.id);
            } else {
                await onFollow(list.id);
            }
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="card bg-base-200 shadow-lg hover:shadow-xl transition-all">
            <div className="card-body">
                <Link href={`/lists/${list.id}`}>
                    <div className="flex items-start justify-between mb-2 cursor-pointer hover:opacity-80">
                        <div className="flex items-center gap-2 flex-1">
                            {list.emoji && <i className={`${list.emoji} text-xl text-primary`}></i>}
                            <h3 className="card-title text-lg">{list.title}</h3>
                        </div>
                        <i className="fa-solid fa-duotone fa-globe text-info" title="Public"></i>
                    </div>

                    {list.description && (
                        <p className="text-base-content/70 text-sm line-clamp-3 mb-3">
                            {list.description}
                        </p>
                    )}
                </Link>

                <div className="flex items-center justify-between text-sm text-base-content/60">
                    <div className="flex items-center gap-4">
                        <span>
                            <i className="fa-solid fa-duotone fa-bookmark mr-1"></i>
                            {list.item_count || 0} items
                        </span>
                        <span>
                            <i className="fa-solid fa-duotone fa-heart mr-1"></i>
                            {list.follower_count || 0}
                        </span>
                    </div>

                    {isSignedIn && (
                        <button
                            onClick={handleFollowToggle}
                            disabled={isProcessing}
                            className={`btn btn-xs ${isFollowing ? 'btn-ghost' : 'btn-primary'
                                }`}
                        >
                            {isProcessing ? (
                                <span className="loading loading-spinner loading-xs"></span>
                            ) : isFollowing ? (
                                <>
                                    <i className="fa-solid fa-duotone fa-check mr-1"></i>
                                    Following
                                </>
                            ) : (
                                <>
                                    <i className="fa-solid fa-duotone fa-plus mr-1"></i>
                                    Follow
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
