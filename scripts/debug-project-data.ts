
import { PrismaClient } from '@repo/database';

const prisma = new PrismaClient();

async function main() {
    const projects = await prisma.project.findMany({
        where: {
            title: {
                contains: 'TEST WARNA'
            }
        },
        include: {
            items: {
                select: {
                    id: true,
                    title: true,
                    status: true,
                    metadata: true
                }
            }
        }
    });

    console.log(JSON.stringify(projects, null, 2));
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
