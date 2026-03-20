
import { getAllFilesGroupedByProject } from '@/actions/file';
import { FileManager } from '@/components/file/FileManager';

export const metadata = {
    title: 'File Manager | Time Work',
};

export default async function FileManagerPage() {
    const { getCurrentUser } = await import('@/actions/auth');
    const user = await getCurrentUser();

    if (user?.organization?.subscriptionStatus === 'EXPIRED') {
        const { redirect } = await import('next/navigation');
        redirect('/billing');
    }

    const projects = await getAllFilesGroupedByProject();

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <header className="mb-6">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">File Manager</h1>
                <p className="text-slate-500 text-sm dark:text-slate-400">
                    Centralized storage for all project files.
                </p>
            </header>

            <FileManager projects={projects} />
        </div>
    );
}
