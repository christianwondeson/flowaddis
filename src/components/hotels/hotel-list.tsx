"use client";

import React from 'react';
import { HotelCollectionCard } from './hotel-collection-card';
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 justify-items-center">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="animate-pulse bg-white rounded-xl h-[380px] w-full max-w-[320px] border border-gray-100 shadow-sm"></div>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 justify-items-center">
            {hotels.map((hotel) => (
                <HotelCollectionCard
                    key={hotel.id}
                    hotel={hotel}
                    onBook={onBook}
                />
            ))}
        </div>
    );
};
