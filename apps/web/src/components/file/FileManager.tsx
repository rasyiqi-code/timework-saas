'use client';

import { useState } from 'react';
import {
    Folder,
    FileText,
    LayoutGrid,
    List as ListIcon,
    ChevronRight,
    Home,
    Search
} from 'lucide-react';
import Link from 'next/link';

interface FileItem {
    id: string;
    name: string;
    url: string;
    size: number;
    type: string;
    createdAt: Date;
    uploadedBy: { name: string | null } | null;
    task: { title: string } | null;
}

interface ProjectFolder {
    id: string;
    title: string;
    status: string;
    deletedAt: Date | null;
    files: FileItem[];
}

interface FileManagerProps {
    projects: ProjectFolder[];
}

function formatBytes(bytes: number, decimals = 2) {
    if (!+bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export function FileManager({ projects }: FileManagerProps) {
    const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [searchQuery, setSearchQuery] = useState('');

    const currentProject = projects.find(p => p.id === currentProjectId);

    // Filter projects or files based on search
    const filteredProjects = projects.filter(p =>
        p.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredFiles = currentProject?.files.filter(f =>
        f.name.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];

    const handlePermanentDelete = async (projectId: string) => {
        if (confirm('Are you sure you want to permanently delete this project and all its files? This action cannot be undone.')) {
            const { permanentDeleteProject } = await import('@/actions/file');
            await permanentDeleteProject(projectId);
            // Refresh logic is handled by server action revalidating path, 
            // but we might want to clear selection if current project was deleted
            if (currentProjectId === projectId) {
                setCurrentProjectId(null);
            }
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 dark:bg-slate-900 dark:border-slate-800 min-h-[600px] flex flex-col">
            {/* Toolbar */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4">
                {/* Breadcrumbs */}
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 overflow-hidden">
                    <button
                        onClick={() => setCurrentProjectId(null)}
                        className={`flex items-center gap-1 hover:text-indigo-600 hover:bg-slate-100 px-2 py-1 rounded transition-colors ${!currentProject ? 'font-bold text-slate-900 dark:text-slate-200' : ''}`}
                    >
                        <Home className="w-4 h-4" />
                        Home
                    </button>

                    {currentProject && (
                        <>
                            <ChevronRight className="w-4 h-4 text-slate-400" />
                            <span className="font-bold text-slate-900 dark:text-slate-200 truncate max-w-[200px]" title={currentProject.title}>
                                {currentProject.title}
                            </span>
                        </>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    {/* Search */}
                    <div className="relative hidden md:block">
                        <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 pr-3 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 w-48 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200"
                        />
                    </div>

                    {/* View Toggle */}
                    <div className="flex items-center bg-slate-100 rounded-lg p-1 dark:bg-slate-800">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white shadow text-indigo-600 dark:bg-slate-700 dark:text-indigo-400' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
                        >
                            <LayoutGrid className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-white shadow text-indigo-600 dark:bg-slate-700 dark:text-indigo-400' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
                        >
                            <ListIcon className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 p-4 overflow-y-auto bg-slate-50/30 dark:bg-slate-900">
                {!currentProject ? (
                    // Root View: List of Projects (Folders)
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {filteredProjects.map((project) => (
                            <div
                                key={project.id}
                                onClick={() => setCurrentProjectId(project.id)}
                                className={`group flex flex-col items-center p-4 rounded-xl border transition-all cursor-pointer hover:shadow-md aspect-[4/3] justify-center relative ${project.deletedAt
                                        ? 'bg-red-50/50 border-red-100 hover:border-red-200 dark:bg-red-900/10 dark:border-red-900/30'
                                        : 'bg-white border-slate-200 hover:border-indigo-300 dark:bg-slate-800 dark:border-slate-700'
                                    }`}
                            >
                                <Folder className={`w-12 h-12 mb-3 transition-colors ${project.deletedAt
                                        ? 'text-red-300 dark:text-red-800/60'
                                        : 'text-indigo-400 group-hover:text-indigo-500 dark:text-indigo-500/80'
                                    }`} fill="currentColor" />

                                <span className="text-sm font-medium text-center text-slate-700 line-clamp-2 px-2 dark:text-slate-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                                    {project.title}
                                </span>

                                <span className="text-[10px] text-slate-400 mt-1">
                                    {project.files.length} items
                                </span>

                                {project.deletedAt && (
                                    <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded text-[9px] font-bold bg-red-100 text-red-600 uppercase tracking-wider dark:bg-red-900/50 dark:text-red-400">
                                        Deleted
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    // Folder View: List of Files
                    <div className="space-y-4">
                        {/* Folder Header / Context */}
                        <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-200 dark:border-slate-800">
                            <div>
                                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                                    <Folder className="w-5 h-5 text-indigo-500" fill="currentColor" />
                                    {currentProject.title}
                                </h2>
                                <p className="text-xs text-slate-500 mt-1 dark:text-slate-400">
                                    {currentProject.files.length} items • {currentProject.deletedAt ? 'Deleted Project' : 'Active Project'}
                                </p>
                            </div>
                            <div className="flex gap-2">
                                {!currentProject.deletedAt ? (
                                    <Link
                                        href={`/projects/${currentProject.id}`}
                                        className="px-3 py-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors border border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800"
                                    >
                                        Go to Project
                                    </Link>
                                ) : (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handlePermanentDelete(currentProject.id);
                                        }}
                                        className="px-3 py-1.5 text-xs font-bold text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors border border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800"
                                    >
                                        Permanent Delete
                                    </button>
                                )}
                            </div>
                        </div>

                        {filteredFiles.length === 0 ? (
                            <div className="text-center py-12">
                                <p className="text-slate-400 text-sm">This folder is empty.</p>
                            </div>
                        ) : (
                            <div className="flex flex-col">
                                {viewMode === 'list' && (
                                    <div className="flex items-center gap-4 px-3 py-2 text-xs font-bold text-slate-400 border-b border-slate-100 dark:border-slate-800 uppercase tracking-wider mb-1">
                                        <div className="w-8"></div>
                                        <div className="flex-1">Nama</div>
                                        <div className="w-24 hidden sm:block">Ukuran</div>
                                        <div className="w-32 hidden md:block">Tanggal</div>
                                        <div className="w-32 hidden lg:block">Oleh</div>
                                        <div className="w-48 hidden xl:block">Task</div>
                                    </div>
                                )}

                                <div className={viewMode === 'grid'
                                    ? "grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4"
                                    : "space-y-1"
                                }>
                                    {filteredFiles.map((file) => (
                                        <a
                                            key={file.id}
                                            href={`/api/file/${file.id}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className={viewMode === 'grid'
                                                ? "group flex flex-col items-center p-4 rounded-xl border border-slate-200 bg-white hover:border-indigo-300 hover:shadow-sm transition-all dark:bg-slate-800 dark:border-slate-700"
                                                : "flex items-center gap-4 p-2 rounded-lg border border-transparent hover:bg-white hover:border-slate-200 hover:shadow-sm transition-all group dark:hover:bg-slate-800 dark:hover:border-slate-700"
                                            }
                                        >
                                            <div className={viewMode === 'grid'
                                                ? "w-12 h-12 mb-3 bg-slate-100 rounded-lg flex items-center justify-center text-slate-500 group-hover:text-indigo-600 group-hover:scale-110 transition-all dark:bg-slate-900 dark:text-slate-400"
                                                : "w-8 h-8 flex-shrink-0 bg-indigo-50 rounded flex items-center justify-center text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400"
                                            }>
                                                <FileText className={viewMode === 'grid' ? "w-6 h-6" : "w-4 h-4"} />
                                            </div>

                                            {viewMode === 'grid' ? (
                                                <div className="text-center w-full min-w-0">
                                                    <p className="text-sm font-medium text-slate-700 truncate group-hover:text-indigo-600 dark:text-slate-300 dark:group-hover:text-indigo-400" title={file.name}>
                                                        {file.name}
                                                    </p>
                                                    <p className="text-[10px] text-slate-400 mt-0.5">
                                                        {formatBytes(file.size)} • {file.uploadedBy?.name || 'Unknown'}
                                                    </p>
                                                </div>
                                            ) : (
                                                <>
                                                    <div className="flex-1 min-w-0 pr-4">
                                                        <p className="text-sm font-medium text-slate-700 truncate group-hover:text-indigo-600 dark:text-slate-300 dark:group-hover:text-indigo-400" title={file.name}>
                                                            {file.name}
                                                        </p>
                                                        {/* Mobile sub-info */}
                                                        <p className="text-[10px] text-slate-400 mt-0.5 sm:hidden">
                                                            {formatBytes(file.size)} • {file.createdAt ? new Date(file.createdAt).toLocaleDateString() : '-'}
                                                        </p>
                                                    </div>

                                                    <div className="w-24 text-xs text-slate-500 hidden sm:block dark:text-slate-400">
                                                        {formatBytes(file.size)}
                                                    </div>

                                                    <div className="w-32 text-xs text-slate-500 hidden md:block dark:text-slate-400">
                                                        {file.createdAt ? new Date(file.createdAt).toLocaleDateString() : '-'}
                                                    </div>

                                                    <div className="w-32 text-xs text-slate-500 hidden lg:block dark:text-slate-400 truncate" title={file.uploadedBy?.name || 'Unknown'}>
                                                        {file.uploadedBy?.name || 'Unknown'}
                                                    </div>

                                                    <div className="w-48 text-xs text-slate-500 hidden xl:block dark:text-slate-400 truncate" title={file.task?.title || '-'}>
                                                        {file.task ? (
                                                            <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[10px] font-medium dark:bg-slate-800 dark:text-slate-400">
                                                                {file.task.title}
                                                            </span>
                                                        ) : '-'}
                                                    </div>
                                                </>
                                            )}
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
