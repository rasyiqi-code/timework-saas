const { PrismaClient } = require('@repo/database');
const prisma = new PrismaClient();

async function main() {
  const projects = await prisma.project.findMany({
    where: { title: { contains: 'Prabowo' } },
    include: { protocol: true }
  });

  if (projects.length === 0) return;
  const project = projects[0];

  if (project.protocolId) {
    const items = await prisma.protocolItem.findMany({
      where: { protocolId: project.protocolId },
      orderBy: { order: 'asc' },
      select: { id: true, title: true, order: true }
    });

    const titleCounts = {};
    items.forEach(i => {
      if (!titleCounts[i.title]) titleCounts[i.title] = [];
      titleCounts[i.title].push(i.order);
    });

    console.log('--- Duplicate Titles ---');
    for (const [title, orders] of Object.entries(titleCounts)) {
      if (orders.length > 1) {
        console.log(`Title: "${title}" appears at orders: ${orders.join(', ')}`);
      }
    }
  }
}

main().finally(async () => await prisma.$disconnect());
