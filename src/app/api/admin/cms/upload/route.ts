import { NextResponse } from 'next/server';
import { assertFirebaseAndNestAdmin, CmsAuthError } from '@/lib/assert-admin-cms';
import { strapiFetch } from '@/lib/strapi-server';

const MAX_FILES = 10;
const MAX_BYTES_PER_FILE = 10 * 1024 * 1024;
const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

export async function POST(req: Request) {
    try {
        await assertFirebaseAndNestAdmin(req);
    } catch (e) {
        if (e instanceof CmsAuthError) {
            return NextResponse.json({ error: e.message }, { status: e.status });
        }
        if (e instanceof Error && e.message.includes('STRAPI')) {
            return NextResponse.json({ error: 'CMS is not configured (STRAPI_URL / STRAPI_API_TOKEN).' }, { status: 503 });
        }
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const incoming = await req.formData();
        const files: File[] = [];
        for (const [, value] of incoming.entries()) {
            if (value instanceof File && value.size > 0) {
                files.push(value);
            }
        }
        if (files.length === 0) {
            return NextResponse.json({ error: 'No files provided (multipart field "files").' }, { status: 400 });
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
                    { error: `File too large (max ${MAX_BYTES_PER_FILE / (1024 * 1024)}MB per file).` },
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

        const strapiRes = await strapiFetch('/api/upload', {
            method: 'POST',
            body: outgoing,
        });

        const text = await strapiRes.text();
        let json: unknown;
        try {
            json = JSON.parse(text);
        } catch {
            return NextResponse.json(
                { error: 'Strapi upload returned non-JSON', detail: text.slice(0, 500) },
                { status: strapiRes.ok ? 500 : strapiRes.status },
            );
        }

        return NextResponse.json(json, { status: strapiRes.status });
    } catch (e) {
        console.error('CMS upload error:', e);
        return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
    }
}
