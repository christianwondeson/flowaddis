'use client';

import { useEffect, useState } from 'react';
import { auth, db } from '@/lib/firebase';
import { collection, getDocs, limit, query, where } from 'firebase/firestore';
import type { CustomerBookingSummary } from '@/types/customer-booking';
import type { Trip } from '@/store/trip-store';
import { normalizeFirestoreTrip } from '@/lib/normalize-firestore-trip';

export interface UseMyTripsDataResult {
    bookings: CustomerBookingSummary[];
    firestoreTrips: Trip[];
    loading: boolean;
    bookingsError: string | null;
}

export function useMyTripsData(
    userId: string | undefined,
    options?: { enabled?: boolean },
): UseMyTripsDataResult {
    const enabled = options?.enabled !== false;
    const [bookings, setBookings] = useState<CustomerBookingSummary[]>([]);
    const [firestoreTrips, setFirestoreTrips] = useState<Trip[]>([]);
    const [loading, setLoading] = useState(true);
    const [bookingsError, setBookingsError] = useState<string | null>(null);

    useEffect(() => {
        if (!enabled) {
            setBookings([]);
            setFirestoreTrips([]);
            setBookingsError(null);
            setLoading(false);
            return;
        }
        if (!userId) {
            setBookings([]);
            setFirestoreTrips([]);
            setBookingsError(null);
            setLoading(false);
            return;
        }

        let cancelled = false;

        (async () => {
            setLoading(true);
            setBookingsError(null);

            const loadBookings = async () => {
                try {
                    const token = await auth?.currentUser?.getIdToken();
                    if (!token) {
                        setBookings([]);
                        return;
                    }
                    const res = await fetch('/api/bookings/me', {
                        headers: { Authorization: `Bearer ${token}` },
                    });
                    if (!res.ok) {
                        const j = (await res.json().catch(() => ({}))) as { error?: string };
                        setBookingsError(typeof j.error === 'string' ? j.error : 'Could not load bookings');
                        setBookings([]);
                        return;
                    }
                    const data = (await res.json()) as unknown;
                    setBookings(Array.isArray(data) ? data : []);
                } catch {
                    setBookingsError('Could not load bookings');
                    setBookings([]);
                }
            };

            const loadFirestoreTrips = async () => {
                if (!db) {
                    setFirestoreTrips([]);
                    return;
                }
                try {
                    const q = query(collection(db, 'trips'), where('userId', '==', userId), limit(50));
                    const snap = await getDocs(q);
                    const list: Trip[] = [];
                    snap.forEach((docSnap) => {
                        const raw = docSnap.data() as Record<string, unknown>;
                        list.push(normalizeFirestoreTrip(raw, docSnap.id));
                    });
                    list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                    if (!cancelled) setFirestoreTrips(list);
                } catch (e) {
                    console.error('Failed to load Firestore trips', e);
                    if (!cancelled) setFirestoreTrips([]);
                }
            };

            await Promise.all([loadBookings(), loadFirestoreTrips()]);
            if (!cancelled) setLoading(false);
        })();

        return () => {
            cancelled = true;
        };
    }, [userId, enabled]);

    return { bookings, firestoreTrips, loading, bookingsError };
}
