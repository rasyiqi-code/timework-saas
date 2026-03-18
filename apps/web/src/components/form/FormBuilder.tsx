'use client';
import { useState } from 'react';
import { type FormField } from '@/types/form';
import { updateProtocolForm } from '@/actions/protocol';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { type Dictionary } from '@/i18n/dictionaries';
import { FieldCard } from './FieldCard';

interface FormBuilderProps {
    protocolId: string;
    initialFields?: FormField[];
    initialTitleFormat?: string | null;
    dict: Dictionary['formBuilder'];
}

type EditableField = FormField & { _id: string };

export function FormBuilder({ protocolId, initialFields = [], initialTitleFormat, dict }: FormBuilderProps) {
    // Initialize with stable IDs
    const [fields, setFields] = useState<EditableField[]>(() =>
        (initialFields || []).map(f => ({ ...f, _id: Math.random().toString(36).substring(7) }))
    );
    const [titleFormat, setTitleFormat] = useState(initialTitleFormat || '{author} - {bookTitle}');
    const [isSaving, setIsSaving] = useState(false);
    const router = useRouter();

    const addField = () => {
        setFields([...fields, {
            key: `field_${Date.now()}`,
            label: 'New Field',
            type: 'text',
            required: false,
            _id: Math.random().toString(36).substring(7)
        }]);
    };

    const removeField = (index: number) => {
        const newFields = [...fields];
        newFields.splice(index, 1);
        setFields(newFields);
    };

    const updateField = (index: number, key: keyof FormField, value: unknown) => {
        setFields(prev => {
            const newFields = [...prev];
            newFields[index] = { ...newFields[index], [key]: value };
            return newFields;
        });
    };

    const handleSave = async () => {
        // Validation
        const emptyFields = fields.filter(f => !f.key.trim() || !f.label.trim());
        if (emptyFields.length > 0) {
            toast.error(dict.validation.empty);
            return;
        }

        setIsSaving(true);
        try {
            // Strip _id sebelum menyimpan ke backend
            const cleanFields = fields.map((field) => {
                const { _id: _unused, ...rest } = field;
                void _unused;
                return rest;
            });

            await updateProtocolForm(protocolId, cleanFields, titleFormat);
            toast.success(dict.validation.success);
            router.refresh();
        } catch (error) {
            console.error(error);
            toast.error(dict.validation.error);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                    <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">📋 Protocol Submission Form</h3>
                    <p className="text-xs text-slate-400">Define fields required when starting a project with this SOP.</p>
                </div>

                {/* Title Pattern Config */}
                <div className="mb-6 p-4 bg-slate-50 border border-slate-200 rounded-lg dark:bg-slate-900/50 dark:border-slate-800">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Project Title Pattern</label>
                    <div className="flex gap-2">
                        <input
                            value={titleFormat}
                            onChange={(e) => setTitleFormat(e.target.value)}
                            className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:bg-slate-900 dark:border-slate-700 dark:text-white"
                            placeholder="{author} - {bookTitle}"
                        />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">Use field keys like {'{author}'}, {'{bookTitle}'} to auto-generate project titles.</p>
                </div>

                <div className="space-y-4">
                    {fields.map((field, index) => (
                        <FieldCard
                            key={field._id}
                            field={field}
                            index={index}
                            allFields={fields}
                            dict={dict}
                            updateField={updateField}
                            removeField={removeField}
                        />
                    ))}
                </div>

                <div className="mt-6 flex gap-3">
                    <button
                        onClick={addField}
                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-sm transition-colors dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                    >
                        + {dict.addField}
                    </button>
                </div>
            </div>

            <div className="flex justify-end sticky bottom-6 z-20">
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg hover:bg-indigo-700 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isSaving ? dict.saving : dict.save}
                </button>
            </div>
        </div>
    );
}
