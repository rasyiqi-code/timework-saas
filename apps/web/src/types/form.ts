export interface FormField {
    key: string;
    label: string;
    type: 'text' | 'number' | 'select' | 'date' | 'checkbox-group';
    placeholder?: string;
    options?: string[]; // For select inputs
    required?: boolean;
    visibility?: {
        fieldKey: string;
        operator: 'eq' | 'neq' | 'in';
        value: string | string[];
    };
}
