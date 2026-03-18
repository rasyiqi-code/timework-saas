
import {
    PrismaClient,
    Project,
    ProjectItem,
    ProjectItem as ProjectItemType,
    ProtocolItem,
    ItemDependency,
    ProjectHistory
} from '@repo/database';

import { ProjectContext } from './types';
export { type ProjectContext };

import * as ProjectModule from './modules/project';
import * as ItemModule from './modules/item';
import { detectCycle, buildDependencyGraph } from './utils/graph';

export class ProjectService {
    constructor(private prisma: PrismaClient) { }

    // --- Audit ---

    async getHistory(projectId: string): Promise<ProjectHistory[]> {
        return await this.prisma.projectHistory.findMany({
            where: { projectId },
            orderBy: { timestamp: 'desc' },
            take: 50
        });
    }

    // --- Project Operations ---

    async createFromProtocol(ctx: ProjectContext, protocolId: string, title: string, metadata: Record<string, unknown> | null = null): Promise<Project> {
        return ProjectModule.createFromProtocol(this.prisma, ctx, protocolId, title, metadata);
    }

    async updateDetails(ctx: ProjectContext, projectId: string, data: { title?: string, description?: string }): Promise<void> {
        return ProjectModule.updateDetails(this.prisma, ctx, projectId, data);
    }

    async delete(ctx: ProjectContext, projectId: string): Promise<void> {
        return ProjectModule.deleteProject(this.prisma, ctx, projectId);
    }

    async hardDelete(ctx: ProjectContext, projectId: string): Promise<void> {
        return ProjectModule.hardDeleteProject(this.prisma, ctx, projectId);
    }

    async getProjects(ctx: ProjectContext): Promise<(Project & { _count: { items: number } })[]> {
        return ProjectModule.getProjects(this.prisma, ctx);
    }

    async getProjectsMatrix(ctx: ProjectContext, limit: number = 50, cursor?: string): Promise<{ projects: (Project & { items: Pick<ProjectItem, 'id' | 'title' | 'status' | 'updatedAt' | 'originProtocolItemId'>[] })[], headers: Pick<ProtocolItem, 'id' | 'title' | 'order'>[], nextCursor?: string }> {
        return ProjectModule.getProjectsMatrix(this.prisma, ctx, limit, cursor);
    }

    async getDeletedProjects(ctx: ProjectContext): Promise<(Project & { _count: { items: number } })[]> {
        return ProjectModule.getDeletedProjects(this.prisma, ctx);
    }

    async restoreProject(ctx: ProjectContext, projectId: string): Promise<void> {
        return ProjectModule.restoreProject(this.prisma, ctx, projectId);
    }

    async getById(ctx: ProjectContext, id: string): Promise<Project & { protocol: import('@repo/database').Protocol | null, items: (ProjectItem & { dependsOn: (ItemDependency & { prerequisite: ProjectItem })[], requiredBy: ItemDependency[], assignees: { id: string, name: string | null }[], files: { id: string; name: string; url: string; size: number; createdAt: Date; type: string; uploadedBy: { name: string | null; email: string } }[] })[] } | null> {
        if (!ctx.organizationId) return null;

        const project = await this.prisma.project.findUnique({
            where: { id },
            include: {
                protocol: true,
                items: {
                    include: {
                        dependsOn: {
                            include: {
                                prerequisite: true
                            }
                        },
                        requiredBy: true,
                        assignees: {
                            select: {
                                id: true,
                                name: true
                            }
                        },
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
                        }
                    },
                    orderBy: {
                        order: 'asc'
                    }
                }
            }
        });

        if (!project || project.organizationId !== ctx.organizationId) {
            return null;
        }
        if (project.deletedAt) return null;

        // --- Strict Visibility Logic ---
        const projectMetadata = project.metadata as Record<string, unknown> | null;
        const isStrict = projectMetadata?.strictVisibility === true;

        // Define proper return type match
        type ExpectedReturnType = NonNullable<Awaited<ReturnType<ProjectService['getById']>>>;

        if (isStrict) {
            // If strict, only show items that are NOT LOCKED
            return {
                ...project,
                items: project.items.filter(item => item.status !== 'LOCKED')
            } as unknown as ExpectedReturnType;
        }

        return project as unknown as ExpectedReturnType;
    }

    // --- Item Operations ---

    async addItem(ctx: ProjectContext, projectId: string, title: string, blockedItemId?: string): Promise<ProjectItemType> {
        return ItemModule.addItem(this.prisma, ctx, projectId, title, blockedItemId);
    }

    async updateItemStatus(ctx: ProjectContext, itemId: string, newStatus: string): Promise<ProjectItemType> {
        return ItemModule.updateItemStatus(this.prisma, ctx, itemId, newStatus);
    }

    async updateItemDetails(ctx: ProjectContext, itemId: string, data: { title?: string, description?: string }): Promise<ProjectItemType> {
        return ItemModule.updateItemDetails(this.prisma, ctx, itemId, data);
    }

    async addDependency(ctx: ProjectContext, itemId: string, prerequisiteId: string): Promise<ProjectItemType | null> {
        return ItemModule.addDependency(this.prisma, ctx, itemId, prerequisiteId);
    }

    async deleteItem(ctx: ProjectContext, itemId: string): Promise<void> {
        return ItemModule.deleteItem(this.prisma, ctx, itemId);
    }

    // --- Utils ---

    // Exposed for testing if needed, or internal use
    private async detectCycle(itemId: string, prerequisiteId: string): Promise<boolean> {
        const item = await this.prisma.projectItem.findUnique({ where: { id: itemId }, select: { projectId: true } });
        if (!item) return false;
        const graph = await buildDependencyGraph(this.prisma, item.projectId);
        return detectCycle(graph, itemId, prerequisiteId);
    }
}
