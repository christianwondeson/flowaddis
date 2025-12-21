"use client";

import React from 'react';
import { HotelCard } from './hotel-card';
import { Hotel } from '@/types';

interface HotelListProps {
    hotels: Hotel[];
    isLoading: boolean;
    error: any;
    onBook: (hotel: Hotel) => void;
    onHoverStart?: (id: string) => void;
    onHoverEnd?: (id: string) => void;
}

export const HotelList: React.FC<HotelListProps> = ({ hotels, isLoading, error, onBook, onHoverStart, onHoverEnd }) => {
    if (isLoading) {
        return (
            <div className="space-y-8">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse bg-white rounded-xl h-64 w-full border border-gray-100 shadow-sm"></div>
                ))}
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">
                Failed to fetch hotels. Please try again later.
            </div>
        );
    }

    if (!hotels || hotels.length === 0) {
        return (
            <div className="text-center py-12 text-gray-500">
                No hotels found. Try adjusting your search criteria.
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <h2 className="text-2xl font-bold text-brand-dark mb-6">Recommended Hotels</h2>
            {hotels.map((hotel) => (
                <HotelCard key={hotel.id} hotel={hotel} onBook={onBook} onHoverStart={onHoverStart} onHoverEnd={onHoverEnd} />
            ))}
        </div>
    );
};
