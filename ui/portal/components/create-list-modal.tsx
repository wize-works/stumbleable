'use client';

import { useState } from 'react';

interface CreateListModalProps {
    onClose: () => void;
    onCreate: (data: { title: string; description: string; icon: string; isPublic: boolean }) => void;
}

export function CreateListModal({ onClose, onCreate }: CreateListModalProps) {
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
