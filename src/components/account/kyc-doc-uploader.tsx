'use client';

import React, { useRef, useState } from 'react';
import { auth } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { ImagePlus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { withRequestLoading } from '@/lib/request-loading';
import { compressImageForUpload } from '@/lib/compress-image';

type Props = {
    label: string;
    onUploaded: (url: string) => void;
};

export function KycDocUploader({ label, onUploaded }: Props) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);

    const onPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        try {
            await withRequestLoading(async () => {
                const token = await auth?.currentUser?.getIdToken(true);
                if (!token) {
                    throw new Error(
                        'Sign in required  finish the account step before uploading KYC documents.',
                    );
                }
                const optimized = await compressImageForUpload(file, {
                    maxEdge: 1600,
                    maxBytes: 900 * 1024,
                });
                const fd = new FormData();
                fd.append('files', optimized);
                const res = await fetch('/api/account/kyc-upload', {
                    method: 'POST',
                    headers: { Authorization: `Bearer ${token}` },
                    body: fd,
                });
                const data = await res.json().catch(() => ({}));
                if (!res.ok) {
                    throw new Error(
                        (data as { error?: string }).error ||
                            (res.status === 401
                                ? 'Session expired  refresh and sign in again.'
                                : 'Upload failed'),
                    );
                }
                const url = (data as { files?: Array<{ url?: string }> }).files?.[0]
                    ?.url;
                if (!url) throw new Error('No URL returned');
                onUploaded(url);
                toast.success('Document uploaded');
            }, 'Uploading document…');
        } catch (err) {
            toast.error((err as Error).message || 'Upload failed');
        } finally {
            setUploading(false);
            if (inputRef.current) inputRef.current.value = '';
        }
    };

    return (
        <div className="flex flex-wrap items-center gap-2">
            <input
                ref={inputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif,application/pdf,.pdf"
                className="sr-only"
                onChange={onPick}
                disabled={uploading}
            />
            <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={uploading}
                onClick={() => inputRef.current?.click()}
            >
                {uploading ? (
                    <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                ) : (
                    <ImagePlus className="w-4 h-4 mr-1.5" />
                )}
                {label}
            </Button>
        </div>
    );
}
