'use client';

import { useEffect, useLayoutEffect, useRef } from 'react';
import { useAuth } from '@/components/providers/auth-provider';
import { useTripStore } from '@/store/trip-store';
import { clearTripCartSession, loadTripCart, persistTripCart } from '@/lib/trip-cart-session';
import { toast } from 'sonner';

/**
 * Keeps the Zustand trip cart in sync with sessionStorage (same tab):
 * - Anonymous users: survive refresh; after sign-in, cart merges into the account session.
 * - Logout: clears cart + session (shared computer hygiene).
 *
 * Not cross-tab (sessionStorage). Not a substitute for server-backed wishlists.
 */
export function TripCartSessionBridge() {
    const { user, loading: authLoading } = useAuth();
    const prevUserIdRef = useRef<string | null | undefined>(undefined);

    /** Hydrate before subscribe runs so we never persist [] over a saved session. */
    useLayoutEffect(() => {
        if (typeof window === 'undefined') return;
        const { currentTrip, replaceCart } = useTripStore.getState();
        if (currentTrip.length > 0) return;
        const saved = loadTripCart();
        if (saved?.length) {
            replaceCart(saved);
        }
    }, []);

    useEffect(() => {
        return useTripStore.subscribe((state) => {
            persistTripCart(state.currentTrip);
        });
    }, []);

    useEffect(() => {
        if (authLoading) return;
        const id = user?.id ?? null;
        const prev = prevUserIdRef.current;

        if (prev === undefined) {
            prevUserIdRef.current = id;
            return;
        }

        if (prev !== null && id === null) {
            clearTripCartSession();
            useTripStore.getState().clearTrip();
            prevUserIdRef.current = id;
            return;
        }

        if (prev === null && id !== null) {
            const saved = loadTripCart();
            if (saved?.length) {
                const added = useTripStore.getState().mergeFromPendingSession(saved);
                clearTripCartSession();
                persistTripCart(useTripStore.getState().currentTrip);
                if (added > 0) {
                    toast.success('Saved trip items are now on your account.');
                }
            }
        }

        prevUserIdRef.current = id;
    }, [user, authLoading]);

    return null;
}
