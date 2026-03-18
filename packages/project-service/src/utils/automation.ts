
import { PrismaClient, ProjectItem } from '@repo/database';

export type AutomationTrigger = 'ON_DONE' | 'ON_STATUS_CHANGE';

export interface AutomationAction {
    type: 'SEND_INTERNAL_NOTIF' | 'AUTO_ASSIGN' | 'UNLOCK_TASK';
    params?: {
        message?: string;
        targetUserId?: string;
        targetItemId?: string;
        [key: string]: unknown;
    };
}

export interface AutomationRule {
    trigger: AutomationTrigger;
    actions: AutomationAction[];
}

export async function processAutomation(
    prisma: PrismaClient,
    item: ProjectItem,
    trigger: AutomationTrigger
) {
    const metadata = item.metadata as Record<string, unknown> | null;
    const rules = metadata?.automation as AutomationRule[] | undefined;

    if (!rules || !Array.isArray(rules)) return;

    for (const rule of rules) {
        if (rule.trigger === trigger) {
            for (const action of rule.actions) {
                await executeAction(prisma, item, action);
            }
        }
    }
}

async function executeAction(
    prisma: PrismaClient,
    item: ProjectItem,
    action: AutomationAction
) {
    switch (action.type) {
        case 'SEND_INTERNAL_NOTIF':
            await prisma.projectHistory.create({
                data: {
                    projectId: item.projectId,
                    action: 'INTERNAL_NOTIFICATION',
                    details: action.params?.message || `Automation: Task "${item.title}" triggered a notification.`
                }
            });
            break;

        case 'AUTO_ASSIGN':
            if (action.params?.targetUserId) {
                await prisma.projectItem.update({
                    where: { id: item.id },
                    data: {
                        assignees: {
                            connect: { id: action.params.targetUserId }
                        }
                    }
                });
            }
            break;

        case 'UNLOCK_TASK':
            // Custom unlock logic if beyond standard dependency chain
            if (action.params?.targetItemId) {
                await prisma.projectItem.update({
                    where: { id: action.params.targetItemId },
                    data: { status: 'OPEN' }
                });
            }
            break;

        default:
            console.warn(`Unknown automation action type: ${action.type}`);
    }
}
