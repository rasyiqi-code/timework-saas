import { Skeleton } from "@/components/ui/skeleton";

export default function ProtocolsLoading() {
    return (
        <div className="max-w-7xl mx-auto py-8 px-4">
            <div className="flex flex-col md:flex-row justify-between items-end mb-6 gap-6">
                <div>
                    <Skeleton className="h-8 w-48 mb-2" />
                    <Skeleton className="h-4 w-80" />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                {/* Left Column: Protocol List (2 spans) */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="grid gap-3 grid-cols-1 md:grid-cols-2">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="group relative p-4 bg-white border border-slate-200 rounded-lg shadow-sm dark:bg-slate-900 dark:border-slate-800">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="space-y-2 w-full mr-4">
                                        <Skeleton className="h-4 w-1/3 rounded mb-1" /> {/* Name */}
                                        <Skeleton className="h-3 w-full opacity-60 rounded" />
                                        <Skeleton className="h-3 w-2/3 opacity-60 rounded" />
                                    </div>
                                    <Skeleton className="h-5 w-12 rounded-full shrink-0" /> {/* Step Count */}
                                </div>

                                <div className="border-t border-slate-50 mt-4 pt-2 flex justify-between items-center dark:border-slate-800">
                                    <Skeleton className="h-3 w-20" /> {/* Date */}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right Column: Sticky Create Form (1 span) */}
                <div className="bg-slate-50 border border-slate-200 p-5 rounded-xl sticky top-20 dark:bg-slate-900 dark:border-slate-800">
                    <Skeleton className="h-5 w-40 mb-4" />
                    <div className="space-y-3">
                        <Skeleton className="h-10 w-full rounded" /> {/* Name Input */}
                        <Skeleton className="h-20 w-full rounded" /> {/* Desc Input */}
                        <Skeleton className="h-10 w-full rounded-lg" /> {/* Submit Btn */}
                    </div>
                </div>
            </div>
        </div>
    );
}
