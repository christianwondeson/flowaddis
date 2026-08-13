'use client';

import { useEffect, useState } from 'react';
import { getPublicEtbPerUsd } from '@/lib/etb-usd';

type FxState = {
    etbPerUsd: number;
    source: string;
    loading: boolean;
};

let cached: { etbPerUsd: number; source: string; at: number } | null = null;
const CACHE_MS = 5 * 60 * 1000;

/**
 * Live ETB per USD for converting RapidAPI USD listing prices to ETB display.
 */
export function useEtbUsdRate(): FxState {
    const [state, setState] = useState<FxState>({
        etbPerUsd: cached?.etbPerUsd ?? getPublicEtbPerUsd(),
        source: cached?.source ?? 'env_fallback',
        loading: !cached,
    });

    useEffect(() => {
        let cancelled = false;
        const now = Date.now();
        if (cached && now - cached.at < CACHE_MS) {
            setState({
                etbPerUsd: cached.etbPerUsd,
                source: cached.source,
                loading: false,
            });
            return;
        }

        (async () => {
            try {
                const res = await fetch('/api/fx/etb-usd', { cache: 'no-store' });
                const data = await res.json();
                const rate = Number(data?.etbPerUsd);
                if (!cancelled && Number.isFinite(rate) && rate > 0) {
                    cached = {
                        etbPerUsd: rate,
                        source: String(data.source || 'cbe_remittance'),
                        at: Date.now(),
                    };
                    setState({
                        etbPerUsd: rate,
                        source: cached.source,
                        loading: false,
                    });
                    return;
                }
            } catch {
                /* fallback below */
            }
            if (!cancelled) {
                const fb = getPublicEtbPerUsd();
                setState({
                    etbPerUsd: fb,
                    source: 'env_fallback',
                    loading: false,
                });
            }
        })();

        return () => {
            cancelled = true;
        };
    }, []);

    return state;
}
