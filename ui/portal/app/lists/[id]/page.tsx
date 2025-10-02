'use client';

import { DiscoveryCard } from '@/components/discovery-card';
import { EmptyState } from '@/components/empty-state';
import { useToaster } from '@/components/toaster';
import { ListItem, ListsAPI, UserList } from '@/lib/api-client';
import { useAuth, useUser } from '@clerk/nextjs';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function ListDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { getToken, isSignedIn } = useAuth();
    const { user } = useUser();
    const { showToast } = useToaster();

    const listId = params?.id as string;
    const [list, setList] = useState<(UserList & { list_items: ListItem[] }) | null>(null);
    const [loading, setLoading] = useState(true);
    const [isOwner, setIsOwner] = useState(false);
    const [isFollowing, setIsFollowing] = useState(false);

    // Load list details
    useEffect(() => {
        async function loadList() {
            if (!listId) return;

            try {
                const token = await getToken();
                const response = await ListsAPI.getList(listId, token || undefined);
                setList(response.list);

                // Check if current user is the owner
                if (user?.id) {
                    // Compare Clerk ID or database ID
                    setIsOwner(response.list.user_id === user.id || response.list.user_id.startsWith('user_'));
                }
            } catch (error) {
                console.error('Failed to load list:', error);
                showToast('Failed to load list', 'error');
                // Redirect to lists page after a delay
                setTimeout(() => router.push('/lists'), 2000);
            } finally {
                setLoading(false);
            }
        }

        loadList();
    }, [listId, getToken, user?.id, router, showToast]);

    // Handle delete list
    const handleDelete = async () => {
        if (!list || !confirm('Are you sure you want to delete this list?')) return;

        try {
            const token = await getToken();
            if (!token) return;

            await ListsAPI.deleteList(list.id, token);
            showToast('List deleted', 'success');
            router.push('/lists');
        } catch (error) {
            console.error('Failed to delete list:', error);
            showToast('Failed to delete list', 'error');
        }
    };

    // Handle toggle visibility
    const handleToggleVisibility = async () => {
        if (!list) return;

        try {
            const token = await getToken();
            if (!token) return;

            const response = await ListsAPI.toggleVisibility(list.id, !list.is_public, token);
            setList(prev => prev ? { ...prev, is_public: response.list.is_public } : null);
            showToast(`List is now ${response.list.is_public ? 'public' : 'private'}`, 'success');
        } catch (error) {
            console.error('Failed to toggle visibility:', error);
            showToast('Failed to update visibility', 'error');
        }
    };

    // Handle remove item
    const handleRemoveItem = async (itemId: string) => {
        if (!list || !confirm('Remove this item from the list?')) return;

        try {
            const token = await getToken();
            if (!token) return;

            await ListsAPI.removeItemFromList(list.id, itemId, token);
            setList(prev => prev ? {
                ...prev,
                list_items: prev.list_items.filter(item => item.id !== itemId),
                item_count: prev.item_count - 1
            } : null);
            showToast('Item removed', 'success');
        } catch (error) {
            console.error('Failed to remove item:', error);
            showToast('Failed to remove item', 'error');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-base-100 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <span className="loading loading-spinner loading-xl text-primary"></span>
                    <span className="text-lg">Loading list...</span>
                </div>
            </div>
        );
    }

    if (!list) {
        return (
            <div className="min-h-screen bg-base-100">
                <div className="container mx-auto px-4 py-8">
                    <EmptyState
                        illustration="lists"
                        title="List Not Found"
                        description="The list you're looking for doesn't exist or has been deleted."
                        action={{
                            label: 'Back to Lists',
                            href: '/lists'
                        }}
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-base-100">
            <div className="container mx-auto px-4 py-8 max-w-6xl">
                {/* Header */}
                <div className="mb-8">
                    <Link href="/lists" className="btn btn-ghost btn-sm mb-4">
                        <i className="fa-solid fa-duotone fa-arrow-left"></i>
                        Back to Lists
                    </Link>

                    <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                                {list.emoji && (
                                    <i className={`${list.emoji} text-3xl text-primary`}></i>
                                )}
                                <h1 className="text-4xl font-bold">{list.title}</h1>
                            </div>

                            {list.description && (
                                <p className="text-lg text-base-content/70 mb-4">{list.description}</p>
                            )}

                            <div className="flex items-center gap-6 text-sm text-base-content/60">
                                <span>
                                    <i className="fa-solid fa-duotone fa-bookmark mr-2"></i>
                                    {list.item_count} {list.item_count === 1 ? 'item' : 'items'}
                                </span>
                                {list.follower_count > 0 && (
                                    <span>
                                        <i className="fa-solid fa-duotone fa-heart mr-2"></i>
                                        {list.follower_count} {list.follower_count === 1 ? 'follower' : 'followers'}
                                    </span>
                                )}
                                <span>
                                    <i className={`fa-solid fa-duotone ${list.is_public ? 'fa-globe text-info' : 'fa-lock text-base-content/60'} mr-2`}></i>
                                    {list.is_public ? 'Public' : 'Private'}
                                </span>
                                {list.is_collaborative && (
                                    <span>
                                        <i className="fa-solid fa-duotone fa-users text-success mr-2"></i>
                                        Collaborative
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Actions */}
                        {isOwner && (
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handleToggleVisibility}
                                    className="btn btn-outline btn-sm"
                                    title={list.is_public ? 'Make Private' : 'Make Public'}
                                >
                                    <i className={`fa-solid fa-duotone ${list.is_public ? 'fa-lock' : 'fa-lock-open'}`}></i>
                                    {list.is_public ? 'Make Private' : 'Make Public'}
                                </button>
                                <button
                                    onClick={handleDelete}
                                    className="btn btn-outline btn-error btn-sm"
                                >
                                    <i className="fa-solid fa-duotone fa-trash"></i>
                                    Delete
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* List Items */}
                {list.list_items.length === 0 ? (
                    <EmptyState
                        illustration="lists"
                        title="No Items Yet"
                        description="Add discoveries to this list from the stumble page or saved items."
                        action={isOwner ? {
                            label: 'Go to Stumble',
                            href: '/stumble'
                        } : undefined}
                    />
                ) : (
                    <div className="space-y-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {list.list_items
                            .sort((a, b) => a.position - b.position)
                            .map((item, index) => (
                                <div key={item.id} className="relative card bg-base-200 shadow-sm hover:shadow-md transition-shadow duration-200">
                                    {/* Position badge */}
                                    <div className="absolute -left-4 -top-4 hidden lg:block z-10">
                                        <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-sm">
                                            {index + 1}
                                        </div>
                                    </div>

                                    {/* Discovery card */}
                                    <div className="relative">
                                        {item.content && (
                                            <DiscoveryCard
                                                discovery={item.content}
                                                showTrending={false}
                                            />
                                        )}

                                        {/* Item notes */}
                                        {item.notes && (
                                            <div className="mt-2 p-3 bg-base-200 rounded-lg border-l-4 border-primary">
                                                <p className="text-sm text-base-content/80 italic">
                                                    <i className="fa-solid fa-duotone fa-sticky-note mr-2"></i>
                                                    {item.notes}
                                                </p>
                                            </div>
                                        )}

                                        {/* Remove button (owner only) */}
                                        {isOwner && (
                                            <button
                                                onClick={() => handleRemoveItem(item.id)}
                                                className="btn btn-sm btn-ghost btn-error absolute top-4 right-4"
                                                title="Remove from list"
                                            >
                                                <i className="fa-solid fa-duotone fa-times"></i>
                                            </button>
                                        )}

                                        {/* Checkpoint badge */}
                                        {item.is_checkpoint && (
                                            <div className="absolute top-4 left-4">
                                                <div className="badge badge-secondary">
                                                    <i className="fa-solid fa-duotone fa-flag mr-1"></i>
                                                    Checkpoint
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                    </div>
                )}

                {/* Metadata footer */}
                <div className="mt-8 pt-6 border-t border-base-300 text-sm text-base-content/60">
                    <div className="flex items-center justify-between">
                        <div>
                            Created {new Date(list.created_at).toLocaleDateString()}
                        </div>
                        <div>
                            Last updated {new Date(list.updated_at).toLocaleDateString()}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
