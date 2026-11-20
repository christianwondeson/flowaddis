'use client';

import { auth } from '@/lib/firebase';
import { withRequestLoading } from '@/lib/request-loading';

/**
 * Super Admin Nest inventory via `/api/admin/inventory/*` → `/api/v1/admin/*`.
 * GET queries execute without global blocking overlays so individual pages
 * can render their own non-blocking in-content loaders (avoiding duplicate preloaders).
 * Mutations (POST, PUT, DELETE) use withRequestLoading when requested.
 */
export async function adminInventoryFetch<T = unknown>(
    path: string,
    init?: RequestInit,
    loadingLabel?: string,
): Promise<T> {
    const method = (init?.method || 'GET').toUpperCase();
    const isMutation = method !== 'GET' && method !== 'HEAD';

    const executeFetch = async (): Promise<T> => {
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
    };

    // Only apply global requestLoading to mutations (POST, PUT, DELETE) or when an explicit loadingLabel is given.
    // Standard GET reads should NEVER trigger a global full-screen preloader overlay.
    if (isMutation || (loadingLabel && method !== 'GET')) {
        const label =
            loadingLabel ||
            (method === 'POST'
                ? 'Saving…'
                : method === 'PUT' || method === 'PATCH'
                  ? 'Updating…'
                  : 'Working…');
        return withRequestLoading(executeFetch, label);
    }

    return executeFetch();
}
