import { getProtocolById } from '@/actions/protocol';
import { getDictionary } from '@/i18n/server';
import { FormBuilder } from '@/components/form/FormBuilder';
import { type FormField } from '@/types/form';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { checkRole } from '@/lib/check-role';

export const dynamic = 'force-dynamic';

export default async function ProtocolFormPage({ params }: { params: Promise<{ id: string }> }) {
    await checkRole('ADMIN');
    const { id } = await params;

    const protocol = await getProtocolById(id);
    const dict = await getDictionary();

    if (!protocol) {
        notFound();
    }

    return (
        <div className="max-w-7xl mx-auto py-12 px-4 space-y-8">
            {/* Header / Breadcrumb */}
            <div className="flex flex-col gap-4 border-b border-slate-200 pb-6 dark:border-slate-800">
                <Link
                    href={`/admin/protocols/${protocol.id}`}
                    className="inline-flex items-center gap-1 text-slate-400 hover:text-slate-800 transition-colors font-medium text-xs mb-2 dark:hover:text-slate-200"
                >
                    <span>←</span> Back to Protocol
                </Link>

                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-1">
                            Form Builder: {protocol.name}
                        </h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            Customize the fields required when starting a project with this SOP.
                        </p>
                    </div>
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-8 items-start">

                {/* Sidebar Navigation */}
                <aside className="w-full md:w-64 shrink-0 space-y-4 sticky top-8">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
                        <div className="p-3 bg-slate-50 border-b border-slate-100 dark:bg-slate-800 dark:border-slate-700">
                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">{dict.protocol.sidebar.menuTitle}</h3>
                        </div>
                        <nav className="p-2 space-y-1">
                            <Link
                                href={`/admin/protocols/${protocol.id}`}
                                className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-600 rounded-lg hover:bg-slate-50 hover:text-indigo-600 transition-colors dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-indigo-400"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path></svg>
                                {dict.protocol.sidebar.workflow.replace('{steps}', 'Tasks')}
                            </Link>
                            <div className="flex items-center gap-3 px-3 py-2 text-sm font-bold text-indigo-600 bg-indigo-50 rounded-lg border border-indigo-100 dark:bg-indigo-900/20 dark:text-indigo-300 dark:border-indigo-800">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                                {dict.protocol.sidebar.form}
                            </div>
                        </nav>
                    </div>

                    {/* Tips Card */}
                    <div className="bg-indigo-600 rounded-xl p-5 text-white shadow-lg shadow-indigo-200 dark:shadow-none">
                        <div className="flex items-center gap-2 mb-3">
                            <span className="text-xl">💡</span>
                            <h3 className="font-bold text-sm">{dict.protocol.sidebar.tipsTitle}</h3>
                        </div>
                        <ul className="space-y-3 text-xs text-indigo-100 list-disc pl-4">
                            <li dangerouslySetInnerHTML={{ __html: dict.protocol.sidebar.tip1 }} />
                            <li dangerouslySetInnerHTML={{ __html: dict.protocol.sidebar.tip2 }} />
                            <li dangerouslySetInnerHTML={{ __html: dict.protocol.sidebar.tip3 }} />
                        </ul>
                    </div>
                </aside>

                {/* Form Builder Main Area */}
                <div className="flex-1 w-full min-w-0">
                    <FormBuilder
                        protocolId={protocol.id}
                        initialFields={(protocol.formFields as unknown as FormField[]) || []}
                        initialTitleFormat={protocol.titleFormat}
                        dict={dict.formBuilder}
                    />
                </div>
            </div>
        </div>
    );
}
