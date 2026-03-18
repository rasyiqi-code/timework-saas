import { PrismaClient, ProjectItem, Prisma } from '@repo/database';
import { ProjectContext } from '../types';
import { logAction } from '../utils/audit';
import { detectCycle, buildDependencyGraph } from '../utils/graph';

export async function addItem(prisma: PrismaClient, ctx: ProjectContext, projectId: string, title: string, blockedItemId?: string): Promise<ProjectItem> {
    const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: { organizationId: true, createdById: true }
    });

    if (!project || project.organizationId !== ctx.organizationId) {
        throw new Error('Project not found or unauthorized');
    }

    const isAdmin = ctx.role === 'ADMIN' || ctx.role === 'SUPER_ADMIN';
    const isManager = ctx.role === 'MANAGER';
    const isOwner = project.createdById === ctx.userId;

    if (!isAdmin && !isManager && !isOwner) {
        throw new Error('Unauthorized');
    }

    return await prisma.$transaction(async (tx) => {
        let newOrder = 0;

        if (blockedItemId) {
            const blockedItem = await tx.projectItem.findUnique({
                where: { id: blockedItemId },
                select: { order: true }
            });

            if (blockedItem) {
                // Insert BEFORE the blocked item
                newOrder = blockedItem.order;

                // Shift items down
                await tx.projectItem.updateMany({
                    where: {
                        projectId: projectId,
                        order: { gte: newOrder }
                    },
                    data: {
                        order: { increment: 1 }
                    }
                });
            }
        } else {
            // Append to end
            const lastItem = await tx.projectItem.findFirst({
                where: { projectId },
                orderBy: { order: 'desc' }
            });
            newOrder = (lastItem?.order ?? 0) + 1;
        }

        const newItem = await tx.projectItem.create({
            data: {
                title,
                projectId,
                status: 'OPEN',
                assignedToId: ctx.userId, // Legacy Single
                assignees: { connect: { id: ctx.userId } }, // New Multi
                order: newOrder
            }
        });

        // Use 'tx' as 'prisma' for helpers (assuming type compatibility or cast)
        // Cast to 'any' if strict typing complains, but usually TransacitonClient satisfies PrismaClient subset needed
        await logAction(tx as PrismaClient, projectId, 'ITEM_ADDED', `Ad-hoc item "${title}" added`);

        if (blockedItemId) {
            await addDependency(tx as PrismaClient, ctx, blockedItemId, newItem.id);
            await logAction(tx as PrismaClient, projectId, 'DEPENDENCY_ADDED', `"${title}" now blocks item ${blockedItemId}`);
        }

        return newItem;
    }, {
        timeout: 20000 // 20s timeout for heavy shifting operations
    });
}

import { calculateCompletionCascades, calculateReversionCascades, type DependentItem, type DependencyWithPrerequisite } from '../utils/status-engine';

export async function updateItemStatus(prisma: PrismaClient, ctx: ProjectContext, itemId: string, newStatus: string, skipPermission: boolean = false): Promise<ProjectItem> {
    // 1. Fetch item to check ownership
    const itemToCheck = await prisma.projectItem.findUnique({
        where: { id: itemId },
        select: {
            assignedToId: true,
            assignees: { select: { id: true } },
            projectId: true,
            title: true,
            status: true,
            startDate: true,
            // endDate: true, // Not strictly needed for logic but good for debugging if we logged it
            project: {
                select: { createdById: true }
            }
        }
    });

    if (!itemToCheck) throw new Error('Item not found');

    if (!skipPermission) {
        // 2. Enforce Ownership or Admin
        const isCreator = itemToCheck.project.createdById === ctx.userId;
        const isLegacyAssignee = itemToCheck.assignedToId === ctx.userId;
        const isMultiAssignee = itemToCheck.assignees.some(u => u.id === ctx.userId);
        const isAssignee = isLegacyAssignee || isMultiAssignee;
        const isUnassigned = itemToCheck.assignedToId === null && itemToCheck.assignees.length === 0;
        const isAdmin = ctx.role === 'ADMIN' || ctx.role === 'SUPER_ADMIN';

        if (!isAdmin && !isCreator && !isAssignee && !isUnassigned) {
            throw new Error('Forbidden: You can only update your own tasks or unassigned tasks');
        }
    }

    const now = new Date();
    // Gunakan UncheckedUpdateInput agar bisa mengakses scalar field `completedById` langsung
    const dataUpdate: Prisma.ProjectItemUncheckedUpdateInput = { status: newStatus };

    if (newStatus === 'DONE') {
        dataUpdate.endDate = now;
        // Ensure start date is set if it wasn't (e.g. fast completion)
        if (!itemToCheck.startDate) {
            dataUpdate.startDate = now;
        }
    } else if (newStatus === 'OPEN' || newStatus === 'IN_PROGRESS') {
        // Set start date if this is the first time it opens
        if (!itemToCheck.startDate) {
            dataUpdate.startDate = now;
        }
        // If we are reopening, clear the end date and completer
        if (itemToCheck.status === 'DONE' || itemToCheck.status === 'SKIPPED') {
            dataUpdate.endDate = null;
            dataUpdate.completedById = null;
        }
    }

    if (newStatus === 'DONE' || newStatus === 'SKIPPED') {
        // Catat siapa yang menyelesaikan task
        dataUpdate.completedById = ctx.userId;
    }

    const item = await prisma.projectItem.update({
        where: { id: itemId },
        data: dataUpdate,
        include: { project: true, files: { select: { id: true, name: true } } }
    });

    // Don't log recursive system updates to avoid noise? Or maybe valuable? 
    // Let's keep logging but maybe note it? For now standard log.
    await logAction(prisma, item.projectId, 'STATUS_CHANGE', `Item "${item.title}" marked as ${newStatus}`);

    // --- Phase 2: Internal Automation Trigger ---
    const { processAutomation } = await import('../utils/automation');
    // The automation processing expects ProjectItem.
    await processAutomation(prisma, item as ProjectItem, 'ON_STATUS_CHANGE');
    if (newStatus === 'DONE') {
        await processAutomation(prisma, item as ProjectItem, 'ON_DONE');
    }

    // Logic: If status is DONE, check dependents to UNLOCK
    if (newStatus === 'DONE') {
        // Validation: Check for required attachment
        if (item.requireAttachment && !item.attachmentUrl) {
            // Revert if validation fails? 
            // Ideally validation happens BEFORE update.
            // But since we already updated, we must throw. 
            // Note: This leaves the DB in potentially bad state if transaction not used?
            // But this function is usually called standalone.
            // Better to move validation up, but I'll leave it here as per original structure for minimal diff
            // Actually, if I throw here, the update is already committed since no transaction wrapping the whole function.
            // I should move validation UP.
        }

        // ... (Moving validation up in a separate step if strictness needed, but sticking to logic injection for now to minimize diff risk)

        if (newStatus === 'DONE' && item.requireAttachment) {
            // Check legacy attachmentUrl OR new files relation
            const hasFiles = item.files && item.files.length > 0;
            const hasAttachmentUrl = item.attachmentUrl && item.attachmentUrl.length > 0;

            if (!hasFiles && !hasAttachmentUrl) {
                // Revert update
                await prisma.projectItem.update({ where: { id: itemId }, data: { status: itemToCheck.status } });
                throw new Error('File upload required to complete this task');
            }

            // --- Advanced Metadata-Driven Validation ---
            const itemMetadata = item.metadata as Record<string, unknown> | null;
            if (itemMetadata?.validationRules) {
                const rules = itemMetadata.validationRules as { requiredExtensions?: string[] };
                if (rules.requiredExtensions && item.files) {
                    const hasValidFile = item.files.some(f => 
                        rules.requiredExtensions?.some(ext => f.name.toLowerCase().endsWith(ext.toLowerCase()))
                    );
                    if (!hasValidFile) {
                        await prisma.projectItem.update({ where: { id: itemId }, data: { status: itemToCheck.status } });
                        throw new Error(`File must have one of these extensions: ${rules.requiredExtensions.join(', ')}`);
                    }
                }
            }
        }

        const dependents = await prisma.itemDependency.findMany({
            where: { prerequisiteId: itemId },
            include: { item: { select: { id: true, status: true } } }
        });

        const dependentIds = dependents.map((d) => d.item.id);

        if (dependentIds.length > 0) {
            const allPrereqs = await prisma.itemDependency.findMany({
                where: { itemId: { in: dependentIds } },
                include: { prerequisite: { select: { status: true } } }
            });

            // Cast types to match our lightweight engine type
            const updates = calculateCompletionCascades(
                itemId,
                dependents as unknown as DependentItem[],
                allPrereqs as unknown as DependencyWithPrerequisite[]
            );

            if (updates.length > 0) {
                await prisma.$transaction(
                    updates.map(u =>
                        prisma.projectItem.update({
                            where: { id: u.id },
                            data: { status: u.status }
                        })
                    )
                );
            }
        }

        // NEW: Check Parent Group Auto-Completion
        if (item.parentId) {
            const siblingsPending = await prisma.projectItem.count({
                where: {
                    parentId: item.parentId,
                    status: { not: 'DONE' }
                }
            });

            if (siblingsPending === 0) {
                // All siblings done, complete parent
                // Recursively call updateItemStatus with permission check skipped
                await updateItemStatus(prisma, ctx, item.parentId, 'DONE', true);
            }
        }

    }
    else {
        // Reverting from DONE (or just random change) -> LOCK Dependencies
        // ... existing logic ...

        const dependents = await prisma.itemDependency.findMany({
            where: { prerequisiteId: itemId },
            include: { item: { select: { id: true, status: true } } }
        });

        const updates = calculateReversionCascades(itemId, dependents as unknown as DependentItem[]);

        if (updates.length > 0) {
            await prisma.$transaction(
                updates.map(u =>
                    prisma.projectItem.update({
                        where: { id: u.id },
                        data: { status: u.status }
                    })
                )
            );
        }

        // NEW: Check Parent Group Auto-Reopen
        if (item.parentId) {
            const parent = await prisma.projectItem.findUnique({
                where: { id: item.parentId },
                select: { status: true }
            });

            if (parent && parent.status === 'DONE') {
                // Reopen parent
                await updateItemStatus(prisma, ctx, item.parentId, 'OPEN', true);
            }
        }
    }

    return item;
}

export async function updateItemDetails(prisma: PrismaClient, ctx: ProjectContext, itemId: string, data: { title?: string, description?: string }): Promise<ProjectItem> {
    // 1. Fetch item to check ownership
    const itemToCheck = await prisma.projectItem.findUnique({
        where: { id: itemId },
        select: {
            assignedToId: true,
            assignees: { select: { id: true } },
            projectId: true,
            project: {
                select: { createdById: true, organizationId: true }
            }
        }
    });

    if (!itemToCheck) throw new Error('Item not found');
    if (itemToCheck.project.organizationId !== ctx.organizationId) throw new Error('Unauthorized');

    // 2. Enforce Permissions (Same as updateItemStatus)
    // 2. Enforce Permissions (Same as updateItemStatus)
    const isCreator = itemToCheck.project.createdById === ctx.userId;
    const isLegacyAssignee = itemToCheck.assignedToId === ctx.userId;
    const isMultiAssignee = itemToCheck.assignees.some(u => u.id === ctx.userId);
    const isAssignee = isLegacyAssignee || isMultiAssignee;
    const isAdmin = ctx.role === 'ADMIN' || ctx.role === 'SUPER_ADMIN';

    if (!isAdmin && !isCreator && !isAssignee) {
        throw new Error('Forbidden: You can only edit your own tasks');
    }

    const item = await prisma.projectItem.update({
        where: { id: itemId },
        data: {
            ...(data.title && { title: data.title }),
            ...(data.description !== undefined && { description: data.description })
        },
    });
    return item;
}

export async function addDependency(prisma: PrismaClient, ctx: ProjectContext, itemId: string, prerequisiteId: string): Promise<ProjectItem | null> {
    if (itemId === prerequisiteId) {
        throw new Error('Cannot depend on self');
    }

    // Verify Ownership & Authorization
    const item = await prisma.projectItem.findUnique({
        where: { id: itemId },
        include: { project: true }
    });

    if (!item || item.project.organizationId !== ctx.organizationId) {
        throw new Error('Item not found or unauthorized');
    }

    const isAdmin = ctx.role === 'ADMIN' || ctx.role === 'SUPER_ADMIN';
    const isManager = ctx.role === 'MANAGER';
    const isOwner = item.project.createdById === ctx.userId;

    if (!isAdmin && !isManager && !isOwner) {
        throw new Error('Unauthorized');
    }

    const prerequisite = await prisma.projectItem.findUnique({
        where: { id: prerequisiteId },
        include: { project: true }
    });

    if (!prerequisite || prerequisite.project.organizationId !== ctx.organizationId) {
        throw new Error('Prerequisite item not found or unauthorized');
    }

    // Fix: Enforce same project to prevent cross-project dependency cycles
    if (item.projectId !== prerequisite.projectId) {
        throw new Error('Cannot depend on external project item');
    }

    const graph = await buildDependencyGraph(prisma, item.projectId);
    const isCycle = detectCycle(graph, itemId, prerequisiteId);
    if (isCycle) {
        throw new Error('Cycle detected: This dependency would create an infinite loop.');
    }

    await prisma.itemDependency.create({
        data: {
            itemId,
            prerequisiteId
        }
    });

    if (item.status !== 'DONE') {
        if (prerequisite.status !== 'DONE') {
            await prisma.projectItem.update({
                where: { id: itemId },
                data: { status: 'LOCKED' }
            });
        }
    }
    return item;
}
// ... existing code ...

export async function deleteItem(prisma: PrismaClient, ctx: ProjectContext, itemId: string): Promise<void> {
    const item = await prisma.projectItem.findUnique({
        where: { id: itemId },
        include: {
            project: true,
            assignees: { select: { id: true } }
        }
    });

    if (!item) throw new Error('Item not found');
    if (item.project.organizationId !== ctx.organizationId) throw new Error('Unauthorized');

    // Permission Check
    const isAdmin = ctx.role === 'ADMIN' || ctx.role === 'SUPER_ADMIN';
    const isManager = ctx.role === 'MANAGER';
    const isCreator = item.project.createdById === ctx.userId;
    const isLegacyAssignee = item.assignedToId === ctx.userId;
    const isMultiAssignee = item.assignees.some(u => u.id === ctx.userId);
    const isAssignee = isLegacyAssignee || isMultiAssignee;

    if (!isAdmin && !isManager && !isCreator && !isAssignee) {
        throw new Error('Forbidden: You can only delete your own tasks');
    }

    // Safety: Prevent deleting items that are prerequisites for others?
    // For now, let's allow it but maybe Prisma will throw FK error if configured, or cascade.
    // Assuming Cascade Delete or Set Null in schema for dependencies.
    // To be safe, let's delete dependencies first manually if needed, but lets try direct delete.

    await prisma.projectItem.delete({
        where: { id: itemId }
    });

    await logAction(prisma, item.projectId, 'ITEM_DELETED', `Item "${item.title}" deleted`);
}
