import { PrismaClient } from '@repo/database';

export async function logAction(prisma: PrismaClient, projectId: string, action: string, details?: string): Promise<void> {
    await prisma.projectHistory.create({
        data: {
            projectId,
            action,
            details
        }
    });
}
