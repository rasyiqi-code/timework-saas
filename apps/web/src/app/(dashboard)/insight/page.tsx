import { getInsightStats } from '@/actions/insight';
import { InsightDashboard } from '@/components/insight/InsightDashboard';
import { getDictionary } from '@/i18n/server';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Insight',
};

export default async function Page() {
    const { getCurrentUser } = await import('@/actions/auth');
    const user = await getCurrentUser();

    if (user?.organization?.subscriptionStatus === 'EXPIRED') {
        import('next/navigation').then(({ redirect }) => redirect('/billing'));
        return null;
    }

    const [data, dict] = await Promise.all([
        getInsightStats(),
        getDictionary()
    ]);

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span className="text-3xl">📊</span>
                    {dict.nav.insight}
                </h1>
                <p className="text-slate-500 dark:text-slate-400 mt-1">
                    Organization performance metrics and statistics.
                </p>
            </div>

            <InsightDashboard data={data} />
        </div>
    );
}
