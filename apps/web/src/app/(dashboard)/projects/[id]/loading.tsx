import { Skeleton } from "@/components/ui/skeleton";

export default function ProjectDetailLoading() {
    return (
        <div className="w-full px-4 py-8 min-h-screen mb-20">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-8 items-start">

                {/* Sidebar Skeleton (Matches ProjectSidebar.tsx) */}
                <aside className="w-full md:w-64 shrink-0 space-y-4 md:sticky md:top-8 self-start">
                    <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm dark:bg-slate-900 dark:border-slate-800">
                        <div className="mb-4">
                            <div className="flex justify-between items-start mb-2">
                                <Skeleton className="h-3 w-16 mb-1" />
                                <Skeleton className="h-5 w-14 rounded" />
                            </div>
                            <Skeleton className="h-6 w-3/4 mb-2" /> {/* Title */}
                            <Skeleton className="h-3 w-full mb-1" /> {/* Desc */}
                            <Skeleton className="h-3 w-2/3" />
                        </div>

                        {/* Metadata */}
                        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
                            <div className="space-y-1">
                                <Skeleton className="h-2 w-12" />
                                <Skeleton className="h-4 w-24" />
                            </div>
                        </div>

                        {/* Progress */}
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

                {/* Main Board Skeleton (Matches Timeline View in ProjectBoard.tsx) */}
                {/* Main Board Skeleton (Matches Form Builder Style) */}
                <main className="flex-1 w-full min-w-0">
                    <div className="relative w-full pb-20 pt-4 space-y-6">
                        {/* Vertical Line Skeleton */}
                        <div className="absolute left-[39px] top-4 bottom-4 w-0.5 bg-slate-100 dark:bg-slate-800 -z-10 hidden md:block"></div>

                        {/* Timeline Items */}
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="relative md:pl-14">
                                {/* Timeline Dot Skeleton */}
                                <div className="absolute top-6 left-[34px] hidden md:flex items-center justify-center">
                                    <Skeleton className="w-3 h-3 rounded-full" />
                                </div>

                                {/* Connection Line */}
                                <div className="absolute top-[29px] left-[38px] w-5 h-px bg-slate-200 hidden md:block dark:bg-slate-800"></div>

                                {/* Card Skeleton (Matches ProjectItemCard.tsx) */}
                                <div className="w-full p-5 rounded-xl border-l-4 border-slate-200 bg-white shadow-sm dark:bg-slate-900 dark:border-slate-800 dark:border-l-slate-700">
                                    {/* Header: Status & Date */}
                                    <div className="flex justify-between items-start mb-2">
                                        <Skeleton className="h-4 w-16 rounded mb-1" /> {/* Status Badge */}
                                    </div>

                                    {/* Title & Desc */}
                                    <Skeleton className="h-5 w-3/4 mb-2 rounded" />
                                    <Skeleton className="h-3 w-full mb-1 opacity-60" />
                                    <Skeleton className="h-3 w-2/3 opacity-60" />

                                    {/* Footer: Action & Assignee */}
                                    <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                                        <div className="flex items-center -space-x-2">
                                            <Skeleton className="w-6 h-6 rounded-full border-2 border-white dark:border-slate-900" />
                                            <Skeleton className="w-6 h-6 rounded-full border-2 border-white dark:border-slate-900" />
                                        </div>
                                        <Skeleton className="h-7 w-20 rounded-lg" /> {/* Mark Done Btn */}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </main>

            </div>
        </div>
    );
}
