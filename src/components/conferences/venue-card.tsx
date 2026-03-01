"use client";

import React, { useMemo } from 'react';
import { MapPin, Users, CheckCircle, Star } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useHotels } from '@/hooks/use-hotels';
import { Skeleton } from '@/components/ui/skeleton';

interface Venue {
    id: number | string;
    name: string;
    location: string;
    capacity: number;
    price: number;
    features: string[];
    rating: number;
    image?: string;
}

interface VenueCardProps {
    venue: Venue;
    index: number;
    onBook: (venue: Venue) => void;
}

export function VenueCard({ venue, index, onBook }: VenueCardProps) {
    const [isReadyToFetch, setIsReadyToFetch] = React.useState(false);

    // Clean venue name for better search results (remove text in parentheses)
    const searchQuery = useMemo(() => {
        return venue.name.replace(/\s*\(.*?\)\s*/g, '').trim();
    }, [venue.name]);

    // Stagger hotel fetching to avoid 429 rate limits
    React.useEffect(() => {
        const timer = setTimeout(() => {
            setIsReadyToFetch(true);
        }, index * 1000); // 1-second delay per card

        return () => clearTimeout(timer);
    }, [index]);

    // Fetch hotel data to get real images and amenities
    const { data, isLoading } = useHotels({
        query: searchQuery,
        pageSize: 1,
    }, {
        enabled: isReadyToFetch
    });

    const hotelData = useMemo(() => {
        if (data?.hotels && data.hotels.length > 0) {
            return data.hotels[0];
        }
        return null;
    }, [data]);

    const displayImage = hotelData?.image || venue.image || "/placeholder.svg";
    const displayFeatures = hotelData?.amenities && hotelData.amenities.length > 0
        ? hotelData.amenities
        : venue.features;
    const displayPrice = hotelData?.price || venue.price;

    return (
        <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col border border-gray-100 rounded-2xl">
            {/* Image Section */}
            <div className="relative h-48 sm:h-56 overflow-hidden bg-brand-gray">
                {isLoading ? (
                    <Skeleton className="w-full h-full" />
                ) : (
                    <img
                        src={displayImage}
                        alt={venue.name}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                )}
                <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full flex items-center gap-1.5">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-semibold text-brand-dark">{venue.rating}</span>
                </div>
            </div>

            {/* Content Section */}
            <div className="p-4 sm:p-6 flex flex-col flex-grow space-y-4">
                {/* Header */}
                <div>
                    <h3 className="text-lg sm:text-xl font-bold text-brand-dark line-clamp-2">
                        {venue.name}
                    </h3>
                    <div className="flex items-center gap-1.5 text-gray-500 mt-1.5 text-sm">
                        <MapPin className="w-4 h-4 flex-shrink-0 text-brand-secondary" />
                        <span className="line-clamp-1">{venue.location}</span>
                    </div>
                </div>

                {/* Capacity */}
                <div className="flex items-center gap-2 text-brand-dark text-sm">
                    <Users className="w-4 h-4 text-brand-primary flex-shrink-0" />
                    <span className="font-medium">Up to {venue.capacity} people</span>
                </div>

                {/* Features */}
                <div className="space-y-2 flex-grow">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Amenities</p>
                    <div className="grid grid-cols-2 gap-2">
                        {isLoading ? (
                            Array(4).fill(0).map((_, i) => (
                                <Skeleton key={i} className="h-4 w-full" />
                            ))
                        ) : (
                            displayFeatures.slice(0, 4).map((feature, idx) => (
                                <div key={idx} className="flex items-center gap-1.5 text-xs text-brand-dark/80">
                                    <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                                    <span className="line-clamp-1">{feature}</span>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Price & CTA */}
                <div className="pt-4 border-t border-gray-100 space-y-3 sm:space-y-4">
                    <div>
                        <p className="text-xs text-gray-500 mb-0.5">Starting from</p>
                        <p className="text-2xl sm:text-3xl font-bold text-brand-primary">
                            ${displayPrice.toLocaleString()}
                        </p>
                    </div>
                    <Button
                        onClick={() => onBook(venue)}
                        className="w-full bg-brand-primary hover:bg-brand-primary/90 text-white font-semibold py-2.5 sm:py-3 rounded-xl transition-all shadow-md hover:shadow-lg active:scale-[0.98]"
                    >
                        Book Venue
                    </Button>
                </div>
            </div>
        </Card>
    );
}
