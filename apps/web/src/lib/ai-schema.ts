import { z } from 'zod';

export const protocolGenerationSchema = z.object({
  protocolName: z.string().describe('Suggested name for the protocol'),
  protocolDescription: z.string().describe('Suggested description for the protocol'),
  items: z.array(
    z.object({
      id: z.string().describe('A unique temporary ID for this item, e.g. "step-1"'),
      title: z.string().describe('Clear, actionable title, e.g. "Review Application"'),
      description: z.string().describe('Detailed instructions for this step'),
      type: z.enum(['TASK', 'NOTE', 'GROUP']).describe('Use TASK for actionable items, NOTE for information, GROUP to group sub-tasks'),
      requireAttachment: z.boolean().describe('True if this step requires the user to upload a file evidence'),
      color: z.string().describe('Hex color code, e.g. "#4f46e5", "#ef4444", "#10b981". Use distinct colors.'),
      dependencies: z.array(z.string()).describe('List of IDs of other items that must be completed BEFORE this item. Use the temporary IDs you created. Empty array if none.'),
      parentId: z.string().optional().describe('If this item is inside a GROUP, the ID of the parent GROUP item.')
    })
  ).describe('List of operational steps in chronological or logical order'),
  formFields: z.array(
    z.object({
      key: z.string().describe('CamelCase programmatic key, e.g. "employeeName", "startDate"'),
      label: z.string().describe('Human readable label for the field, e.g. "Nama Karyawan", "Tanggal Mulai"'),
      type: z.enum(['text', 'number', 'date', 'select', 'textarea', 'checkbox-group']).describe('Input type for this field'),
      required: z.boolean().describe('Whether this field is mandatory to create a project'),
      options: z.array(z.string()).optional().describe('If type is "select" or "checkbox-group", provide the list of options')
    })
  ).optional().describe('List of intake form fields required when starting a new project for this SOP'),
  titleFormat: z.string().optional().describe('A dynamic project title pattern using the generated form keys in curly braces (e.g., "{employeeName} Onboarding", "Audit - {departmentName}")')
});

export type ProtocolGenerationData = z.infer<typeof protocolGenerationSchema>;
export type AIProvider = 'gemini' | 'openrouter' | 'groq' | 'auto';
