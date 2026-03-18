'use server';

import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/actions/auth';
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { revalidatePath } from 'next/cache';

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME;

const s3Client = new S3Client({
    region: 'auto',
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: R2_ACCESS_KEY_ID || '',
        secretAccessKey: R2_SECRET_ACCESS_KEY || '',
    },
});

export async function createFileRecord(data: {
    projectId: string;
    taskId?: string;
    name: string;
    url: string;
    size: number;
    type: string;
}) {
    const user = await getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    // Verify Project Access
    const project = await prisma.project.findUnique({
        where: { id: data.projectId },
        include: { organization: true }
    });

    if (!project || project.organizationId !== user.organizationId) {
        throw new Error('Project not found or unauthorized');
    }

    const file = await prisma.file.create({
        data: {
            name: data.name,
            url: data.url,
            size: data.size,
            type: data.type,
            projectId: data.projectId,
            taskId: data.taskId,
            uploadedById: user.id
        }
    });

    revalidatePath(`/projects/${data.projectId}`);
    return file;
}

export async function getProjectFiles(projectId: string) {
    const user = await getCurrentUser();
    if (!user) return [];

    const project = await prisma.project.findUnique({
        where: { id: projectId }
    });

    if (!project) return []; // Access check implicitly handled by UI context usually, but better safe.
    // Ideally check Org membership too.

    return await prisma.file.findMany({
        where: { projectId },
        include: {
            uploadedBy: { select: { name: true, email: true } },
            task: { select: { title: true, id: true } }
        },
        orderBy: { createdAt: 'desc' }
    });
}

function getFileKeyFromUrl(url: string) {
    try {
        const urlObj = new URL(url);
        // Extracts the pathname manually to avoid issues with different R2 setups
        // Example: https://pub-xxx.r2.dev/projects/123/file.pdf -> projects/123/file.pdf
        const path = urlObj.pathname.startsWith('/') ? urlObj.pathname.slice(1) : urlObj.pathname;
        return decodeURIComponent(path);
    } catch {
        return null; // Handle relative paths or invalid URLs
    }
}

export async function deleteFile(fileId: string) {
    const user = await getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    const file = await prisma.file.findUnique({
        where: { id: fileId },
        include: { project: true }
    });

    if (!file) throw new Error('File not found');

    // Permission: Admin, Project Owner, or Uploader
    const isAdmin = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';
    const isOwner = file.project.createdById === user.id; // Using createdById as confirmed earlier
    const isUploader = file.uploadedById === user.id;

    if (!isAdmin && !isOwner && !isUploader) {
        throw new Error('Unauthorized to delete this file');
    }

    // 1. Delete from R2
    const fileKey = getFileKeyFromUrl(file.url);
    if (fileKey) {
        try {
            await s3Client.send(new DeleteObjectCommand({
                Bucket: R2_BUCKET_NAME,
                Key: fileKey
            }));
        } catch (error) {
            console.error('Failed to delete from R2:', error);
            // Continue to delete from DB even if R2 fails (orphaned file better than broken UI)
        }
    }

    // 2. Delete from DB
    await prisma.file.delete({ where: { id: fileId } });
    revalidatePath(`/projects/${file.projectId}`);
}

export async function permanentDeleteProject(projectId: string) {
    const user = await getCurrentUser();
    if (!user || user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
        throw new Error('Unauthorized: Only Admin can delete projects permanently');
    }

    // 1. Fetch all files for this project
    const allFiles = await prisma.file.findMany({
        where: { projectId },
        select: { url: true, id: true }
    });

    // 2. Delete from R2
    // We do this concurrently
    await Promise.all(allFiles.map(async (f) => {
        const fileKey = getFileKeyFromUrl(f.url);
        if (fileKey) {
            try {
                await s3Client.send(new DeleteObjectCommand({
                    Bucket: R2_BUCKET_NAME,
                    Key: fileKey
                }));
            } catch (err) {
                console.error(`Failed to delete file ${fileKey} from R2`, err);
            }
        }
    }));

    // 3. Hard Delete from DB using service
    const { ProjectService } = await import('@repo/project-service');
    const projectService = new ProjectService(prisma);

    const ctx = { userId: user.id, organizationId: user.organizationId || '', role: user.role };
    await projectService.hardDelete(ctx, projectId);

    revalidatePath('/files');
    revalidatePath('/projects');
}

export async function getAllFilesGroupedByProject() {
    const user = await getCurrentUser();
    if (!user || !user.organizationId) return [];

    const isAdmin = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';

    // File Filtering Logic
    const fileFilter = isAdmin ? {} : {
        OR: [
            // 1. Files from tasks with PUBLIC access
            { task: { fileAccess: 'PUBLIC' as const } },
            // 2. Files not tied to a specific task (Project-level files)
            { task: null },
            // 3. Files from RESTRICTED tasks where user is assigned
            {
                task: {
                    fileAccess: 'RESTRICTED' as const,
                    OR: [
                        { assignedToId: user.id },
                        { assignees: { some: { id: user.id } } },
                        { allowedFileViewers: { some: { id: user.id } } }
                    ]
                }
            },
            // 4. Files uploaded by the user themselves
            { uploadedById: user.id }
        ]
    };

    const projects = await prisma.project.findMany({
        where: {
            organizationId: user.organizationId,
            // Only get projects that actually have files the user can see
            files: { some: fileFilter }
        },
        select: {
            id: true,
            title: true,
            status: true,
            deletedAt: true,
            files: {
                where: fileFilter,
                orderBy: { createdAt: 'desc' },
                include: {
                    uploadedBy: { select: { name: true } },
                    task: { select: { title: true, fileAccess: true } }
                }
            }
        },
        orderBy: { updatedAt: 'desc' }
    });

    return projects;
}
