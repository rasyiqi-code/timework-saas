'use client';

import { useRouter } from 'next/navigation';
import { migrateAttachmentsToFiles } from '@/actions/migration';
import { toast } from 'sonner';

import { type User } from '@repo/database';

interface ProjectFilesClientProps {
    projectId: string;
    currentUser: User | null;
}

export function ProjectFilesClient({ currentUser }: ProjectFilesClientProps) {
    const router = useRouter();

    const handleMigration = async () => {
        const toastId = toast.loading('Migrating attachments...');
        try {
            await migrateAttachmentsToFiles();
            toast.success('Migration successful', { id: toastId });
            router.refresh();
        } catch (error) {
            toast.error('Migration failed', { id: toastId });
            console.error(error);
        }
    };

    return (
        <div className="mb-6 flex flex-col md:flex-row justify-end items-center gap-4">
            {(currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPER_ADMIN') && (
                <button
                    onClick={handleMigration}
                    className="text-xs text-slate-400 hover:text-indigo-600 underline"
                    title="Move legacy attachments to File Manager"
                >
                    Run Migration Script
                </button>
            )}
        </div>
    );
}
