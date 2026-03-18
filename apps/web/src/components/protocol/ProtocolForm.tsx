'use client';

import { createProtocol } from '@/actions/protocol';
import { type Dictionary } from '@/i18n/dictionaries';

interface ProtocolFormProps {
    dict: Dictionary['protocolLibrary'];
    users: { id: string; name: string | null; email: string }[];
}

export function ProtocolForm({ dict, users }: ProtocolFormProps) {
    // We can use useActionState for better error handling in future, simple form action for now

    return (
        <form action={createProtocol} className="space-y-4">
            <div className="space-y-3">
                <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1 dark:text-slate-300">{dict.nameLabel}</label>
                    <input
                        type="text"
                        name="name"
                        required
                        className="w-full rounded bg-white border border-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm py-1.5 px-3 placeholder:text-slate-400 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 dark:placeholder:text-slate-500"
                        placeholder={dict.namePlaceholder}
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1 dark:text-slate-300">{dict.descLabel}</label>
                    <textarea
                        name="description"
                        rows={3}
                        className="w-full rounded bg-white border border-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm py-1.5 px-3 placeholder:text-slate-400 resize-none dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 dark:placeholder:text-slate-500"
                        placeholder={dict.descPlaceholder}
                    />
                </div>

                {/* Access Control */}
                <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1 dark:text-slate-300">
                        Akses Pembuatan Proyek
                    </label>
                    <p className="text-[10px] text-slate-500 mb-2 dark:text-slate-400">
                        Siapa yang boleh membuat proyek dengan protokol ini? Biarkan kosong jika <strong>Semua Orang</strong> boleh.
                    </p>
                    <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-lg p-2 bg-slate-50 dark:bg-slate-800/50 dark:border-slate-700 scrollbar-thin">
                        <div className="space-y-1">
                            {users.map((user) => (
                                <label key={user.id} className="flex items-center gap-2 px-2 py-1 hover:bg-slate-100 rounded cursor-pointer dark:hover:bg-slate-700/50 transition-colors">
                                    <input
                                        type="checkbox"
                                        name="allowedCreatorIds"
                                        value={user.id}
                                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 dark:bg-slate-700 dark:border-slate-600"
                                    />
                                    <span className="text-xs text-slate-700 dark:text-slate-300 truncate">
                                        {user.name || user.email}
                                    </span>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <button
                type="submit"
                className="w-full justify-center rounded bg-indigo-600 py-2 px-4 text-xs font-bold text-white hover:bg-indigo-700 transition-colors shadow-sm"
            >
                {dict.createButton}
            </button>
        </form>
    );
}
