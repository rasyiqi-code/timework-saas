import { getProjectHistory } from '@/actions/audit';

export async function HistoryFeed({ projectId }: { projectId: string }) {
    const history = await getProjectHistory(projectId);

    return (
        <div className="space-y-1">
            {history.length === 0 ? (
                <p className="text-sm text-gray-500 italic">No history recorded yet.</p>
            ) : (
                history.map((log) => {
                    const isNotif = log.action === 'INTERNAL_NOTIFICATION';
                    return (
                        <div key={log.id} className={`flex gap-3 text-xs p-1.5 rounded transition-colors ${isNotif ? 'bg-amber-50 border border-amber-100 dark:bg-amber-900/10 dark:border-amber-800' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'}`}>
                            <div className="text-gray-400 min-w-[130px] font-mono text-xs pt-0.5 dark:text-gray-500">
                                {new Date(log.timestamp).toLocaleString()}
                            </div>
                            <div>
                                <span className={`font-semibold mr-2 ${isNotif ? 'text-amber-700 dark:text-amber-400' : 'text-gray-700 dark:text-gray-300'}`}>
                                    {isNotif ? '🔔 ALERT' : log.action.replace('_', ' ')}
                                </span>
                                <span className={isNotif ? 'text-amber-900 dark:text-amber-200 font-medium' : 'text-gray-600 dark:text-gray-400'}>
                                    {log.details}
                                </span>
                            </div>
                        </div>
                    );
                })
            )}
        </div>
    );
}
