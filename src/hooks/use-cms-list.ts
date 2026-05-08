'use client';

import { useCallback, useEffect, useState } from 'react';
import { cmsList, flattenStrapiList, AdminCmsFetchError } from '@/lib/admin-cms-client';
import type { AdminCmsErrorCode } from '@/lib/admin-cms-error-codes';

export function useCmsList(resource: string) {
    const [items, setItems] = useState<Record<string, unknown>[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [errorCode, setErrorCode] = useState<AdminCmsErrorCode | null>(null);

    const refetch = useCallback(async () => {
        setLoading(true);
        setError(null);
        setErrorCode(null);
        try {
            const json = await cmsList(resource);
            setItems(flattenStrapiList(json));
        } catch (e) {
            if (e instanceof AdminCmsFetchError) {
                setError(e.message);
                setErrorCode(e.code ?? null);
            } else {
                setError(e instanceof Error ? e.message : 'Failed to load');
                setErrorCode(null);
            }
            setItems([]);
        } finally {
            setLoading(false);
        }
    }, [resource]);

    useEffect(() => {
        void refetch();
    }, [refetch]);

    return { items, loading, error, errorCode, refetch };
}
