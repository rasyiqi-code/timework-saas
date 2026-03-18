'use client';

import { useState, useEffect } from 'react';
import { getAllNotes, type NoteItem } from '@/actions/note';
import { Search, StickyNote, ArrowLeft, FolderOpen, Loader2 } from 'lucide-react';
// Note Manager component for viewing and searching notes across projects.

export default function NotesPage() {
    const [notes, setNotes] = useState<NoteItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedProject, setSelectedProject] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        getAllNotes().then(data => {
            setNotes(data);
            setLoading(false);
        });
    }, []);

    // Group notes by project
    const projectGroups = notes.reduce((acc, note) => {
        const pid = note.project.id;
        if (!acc[pid]) {
            acc[pid] = {
                id: pid,
                title: note.project.title,
                status: note.project.status,
                count: 0,
                notes: []
            };
        }
        acc[pid].count++;
        acc[pid].notes.push(note);
        return acc;
    }, {} as Record<string, { id: string; title: string; status: string; count: number; notes: NoteItem[] }>);

    const projects = Object.values(projectGroups).sort((a, b) => a.title.localeCompare(b.title));

    // Filter projects for the main view
    const filteredProjects = projects.filter(p =>
        p.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Current Project View
    const activeGroup = selectedProject ? projectGroups[selectedProject] : null;

    // Filter notes inside the project view
    const filteredNotes = activeGroup?.notes.filter(note =>
        note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (note.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
    ) || [];

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-screen">
            <header className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <StickyNote className="w-8 h-8 text-indigo-500" />
                        Note Manager
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">
                        {selectedProject
                            ? `Viewing items for ${activeGroup?.title}`
                            : 'Select a project to view its notes and task descriptions'}
                    </p>
                </div>

                {selectedProject && (
                    <button
                        onClick={() => {
                            setSelectedProject(null);
                            setSearchQuery('');
                        }}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors dark:text-indigo-400 dark:bg-indigo-900/30"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Projects
                    </button>
                )}
            </header>

            {/* Search Bar */}
            <div className="mb-8 relative max-w-md">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                    type="text"
                    placeholder={selectedProject ? "Search within this project..." : "Search project names..."}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 shadow-sm"
                />
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-4" />
                    <p className="text-slate-500">Loading your board...</p>
                </div>
            ) : !selectedProject ? (
                // VIEW 1: PROJECT GROUPS (TABLE)
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden dark:bg-slate-900 dark:border-slate-800">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200 dark:bg-slate-800/50 dark:border-slate-700 dark:text-slate-400">
                                <tr>
                                    <th className="px-6 py-4 font-bold">Project Name</th>
                                    <th className="px-6 py-4 font-bold text-center">Notes / Tasks</th>
                                    <th className="px-6 py-4 font-bold">Status</th>
                                    <th className="px-6 py-4 font-bold text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {filteredProjects.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                                            No projects found with notes.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredProjects.map((group) => (
                                        <tr
                                            key={group.id}
                                            onClick={() => {
                                                setSelectedProject(group.id);
                                                setSearchQuery('');
                                            }}
                                            className="group cursor-pointer hover:bg-slate-50 transition-colors dark:hover:bg-slate-800/50"
                                        >
                                            <td className="px-6 py-4 w-1/2">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600 dark:bg-amber-900/20 dark:text-amber-500">
                                                        <FolderOpen className="w-4 h-4" />
                                                    </div>
                                                    <span className="font-bold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                                        {group.title}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300">
                                                    {group.count} Items
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${group.status === 'COMPLETED' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                                    group.status === 'ARCHIVED' ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400' :
                                                        'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                                    }`}>
                                                    {group.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className="text-xs font-bold text-indigo-600 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                                                    Open
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                // VIEW 2: STICKY NOTES BOARD
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredNotes.length === 0 ? (
                        <div className="col-span-full text-center py-20">
                            <p className="text-slate-500">No notes found matching your search.</p>
                        </div>
                    ) : (
                        filteredNotes.map((note) => (
                            <div
                                key={note.id}
                                className={`relative p-6 min-h-[200px] flex flex-col shadow-md hover:shadow-lg hover:-translate-y-1 transition-all duration-300 ${note.type === 'NOTE'
                                    ? 'bg-[#fef3c7] text-amber-900 rotate-1' // Yellow sticky for User Notes
                                    : 'bg-white text-slate-800 -rotate-1 border border-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700'  // White/Clean for Tasks
                                    }`}
                                style={{
                                    // Deterministic rotation based on id to keep render pure
                                    transform: `rotate(${(note.id.charCodeAt(note.id.length - 1) % 4) - 2}deg)`
                                }}
                            >
                                {/* Pin/Tape Effect */}
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-black/10 shadow-inner blur-[1px]"></div>
                                <div className={`absolute -top-2 left-1/2 -translate-x-1/2 w-12 h-4 ${note.type === 'NOTE' ? 'bg-amber-200/50' : 'bg-slate-200'} opacity-50 rotate-2`}></div>

                                <div className="flex-1">
                                    <h4 className={`font-bold text-lg mb-2 leading-tight ${note.type === 'NOTE' ? 'text-amber-950 font-handwriting' : 'text-slate-900 dark:text-slate-100'}`}>
                                        {note.title}
                                    </h4>
                                    <div className={`text-sm whitespace-pre-wrap leading-relaxed ${note.type === 'NOTE' ? 'text-amber-900/80' : 'text-slate-600 dark:text-slate-400'}`}>
                                        {note.description}
                                    </div>
                                </div>

                                <div className="mt-4 pt-4 border-t border-black/5 flex justify-between items-end text-xs opacity-70">
                                    <span>{new Date(note.updatedAt).toLocaleDateString()}</span>
                                    <span className="font-semibold uppercase tracking-wider text-[10px]">
                                        {note.type === 'NOTE' ? 'Note' : 'Task'}
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
