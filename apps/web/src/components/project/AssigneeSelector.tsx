'use client';

import { toggleItemAssignee } from '@/actions/user';
import { useRouter } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import { UserAvatar } from '@/components/ui/UserAvatar';

export function AssigneeSelector({
    itemId,
    assignees = [],
    users,
    isEditMode = false
}: {
    itemId: string,
    assignees?: { id: string, name: string | null }[],
    users: { id: string, name: string | null }[],
    isEditMode?: boolean
}) {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleToggle = async (userId: string) => {
        // Optimistic update could be done here, but for now relying on server refresh
        await toggleItemAssignee(itemId, userId);
        router.refresh();
    };

    if (!isEditMode) {
        return (
            <div className="flex pl-1.5 overflow-hidden py-1" title="Enable Edit Mode to change">
                {assignees.length > 0 ? (
                    assignees.map((u, i) => (
                        <UserAvatar
                            key={u.id}
                            user={u}
                            size="sm"
                            className={`-ml-1.5 first:ml-0 bg-white ring-slate-100 dark:ring-slate-800 ${i % 2 === 0 ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'}`}
                        />
                    ))
                ) : (
                    <div className="h-6 w-6 rounded-full bg-slate-100 flex items-center justify-center text-xs text-slate-300 dark:bg-slate-800 ring-2 ring-white dark:ring-slate-900 border border-slate-200 dark:border-slate-700 border-dashed">

                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="relative" ref={dropdownRef}>
            <div
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-1 px-1.5 py-1 rounded-lg bg-indigo-50/50 hover:bg-indigo-50 border border-indigo-100/50 transition-colors cursor-pointer w-full md:w-auto shadow-sm shadow-indigo-100/50 dark:bg-indigo-900/20 dark:border-indigo-800 dark:hover:bg-indigo-900/30"
            >
                <div className="flex pl-1 items-center">
                    {assignees.length > 0 ? (
                        assignees.slice(0, 3).map((u) => (
                            <UserAvatar
                                key={u.id}
                                user={u}
                                size="sm"
                                className="-ml-1.5 first:ml-0 ring-white dark:ring-slate-900"
                            />
                        ))
                    ) : (
                        <UserAvatar size="sm" className="bg-slate-100 text-slate-300 dark:bg-slate-800 border border-slate-200 border-dashed dark:border-slate-700" />
                    )}
                    {assignees.length > 3 && (
                        <div className="h-5 w-5 -ml-1.5 rounded-full ring-2 ring-white bg-slate-100 flex items-center justify-center text-[8px] font-bold text-slate-500 dark:bg-slate-800 dark:ring-slate-900 z-10">
                            +{assignees.length - 3}
                        </div>
                    )}
                </div>

                <span className="text-[10px] font-medium text-indigo-700 dark:text-indigo-300">
                    {assignees.length === 0 ? 'Unassigned' : assignees.length === 1 ? assignees[0].name : `${assignees.length} Assignees`}
                </span>
                <span className="text-[9px] text-indigo-300 ml-1 dark:text-indigo-500">▼</span>
            </div>

            {isOpen && (
                <div className="absolute top-full right-0 mt-1 w-48 bg-white border border-slate-200 rounded-xl shadow-xl z-50 max-h-60 overflow-y-auto dark:bg-slate-900 dark:border-slate-700">
                    <div className="p-1 space-y-0.5">
                        <div className="text-[9px] font-bold text-slate-400 px-2 py-1 uppercase tracking-wider">Select Members</div>
                        {users.map(u => {
                            const isSelected = assignees.some(a => a.id === u.id);
                            return (
                                <div
                                    key={u.id}
                                    onClick={() => handleToggle(u.id)}
                                    className={`flex items-center gap-2 px-2 py-1 rounded-lg cursor-pointer transition-colors ${isSelected
                                        ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300'
                                        : 'hover:bg-slate-50 text-slate-700 dark:hover:bg-slate-800 dark:text-slate-300'
                                        }`}
                                >
                                    <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-colors ${isSelected
                                        ? 'bg-indigo-600 border-indigo-600 dark:bg-indigo-500 dark:border-indigo-500'
                                        : 'border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-800'
                                        }`}>
                                        {isSelected && <span className="text-white text-[9px]">✓</span>}
                                    </div>
                                    <span className="text-xs font-medium truncate">{u.name || 'Unnamed'}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
