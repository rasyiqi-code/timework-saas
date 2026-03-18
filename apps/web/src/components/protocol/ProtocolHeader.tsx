'use client';

import { useState } from 'react';
import { updateProtocol } from '@/actions/protocol';
import { Check, X, Pencil } from 'lucide-react';

interface ProtocolHeaderProps {
    protocol: {
        id: string;
        name: string;
        description: string | null;
        isDefault: boolean;
        allowedCreators?: { id: string }[];
    };
    users?: { id: string; name: string | null; email: string; role: string }[];
}

export function ProtocolHeader({ protocol, users = [] }: ProtocolHeaderProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [name, setName] = useState(protocol.name);
    const [description, setDescription] = useState(protocol.description || '');
    const [allowedCreatorIds, setAllowedCreatorIds] = useState<string[]>(
        protocol.allowedCreators?.map(u => u.id) || []
    );
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const formData = new FormData();
            formData.append('name', name);
            formData.append('description', description);

            // Append allowed creators
            allowedCreatorIds.forEach(id => {
                formData.append('allowedCreatorIds', id);
            });

            await updateProtocol(protocol.id, formData);
            setIsEditing(false);
        } catch (error) {
            console.error('Failed to update protocol', error);
            alert('Failed to update protocol');
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancel = () => {
        setName(protocol.name);
        setDescription(protocol.description || '');
        setAllowedCreatorIds(protocol.allowedCreators?.map(u => u.id) || []);
        setIsEditing(false);
    };

    const toggleCreator = (userId: string) => {
        setAllowedCreatorIds(prev =>
            prev.includes(userId)
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        );
    };

    if (isEditing) {
        return (
            <div className="space-y-4 w-full animate-in fade-in zoom-in-95 duration-200">
                <div className="flex flex-col gap-3">
                    <input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="text-2xl font-bold text-slate-900 border-b-2 border-indigo-500 bg-transparent focus:outline-none dark:text-slate-100"
                        placeholder="Protocol Name"
                        autoFocus
                    />
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="text-sm text-slate-500 w-full bg-slate-50 border border-slate-200 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400"
                        placeholder="Description..."
                        rows={3}
                    />

                    {/* Allowed Creators Setting */}
                    <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                            Allowed Creators (Who can use this?)
                        </label>
                        <p className="text-xs text-slate-400 mb-2">If no one is selected, <strong>everyone</strong> can use this protocol.</p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-40 overflow-y-auto scrollbar-thin">
                            {users?.filter(u => u.role !== 'SUPER_ADMIN').map(user => (
                                <label key={user.id} className="flex items-center gap-2 p-2 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-pointer hover:border-indigo-500 transition-colors">
                                    <input
                                        type="checkbox"
                                        className="rounded text-indigo-600 focus:ring-indigo-500"
                                        checked={allowedCreatorIds.includes(user.id)}
                                        onChange={() => toggleCreator(user.id)}
                                    />
                                    <div className="truncate text-xs">
                                        <div className="font-semibold text-slate-700 dark:text-slate-200">{user.name || 'Unnamed'}</div>
                                        <div className="text-slate-400 text-[10px]">{user.role}</div>
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleSave}
                        disabled={isSaving || !name.trim()}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded hover:bg-indigo-700 transition-colors disabled:opacity-50"
                    >
                        {isSaving ? 'Saving...' : <><Check className="w-3.5 h-3.5" /> Save Changes</>}
                    </button>
                    <button
                        onClick={handleCancel}
                        disabled={isSaving}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-600 text-xs font-bold rounded hover:bg-slate-50 transition-colors disabled:opacity-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700"
                    >
                        <X className="w-3.5 h-3.5" /> Cancel
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="group relative">
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3 dark:text-slate-100">
                {protocol.name}
                <span className="px-2 py-0.5 rounded border border-slate-200 bg-slate-50 text-slate-500 text-[10px] font-bold uppercase tracking-wider dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400">
                    {protocol.isDefault ? 'Default' : 'Custom'}
                </span>
                <button
                    onClick={() => setIsEditing(true)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-slate-100 rounded text-slate-400 hover:text-indigo-600 dark:hover:bg-slate-800"
                    title="Edit Protocol Details"
                >
                    <Pencil className="w-4 h-4" />
                </button>
            </h1>
            <p className="text-slate-500 text-sm mt-1 dark:text-slate-400">
                {protocol.description || 'No description provided.'}
            </p>
            {protocol.allowedCreators && protocol.allowedCreators.length > 0 && (
                <div className="mt-2 flex items-center gap-1.5 text-xs text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-1 rounded w-fit dark:bg-indigo-900/30 dark:border-indigo-800 dark:text-indigo-300">
                    <span className="font-bold">🔒 Restricted to:</span>
                    <span>{protocol.allowedCreators.length} staff member(s)</span>
                </div>
            )}
        </div>
    );
}
