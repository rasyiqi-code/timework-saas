'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { importProtocol } from '@/actions/protocol';
import { Upload, X, Loader2, FileJson, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export function ImportProtocolModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
    const [isImporting, setIsImporting] = useState(false);
    const [mounted, setMounted] = useState(false);
    const router = useRouter();

    useEffect(() => setMounted(true), []);

    if (!isOpen || !mounted) return null;

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const content = event.target?.result as string;
                const data = JSON.parse(content);
                
                setIsImporting(true);
                const result = await importProtocol(data);
                
                if (result.success) {
                    toast.success("Protocol berhasil di-import!");
                    onClose();
                    router.push(`/admin/protocols/${result.protocolId}`);
                } else {
                    toast.error("Gagal meng-import protocol");
                }
            } catch (err) {
                console.error("Import error", err);
                toast.error("File JSON tidak valid atau rusak");
            } finally {
                setIsImporting(false);
            }
        };
        reader.readAsText(file);
    };

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center dark:bg-amber-900/30">
                            <Upload className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Import Protocol</h2>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Pilih file JSON hasil export sebelumnya</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors dark:hover:bg-slate-800 dark:hover:text-slate-300">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-8 flex flex-col items-center justify-center space-y-4">
                    {isImporting ? (
                        <div className="flex flex-col items-center gap-4 py-8">
                            <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
                            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Memproses import protocol...</p>
                        </div>
                    ) : (
                        <label className="w-full flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-2xl p-12 hover:border-indigo-500 hover:bg-indigo-50/50 transition-all cursor-pointer group dark:border-slate-800 dark:hover:border-indigo-500/50 dark:hover:bg-indigo-900/10">
                            <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform dark:bg-slate-800">
                                <FileJson className="w-8 h-8 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                            </div>
                            <span className="text-sm font-bold text-slate-600 dark:text-slate-300">Klik untuk upload file JSON</span>
                            <span className="text-xs text-slate-400 mt-1">Hanya mendukung format .json</span>
                            <input 
                                type="file" 
                                accept=".json" 
                                className="hidden" 
                                onChange={handleFileChange}
                            />
                        </label>
                    )}

                    <div className="w-full p-4 bg-blue-50 border border-blue-100 rounded-xl flex gap-3 dark:bg-blue-900/20 dark:border-blue-800">
                        <AlertTriangle className="w-5 h-5 text-blue-600 shrink-0" />
                        <p className="text-xs text-blue-700 leading-relaxed dark:text-blue-400">
                            <strong>Informasi:</strong> Import akan membuat protocol baru dengan nama yang sama ditambah label "(Imported)". Semua item, sub-task, dan ketergantungan akan dipertahankan.
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-end dark:border-slate-800 dark:bg-slate-900/50">
                    <button 
                        onClick={onClose} 
                        disabled={isImporting}
                        className="px-5 py-2 text-sm font-bold text-slate-600 hover:text-slate-800 transition-colors dark:text-slate-400 dark:hover:text-slate-200"
                    >
                        Tutup
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}
