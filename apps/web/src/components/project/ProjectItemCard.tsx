'use client';

import { useState, useTransition } from 'react';
import { updateItemStatus } from '@/actions/project';
import { useRouter } from 'next/navigation';
import { AssigneeSelector } from './AssigneeSelector';
import { FolderOpen, StickyNote, CheckSquare, SkipForward } from 'lucide-react';
import { type ProjectItem, type ItemDependency } from '@repo/database';
import { type Dictionary } from '@/i18n/dictionaries';
import { toast } from 'sonner';
import { FileUploader } from '@/components/file/FileUploader';
import { Paperclip, Plus, AlignLeft, Lock, Unlock } from 'lucide-react';

type ProjectItemWithRelations = ProjectItem & {
    dependsOn: (ItemDependency & { prerequisite: ProjectItem })[];
    requiredBy: ItemDependency[];
    requireAttachment?: boolean; // Temporary fix for Prisma type sync issue
    attachmentUrl?: string | null;  // Temporary fix for Prisma type sync issue
    assignees: { id: string; name: string | null }[];
    files?: { id: string; name: string; url: string; size: number; createdAt: Date; type: string; uploadedBy: { name: string | null; email: string } }[];
};

import type { User } from '@repo/database';

interface ProjectItemCardProps {
    item: ProjectItemWithRelations;
    users: { id: string, name: string | null }[];

    currentUser: User | null;
    dict: Dictionary;
    projectOwnerId: string;
}

export function ProjectItemCard({ item, users, currentUser, dict, projectOwnerId }: ProjectItemCardProps) {
    const router = useRouter();
    const [isEditMode, setIsEditMode] = useState(false);
    const [isDetailsExpanded, setIsDetailsExpanded] = useState(false);
    const [isPending, startTransition] = useTransition();

    const handleStatusChange = (itemId: string, newStatus: string) => {
        startTransition(async () => {
            await updateItemStatus(itemId, newStatus);
            router.refresh();
        });
    };

    // handleFileUpload removed (replaced by FileUploader component)

    // Check for Group / Subtask
    const itemType = item.type || 'TASK';
    const parentId = item.parentId;
    const isGroup = itemType === 'GROUP';
    const isSubtask = !!parentId;

    const isAdmin = currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPER_ADMIN';
    const isProjectOwner = currentUser?.id === projectOwnerId;
    const isAssignedToMe = currentUser?.id === item.assignedToId || item.assignees?.some(u => u.id === currentUser?.id);
    const isUnassigned = !item.assignedToId && (!item.assignees || item.assignees.length === 0);

    // Permissions:
    const isAdHoc = !item.originProtocolItemId;

    // Check Allow Skip
    const allowSkip = (item.metadata as unknown as { allowSkip?: boolean })?.allowSkip || false;

    // Permissions Strategy:
    // 1. Ad-Hoc Items: Creator/Admin has full control (Title, Assignee, Desc, Delete)
    // 2. Standard Items: Title & Assignee are LOCKED. Description/Notes are Editable.

    // Who is "Creator" for AdHoc? 
    // We don't have item.createdById explicitly in this view, but we have `isAssignedToMe` (since we auto-assign creators).
    // Let's assume Admin or Assignee can edit AdHoc.
    const hasAdHocRights = isAdHoc && (isAdmin || isProjectOwner || isAssignedToMe);
    const hasStandardEditRights = isAdmin || isProjectOwner || isAssignedToMe || isUnassigned;

    const canEditTitle = hasAdHocRights;
    const canEditAssignee = hasAdHocRights;

    const canDelete = hasAdHocRights;

    // Legacy alias for "Can edit at least details" - used for Action Buttons
    const canEdit = hasAdHocRights || hasStandardEditRights;



    // Helper: Master switch for showing the "Lock/Unlock" button?
    // If user can't edit ANYTHING, hide lock button.
    // Actually, canEditDescription is almost always true for participants.
    const showEditToggle = canEdit;

    // Attachment check
    const requireAttachment = item.requireAttachment;
    const attachmentUrl = item.attachmentUrl;
    const isUploadMissing = requireAttachment && ((!attachmentUrl || attachmentUrl === '') && (!item.files || item.files.length === 0));

    // Visibility Logic: 
    // STRICT: Only show if Required OR has existing file OR is currently uploading.
    // Optional uploads are hidden to keep UI clean as requested.
    // Visibility Logic: 
    // STRICT: Only show if Required OR has existing file OR is currently uploading.
    // Optional uploads are hidden to keep UI clean as requested.
    const shouldShowAttachment = requireAttachment || (item.files && item.files.length > 0);
    const hasDetails = !!item.description || (item.dependsOn && item.dependsOn.length > 0) || (item.files && item.files.length > 0);
    // const canExpand = hasDetails || isEditMode;

    // Fallback for Legacy Data: If assignees is empty but assignedToId exists, use it.
    const effectiveAssignees = (item.assignees && item.assignees.length > 0)
        ? item.assignees
        : (item.assignedToId ? [users.find(u => u.id === item.assignedToId)].filter(Boolean) as { id: string; name: string | null }[] : []);

    if (isGroup) {
        return (
            <div key={item.id} className="relative group md:pl-[110px] py-0.5 mt-0.5">
                <div className="absolute left-[90px] top-1/2 w-3 h-0.5 bg-slate-300 hidden md:block -translate-x-1 dark:bg-slate-700"></div>
                <div className="w-full bg-slate-100/80 border-y border-slate-200/60 py-0.5 px-3 flex items-center gap-2 dark:bg-slate-800/50 dark:border-slate-700/50">
                    <FolderOpen size={14} className="text-slate-500 dark:text-slate-400" />
                    <h3 className="font-bold text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        {item.title}
                    </h3>
                </div>
            </div>
        )
    }

    return (
        <div key={item.id} className={`relative group md:pl-[120px] py-0.25 ${isSubtask ? 'ml-4' : ''}`}>
            {/* Timeline Dot / Date / Delete Action */}
            <div className={`absolute top-4 z-10 hidden md:flex items-center justify-center group/dot
                ${isSubtask ? 'left-[104px]' : 'left-[85px]'}
            `}>
                {/* The Dot Itself */}
                <div className={`rounded-full border-2 border-white shadow-sm shrink-0 w-2.5 h-2.5
                    ${item.status === 'DONE' ? 'bg-emerald-500 ring-2 ring-emerald-50' :
                        item.status === 'SKIPPED' ? 'bg-slate-400 ring-2 ring-slate-100' :
                            item.status === 'OPEN' ? 'bg-indigo-500 ring-2 ring-indigo-50' : 'bg-slate-300'}
                `}></div>

                {/* Left Side: Date & Delete (Swap on Hover) */}
                <div className={`absolute top-1/2 -translate-y-1/2 flex items-center justify-end w-24 pr-2
                    ${isSubtask ? 'right-[16px]' : 'right-4'}
                `}>
                    {/* Date Display (Reverted to standard right-5ish, using right-5 and right-[20px] just for minor adjustment if dot size differs) */}
                    {/* Actually dot size diff (w-2 vs w-3) is 4px diff (half). 
                        Standard dot (w-3) -> right-5 (20px). 
                        Subtask dot (w-2) -> right-[20px] seems fine. 
                        Wait, previously I used right-[54px]. I will strict reset to right-5. */}

                    <div className={`flex flex-col items-end transition-opacity duration-200 ${canDelete ? 'group-hover/dot:opacity-0' : ''}`}>
                        <span className="text-[9px] font-medium text-slate-400 whitespace-nowrap leading-tight">
                            {new Date(item.updatedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                        </span>
                        <span className="text-[8px] text-slate-300 leading-tight">
                            {new Date(item.updatedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace('.', ':')}
                        </span>
                    </div>

                    {/* Delete Button (Swaps in) */}
                    {canDelete && (
                        <button
                            onClick={async (e) => {
                                e.stopPropagation();
                                if (confirm('Delete this task?')) {
                                    const { deleteProjectItem } = await import('@/actions/project');
                                    await deleteProjectItem(item.id);
                                }
                            }}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-white shadow-sm border border-slate-200 text-slate-400 hover:text-red-600 hover:border-red-200 hover:bg-red-50 opacity-0 group-hover/dot:opacity-100 transition-all scale-90 group-hover/dot:scale-100"
                            title="Delete Task"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                        </button>
                    )}
                </div>
            </div>

            {/* Connection to Card */}
            <div className={`absolute top-[21px] h-px bg-slate-200 hidden md:block group-hover:bg-indigo-300 transition-colors 
                ${isSubtask ? 'left-[8px] w-[100px]' : 'left-[90px] w-6'}
            `}></div>

            {/* Subtask Vertical Marker (Gray Line) */}
            {isSubtask && (
                <div className="absolute left-[109px] top-2 bottom-2 w-0.5 bg-slate-200 rounded-full hidden md:block dark:bg-slate-700"></div>
            )}

            {/* Compact Card - Click to Expand */}
            <div
                onClick={() => {
                    // Prevent expansion if selecting text or in edit mode or no details
                    const selection = window.getSelection();
                    if (selection && selection.toString().length > 0) return;
                    if (!isEditMode && hasDetails) setIsDetailsExpanded(!isDetailsExpanded);
                }}
                className={`
                w-full px-2 py-1 rounded-lg border transition-all duration-200 relative
                ${!isEditMode && hasDetails ? 'cursor-pointer hover:border-indigo-200 dark:hover:border-indigo-500' : 'cursor-default'}
                ${item.status === 'LOCKED'
                        ? 'bg-slate-50 border-slate-200/60 grayscale opacity-70 dark:bg-slate-900/50 dark:border-slate-800'
                        : 'bg-white border-slate-200 shadow-sm dark:bg-slate-900 dark:border-slate-800'
                    }
                ${isDetailsExpanded ? 'ring-1 ring-indigo-100 dark:ring-indigo-900/30' : ''}
            `}
                style={item.color ? { borderLeftColor: item.color, borderLeftWidth: '4px' } : {}}
            >

                <div className="flex flex-col md:flex-row gap-2 items-center">
                    {/* LEFT: Status & Title */}
                    <div className="flex items-center gap-3 w-full md:flex-1 min-w-0">
                        {/* Status Pill */}
                        <div className={`shrink-0 w-1.5 h-1.5 rounded-full ${item.status === 'OPEN' ? 'bg-[#cd1717]' :
                            item.status === 'IN_PROGRESS' ? 'bg-amber-500' :
                                item.status === 'DONE' ? 'bg-emerald-500' :
                                    item.status === 'SKIPPED' ? 'bg-slate-400' : 'bg-slate-300'
                            }`}></div>

                        <div className="min-w-0 flex-1 relative">
                            {isEditMode && canEditTitle ? (
                                <input
                                    type="text"
                                    defaultValue={item.title}
                                    onClick={(e) => e.stopPropagation()}
                                    onBlur={(e) => {
                                        if (e.target.value !== item.title) {
                                            import('@/actions/project').then(mod => mod.updateProjectItemDetails(item.id, { title: e.target.value }));
                                        }
                                    }}
                                    className="text-sm font-semibold w-full bg-slate-50 border border-red-200 rounded px-2 py-0.5 text-slate-800 focus:ring-1 focus:ring-[#cd1717] outline-none dark:bg-slate-800 dark:border-red-900 dark:text-slate-100"
                                />
                            ) : (
                                <div className="flex items-baseline gap-2">
                                    <h3 className={`text-sm font-semibold flex items-center gap-1.5 min-w-0 ${item.status === 'LOCKED' ? 'text-slate-500 dark:text-slate-500' : 'text-slate-700 dark:text-slate-200'}`}>
                                        {itemType === 'NOTE' ? (
                                            <StickyNote size={14} className="text-amber-500 shrink-0" />
                                        ) : (
                                            <CheckSquare size={14} className="text-[#cd1717] shrink-0" />
                                        )}
                                        <span className="truncate max-w-[400px]">{item.title}</span>
                                        <div className="flex items-center gap-1 shrink-0">
                                            {item.description && !isDetailsExpanded && (
                                                <span title="Has Description"><AlignLeft size={10} className="text-slate-400" /></span>
                                            )}
                                            {item.dependsOn && item.dependsOn.length > 0 && !isDetailsExpanded && (
                                                <div className="flex items-center gap-0.5 px-1 rounded bg-amber-50 text-amber-600 border border-amber-100 text-[9px] dark:bg-amber-900/30 dark:border-amber-800" title="Has Dependencies">
                                                    <SkipForward size={9} className="rotate-90" />
                                                    <span>{item.dependsOn.length}</span>
                                                </div>
                                            )}
                                            {requireAttachment && ((item.files && item.files.length > 0) || item.attachmentUrl) && (
                                                <span className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded text-[10px] bg-slate-100 text-slate-500 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400" title="Attachments">
                                                    <Paperclip size={10} />
                                                    <span className="font-medium">{item.files?.length || 1}</span>
                                                </span>
                                            )}
                                        </div>
                                        {/* Plus Button for "Adding More" - only if not missing requirement */}
                                        {(requireAttachment && canEdit && (users.find(u => u.id === currentUser?.id) || isAdmin) && !isUploadMissing) && (
                                            <div onClick={(e) => e.stopPropagation()} className="leading-none flex items-center">
                                                <FileUploader
                                                    projectId={item.projectId}
                                                    taskId={item.id}
                                                    onUploadComplete={() => router.refresh()}
                                                    variant="compact"
                                                    className="!w-6 !h-6 !p-0 justify-center !bg-transparent text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-all rounded-full flex items-center"
                                                >
                                                    <Plus size={18} strokeWidth={3} />
                                                </FileUploader>
                                            </div>
                                        )}
                                    </h3>
                                </div>
                            )}


                            {/* Description / Dependencies */}
                            <div
                                className={`
                                    text-[11px] text-slate-500 transition-all rounded px-1 -ml-1 mt-0.5 dark:text-slate-400
                                    ${isDetailsExpanded || isEditMode ? 'block h-auto whitespace-normal' : 'hidden'}
                                `}
                            >
                                {isEditMode ? (
                                    <textarea
                                        defaultValue={item.description || ''}
                                        placeholder={dict.project.detail.descriptionPlaceholder}
                                        onBlur={(e) => {
                                            if (e.target.value !== item.description) {
                                                import('@/actions/project').then(mod => mod.updateProjectItemDetails(item.id, { description: e.target.value }));
                                            }
                                        }}
                                        onClick={(e) => e.stopPropagation()}
                                        rows={1}
                                        className="w-full bg-slate-50 border border-red-200 rounded px-1 py-1 cursor-text min-h-[1.5rem] resize-y leading-tight focus:ring-1 focus:ring-[#cd1717] outline-none dark:bg-slate-800 dark:border-red-900 dark:text-slate-100"
                                    />
                                ) : (
                                    <>
                                        <div className={`${isDetailsExpanded ? 'mb-1 whitespace-pre-wrap' : 'truncate'}`}>
                                            {item.description}
                                        </div>
                                        {item.dependsOn && item.dependsOn.length > 0 && (
                                            <div className={`
                                                ${isDetailsExpanded ? 'flex flex-col gap-1 border-t border-slate-100 pt-1 mt-1 dark:border-slate-800' : 'flex items-center gap-1 pl-2 border-l border-slate-200 min-w-0 dark:border-slate-700'}
                                            `}>
                                                {isDetailsExpanded ? (
                                                    item.dependsOn.map(dep => (
                                                        <div key={dep.id} className="flex items-center gap-1.5 text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded w-fit dark:bg-amber-900/30 dark:text-amber-400">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                                                            <span className="font-medium">{dict.project.detail.waitsFor} {dep.prerequisite.title}</span>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <>
                                                        <span className="w-1 h-1 rounded-full bg-amber-400 shrink-0"></span>
                                                        <span className="truncate">
                                                            {dict.project.detail.waitsFor} {item.dependsOn[0].prerequisite.title}
                                                            {item.dependsOn.length > 1 && ` (+${item.dependsOn.length - 1})`}
                                                        </span>
                                                    </>
                                                )}
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>

                            {/* Attachments Section - File Manager */}
                            {shouldShowAttachment && (isAdmin || isProjectOwner || isAssignedToMe) && (
                                <div onClick={(e) => e.stopPropagation()} className={`mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 ${!isDetailsExpanded ? 'hidden' : 'block'}`}>
                                    {requireAttachment && (!item.files || item.files.length === 0) && (
                                        <div className="mb-2">
                                            <span className="text-[9px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-bold border border-red-200">REQUIRED</span>
                                        </div>
                                    )}

                                    {/* Mini File List */}
                                    <div className="space-y-1">
                                        {item.files?.map(file => (
                                            <div key={file.id} className="group/file flex items-center justify-between p-2 rounded bg-slate-50 border border-slate-200 hover:border-red-300 transition-colors dark:bg-slate-900 dark:border-slate-800 dark:hover:border-red-700">
                                                <a href={`/api/file/${file.id}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 min-w-0 flex-1 hover:underline">
                                                    <Paperclip className="w-3.5 h-3.5 text-slate-400" />
                                                    <span className="text-xs text-slate-600 dark:text-slate-300 truncate font-medium">{file.name}</span>
                                                </a>
                                                <div className="flex items-center gap-2 opacity-0 group-hover/file:opacity-100 transition-opacity">
                                                    <span className="text-[10px] text-slate-400">{(file.size / 1024).toFixed(0)}KB</span>
                                                    {(canEdit && (file.uploadedBy.name === currentUser?.name || isAdmin)) && (
                                                        <button
                                                            onClick={async (e) => {
                                                                e.stopPropagation();
                                                                if (!confirm('Delete file?')) return;
                                                                try {
                                                                    const { deleteFile } = await import('@/actions/file');
                                                                    await deleteFile(file.id);
                                                                    toast.success('Deleted');
                                                                    router.refresh();
                                                                } catch { toast.error('Failed'); }
                                                            }}
                                                            className="text-slate-400 hover:text-red-600"
                                                        >
                                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                        {(!item.files || item.files.length === 0) && requireAttachment && (
                                            <div className="text-[10px] text-slate-400 italic py-1 text-center">
                                                {dict.project.detail.noDetails}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* RIGHT: Assignee & Actions */}
                    <div onClick={(e) => e.stopPropagation()} className="flex items-center gap-2 shrink-0 w-full md:w-auto justify-end border-t md:border-t-0 pt-2 md:pt-0 border-slate-50 dark:border-slate-800">
                        <div>
                            <AssigneeSelector
                                itemId={item.id}
                                assignees={effectiveAssignees}
                                users={users}
                                isEditMode={isEditMode && canEditAssignee}
                            />
                        </div>

                        {item.status !== 'LOCKED' && !isGroup && (
                            (() => {
                                if (!canEdit) return null;

                                return (

                                        <div className="flex items-center gap-1 justify-end">
                                            {/* Edit Toggle (Lock) */}
                                            {item.status !== 'LOCKED' && showEditToggle && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setIsEditMode(!isEditMode);
                                                    }}
                                                    className={`w-7 h-6 flex items-center justify-center rounded-md hover:bg-slate-100 transition-all dark:hover:bg-slate-800 ${isEditMode ? 'text-amber-500 bg-amber-50 dark:bg-amber-900/40' : 'text-slate-300'}`}
                                                    title={isEditMode ? dict.project.detail.lockAssignments : dict.project.detail.unlockAssignments}
                                                >
                                                    {isEditMode ? <Unlock size={12} strokeWidth={3} /> : <Lock size={12} strokeWidth={3} />}
                                                </button>
                                            )}

                                            {/* Skip Button - Visible if not Done/Skipped AND AllowSkip is true */}
                                            {item.status !== 'DONE' && item.status !== 'SKIPPED' && allowSkip && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (confirm('Skip this task?')) {
                                                        handleStatusChange(item.id, 'SKIPPED');
                                                    }
                                                }}
                                                className="w-7 h-7 flex items-center justify-center rounded-md bg-[#cd1717] text-white hover:bg-[#a50f0f] shadow-sm transition-all dark:bg-[#cd1717] dark:hover:bg-[#a50f0f]"
                                                title="Skip Task"
                                            >
                                                <SkipForward size={14} className="text-white fill-white" />
                                            </button>
                                        )}

                                        {/* Main Action Button or Upload Warning */}
                                        {isUploadMissing && item.status !== 'SKIPPED' && item.status !== 'DONE' ? (
                                            <div className="relative z-20">
                                                <FileUploader
                                                    projectId={item.projectId}
                                                    taskId={item.id}
                                                    onUploadComplete={() => router.refresh()}
                                                    variant="compact"
                                                    label="Upload Required"
                                                    className="bg-red-50 text-red-600 border-red-200 hover:bg-red-100 hover:border-red-300 hover:text-red-700 h-7"
                                                />
                                            </div>
                                        ) : (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    const targetStatus = (item.status === 'DONE' || item.status === 'SKIPPED') ? 'OPEN' : 'DONE';
                                                    handleStatusChange(item.id, targetStatus);
                                                }}
                                                disabled={isPending}
                                                className={`
                                                h-6 px-2 rounded-md text-[10px] font-bold transition-all border shadow-sm flex items-center gap-1 cursor-pointer
                                                ${isPending ? 'opacity-70 cursor-wait' : ''}
                                                ${(item.status === 'DONE' || item.status === 'SKIPPED')
                                                        ? 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800'
                                                        : 'bg-indigo-600 border-indigo-600 text-white hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500'}
                                            `}
                                            >
                                                {isPending ? (
                                                    '...'
                                                ) : (item.status === 'DONE' || item.status === 'SKIPPED') ? (
                                                    dict.project.detail.reopen
                                                ) : isUnassigned ? (
                                                    dict.project.detail.take
                                                ) : (
                                                    <><span>✓</span> {dict.project.detail.done}</>
                                                )}
                                            </button>
                                        )}
                                    </div>
                                );
                            })()
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
