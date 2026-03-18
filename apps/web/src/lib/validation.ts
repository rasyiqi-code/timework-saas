import { z } from 'zod';

export const ProtocolItemTypeEnum = z.enum(['TASK', 'NOTE', 'GROUP']);

export const ProtocolSchema = z.object({
    name: z.string().min(1, "Name is required").max(100),
    description: z.string().optional(),
});

export const ProtocolItemSchema = z.object({
    title: z.string().min(1, "Title is required").max(1000),
    duration: z.coerce.number().min(0).default(1),
    defaultAssigneeId: z.string().optional().nullable(),
    defaultAssigneeIds: z.array(z.string()).optional(),
    type: ProtocolItemTypeEnum.optional().default('TASK'),
    description: z.string().optional().nullable(),
    parentId: z.string().optional().nullable(),
    requireAttachment: z.boolean().optional().default(false),
    fileAccess: z.enum(['PUBLIC', 'RESTRICTED']).optional().default('PUBLIC'),
    allowedFileViewerIds: z.array(z.string()).optional(),
    color: z.string().optional().nullable(),
    metadata: z.any().optional(),
});

export const ProjectSchema = z.object({
    title: z.string().min(1, "Title is required").max(1000),
    description: z.string().optional().nullable(),
});

export const FormFieldSchema = z.object({
    key: z.string().min(1),
    label: z.string().min(1),
    type: z.enum(['text', 'number', 'date', 'select', 'textarea', 'checkbox-group']),
    required: z.boolean().default(false),
    options: z.array(z.string()).optional(), // For select type
});

export const FormTemplateSchema = z.object({
    fields: z.array(FormFieldSchema)
});
