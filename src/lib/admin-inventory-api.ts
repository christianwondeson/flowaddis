'use client';

import { auth } from '@/lib/firebase';
import { withRequestLoading } from '@/lib/request-loading';

/** Super Admin Nest inventory via `/api/admin/inventory/*` → `/api/v1/admin/*`. */
export async function adminInventoryFetch<T = unknown>(
    path: string,
    init?: RequestInit,
    loadingLabel?: string,
): Promise<T> {
    const method = (init?.method || 'GET').toUpperCase();
    const label =
        loadingLabel ||
        (method === 'GET'
            ? 'Loading…'
            : method === 'POST'
              ? 'Saving…'
              : method === 'PUT' || method === 'PATCH'
                ? 'Updating…'
                : 'Working…');

    return withRequestLoading(async () => {
        const token = await auth?.currentUser?.getIdToken();
        if (!token) throw new Error('Not signed in');

        const res = await fetch(`/api/admin/inventory/${path.replace(/^\//, '')}`, {
            ...init,
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
                ...(init?.headers || {}),
            },
            cache: 'no-store',
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
            throw new Error(
                (data as { error?: string }).error ||
                    (data as { message?: string }).message ||
                    `HTTP ${res.status}`,
            );
        }
        return data as T;
    }, label);
}
