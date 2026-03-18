'use client';

import { format } from 'date-fns';
import { type Dictionary } from '@/i18n/dictionaries';
import { Loader2, Info } from 'lucide-react';
import { deleteProject } from '@/actions/project';
import { toast } from 'sonner';
import { useState, useTransition, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';

import { useProjectListRealtime } from '@/hooks/useProjectListRealtime';
import { getProjectColor, sanitizeSheetName } from './utils';
import { SimpleTooltip } from '../ui/simple-tooltip';
import { ProjectTableFilters } from './ProjectTableFilters';
import { ProjectTableRow } from './ProjectTableRow';

export interface ProjectTableProps {
    projects: {
        id: string;
        title: string;
        status: string;
        /** ID protokol asal project, digunakan untuk filter dan export */
        protocolId?: string | null;
        items: {
            id: string;
            title: string;
            status: string;
            updatedAt: Date;
            originProtocolItemId: string | null;
            metadata: unknown;
            requireAttachment: boolean;
            files: unknown[];
            dependsOn?: { prerequisite: { id: string; title: string; status: string } }[];
            completedBy: { name: string | null } | null;
        }[];
    }[];
    headers: {
        id: string;
        title: string;
        order: number;
    }[];
    dict: Dictionary;
    nextCursor?: string;
    organizationId: string;
    currentUser?: { role: string } | null;
    protocols?: { id: string, name: string }[];
}

export function ProjectTable({ projects: initialProjects, headers, dict, nextCursor: initialNextCursor, organizationId, currentUser, protocols }: ProjectTableProps) {
    const tableContainerRef = useRef<HTMLDivElement>(null);
    const [projects, setProjects] = useState(initialProjects);
    const [nextCursor, setNextCursor] = useState(initialNextCursor);

    // Sync state with props on router.refresh() (Realtime socket updates)
    useEffect(() => {
        setProjects(prev => {
            // Merge initialProjects (first page) with currently loaded projects
            // We want to update any existing projects that are in the new first page,
            // while preserving projects that were loaded via "Muat Lebih Banyak".
            const initialIds = new Set(initialProjects.map(p => p.id));
            const loadedMore = prev.filter(p => !initialIds.has(p.id));
            return [...initialProjects, ...loadedMore];
        });
        // Only reset nextCursor if initialNextCursor is provided (first page load)
        // If it's a refresh of the first page, the cursor for "loading more" shouldn't necessarily change 
        // unless the first page now covers what was previously in the second page.
        // For simplicity, we keep the previous nextCursor if we already have one from loading more.
        setNextCursor(prev => prev || initialNextCursor);
    }, [initialProjects, initialNextCursor]);
    const [isPending, startTransition] = useTransition();
    const [isLoadingMore, setIsLoadingMore] = useState(false);

    // Filter Logic State
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'COMPLETED'>('ALL');
    const [protocolFilter, setProtocolFilter] = useState<string>('ALL');
    const [colorFilter, setColorFilter] = useState<string | null>(null);

    // Resizable Column Logic State
    const [colWidth, setColWidth] = useState(350);
    const [isResizing, setIsResizing] = useState(false);

    // Enable Realtime Updates
    useProjectListRealtime(organizationId);

    // Resizable Column Effect
    useEffect(() => {
        if (!isResizing) return;

        const handleMouseMove = (e: MouseEvent) => {
            setColWidth(prev => {
                const newWidth = prev + e.movementX;
                return Math.max(200, Math.min(800, newWidth)); // Min 200px, Max 800px
            });
        };

        const handleMouseUp = () => {
            setIsResizing(false);
            document.body.style.cursor = 'default';
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isResizing]);

    const startResizing = (e: React.MouseEvent) => {
        e.preventDefault();
        setIsResizing(true);
        document.body.style.cursor = 'col-resize';
    };

    const filteredProjects = projects.filter(project => {
        const matchesSearch = project.title.toLowerCase().includes(searchQuery.toLowerCase());

        // Dynamic Status Logic for Filter
        const total = project.items.length;
        const done = project.items.filter(i => i.status === 'DONE' || i.status === 'SKIPPED').length;
        const percent = total > 0 ? Math.round((done / total) * 100) : 0;
        const effectiveStatus = percent === 100 ? 'COMPLETED' : project.status;

        const matchesStatus = statusFilter === 'ALL' || effectiveStatus === statusFilter;

        // Protocol Filter: gunakan protocolId yang sudah ada di interface
        const matchesProtocol = protocolFilter === 'ALL' || project.protocolId === protocolFilter;

        return matchesSearch && matchesStatus && matchesProtocol;
    }).sort((a, b) => {
        if (!colorFilter) return 0;

        const infoA = getProjectColor(a);
        const infoB = getProjectColor(b);

        const aMatches = infoA?.color === colorFilter;
        const bMatches = infoB?.color === colorFilter;

        if (aMatches && !bMatches) return -1;
        if (!aMatches && bMatches) return 1;
        return 0;
    });

    const handleExport = () => {
        try {
            // Group projects by protocolId
            const projectsByProtocol = new Map<string, ProjectTableProps['projects']>();
            const protocolNames = new Map<string, string>();

            // Helper to get protocol name (best effort)
            // Ideally we should pass protocols map prop, but for now we iterate
            protocols?.forEach(p => protocolNames.set(p.id, p.name));

            filteredProjects.forEach(p => {
                // Gunakan protocolId dari interface yang sudah diperbarui
                const pId = p.protocolId || 'OTHER';
                if (!projectsByProtocol.has(pId)) {
                    projectsByProtocol.set(pId, []);
                }
                projectsByProtocol.get(pId)?.push(p);
            });

            // Create Workbook
            const wb = XLSX.utils.book_new();
            let sheetCount = 0;

            projectsByProtocol.forEach((projectsGroup, protocolId) => {
                if (projectsGroup.length === 0) return;

                // Determine Headers for this filtered specific group
                // If we are filtering by one protocol, it matches the global headers.
                // If we are exporting ALL, we need to derive headers for THIS protocol's projects.
                // Strategy: Use the union of all item originProtocolItemId and Titles from projects in this group.

                // 1. Determine Headers for this specific group from the global headers prop
                // Filter the global headers to only include those present in this group's projects
                const groupOriginIds = new Set<string>();
                projectsGroup.forEach(p => p.items.forEach(i => {
                    if (i.originProtocolItemId) groupOriginIds.add(i.originProtocolItemId);
                }));

                const groupHeaders = headers.filter(h => groupOriginIds.has(h.id));

                // Prepare Data
                const exportData = projectsGroup.map(project => {
                    const total = project.items.length;
                    const done = project.items.filter(i => i.status === 'DONE' || i.status === 'SKIPPED').length;
                    const percent = total > 0 ? Math.round((done / total) * 100) : 0;

                    /** Tipe data baris export Excel */
                    const row: Record<string, string> = {
                        'Project Title': project.title,
                        'Status': dict.project.status[project.status as keyof typeof dict.project.status] || project.status,
                        'Progress': `${percent}%`,
                    };

                    // Fill Columns Based on SOP Headers
                    groupHeaders.forEach(header => {
                        const colTitle = header.title;

                        // Find item matching this specific protocol item ID
                        const item = project.items.find(i => i.originProtocolItemId === header.id);

                        if (item) {
                            const statusLabel = dict.project.status[item.status as keyof typeof dict.project.status]?.replace('_', ' ') || item.status;
                            const dateStr = (item.status === 'DONE' || item.status === 'SKIPPED') ? format(new Date(item.updatedAt), 'dd/MM/yyyy HH:mm') : '';

                            if (item.status === 'DONE') {
                                const doneBy = item.completedBy?.name ? ` by ${item.completedBy.name.split(' ')[0]}` : '';
                                row[colTitle] = `DONE${doneBy} (${dateStr})`;
                            } else if (item.status === 'SKIPPED') {
                                const skippedBy = item.completedBy?.name ? ` by ${item.completedBy.name.split(' ')[0]}` : '';
                                row[colTitle] = `SKIPPED${skippedBy} (${dateStr})`;
                            } else {
                                row[colTitle] = statusLabel;
                            }
                        } else {
                            row[colTitle] = '-';
                        }
                    });

                    return row;
                });

                // Sheet Name
                let sheetName = protocolNames.get(protocolId) || (protocolId === 'OTHER' ? 'Custom Projects' : `SOP ${sheetCount + 1}`);
                sheetName = sanitizeSheetName(sheetName);

                // Ensure unique sheet names if sanitization caused overlap
                if (wb.SheetNames.includes(sheetName)) {
                    sheetName = sanitizeSheetName(`${sheetName} ${sheetCount + 1}`);
                }

                const ws = XLSX.utils.json_to_sheet(exportData);

                // Auto-width
                const colWidths = Object.keys(exportData[0] || {}).map(key => ({
                    wch: Math.max(key.length, 20)
                }));
                ws['!cols'] = colWidths;

                XLSX.utils.book_append_sheet(wb, ws, sheetName);
                sheetCount++;
            });

            if (sheetCount === 0) {
                toast.error("No data to export");
                return;
            }

            // Generate filename with date
            const fileName = `Time_Work_Projects_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.xlsx`;

            // Download
            XLSX.writeFile(wb, fileName);
            toast.success("Export successful!");
        } catch (error) {
            console.error("Export failed:", error);
            toast.error("Export failed");
        }
    };

    const handleDelete = (id: string) => {
        if (confirm(dict.project.deleteConfirm)) {
            startTransition(async () => {
                try {
                    await deleteProject(id);
                    toast.success(dict.project.deleteSuccess);
                    setProjects(prev => prev.filter(p => p.id !== id));
                } catch {
                    toast.error(dict.project.deleteError);
                }
            });
        }
    };

    const handleLoadMore = async () => {
        if (!nextCursor || isLoadingMore) return;

        setIsLoadingMore(true);
        try {
            const res = await fetch(`/api/projects/matrix?limit=12&cursor=${nextCursor}`);
            if (!res.ok) throw new Error();
            const { projects: newProjects, nextCursor: newCursor } = await res.json();

            setProjects(prev => [...prev, ...newProjects as unknown as ProjectTableProps['projects']]);
            setNextCursor(newCursor);
        } catch {
            toast.error(dict.common.error);
        } finally {
            setIsLoadingMore(false);
        }
    };

    if (projects.length === 0) {
        return (
            <div className="text-center py-12 border border-dashed border-slate-300 rounded-xl bg-slate-50 dark:bg-slate-900/50 dark:border-slate-800">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 text-2xl shadow-sm border border-slate-100 dark:bg-slate-800 dark:border-slate-700">
                    🚀
                </div>
                <h3 className="text-sm font-bold text-slate-800 mb-1 dark:text-slate-200">{dict.project.noProjects}</h3>
                <p className="text-slate-500 text-xs max-w-xs mx-auto dark:text-slate-400">
                    {dict.project.noProjectsDesc}
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <ProjectTableFilters
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                protocolFilter={protocolFilter}
                setProtocolFilter={setProtocolFilter}
                statusFilter={statusFilter}
                setStatusFilter={setStatusFilter}
                colorFilter={colorFilter}
                setColorFilter={(val: string | null) => setColorFilter(val)}

                protocols={protocols}
                projects={projects}
                handleExport={handleExport}
                dict={dict}
            />

            {/* Table Container with Horizontal Scroll on Wheel */}
            <div
                ref={tableContainerRef}
                className="overflow-x-auto scrollbar-hover rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm relative min-h-[calc(100vh-250px)]"
            >
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-white border-b border-slate-200 dark:bg-slate-900 dark:border-slate-800 sticky top-0 z-30">
                            <th
                                className="px-4 py-2 text-xs font-black uppercase tracking-wider text-black whitespace-nowrap md:sticky left-0 bg-white z-40 dark:bg-slate-900 dark:text-slate-100 group/th relative"
                                style={{ width: colWidth, minWidth: colWidth, maxWidth: colWidth }}
                            >
                                {dict.project.title}
                                {/* Resizer Handle */}
                                <div
                                    onMouseDown={startResizing}
                                    className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-[#cd1717] active:bg-[#a50f0f] transition-colors z-30"
                                ></div>
                            </th>
                            <th className="px-4 py-2 text-xs font-black uppercase tracking-wider text-black whitespace-nowrap border-l border-slate-100 dark:border-slate-800 dark:text-slate-100 group">
                                <div className="flex items-center gap-1.5">
                                    {dict.project.detail.progress}
                                    <SimpleTooltip content="Tips: Tahan tombol Shift + Scroll Mouse untuk menggeser tabel secara horizontal">
                                        <Info size={14} className="text-slate-400 hover:text-slate-600 transition-colors cursor-help opacity-0 group-hover:opacity-100" />
                                    </SimpleTooltip>
                                </div>
                            </th>
                            {(() => {
                                // 1. Deduplicate Headers by Title
                                const uniqueHeadersMap = new Map<string, typeof headers[0]>();
                                headers.forEach(h => {
                                    if (!uniqueHeadersMap.has(h.title)) {
                                        uniqueHeadersMap.set(h.title, h);
                                    }
                                });
                                const uniqueHeaders = Array.from(uniqueHeadersMap.values())
                                    .sort((a, b) => (a.order || 0) - (b.order || 0)); // Strict Sort by Order

                                return uniqueHeaders.map(header => (
                                    <th key={header.title} className="px-4 py-2 text-xs font-black uppercase tracking-wider text-black whitespace-nowrap border-l border-slate-100 dark:border-slate-800 dark:text-slate-100">
                                        {header.title}
                                    </th>
                                ));
                            })()}
                            {(currentUser && (currentUser.role === 'ADMIN' || currentUser.role === 'SUPER_ADMIN')) && (
                                <th className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-500 text-right md:sticky right-0 bg-white z-40 dark:bg-slate-900 dark:text-slate-400">
                                    {dict.project.detail.settings}
                                </th>
                            )}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {filteredProjects.length === 0 ? (
                            <tr>
                                <td colSpan={10} className="py-12 text-center text-slate-500 text-sm">
                                    No projects matching your filter.
                                </td>
                            </tr>
                        ) : (
                            filteredProjects.map(project => (
                                <ProjectTableRow
                                    key={project.id}
                                    project={project}
                                    headers={headers}
                                    colWidth={colWidth}
                                    dict={dict}
                                    currentUser={currentUser}
                                    handleDelete={handleDelete}
                                    isPending={isPending}
                                />
                            ))
                        )}
                    </tbody>
                </table>
            </div >

            {
                nextCursor && (
                    <div className="flex justify-center pt-2">
                        <button
                            onClick={handleLoadMore}
                            disabled={isLoadingMore}
                            className="flex items-center gap-2 px-6 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm disabled:opacity-50"
                        >
                            {isLoadingMore ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                            {isLoadingMore ? dict.project.loadingMore : dict.project.loadMore}
                        </button>
                    </div>
                )
            }
        </div >
    );
}
