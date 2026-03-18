'use client';

import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { AIGeneratorModal } from './AIGeneratorModal';

export function AIGeneratorTrigger() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white rounded-lg font-bold text-sm shadow-sm transition-all active:scale-95"
            >
                <Sparkles className="w-4 h-4" />
                <span>Generate via AI ✨</span>
            </button>

            <AIGeneratorModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
        </>
    );
}
