import { PrismaClient } from '@repo/database';

const prisma = new PrismaClient();

async function main() {
  // Find a project with 'Prabowo' in title
  const project = await prisma.project.findFirst({
    where: { title: { contains: 'Prabowo' } },
    include: { protocol: true }
  });

  if (!project) {
    console.log('Project not found');
    return;
  }

  console.log('Project:', project.title);
  console.log('Protocol:', project.protocol?.name);

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
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.());
