import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/actions/auth';
import { s3Client, R2_BUCKET_NAME } from '@/lib/storage';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id: fileId } = await params;

    const user = await getCurrentUser();
    if (!user) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    const file = await prisma.file.findUnique({
        where: { id: fileId },
        include: { project: true }
    });

    if (!file) {
        return new NextResponse('File not found', { status: 404 });
    }

    // Access Control
    // 1. If user is Admin -> OK
    // 2. If user is member of Organization of the project -> OK
    // (We assume basic org membership is enough to view project files, or we could check explicit project member/assignee)
    // For now, let's strictly check Organization ID match (basic tenant isolation)
    if (user.organizationId !== file.project.organizationId && user.role !== 'SUPER_ADMIN') {
        return new NextResponse('Forbidden', { status: 403 });
    }

    // Extract Key from URL
    let fileKey: string | null = null;
    try {
        const urlObj = new URL(file.url);
        const path = decodeURIComponent(urlObj.pathname.startsWith('/') ? urlObj.pathname.slice(1) : urlObj.pathname);

        // Remove bucket name prefix if present (common in public R2 URLs)
        // Format: /BUCKET_NAME/KEY
        if (path.startsWith(`${R2_BUCKET_NAME}/`)) {
            fileKey = path.replace(`${R2_BUCKET_NAME}/`, '');
        } else {
            fileKey = path;
        }
    } catch {
        // Fallback: assume URL might be just the key if it fails parsing (legacy data?)
        // But schema says it's URL.
        fileKey = null;
    }

    if (!fileKey) {
        return new NextResponse('Invalid file configuration', { status: 500 });
    }

    try {
        const command = new GetObjectCommand({
            Bucket: R2_BUCKET_NAME,
            Key: fileKey,
            ResponseContentDisposition: `inline; filename="${file.name}"`, // Try to display inline
            // To force download: `attachment; filename="${file.name}"`
        });

        const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 }); // 1 hour

        return NextResponse.redirect(signedUrl);
    } catch (error) {
        console.error('Failed to generate signed URL:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
