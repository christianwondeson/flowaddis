"use client";

import React from 'react';
import { HotelCard } from './hotel-card';
import { HotelCardSkeleton } from './hotel-card-skeleton';
import { Hotel } from '@/types';

interface HotelListProps {
    hotels: Hotel[];
    isLoading: boolean;
    error: any;
    onBook: (hotel: Hotel) => void;
    onHoverStart?: (id: string) => void;
    onHoverEnd?: (id: string) => void;
    staySummary?: string;
    /** Pin this hotel to top in parent; highlight card in list */
    featuredHotelId?: string | null;
    /** Infinite scroll sentinel + loading row */
    listFooter?: React.ReactNode;
}

export const HotelList: React.FC<HotelListProps> = ({
    hotels,
    isLoading,
    error,
    onBook,
    onHoverStart,
    onHoverEnd,
    staySummary,
    featuredHotelId,
    listFooter,
}) => {
    if (isLoading) {
        return (
            <div className="grid grid-cols-1 gap-4 md:gap-6 justify-items-stretch">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <HotelCardSkeleton key={i} />
                ))}
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-300 p-4 rounded-lg mb-6 border border-red-100 dark:border-red-900/50">
                Failed to fetch hotels. Please try again later.
            </div>
        );
    }

    if (!hotels || hotels.length === 0) {
        return (
            <div className="text-center py-12 text-gray-500 dark:text-slate-400">
                No hotels found. Try adjusting your search criteria.
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 gap-4 sm:gap-5 md:gap-6 justify-items-stretch">
            {hotels.map((hotel) => (
                <HotelCard
                    key={hotel.id}
                    hotel={hotel}
                    onBook={onBook}
                    onHoverStart={onHoverStart}
                    onHoverEnd={onHoverEnd}
                    variant="horizontal"
                    staySummary={staySummary}
                    featured={Boolean(featuredHotelId && hotel.id === featuredHotelId)}
                />
            ))}
            {listFooter}
        </div>
    );
};
