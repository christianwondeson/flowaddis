'use client';

import { auth } from '@/lib/firebase';

/**
 * Hotel partner Nest calls. No global Preloader  pages already show
 * AdminLoader / table loading states (stacking both tanked performance).
 */
export async function hotelAdminFetch<T = unknown>(
    path: string,
    init?: RequestInit,
    _loadingLabel?: string,
): Promise<T> {
    const token = await auth?.currentUser?.getIdToken();
    if (!token) throw new Error('Not signed in');

    const res = await fetch(`/api/hotel-admin/${path.replace(/^\//, '')}`, {
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
}
