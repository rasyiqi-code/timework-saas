import { PrismaClient, ProtocolItemType, Prisma } from '@prisma/client'

const prisma = new PrismaClient()

// Define types for our seed data
type SeedItem = {
    title: string
    type: ProtocolItemType
    role?: 'ADMIN' | 'STAFF' // Default ADMIN
    children?: SeedItem[]
}

type ProtocolDefinition = {
    name: string
    description: string
    items: SeedItem[]
}

// 1. Program Reguler Penerbit KBM
const kbmReguler: SeedItem[] = [
    { title: 'DP (UANG MUKA)', type: 'TASK', role: 'ADMIN' },
    { title: 'Naskah Masuk dari Penulis', type: 'TASK', role: 'ADMIN' },
    { title: 'REQUEST PENULIS', type: 'NOTE', role: 'ADMIN' },
    {
        title: 'LAYOUT',
        type: 'GROUP',
        children: [
            { title: 'Naskah Selesai Layout', type: 'TASK', role: 'STAFF' },
            { title: 'Naskah Di Kirim Ke Penulis', type: 'TASK', role: 'STAFF' }
        ]
    },
    {
        title: 'COVER',
        type: 'GROUP',
        children: [
            { title: 'Cover Selesai Desain', type: 'TASK', role: 'STAFF' },
            { title: 'Cover Di Kirim Ke Penulis', type: 'TASK', role: 'STAFF' }
        ]
    },
    {
        title: 'SURAT KEASLIAN',
        type: 'GROUP',
        children: [
            { title: 'Template Surat dikirim ke Penulis', type: 'TASK', role: 'ADMIN' },
            { title: 'Surat Keaslian diterima dari Penulis', type: 'TASK', role: 'ADMIN' }
        ]
    },
    {
        title: 'ISBN/QRCBN/QRSBN',
        type: 'GROUP',
        children: [
            { title: 'ISBN/QRCBN/QRSBN Diajukan', type: 'TASK', role: 'STAFF' },
            { title: 'ISBN/QRCBN/QRSBN Keluar', type: 'TASK', role: 'STAFF' }
        ]
    },
    {
        title: 'HAKI',
        type: 'GROUP',
        children: [
            { title: 'HAKI diajukan', type: 'TASK', role: 'STAFF' },
            { title: 'HAKI keluar', type: 'TASK', role: 'STAFF' }
        ]
    },
    {
        title: 'ACC NASKAH & CETAK',
        type: 'GROUP',
        children: [
            { title: 'Naskah di ACC Cetak Oleh Penulis', type: 'TASK', role: 'STAFF' },
            { title: 'Detail Alamat Kirim Buku Cetakan', type: 'NOTE', role: 'ADMIN' },
            { title: 'Request Cetak Penulis', type: 'NOTE', role: 'ADMIN' },
            { title: 'Perubahan Request Cetak Penulis', type: 'NOTE', role: 'ADMIN' }
        ]
    },
    { title: 'PELUNASAN', type: 'TASK', role: 'ADMIN' },
    { title: 'NAIK CETAK', type: 'TASK', role: 'ADMIN' },
    {
        title: 'ADM. PASCA CETAK',
        type: 'GROUP',
        children: [
            { title: 'Form Penjualan & Royalty', type: 'TASK', role: 'ADMIN' },
            { title: 'Testimoni Penulis', type: 'TASK', role: 'ADMIN' },
            { title: 'Sertifikat Buku', type: 'TASK', role: 'ADMIN' }
        ]
    },
    {
        title: 'DISTRIBUSI & PUBLIKASI (Marketing & Admin Keuangan)',
        type: 'GROUP',
        children: [
            { title: 'Link Google Playbook', type: 'TASK', role: 'ADMIN' },
            { title: 'Link Google Playbook di Kirim ke Penulis', type: 'TASK', role: 'ADMIN' },
            { title: 'Link Market Place Penjualan', type: 'TASK', role: 'ADMIN' },
            { title: 'Link Market Place Penjualan Di Kirim Ke Penulis', type: 'TASK', role: 'ADMIN' },
            { title: 'Link OMP', type: 'TASK', role: 'ADMIN' },
            { title: 'Link OMP di Kirim ke Penulis', type: 'TASK', role: 'ADMIN' }
        ]
    },
    { title: 'Resi Diterima', type: 'TASK', role: 'STAFF' },
    { title: 'Resi Dikirim ke Penulis', type: 'TASK', role: 'ADMIN' }
]

// 2. Program Satuan Mitra Penerbit (SPT) Penerbit KBM
const sptMitra: SeedItem[] = [
    {
        title: 'DP & NASKAH',
        type: 'GROUP',
        children: [
            { title: 'Tanggal DP', type: 'TASK', role: 'ADMIN' },
            { title: 'Tanggal Naskah Masuk', type: 'TASK', role: 'ADMIN' },
            { title: 'REQUEST PENULIS', type: 'NOTE', role: 'ADMIN' }
        ]
    },
    {
        title: 'LAYOUT',
        type: 'GROUP',
        children: [
            { title: 'Naskah Selesai Layout', type: 'TASK', role: 'STAFF' },
            { title: 'Naskah Di Kirim Ke Penulis', type: 'TASK', role: 'STAFF' }
        ]
    },
    {
        title: 'COVER',
        type: 'GROUP',
        children: [
            { title: 'Cover Selesai Desain', type: 'TASK', role: 'STAFF' },
            { title: 'Cover Di Kirim Ke Penulis', type: 'TASK', role: 'STAFF' }
        ]
    },
    {
        title: 'SURAT KEASLIAN',
        type: 'GROUP',
        children: [
            { title: 'Template Surat dikirim ke Penulis', type: 'TASK', role: 'ADMIN' },
            { title: 'Surat Keaslian diterima dari Penulis', type: 'TASK', role: 'ADMIN' }
        ]
    },
    {
        title: 'ISBN/QRCBN/QRSBN',
        type: 'GROUP',
        children: [
            { title: 'ISBN/QRCBN/QRSBN Diajukan', type: 'TASK', role: 'STAFF' },
            { title: 'ISBN/QRCBN/QRSBN Keluar', type: 'TASK', role: 'STAFF' }
        ]
    },
    {
        title: 'HAKI',
        type: 'GROUP',
        children: [
            { title: 'HAKI diajukan', type: 'TASK', role: 'STAFF' },
            { title: 'HAKI keluar', type: 'TASK', role: 'STAFF' }
        ]
    },
    {
        title: 'ACC NASKAH & CETAK',
        type: 'GROUP',
        children: [
            { title: 'Naskah di ACC Cetak Oleh Penulis', type: 'TASK', role: 'STAFF' },
            { title: 'Detail Alamat Kirim Buku Cetakan', type: 'NOTE', role: 'ADMIN' },
            { title: 'Request Cetak Penulis', type: 'NOTE', role: 'ADMIN' },
            { title: 'Perubahan Request Cetak Penulis', type: 'NOTE', role: 'ADMIN' }
        ]
    },
    { title: 'PELUNASAN', type: 'TASK', role: 'ADMIN' },
    { title: 'NAIK CETAK', type: 'TASK', role: 'ADMIN' },
    {
        title: 'ADM. PASCA CETAK',
        type: 'GROUP',
        children: [
            { title: 'Form Penjualan & Royalty', type: 'TASK', role: 'ADMIN' },
            { title: 'Testimoni Penulis', type: 'TASK', role: 'ADMIN' },
            { title: 'Sertifikat Buku', type: 'TASK', role: 'ADMIN' }
        ]
    },
    {
        title: 'DISTRIBUSI & PUBLIKASI (Marketing & Admin Keuangan)',
        type: 'GROUP',
        children: [
            { title: 'Link Google Playbook', type: 'TASK', role: 'ADMIN' },
            { title: 'Link Google Playbook di Kirim ke Penulis', type: 'TASK', role: 'ADMIN' },
            { title: 'Link Market Place Penjualan', type: 'TASK', role: 'ADMIN' },
            { title: 'Link Market Place Penjualan Di Kirim Ke Penulis', type: 'TASK', role: 'ADMIN' },
            { title: 'Link OMP', type: 'TASK', role: 'ADMIN' },
            { title: 'Link OMP di Kirim ke Penulis', type: 'TASK', role: 'ADMIN' }
        ]
    },
    { title: 'Resi Diterima', type: 'TASK', role: 'STAFF' },
    { title: 'Resi Dikirim ke Mitra SPT', type: 'TASK', role: 'ADMIN' }
]

// 3. Jasa Layout KBM Kreator
const jasaLayout: SeedItem[] = [
    { title: 'DP', type: 'TASK', role: 'ADMIN' },
    { title: 'Data Masuk (Naskah, Draft)', type: 'TASK', role: 'ADMIN' },
    { title: 'REQUEST Khusus', type: 'NOTE', role: 'ADMIN' },
    { title: 'Diserahkan ke Kordinator Layout', type: 'TASK', role: 'ADMIN' },
    { title: 'Naskah Selesai Layout', type: 'TASK', role: 'STAFF' },
    { title: 'Revisi/Dikirim ke Client', type: 'TASK', role: 'STAFF' },
    { title: 'Pelunasan', type: 'TASK', role: 'ADMIN' },
    { title: 'Selesai', type: 'TASK', role: 'ADMIN' }
]

// 4. Jasa Desain Cover KBM Kreator
const jasaCover: SeedItem[] = [
    { title: 'DP', type: 'TASK', role: 'ADMIN' },
    { title: 'Data Masuk (Naskah, Draft)', type: 'TASK', role: 'ADMIN' },
    { title: 'REQUEST Khusus', type: 'NOTE', role: 'ADMIN' },
    { title: 'Naskah dibagi Ke Kordinator Cover', type: 'TASK', role: 'ADMIN' },
    { title: 'Cover Selesai Desain', type: 'TASK', role: 'STAFF' },
    { title: 'Revisi/Dikirim ke Client', type: 'TASK', role: 'STAFF' },
    { title: 'Pelunasan', type: 'TASK', role: 'ADMIN' },
    { title: 'Selesai', type: 'TASK', role: 'ADMIN' }
]

// 5. Jasa HAKI KBM Kreator
const jasaHaki: SeedItem[] = [
    { title: 'DP', type: 'TASK', role: 'ADMIN' },
    { title: 'Data Masuk (Naskah, Draft)', type: 'TASK', role: 'ADMIN' },
    { title: 'REQUEST Khusus', type: 'NOTE', role: 'ADMIN' },
    { title: 'HAKI diajukan', type: 'TASK', role: 'STAFF' },
    { title: 'Nomor HAKI keluar', type: 'TASK', role: 'STAFF' },
    { title: 'Pelunasan', type: 'TASK', role: 'ADMIN' },
    { title: 'Dikirim ke Mitra/Client', type: 'TASK', role: 'ADMIN' }
]

// 6. Jasa Cetak KBM Kreator
const jasaCetak: SeedItem[] = [
    { title: 'DP', type: 'TASK', role: 'ADMIN' },
    { title: 'Data Masuk (Naskah, Draft)', type: 'TASK', role: 'ADMIN' },
    { title: 'REQUEST Khusus', type: 'NOTE', role: 'ADMIN' },
    { title: 'Naskah di ACC Cetak', type: 'TASK', role: 'ADMIN' },
    { title: 'Detail Alamat Pengiriman Buku Cetakan', type: 'NOTE', role: 'ADMIN' },
    { title: 'NAIK CETAK', type: 'TASK', role: 'STAFF' },
    { title: 'Resi Diterima', type: 'TASK', role: 'STAFF' },
    { title: 'Resi Di Kirim Ke Penulis', type: 'TASK', role: 'ADMIN' }
]


const allProtocols: ProtocolDefinition[] = [
    {
        name: 'Program Reguler Penerbit KBM',
        description: 'Standard Operating Procedure (Grouped Flow)',
        items: kbmReguler
    },
    {
        name: 'Program Satuan Mitra Penerbit (SPT) Penerbit KBM',
        description: 'Standar Prosedur untuk Mitra SPT',
        items: sptMitra
    },
    {
        name: 'Jasa Layout KBM Kreator',
        description: 'Flow Jasa Layout',
        items: jasaLayout
    },
    {
        name: 'Jasa Desain Cover KBM Kreator',
        description: 'Flow Jasa Desain Cover',
        items: jasaCover
    },
    {
        name: 'Jasa HAKI KBM Kreator',
        description: 'Flow Pengajuan HAKI',
        items: jasaHaki
    },
    {
        name: 'Jasa Cetak KBM Kreator',
        description: 'Flow Jasa Cetak',
        items: jasaCetak
    }
]

async function main() {
    console.log('🌱 Starting seed (Multi-Protocols for all Orgs)...')

    // Find all organizations to seed to
    let allOrgs = await prisma.organization.findMany();

    // If no orgs exist, create the default one from seed
    if (allOrgs.length === 0) {
        const kbmOrg = await prisma.organization.upsert({
            where: { id: '56a6d1cc-04cf-432e-9e31-770e4f2bd5cd' },
            update: {},
            create: {
                id: '56a6d1cc-04cf-432e-9e31-770e4f2bd5cd',
                name: 'PT. Karya Bakti Makmur (KBM)',
                slug: 'kbm-publisher'
            }
        });
        allOrgs = [kbmOrg];
    }

    console.log(`Found ${allOrgs.length} organizations to seed.`)

    // CONSTANTS: Form Fields Config
    const commonUtils = {
        date: {
            key: 'date',
            label: 'Tanggal Masuk',
            type: 'date',
            required: true
        }
    };

    // 1. FORM PENERBIT KBM (Reguler)
    const kbmRegulerFields = [
        commonUtils.date,
        {
            key: 'author',
            label: 'Nama Penulis',
            type: 'text',
            required: true
        },
        {
            key: 'bookTitle',
            label: 'Judul',
            type: 'text',
            required: true
        },
        {
            key: 'packageType',
            label: 'Jenis Paket',
            type: 'select',
            options: ['Paket Hemat', 'Paket Premium', 'Paket Lengkap', 'Paket Custom'],
            required: true
        },
        {
            key: 'quantity',
            label: 'Jumlah Eksemplar',
            type: 'number',
            required: true
        },
        {
            key: 'size',
            label: 'Ukuran',
            type: 'select',
            options: ['13x19 cm', '14x20 cm', 'A5 (14.8x21)', 'B5 (17.6x25)', 'Custom'],
            required: true
        }
    ];

    // 2. FORM KBM KREATOR
    const kreatorFields = [
        commonUtils.date,
        {
            key: 'publisherName',
            label: 'Penerbit',
            type: 'text',
            placeholder: 'Nama Penerbit / Client',
            required: true
        },
        {
            key: 'author',
            label: 'Nama Penulis',
            type: 'text',
            required: true
        },
        {
            key: 'bookTitle',
            label: 'Judul',
            type: 'text',
            required: true
        },

        {
            key: 'quantity',
            label: 'Kuantitas (Eksemplar / Satuan)',
            type: 'number',
            required: true
        },
        {
            key: 'size',
            label: 'Ukuran',
            type: 'select',
            options: ['13x19 cm', '14x20 cm', 'A5 (14.8x21)', 'B5 (17.6x25)', 'Custom'],
            required: true
        }
    ];

    // 3. FORM SPT KBM INDONESIA
    const sptFields = [
        commonUtils.date,
        {
            key: 'publisherName',
            label: 'Nama Penerbit',
            type: 'text',
            required: true
        },
        {
            key: 'author',
            label: 'Nama Penulis',
            type: 'text',
            required: true
        },
        {
            key: 'bookTitle',
            label: 'Judul',
            type: 'text',
            required: true
        },
        {
            key: 'packageType',
            label: 'Jenis Paket',
            type: 'select',
            options: ['Paket Hemat', 'Paket Premium', 'Paket Lengkap', 'Paket Custom'], // Assuming same as Reguler? Or specific to SPT?
            required: true
        },
        {
            key: 'quantity',
            label: 'Jumlah Eksemplar',
            type: 'number',
            required: true
        },
        {
            key: 'size',
            label: 'Ukuran',
            type: 'select',
            options: ['13x19 cm', '14x20 cm', 'A5 (14.8x21)', 'B5 (17.6x25)', 'Custom'],
            required: true
        }
    ];


    // 2. Loop through organizations
    for (const org of allOrgs) {
        console.log(`\n🏢 Seeding for Organization: ${org.name} (${org.id})`)

        // 2.1 Cleanup
        console.log(`   🧹 Cleaning up existing protocols for ${org.name}...`)
        await prisma.protocol.deleteMany({
            where: { organizationId: org.id }
        })

        // 3. Loop through protocols
        for (const def of allProtocols) {
            console.log(`   📌 Creating Protocol: ${def.name}`)

            // Determine which form fields to use
            let selectedFormFields = [];
            if (def.name.includes('Reguler Penerbit KBM')) {
                selectedFormFields = kbmRegulerFields;
            } else if (def.name.includes('KBM Kreator')) {
                selectedFormFields = kreatorFields;
            } else if (def.name.includes('Satuan Mitra Penerbit')) {
                selectedFormFields = sptFields;
            } else {
                selectedFormFields = kbmRegulerFields; // Fallback
            }

            const protocol = await prisma.protocol.create({
                data: {
                    name: def.name,
                    description: def.description,
                    organizationId: org.id,
                    formFields: selectedFormFields as Prisma.InputJsonValue,
                    titleFormat: '{author} - {bookTitle}'
                }
            })

            // Recursive creation
            let globalOrder = 0

            // Helper rekursif untuk membuat item beserta dependensi antar-sibling
            const createItemsHelpers = async (items: SeedItem[], parentId: string | null = null, lastSiblingId: string | null = null) => {
                let localPrevId = lastSiblingId;

                for (const item of items) {
                    const createdItem = await prisma.protocolItem.create({
                        data: {
                            title: item.title,
                            type: item.type,
                            role: item.role || 'ADMIN',
                            order: globalOrder++,
                            protocolId: protocol.id, // Fixed: use current protocol.id
                            parentId: parentId
                        }
                    });

                    // Link to previous sibling
                    if (localPrevId) {
                        await prisma.protocolDependency.create({
                            data: { itemId: createdItem.id, prerequisiteId: localPrevId }
                        });
                    }

                    localPrevId = createdItem.id;

                    // Children?
                    if (item.children && item.children.length > 0) {
                        await createItemsHelpers(item.children, createdItem.id, null);
                    }
                }
            };

            await createItemsHelpers(def.items);
            console.log(`      ✅ Finished Items for ${def.name}`)
        }
    }

    console.log('\n🚀 Seed finished successfully!')
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
