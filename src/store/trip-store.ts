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
    checkoutTrip: (userId: string) => Promise<string>;
}

/**
 * Trip cart lives in memory only (no localStorage) to avoid exposing booking details
 * and identifiers to XSS or extensions. Confirmed trips are persisted in Firestore.
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
