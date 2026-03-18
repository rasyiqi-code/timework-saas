'use server';

import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';

import { getCurrentUser } from '@/actions/auth';

/**
 * Get all users for assignment dropdown (Scoped to Organization)
 */
export async function getUsers() {
    const currentUser = await getCurrentUser();
    if (!currentUser || !currentUser.organizationId) return [];

    return await prisma.user.findMany({
        where: {
            memberships: {
                some: {
                    organizationId: currentUser.organizationId
                }
            }
        },
        orderBy: { name: 'asc' }
    });
}

// Deprecated: Use toggleItemAssignee
export async function assignUserToItem(itemId: string, userId: string) {
    if (!userId) return; // Ignore unassignment in legacy mode, or handle differently
    await toggleItemAssignee(itemId, userId);
}

/**
 * Toggle a user's assignment to a Project Item
 */
export async function toggleItemAssignee(itemId: string, userId: string) {
    const item = await prisma.projectItem.findUnique({
        where: { id: itemId },
        include: { assignees: true }
    });

    if (!item) return;

    const isAssigned = item.assignees.some(u => u.id === userId);

    // Toggle Logic
    const updatedItem = await prisma.projectItem.update({
        where: { id: itemId },
        data: {
            assignees: isAssigned
                ? { disconnect: { id: userId } }
                : { connect: { id: userId } },
            // Sync legacy field: If adding -> set as assignedToId (if empty? or override?). 
            // If removing -> if was assignedToId, set to null?
            // Strategy: Always set assignedToId to the LAST added user, or null if no assignees.
            // Simplified: We rely on assignees for new logic. We just sync assignedToId to *someone* or null.
        },
        include: { assignees: true, project: true }
    });

    // Sync Legacy Field (One-way sync for backward comp)
    const newLegacyId = updatedItem.assignees.length > 0 ? updatedItem.assignees[0].id : null;
    if (updatedItem.assignedToId !== newLegacyId) {
        await prisma.projectItem.update({
            where: { id: itemId },
            data: { assignedToId: newLegacyId }
        });
    }

    if (updatedItem.project) {
        // Log & Emit
        // const { logProjectAction } = await import('./audit');
        // await logProjectAction(updatedItem.projectId, 'ASSIGNMENT_CHANGE', `Assignment updated`);

        const { emitProjectUpdate } = await import('@/lib/socket-server');
        await emitProjectUpdate(updatedItem.projectId, "Assignment Updated");
    }

    revalidatePath(`/projects/${updatedItem.projectId}`);
}

/**
 * Fetch tasks assigned to a specific user (or 'demo-user' if not provided)
 * In a real app, we would get the session user ID here.
 */
export async function getMyTasks(userId: string) {
    return await prisma.projectItem.findMany({
        where: {
            assignedToId: userId,
            status: { not: 'DONE' } // Only show active tasks
        },
        include: {
            project: {
                select: { title: true }
            }
        },
        orderBy: {
            updatedAt: 'desc'
        }
    });
}
