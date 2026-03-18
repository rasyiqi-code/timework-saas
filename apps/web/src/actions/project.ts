'use server';

import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';

import { requireAdmin, getCurrentUser } from '@/actions/auth';
import { ProjectService } from '@repo/project-service';

const projectService = new ProjectService(prisma);

import { emitProjectUpdate } from '@/lib/socket-server';

import { ProjectSchema } from '@/lib/validation';
import { z } from 'zod';

/**
 * Instantiate a new Project from a Protocol Template
 */
export async function createProjectFromProtocol(protocolId: string, title: string, metadata: Record<string, unknown> | null = null) {
    const user = await getCurrentUser(); // Enforce Login check
    if (!user || !user.organizationId) throw new Error('No Organization selected');

    // Validation
    ProjectSchema.pick({ title: true }).parse({ title });

    const ctx = { userId: user.id, organizationId: user.organizationId, role: user.role };

    const project = await projectService.createFromProtocol(ctx, protocolId, title, metadata);

    const { emitProjectListUpdate } = await import('@/lib/socket-server');
    await emitProjectListUpdate(ctx.organizationId, "New Project Created");

    revalidatePath('/projects');
    return project;
}

// Helper to handle user creation if not exists (for demo)
// async function getOrCreateDemoUser() { ... } // Removed or commented out if unused


/**
 * The Brain: Update Status and Unlock Dependencies
 */
export async function updateItemStatus(itemId: string, newStatus: string) {
    const currentUser = await getCurrentUser();
    if (!currentUser) throw new Error('Unauthorized');
    const ctx = { userId: currentUser.id, organizationId: currentUser.organizationId || '', role: currentUser.role };

    const item = await projectService.updateItemStatus(ctx, itemId, newStatus);

    revalidatePath(`/projects/${item.projectId}`);
    await emitProjectUpdate(item.projectId, "Status Updated");
}

export async function getProjects() {
    const user = await getCurrentUser();
    if (!user || !user.organizationId) return [];

    const ctx = { userId: user.id, organizationId: user.organizationId, role: user.role };
    return await projectService.getProjects(ctx);
}

/**
 * Fetch Projects for Matrix View (Table)
 * Returns Projects with items + Normalized Headers (Protocol Steps)
 */
export async function getProjectsMatrix(limit: number = 50, cursor?: string) {
    const user = await getCurrentUser();
    if (!user || !user.organizationId) return { projects: [], headers: [] };

    const ctx = { userId: user.id, organizationId: user.organizationId, role: user.role };
    return await projectService.getProjectsMatrix(ctx, limit, cursor);
}

export async function getProjectById(id: string) {
    const user = await getCurrentUser();
    if (!user || !user.organizationId) return null;

    const ctx = { userId: user.id, organizationId: user.organizationId, role: user.role };
    return await projectService.getById(ctx, id);
}

/**
 * Ad-Hoc Injection: Add a new item to an Active Project
 */
export async function addProjectItem(projectId: string, title: string, blockedItemId?: string) {
    const user = await getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    const result = z.string().min(1).safeParse(title);
    if (!result.success) throw new Error("Title is required");

    // Permission Check
    // 1. Admin/SuperAdmin/Manager -> Allow
    const isPrivileged = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN' || user.role === 'MANAGER';

    // 2. Project Owner -> Allow
    if (!isPrivileged) {
        const project = await projectService.getById({ userId: user.id, organizationId: user.organizationId || '', role: user.role }, projectId);
        if (!project) throw new Error('Project not found');

        if (project.createdById !== user.id) {
            throw new Error('Unauthorized: Only Admin, Manager, or Project Owner can add tasks.');
        }
    }

    const ctx = { userId: user.id, organizationId: user.organizationId || '', role: user.role };

    await projectService.addItem(ctx, projectId, title, blockedItemId);

    revalidatePath(`/projects/${projectId}`);
    await emitProjectUpdate(projectId, "New Task Added");
}

// Helper to check for cycles using DFS (Adapted for Project Items)
// detectProjectCycle removed (in service)

/**
 * Ad-Hoc Injection: Create a dependency between two project items
 */
export async function addProjectDependency(itemId: string, prerequisiteId: string) {
    const admin = await requireAdmin();
    const ctx = { userId: admin.id, organizationId: admin.organizationId || '', role: admin.role };

    const item = await projectService.addDependency(ctx, itemId, prerequisiteId);

    if (item && item.projectId) {
        revalidatePath(`/projects/${item.projectId}`);
        await emitProjectUpdate(item.projectId, "Dependency Added");
    }
}

export async function updateProjectItemDetails(itemId: string, data: { title?: string, description?: string }) {
    // Current user check if needed, but for now we assume caller handles auth or service handles it. 
    // Wait, updateProjectItemDetails had no auth check in original code?! 
    // Ah, it was probably protected by layout or earlier checks? 
    // Wait, line 319 in original had `const item = await prisma...`. No auth check.
    // I should add auth check.
    const currentUser = await getCurrentUser();
    if (!currentUser) throw new Error('Unauthorized');
    const ctx = { userId: currentUser.id, organizationId: currentUser.organizationId || '', role: currentUser.role };

    const item = await projectService.updateItemDetails(ctx, itemId, data);

    revalidatePath(`/projects/${item.projectId}`);
    await emitProjectUpdate(item.projectId, "Task updated");
}

export async function updateProjectDetails(projectId: string, data: { title?: string, description?: string }) {
    const currentUser = await getCurrentUser();
    if (!currentUser) throw new Error('Unauthorized');
    if (!currentUser.organizationId) throw new Error('No Organization');

    ProjectSchema.partial().parse(data);

    const ctx = { userId: currentUser.id, organizationId: currentUser.organizationId, role: currentUser.role };

    await projectService.updateDetails(ctx, projectId, data);

    revalidatePath(`/projects/${projectId}`);
    await emitProjectUpdate(projectId, "Project updated");
}

export async function deleteProject(projectId: string) {
    const admin = await requireAdmin();
    if (!admin.organizationId) throw new Error('No Organization');

    const ctx = { userId: admin.id, organizationId: admin.organizationId, role: admin.role };

    await projectService.delete(ctx, projectId);

    const { emitProjectListUpdate } = await import('@/lib/socket-server');
    await emitProjectListUpdate(ctx.organizationId, "Project Deleted");

    revalidatePath('/projects');
    // Note: Project deleted, no use emitting update to it, but maybe to list?
    // We don't have socket logic for /projects list yet. -> NOW WE DO :)
}

export async function deleteProjectItem(itemId: string) {
    const user = await getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    const ctx = { userId: user.id, organizationId: user.organizationId || '', role: user.role };

    // We need to know projectId for revalidation before deleting
    // But service delete return void.
    // So we fetch logic inside service or here?
    // Service handles auth, so maybe we rely on it.
    // Use getProjectById... no we only have itemId.
    // Let's assume service handles it. But we need projectId for revalidatePath.

    // Quick Fix: Fetch item briefly to get ProjectId (inefficient but safe)
    const item = await prisma.projectItem.findUnique({
        where: { id: itemId },
        select: { projectId: true }
    });

    if (!item) return; // Already deleted?

    await projectService.deleteItem(ctx, itemId);

    revalidatePath(`/projects/${item.projectId}`);
    await emitProjectUpdate(item.projectId, "Task Deleted");
}

export async function getDeletedProjects() {
    const admin = await requireAdmin();
    if (!admin.organizationId) throw new Error('No Organization');

    const ctx = { userId: admin.id, organizationId: admin.organizationId, role: admin.role };
    return await projectService.getDeletedProjects(ctx);
}

export async function hardDeleteProject(projectId: string) {
    const admin = await requireAdmin();
    if (!admin.organizationId) throw new Error('No Organization');

    const ctx = { userId: admin.id, organizationId: admin.organizationId, role: admin.role };

    await projectService.hardDelete(ctx, projectId);

    const { emitProjectListUpdate } = await import('@/lib/socket-server');
    await emitProjectListUpdate(ctx.organizationId, "Project Permanently Deleted");

    revalidatePath('/projects');
    revalidatePath('/admin/projects/trash');
}

export async function restoreProject(projectId: string) {
    const admin = await requireAdmin();
    if (!admin.organizationId) throw new Error('No Organization');

    const ctx = { userId: admin.id, organizationId: admin.organizationId, role: admin.role };

    await projectService.restoreProject(ctx, projectId);

    const { emitProjectListUpdate } = await import('@/lib/socket-server');
    await emitProjectListUpdate(ctx.organizationId, "Project Restored");

    revalidatePath('/projects');
    revalidatePath('/admin/projects/trash');
}
