import { type FormField } from '@/types/form';
import { toast } from 'sonner';

interface FieldOptionsProps {
    field: FormField;
    index: number;
    allFields: (FormField & { _id: string })[];
    updateField: (index: number, key: keyof FormField, value: unknown) => void;
}

export function FieldOptions({ field, index, allFields, updateField }: FieldOptionsProps) {
    if (field.type !== 'select' && field.type !== 'checkbox-group') return null;

    return (
        <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 border border-slate-100 dark:border-slate-800">
            <div className="flex justify-between items-center mb-3">
                <label className="text-[10px] uppercase font-bold text-slate-500 block">Options & Logic</label>
            </div>

            <div className="space-y-2">
                {(field.options || []).map((option, optIndex) => (
                    <div key={optIndex} className="flex items-start gap-3 group/option">
                        <div className="mt-1.5 text-slate-300">
                            {field.type === 'select' ? '○' : '☐'}
                        </div>

                        {/* Option Label Input */}
                        <div className="flex-1">
                            <input
                                defaultValue={option}
                                onBlur={(e) => {
                                    const newOptions = [...(field.options || [])];
                                    newOptions[optIndex] = e.target.value;
                                    updateField(index, 'options', newOptions);
                                }}
                                className="w-full text-sm bg-transparent border-b border-transparent hover:border-slate-300 focus:border-indigo-500 outline-none py-1 text-slate-700 dark:text-slate-300 placeholder:text-slate-400"
                                placeholder={`Option ${optIndex + 1}`}
                            />
                        </div>

                        {/* Logic / Branching UI */}
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] text-slate-400 font-medium">Then show:</span>
                            {(() => {
                                const availableFields = allFields
                                    .filter(f => f.key !== field.key) // Cannot depend on self
                                    .filter(f => !f.visibility || (f.visibility.fieldKey === field.key && f.visibility.value === option)); // Show available or already linked

                                return (
                                    <select
                                        className="text-xs max-w-[150px] rounded-md border-slate-200 py-1 px-2 bg-white dark:bg-slate-800 dark:border-slate-700 outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                        onChange={(e) => {
                                            // Add logic: dependent field gets visibility rule
                                            const targetKey = e.target.value;
                                            if (!targetKey) return;

                                            const targetIndex = allFields.findIndex(f => f.key === targetKey);
                                            if (targetIndex !== -1) {
                                                updateField(targetIndex, 'visibility', {
                                                    fieldKey: field.key,
                                                    operator: 'eq',
                                                    value: option
                                                });
                                                toast.success(`Linked "${allFields[targetIndex].label}" to "${option}"`);
                                            }
                                        }}
                                        value="" // Always reset to allow selecting multiple? No, UI limitations. Simple mode: 1-to-1 or just "Add" action.
                                        disabled={availableFields.length === 0}
                                        title={availableFields.length === 0 ? "No other fields available to show" : "Select a field to show when this option is chosen"}
                                    >
                                        <option value="">{availableFields.length === 0 ? 'No fields avail' : '-- Select field --'}</option>
                                        {availableFields.map(f => (
                                            <option key={f.key} value={f.key}>
                                                {f.visibility?.fieldKey === field.key && f.visibility.value === option ? '✓ ' : ''}{f.label}
                                            </option>
                                        ))}
                                    </select>
                                );
                            })()}

                            {/* Delete Option */}
                            <button
                                onClick={() => {
                                    const newOptions = [...(field.options || [])];
                                    newOptions.splice(optIndex, 1);
                                    updateField(index, 'options', newOptions);
                                }}
                                className="text-slate-300 hover:text-red-500 p-1 opacity-0 group-hover/option:opacity-100 transition-opacity"
                            >
                                ✕
                            </button>
                        </div>
                    </div>
                ))}

                {/* Add Option Button */}
                <div className="flex items-center gap-1 mt-2">
                    <button
                        onClick={() => updateField(index, 'options', [...(field.options || []), `Option ${(field.options?.length || 0) + 1}`])}
                        className="flex items-center gap-2 text-xs text-slate-400 hover:text-indigo-600 font-medium px-1 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 w-fit transition-colors"
                    >
                        <span>+ Add Option</span>
                    </button>

                    {!field.options?.includes('Custom') && (
                        <>
                            <span className="text-xs text-slate-400">or</span>
                            <button
                                onClick={() => updateField(index, 'options', [...(field.options || []), 'Custom'])}
                                className="text-xs text-indigo-500 hover:text-indigo-700 font-bold hover:underline px-1 py-1"
                            >
                                add &quot;Other&quot;
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Visualization of Linked Fields (Summary) */}
            <div className="mt-4 flex flex-wrap gap-2 text-[10px]">
                {allFields.filter(f => f.visibility?.fieldKey === field.key).map(f => (
                    <div key={f.key} className="px-2 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 rounded border border-indigo-100 dark:border-indigo-800 flex items-center gap-2">
                        <span>When <b>{f.visibility?.value}</b> → Show <b>{f.label}</b></span>
                        <button
                            onClick={() => {
                                const fIndex = allFields.findIndex(target => target.key === f.key);
                                updateField(fIndex, 'visibility', undefined);
                            }}
                            className="hover:text-red-500"
                        >✕</button>
                    </div>
                ))}
            </div>
        </div>
    );
}
