'use client';

import { useState } from 'react';
import { Upload } from 'lucide-react';
import { ImportProtocolModal } from './ImportProtocolModal';

export function ImportProtocolTrigger() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg font-bold text-sm shadow-sm transition-all active:scale-95 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-700"
            >
                <Upload className="w-4 h-4" />
                <span>Import JSON</span>
            </button>

            <ImportProtocolModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
        </>
    );
}
