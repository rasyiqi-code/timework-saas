'use client';

import { Download } from 'lucide-react';
import { type Dictionary } from '@/i18n/dictionaries';
import { getProjectColor } from './utils';

export interface ProjectTableFiltersProps {
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    protocolFilter: string;
    setProtocolFilter: (filter: string) => void;
    statusFilter: 'ALL' | 'ACTIVE' | 'COMPLETED';
    setStatusFilter: (filter: 'ALL' | 'ACTIVE' | 'COMPLETED') => void;
    colorFilter: string | null;
    setColorFilter: (filter: string | null) => void;
    protocols?: { id: string, name: string }[];
    projects: {
        items: {
            status: string;
            updatedAt: Date;
            metadata: unknown;
            title: string;
        }[];
    }[];
    handleExport: () => void;
    dict: Dictionary;
}

export function ProjectTableFilters({
    searchQuery,
    setSearchQuery,
    protocolFilter,
    setProtocolFilter,
    statusFilter,
    setStatusFilter,
    colorFilter,
    setColorFilter,
    protocols,
    projects,
    handleExport,
    dict
}: ProjectTableFiltersProps) {
    return (
        <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center bg-white dark:bg-slate-900 p-3 lg:px-3 lg:py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition-all">

            {/* Left Group: Search & Dropdowns */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex items-center gap-2 lg:shrink-0">
                {/* Search Input */}
                <div className="relative w-full sm:col-span-2 lg:w-64">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                    <input
                        placeholder={dict.project.searchPlaceholder}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="block w-full pl-10 pr-3 py-1.5 border border-slate-200 rounded-lg leading-5 bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-[#cd1717]/20 focus:border-[#cd1717] text-xs transition-all dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 placeholder:text-[10px]"
                    />
                </div>

                {/* Filters Dropdowns */}
                <div className="relative">
                    <select
                        value={protocolFilter}
                        onChange={(e) => setProtocolFilter(e.target.value)}
                        className="block w-full pl-2 pr-8 py-1.5 text-xs text-slate-900 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#cd1717]/20 focus:border-[#cd1717] rounded-lg bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 dark:focus:bg-slate-800 truncate appearance-none"
                    >
                        <option value="ALL">{dict.project.allProtocols}</option>
                        {protocols?.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                    </select>
                </div>

                <div className="relative">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as 'ALL' | 'ACTIVE' | 'COMPLETED')}
                        className="block w-full pl-2 pr-8 py-1.5 text-xs text-slate-900 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#cd1717]/20 focus:border-[#cd1717] rounded-lg bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 dark:focus:bg-slate-800 appearance-none"
                    >
                        <option value="ALL">{dict.project.allStatus}</option>
                        <option value="ACTIVE">{dict.project.status.ACTIVE}</option>
                        <option value="COMPLETED">{dict.project.status.COMPLETED}</option>
                    </select>
                </div>
            </div>

            {/* Middle Group: Color Legend (Scrollable) */}
            <div className="flex-1 min-w-0 lg:border-l border-slate-200 lg:pl-4 dark:border-slate-700">
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
                    {(() => {
                        const uniqueEffects = new Map<string, string>();
                        projects.forEach(p => {
                            const info = getProjectColor(p);
                            if (info && info.color && !uniqueEffects.has(info.color)) {
                                uniqueEffects.set(info.color, info.label);
                            }
                        });

                        if (uniqueEffects.size === 0) return (
                            <div className="flex items-center gap-2 text-slate-400">
                                <span className="text-[10px] uppercase font-bold tracking-wider">Filter:</span>
                                <span className="text-xs italic">No active effects</span>
                            </div>
                        );

                        return (
                            <>
                                {Array.from(uniqueEffects.entries()).map(([color, label]) => (
                                    <button
                                        key={color}
                                        onClick={() => setColorFilter(colorFilter === color ? null : color)}
                                        className={`h-7 px-3 rounded-full flex items-center gap-2 transition-all text-[11px] font-bold border whitespace-nowrap shrink-0 ${colorFilter === color
                                            ? `ring-2 ring-offset-1 ring-slate-400 border-transparent shadow-sm`
                                            : 'border-slate-200 hover:border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800'
                                            }`}
                                        title={`Filter: ${label}`}
                                        style={colorFilter === color ? { backgroundColor: color, color: '#fff' } : {}}
                                    >
                                        <div
                                            className="w-2.5 h-2.5 rounded-full border border-black/10 shadow-sm"
                                            style={{ backgroundColor: colorFilter === color ? '#fff' : color }}
                                        />
                                        <span>{label}</span>
                                    </button>
                                ))}
                                {colorFilter && (
                                    <button
                                        onClick={() => setColorFilter(null)}
                                        className="h-7 px-3 text-xs font-bold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 transition-colors uppercase tracking-tight"
                                    >
                                        Bersihkan
                                    </button>
                                )}
                            </>
                        );
                    })()}
                </div>
            </div>

            {/* Right Group: Export */}
            <button
                onClick={handleExport}
                className="flex items-center justify-center gap-2 px-3 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 active:scale-95 transition-all shadow-sm text-xs font-bold focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
                title="Export to Excel"
            >
                <Download size={18} />
                <span>Export Excel</span>
            </button>
        </div>
    );
}
