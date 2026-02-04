'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { uploadFile, getKPIs, getCampaigns, getMonthlyData, getFilters } from '@/lib/api';
import { useData } from '@/context/DataContext';

interface FileUploadProps {
    onUploadComplete?: () => void;
    onSessionCreated?: (sessionId: string) => void;
    autoNavigate?: boolean;
}

export default function FileUpload({ onUploadComplete, onSessionCreated, autoNavigate = true }: FileUploadProps) {
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);

    const { setSessionId, setKpis, setCampaigns, setMonthlyData, setFilters, setIsLoading } = useData();

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        if (acceptedFiles.length === 0) return;

        const file = acceptedFiles[0];
        setUploadedFile(file);
        setUploading(true);
        setError(null);
        setSuccess(false);
        setIsLoading(true);

        try {
            // Upload file
            const uploadResult = await uploadFile(file);
            const sessionId = uploadResult.session_id;

            // Notify parent
            if (onSessionCreated) {
                onSessionCreated(sessionId);
            }

            // Setting session ID triggers data fetch in DataContext
            // Only do this if autoNavigate is true
            if (autoNavigate) {
                setSessionId(sessionId);
            }

            setSuccess(true);
            onUploadComplete?.();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to upload file');
            setUploading(false); // Only set uploading false on error, success unmounts (if autoNavigate)
            setIsLoading(false);
        }
    }, [setSessionId, onUploadComplete, onSessionCreated, autoNavigate, setIsLoading]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'text/csv': ['.csv'],
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
            'application/vnd.ms-excel': ['.xls'],
        },
        maxFiles: 1,
        disabled: uploading,
    });

    return (
        <div className="space-y-4">
            <div
                {...getRootProps()}
                className={`dropzone ${isDragActive ? 'active' : ''} ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
                <input {...getInputProps()} />

                <div className="flex flex-col items-center gap-4">
                    {uploading ? (
                        <>
                            <Loader2 className="w-12 h-12 text-[var(--primary-500)] animate-spin" />
                            <div className="text-center">
                                <p className="font-medium">Processing your file...</p>
                                <p className="text-sm text-[var(--foreground-muted)]">This may take a moment</p>
                            </div>
                        </>
                    ) : success ? (
                        <>
                            <div className="w-16 h-16 rounded-full bg-[var(--success)]/10 flex items-center justify-center">
                                <CheckCircle className="w-8 h-8 text-[var(--success)]" />
                            </div>
                            <div className="text-center">
                                <p className="font-medium text-[var(--success)]">Upload Successful!</p>
                                <p className="text-sm text-[var(--foreground-muted)]">
                                    {uploadedFile?.name}
                                </p>
                            </div>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setSuccess(false);
                                    setUploadedFile(null);
                                }}
                                className="btn-secondary text-sm"
                            >
                                Upload Another File
                            </button>
                        </>
                    ) : (
                        <>
                            <div className="w-16 h-16 rounded-full bg-[var(--primary-500)]/10 flex items-center justify-center">
                                {isDragActive ? (
                                    <FileSpreadsheet className="w-8 h-8 text-[var(--primary-500)]" />
                                ) : (
                                    <Upload className="w-8 h-8 text-[var(--primary-500)]" />
                                )}
                            </div>
                            <div className="text-center">
                                <p className="font-medium">
                                    {isDragActive ? 'Drop your file here' : 'Drag & drop your Search Term Report'}
                                </p>
                                <p className="text-sm text-[var(--foreground-muted)] mt-1">
                                    or click to browse (CSV, XLSX)
                                </p>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {error && (
                <div className="flex items-center gap-3 p-4 rounded-lg bg-[var(--error)]/10 border border-[var(--error)]/30">
                    <AlertCircle className="w-5 h-5 text-[var(--error)] flex-shrink-0" />
                    <div>
                        <p className="font-medium text-[var(--error)]">Upload Failed</p>
                        <p className="text-sm text-[var(--foreground-muted)]">{error}</p>
                    </div>
                </div>
            )}

            {/* Help text */}
            <div className="text-center text-sm text-[var(--foreground-muted)]">
                <p>Supported: Amazon Search Term Report</p>
                <p>Required columns: Campaign Name, Ad Group Name, Search Term, Impressions, Clicks, Spend, Sales</p>
            </div>
        </div>
    );
}
