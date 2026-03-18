import { PrismaClient, Project, ProtocolItem, Prisma } from '@repo/database';
import { ProjectContext } from '../types';
import { logAction } from '../utils/audit';

export async function getProjects(prisma: PrismaClient, ctx: ProjectContext): Promise<(Project & { _count: { items: number } })[]> {
    if (!ctx.organizationId) return [];

    return await prisma.project.findMany({
        where: {
            organizationId: ctx.organizationId,
            deletedAt: null
        },
        orderBy: { updatedAt: 'desc' },
        include: {
            _count: { select: { items: true } }
        }
    });
}

export async function getProjectsMatrix(
    prisma: PrismaClient,
    ctx: ProjectContext,
    limit: number = 50,
    cursor?: string
): Promise<{
    projects: (Project & { items: { id: string; title: string; status: string; updatedAt: Date; originProtocolItemId: string | null; metadata: unknown; files: { id: string; name: string; url: string; size: number; createdAt: Date; type: string; uploadedBy: { name: string | null; email: string } }[]; dependsOn?: { prerequisite: { id: string; title: string; status: string } }[]; completedBy: { name: string | null } | null }[] })[],
    headers: Pick<ProtocolItem, 'id' | 'title' | 'order'>[],
    nextCursor?: string
}> {
    if (!ctx.organizationId) return { projects: [], headers: [] };

    const take = limit + 1; // Fetch one extra to determine if there's a next page

    const projects = await prisma.project.findMany({
        where: {
            organizationId: ctx.organizationId,
            deletedAt: null
        },
        orderBy: { updatedAt: 'desc' },
        take,
        skip: cursor ? 1 : 0,
        cursor: cursor ? { id: cursor } : undefined,
        include: {
            // Include protocolId for grouping in export
            // protocolId is top-level field, so it is included by default in findMany if we don't specify strict select
            // But checking the return type, it is (Project & { items... }) which includes protocolId.
            // Wait, looking at lines 34-67, there is NO select clause, only include. 
            // So protocolId IS included by default since it's a scalar on Project.
            items: {
                orderBy: { order: 'asc' }, // Ensure items are sorted by SOP order
                select: {
                    id: true,
                    title: true,
                    status: true,
                    updatedAt: true,
                    originProtocolItemId: true,
                    metadata: true,
                    requireAttachment: true,
                    files: {
                        select: {
                            id: true,
                            name: true,
                            url: true,
                            size: true,
                            type: true,
                            createdAt: true,
                            uploadedBy: { select: { name: true, email: true } }
                        }
                    },
                    completedBy: {
                        select: { name: true }
                    },
                    dependsOn: {
                        select: {
                            prerequisite: {
                                select: {
                                    id: true,
                                    title: true,
                                    status: true
                                }
                            }
                        }
                    },
                    // Access Control Fields
                    fileAccess: true,
                    assignedToId: true,
                    assignees: { select: { id: true } },
                    allowedFileViewers: { select: { id: true } }
                }
            }
        }
    });

    let nextCursor: string | undefined = undefined;
    if (projects.length > limit) {
        const nextItem = projects.pop(); // Remove the extra item
        nextCursor = nextItem?.id;
    }

    const originIds = new Set<string>();
    projects.forEach(p => {
        p.items.forEach((i) => {
            if (i.originProtocolItemId) originIds.add(i.originProtocolItemId);
        });
    });

    const headers = await prisma.protocolItem.findMany({
        where: {
            id: { in: Array.from(originIds) },
            type: { not: 'GROUP' }
        },
        orderBy: { order: 'asc' },
        select: { id: true, title: true, order: true }
    });

    return {
        projects: projects.map(p => {
            const isStrict = (p.metadata as Record<string, unknown>)?.strictVisibility === true;
            if (isStrict) {
                return {
                    ...p,
                    items: p.items.filter(item => item.status !== 'LOCKED')
                };
            }
            return p;
        }) as unknown as typeof projects,
        headers,
        nextCursor
    };
}

export async function createFromProtocol(prisma: PrismaClient, ctx: ProjectContext, protocolId: string, title: string, metadata: Record<string, unknown> | null = null): Promise<Project> {
    if (!ctx.organizationId) throw new Error('No Organization selected');

    // 1. Fetch Protocol
    const protocol = await prisma.protocol.findUnique({
        where: { id: protocolId },
        include: {
            items: {
                include: {
                    dependsOn: true,
                    defaultAssignees: { select: { id: true } },
                    allowedFileViewers: { select: { id: true } }
                }
            }
        }
    });

    if (!protocol) throw new Error('Protocol not found');
    if (protocol.organizationId !== ctx.organizationId) throw new Error('Protocol not found (Org mismatch)');

    // Start of "Transaction" (Manual)
    let project: Project | null = null;

    try {
        console.time('Create Project (Manual TX)');

        // 2. Create Project Shell
        project = await prisma.project.create({
            data: {
                title,
                description: protocol.description,
                createdById: ctx.userId,
                status: 'ACTIVE',
                organizationId: ctx.organizationId,
                protocolId: protocolId,
                // Gunakan Prisma.InputJsonValue untuk konversi metadata ke format JSON Prisma
                metadata: metadata as Prisma.InputJsonValue
            }
        });

        // 3. Serial Insert (Satu persatu)
        // This avoids "Packet too large" or connection timeouts on weak DBs, and removes the need for a subsequent READ query.
        const itemIdMap = new Map<string, string>();

        console.log(`Starting serial insertion of ${protocol.items.length} items...`);

        for (const pItem of protocol.items) {
            const createdItem = await prisma.projectItem.create({
                data: {
                    title: pItem.title,
                    description: pItem.description,
                    status: 'LOCKED',
                    projectId: project!.id,
                    originProtocolItemId: pItem.id,
                    assignedToId: pItem.defaultAssignees && pItem.defaultAssignees.length > 0 ? pItem.defaultAssignees[0].id : pItem.defaultAssigneeId, // Sync legacy
                    assignees: {
                        connect: pItem.defaultAssignees.map((u: { id: string }) => ({ id: u.id }))
                    },
                    allowedFileViewers: {
                        connect: pItem.allowedFileViewers?.map((u: { id: string }) => ({ id: u.id })) || []
                    },
                    type: pItem.type,
                    order: pItem.order,
                    requireAttachment: pItem.requireAttachment,
                    fileAccess: pItem.fileAccess,
                    color: pItem.color,
                    metadata: (pItem.metadata as Prisma.JsonObject) ?? undefined
                },
                select: { id: true }
            });
            itemIdMap.set(pItem.id, createdItem.id);
        }
        console.log('Finished serial insertion.');

        // 4. Dependencies & Hierarchy (Using the map we just built)
        console.log('Starting serial relationship updates...');

        for (const pItem of protocol.items) {
            const newDependentId = itemIdMap.get(pItem.id);
            if (!newDependentId) continue;

            // 1. Hierarchy Updates (Serial)
            if (pItem.parentId) {
                const newParentId = itemIdMap.get(pItem.parentId);
                if (newParentId) {
                    await prisma.projectItem.update({
                        where: { id: newDependentId },
                        data: { parentId: newParentId }
                    });
                }
            }

            // 2. Insert Dependencies (Serial)
            if (pItem.dependsOn.length > 0) {
                for (const dep of pItem.dependsOn) {
                    const newPrerequisiteId = itemIdMap.get(dep.prerequisiteId);
                    if (newPrerequisiteId) {
                        // Check acts as "Upsert" logic not needed here as we are creating fresh
                        await prisma.itemDependency.create({
                            data: {
                                itemId: newDependentId,
                                prerequisiteId: newPrerequisiteId
                            }
                        });
                    }
                }
            } else {
                // 3. Status Update (Serial) - No dependencies = OPEN
                await prisma.projectItem.update({
                    where: { id: newDependentId },
                    data: { status: 'OPEN' }
                });
            }
        }
        console.log('Finished relationship updates.');


        await prisma.projectHistory.create({
            data: {
                projectId: project.id,
                action: 'PROJECT_CREATED',
                details: `Created from protocol: ${protocol.name}`
            }
        });

        console.timeEnd('Create Project (Manual TX)');
        return project;

    } catch (error) {
        console.error('Failed to create project, rolling back:', error);
        // Manual Rollback
        if (project) {
            try {
                await prisma.project.delete({ where: { id: project.id } });
                console.log('Rollback successful');
            } catch (rollbackError) {
                console.error('Rollback failed:', rollbackError);
            }
        }
        throw error;
    }
}


export async function updateDetails(prisma: PrismaClient, ctx: ProjectContext, projectId: string, data: { title?: string, description?: string }): Promise<void> {
    const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: { createdById: true, organizationId: true }
    });

    if (!project) throw new Error('Project not found');

    // Permissions
    const isAdmin = ctx.role === 'ADMIN' || ctx.role === 'SUPER_ADMIN';
    const isManager = ctx.role === 'MANAGER';
    const isStaff = ctx.role === 'STAFF';
    const isCreator = project.createdById === ctx.userId;

    if (!isAdmin && !isCreator && !isManager && !isStaff) {
        throw new Error('Forbidden: You do not have permission to edit details');
    }

    await prisma.project.update({
        where: { id: projectId },
        data: {
            ...(data.title && { title: data.title }),
            ...(data.description !== undefined && { description: data.description })
        }
    });

    await logAction(prisma, projectId, 'PROJECT_UPDATED', `Project details updated`);
}


export async function deleteProject(prisma: PrismaClient, ctx: ProjectContext, projectId: string): Promise<void> {
    const isAdmin = ctx.role === 'ADMIN' || ctx.role === 'SUPER_ADMIN';
    if (!isAdmin) throw new Error('Unauthorized: Admin access required');

    const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: { organizationId: true }
    });

    if (!project) throw new Error('Project not found');
    if (project.organizationId !== ctx.organizationId) throw new Error('Unauthorized');

    await prisma.project.update({
        where: { id: projectId },
        data: { deletedAt: new Date() }
    });
}

export async function hardDeleteProject(prisma: PrismaClient, ctx: ProjectContext, projectId: string): Promise<void> {
    const isAdmin = ctx.role === 'ADMIN' || ctx.role === 'SUPER_ADMIN';
    if (!isAdmin) throw new Error('Unauthorized: Admin access required');

    const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: { organizationId: true }
    });

    if (!project) return;
    if (project.organizationId !== ctx.organizationId) throw new Error('Unauthorized');

    await prisma.project.delete({
        where: { id: projectId }
    });
}

export async function getDeletedProjects(prisma: PrismaClient, ctx: ProjectContext): Promise<(Project & { _count: { items: number } })[]> {
    const isAdmin = ctx.role === 'ADMIN' || ctx.role === 'SUPER_ADMIN';
    if (!isAdmin) throw new Error('Unauthorized: Admin access required');

    return await prisma.project.findMany({
        where: {
            organizationId: ctx.organizationId,
            deletedAt: { not: null }
        },
        orderBy: { deletedAt: 'desc' },
        include: {
            _count: { select: { items: true } }
        }
    });
}

export async function restoreProject(prisma: PrismaClient, ctx: ProjectContext, projectId: string): Promise<void> {
    const isAdmin = ctx.role === 'ADMIN' || ctx.role === 'SUPER_ADMIN';
    if (!isAdmin) throw new Error('Unauthorized: Admin access required');

    const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: { organizationId: true }
    });

    if (!project) throw new Error('Project not found');
    if (project.organizationId !== ctx.organizationId) throw new Error('Unauthorized');

    await prisma.project.update({
        where: { id: projectId },
        data: { deletedAt: null }
    });
}
