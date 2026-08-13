import { auth } from '@/lib/firebase';
import { resolveStrapiFileUrl } from '@/lib/admin-cms-client';
import { compressImagesForUpload } from '@/lib/compress-image';

export type UploadedHotelMedia = {
    id: number | null;
    url: string;
    name?: string;
    mime?: string;
};

async function getBearer(): Promise<string> {
    if (!auth?.currentUser) throw new Error('Please sign in.');
    const token = await auth.currentUser.getIdToken(true);
    return `Bearer ${token}`;
}

function friendlyUploadError(status: number, raw: string): string {
    if (status === 413 || /413|entity too large|payload too large/i.test(raw)) {
        return (
            'Image too large for the CMS server (nginx 413). ' +
            'We compress before upload  try fewer/smaller photos, or raise ' +
            'client_max_body_size on the Strapi nginx host (cms.bookaddis.com). ' +
            'For local uploads use STRAPI_URL=http://127.0.0.1:1337 in .env.local.'
        );
    }
    return raw || `Upload failed (${status})`;
}

/**
 * Upload images via Strapi (hotel-admin proxy). Returns public URLs + Strapi ids
 * to store on Nest hotel/room media.photos alongside pricing.
 */
export async function uploadHotelMediaFiles(
    files: File[],
    hotelId?: string,
): Promise<UploadedHotelMedia[]> {
    if (files.length === 0) return [];
    const authorization = await getBearer();
    const compressed = await compressImagesForUpload(files);
    const fd = new FormData();
    for (const f of compressed) {
        fd.append('files', f);
    }
    if (hotelId) {
        fd.append('hotelId', hotelId);
    }

    const res = await fetch('/api/hotel-admin/upload', {
        method: 'POST',
        headers: { Authorization: authorization },
        body: fd,
    });
    const payload = await res.json().catch(() => ({}));
    if (!res.ok) {
        const raw =
            (payload as { error?: string }).error ||
            (payload as { message?: string }).message ||
            '';
        throw new Error(friendlyUploadError(res.status, raw));
    }

    const list = Array.isArray((payload as { files?: unknown }).files)
        ? (payload as { files: UploadedHotelMedia[] }).files
        : [];

    return list.map((f) => ({
        ...f,
        url: resolveStrapiFileUrl(f.url) || f.url,
    }));
}
