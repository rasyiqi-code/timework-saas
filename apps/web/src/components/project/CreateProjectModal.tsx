'use client';

import { createProjectFromProtocol } from '@/actions/project';
import { type Protocol } from '@repo/database';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { type Dictionary } from '@/i18n/dictionaries';
import { type FormField } from '@/types/form';

export function CreateProjectModal({ protocols, dict }: { protocols: Protocol[], dict: Dictionary }) {
    const [isOpen, setIsOpen] = useState(false);
    const router = useRouter();

    // Init state for Dynamic Logic
    const [selectedProtocolId, setSelectedProtocolId] = useState<string>('');
    const [formValues, setFormValues] = useState<Record<string, string | string[]>>({});

    // Derive fields from selected protocol
    const activeProtocol = protocols.find(p => p.id === selectedProtocolId);
    const activeFields = (activeProtocol?.formFields as unknown as FormField[]) || [];

    const handleChange = (key: string, value: string | string[]) => {
        const newValues = { ...formValues, [key]: value };
        setFormValues(newValues);

        // Auto-Generate Title Logic
        const pattern = activeProtocol?.titleFormat || '{author} - {bookTitle}';
        const tokens = pattern.match(/\{(\w+)\}/g) || [];

        if (tokens.length > 0) {
            let newTitle = pattern;
            let allTokensFilled = true;

            for (const token of tokens) {
                const tokenKey = token.replace(/[\{\}]/g, '');
                const tokenValue = newValues[tokenKey] as string;

                if (tokenValue && tokenValue.trim()) {
                    newTitle = newTitle.replace(token, tokenValue);
                } else {
                    allTokensFilled = false;
                    break;
                }
            }

            if (allTokensFilled) {
                setFormValues(prev => ({
                    ...prev,
                    title: newTitle
                }));
            }
        }
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="px-6 py-3 bg-slate-900 text-white rounded-xl hover:bg-black font-bold shadow-lg shadow-slate-900/20 hover:shadow-xl hover:-translate-y-0.5 transition-all text-sm flex items-center gap-2"
            >
                <span>＋</span> {dict.project.newProject}
            </button>
        );
    }

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl p-6 w-full max-w-3xl border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto scrollbar-hover">
                <div className="flex justify-between items-center mb-5 pb-4 border-b border-slate-100 dark:border-slate-800">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">{dict.project.createTitle}</h3>
                    <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                        ✕
                    </button>
                </div>

                <form action={async (formData) => {
                    const title = formData.get('title') as string;
                    const protocolId = formData.get('protocolId') as string;

                    // Collect Dynamic Metadata using the ACTIVE fields context
                    // Note: In a real scenario, we should re-fetch to validate on server, but for now we trust the client state structure matches
                    const metadata: Record<string, unknown> = {};
                    activeFields.forEach(field => {
                        if (field.type === 'checkbox-group') {
                            const values = formData.getAll(field.key);
                            if (values.length > 0) metadata[field.key] = values;
                        } else {
                            let value = formData.get(field.key);
                            // Custom Input Logic
                            if (field.type === 'select' && value === 'Custom') {
                                const customValue = formData.get(`${field.key}_custom`);
                                if (customValue) value = customValue;
                            }
                            if (value) metadata[field.key] = value;
                        }
                    });

                    await createProjectFromProtocol(protocolId, title, metadata);
                    setIsOpen(false);
                    router.refresh();
                }} className="grid grid-cols-1 md:grid-cols-2 gap-4">

                    {/* 1. Protocol Selection (First Step) */}
                    <div className="col-span-1 md:col-span-2">
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">{dict.project.protocolLabel}</label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {protocols.map(protocol => (
                                <label key={protocol.id} className="cursor-pointer group relative">
                                    <input
                                        type="radio"
                                        name="protocolId"
                                        value={protocol.id}
                                        required
                                        className="peer sr-only"
                                        checked={selectedProtocolId === protocol.id}
                                        onChange={(e) => {
                                            setSelectedProtocolId(e.target.value);
                                            setFormValues({}); // Reset form values on protocol switch
                                        }}
                                    />
                                    <div className="p-3 rounded-lg border border-slate-200 bg-white hover:border-[#cd1717] hover:shadow-sm transition-all peer-checked:border-[#cd1717] peer-checked:bg-red-50 peer-checked:text-[#cd1717] dark:bg-slate-950 dark:border-slate-800 dark:hover:border-[#cd1717] dark:peer-checked:bg-red-900/20 dark:peer-checked:text-red-100">
                                        <div className="text-sm font-bold mb-0.5">{protocol.name}</div>
                                        <div className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">{protocol.description}</div>
                                        <div className="absolute top-3 right-3 opacity-0 peer-checked:opacity-100 text-[#cd1717] dark:text-red-400">
                                            ✔
                                        </div>
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* 2. Project Name (Auto-Generated if configured) */}
                    {/* Only show Manual Input if Protocol is selected AND no Title Format is defined */}
                    {(!activeProtocol || activeProtocol.titleFormat) ? (
                        <input type="hidden" name="title" value={formValues.title as string || ''} />
                    ) : (
                        <div className="col-span-1 md:col-span-2">
                            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">{dict.project.nameLabel}</label>
                            <input
                                name="title"
                                required
                                value={formValues.title as string || ''}
                                onChange={(e) => handleChange('title', e.target.value)}
                                className="w-full rounded-lg border border-slate-300 bg-white text-sm text-slate-900 focus:border-[#cd1717] focus:ring-1 focus:ring-[#cd1717] outline-none transition-all py-2 px-3 dark:bg-slate-950 dark:border-slate-700 dark:text-slate-100 dark:placeholder-slate-500"
                                placeholder="e.g. My New Book Project"
                            />
                        </div>
                    )}

                    {/* 3. Dynamic Fields based on Selection */}
                    {activeFields.length > 0 && (
                        <div className="col-span-1 md:col-span-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                            <div className="mb-4">
                                <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">Project Details</h4>
                                <p className="text-xs text-slate-500">Additional information required by {activeProtocol?.name}.</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {activeFields.map(field => {
                                    // Check Visibility
                                    if (field.visibility) {
                                        const currentVal = formValues[field.visibility.fieldKey];
                                        const { operator, value } = field.visibility;

                                        let isVisible = false;
                                        if (operator === 'eq') isVisible = currentVal === value;
                                        else if (operator === 'neq') isVisible = currentVal !== value;

                                        // Handle simple dropdown match for visibility (Smart Dropdown feature consistency)
                                        // The comparison is basic string match

                                        if (!isVisible) return null;
                                    }

                                    return (
                                        <div key={field.key} className="col-span-1">
                                            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">{field.label}</label>

                                            {field.type === 'select' ? (
                                                <>
                                                    <select
                                                        name={field.key}
                                                        required={field.required}
                                                        value={formValues[field.key] || ''}
                                                        onChange={(e) => handleChange(field.key, e.target.value)}
                                                        className="w-full rounded-lg border border-slate-300 bg-white text-sm text-slate-900 focus:border-[#cd1717] focus:ring-1 focus:ring-[#cd1717] outline-none transition-all py-2 px-3 cursor-pointer dark:bg-slate-950 dark:border-slate-700 dark:text-slate-100"
                                                    >
                                                        <option value="" disabled>{dict.common.select} {field.label}</option>
                                                        {field.options?.map(opt => (
                                                            <option key={opt} value={opt}>{opt}</option>
                                                        ))}
                                                    </select>
                                                    {/* Custom Input Render */}
                                                    {formValues[field.key] === 'Custom' && (
                                                        <div className="mt-2 animate-in fade-in slide-in-from-top-1 duration-200">
                                                            <input
                                                                name={`${field.key}_custom`}
                                                                required={field.required}
                                                                placeholder={`Enter custom ${field.label.toLowerCase()}...`}
                                                                className="w-full rounded-lg border border-slate-300 bg-slate-50 text-sm text-slate-900 focus:border-[#cd1717] focus:ring-1 focus:ring-[#cd1717] outline-none transition-all py-2 px-3 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100"
                                                            />
                                                        </div>
                                                    )}
                                                </>
                                            ) : field.type === 'checkbox-group' ? (
                                                <div className="space-y-2 p-3 border border-slate-200 rounded-lg dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                                                    {field.options?.map(opt => (
                                                        <label key={opt} className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
                                                            <input
                                                                type="checkbox"
                                                                name={field.key}
                                                                value={opt}
                                                                checked={((formValues[field.key] as string[]) || []).includes(opt)}
                                                                onChange={(e) => {
                                                                    const current = (formValues[field.key] as string[]) || [];
                                                                    const newVal = e.target.checked
                                                                        ? [...current, opt]
                                                                        : current.filter(v => v !== opt);
                                                                    handleChange(field.key, newVal);
                                                                }}
                                                                className="rounded border-slate-300 text-[#cd1717] focus:ring-[#cd1717]"
                                                            />
                                                            {opt}
                                                        </label>
                                                    ))}
                                                </div>
                                            ) : (
                                                <input
                                                    name={field.key}
                                                    type={field.type}
                                                    required={field.required}
                                                    placeholder={field.placeholder}
                                                    value={formValues[field.key] || ''}
                                                    onChange={(e) => handleChange(field.key, e.target.value)}
                                                    className="w-full rounded-lg border border-slate-300 bg-white text-sm text-slate-900 focus:border-[#cd1717] focus:ring-1 focus:ring-[#cd1717] outline-none transition-all py-2 px-3 dark:bg-slate-950 dark:border-slate-700 dark:text-slate-100 dark:placeholder-slate-500"
                                                />
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    <div className="col-span-1 md:col-span-2 flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-800 mt-2">
                        <button
                            type="button"
                            onClick={() => setIsOpen(false)}
                            className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-lg hover:bg-slate-200 transition-colors dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                        >
                            {dict.project.cancel}
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-4 py-2.5 bg-[#cd1717] text-white font-bold rounded-lg hover:bg-[#a50f0f] shadow-md hover:shadow-lg transition-all"
                        >
                            {dict.project.create}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}


