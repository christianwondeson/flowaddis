import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { persist } from 'zustand/middleware';

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

export const useTripStore = create<TripState>()(
    persist(
        (set, get) => ({
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

                // In a real app, save to Firestore here
                // await setDoc(doc(db, 'trips', tripId), newTrip);

                // For now, save to localStorage to simulate persistence
                const existingTrips = JSON.parse(localStorage.getItem('flowaddis_trips') || '[]');
                localStorage.setItem('flowaddis_trips', JSON.stringify([...existingTrips, newTrip]));

                clearTrip();
                return tripId;
            },
        }),
        {
            name: 'trip-storage',
        }
    )
);
