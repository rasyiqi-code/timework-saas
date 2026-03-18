'use client';

import { useState, useTransition, useOptimistic } from 'react';
import { updateProtocolItem, deleteProtocolItem, addDependency, deleteProtocolDependency, addProtocolItem } from '@/actions/protocol';
import { ProtocolItem, ProtocolDependency } from '@repo/database';
import { Pencil, Check, X, Trash2, GripVertical, Plus, StickyNote } from 'lucide-react';
import { toast } from 'sonner';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { UserAvatar } from '@/components/ui/UserAvatar';

type ItemWithRelations = ProtocolItem & {
    dependsOn: ProtocolDependency[];
    requiredBy: ProtocolDependency[];
    defaultAssignee: { id: string, name: string | null } | null;
    defaultAssignees?: { id: string, name: string | null }[];
    children: (ProtocolItem & {
        defaultAssignee: { id: string, name: string | null } | null;
        defaultAssignees?: { id: string, name: string | null }[];
    })[];
    requireAttachment?: boolean;
    fileAccess: 'PUBLIC' | 'RESTRICTED';
    color?: string | null;
    allowedFileViewers?: { id: string, name: string | null }[];
};

type ProtocolItemMetadata = {
    completionEffect?: {
        rowColor: string | null;
    } | null;
    allowSkip?: boolean;
};

interface ProtocolItemRowProps {
    item: ItemWithRelations;
    index: number;
    allItems: ItemWithRelations[];
    users: { id: string, name: string | null }[];
}

export function ProtocolItemRow({ item, index, allItems, users }: ProtocolItemRowProps) {
    const [isEditing, setIsEditing] = useState(false);

    const [isPending, startTransition] = useTransition();
    const [isAddingSubtask, setIsAddingSubtask] = useState(false);
    const [showDescription, setShowDescription] = useState(false);
    const [showAssigneePicker, setShowAssigneePicker] = useState(false);
    const [showViewerPicker, setShowViewerPicker] = useState(false);



    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: item.id });

    const [title, setTitle] = useState(item.title);
    const [description, setDescription] = useState(item.description || '');
    const [assigneeIds, setAssigneeIds] = useState<string[]>(
        item.defaultAssignees?.map(u => u.id) || (item.defaultAssigneeId ? [item.defaultAssigneeId] : [])
    );
    const [type, setType] = useState(item.type);
    const [requireAttachment, setRequireAttachment] = useState(item.requireAttachment || false);
    const [fileAccess, setFileAccess] = useState<'PUBLIC' | 'RESTRICTED'>(item.fileAccess || 'PUBLIC');
    const [viewerIds, setViewerIds] = useState<string[]>(item.allowedFileViewers?.map(u => u.id) || []);
    const [color, setColor] = useState(item.color || '#6366f1');
    const [rowEffect, setRowEffect] = useState<string>(() => {
        const meta = item.metadata as unknown as ProtocolItemMetadata;
        const stored = meta?.completionEffect?.rowColor || '';
        // Legacy Map
        if (stored === 'bg-red-50') return '#890000'; // Deep Red
        if (stored === 'bg-red-100') return '#890000';
        if (stored === 'bg-amber-50') return '#b45309'; // Deep Amber
        if (stored === 'bg-amber-100') return '#b45309';
        if (stored === 'bg-emerald-50') return '#064e3b'; // Deep Emerald
        if (stored === 'bg-emerald-100') return '#064e3b';

        return stored;
    });
    const [allowSkip, setAllowSkip] = useState<boolean>(() => {
        const meta = item.metadata as unknown as ProtocolItemMetadata;
        return meta?.allowSkip || false;
    });

    // Optimistic UI Hook
    const [optimisticItem, addOptimisticItem] = useOptimistic(
        item,
        (state, newValues: Partial<ItemWithRelations>) => ({ ...state, ...newValues })
    );

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 'auto',
        opacity: isDragging ? 0.3 : 1,
    };

    const handleSave = async () => {
        const selectedUsers = users.filter(u => assigneeIds.includes(u.id));

        startTransition(async () => {
            // 1. Optimistic Update (Instant feedback)
            addOptimisticItem({
                title,
                description,
                type: type as ProtocolItem['type'],
                defaultAssigneeId: assigneeIds.length > 0 ? assigneeIds[0] : null,
                defaultAssignee: selectedUsers.length > 0 ? selectedUsers[0] : null,
                defaultAssignees: selectedUsers,
                requireAttachment,
                fileAccess,
                allowedFileViewers: users.filter(u => viewerIds.includes(u.id)),
                color,
            });

            // 2. Close Form UI Immediately
            setIsEditing(false);

            // 3. Perform Server Action in Background
            try {
                const formData = new FormData();
                formData.append('title', title);
                formData.append('description', description);
                assigneeIds.forEach(id => formData.append('defaultAssigneeIds', id));
                // Legacy support (optional, but good for singular field)
                formData.append('defaultAssigneeId', assigneeIds.length > 0 ? assigneeIds[0] : '');
                formData.append('type', type);
                formData.append('requireAttachment', String(requireAttachment));
                formData.append('fileAccess', fileAccess);
                viewerIds.forEach(id => formData.append('allowedFileViewerIds', id));
                formData.append('color', color);

                const metadataPayload: ProtocolItemMetadata = { allowSkip };
                if (rowEffect) {
                    metadataPayload.completionEffect = { rowColor: rowEffect };
                } else {
                    metadataPayload.completionEffect = null;
                }
                formData.append('metadata', JSON.stringify(metadataPayload));


                await updateProtocolItem(item.id, formData);
                toast.success('Saved');
            } catch (error) {
                console.error(error);
                toast.error('Failed to save');
                // Revert is automatic when server revalidates, or we could reopen form here ideally
            }
        });
    };

    const handleCancel = () => {
        setTitle(item.title);
        setDescription(item.description || '');
        setAssigneeIds(item.defaultAssignees?.map(u => u.id) || (item.defaultAssigneeId ? [item.defaultAssigneeId] : []));
        setType(item.type);
        setRequireAttachment(item.requireAttachment || false);
        setFileAccess(item.fileAccess || 'PUBLIC');
        setViewerIds(item.allowedFileViewers?.map(u => u.id) || []);
        setColor(item.color || '#6366f1');
        const meta = item.metadata as unknown as ProtocolItemMetadata;
        const storedParams = meta?.completionEffect?.rowColor || '';
        // Same legacy mapping for cancel revert
        // Same legacy mapping for cancel revert
        let normalizedParams = storedParams;
        if (storedParams === 'bg-red-50' || storedParams === 'bg-red-100') normalizedParams = '#890000';
        else if (storedParams === 'bg-amber-50' || storedParams === 'bg-amber-100') normalizedParams = '#b45309';
        else if (storedParams === 'bg-emerald-50' || storedParams === 'bg-emerald-100') normalizedParams = '#064e3b';

        setRowEffect(normalizedParams);
        setAllowSkip(meta?.allowSkip || false);
        setIsEditing(false);
    }

    const handleAddDependency = (prereqId: string) => {
        if (!prereqId) return;

        startTransition(async () => {
            try {
                await addDependency(item.id, prereqId);
                toast.success('Dependency added');
            } catch (error) {
                console.error(error);
                if (error instanceof Error && error.message.includes('Cycle detected')) {
                    toast.error('Cannot add dependency: Cycle detected');
                } else {
                    toast.error('Failed to add dependency');
                }
            }
        });
    }

    const handleDeleteDependency = (depId: string) => {
        startTransition(async () => {
            try {
                await deleteProtocolDependency(depId);
                toast.success('Dependency removed');
            } catch (error) {
                console.error(error);
                toast.error('Failed to remove dependency');
            }
        });
    }

    // Check if it is a NOTE
    const isNote = item.type === 'NOTE';
    const isGroup = item.type === 'GROUP';

    if (isEditing) {
        return (
            <div ref={setNodeRef} style={style} className="relative group flex items-start opacity-100 scale-100 transition-all">
                <div className="flex-1 bg-white border border-indigo-200 rounded-lg p-3 shadow-md flex flex-col gap-3 dark:bg-slate-900 dark:border-indigo-500/50 z-10 transition-all">
                    {/* EDIT FORM */}
                    <div className="flex flex-col md:flex-row gap-3 items-start">
                        {/* Type Switcher */}
                        <div className="flex bg-slate-100 rounded-lg p-1 shrink-0 dark:bg-slate-800 text-[10px] font-bold border border-slate-200 dark:border-slate-700">
                            <button type="button" onClick={() => setType('TASK')} className={`px-2 py-1.5 rounded-md flex items-center gap-1 transition-all ${type === 'TASK' ? 'bg-white shadow-sm text-indigo-600 dark:bg-slate-700 dark:text-indigo-300' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}>Task</button>
                            <button type="button" onClick={() => setType('NOTE')} className={`px-2 py-1.5 rounded-md flex items-center gap-1 transition-all ${type === 'NOTE' ? 'bg-white shadow-sm text-amber-600 dark:bg-slate-700 dark:text-amber-300' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}>Note</button>
                            <button type="button" onClick={() => setType('GROUP')} className={`px-2 py-1.5 rounded-md flex items-center gap-1 transition-all ${type === 'GROUP' ? 'bg-white shadow-sm text-slate-800 dark:bg-slate-700 dark:text-slate-200' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}>Group</button>
                        </div>

                        {/* Inputs Container */}
                        <div className="flex-1 w-full space-y-2">
                            <input
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full px-3 py-1.5 text-sm font-semibold border border-slate-200 rounded-md focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                                placeholder="Task Title"
                                autoFocus
                            />

                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full px-3 py-1.5 text-xs text-slate-600 border border-slate-200 rounded-md focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 resize-y min-h-[40px]"
                                placeholder="Description (Optional)..."
                                rows={2}
                            />
                        </div>
                    </div>

                    {/* Footer: Assignee & Actions */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800/50">
                        <div className="flex items-center gap-3">
                            {!isGroup && (
                                <div className="relative">
                                    <button
                                        type="button"
                                        onClick={() => setShowAssigneePicker(!showAssigneePicker)}
                                        className={`px-2 py-1 text-xs border rounded transition-colors flex items-center gap-1 dark:bg-slate-800 dark:border-slate-700 dark:text-white ${showAssigneePicker ? 'bg-white border-indigo-400 ring-2 ring-indigo-500/20' : 'bg-slate-50 border-slate-200 hover:bg-white'}`}
                                        title="Select Assignees"
                                    >
                                        <span className="font-medium text-[10px] text-slate-500 dark:text-slate-400">Assignees:</span>
                                        {assigneeIds.length === 0 ? (
                                            <span className="text-slate-400 italic">None</span>
                                        ) : (
                                            <div className="flex pl-1 items-center">
                                                {users.filter(u => assigneeIds.includes(u.id)).slice(0, 3).map(u => (
                                                    <UserAvatar
                                                        key={u.id}
                                                        user={u}
                                                        size="sm"
                                                        className="-ml-1.5 first:ml-0 ring-white dark:ring-slate-800 bg-indigo-100 text-indigo-700"
                                                    />
                                                ))}
                                                {assigneeIds.length > 3 && (
                                                    <div className="w-4 h-4 rounded-full bg-slate-100 ring-2 ring-white flex items-center justify-center text-[8px] text-slate-500 dark:bg-slate-800 dark:ring-slate-800 -ml-1.5 z-10">
                                                        +{assigneeIds.length - 3}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </button>
                                    
                                    {showAssigneePicker && (
                                        <div className="fixed inset-0 z-40" onClick={() => setShowAssigneePicker(false)} />
                                    )}

                                    {/* Dropdown */}
                                    <div className={`absolute bottom-full left-0 mb-1 w-56 bg-white border border-slate-200 rounded-lg shadow-2xl z-50 max-h-60 overflow-y-auto dark:bg-slate-900 dark:border-slate-700 p-1 space-y-0.5 ${showAssigneePicker ? 'block animate-in fade-in slide-in-from-bottom-2 duration-200' : 'hidden'}`}>
                                        <div className="px-2 py-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-tight border-b border-slate-100 dark:border-slate-800 mb-1">Select Assignees</div>
                                        {users.map(u => (
                                            <label key={u.id} className="flex items-center gap-2 px-2 py-1.5 hover:bg-indigo-50 dark:hover:bg-indigo-900/40 cursor-pointer rounded-md transition-colors group">
                                                <input
                                                    type="checkbox"
                                                    checked={assigneeIds.includes(u.id)}
                                                    onChange={(e) => {
                                                        if (e.target.checked) setAssigneeIds([...assigneeIds, u.id]);
                                                        else setAssigneeIds(assigneeIds.filter(id => id !== u.id));
                                                    }}
                                                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 dark:bg-slate-800 dark:border-slate-600"
                                                />
                                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                                    <UserAvatar user={u} size="xs" />
                                                    <span className="text-xs text-slate-700 dark:text-slate-300 truncate font-medium group-hover:text-indigo-700 dark:group-hover:text-indigo-300">{u.name}</span>
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Divider */}
                            {!isGroup && <div className="w-px h-4 bg-slate-200 dark:bg-slate-700"></div>}

                            <label className="flex items-center gap-2 text-[10px] text-slate-500 cursor-pointer select-none hover:text-slate-800 transition-colors dark:text-slate-400 dark:hover:text-slate-200">
                                <input
                                    type="checkbox"
                                    checked={requireAttachment}
                                    onChange={(e) => setRequireAttachment(e.target.checked)}
                                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 dark:bg-slate-800 dark:border-slate-700"
                                />
                                <span>Require File Upload</span>
                            </label>

                            <label className="flex items-center gap-2 text-[10px] text-slate-500 cursor-pointer select-none hover:text-slate-800 transition-colors dark:text-slate-400 dark:hover:text-slate-200">
                                <input
                                    type="checkbox"
                                    checked={allowSkip}
                                    onChange={(e) => setAllowSkip(e.target.checked)}
                                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 dark:bg-slate-800 dark:border-slate-700"
                                />
                                <span>Allow Skip</span>
                            </label>

                            {/* File Access Selector */}
                            <div className="flex items-center gap-1 border-l pl-3 border-slate-200 dark:border-slate-700">
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight mr-1">Access:</span>
                                <select
                                    value={fileAccess}
                                    onChange={(e) => setFileAccess(e.target.value as 'PUBLIC' | 'RESTRICTED')}
                                    className="text-[10px] bg-white border border-slate-200 rounded px-1.5 py-0.5 focus:outline-none focus:border-indigo-500 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300"
                                >
                                    <option value="PUBLIC">Public</option>
                                    <option value="RESTRICTED">Restricted</option>
                                </select>
                            </div>

                            {/* Allowed Viewers Selector (Option 1) */}
                            {fileAccess === 'RESTRICTED' && (
                                <div className="flex items-center gap-1 border-l pl-3 border-slate-200 dark:border-slate-700">
                                    <div className="relative">
                                        <button
                                            type="button"
                                            onClick={() => setShowViewerPicker(!showViewerPicker)}
                                            className={`px-2 py-1 text-xs border rounded transition-colors flex items-center gap-1 dark:bg-slate-800 dark:border-slate-700 dark:text-white ${showViewerPicker ? 'bg-white border-red-400 ring-2 ring-red-500/20' : 'bg-slate-50 border-slate-200 hover:bg-white'}`}
                                            title="Select Allowed Viewers"
                                        >
                                            <span className="font-bold text-[10px] text-red-500 uppercase tracking-tight">Viewers:</span>
                                            {viewerIds.length === 0 ? (
                                                <span className="text-slate-400 italic text-[10px]">All Assignees</span>
                                            ) : (
                                                <div className="flex pl-1 items-center">
                                                    {users.filter(u => viewerIds.includes(u.id)).slice(0, 2).map(u => (
                                                        <UserAvatar
                                                            key={u.id}
                                                            user={u}
                                                            size="sm"
                                                            className="-ml-1 first:ml-0 ring-white dark:ring-slate-800 bg-red-100 text-red-700"
                                                        />
                                                    ))}
                                                    {viewerIds.length > 2 && (
                                                        <div className="w-3.5 h-3.5 rounded-full bg-slate-100 ring-1 ring-white flex items-center justify-center text-[7px] text-slate-500 -ml-1 z-10">
                                                            +{viewerIds.length - 2}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </button>

                                        {showViewerPicker && (
                                            <div className="fixed inset-0 z-40" onClick={() => setShowViewerPicker(false)} />
                                        )}

                                        {/* Dropdown */}
                                        <div className={`absolute bottom-full left-0 mb-1 w-56 bg-white border border-slate-200 rounded-lg shadow-2xl z-50 max-h-60 overflow-y-auto dark:bg-slate-900 dark:border-slate-700 p-1 space-y-0.5 ${showViewerPicker ? 'block animate-in fade-in slide-in-from-bottom-2 duration-200' : 'hidden'}`}>
                                            <div className="px-2 py-1.5 text-[10px] font-bold text-red-500 uppercase tracking-tight border-b border-slate-100 dark:border-slate-800 mb-1">Select Viewers</div>
                                            {users.map(u => (
                                                <label key={u.id} className="flex items-center gap-2 px-2 py-1.5 hover:bg-red-50 dark:hover:bg-red-900/40 cursor-pointer rounded-md transition-colors group">
                                                    <input
                                                        type="checkbox"
                                                        checked={viewerIds.includes(u.id)}
                                                        onChange={(e) => {
                                                            if (e.target.checked) setViewerIds([...viewerIds, u.id]);
                                                            else setViewerIds(viewerIds.filter(id => id !== u.id));
                                                        }}
                                                        className="rounded border-slate-300 text-red-600 focus:ring-red-500 w-4 h-4 dark:bg-slate-800 dark:border-slate-600"
                                                    />
                                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                                        <UserAvatar user={u} size="xs" />
                                                        <span className="text-xs text-slate-700 dark:text-slate-300 truncate font-medium group-hover:text-red-700 dark:group-hover:text-red-300">{u.name}</span>
                                                    </div>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Color Picker Edit */}
                            <div className="flex items-center gap-1 border-l pl-3 border-slate-200 dark:border-slate-700">
                                <input
                                    type="color"
                                    value={color}
                                    onChange={(e) => setColor(e.target.value)}
                                    className="w-5 h-5 p-0 border-0 rounded-full cursor-pointer overflow-hidden bg-transparent"
                                />
                            </div>

                            {/* Row Effect Dropdown */}
                            {/* Row Effect Color Picker (Visual) */}
                            <div className="border-l pl-3 ml-1 border-slate-200 dark:border-slate-700 flex items-center gap-2">
                                {/* Presets for Pekat Colors */}
                                <div className="flex gap-1 mr-1">
                                    <button type="button" onClick={() => setRowEffect('#890000')} className="w-4 h-4 rounded-full bg-[#890000] border border-slate-200 hover:scale-110 transition-transform" title="Deep Red" />
                                    <button type="button" onClick={() => setRowEffect('#b45309')} className="w-4 h-4 rounded-full bg-[#b45309] border border-slate-200 hover:scale-110 transition-transform" title="Deep Amber" />
                                    <button type="button" onClick={() => setRowEffect('#064e3b')} className="w-4 h-4 rounded-full bg-[#064e3b] border border-slate-200 hover:scale-110 transition-transform" title="Deep Emerald" />
                                </div>

                                <label className="flex items-center gap-1.5 cursor-pointer group/effect" title="Select Row Color Effect">
                                    <div className="relative">
                                        <div
                                            className="w-5 h-5 rounded-full border border-slate-200 shadow-sm transition-transform active:scale-95"
                                            style={{ backgroundColor: rowEffect || '#f8fafc' }}
                                        />
                                        <input
                                            type="color"
                                            value={rowEffect && rowEffect.startsWith('#') && rowEffect.length <= 7 ? rowEffect : '#890000'}
                                            onChange={(e) => setRowEffect(e.target.value)}
                                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                        />
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-500 group-hover/effect:text-slate-800 transition-colors">
                                        {rowEffect ? 'Effect On' : 'No Effect'}
                                    </span>
                                </label>
                                {rowEffect && (
                                    <button
                                        type="button"
                                        onClick={() => setRowEffect('')}
                                        className="text-[10px] text-slate-400 hover:text-red-500 px-1"
                                        title="Clear Effect"
                                    >
                                        Clear
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={handleCancel}
                                disabled={isPending}
                                className="px-3 py-1.5 bg-slate-100 text-slate-600 text-xs font-bold rounded-md hover:bg-slate-200 transition-colors dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 flex items-center gap-1"
                            >
                                <X className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Cancel</span>
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={isPending}
                                className="px-4 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-md hover:bg-indigo-700 shadow-sm transition-colors flex items-center gap-1.5 disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                <Check className="w-3.5 h-3.5" /> Save
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div ref={setNodeRef} style={style} className="relative group">
            {/* Connector Line */}
            {index < allItems.length - 1 && (
                <div className="absolute left-[19px] top-8 h-full w-px bg-slate-200 -z-10 group-hover:bg-indigo-300 dark:bg-slate-800 dark:group-hover:bg-indigo-500/50"></div>
            )}

            <div className="flex items-start">
                <div className={`w-[40px] flex justify-center shrink-0 pt-3 cursor-grab active:cursor-grabbing hover:text-indigo-500 ${isNote ? 'text-amber-400' : 'text-slate-300'}`}
                    {...attributes} {...listeners}>
                    <GripVertical className="w-4 h-4" />
                </div>

                <div className={`flex-1 border rounded-lg p-2 hover:shadow-sm transition-all flex flex-col gap-2 
                    ${isGroup
                        ? 'bg-slate-100 border-transparent shadow-none rounded-md mb-2 dark:bg-slate-800 dark:border-slate-700/50'
                        : isNote
                            ? 'bg-amber-50/50 border-amber-200 hover:border-amber-300 dark:bg-amber-900/10 dark:border-amber-900/50 dark:hover:border-amber-800'
                            : 'bg-white border-slate-100 hover:border-indigo-200 dark:bg-slate-900 dark:border-slate-800 dark:hover:border-indigo-500/50'
                    }`}
                    style={!isGroup && !isNote && optimisticItem.color ? { borderLeftColor: optimisticItem.color, borderLeftWidth: '3px' } : {}}
                >

                    {/* Top Section: Columns */}
                    <div className="flex flex-col md:flex-row gap-2 md:items-center">

                        {/* Left: Title & Meta */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                <span className={`text-xs font-mono ${isNote ? 'text-amber-600/50 dark:text-amber-500/50' : 'text-slate-400 dark:text-slate-500'}`}>#{index + 1}</span>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <h4 className={`truncate cursor-pointer hover:underline 
                                            ${isGroup
                                                ? 'font-black uppercase text-xs tracking-wider text-slate-500 dark:text-slate-400'
                                                : isNote
                                                    ? 'font-bold text-sm text-amber-900 dark:text-amber-100'
                                                    : 'font-bold text-sm text-slate-800 dark:text-slate-200 hover:text-indigo-600'
                                            }`} onClick={() => setIsEditing(true)}>
                                            {optimisticItem.title}
                                        </h4>
                                        {optimisticItem.description && (
                                            <button
                                                onClick={() => setShowDescription(!showDescription)}
                                                className={`transition-colors p-0.5 rounded ${showDescription ? 'text-indigo-500 bg-indigo-50' : 'text-slate-400 hover:text-indigo-500'}`}
                                                title="Show Note/Description"
                                            >
                                                <StickyNote className="w-3.5 h-3.5" />
                                            </button>
                                        )}
                                    </div>
                                    <div className="flex gap-1 mt-0.5 items-center">
                                        {optimisticItem.requireAttachment && (
                                            <span className="text-[9px] font-bold text-slate-500 bg-slate-100 px-1 py-0.5 rounded border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700">
                                                📎 File Required
                                            </span>
                                        )}
                                        {optimisticItem.fileAccess === 'RESTRICTED' && (
                                            <span className="text-[9px] font-bold text-red-500 bg-red-50 px-1 py-0.5 rounded border border-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/50">
                                                🔒 Restricted Access
                                            </span>
                                        )}
                                        {(() => {
                                            const meta = optimisticItem.metadata as unknown as ProtocolItemMetadata;
                                            const rowColor = meta?.completionEffect?.rowColor;
                                            if (!rowColor) return null;

                                            // Map legacy class to hex for display
                                            let displayColor = rowColor;
                                            if (rowColor.includes('red')) displayColor = '#890000';
                                            else if (rowColor.includes('amber')) displayColor = '#b45309';
                                            else if (rowColor.includes('emerald')) displayColor = '#064e3b';

                                            return (
                                                <span className="text-[9px] font-bold text-slate-500 bg-slate-50 px-1 py-0.5 rounded border border-slate-100 flex items-center gap-1 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700" title="Completion Row Effect">
                                                    <span className="w-2 h-2 rounded-full border border-black/10" style={{ backgroundColor: displayColor }}></span>
                                                    Effect On
                                                </span>
                                            );
                                        })()}
                                    </div>
                                </div>
                            </div>


                        </div>

                        {/* Middle: Dependencies (Show mostly for tasks, but Notes can be dependants too) */}
                        <div className="flex-1 md:border-l md:border-slate-100 md:pl-3 min-w-0 dark:md:border-slate-800">
                            {!isGroup && (
                                optimisticItem.dependsOn.length > 0 ? (
                                    <div className="flex flex-wrap gap-1">
                                        {optimisticItem.dependsOn.map(dep => {
                                            const prereq = allItems.find(i => i.id === dep.prerequisiteId);
                                            return (
                                                <span key={dep.id} className="bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded text-[10px] border border-amber-100 flex items-center gap-1 group/badge truncate max-w-full dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800">
                                                    <span className="truncate">{prereq?.title || '?'}</span>
                                                    <button
                                                        onClick={() => handleDeleteDependency(dep.id)}
                                                        className="w-3 h-3 flex items-center justify-center rounded-full hover:bg-amber-200 text-amber-500 hover:text-red-500 opacity-0 group-hover/badge:opacity-100 transition-opacity dark:hover:bg-amber-900/50"
                                                        title="Remove"
                                                        type="button"
                                                        disabled={isPending}
                                                    >
                                                        ×
                                                    </button>
                                                </span>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <span className="text-[10px] text-slate-300 italic dark:text-slate-600">No prerequisites</span>
                                )
                            )}
                        </div>

                        {/* Right: Actions */}
                        <div className="flex items-center gap-2 justify-end pt-2 md:pt-0 border-t md:border-t-0 border-slate-50 shrink-0 dark:border-slate-800">

                            {/* Assignees (Relocated) */}
                            {!isGroup && (
                                optimisticItem.defaultAssignees && optimisticItem.defaultAssignees.length > 0 ? (
                                    <div className="flex pl-1.5 isolate">
                                        {optimisticItem.defaultAssignees.slice(0, 3).map(u => (
                                            <UserAvatar
                                                key={u.id}
                                                user={u}
                                                size="sm"
                                                className="-ml-1.5 first:ml-0 ring-white dark:ring-slate-800"
                                            />
                                        ))}
                                        {optimisticItem.defaultAssignees.length > 3 && (
                                            <div className="w-5 h-5 rounded-full ring-2 ring-white bg-slate-100 flex items-center justify-center text-[8px] font-bold text-slate-500 -ml-1.5 z-10 dark:bg-slate-800 dark:ring-slate-800">
                                                +{optimisticItem.defaultAssignees.length - 3}
                                            </div>
                                        )}
                                    </div>
                                ) : optimisticItem.defaultAssignee ? (
                                    <UserAvatar
                                        user={optimisticItem.defaultAssignee}
                                        size="sm"
                                        className="ring-white dark:ring-slate-900"
                                    />
                                ) : null
                            )}

                            {/* Add Subtask Button (Only for top-level items) */}
                            {!optimisticItem.parentId && (
                                <button
                                    onClick={() => setIsAddingSubtask(!isAddingSubtask)}
                                    className="p-1.5 rounded transition-colors opacity-0 group-hover:opacity-100 text-slate-300 hover:text-indigo-500 hover:bg-indigo-50 dark:text-slate-600 dark:hover:bg-indigo-900/20"
                                    title="Add Subtask"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                </button>
                            )}

                            {/* Edit Button */}
                            <button
                                onClick={() => setIsEditing(true)}
                                className={`p-1.5 rounded transition-colors opacity-0 group-hover:opacity-100 ${isNote ? 'text-amber-400 hover:text-amber-600 hover:bg-amber-100' : 'text-slate-300 hover:text-indigo-500 hover:bg-indigo-50 dark:text-slate-600 dark:hover:bg-indigo-900/20'}`}
                                title="Edit Task"
                            >
                                <Pencil className="w-3.5 h-3.5" />
                            </button>

                            {/* Quick Prerequisite Selector */}
                            {!isGroup && (
                                <div className="w-24">
                                    <select
                                        className="w-full py-1 pl-1 pr-4 text-[10px] rounded bg-slate-50 border-0 ring-1 ring-slate-100 focus:ring-indigo-300 text-slate-500 dark:bg-slate-800 dark:text-slate-400 dark:ring-slate-700 disabled:opacity-50"
                                        onChange={(e) => {
                                            handleAddDependency(e.target.value);
                                            e.target.value = ''; // Reset
                                        }}
                                        defaultValue=""
                                        disabled={isPending}
                                    >
                                        <option value="" disabled>+ Dep</option>
                                        {allItems
                                            .filter(i => i.id !== optimisticItem.id)
                                            .filter(i => !optimisticItem.dependsOn.some(d => d.prerequisiteId === i.id))
                                            .map(i => (
                                                <option key={i.id} value={i.id}>{i.title}</option>
                                            ))
                                        }
                                    </select>
                                </div>
                            )}

                            <button
                                onClick={() => {
                                    if (confirm("Delete this?")) {
                                        deleteProtocolItem(optimisticItem.id);
                                    }
                                }}
                                className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded transition-colors dark:text-slate-600 dark:hover:bg-red-900/20"
                                title="Delete"
                                type="button"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>

                    {/* Description Full Width */}
                    {optimisticItem.description && showDescription && (
                        <div className="w-full mt-1 pt-1 border-t border-slate-100 dark:border-slate-800/50">
                            <p className={`text-xs whitespace-pre-wrap p-2 rounded bg-slate-50 border border-slate-100 ${isNote ? 'text-amber-800 bg-amber-50/50 border-amber-100 dark:text-amber-300 dark:bg-amber-900/20 dark:border-amber-800/50' : 'text-slate-600 dark:text-slate-400 dark:bg-slate-800/50 dark:border-slate-700'}`}>
                                {optimisticItem.description}
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Subtask Creation Form */}
            {
                isAddingSubtask && (
                    <div className="ml-8 mt-2 p-2 border border-dashed border-indigo-200 rounded-lg bg-indigo-50/50 dark:bg-indigo-900/10 dark:border-indigo-800">
                        <SubtaskForm
                            protocolId={item.protocolId}
                            parentId={item.id}
                            onCancel={() => setIsAddingSubtask(false)}
                            users={users}
                        />
                    </div>
                )
            }

            {/* Render Children (Subtasks) Recursively */}
            {
                (() => {
                    // Derived children from allItems for full feature support
                    const children = allItems.filter(i => i.parentId === item.id).sort((a, b) => a.order - b.order);

                    if (children.length === 0) return null;

                    return (
                        <div className="ml-8 space-y-2 mt-2 border-l-2 border-slate-100 dark:border-slate-800 pl-4">
                            {children.map((child, i) => (
                                <ProtocolItemRow
                                    key={child.id}
                                    item={child}
                                    index={i}
                                    allItems={allItems} // Pass full context
                                    users={users}
                                />
                            ))}
                        </div>
                    );
                })()
            }
        </div >
    );
}

function SubtaskForm({ protocolId, parentId, onCancel, users }: { protocolId: string, parentId: string, onCancel: () => void, users: { id: string, name: string | null }[] }) {
    return (
        <form action={async (formData) => {
            formData.append('parentId', parentId);
            await addProtocolItem(protocolId, formData);
            onCancel();
            toast.success('Subtask added');
        }} className="flex gap-2 items-center">
            <input
                name="title"
                placeholder="Subtask title..."
                className="flex-1 px-2 py-1 text-xs border rounded focus:outline-none focus:border-indigo-500 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                autoFocus
                required
            />
            <input name="description" placeholder="Description..." className="hidden" /> {/* Optional, kept simple */}
            <select
                name="defaultAssigneeId"
                className="w-24 px-2 py-1 text-xs border rounded dark:bg-slate-800 dark:border-slate-700 dark:text-white"
            >
                <option value="">User</option>
                {users.map(u => (
                    <option key={u.id} value={u.id}>{u.name || 'User'}</option>
                ))}
            </select>
            <button type="submit" className="px-2 py-1 bg-indigo-600 text-white text-xs rounded hover:bg-indigo-700">Add</button>
            <button type="button" onClick={onCancel} className="px-2 py-1 text-slate-500 text-xs hover:text-slate-700">Cancel</button>
        </form>
    )
}
