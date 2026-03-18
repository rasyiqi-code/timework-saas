'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { generateProtocolWithAI } from '@/actions/ai';
import { type AIProvider, type ProtocolGenerationData } from '@/lib/ai-schema';
import { createProtocolFromAI } from '@/actions/protocol';
import { Bot, Sparkles, Loader2, X, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export function AIGeneratorModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
    const [prompt, setPrompt] = useState('');
    const [provider, setProvider] = useState<AIProvider>('auto');
    const [modelId, setModelId] = useState<string>('auto');
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [generatedData, setGeneratedData] = useState<ProtocolGenerationData | null>(null);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    if (!isOpen || !mounted) return null;

    const handleGenerate = async () => {
        if (!prompt.trim()) {
            toast.error("Prompt tidak boleh kosong");
            return;
        }

        setIsGenerating(true);
        setError(null);
        setGeneratedData(null);

        try {
            const result = await generateProtocolWithAI(prompt, provider, modelId);
            if (result.success && result.data) {
                setGeneratedData(result.data as ProtocolGenerationData);
                toast.success("Protocol berhasil di-generate!");
            } else {
                setError(result.error || "Gagal menghasilkan protocol");
            }
        } catch (err: unknown) {
            setError((err as Error).message || "Terjadi kesalahan server");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSave = async () => {
        if (!generatedData) return;

        setIsSaving(true);
        try {
            const result = await createProtocolFromAI(generatedData);
            if (result.success) {
                toast.success("Protocol tersimpan ke database!");
                onClose();
                router.push(`/admin/protocols/${result.protocolId}`); // Navigate to the builder
            } else {
                toast.error("Gagal menyimpan protocol");
            }
        } catch (err: unknown) {
            toast.error((err as Error).message || "Gagal menyimpan protocol");
        } finally {
            setIsSaving(false);
        }
    };

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh] dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center dark:bg-indigo-900/30">
                            <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">AI Protocol Generator</h2>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Generate Standard Operating Procedures in seconds</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors dark:hover:bg-slate-800 dark:hover:text-slate-300">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto flex-1 custom-scrollbar space-y-6">
                    
                    {!generatedData ? (
                        <>
                            {/* Input Form */}
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5 dark:text-slate-300">Instruksi AI (Prompt)</label>
                                    <textarea 
                                        value={prompt}
                                        onChange={(e) => setPrompt(e.target.value)}
                                        placeholder="Contoh: Buatkan SOP untuk proses onboarding karyawan baru divisi Marketing, mulai dari setup akun sampai perkenalan tim..."
                                        className="w-full h-32 px-4 py-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:placeholder:text-slate-500"
                                    />
                                    <div className="flex justify-end mt-2">
                                        <button 
                                            onClick={() => {
                                                setShowAdvanced(!showAdvanced);
                                                if (showAdvanced) {
                                                    setProvider('auto');
                                                    setModelId('auto');
                                                } else {
                                                    setProvider('gemini');
                                                    setModelId('gemini-2.5-flash');
                                                }
                                            }}
                                            className="text-xs font-medium text-slate-500 hover:text-indigo-600 transition-colors dark:text-slate-400 dark:hover:text-indigo-400"
                                        >
                                            {showAdvanced ? 'Kembali ke Auto (Rekomendasi)' : 'Pilih Model AI Spesifik'}
                                        </button>
                                    </div>
                                </div>

                                {showAdvanced && (
                                    <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                                        <label className="block text-sm font-semibold text-slate-700 mb-2 dark:text-slate-300">Model Tersedia</label>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 max-h-56 overflow-y-auto custom-scrollbar p-1 pb-2">
                                            {[
                                                // Gemini (Google AI Studio)
                                                { provider: 'gemini', id: 'gemini-3.1-pro', name: 'Gemini 3.1 Pro', desc: 'Google (Akurasi Maksimal)' },
                                                { provider: 'gemini', id: 'gemini-3.1-flash-lite', name: 'Gemini 3.1 Flash Lite', desc: 'Google (Sangat Cepat)' },
                                                { provider: 'gemini', id: 'gemini-3-flash', name: 'Gemini 3 Flash', desc: 'Google (Keseimbangan)' },
                                                { provider: 'gemini', id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', desc: 'Google (Akurasi Tinggi)' },
                                                { provider: 'gemini', id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', desc: 'Google (Cepat & Ringan)' },
                                                
                                                // OpenRouter - Top Tiers
                                                { provider: 'openrouter', id: 'meta-llama/llama-3.3-70b-instruct:free', name: 'Llama 3.3 70B', desc: 'OpenRouter (Sangat Pintar)' },
                                                { provider: 'openrouter', id: 'nousresearch/hermes-3-llama-3.1-405b:free', name: 'Hermes 3 405B', desc: 'OpenRouter (Logika Kuat)' },
                                                { provider: 'openrouter', id: 'google/gemma-3-27b-it:free', name: 'Gemma 3 27B', desc: 'OpenRouter (Cepat & Akurat)' },
                                                
                                                // OpenRouter - Qwen & GPT OSS
                                                { provider: 'openrouter', id: 'qwen/qwen-3-next-80b-instruct:free', name: 'Qwen 3 Next 80B', desc: 'OpenRouter (High Reasoning)' },
                                                { provider: 'openrouter', id: 'qwen/qwen-3-coder-480b-instruct:free', name: 'Qwen 3 Coder 480B', desc: 'OpenRouter (JSON / Data)' },
                                                { provider: 'openrouter', id: 'openai/gpt-oss-120b:free', name: 'GPT OSS 120B', desc: 'OpenRouter (Premium)' },
                                                { provider: 'openrouter', id: 'openai/gpt-oss-20b:free', name: 'GPT OSS 20B', desc: 'OpenRouter (Fast Premium)' },
                                                
                                                // Groq Cloud
                                                { provider: 'groq', id: 'llama-4-scout', name: 'Llama 4 Scout', desc: 'Groq (Sangat Cepat & Pintar)' },
                                                { provider: 'groq', id: 'qwen-3-32b', name: 'Qwen 3 32B', desc: 'Groq (Reasoning Tinggi)' },
                                                { provider: 'groq', id: 'kimi-k2', name: 'Kimi K2', desc: 'Groq (Multilingual & Logic)' },
                                            ].map((model) => (
                                                <button
                                                    key={model.id + model.provider}
                                                    onClick={() => {
                                                        setProvider(model.provider as AIProvider);
                                                        setModelId(model.id);
                                                    }}
                                                    className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all hover:scale-[1.02] ${
                                                        modelId === model.id 
                                                            ? 'border-indigo-600 bg-indigo-50/50 ring-1 ring-indigo-600 dark:border-indigo-500 dark:bg-indigo-900/20 dark:ring-indigo-500 shadow-sm' 
                                                            : 'border-slate-200 hover:border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-800 dark:hover:border-slate-600 shadow-sm hover:shadow-md'
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                                                            model.provider === 'gemini' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400' :
                                                            model.provider === 'groq' ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400' :
                                                            'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400'
                                                        }`}>
                                                            {model.provider}
                                                        </span>
                                                    </div>
                                                    <span className={`text-sm font-bold truncate w-full ${modelId === model.id ? 'text-indigo-700 dark:text-indigo-400' : 'text-slate-700 dark:text-slate-300'}`}>
                                                        {model.name}
                                                    </span>
                                                    <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">{model.desc}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                

                                {error && (
                                    <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex gap-3 text-red-700 dark:bg-red-900/20 dark:border-red-900/50 dark:text-red-400">
                                        <AlertTriangle className="w-5 h-5 shrink-0" />
                                        <p className="text-sm">{error}</p>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <>
                            {/* Preview Screen */}
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="p-5 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-100 rounded-xl dark:border-indigo-900/30 dark:from-indigo-900/20 dark:to-purple-900/20">
                                    <h3 className="text-xl font-bold text-indigo-900 dark:text-indigo-300 mb-2">{generatedData.protocolName}</h3>
                                    <p className="text-sm text-indigo-700/80 dark:text-indigo-400/80">{generatedData.protocolDescription}</p>
                                </div>

                                <div>
                                    <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center justify-between dark:text-slate-200">
                                        <span>Generated Steps</span>
                                        <span className="text-xs font-medium px-2 py-1 bg-slate-100 text-slate-600 rounded-md dark:bg-slate-800 dark:text-slate-400">{generatedData.items.length} items</span>
                                    </h4>
                                    
                                    <div className="space-y-3">
                                        {generatedData.items.map((item, idx) => (
                                            <div key={item.id} className="p-4 rounded-xl border border-slate-200 bg-white shadow-sm flex gap-4 dark:bg-slate-800/50 dark:border-slate-700">
                                                <div 
                                                    className="w-1.5 rounded-full shrink-0" 
                                                    style={{ backgroundColor: item.color || '#6366f1' }}
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="text-xs font-bold text-slate-400">{(idx + 1).toString().padStart(2, '0')}</span>
                                                        <h5 className="text-sm font-bold text-slate-800 truncate dark:text-slate-200">{item.title}</h5>
                                                    </div>
                                                    <p className="text-xs text-slate-500 line-clamp-2 dark:text-slate-400 w-full mb-2">
                                                        {item.description || "Tidak ada deskripsi"}
                                                    </p>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                                                            {item.type}
                                                        </span>
                                                        {item.requireAttachment && (
                                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                                                                DOKUMEN WAJIB
                                                            </span>
                                                        )}
                                                        {item.dependencies && item.dependencies.length > 0 && (
                                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                                                                TERKUNCI
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3 dark:border-slate-800 dark:bg-slate-900/50">
                    <button 
                        onClick={onClose} 
                        disabled={isGenerating || isSaving}
                        className="px-5 py-2 text-sm font-bold text-slate-600 hover:text-slate-800 transition-colors dark:text-slate-400 dark:hover:text-slate-200"
                    >
                        Batal
                    </button>
                    
                    {!generatedData ? (
                        <button 
                            onClick={handleGenerate}
                            disabled={isGenerating || !prompt.trim()}
                            className="px-5 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm shadow-indigo-200 transition-all active:scale-95 disabled:opacity-50 disabled:shadow-none flex items-center gap-2 dark:bg-indigo-600 dark:hover:bg-indigo-500 dark:shadow-none"
                        >
                            {isGenerating ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span>Berpikir...</span>
                                </>
                            ) : (
                                <>
                                    <Bot className="w-4 h-4" />
                                    <span>Generate SOP</span>
                                </>
                            )}
                        </button>
                    ) : (
                        <button 
                            onClick={handleSave}
                            disabled={isSaving}
                            className="px-5 py-2 text-sm font-bold text-white bg-green-600 hover:bg-green-700 rounded-lg shadow-sm shadow-green-200 transition-all active:scale-95 disabled:opacity-50 disabled:shadow-none flex items-center gap-2 dark:bg-green-600 dark:hover:bg-green-500 dark:shadow-none"
                        >
                            {isSaving ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span>Menyimpan...</span>
                                </>
                            ) : (
                                <>
                                    <CheckCircle2 className="w-4 h-4" />
                                    <span>Simpan ke Database</span>
                                </>
                            )}
                        </button>
                    )}
                </div>

            </div>
        </div>,
        document.body
    );
}
