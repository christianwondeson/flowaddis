import { NextResponse } from 'next/server';
import {
    assertHotelPortalAccess,
    HotelPortalAuthError,
} from '@/lib/assert-hotel-portal';
import {
    formatStrapiErrorBody,
    getStrapiOriginForLogs,
    strapiFetch,
} from '@/lib/strapi-server';
import { resolveStrapiFileUrlServer } from '@/lib/strapi-public-url';

export const dynamic = 'force-dynamic';

/** Per-request batch size (uploader chunks larger multi-selects). */
const MAX_FILES = 24;
const MAX_BYTES_PER_FILE = 10 * 1024 * 1024;
const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

/**
 * Hotel Admin Strapi upload  same media pipeline as Super Admin CMS,
 * gated to hotel portal roles. Returns absolute public URLs for Nest media.photos.
 *
 * POST multipart: files (+ optional hotelId for membership check)
 */
export async function POST(req: Request) {
    try {
        const incoming = await req.formData();
        const hotelIdRaw = incoming.get('hotelId');
        const hotelId =
            typeof hotelIdRaw === 'string' && hotelIdRaw.trim()
                ? hotelIdRaw.trim()
                : null;

        await assertHotelPortalAccess(req, hotelId);

        const files: File[] = [];
        for (const [key, value] of incoming.entries()) {
            if (key === 'hotelId') continue;
            if (value instanceof File && value.size > 0) {
                files.push(value);
            }
        }
        if (files.length === 0) {
            return NextResponse.json(
                { error: 'No files provided (multipart field "files").' },
                { status: 400 },
            );
        }
        if (files.length > MAX_FILES) {
            return NextResponse.json(
                { error: `Too many files (max ${MAX_FILES}).` },
                { status: 400 },
            );
        }
        for (const f of files) {
            if (f.size > MAX_BYTES_PER_FILE) {
                return NextResponse.json(
                    {
                        error: `File too large (max ${MAX_BYTES_PER_FILE / (1024 * 1024)}MB per file).`,
                    },
                    { status: 400 },
                );
            }
            const type = (f.type || '').toLowerCase();
            if (!type || !ALLOWED_MIME.has(type)) {
                return NextResponse.json(
                    { error: 'Only JPEG, PNG, WebP, and GIF images are allowed.' },
                    { status: 400 },
                );
            }
        }

        const outgoing = new FormData();
        for (const f of files) {
            outgoing.append('files', f);
        }

        const strapiOrigin = getStrapiOriginForLogs();
        const strapiRes = await strapiFetch('/api/upload', {
            method: 'POST',
            body: outgoing,
        });

        const text = await strapiRes.text();
        if (!strapiRes.ok) {
            const detail = formatStrapiErrorBody(text, strapiRes.status);
            console.error('[hotel-admin upload]', detail, {
                strapiOrigin,
                fileCount: files.length,
                totalBytes: files.reduce((n, f) => n + f.size, 0),
            });
            const is413 =
                strapiRes.status === 413 ||
                /413|entity too large|payload too large/i.test(detail);
            return NextResponse.json(
                {
                    error: is413
                        ? `Strapi/nginx rejected the upload (413 Payload Too Large) at ${strapiOrigin}. Raise client_max_body_size on that host, or use a local Strapi (STRAPI_URL=http://127.0.0.1:1337). Client now compresses images  retry with fewer files.`
                        : detail,
                },
                { status: strapiRes.status },
            );
        }

        let json: unknown;
        try {
            json = JSON.parse(text);
        } catch {
            return NextResponse.json(
                { error: 'Strapi upload returned non-JSON' },
                { status: 500 },
            );
        }

        const arr = Array.isArray(json)
            ? json
            : (json as { data?: unknown }).data;
        const list = Array.isArray(arr) ? arr : [];

        const filesOut = list.map((item: Record<string, unknown>) => {
            const id = typeof item.id === 'number' ? item.id : Number(item.id);
            const rawUrl = typeof item.url === 'string' ? item.url : '';
            const url = resolveStrapiFileUrlServer(rawUrl) || rawUrl;
            return {
                id: Number.isFinite(id) ? id : null,
                url,
                name: typeof item.name === 'string' ? item.name : undefined,
                mime: typeof item.mime === 'string' ? item.mime : undefined,
            };
        });

        console.info('[hotel-admin upload] ok', {
            strapiOrigin,
            fileCount: filesOut.length,
            hotelId,
        });

        return NextResponse.json({ files: filesOut });
    } catch (e) {
        if (e instanceof HotelPortalAuthError) {
            return NextResponse.json({ error: e.message }, { status: e.status });
        }
        const msg = e instanceof Error ? e.message : String(e);
        console.error('[hotel-admin upload] failed:', msg, {
            strapi: getStrapiOriginForLogs(),
        });
        if (msg.includes('STRAPI')) {
            return NextResponse.json(
                {
                    error:
                        'Strapi is not configured (STRAPI_URL / STRAPI_API_TOKEN / NEXT_PUBLIC_STRAPI_URL).',
                },
                { status: 503 },
            );
        }
        return NextResponse.json({ error: 'Upload failed', detail: msg }, { status: 500 });
    }
}
