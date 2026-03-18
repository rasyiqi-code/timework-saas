import { getProjectById } from '@/actions/project';
import { getProjectFiles } from '@/actions/file';
import { ProjectSidebar } from '@/components/project/ProjectSidebar';
import { getUsers } from '@/actions/user';
import { getCurrentUser } from '@/actions/auth';
import { notFound } from 'next/navigation';
import { getDictionary } from '@/i18n/server';
import { type FormField } from '@/types/form';
import { FileList } from '@/components/file/FileList';
import { ProjectFilesClient } from '@/components/file/ProjectFilesClient';

export const dynamic = 'force-dynamic';

// Force rebuild
export default async function ProjectFilesPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const project = await getProjectById(id);
    const users = await getUsers();
    const currentUser = await getCurrentUser();
    const dict = await getDictionary();

    if (!project) notFound();

    const files = await getProjectFiles(id);
    const fields = (project.protocol?.formFields as unknown as FormField[]) || [];

    return (
        <div className="w-full px-4 py-8 min-h-screen mb-20">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-8 items-start">
                <ProjectSidebar project={project} users={users} currentUser={currentUser} dict={dict} fields={fields} />

                <main className="flex-1 w-full min-w-0">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Project Files</h1>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Manage all files uploaded to this project.</p>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 min-h-[400px]">
                        <ProjectFilesClient projectId={id} currentUser={currentUser} />
                        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4">All Files</h3>
                        <FileList files={files} currentUser={currentUser} projectId={id} />
                    </div>
                </main>
            </div>
        </div>
    );
}
