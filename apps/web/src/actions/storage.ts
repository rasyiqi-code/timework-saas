'use server';

import { s3Client, R2_BUCKET_NAME } from '@/lib/storage';
import { PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { getCurrentUser } from './auth';
import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';

function getFileKeyFromUrl(attachmentUrl: string): string | null {
    try {
        // If it's already a key (doesn't start with http)
        if (!attachmentUrl.startsWith('http')) return attachmentUrl;

        const url = new URL(attachmentUrl);
        // If path is /bucket-name/tasks/..., remove first part.  
        // If path is /tasks/..., keep it.
        const keyIndex = url.pathname.indexOf('tasks/');
        if (keyIndex !== -1) {
            return url.pathname.substring(keyIndex);
        } else {
            // Fallback: maybe just pathname relative?
            return url.pathname.substring(1); // remove leading slash
        }
    } catch {
        return null;
    }
}

export async function getPresignedUploadUrl(taskId: string, fileName: string, fileType: string, projectId?: string) {
    if (!process.env.R2_ACCOUNT_ID) {
        console.error("CRITICAL: R2_ACCOUNT_ID is missing from environment variables!");
        return { error: "Server Misconfiguration: R2_ACCOUNT_ID is missing" };
    }
    const user = await getCurrentUser();
    if (!user) return { error: 'Unauthorized' };

    // Create a clean file key
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');

    // If projectId is provided, store in projects/{projectId}/...
    // Otherwise fall back to tasks/{taskId}/... (Legacy/Task-specific)
    let fileKey = '';

    if (projectId) {
        fileKey = `projects/${projectId}/${Date.now()}-${sanitizedFileName}`;
    } else {
        fileKey = `tasks/${taskId}/${Date.now()}-${sanitizedFileName}`;
    }

    const command = new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: fileKey,
        ContentType: fileType,
        Metadata: {
            uploadedBy: user.id
        }
    });

    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 }); // 5 minutes

    const publicUrl = process.env.R2_PUBLIC_URL
        ? `${process.env.R2_PUBLIC_URL}/${fileKey}`
        : `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${R2_BUCKET_NAME}/${fileKey}`;

    return { uploadUrl, fileKey, publicUrl };
}

export async function getPresignedDownloadUrl(taskId: string) {
    const user = await getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    const task = await prisma.projectItem.findUnique({
        where: { id: taskId },
        include: {
            project: true,
            assignees: true
        }
    });

    if (!task) throw new Error('Task not found');
    if (!task.attachmentUrl) throw new Error('Attachment not found');

    // Permission Check: Admin, Project Owner, or Assignee
    const isAdmin = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';
    const isProjectOwner = task.project.createdById === user.id;
    const isAssignee = task.assignedToId === user.id || task.assignees.some(u => u.id === user.id);

    if (!isAdmin && !isProjectOwner && !isAssignee) {
        throw new Error('Unauthorized: You do not have permission to view this file.');
    }

    const fileKey = getFileKeyFromUrl(task.attachmentUrl);
    if (!fileKey) throw new Error('Invalid file reference');

    const command = new GetObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: fileKey,
    });

    // Valid for 1 hour
    return await getSignedUrl(s3Client, command, { expiresIn: 3600 });
}

export async function updateTaskAttachment(taskId: string, attachmentUrl: string) {
    const user = await getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    // Verify task exists and user has access (basic check)
    const task = await prisma.projectItem.findUnique({
        where: { id: taskId },
        include: { project: true }
    });

    if (!task) throw new Error('Task not found');

    await prisma.projectItem.update({
        where: { id: taskId },
        data: { attachmentUrl }
    });

    // Socket update disabled for file upload as per request
    // const { emitProjectUpdate } = await import('@/lib/socket-server');
    // await emitProjectUpdate(task.projectId, "Attachment Uploaded");

    revalidatePath(`/projects/${task.projectId}`);
}

export async function deleteTaskAttachment(taskId: string) {
    const user = await getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    const task = await prisma.projectItem.findUnique({
        where: { id: taskId },
        select: { id: true, projectId: true, attachmentUrl: true }
    });

    if (!task) throw new Error('Task not found');
    const attachmentUrl = task.attachmentUrl;
    if (!attachmentUrl) return; // Nothing to delete

    const fileKey = getFileKeyFromUrl(attachmentUrl);

    if (fileKey) {
        try {
            const command = new DeleteObjectCommand({
                Bucket: R2_BUCKET_NAME,
                Key: fileKey,
            });
            await s3Client.send(command);
        } catch (error) {
            console.error("Failed to delete from R2:", error);
        }
    }

    await prisma.projectItem.update({
        where: { id: taskId },
        data: { attachmentUrl: null }
    });

    // Socket update disabled for file upload as per request
    // const { emitProjectUpdate } = await import('@/lib/socket-server');
    // await emitProjectUpdate(task.projectId, "Attachment Removed");

    revalidatePath(`/projects/${task.projectId}`);
}
