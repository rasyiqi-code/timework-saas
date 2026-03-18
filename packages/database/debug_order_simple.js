const { PrismaClient } = require('@repo/database');

const prisma = new PrismaClient();

async function main() {
  try {
    const projects = await prisma.project.findMany({
      where: { title: { contains: 'Prabowo' } },
      include: { protocol: true }
    });

    if (projects.length === 0) {
      console.log('Project not found');
      return;
    }

    const project = projects[0];
    console.log('Project title:', project.title);
    console.log('Protocol:', project.protocol ? project.protocol.name : 'None');

    if (project.protocolId) {
      const items = await prisma.protocolItem.findMany({
        where: { protocolId: project.protocolId },
        orderBy: { order: 'asc' },
        select: { id: true, title: true, order: true }
      });

      console.log('--- SOP Items (Ordered by DB) ---');
      items.forEach(i => {
        console.log(`Order ${i.order}: ${i.title} (${i.id})`);
      });
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
