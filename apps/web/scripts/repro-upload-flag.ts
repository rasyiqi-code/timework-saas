
import { PrismaClient } from '@repo/database';
import { ProjectService } from '@repo/project-service';

const prisma = new PrismaClient();
const service = new ProjectService(prisma);

async function main() {
    console.log("--- Starting Reproduction Script ---");

    // 1. Setup Mock Context
    // We need a valid User and Organization. I'll pick the first one I find or fail.
    const user = await prisma.user.findFirst({
        where: { role: 'SUPER_ADMIN' }
    });

    if (!user || !user.organizationId) {
        console.error("No valid Super Admin with Organization found. Cannot run test.");
        return;
    }

    const ctx = {
        userId: user.id,
        organizationId: user.organizationId,
        role: user.role
    };

    console.log(`Using User: ${user.email} (${user.id})`);
    console.log(`Organization: ${user.organizationId}`);

    // 2. Create a Protocol with an Item that REQUIRES Attachment
    console.log("\nCreating Test Protocol...");
    const protocol = await prisma.protocol.create({
        data: {
            name: `Test Protocol ${Date.now()}`,
            description: "Repro Test",
            organizationId: ctx.organizationId,
            items: {
                create: {
                    title: "Task with Requirement",
                    requireAttachment: true, // THE KEY FLAG
                    type: "TASK"
                }
            }
        },
        include: { items: true }
    });

    console.log("Protocol Created:", protocol.id);
    console.log("Protocol Item Require Attachment:", protocol.items[0].requireAttachment);

    if (protocol.items[0].requireAttachment !== true) {
        console.error("FAIL: Protocol Item was not created with requireAttachment=true");
        return;
    }

    // 3. Create Project from Protocol
    console.log("\nCreating Project from Protocol...");
    const project = await service.createFromProtocol(ctx, protocol.id, `Test Project ${Date.now()}`);

    console.log("Project Created:", project.id);

    // 4. Verify Project Item
    const projectItem = await prisma.projectItem.findFirst({
        where: {
            projectId: project.id,
            originProtocolItemId: protocol.items[0].id
        }
    });

    if (!projectItem) {
        console.error("FAIL: Project Item not found");
        return;
    }

    console.log("\n--- Verification Results ---");
    console.log(`Project Item ID: ${projectItem.id}`);
    console.log(`Title: ${projectItem.title}`);
    console.log(`Require Attachment Schema Value: ${projectItem.requireAttachment}`);

    if (projectItem.requireAttachment === true) {
        console.log("SUCCESS: requireAttachment was correctly propagated.");
    } else {
        console.error("FAIL: requireAttachment is FALSE. Propagation failed.");
    }

    // Cleanup (Optional, but good manners)
    console.log("\nCleaning up...");
    await service.delete(ctx, project.id);
    await prisma.protocol.delete({ where: { id: protocol.id } });
    console.log("Cleanup Done.");
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
