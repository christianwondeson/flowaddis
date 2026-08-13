import { NextResponse } from 'next/server';
import { getSafeBackendBaseUrl } from '@/lib/safe-backend-url';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const backend = getSafeBackendBaseUrl();
        const url = new URL(`${backend}/api/v1/guest/shuttles`);
        for (const key of ['city', 'maxPrice', 'minCapacity'] as const) {
            const v = searchParams.get(key);
            if (v) url.searchParams.set(key, v);
        }
        const res = await fetch(url.toString(), { next: { revalidate: 30 } });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
            return NextResponse.json(
                { error: data?.message || 'Failed to load shuttles' },
                { status: res.status },
            );
        }
        return NextResponse.json(data);
    } catch (e) {
        console.error('guest shuttles', e);
        return NextResponse.json({ error: 'Proxy failed' }, { status: 502 });
    }
}
