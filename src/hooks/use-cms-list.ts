'use client';

import { useCallback, useEffect, useState } from 'react';
import { cmsList, flattenStrapiList } from '@/lib/admin-cms-client';

export function useCmsList(resource: string) {
    const [items, setItems] = useState<Record<string, unknown>[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const refetch = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const json = await cmsList(resource);
            setItems(flattenStrapiList(json));
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to load');
            setItems([]);
        } finally {
            setLoading(false);
        }
    }, [resource]);

    useEffect(() => {
        void refetch();
    }, [refetch]);

    return { items, loading, error, refetch };
}
