import { NextResponse } from 'next/server';
import { assertFirebaseAndNestAdmin, CmsAuthError } from '@/lib/assert-admin-cms';
import { isCmsResource, pickStrapiData, strapiFetch, type CmsResource } from '@/lib/strapi-server';

function mergePopulate(search: string): string {
    const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
    if (!params.has('populate')) {
        params.set('populate', '*');
    }
    return params.toString();
}

export async function GET(req: Request, ctx: { params: Promise<{ resource: string }> }) {
    const { resource } = await ctx.params;
    if (!isCmsResource(resource)) {
        return NextResponse.json({ error: 'Unknown CMS resource' }, { status: 404 });
    }

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
        const url = new URL(req.url);
        const qs = mergePopulate(url.search);
        const strapiRes = await strapiFetch(`/api/${resource}?${qs}`);
        const text = await strapiRes.text();
        let json: unknown;
        try {
            json = JSON.parse(text);
        } catch {
            return NextResponse.json(
                { error: 'Strapi returned non-JSON', detail: text.slice(0, 300) },
                { status: strapiRes.ok ? 500 : strapiRes.status },
            );
        }
        return NextResponse.json(json, { status: strapiRes.status });
    } catch (e) {
        console.error('CMS GET error:', e);
        if (e instanceof Error && e.message.includes('STRAPI')) {
            return NextResponse.json({ error: e.message }, { status: 503 });
        }
        return NextResponse.json({ error: 'CMS request failed' }, { status: 502 });
    }
}

export async function POST(req: Request, ctx: { params: Promise<{ resource: string }> }) {
    const { resource } = await ctx.params;
    if (!isCmsResource(resource)) {
        return NextResponse.json({ error: 'Unknown CMS resource' }, { status: 404 });
    }
    const cmsResource = resource as CmsResource;

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
        const body = (await req.json()) as { data?: Record<string, unknown> } | Record<string, unknown>;
        const raw = (body && typeof body === 'object' && 'data' in body && body.data) || body;
        if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
            return NextResponse.json({ error: 'Expected JSON object or { data: { ... } }' }, { status: 400 });
        }

        const data = pickStrapiData(cmsResource, raw as Record<string, unknown>);
        const strapiRes = await strapiFetch(`/api/${resource}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data }),
        });

        const text = await strapiRes.text();
        let json: unknown;
        try {
            json = JSON.parse(text);
        } catch {
            return NextResponse.json(
                { error: 'Strapi returned non-JSON', detail: text.slice(0, 500) },
                { status: strapiRes.ok ? 500 : strapiRes.status },
            );
        }
        return NextResponse.json(json, { status: strapiRes.status });
    } catch (e) {
        console.error('CMS POST error:', e);
        if (e instanceof Error && e.message.includes('STRAPI')) {
            return NextResponse.json({ error: e.message }, { status: 503 });
        }
        return NextResponse.json({ error: 'CMS create failed' }, { status: 400 });
    }
}
