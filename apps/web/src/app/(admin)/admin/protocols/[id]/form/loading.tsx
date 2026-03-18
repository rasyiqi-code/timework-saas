import { Skeleton } from "@/components/ui/skeleton";

export default function ProtocolFormLoading() {
    return (
        <div className="max-w-7xl mx-auto py-12 px-4 space-y-8 animate-pulse">
            {/* Header / Breadcrumb Skeleton */}
            <div className="flex flex-col gap-4 border-b border-slate-200 pb-6 dark:border-slate-800">
                <Skeleton className="h-3 w-32" /> {/* Back Link */}
                <div className="space-y-2">
                    <Skeleton className="h-8 w-64" /> {/* H1 */}
                    <Skeleton className="h-4 w-96" /> {/* Subtitle */}
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-8 items-start">

                {/* Sidebar Skeleton */}
                <aside className="w-full md:w-64 shrink-0 space-y-4 md:sticky md:top-8">
                    {/* Menu Card */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm p-4 space-y-3">
                        <Skeleton className="h-3 w-24 mb-2" />
                        <Skeleton className="h-8 w-full rounded-lg" />
                        <Skeleton className="h-8 w-full rounded-lg bg-indigo-50 dark:bg-slate-800" />
                    </div>

                    {/* Tips Card */}
                    <div className="bg-indigo-600/10 dark:bg-slate-800 rounded-xl p-5 border border-indigo-100 dark:border-slate-700 h-48">
                        <div className="flex items-center gap-2 mb-3">
                            <Skeleton className="h-6 w-6 rounded-full" />
                            <Skeleton className="h-4 w-20" />
                        </div>
                        <div className="space-y-2">
                            <Skeleton className="h-3 w-full" />
                            <Skeleton className="h-3 w-full" />
                            <Skeleton className="h-3 w-3/4" />
                        </div>
                    </div>
                </aside>

                {/* Main Form Skeleton */}
                <div className="flex-1 w-full min-w-0 space-y-6">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
                        {/* Title Pattern Config */}
                        <div className="mb-8 p-4 bg-slate-50 border border-slate-200 rounded-lg dark:bg-slate-900/50 dark:border-slate-800">
                            <Skeleton className="h-3 w-32 mb-3" />
                            <Skeleton className="h-9 w-full rounded-md" />
                            <Skeleton className="h-2 w-48 mt-2" />
                        </div>

                        {/* Field Cards Skeleton */}
                        <div className="space-y-4">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="p-5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm relative">
                                    <div className="flex gap-4 items-start">
                                        <div className="flex-1 space-y-4">
                                            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                                                <div className="md:col-span-6 space-y-2">
                                                    <Skeleton className="h-3 w-16" />
                                                    <Skeleton className="h-9 w-full rounded-md" />
                                                </div>
                                                <div className="md:col-span-3 space-y-2">
                                                    <Skeleton className="h-3 w-16" />
                                                    <Skeleton className="h-9 w-full rounded-md" />
                                                </div>
                                                <div className="md:col-span-3 space-y-2">
                                                    <Skeleton className="h-3 w-16" />
                                                    <Skeleton className="h-9 w-full rounded-md" />
                                                </div>
                                            </div>

                                            {/* Action footer */}
                                            <div className="pt-2 flex justify-between">
                                                <Skeleton className="h-4 w-24 rounded-full" />
                                                <Skeleton className="h-5 w-5 rounded" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Add Button */}
                        <div className="mt-6">
                            <Skeleton className="h-9 w-32 rounded-lg" />
                        </div>
                    </div>

                    {/* Save Button Sticky */}
                    <div className="flex justify-end sticky bottom-6 z-20">
                        <Skeleton className="h-12 w-32 rounded-xl shadow-lg" />
                    </div>
                </div>
            </div>
        </div>
    );
}
