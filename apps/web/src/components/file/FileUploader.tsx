'use client';

import { useState, useRef } from 'react';
import { toast } from 'sonner';
import { UploadCloud, X, File as FileIcon, CheckCircle2, Loader2 } from 'lucide-react';
import { getPresignedUploadUrl } from '@/actions/storage';
import { createFileRecord } from '@/actions/file';

interface FileUploaderProps {
    projectId: string;
    taskId?: string;
    onUploadComplete: () => void;
    variant?: 'dropzone' | 'button' | 'compact';
    label?: string;
    className?: string;
    children?: React.ReactNode;
}

export function FileUploader({ projectId, taskId, onUploadComplete, variant = 'dropzone', label, className, children }: FileUploaderProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [uploadingFiles, setUploadingFiles] = useState<{ name: string; progress: number; status: 'uploading' | 'done' | 'error' }[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const files = Array.from(e.dataTransfer.files);
        if (files.length > 0) handleUpload(files);
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            handleUpload(Array.from(e.target.files));
        }
    };

    const handleUpload = async (files: File[]) => {
        const newUploads = files.map(f => ({ name: f.name, progress: 0, status: 'uploading' as const }));
        setUploadingFiles(prev => [...prev, ...newUploads]);

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            try {
                // 1. Get Presigned URL
                // Note: We use taskId 'general' if global upload, but better to use a random ID or project ID prefix
                const contextId = taskId || projectId;
                const { uploadUrl, publicUrl, error } = await getPresignedUploadUrl(contextId, file.name, file.type, projectId);

                if (error || !uploadUrl) throw new Error(error || 'Failed to get upload URL');

                // 2. Upload to R2
                const xhr = new XMLHttpRequest();
                xhr.open('PUT', uploadUrl, true);
                xhr.setRequestHeader('Content-Type', file.type);

                xhr.upload.onprogress = (e) => {
                    if (e.lengthComputable) {
                        const progress = Math.round((e.loaded / e.total) * 100);
                        setUploadingFiles(prev => prev.map(u => u.name === file.name ? { ...u, progress } : u));
                    }
                };

                await new Promise((resolve, reject) => {
                    xhr.onload = () => xhr.status === 200 ? resolve(true) : reject(new Error('Upload failed'));
                    xhr.onerror = () => reject(new Error('Network error'));
                    xhr.send(file);
                });

                // 3. Create Record
                await createFileRecord({
                    name: file.name,
                    url: publicUrl, // We accept public URL here, or reconstruct key.
                    size: file.size,
                    type: file.type,
                    projectId,
                    taskId
                });

                setUploadingFiles(prev => prev.map(u => u.name === file.name ? { ...u, status: 'done', progress: 100 } : u));

            } catch (error) {
                console.error(error);
                setUploadingFiles(prev => prev.map(u => u.name === file.name ? { ...u, status: 'error' } : u));
                toast.error(`Failed to upload ${file.name}`);
            }
        }

        onUploadComplete();
        // Clear success messages after delay
        setTimeout(() => {
            setUploadingFiles(prev => prev.filter(u => u.status !== 'done'));
        }, 3000);
    };

    const isCompact = variant === 'compact';

    return (
        <div className="space-y-4">
            <input
                type="file"
                multiple
                ref={fileInputRef}
                className="hidden"
                onChange={handleFileSelect}
            />

            {variant === 'dropzone' ? (
                <div
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all
                        ${isDragging ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' : 'border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600'}
                    `}
                >
                    <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-full mb-3">
                        <UploadCloud className={`w-6 h-6 ${isDragging ? 'text-indigo-600' : 'text-slate-400'}`} />
                    </div>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                        Click to upload or drag and drop
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                        Support multiple files. Max size 50MB.
                    </p>
                </div>
            ) : (
                <button
                    onClick={(e) => {
                        e.stopPropagation(); // Prevent card expansion if embedded
                        fileInputRef.current?.click();
                    }}
                    className={`
                        flex items-center gap-1.5 rounded text-xs font-bold cursor-pointer transition-colors h-7
                        ${variant === 'compact' && !className ? 'px-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800' : ''}
                        ${variant === 'button' && !className ? 'px-3 bg-indigo-600 text-white hover:bg-indigo-700' : ''}
                        ${className ? className : ''}
                        ${!className && variant === 'compact' ? 'px-2' : 'px-3'}
                    `}
                >
                    {children ? children : (
                        <>
                            <UploadCloud className="w-3.5 h-3.5" />
                            {label || (isCompact ? 'Upload' : 'Upload Files')}
                        </>
                    )}
                </button>
            )}

            {/* Upload Progress List */}
            {uploadingFiles.length > 0 && (
                <div className="space-y-2">
                    {uploadingFiles.map((file, idx) => (
                        <div key={idx} className="flex items-center gap-3 p-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800">
                            <FileIcon className="w-8 h-8 text-slate-400 p-1.5 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700" />
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-xs font-medium truncate max-w-[200px]">{file.name}</span>
                                    <span className="text-[10px] text-slate-500">
                                        {file.status === 'error' ? 'Failed' : file.status === 'done' ? 'Completed' : `${file.progress}%`}
                                    </span>
                                </div>
                                <div className="h-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full transition-all duration-300 ${file.status === 'error' ? 'bg-red-500' : file.status === 'done' ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                                        style={{ width: `${file.progress}%` }}
                                    />
                                </div>
                            </div>
                            {file.status === 'done' && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                            {file.status === 'error' && <X className="w-4 h-4 text-red-500" />}
                            {file.status === 'uploading' && <Loader2 className="w-4 h-4 text-indigo-500 animate-spin" />}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
