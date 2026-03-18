'use client';

import Link from 'next/link';
import { format } from 'date-fns';
import { Trash2, Paperclip, Lock } from 'lucide-react';
import { type Dictionary } from '@/i18n/dictionaries';
import { useState, useEffect } from 'react';
import { getProjectColor } from './utils';

// Define the structure of headers
interface Header {
    id: string;
    title: string;
    order: number;
}

// Reuse the full Project structure interface, or a sufficiently compatible one
// Ideally this should be imported from types.
interface ProjectItem {
    id: string;
    title: string;
    status: string;
    updatedAt: Date;
    originProtocolItemId: string | null;
    metadata: unknown;
    files: unknown[];
    dependsOn?: { prerequisite: { id: string; title: string; status: string } }[];
    completedBy: { name: string | null } | null;
}

interface Project {
    id: string;
    title: string;
    status: string;
    items: ProjectItem[];
    // protocolId bisa null jika project belum terhubung ke protocol
    protocolId?: string | null;
}

interface ProjectTableRowProps {
    project: Project;
    headers: Header[];
    colWidth: number;
    dict: Dictionary;
    // user might be null, role check is done inside or passed as boolean?
    // Let's pass currentUser to keep logic same
    currentUser?: { role: string } | null;
    handleDelete: (id: string) => void;
    isPending: boolean; // For delete button disabled state
}

export function ProjectTableRow({
    project,
    headers,
    colWidth,
    dict,
    currentUser,
    handleDelete,
    isPending
}: ProjectTableRowProps) {
    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        const timer = setTimeout(() => setMounted(true), 0);
        return () => clearTimeout(timer);
    }, []);

    // Calculate Status dynamically
    const total = project.items.length;
    const done = project.items.filter(i => i.status === 'DONE' || i.status === 'SKIPPED').length;
    const percent = total > 0 ? Math.round((done / total) * 100) : 0;
    const effectiveStatus = percent === 100 ? 'COMPLETED' : project.status;

    const info = getProjectColor(project);

    if (!mounted) {
        // Return a skeleton or null during hydration to avoid mismatch
        // We'll return the same structure but without time-sensitive data
        return (
            <tr
                className="hover:shadow-sm transition-all border-b border-slate-100 dark:border-slate-800"
                style={info?.color ? { backgroundColor: info.color + '33' } : {}}
            >
                <td
                    className="px-4 py-2 md:sticky left-0 z-20 border-r border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900"
                    style={{
                        width: colWidth,
                        minWidth: colWidth,
                        maxWidth: colWidth,
                        backgroundImage: info?.color ? `linear-gradient(${info.color}33, ${info.color}33)` : undefined
                    }}
                >
                    <div className="flex items-center gap-2 w-full">
                        <span className="font-bold text-sm text-slate-900 dark:text-white truncate">
                            {project.title}
                        </span>
                    </div>
                </td>
                <td className="px-4 py-2 border-r border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
                    <div className="w-24 h-8 bg-slate-100 dark:bg-slate-800 animate-pulse rounded"></div>
                </td>
                {headers.map((h, idx) => (
                    <td key={idx} className="px-4 py-2 border-l border-slate-100 dark:border-slate-800">
                        <div className="h-4 w-12 bg-slate-100 dark:bg-slate-800 animate-pulse rounded"></div>
                    </td>
                ))}
                {(currentUser && (currentUser.role === 'ADMIN' || currentUser.role === 'SUPER_ADMIN')) && (
                    <td className="px-4 py-2 border-l border-slate-100 dark:border-slate-800"></td>
                )}
            </tr>
        );
    }

    return (
        <tr
            className="hover:shadow-sm transition-all border-b border-slate-100 dark:border-slate-800"
            style={info?.color ? { backgroundColor: info.color + '33' } : {}} // 20% opacity (approx 33 in hex is 0.2)
        >
            {/* Project Title Column */}
            <td
                className="px-3 py-1 md:sticky left-0 z-20 border-r border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900"
                style={{
                    width: colWidth,
                    minWidth: colWidth,
                    maxWidth: colWidth,
                    // Use backgroundImage for tinting to keep the background OPAQUE
                    backgroundImage: info?.color ? `linear-gradient(${info.color}33, ${info.color}33)` : undefined
                }}
            >
                <Link href={`/projects/${project.id}`} className="group block" title={project.title}>
                    <div className="flex items-center gap-1.5 w-full">
                        <span className="font-bold text-[13px] text-slate-900 group-hover:text-[#cd1717] transition-colors dark:text-white dark:group-hover:text-[#cd1717] truncate">
                            {project.title}
                        </span>
                        <span className={`text-[9px] uppercase font-black tracking-wider px-1 py-0.5 rounded border shrink-0 ${effectiveStatus === 'ACTIVE' ? 'bg-emerald-50 text-emerald-900 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-100 dark:border-emerald-800' :
                            effectiveStatus === 'COMPLETED' ? 'bg-blue-50 text-blue-900 border-blue-200 dark:bg-blue-900/30 dark:text-blue-100 dark:border-blue-800' :
                                'bg-slate-100 text-slate-900 border-slate-300 dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700'
                            }`}>
                            {dict.project.status[effectiveStatus as keyof typeof dict.project.status]}
                        </span>
                    </div>
                </Link>
            </td>

            {/* Progress Column */}
            <td className="px-3 py-1 border-r border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
                <div className="w-20">
                    <div className="flex justify-between items-end mb-0.5">
                        <span className="text-[9px] font-medium text-slate-500 dark:text-slate-400">
                            {percent}%
                        </span>
                        <span className="text-[9px] text-slate-400 dark:text-slate-500">
                            {done}/{total}
                        </span>
                    </div>
                    <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden dark:bg-slate-800">
                        <div
                            className={`h-full rounded-full transition-all duration-500 ${percent === 100 ? 'bg-emerald-700' : 'bg-[#890000]'
                                }`}
                            style={{ width: `${percent}%` }}
                        ></div>
                    </div>
                </div>
            </td>

            {/* Dynamic Task Columns - Merged by Title */}
            {(() => {
                // 1. Derive Unique Headers (Columns)
                // We use a Map to keep the first occurrence order but group by Title
                const uniqueHeadersMap = new Map<string, typeof headers[0]>();
                headers.forEach(h => {
                    if (!uniqueHeadersMap.has(h.title)) {
                        uniqueHeadersMap.set(h.title, h);
                    }
                });
                const uniqueHeaders = Array.from(uniqueHeadersMap.values())
                    .sort((a, b) => (a.order || 0) - (b.order || 0)); // Strict Sort

                return uniqueHeaders.map(header => {
                    // Find ALL items matching this column title
                    const items = project.items.filter(i =>
                        i.title === header.title ||
                        (i.originProtocolItemId === header.id && !i.title)
                    );

                    if (items.length === 0) {
                        // No items for this column -> Black BG
                        return (
                            <td key={header.title} className="px-4 py-2 text-center border-l border-slate-100 dark:border-slate-800 bg-black">
                                <span className="text-white/30 text-xs">-</span>
                            </td>
                        );
                    }

                    return (
                        <td key={header.title} className="px-3 py-1 border-l border-slate-100 dark:border-slate-800 align-top">
                            <div className="flex flex-col gap-1">
                                {items.map((item) => {
                                    const isDone = item.status === 'DONE';
                                    const isSkipped = item.status === 'SKIPPED';

                                    // Item-specific styling
                                    const bgClass = isDone ? 'bg-emerald-50/50 rounded p-1' : isSkipped ? 'bg-slate-50/50 rounded p-1' : '';

                                    return (
                                        <div key={item.id} className={`${bgClass} relative group/item`}>
                                            {isDone || isSkipped ? (
                                                <div className="flex flex-col relative group/info">
                                                    <span className={`text-[10px] font-bold ${isDone ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'}`}>
                                                        {isSkipped ? '⏭ SKIP' : format(new Date(item.updatedAt), 'dd/MM')}
                                                    </span>
                                                    <div className="flex items-center gap-1">
                                                        <span className={`text-[10px] ${isDone ? 'text-emerald-600/70 dark:text-emerald-500/70' : 'text-slate-400/70 dark:text-slate-500/70'}`}>
                                                            {format(new Date(item.updatedAt), 'HH:mm')}
                                                        </span>
                                                        {item.files?.length > 0 && (
                                                            <Paperclip size={10} className="text-slate-400" />
                                                        )}
                                                    </div>

                                                    {/* Done/Skipped By Tooltip */}
                                                    {item.completedBy?.name && (
                                                        <div className="absolute bottom-full left-0 mb-1 w-max hidden group-hover/info:block z-50">
                                                            <div className="bg-slate-800 text-white text-[10px] px-2 py-1 rounded shadow-lg whitespace-nowrap">
                                                                by {item.completedBy.name}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-1.5 opacity-80 relative group/status min-h-[24px]">
                                                    {item.status === 'LOCKED' ? (
                                                        <Lock size={12} className="text-slate-500 dark:text-slate-400" />
                                                    ) : (
                                                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${item.status === 'IN_PROGRESS' ? 'bg-amber-500' :
                                                            item.status === 'OPEN' ? 'bg-slate-300' : 'bg-slate-300'
                                                            }`} style={{ backgroundColor: item.status === 'OPEN' ? '#890000' : undefined }}></span>
                                                    )}

                                                    <span className={`text-[10px] uppercase font-bold truncate max-w-[80px] ${item.status === 'IN_PROGRESS' ? 'text-amber-600 dark:text-amber-500' :
                                                        item.status === 'OPEN' ? 'text-slate-700 dark:text-slate-300' :
                                                            item.status === 'LOCKED' ? 'text-slate-500 dark:text-slate-400' :
                                                                'text-slate-400'
                                                        }`}>
                                                        {item.status === 'LOCKED' ? 'LOCKED' : dict.project.status[item.status as keyof typeof dict.project.status]?.replace('_', ' ') || item.status}
                                                    </span>

                                                    {/* Contextual Lock Tooltip */}
                                                    {item.status === 'LOCKED' && item.dependsOn && item.dependsOn.length > 0 && (
                                                        <div className="absolute bottom-full left-0 mb-1 w-max max-w-[200px] hidden group-hover/status:block z-50">
                                                            <div className="bg-slate-800 text-white text-[10px] px-2 py-1 rounded shadow-lg">
                                                                <div className="font-bold mb-0.5">Wait For:</div>
                                                                {item.dependsOn.map(dep => (
                                                                    <div key={dep.prerequisite.id} className="flex items-center gap-1">
                                                                        {dep.prerequisite.status === 'DONE' ? '✅' : '🔒'} {dep.prerequisite.title}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </td>
                    );
                });
            })()}

            {/* Actions Column (Admin Only) */}
            {(currentUser && (currentUser.role === 'ADMIN' || currentUser.role === 'SUPER_ADMIN')) && (
                <td className="px-3 py-1 text-right md:sticky right-0 bg-white dark:bg-slate-900 z-20 border-l border-slate-100 dark:border-slate-800">
                    <button
                        onClick={() => handleDelete(project.id)}
                        disabled={isPending}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors dark:hover:bg-red-900/20"
                        title={dict.common.delete}
                    >
                        <Trash2 size={16} />
                    </button>
                </td>
            )}
        </tr>
    );
}
