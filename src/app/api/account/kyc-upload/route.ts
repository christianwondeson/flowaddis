import { NextResponse } from 'next/server';
import { verifyFirebaseIdToken } from '@/lib/verify-firebase-id-token';
import {
    formatStrapiErrorBody,
    getStrapiOriginForLogs,
    strapiFetch,
} from '@/lib/strapi-server';
import { resolveStrapiFileUrlServer } from '@/lib/strapi-public-url';

export const dynamic = 'force-dynamic';

const MAX_FILES = 4;
const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED = new Set([
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'application/pdf',
]);

/**
 * Signed-in users uploading hotel partner KYC documents (logo, license, etc.).
 */
export async function POST(req: Request) {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    try {
        await verifyFirebaseIdToken(authHeader.slice(7).trim());
    } catch {
        return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    try {
        const incoming = await req.formData();
        const files: File[] = [];
        for (const [, value] of incoming.entries()) {
            if (value instanceof File && value.size > 0) files.push(value);
        }
        if (!files.length) {
            return NextResponse.json({ error: 'No files provided' }, { status: 400 });
        }
        if (files.length > MAX_FILES) {
            return NextResponse.json({ error: `Max ${MAX_FILES} files` }, { status: 400 });
        }
        for (const f of files) {
            if (f.size > MAX_BYTES) {
                return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 400 });
            }
            if (!ALLOWED.has((f.type || '').toLowerCase())) {
                return NextResponse.json(
                    { error: 'Only JPEG, PNG, WebP, GIF, or PDF allowed' },
                    { status: 400 },
                );
            }
        }

        const outgoing = new FormData();
        for (const f of files) outgoing.append('files', f);

        let strapiRes: Response;
        try {
            strapiRes = await strapiFetch('/api/upload', {
                method: 'POST',
                body: outgoing,
            });
        } catch (err) {
            const cause = err instanceof Error ? String((err as Error & { cause?: unknown }).cause || err.message) : '';
            const origin = getStrapiOriginForLogs();
            console.error('[kyc-upload] Strapi unreachable', origin, cause);
            return NextResponse.json(
                {
                    error:
                        `Cannot reach Strapi at ${origin}. Start flowaddis-cms (npm run develop) and set STRAPI_URL=http://127.0.0.1:1337 in .env.local.`,
                    code: 'STRAPI_UNREACHABLE',
                },
                { status: 503 },
            );
        }

        const text = await strapiRes.text();
        if (!strapiRes.ok) {
            const origin = getStrapiOriginForLogs();
            const detail = formatStrapiErrorBody(text, strapiRes.status);
            console.error('[kyc-upload] Strapi rejected', origin, detail);
            if (strapiRes.status === 401 || strapiRes.status === 403) {
                return NextResponse.json(
                    {
                        error:
                            `Strapi rejected the API token (${origin}). For local CMS, create a Full access token at ${origin}/admin → Settings → API Tokens, put it in flowaddis/.env.local as STRAPI_API_TOKEN, and restart Next.`,
                        code: 'STRAPI_UNAUTHORIZED',
                        detail,
                    },
                    { status: 502 },
                );
            }
            return NextResponse.json(
                { error: detail, code: 'STRAPI_UPLOAD_FAILED' },
                { status: 502 },
            );
        }
        const json = JSON.parse(text) as unknown;
        const arr = Array.isArray(json) ? json : (json as { data?: unknown }).data;
        const list = Array.isArray(arr) ? arr : [];
        const filesOut = list.map((item: Record<string, unknown>) => {
            const id = typeof item.id === 'number' ? item.id : Number(item.id);
            const rawUrl = typeof item.url === 'string' ? item.url : '';
            return {
                id: Number.isFinite(id) ? id : null,
                url: resolveStrapiFileUrlServer(rawUrl) || rawUrl,
            };
        });
        return NextResponse.json({ files: filesOut });
    } catch (e) {
        const msg = e instanceof Error ? e.message : 'Upload failed';
        console.error('[kyc-upload]', e, getStrapiOriginForLogs());
        if (msg.includes('STRAPI_')) {
            return NextResponse.json({ error: msg, code: 'STRAPI_CONFIG' }, { status: 503 });
        }
        return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
    }
}
