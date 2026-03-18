import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('🌱 Seeding sample projects for ALL organizations...')

    const allOrgs = await prisma.organization.findMany({
        include: {
            protocols: {
                include: { items: true }
            }
        }
    })

    for (const org of allOrgs) {
        console.log(`\n🏢 Seeding Projects for: ${org.name} (${org.id})`)

        // Find any user belonging to this org (either activeUsers or members)
        let user = await prisma.user.findFirst({
            where: { organizationId: org.id }
        });

        if (!user) {
            // Check memberships
            const membership = await prisma.organizationMember.findFirst({
                where: { organizationId: org.id },
                include: { user: true }
            });
            user = membership?.user || null;
        }

        if (!user) {
            console.warn(`   ⚠️ No users found for organization ${org.name}. Skipping projects.`)
            continue
        }

        const protocol = org.protocols[0];
        if (!protocol) {
            console.warn(`   ⚠️ No protocols found for organization ${org.name}. Run the main seed first.`)
            continue
        }

        const orgId = org.id
        const userId = user.id

        // Cleanup existing projects for this org to avoid duplicates in seed
        await prisma.project.deleteMany({ where: { organizationId: orgId } })

        // 1. COMPLETED Project
        const completedProject = await prisma.project.create({
            data: {
                title: 'Sample Completed Book',
                status: 'COMPLETED',
                organizationId: orgId,
                protocolId: protocol.id,
                createdById: userId, 
                metadata: { author: 'John Doe', bookTitle: 'Completed Book' },
                createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
                updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),  // finished 5 days ago
            }
        })

        // Create completed items
        for (const pItem of protocol.items) {
            await prisma.projectItem.create({
                data: {
                    projectId: completedProject.id,
                    title: pItem.title,
                    status: 'DONE',
                    type: pItem.type,
                    order: pItem.order,
                    originProtocolItemId: pItem.id,
                    updatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)
                }
            })
        }

        // 2. ACTIVE Project with some DONE items
        const activeProject = await prisma.project.create({
            data: {
                title: 'Sample Active Novel',
                status: 'ACTIVE',
                organizationId: orgId,
                protocolId: protocol.id,
                createdById: userId,
                metadata: { author: 'Jane Smith', bookTitle: 'Active Novel' },
                createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
            }
        })

        // Create items with mixed status
        for (let i = 0; i < protocol.items.length; i++) {
            const pItem = protocol.items[i];
            await prisma.projectItem.create({
                data: {
                    projectId: activeProject.id,
                    title: pItem.title,
                    status: i < 5 ? 'DONE' : 'OPEN',
                    type: pItem.type,
                    order: pItem.order,
                    originProtocolItemId: pItem.id,
                    updatedAt: i < 5 ? new Date(Date.now() - (5 - i) * 24 * 60 * 60 * 1000) : new Date()
                }
            })
        }

        // 3. Bottleneck Project
        await prisma.project.create({
            data: {
                title: 'Bottlenecked Project',
                status: 'ACTIVE',
                organizationId: orgId,
                protocolId: protocol.id,
                createdById: userId,
                metadata: { author: 'Bob Bottleneck', bookTitle: 'The Slow Book' },
            }
        })

        console.log(`   ✅ Seeded 3 sample projects for ${org.name}`)
    }

    console.log('\n🚀 All sample projects seeded successfully!')
}

main()
    .then(async () => { await prisma.$disconnect() })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
