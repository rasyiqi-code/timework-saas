'use client';

import { useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { updateItemStatus } from '@/actions/project';
import { Circle, ExternalLink, Clock } from 'lucide-react';
import { type Dictionary } from '@/i18n/dictionaries';

interface MyTaskItemProps {
    task: {
        id: string;
        title: string;
        projectId: string;
        status: string;
        updatedAt: Date | string;
        description?: string | null;
    };
    dict: Dictionary;
}

export function MyTaskItem({ task }: MyTaskItemProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    const handleComplete = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        startTransition(async () => {
            await updateItemStatus(task.id, 'DONE');
            router.refresh();
        });
    };

    const timeAgo = new Date(task.updatedAt).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
    });

    return (
        <div className="group flex items-center gap-3 p-2 rounded-lg bg-white border border-slate-200 hover:border-indigo-300 hover:shadow-sm transition-all dark:bg-slate-900 dark:border-slate-800 dark:hover:border-indigo-500">
            {/* Status Button */}
            <button
                onClick={handleComplete}
                disabled={isPending}
                className={`shrink-0 w-8 h-8 flex items-center justify-center rounded-full transition-colors ${
                    isPending ? 'opacity-50' : 'hover:bg-emerald-50 text-slate-300 hover:text-emerald-500 dark:hover:bg-emerald-900/20'
                }`}
                title="Mark as Done"
            >
                {isPending ? (
                    <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                ) : (
                    <Circle size={20} />
                )}
            </button>

            {/* Task Info */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <Link
                        href={`/projects/${task.projectId}`}
                        className="text-sm font-semibold text-slate-700 dark:text-slate-200 hover:text-indigo-600 truncate dark:hover:text-indigo-400"
                    >
                        {task.title}
                    </Link>
                </div>
                <div className="flex items-center gap-3 mt-0.5">
                    <div className="flex items-center gap-1 text-[10px] text-slate-400">
                        <Clock size={10} />
                        <span>{timeAgo}</span>
                    </div>
                </div>
            </div>

            {/* Link to Project */}
            <Link
                href={`/projects/${task.projectId}`}
                className="shrink-0 p-1.5 rounded-md text-slate-300 hover:text-indigo-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all opacity-0 group-hover:opacity-100"
                title="Go to Project"
            >
                <ExternalLink size={14} />
            </Link>
        </div>
    );
}
