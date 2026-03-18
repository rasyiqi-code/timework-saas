'use server';

import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/actions/auth';
import type { ProtocolItemType, Prisma } from '@repo/database';

export type NoteItem = {
    id: string;
    title: string;
    description: string | null;
    type: ProtocolItemType;
    updatedAt: Date;
    project: {
        id: string;
        title: string;
        status: string;
    };
    assignedTo: {
        name: string | null;
    } | null;
};

export async function getAllNotes(): Promise<NoteItem[]> {
    const user = await getCurrentUser();
    if (!user || !user.organizationId) {
        return [];
    }

    const isAdmin = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';

    // Build the query where clause safely
    const where: Prisma.ProjectItemWhereInput = {
        project: {
            organizationId: user.organizationId,
            deletedAt: null // Only active projects
        },
        OR: [
            { type: 'NOTE' },
            {
                type: 'TASK',
                description: { not: null }
            }
        ]
    };

    if (!isAdmin) {
        where.AND = [
            {
                OR: [
                    { fileAccess: 'PUBLIC' },
                    {
                        fileAccess: 'RESTRICTED',
                        OR: [
                            { assignedToId: user.id },
                            { assignees: { some: { id: user.id } } },
                            { allowedFileViewers: { some: { id: user.id } } }
                        ]
                    }
                ]
            }
        ];
    }

    const items = await prisma.projectItem.findMany({
        where,
        select: {
            id: true,
            title: true,
            description: true,
            type: true,
            updatedAt: true,
            project: {
                select: {
                    id: true,
                    title: true,
                    status: true
                }
            },
            assignedTo: {
                select: {
                    name: true
                }
            }
        },
        orderBy: {
            updatedAt: 'desc'
        }
    }) as unknown as NoteItem[];

    // Filter out items with empty descriptions
    return items.filter(item => {
        const hasDescription = item.description && item.description.trim().length > 0;
        return hasDescription;
    });
}
