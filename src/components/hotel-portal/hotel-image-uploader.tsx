'use client';

import React, { useRef, useState } from 'react';
import { uploadHotelMediaFiles } from '@/lib/hotel-media-upload';
import { Button } from '@/components/ui/button';
import { ImagePlus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export type HotelMediaPhoto = {
    url: string;
    sort: number;
    caption?: string;
    category?: string;
    /** Link gallery photo to a room type (rooms category). */
    room_type_id?: string | null;
    /** Link gallery photo to a facility amenity key (facilities category). */
    amenity_key?: string | null;
    strapi_id?: number | null;
};

type Props = {
    hotelId: string;
    label?: string;
    category?: string;
    disabled?: boolean;
    /** Hint under the button (defaults to multi-upload copy). */
    hint?: string;
    onUploaded: (photos: HotelMediaPhoto[]) => void | Promise<void>;
};

const BATCH = 24;

/**
 * Multi-image Strapi uploader for hotel ads, room galleries, and facilities.
 * Accepts many files; uploads in batches so nginx/CMS limits don’t reject the set.
 */
export function HotelImageUploader({
    hotelId,
    label = 'Upload images',
    category,
    disabled,
    hint,
    onUploaded,
}: Props) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState<string | null>(null);

    const onPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const list = e.target.files;
        if (!list?.length) return;
        const files = Array.from(list);
        setUploading(true);
        setProgress(`0 / ${files.length}`);
        try {
            const all: HotelMediaPhoto[] = [];
            for (let i = 0; i < files.length; i += BATCH) {
                const chunk = files.slice(i, i + BATCH);
                setProgress(`${Math.min(i + chunk.length, files.length)} / ${files.length}`);
                const uploaded = await uploadHotelMediaFiles(chunk, hotelId);
                all.push(
                    ...uploaded.map((u, j) => ({
                        url: u.url,
                        sort: all.length + j,
                        category,
                        strapi_id: u.id,
                    })),
                );
            }
            if (!all.length) {
                throw new Error('No files returned from Strapi');
            }
            await onUploaded(all);
            toast.success(
                all.length === 1
                    ? '1 image uploaded'
                    : `${all.length} images uploaded for this gallery`,
            );
        } catch (err) {
            toast.error((err as Error).message || 'Upload failed');
        } finally {
            setUploading(false);
            setProgress(null);
            if (inputRef.current) inputRef.current.value = '';
        }
    };

    return (
        <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
                <input
                    ref={inputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    multiple
                    className="sr-only"
                    onChange={onPick}
                    disabled={disabled || uploading}
                />
                <Button
                    type="button"
                    variant="outline"
                    disabled={disabled || uploading}
                    onClick={() => inputRef.current?.click()}
                >
                    {uploading ? (
                        <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                    ) : (
                        <ImagePlus className="w-4 h-4 mr-1.5" />
                    )}
                    {uploading
                        ? `Uploading ${progress || '…'}`
                        : label}
                </Button>
            </div>
            <p className="text-xs text-slate-500">
                {hint ||
                    'Select many photos at once (exterior, rooms, ads). JPEG/PNG/WebP · auto-compressed · stored in Strapi and linked on this hotel.'}
            </p>
        </div>
    );
}
