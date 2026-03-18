'use server';

import { prisma } from '@/lib/db';
import { requireAdmin } from '@/actions/auth';

export async function migrateAttachmentsToFiles() {
    const user = await requireAdmin(); // Strict for migration

    // Find items with legacy attachments but NO file records linked (to avoid duplication if re-run)
    const items = await prisma.projectItem.findMany({
        where: {
            attachmentUrl: { not: null },
            files: { none: {} }
        },
        include: { project: true }
    });

    console.log(`Found ${items.length} items to migrate.`);

    let count = 0;

    for (const item of items) {
        if (!item.attachmentUrl) continue;

        const url = item.attachmentUrl;
        const name = url.split('/').pop() || 'Untitled Attachment';

        // Guess owner: Assignee > Project Owner > Current Admin
        const uploaderId = item.assignedToId || item.project.createdById || user.id;

        try {
            await prisma.file.create({
                data: {
                    name: decodeURIComponent(name),
                    url: url,
                    size: 0, // Unknown
                    type: 'application/octet-stream', // Unknown
                    projectId: item.projectId,
                    taskId: item.id,
                    uploadedById: uploaderId
                }
            });
            count++;
        } catch (e) {
            console.error(`Failed to migrate item ${item.id}:`, e);
        }
    }

    console.log(`Successfully migrated ${count} files.`);
    return { count, total: items.length };
}
