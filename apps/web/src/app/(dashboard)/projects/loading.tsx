import { Skeleton } from "@/components/ui/skeleton";

export default function ProjectsLoading() {
    return (
        <div className="max-w-7xl mx-auto py-12 px-4">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row justify-between items-end mb-6 gap-4">
                <div>
                    <Skeleton className="h-8 w-48 mb-2" />
                    <Skeleton className="h-4 w-64" />
                </div>
                <Skeleton className="h-10 w-40 rounded-lg" /> {/* Create Button */}
            </div>

            {/* Filter Bar Skeleton */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm mb-4">
                <Skeleton className="h-10 w-full sm:w-72 rounded-lg" />
                <div className="flex gap-4 w-full sm:w-auto">
                    <Skeleton className="h-10 w-32 rounded-lg" />
                    <Skeleton className="h-10 w-32 rounded-lg" />
                </div>
            </div>

            {/* Table Skeleton */}
            <div className="overflow-x-auto scrollbar-hover rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm relative">
                {/* Header */}
                <div className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 px-6 py-4 grid grid-cols-12 gap-4">
                    <Skeleton className="h-4 w-24 col-span-4" />
                    <Skeleton className="h-4 w-20 col-span-2 hidden md:block" />
                    <Skeleton className="h-4 w-20 col-span-2 hidden md:block" />
                    <Skeleton className="h-4 w-20 col-span-2 hidden md:block" />
                    <Skeleton className="h-4 w-16 col-span-2 hidden md:block" />
                </div>

                {/* Rows */}
                {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 grid grid-cols-12 gap-4 items-center last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/30">
                        {/* Project Info */}
                        <div className="col-span-12 md:col-span-4 flex items-center gap-3">
                            <Skeleton className="w-10 h-10 rounded-lg shrink-0" />
                            <div className="space-y-2 w-full">
                                <Skeleton className="h-4 w-3/4 rounded" />
                                <Skeleton className="h-3 w-1/2 rounded opacity-70" />
                            </div>
                        </div>

                        {/* Protocol */}
                        <div className="col-span-2 hidden md:block">
                            <Skeleton className="h-6 w-24 rounded-full" />
                        </div>

                        {/* Team */}
                        <div className="col-span-2 hidden md:block">
                            <div className="flex -space-x-2">
                                <Skeleton className="w-7 h-7 rounded-full border-2 border-white dark:border-slate-900" />
                                <Skeleton className="w-7 h-7 rounded-full border-2 border-white dark:border-slate-900" />
                            </div>
                        </div>

                        {/* Date */}
                        <div className="col-span-2 hidden md:block">
                            <Skeleton className="h-4 w-20" />
                        </div>

                        {/* Status */}
                        <div className="col-span-2 hidden md:block flex justify-end">
                            <Skeleton className="h-7 w-20 rounded-md" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
