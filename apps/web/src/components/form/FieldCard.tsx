import { type FormField } from '@/types/form';
import { type Dictionary } from '@/i18n/dictionaries';
import { FieldOptions } from './FieldOptions';

interface FieldCardProps {
    field: FormField & { _id: string };
    index: number;
    allFields: (FormField & { _id: string })[];
    dict: Dictionary['formBuilder'];
    updateField: (index: number, key: keyof FormField, value: unknown) => void;
    removeField: (index: number) => void;
}

export function FieldCard({ field, index, allFields, dict, updateField, removeField }: FieldCardProps) {
    return (
        <div className="p-5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm group hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors relative">
            {/* Controlled Field Indicator */}
            {field.visibility && (
                <div className="absolute -top-3 left-4 px-3 py-1 bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 text-[10px] font-bold uppercase tracking-wider rounded-full border border-amber-200 dark:border-amber-700 flex items-center gap-1.5 z-10">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"></path></svg>
                    Hidden unless &quot;{allFields.find(f => f.key === field.visibility?.fieldKey)?.label || field.visibility.fieldKey}&quot; is &quot;{field.visibility.value}&quot;
                </div>
            )}

            <div className="flex gap-4 items-start">
                <div className="flex-1 space-y-4">
                    {/* Top Row: Label, Key, Type */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                        <div className="md:col-span-6">
                            <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 block">{dict.label}</label>
                            <input
                                defaultValue={field.label}
                                onBlur={(e) => updateField(index, 'label', e.target.value)}
                                placeholder={dict.placeholders.label}
                                className="w-full text-sm rounded-md border-slate-200 py-2 px-3 bg-slate-50 dark:bg-slate-900 dark:border-slate-700 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                            />
                        </div>
                        <div className="md:col-span-3">
                            <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 block">{dict.type}</label>
                            <select
                                defaultValue={field.type}
                                onChange={(e) => updateField(index, 'type', e.target.value)}
                                className="w-full text-sm rounded-md border-slate-200 py-2 px-3 bg-slate-50 dark:bg-slate-900 dark:border-slate-700 focus:bg-white outline-none cursor-pointer"
                            >
                                <option value="text">{dict.types.text}</option>
                                <option value="number">{dict.types.number}</option>
                                <option value="select">{dict.types.select}</option>
                                <option value="date">{dict.types.date}</option>
                                <option value="checkbox-group">{dict.types.checkboxGroup}</option>
                            </select>
                        </div>
                        <div className="md:col-span-3">
                            <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 block">{dict.key}</label>
                            <input
                                defaultValue={field.key}
                                onBlur={(e) => updateField(index, 'key', e.target.value)}
                                placeholder={dict.placeholders.key}
                                className="w-full text-sm rounded-md border-slate-200 py-2 px-3 font-mono text-xs bg-slate-50 dark:bg-slate-900 dark:border-slate-700 text-slate-500 outline-none"
                            />
                        </div>
                    </div>

                    <FieldOptions
                        field={field}
                        index={index}
                        allFields={allFields}
                        updateField={updateField}
                    />

                    {/* Footer: Required Toggle */}
                    <div className="flex items-center gap-4 pt-1">
                        <label className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400 cursor-pointer select-none">
                            <div className={`w-8 h-4 rounded-full transition-colors relative ${field.required ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-700'}`}>
                                <input
                                    type="checkbox"
                                    checked={field.required}
                                    onChange={(e) => updateField(index, 'required', e.target.checked)}
                                    className="sr-only"
                                />
                                <div className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full shadow-sm transition-transform ${field.required ? 'translate-x-4' : 'translate-x-0'}`} />
                            </div>
                            Required
                        </label>
                    </div>
                </div>

                {/* Delete Field Button */}
                <button
                    onClick={() => removeField(index)}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors border border-transparent hover:border-red-100 dark:hover:border-red-900"
                    title={dict.remove}
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                </button>
            </div>
        </div>
    );
}
