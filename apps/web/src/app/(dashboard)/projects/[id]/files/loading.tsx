import { Skeleton } from "@/components/ui/skeleton";

export default function ProjectFilesLoading() {
    return (
        <div className="w-full px-4 py-8 min-h-screen mb-20">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-8 items-start">

                {/* Sidebar Skeleton */}
                <aside className="w-full md:w-64 shrink-0 space-y-4 md:sticky md:top-8 self-start">
                    {/* Project Header Card */}
                    <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm dark:bg-slate-900 dark:border-slate-800">
                        <div className="mb-4">
                            <div className="flex justify-between items-start mb-2">
                                <Skeleton className="h-3 w-16 mb-1" />
                                <Skeleton className="h-5 w-14 rounded" />
                            </div>
                            <Skeleton className="h-6 w-3/4 mb-2" />
                            <Skeleton className="h-3 w-full mb-1" />
                            <Skeleton className="h-3 w-2/3" />
                        </div>
                        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
                            <div className="space-y-1">
                                <Skeleton className="h-2 w-12" />
                                <Skeleton className="h-4 w-24" />
                            </div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
                            <div className="flex justify-between">
                                <Skeleton className="h-3 w-16" />
                                <Skeleton className="h-3 w-8" />
                            </div>
                            <Skeleton className="h-1.5 w-full rounded-full" />
                        </div>
                        <div className="flex gap-2 mt-4">
                            <Skeleton className="h-8 w-full rounded-lg" />
                            <Skeleton className="h-8 w-full rounded-lg" />
                        </div>
                    </div>

                    {/* Team Members */}
                    <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm dark:bg-slate-900 dark:border-slate-800">
                        <Skeleton className="h-3 w-24 mb-3" />
                        <div className="flex gap-1.5">
                            <Skeleton className="h-6 w-6 rounded" />
                            <Skeleton className="h-6 w-6 rounded" />
                            <Skeleton className="h-6 w-6 rounded" />
                        </div>
                    </div>

                    {/* Navigation Link Skeleton */}
                    <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-sm dark:bg-slate-900 dark:border-slate-800 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <Skeleton className="w-8 h-8 rounded-lg" />
                            <Skeleton className="w-24 h-4" />
                        </div>
                        <Skeleton className="w-4 h-4" />
                    </div>

                    {/* File Manager Skeleton */}
                    <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm dark:bg-slate-900 dark:border-slate-800">
                        <Skeleton className="h-3 w-24 mb-3" /> {/* Title */}
                        <div className="space-y-2">
                            <Skeleton className="h-9 w-full rounded-lg" />
                            <Skeleton className="h-9 w-full rounded-lg" />
                        </div>
                    </div>
                </aside>

                {/* Main Content Skeleton */}
                <main className="flex-1 w-full min-w-0">
                    {/* Page Header */}
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <Skeleton className="h-8 w-48 mb-2" /> {/* Title: Project Files */}
                            <Skeleton className="h-4 w-64" /> {/* Desc */}
                        </div>
                    </div>

                    {/* Main Card */}
                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 min-h-[400px] shadow-sm">

                        {/* Migration Button Placeholder */}
                        <div className="flex justify-end mb-6">
                            <Skeleton className="h-4 w-32" />
                        </div>

                        {/* Files Section */}
                        <div>
                            <Skeleton className="h-5 w-24 mb-4" /> {/* "All Files" Title */}

                            {/* Files Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {[1, 2, 3, 4, 5, 6].map((i) => (
                                    <div key={i} className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
                                        {/* Top: Icon & Actions */}
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="p-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-100 dark:border-slate-700">
                                                <Skeleton className="w-6 h-6 rounded" />
                                            </div>
                                        </div>

                                        {/* Title */}
                                        <Skeleton className="h-4 w-3/4 mb-4 rounded" />

                                        {/* Meta Info */}
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2">
                                                <Skeleton className="h-3 w-12" />
                                                <Skeleton className="h-3 w-16" />
                                            </div>
                                            <Skeleton className="h-3 w-32" />

                                            <div className="pt-2 mt-2 border-t border-slate-100 dark:border-slate-800">
                                                <Skeleton className="h-2 w-16 mb-1" />
                                                <Skeleton className="h-3 w-24" />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
