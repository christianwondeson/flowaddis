import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';

import { db } from '@/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';

export interface TripItem {
    id: string;
    type: 'flight' | 'hotel' | 'shuttle' | 'conference';
    details: any;
    price: number;
}

export interface Trip {
    id: string;
    userId: string;
    items: TripItem[];
    totalAmount: number;
    status: 'pending' | 'confirmed' | 'cancelled';
    date: string;
}

interface TripState {
    currentTrip: TripItem[];
    addToTrip: (item: Omit<TripItem, 'id'>) => void;
    removeFromTrip: (id: string) => void;
    clearTrip: () => void;
    /** Replace cart (hydrate from session). */
    replaceCart: (items: TripItem[]) => void;
    /** Merge items saved before login (dedupe by type + details.id when present). */
    mergeFromPendingSession: (incoming: TripItem[]) => number;
    checkoutTrip: (userId: string) => Promise<string>;
}

/**
 * Trip cart (currentTrip):
 * - Zustand in-memory + sessionStorage sync via TripCartSessionBridge (same tab: refresh + sign-in merge).
 * - Confirmed bundles persist to Firestore on checkoutTrip after payment / bundle save.
 */
export const useTripStore = create<TripState>()((set, get) => ({
    currentTrip: [],
    addToTrip: (item) => {
        const newItem = { ...item, id: uuidv4() };
        set((state) => ({ currentTrip: [...state.currentTrip, newItem] }));
    },
    removeFromTrip: (id) => {
        set((state) => ({
            currentTrip: state.currentTrip.filter((item) => item.id !== id),
        }));
    },
    clearTrip: () => set({ currentTrip: [] }),
    replaceCart: (items) => set({ currentTrip: Array.isArray(items) ? items : [] }),
    mergeFromPendingSession: (incoming) => {
        let added = 0;
        set((state) => {
            const keyOf = (it: TripItem) =>
                `${it.type}:${it.details?.id != null ? String(it.details.id) : it.id}`;
            const keys = new Set(state.currentTrip.map(keyOf));
            const merged = [...state.currentTrip];
            for (const it of incoming) {
                const k = keyOf(it);
                if (!keys.has(k)) {
                    merged.push(it);
                    keys.add(k);
                    added++;
                }
            }
            return { currentTrip: merged };
        });
        return added;
    },
    checkoutTrip: async (userId) => {
        const { currentTrip, clearTrip } = get();
        const tripId = uuidv4();
        const totalAmount = currentTrip.reduce((sum, item) => sum + item.price, 0);

        const newTrip: Trip = {
            id: tripId,
            userId,
            items: currentTrip,
            totalAmount,
            status: 'confirmed',
            date: new Date().toISOString(),
        };

        if (db) {
            try {
                await setDoc(doc(db, 'trips', tripId), newTrip);
            } catch (error) {
                console.error('Error saving trip to Firestore:', error);
            }
        }

        clearTrip();
        return tripId;
    },
}));
