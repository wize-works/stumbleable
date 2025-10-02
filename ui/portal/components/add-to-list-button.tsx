'use client';

import { useAuth, useUser } from '@clerk/nextjs';
import { useEffect, useRef, useState } from 'react';
import { ListsAPI, UserList } from '../lib/api-client';

interface AddToListButtonProps {
    discoveryId: string;
    onAdded?: (listId: string, listTitle: string) => void;
    className?: string;
    size?: 'xs' | 'sm' | 'md' | 'lg';
    variant?: 'circle' | 'square' | 'normal';
    showLabel?: boolean;
}

export function AddToListButton({
    discoveryId,
    onAdded,
    className = '',
    size = 'md',
    variant = 'circle',
    showLabel = false
}: AddToListButtonProps) {
    const { getToken } = useAuth();
    const { user } = useUser();
    const [lists, setLists] = useState<UserList[]>([]);
    const [loading, setLoading] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [addedToLists, setAddedToLists] = useState<Set<string>>(new Set());
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Load user's lists when dropdown opens
    useEffect(() => {
        async function loadLists() {
            if (!dropdownOpen) return;

            try {
                setLoading(true);
                const token = await getToken();
                if (!token) return;
                if (!user) return;

                const response = await ListsAPI.getUserLists(user?.id, token);
                setLists(response.lists);

                // Check which lists already contain this discovery
                // TODO: Add API endpoint to check if content is in list
                // For now, we'll just track additions in this session
            } catch (error) {
                console.error('Failed to load lists:', error);
            } finally {
                setLoading(false);
            }
        }

        loadLists();
    }, [dropdownOpen, getToken]);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setDropdownOpen(false);
            }
        }

        if (dropdownOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [dropdownOpen]);

    const handleAddToList = async (listId: string, listTitle: string) => {
        try {
            const token = await getToken();
            if (!token) return;

            await ListsAPI.addItemToList(listId, { contentId: discoveryId }, token);

            // Mark as added
            setAddedToLists(prev => new Set(prev).add(listId));

            // Notify parent
            onAdded?.(listId, listTitle);

            // Don't close dropdown - allow adding to multiple lists
        } catch (error: any) {
            console.error('Failed to add to list:', error);
            // Check if already added
            if (error?.status === 409) {
                setAddedToLists(prev => new Set(prev).add(listId));
            }
        }
    };

    const handleCreateNewList = () => {
        setDropdownOpen(false);
        // Navigate to lists page - parent component should handle this
        window.location.href = '/lists';
    };

    const buttonClasses = [
        'btn',
        variant === 'circle' ? 'btn-circle' : variant === 'square' ? 'btn-square' : '',
        `btn-${size}`,
        'btn-ghost',
        'hover:btn-primary',
        className
    ].filter(Boolean).join(' ');

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className={buttonClasses}
                title="Add to List"
            >
                <i className="fa-solid fa-duotone fa-folder-plus"></i>
                {showLabel && <span className="ml-2">Add to List</span>}
            </button>

            {dropdownOpen && (
                <div className="absolute bottom-full mb-2 right-0 w-64 bg-base-100 rounded-lg shadow-2xl border border-base-300 z-50 max-h-96 overflow-hidden flex flex-col">
                    <div className="p-3 border-b border-base-300 bg-base-200">
                        <h3 className="font-semibold text-sm">Add to List</h3>
                    </div>

                    <div className="overflow-y-auto flex-1">
                        {loading ? (
                            <div className="p-4 text-center">
                                <span className="loading loading-spinner loading-sm"></span>
                            </div>
                        ) : lists.length === 0 ? (
                            <div className="p-4 text-center text-sm text-base-content/60">
                                <p className="mb-2">No lists yet</p>
                                <button
                                    onClick={handleCreateNewList}
                                    className="btn btn-sm btn-primary"
                                >
                                    <i className="fa-solid fa-duotone fa-plus mr-1"></i>
                                    Create First List
                                </button>
                            </div>
                        ) : (
                            <div className="py-1">
                                {lists.map((list) => {
                                    const isAdded = addedToLists.has(list.id);

                                    return (
                                        <button
                                            key={list.id}
                                            onClick={() => handleAddToList(list.id, list.title)}
                                            disabled={isAdded}
                                            className="w-full px-4 py-2 hover:bg-base-200 flex items-center gap-3 text-left transition-colors disabled:opacity-50"
                                        >
                                            {list.emoji && (
                                                <i className={`${list.emoji} text-primary`}></i>
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <div className="font-medium text-sm truncate">
                                                    {list.title}
                                                </div>
                                                <div className="text-xs text-base-content/60">
                                                    {list.item_count} {list.item_count === 1 ? 'item' : 'items'}
                                                </div>
                                            </div>
                                            {isAdded && (
                                                <i className="fa-solid fa-duotone fa-check text-success text-sm"></i>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    <div className="p-2 border-t border-base-300 bg-base-200">
                        <button
                            onClick={handleCreateNewList}
                            className="btn btn-sm btn-ghost w-full justify-start"
                        >
                            <i className="fa-solid fa-duotone fa-plus"></i>
                            Create New List
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
