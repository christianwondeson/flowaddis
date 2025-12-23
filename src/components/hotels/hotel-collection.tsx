"use client";

import React from 'react';
import { ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { HotelCollectionCard } from './hotel-collection-card';
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
    if (!isLoading && hotels.length === 0) return null;

    return (
        <section className="py-8 border-t border-gray-100">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">{title}</h2>
                {onSeeAll && (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onSeeAll}
                        className="text-blue-600 border-blue-600 hover:bg-blue-50 text-xs font-bold"
                    >
                        See all
                    </Button>
                )}
            </div>

            <div className="relative group">
                <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
                    {isLoading ? (
                        Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="flex-shrink-0 w-[240px] md:w-[280px] h-[360px] bg-gray-100 animate-pulse rounded-lg" />
                        ))
                    ) : (
                        hotels.map((hotel) => (
                            <HotelCollectionCard
                                key={hotel.id}
                                hotel={hotel}
                                onBook={onBook}
                            />
                        ))
                    )}
                </div>

                {/* Scroll Indicator / Button could be added here if needed */}
                {!isLoading && hotels.length > 4 && (
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 hidden md:flex">
                        <Button
                            variant="secondary"
                            size="icon"
                            className="rounded-full shadow-lg bg-white hover:bg-gray-50 border border-gray-200"
                            onClick={() => {
                                const container = document.querySelector('.overflow-x-auto');
                                container?.scrollBy({ left: 300, behavior: 'smooth' });
                            }}
                        >
                            <ChevronRight className="w-5 h-5 text-gray-600" />
                        </Button>
                    </div>
                )}
            </div>
        </section>
    );
};
