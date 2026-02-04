'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { uploadBulkFile, getDecisionCenterData } from '@/lib/api';
import { useData } from '@/context/DataContext';

interface BulkFileUploadProps {
    sessionId?: string | null;
    onUploadComplete?: () => void;
}

export default function BulkFileUpload({ sessionId: propSessionId, onUploadComplete }: BulkFileUploadProps) {
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const { sessionId: contextSessionId, setDecisionData } = useData();
    const sessionId = propSessionId || contextSessionId;

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        if (!sessionId || acceptedFiles.length === 0) return;

        const file = acceptedFiles[0];
        setUploading(true);
        setError(null);
        setSuccess(false);

        try {
            await uploadBulkFile(file, sessionId);
            setSuccess(true);

            // Refresh decision data to include budget saturation info
            const newData = await getDecisionCenterData(sessionId);
            setDecisionData(newData);
            onUploadComplete?.();

        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to upload file');
        } finally {
            setUploading(false);
        }
    }, [sessionId, setDecisionData, onUploadComplete]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
        },
        maxFiles: 1,
        disabled: uploading || !sessionId,
    });

    if (success) {
        return (
            <div className="flex items-center gap-3 p-4 rounded-lg bg-[var(--success)]/10 border border-[var(--success)]/30">
                <CheckCircle className="w-5 h-5 text-[var(--success)]" />
                <div>
                    <p className="font-medium text-[var(--success)]">Budget Data Loaded</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer
                    ${isDragActive ? 'border-[var(--primary-500)] bg-[var(--primary-500)]/50' : 'border-[var(--border)] hover:border-[var(--primary-500)]'}
                    ${uploading ? 'opacity-50 cursor-not-allowed' : ''}
                `}
            >
                <input {...getInputProps()} />
                <div className="flex flex-col items-center gap-2">
                    {uploading ? (
                        <Loader2 className="w-6 h-6 animate-spin text-[var(--primary-500)]" />
                    ) : (
                        <Upload className="w-6 h-6 text-[var(--foreground-muted)]" />
                    )}
                    <div className="text-sm">
                        <span className="font-medium">Upload Bulk File</span> (Optional)
                    </div>
                    <p className="text-xs text-[var(--foreground-muted)]">
                        To analyze Budget Saturation
                    </p>
                </div>
            </div>

            {error && (
                <div className="text-sm text-[var(--error)] flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                </div>
            )}
        </div>
    );
}
