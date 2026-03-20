import { prisma } from './src/lib/db';

async function check() {
  const orgs = await prisma.organization.findMany({
    select: {
      id: true,
      subscriptionStatus: true,
      subscriptionId: true,
      activeUsers: {
        select: {
          email: true
        }
      }
    }
  });
  console.log(JSON.stringify(orgs, null, 2));
}

check().catch(console.error).finally(() => prisma.$disconnect());
