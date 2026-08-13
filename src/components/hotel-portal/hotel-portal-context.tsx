'use client';

import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import { hotelAdminFetch } from '@/lib/hotel-admin-api';

export type PortalHotel = {
    id: string;
    name: string;
    city?: string | null;
    status?: string;
    inventory_source?: string;
    amenities?: Record<string, unknown> | null;
    media?: Record<string, unknown> | null;
    description?: string | null;
    default_currency?: string;
    membership_role?: string;
};

type Ctx = {
    hotels: PortalHotel[];
    loading: boolean;
    error: string | null;
    refresh: () => Promise<void>;
};

const HotelPortalContext = createContext<Ctx | null>(null);

export function HotelPortalProvider({ children }: { children: React.ReactNode }) {
    const [hotels, setHotels] = useState<PortalHotel[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const hasLoadedRef = useRef(false);

    const refresh = useCallback(async () => {
        // Stale-while-revalidate: only block the shell on the first load.
        if (!hasLoadedRef.current) setLoading(true);
        setError(null);
        try {
            const data = await hotelAdminFetch<{ items: PortalHotel[] }>('hotels');
            setHotels(Array.isArray(data.items) ? data.items : []);
            hasLoadedRef.current = true;
        } catch (e) {
            const msg = (e as Error).message || 'Failed to load hotels';
            setError(
                msg.includes('timed out') || msg.includes('Upstream') || msg.includes('Nest')
                    ? `${msg} Restart Nest (port 4000) and ensure the Postgres SSH tunnel is alive.`
                    : msg,
            );
            if (!hasLoadedRef.current) setHotels([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void refresh();
    }, [refresh]);

    const value = useMemo(
        () => ({ hotels, loading, error, refresh }),
        [hotels, loading, error, refresh],
    );

    return (
        <HotelPortalContext.Provider value={value}>
            {children}
        </HotelPortalContext.Provider>
    );
}

export function useHotelPortal() {
    const ctx = useContext(HotelPortalContext);
    if (!ctx) {
        throw new Error('useHotelPortal must be used within HotelPortalProvider');
    }
    return ctx;
}

/** Safe outside HotelPortalProvider (e.g. Super Admin inventory). */
export function useHotelPortalOptional() {
    return useContext(HotelPortalContext);
}
