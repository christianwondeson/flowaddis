import { auth } from '@/lib/firebase';

async function getBearer(): Promise<string> {
    if (!auth?.currentUser) throw new Error('Please sign in.');
    const token = await auth.currentUser.getIdToken(true);
    return `Bearer ${token}`;
}

/** Upload one or more images to Strapi via Next proxy. Returns Strapi file id list (same order as input). */
export async function uploadCmsFiles(files: File[]): Promise<number[]> {
    if (files.length === 0) return [];
    const authorization = await getBearer();
    const fd = new FormData();
    for (const f of files) {
        fd.append('files', f);
    }
    const res = await fetch('/api/admin/cms/upload', {
        method: 'POST',
        headers: { Authorization: authorization },
        body: fd,
    });
    const payload = await res.json().catch(() => ({}));
    if (!res.ok) {
        throw new Error((payload as { error?: string }).error || res.statusText || 'Upload failed');
    }
    const arr = Array.isArray(payload) ? payload : (payload as { data?: unknown }).data;
    const list = Array.isArray(arr) ? arr : [];
    const ids = list.map((item: { id?: number }) => item.id).filter((id): id is number => typeof id === 'number');
    if (ids.length !== files.length) {
        console.warn('CMS upload: id count mismatch', { expected: files.length, got: ids.length });
    }
    return ids;
}

export async function cmsCreate(resource: string, data: Record<string, unknown>): Promise<unknown> {
    const authorization = await getBearer();
    const res = await fetch(`/api/admin/cms/${resource}`, {
        method: 'POST',
        headers: {
            Authorization: authorization,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data }),
    });
    const payload = await res.json().catch(() => ({}));
    if (!res.ok) {
        const err = (payload as { error?: { message?: string }; message?: string }).error?.message
            || (payload as { error?: string }).error
            || (payload as { message?: string }).message;
        throw new Error(err || `Create failed (${res.status})`);
    }
    return payload;
}

export async function cmsList(resource: string, searchParams?: Record<string, string>): Promise<unknown> {
    const authorization = await getBearer();
    const qs = new URLSearchParams(searchParams || {});
    if (!qs.has('populate')) qs.set('populate', '*');
    if (!qs.has('pagination[pageSize]')) qs.set('pagination[pageSize]', '100');
    const res = await fetch(`/api/admin/cms/${resource}?${qs.toString()}`, {
        headers: { Authorization: authorization },
    });
    const payload = await res.json().catch(() => ({}));
    if (!res.ok) {
        throw new Error((payload as { error?: string }).error || 'Failed to load list');
    }
    return payload;
}

export function flattenStrapiList(json: unknown): Record<string, unknown>[] {
    const root = json as { data?: unknown[] };
    const data = root?.data;
    if (!Array.isArray(data)) return [];
    return data.map((rowUnknown) => {
        const row = rowUnknown as Record<string, unknown>;
        const attrs = row.attributes as Record<string, unknown> | undefined;
        if (attrs && typeof attrs === 'object') {
            return { id: row.id, documentId: row.documentId, ...attrs };
        }
        const { id, documentId, ...rest } = row;
        return { id, documentId, ...rest };
    });
}

/** Public Strapi origin for building image URLs in the browser (e.g. http://localhost:1337). */
export function strapiPublicBase(): string {
    if (typeof window === 'undefined') return '';
    return (process.env.NEXT_PUBLIC_STRAPI_URL || '').replace(/\/$/, '');
}

export function resolveStrapiFileUrl(path?: string | null): string | null {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    const base = strapiPublicBase();
    if (!base) return path.startsWith('/') ? path : `/${path}`;
    return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}

/** Resolve first media URL from Strapi populate (single relation). */
export function getStrapiSingleMediaUrl(field: unknown): string | null {
    const f = field as {
        data?: { attributes?: { url?: string }; url?: string } | null;
    };
    const d = f?.data;
    if (!d || Array.isArray(d)) return null;
    const inner = d as { attributes?: { url?: string }; url?: string };
    const url = inner.attributes?.url ?? inner.url;
    return resolveStrapiFileUrl(url ?? null);
}
