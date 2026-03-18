import { getProjectsMatrix } from '@/actions/project';
import { getProtocols } from '@/actions/protocol';
import { CreateProjectModal } from '@/components/project/CreateProjectModal';
import { ProjectTable } from '@/components/project/ProjectTable';
import { getDictionary } from '@/i18n/server';



export const dynamic = 'force-dynamic';

export default async function ProjectsPage() {
    const { projects, headers, nextCursor } = await getProjectsMatrix(12);
    const allProtocols = await getProtocols(true);
    const dict = await getDictionary();

    // Fetch user for organization ID (Realtime)
    const { getCurrentUser } = await import('@/actions/auth');
    const user = await getCurrentUser();

    // Filter protocols for creation modal (only allowed ones)
    const creatableProtocols = allProtocols.filter(p => {
        if (user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') return true;
        const allowedCreators = p.allowedCreators || [];
        if (allowedCreators.length === 0) return true;
        return allowedCreators.some(creator => creator.id === user?.id);
    });

    return (
        <div className="max-w-7xl mx-auto py-12 px-4">
            <div className="flex flex-col md:flex-row justify-between items-end mb-6 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">{dict.project.title}</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">{dict.project.subtitle}</p>
                </div>
                <CreateProjectModal protocols={creatableProtocols} dict={dict} />
            </div>

            <ProjectTable
                projects={projects as unknown as import('@/components/project/ProjectTable').ProjectTableProps['projects']}
                headers={headers}
                dict={dict}
                nextCursor={nextCursor}
                organizationId={user?.organizationId || ''}
                currentUser={user}
                protocols={allProtocols}
            />
        </div>
    );
}
