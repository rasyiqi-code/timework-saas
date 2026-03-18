import { getDeletedProjects } from "@/actions/project";
import { getDictionary } from "@/i18n/server";
import { ProjectTrashList } from "@/components/admin/project/ProjectTrashList";
import Link from "next/link";
import { Trash2, ChevronRight } from "lucide-react";

export default async function ProjectTrashPage() {
    const dict = await getDictionary();
    const projects = await getDeletedProjects();

    return (
        <main className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 md:p-10">
            <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Breadcrumbs */}
                <nav className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    <Link href="/projects" className="hover:text-indigo-500 transition-colors">Dashboard</Link>
                    <ChevronRight className="w-3 h-3" />
                    <span className="text-slate-900 dark:text-slate-100">Admin</span>
                    <ChevronRight className="w-3 h-3" />
                    <span className="text-indigo-600 dark:text-indigo-400">Tempat Sampah</span>
                </nav>

                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div className="space-y-1">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-red-100 text-red-600 rounded-2xl dark:bg-red-900/40 dark:text-red-400 shadow-sm border border-red-200 dark:border-red-900/50">
                                <Trash2 className="w-7 h-7" />
                            </div>
                            <h1 className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">Manajemen Proyek Terhapus</h1>
                        </div>
                        <p className="text-slate-500 text-sm dark:text-slate-400 max-w-2xl leading-relaxed">
                            Khusus Admin: Pulihkan proyek yang sengaja dihapus, atau hapus secara permanen untuk mengosongkan ruang database. Tindakan ini <span className="text-red-500 font-bold">tidak dapat dibatalkan</span> setelah dihapus permanen.
                        </p>
                    </div>
                </div>

                <ProjectTrashList projects={projects} dict={dict} />
            </div>
        </main>
    );
}
