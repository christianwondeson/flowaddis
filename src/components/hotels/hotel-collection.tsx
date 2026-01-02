"use client";

import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { HotelCard } from './hotel-card';
import { Hotel } from '@/types';

interface HotelCollectionProps {
    title: string;
    hotels: Hotel[];
    isLoading?: boolean;
    onBook: (hotel: Hotel) => void;
    onSeeAll?: () => void;
}

export const HotelCollection: React.FC<HotelCollectionProps> = ({
    title,
    hotels,
    isLoading,
    onBook,
    onSeeAll
}) => {
    const [expanded, setExpanded] = useState(false);

    const visibleHotels = useMemo(() => {
        if (expanded) return hotels;
        return hotels.slice(0, 3);
    }, [expanded, hotels]);

    if (!isLoading && hotels.length === 0) return null;

    return (
        <section className="py-6 md:py-8 border-t border-gray-100">
            <div className="flex items-center justify-between mb-4 md:mb-6">
                <h2 className="text-lg md:text-xl font-bold text-gray-900">{title}</h2>
                {hotels.length > 3 && (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                            setExpanded((e) => !e);
                            onSeeAll?.();
                        }}
                        className="text-blue-600 border-blue-600 hover:bg-blue-50 text-xs font-bold"
                    >
                        {expanded ? 'Show less' : 'See all'}
                    </Button>
                )}
            </div>

            <div>
                {isLoading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="w-full h-[300px] bg-gray-100 animate-pulse rounded-lg" />
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                        {visibleHotels.map((hotel) => (
                            <HotelCard
                                key={hotel.id}
                                hotel={hotel}
                                onBook={onBook}
                                variant="vertical"
                            />
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
};
