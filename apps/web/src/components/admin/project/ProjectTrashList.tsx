'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { RotateCcw, Trash2, Loader2 } from 'lucide-react';
import { restoreProject, hardDeleteProject } from '@/actions/project';
import { type Dictionary } from '@/i18n/dictionaries';

interface ProjectTrashListProps {
    projects: {
        id: string;
        title: string;
        updatedAt: Date;
        deletedAt: Date | null;
        _count: { items: number };
    }[];
    dict: Dictionary;
}

export function ProjectTrashList({ projects, dict }: ProjectTrashListProps) {
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    const handleRestore = (id: string) => {
        startTransition(async () => {
            try {
                await restoreProject(id);
                toast.success('Proyek berhasil dipulihkan');
                router.refresh();
            } catch {
                toast.error('Gagal memulihkan proyek');
            }
        });
    };

    const handleHardDelete = (id: string) => {
        if (confirm('PERINGATAN: Tindakan ini akan menghapus proyek secara PERMANEN dari database dan tidak dapat dibatalkan. Apakah Anda yakin?')) {
            startTransition(async () => {
                try {
                    await hardDeleteProject(id);
                    toast.success('Proyek dihapus secara permanen');
                    router.refresh();
                } catch {
                    toast.error('Gagal menghapus proyek secara permanen');
                }
            });
        }
    };

    if (projects.length === 0) {
        return (
            <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-200 dark:bg-slate-900/50 dark:border-slate-800">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 dark:bg-slate-800">
                    <Trash2 className="w-8 h-8 text-slate-300" />
                </div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Tempat Sampah Kosong</h3>
                <p className="text-slate-500 text-sm dark:text-slate-400">Tidak ada proyek yang dihapus saat ini.</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm dark:bg-slate-900 dark:border-slate-800 relative">
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 dark:bg-slate-800/50 dark:border-slate-700">
                            <th className="px-6 py-4 text-xs font-bold uppercase text-slate-500 tracking-wider">Judul Proyek</th>
                            <th className="px-6 py-4 text-xs font-bold uppercase text-slate-500 tracking-wider">Tugas</th>
                            <th className="px-6 py-4 text-xs font-bold uppercase text-slate-500 tracking-wider">Tgl Dihapus</th>
                            <th className="px-6 py-4 text-xs font-bold uppercase text-slate-500 tracking-wider text-right">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {projects.map((project) => (
                            <tr key={project.id} className="hover:bg-slate-50/50 transition-colors dark:hover:bg-slate-800/30">
                                <td className="px-6 py-4">
                                    <div className="font-bold text-slate-900 dark:text-slate-100">{project.title}</div>
                                    <div className="text-[10px] text-slate-400 font-mono">{project.id}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                                        {project._count.items} {dict.project.tasks}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="text-sm text-slate-600 dark:text-slate-400">
                                        {project.deletedAt ? new Date(project.deletedAt).toLocaleDateString('id-ID', {
                                            day: 'numeric',
                                            month: 'short',
                                            year: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        }) : '-'}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex justify-end gap-2">
                                        <button
                                            onClick={() => handleRestore(project.id)}
                                            disabled={isPending}
                                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors disabled:opacity-50 dark:bg-indigo-900/30 dark:text-indigo-400 dark:hover:bg-indigo-900/50"
                                            title="Restore Project"
                                        >
                                            <RotateCcw className="w-3.5 h-3.5" />
                                            Pulihkan
                                        </button>
                                        <button
                                            onClick={() => handleHardDelete(project.id)}
                                            disabled={isPending}
                                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50"
                                            title="Hard Delete Project"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                            Hapus Permanen
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {isPending && (
                <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] flex items-center justify-center dark:bg-slate-900/50">
                    <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                </div>
            )}
        </div>
    );
}
