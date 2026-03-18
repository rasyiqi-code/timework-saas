'use client';

import { useState } from 'react';
import { deleteFile } from '@/actions/file';
import { toast } from 'sonner';
import { FileIcon, Trash2, Download } from 'lucide-react';
import { type User } from '@repo/database';

interface FileRecord {
    id: string;
    name: string;
    url: string;
    size: number;
    type: string;
    createdAt: Date;
    uploadedBy: { name: string | null; email: string };
    task: { id: string; title: string } | null;
}

interface FileListProps {
    files: FileRecord[];
    currentUser: User | null;
    projectId: string;
}

export function FileList({ files, currentUser }: FileListProps) {
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const handleDelete = async (fileId: string) => {
        if (!confirm('Are you sure you want to delete this file? This cannot be undone.')) return;

        setDeletingId(fileId);
        try {
            await deleteFile(fileId);
            toast.success('File deleted');
        } catch {
            toast.error('Failed to delete file');
        } finally {
            setDeletingId(null);
        }
    };

    if (files.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400 border-2 border-dashed border-slate-200 rounded-xl dark:border-slate-800">
                <FileIcon className="w-12 h-12 mb-3 opacity-20" />
                <p>No files uploaded yet.</p>
            </div>
        );
    }

    const isAdmin = currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPER_ADMIN';

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {files.map(file => {
                const canDelete = isAdmin || file.uploadedBy.email === currentUser?.email;

                return (
                    <div key={file.id} className="group relative bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl p-4 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all">
                        <div className="flex items-start justify-between mb-2">
                            <div className="p-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
                                <FileIcon className="w-6 h-6 text-indigo-500" />
                            </div>
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                <a
                                    href={`/api/file/${file.id}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-1.5 bg-white dark:bg-slate-800 text-slate-500 hover:text-indigo-600 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm"
                                    title="Download"
                                >
                                    <Download className="w-3.5 h-3.5" />
                                </a>
                                {canDelete && (
                                    <button
                                        onClick={() => handleDelete(file.id)}
                                        disabled={deletingId === file.id}
                                        className="p-1.5 bg-white dark:bg-slate-800 text-slate-500 hover:text-red-600 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm"
                                        title="Delete"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                )}
                            </div>
                        </div>

                        <h4 className="font-bold text-sm text-slate-700 dark:text-slate-200 truncate mb-1" title={file.name}>
                            {file.name}
                        </h4>

                        <div className="space-y-1">
                            <div className="flex items-center gap-2 text-xs text-slate-500">
                                <span>{(file.size / 1024).toFixed(0)} KB</span>
                                <span>•</span>
                                <span>{new Date(file.createdAt).toLocaleDateString()}</span>
                            </div>
                            <div className="text-xs text-slate-400 truncate">
                                by {file.uploadedBy.name || file.uploadedBy.email}
                            </div>
                            {file.task && (
                                <div className="pt-2 mt-2 border-t border-slate-100 dark:border-slate-800">
                                    <span className="text-[10px] uppercase font-bold text-slate-400">Attached to:</span>
                                    <div className="text-xs text-indigo-600 dark:text-indigo-400 truncate">
                                        {file.task.title}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
