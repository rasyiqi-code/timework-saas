import { getProtocolById } from '@/actions/protocol';
import { getDictionary } from '@/i18n/server';
import { getUsers } from '@/actions/user';
import { ItemBuilder } from '@/components/protocol/ItemBuilder';
import { ProtocolHeader } from '@/components/protocol/ProtocolHeader';

import Link from 'next/link';
import { notFound } from 'next/navigation';

import { checkRole } from '@/lib/check-role';

export const dynamic = 'force-dynamic';

export default async function ProtocolDetailPage({ params }: { params: Promise<{ id: string }> }) {
    await checkRole('ADMIN');
    // Await params first (Next.js 15 requirement for dynamic routes)
    const { id } = await params;

    const protocol = await getProtocolById(id);
    const users = await getUsers();
    const dict = await getDictionary();

    if (!protocol) {
        notFound();
    }

    return (
        <div className="max-w-7xl mx-auto py-12 px-4 space-y-8">
            {/* Breadcrumb / Back */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-6 dark:border-slate-800">
                <div className="flex-1 w-full">
                    {/* Breadcrumb / Back */}
                    <Link
                        href="/admin/protocols"
                        className="inline-flex items-center gap-1 text-slate-400 hover:text-slate-800 transition-colors font-medium text-xs mb-2 dark:hover:text-slate-200"
                    >
                        <span>←</span> Back to Library
                    </Link>

                    <ProtocolHeader protocol={protocol} users={users} />
                </div>

                <div className="text-right flex flex-col items-end gap-2">
                    <div className="text-xs text-slate-400 font-mono dark:text-slate-500">
                        Last updated {new Date(protocol.updatedAt).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-2">
                        <Link
                            href={`/admin/protocols/${protocol.id}/form`}
                            className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded text-xs font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700"
                        >
                            <svg className="w-3.5 h-3.5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                            Edit Form
                        </Link>
                    </div>
                </div>
            </div>

            {/* Builder Section */}
            <div className="space-y-4">
                <ItemBuilder protocolId={protocol.id} items={protocol.items} users={users} dict={dict.protocol} />
            </div>
        </div>

    );
}
