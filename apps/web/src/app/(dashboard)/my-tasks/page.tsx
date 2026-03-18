import { getMyTasks } from '@/actions/user';
import { getCurrentUser } from '@/actions/auth';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getDictionary } from '@/i18n/server';
import { MyTaskItem } from '@/components/project/MyTaskItem';
import { LayoutGrid, ClipboardList, CheckCircle2, ChevronRight, FolderOpen } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function MyTasksPage() {
    const user = await getCurrentUser();
    const dict = await getDictionary();

    if (!user) {
        redirect('/');
    }

    const tasks = await getMyTasks(user.id);

    // Group tasks by project
    const projectGroups = tasks.reduce((acc, task) => {
        const projectId = task.projectId;
        if (!acc[projectId]) {
            acc[projectId] = {
                title: task.project.title,
                tasks: []
            };
        }
        acc[projectId].tasks.push(task);
        return acc;
    }, {} as Record<string, { title: string, tasks: typeof tasks }>);

    const activeProjectCount = Object.keys(projectGroups).length;

    return (
        <div className="max-w-5xl mx-auto py-6 px-4">
            <div className="mb-8">
                <h1 className="text-xl font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
                    <ClipboardList className="text-indigo-500" size={20} />
                    {dict.myTasks.title}
                </h1>
                <p className="text-slate-500 dark:text-slate-400 text-xs">
                    {dict.myTasks.subtitle.replace('{name}', user.name || 'User').replace('{count}', tasks.length.toString())}
                </p>
            </div>

            {/* Quick Stats Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm dark:bg-slate-900 dark:border-slate-800">
                    <div className="flex items-center gap-2 text-slate-400 mb-1">
                        <ClipboardList size={14} />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Total Tasks</span>
                    </div>
                    <div className="text-xl font-bold text-slate-900 dark:text-slate-100">{tasks.length}</div>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm dark:bg-slate-900 dark:border-slate-800">
                    <div className="flex items-center gap-2 text-indigo-400 mb-1">
                        <LayoutGrid size={14} />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Active Projects</span>
                    </div>
                    <div className="text-xl font-bold text-slate-900 dark:text-slate-100">{activeProjectCount}</div>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm dark:bg-slate-900 dark:border-slate-800">
                    <div className="flex items-center gap-2 text-emerald-400 mb-1">
                        <CheckCircle2 size={14} />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Focus Today</span>
                    </div>
                    <div className="text-xl font-bold text-slate-900 dark:text-slate-100">
                        {tasks.filter(t => t.status === 'IN_PROGRESS').length}
                    </div>
                </div>
            </div>

            <div className="space-y-6">
                {tasks.length === 0 ? (
                    <div className="py-12 border border-dashed border-slate-300 rounded-xl bg-slate-50 text-center dark:bg-slate-900/50 dark:border-slate-800">
                        <div className="text-2xl mb-2">🎉</div>
                        <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{dict.myTasks.allCaughtUp}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-500">{dict.myTasks.noActiveTasks}</p>
                    </div>
                ) : (
                    Object.entries(projectGroups).map(([projectId, group]) => (
                        <div key={projectId} className="space-y-2">
                            <div className="flex items-center justify-between px-1">
                                <h2 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <FolderOpen size={12} className="text-slate-300" />
                                    {group.title}
                                    <span className="bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full text-[9px] dark:bg-slate-800 dark:text-slate-400">
                                        {group.tasks.length}
                                    </span>
                                </h2>
                                <Link
                                    href={`/projects/${projectId}`}
                                    className="text-[9px] font-bold text-indigo-500 hover:text-indigo-600 flex items-center gap-0.5"
                                >
                                    OPEN PROJECT <ChevronRight size={10} />
                                </Link>
                            </div>

                            <div className="space-y-1.5">
                                {group.tasks.map(task => (
                                    <MyTaskItem
                                        key={task.id}
                                        task={{
                                            ...task,
                                            updatedAt: task.updatedAt.toISOString()
                                        }}
                                        dict={dict}
                                    />
                                ))}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
