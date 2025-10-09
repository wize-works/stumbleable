'use client';

import { ListsAPI } from '@/lib/api-client';
import { useState } from 'react';
import { useToaster } from './toaster';

interface Collaborator {
    id: string;
    user_id: string;
    can_add_items: boolean;
    can_remove_items: boolean;
    can_edit_list: boolean;
    added_at: string;
}

interface CollaboratorModalProps {
    listId: string;
    collaborators: Collaborator[];
    isOwner: boolean;
    token: string;
    onClose: () => void;
    onUpdate: () => void;
}

export function CollaboratorModal({
    listId,
    collaborators,
    isOwner,
    token,
    onClose,
    onUpdate
}: CollaboratorModalProps) {
    const { showToast } = useToaster();
    const [newCollaboratorEmail, setNewCollaboratorEmail] = useState('');
    const [permissions, setPermissions] = useState({
        canAddItems: true,
        canRemoveItems: false,
        canEditList: false
    });
    const [adding, setAdding] = useState(false);

    const handleAddCollaborator = async () => {
        if (!newCollaboratorEmail.trim()) {
            showToast('Please enter an email address', 'warning');
            return;
        }

        setAdding(true);
        try {
            // In a real implementation, you'd need to look up the user ID by email
            // For now, we'll show a message
            showToast('Collaborator feature requires user lookup by email', 'info');

            // await ListsAPI.addCollaborator(listId, {
            //     userId: resolvedUserId,
            //     canAddItems: permissions.canAddItems,
            //     canRemoveItems: permissions.canRemoveItems,
            //     canEditList: permissions.canEditList
            // }, token);

            setNewCollaboratorEmail('');
            setPermissions({
                canAddItems: true,
                canRemoveItems: false,
                canEditList: false
            });
            onUpdate();
            showToast('Collaborator added!', 'success');
        } catch (error) {
            console.error('Failed to add collaborator:', error);
            showToast('Failed to add collaborator', 'error');
        } finally {
            setAdding(false);
        }
    };

    const handleRemoveCollaborator = async (userId: string) => {
        if (!confirm('Remove this collaborator?')) return;

        try {
            await ListsAPI.removeCollaborator(listId, userId, token);
            onUpdate();
            showToast('Collaborator removed', 'info');
        } catch (error) {
            console.error('Failed to remove collaborator:', error);
            showToast('Failed to remove collaborator', 'error');
        }
    };

    return (
        <div className="modal modal-open">
            <div className="modal-box max-w-2xl">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-lg">Manage Collaborators</h3>
                    <button onClick={onClose} className="btn btn-sm btn-circle btn-ghost">
                        <i className="fa-solid fa-duotone fa-xmark"></i>
                    </button>
                </div>

                {/* Current Collaborators */}
                <div className="mb-6">
                    <h4 className="font-semibold mb-3">Current Collaborators ({collaborators.length})</h4>
                    {collaborators.length === 0 ? (
                        <div className="text-center py-8 text-base-content/60">
                            <i className="fa-solid fa-duotone fa-users text-4xl mb-2"></i>
                            <p>No collaborators yet</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {collaborators.map(collab => (
                                <div
                                    key={collab.id}
                                    className="flex items-center justify-between p-3 bg-base-200 rounded-lg"
                                >
                                    <div className="flex-1">
                                        <div className="font-medium">User {collab.user_id.slice(0, 8)}...</div>
                                        <div className="text-xs text-base-content/60 flex gap-2 mt-1">
                                            {collab.can_add_items && (
                                                <span className="badge badge-sm badge-success">Can Add</span>
                                            )}
                                            {collab.can_remove_items && (
                                                <span className="badge badge-sm badge-warning">Can Remove</span>
                                            )}
                                            {collab.can_edit_list && (
                                                <span className="badge badge-sm badge-info">Can Edit</span>
                                            )}
                                        </div>
                                    </div>
                                    {isOwner && (
                                        <button
                                            onClick={() => handleRemoveCollaborator(collab.user_id)}
                                            className="btn btn-sm btn-ghost btn-error"
                                        >
                                            <i className="fa-solid fa-duotone fa-trash"></i>
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Add New Collaborator */}
                {isOwner && (
                    <div>
                        <h4 className="font-semibold mb-3">Add Collaborator</h4>
                        <div className="form-control mb-3">
                            <input
                                type="email"
                                placeholder="Collaborator email"
                                className="input input-bordered w-full"
                                value={newCollaboratorEmail}
                                onChange={(e) => setNewCollaboratorEmail(e.target.value)}
                                disabled={adding}
                            />
                        </div>

                        <div className="form-control mb-4">
                            <label className="label cursor-pointer justify-start gap-3">
                                <input
                                    type="checkbox"
                                    className="checkbox checkbox-primary"
                                    checked={permissions.canAddItems}
                                    onChange={(e) => setPermissions(p => ({ ...p, canAddItems: e.target.checked }))}
                                    disabled={adding}
                                />
                                <div>
                                    <span className="label-text font-medium">Can add items</span>
                                    <p className="text-xs text-base-content/60">
                                        Allow adding discoveries to the list
                                    </p>
                                </div>
                            </label>
                            <label className="label cursor-pointer justify-start gap-3">
                                <input
                                    type="checkbox"
                                    className="checkbox checkbox-warning"
                                    checked={permissions.canRemoveItems}
                                    onChange={(e) => setPermissions(p => ({ ...p, canRemoveItems: e.target.checked }))}
                                    disabled={adding}
                                />
                                <div>
                                    <span className="label-text font-medium">Can remove items</span>
                                    <p className="text-xs text-base-content/60">
                                        Allow removing discoveries from the list
                                    </p>
                                </div>
                            </label>
                            <label className="label cursor-pointer justify-start gap-3">
                                <input
                                    type="checkbox"
                                    className="checkbox checkbox-info"
                                    checked={permissions.canEditList}
                                    onChange={(e) => setPermissions(p => ({ ...p, canEditList: e.target.checked }))}
                                    disabled={adding}
                                />
                                <div>
                                    <span className="label-text font-medium">Can edit list details</span>
                                    <p className="text-xs text-base-content/60">
                                        Allow editing title, description, and settings
                                    </p>
                                </div>
                            </label>
                        </div>

                        <button
                            onClick={handleAddCollaborator}
                            className="btn btn-primary w-full"
                            disabled={adding || !newCollaboratorEmail.trim()}
                        >
                            {adding ? (
                                <span className="loading loading-spinner"></span>
                            ) : (
                                <>
                                    <i className="fa-solid fa-duotone fa-user-plus mr-2"></i>
                                    Add Collaborator
                                </>
                            )}
                        </button>
                    </div>
                )}

                <div className="modal-action">
                    <button onClick={onClose} className="btn">
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
