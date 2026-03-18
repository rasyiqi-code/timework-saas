'use server';

import { prisma } from '@/lib/db';
import { getCurrentUser } from './auth';

export type InsightData = {
    projectsByStatus: { status: string; count: number }[];
    protocolStats: { name: string; count: number }[];
    taskStats: { status: string; count: number }[];
    assigneeStats: {
        id: string;
        name: string;
        email: string;
        avgDurationHours: number;
        completedTasks: number;
        activeTasks: number;
        isBottleneck: boolean;
    }[];
    totalProjects: number;
    totalTasks: number;
    estimatedSavings: number; // ROI
    completionVelocity: number; // Avg days for project completion
    activeProjects: {
        id: string;
        title: string;
        status: string;
        progress: number;
        lastUpdate: Date;
    }[];
};

export async function getInsightStats(): Promise<InsightData> {
    const user = await getCurrentUser();
    if (!user || !user.organizationId) {
        throw new Error('Unauthorized');
    }

    const orgId = user.organizationId;

    // 1. Projects by Status
    const projectsByStatusRaw = await prisma.project.groupBy({
        by: ['status'],
        where: { organizationId: orgId },
        _count: { id: true }
    });

    const projectsByStatus = projectsByStatusRaw.map(p => ({
        status: p.status,
        count: p._count.id
    }));

    const totalProjects = projectsByStatus.reduce((acc, curr) => acc + curr.count, 0);

    // 2. Protocols Usage
    const protocolsUsage = await prisma.project.groupBy({
        by: ['protocolId'],
        where: { organizationId: orgId },
        _count: { id: true }
    });

    const protocolIds = protocolsUsage.map(p => p.protocolId).filter(Boolean) as string[];
    const protocols = await prisma.protocol.findMany({
        where: { id: { in: protocolIds } },
        select: { id: true, name: true }
    });

    const protocolStats = protocolsUsage.map(usage => {
        const p = protocols.find(proto => proto.id === usage.protocolId);
        return {
            name: p?.name || 'Unknown',
            count: usage._count.id
        };
    }).sort((a, b) => b.count - a.count); // Most popular first

    // 3. Task Statistics
    const taskStatsRaw = await prisma.projectItem.groupBy({
        by: ['status'],
        where: {
            project: { organizationId: orgId }
        },
        _count: { id: true }
    });

    const taskStats = taskStatsRaw.map(t => ({
        status: t.status,
        count: t._count.id
    }));

    const totalTasks = taskStats.reduce((acc, curr) => acc + curr.count, 0);

    // 4. Assignee Stats & Bottleneck Detection
    const allItems = await prisma.projectItem.findMany({
        where: {
            project: { organizationId: orgId }
        },
        select: {
            id: true,
            status: true,
            startDate: true,
            endDate: true,
            assignees: { select: { id: true, name: true, email: true } },
            assignedTo: { select: { id: true, name: true, email: true } },
            requiredBy: { select: { id: true } } // If this task blocks others
        }
    });

    const assigneeMap = new Map<string, { name: string; email: string; totalDuration: number; completedCount: number; activeCount: number; blocksOthersCount: number }>();

    for (const item of allItems) {
        const assignee = item.assignees[0] || item.assignedTo;
        if (!assignee) continue;

        const stats = assigneeMap.get(assignee.id) || {
            name: assignee.name || 'Unknown',
            email: assignee.email,
            totalDuration: 0,
            completedCount: 0,
            activeCount: 0,
            blocksOthersCount: 0
        };

        if (item.status === 'DONE' && item.startDate && item.endDate) {
            const durationMs = item.endDate.getTime() - item.startDate.getTime();
            if (durationMs >= 0) {
                stats.totalDuration += durationMs;
                stats.completedCount += 1;
            }
        } else if (item.status === 'IN_PROGRESS' || item.status === 'OPEN') {
            stats.activeCount += 1;
            if (item.requiredBy.length > 0) {
                stats.blocksOthersCount += 1;
            }
        }

        assigneeMap.set(assignee.id, stats);
    }

    const assigneeStats = Array.from(assigneeMap.entries()).map(([id, stats]) => ({
        id,
        name: stats.name,
        email: stats.email,
        avgDurationHours: stats.completedCount > 0 ? (stats.totalDuration / stats.completedCount) / (1000 * 60 * 60) : 0,
        completedTasks: stats.completedCount,
        activeTasks: stats.activeCount,
        isBottleneck: stats.activeCount > 5 && stats.blocksOthersCount > 2
    })).sort((a, b) => b.completedTasks - a.completedTasks);

    // 5. ROI Calculation (Heuristic: $5 per completed task)
    const estimatedSavings = totalTasks * 5; // Simple heuristic for SaaS replacement value

    // 6. Velocity (Avg days to complete COMPLETED projects)
    const completedProjects = await prisma.project.findMany({
        where: { organizationId: orgId, status: 'COMPLETED', startDate: { not: null as unknown as Date } },
        select: { startDate: true, updatedAt: true }
    });

    let totalVelocityMs = 0;
    completedProjects.forEach(p => {
        if (p.startDate) {
            totalVelocityMs += p.updatedAt.getTime() - p.startDate.getTime();
        }
    });
    const completionVelocity = completedProjects.length > 0 
        ? (totalVelocityMs / completedProjects.length) / (1000 * 60 * 60 * 24) 
        : 0;

    // 7. Active Projects Health (Top 20 most recent active)
    const recentProjects = await prisma.project.findMany({
        where: { organizationId: orgId, status: { in: ['ACTIVE', 'IN_PROGRESS'] } },
        orderBy: { updatedAt: 'desc' },
        take: 24,
        include: {
            items: {
                select: { status: true }
            }
        }
    });

    const activeProjects = recentProjects.map(p => {
        const totalItems = p.items.length;
        const doneItems = p.items.filter(i => i.status === 'DONE').length;
        return {
            id: p.id,
            title: p.title,
            status: p.status,
            progress: totalItems > 0 ? (doneItems / totalItems) * 100 : 0,
            lastUpdate: p.updatedAt
        };
    });

    return {
        projectsByStatus,
        protocolStats,
        taskStats,
        assigneeStats,
        totalProjects,
        totalTasks,
        estimatedSavings,
        completionVelocity,
        activeProjects
    };
}
