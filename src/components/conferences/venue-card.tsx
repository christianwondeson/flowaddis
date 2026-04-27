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
    const [imgFailed, setImgFailed] = React.useState(false);

    // Clean venue name for better search results (remove text in parentheses)
    const searchQuery = useMemo(() => {
        return venue.name.replace(/\s*\(.*?\)\s*/g, '').trim();
    }, [venue.name]);

    const locationQuery = useMemo(() => {
        // For the hotels search API, `query` is the location/destination (not hotel name).
        // Use venue.location when available, otherwise fall back to Addis Ababa.
        return venue.location?.trim() || 'Addis Ababa';
    }, [venue.location]);

    const searchTokens = useMemo(() => {
        return searchQuery
            .toLowerCase()
            .replace(/[^a-z0-9\s]/g, ' ')
            .split(/\s+/)
            .filter(Boolean);
    }, [searchQuery]);

    const scoreName = React.useCallback((candidate: string) => {
        const cTokens = (candidate || '')
            .toLowerCase()
            .replace(/\s*\(.*?\)\s*/g, ' ')
            .replace(/[^a-z0-9\s]/g, ' ')
            .split(/\s+/)
            .filter(Boolean);

        if (!cTokens.length || !searchTokens.length) return 0;

        const set = new Set(cTokens);
        const overlap = searchTokens.reduce((acc, t) => acc + (set.has(t) ? 1 : 0), 0);
        const overlapRatio = overlap / Math.max(1, searchTokens.length);
        const full = cTokens.join(' ').includes(searchTokens.join(' ')) ? 0.25 : 0;
        return overlapRatio + full;
    }, [searchTokens]);

    // Stagger hotel fetching to avoid 429 rate limits
    React.useEffect(() => {
        const timer = setTimeout(() => {
            setIsReadyToFetch(true);
        }, index * 500); // 0.5-second delay per card

        return () => clearTimeout(timer);
    }, [index]);

    // Fetch hotel data to get real images and amenities
    const { data, isLoading } = useHotels({
        query: locationQuery,
        pageSize: 10,
        filters: {
            // This makes the backend filter within the destination by hotel name,
            // instead of returning the top hotel in the city (often Skylight).
            hotelName: searchQuery,
        },
    }, {
        enabled: isReadyToFetch
    });

    const hotelData = useMemo(() => {
        const hotels = data?.hotels || [];
        if (!hotels.length) return null;

        const ranked = hotels
            .map((h: any) => ({
                h,
                score: scoreName(String(h?.name || '')) + (h?.image ? 0.05 : 0),
            }))
            .sort((a, b) => b.score - a.score);

        return ranked[0]?.h ?? null;
    }, [data, scoreName]);

    const primaryImage = hotelData?.image || venue.image || "/placeholder.svg";
    const displayImage = imgFailed ? (venue.image || "/placeholder.svg") : primaryImage;
    const displayFeatures = hotelData?.amenities && hotelData.amenities.length > 0
        ? hotelData.amenities
        : venue.features;
    // Conference venue pricing is separate from hotel nightly pricing; keep venue price.
    const displayPrice = venue.price;

    return (
        <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col rounded-2xl">
            {/* Image Section */}
            <div className="relative h-48 sm:h-56 overflow-hidden bg-brand-gray dark:bg-slate-800">
                {isLoading ? (
                    <Skeleton className="w-full h-full" />
                ) : (
                    <img
                        src={displayImage}
                        alt={venue.name}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                        referrerPolicy="no-referrer"
                        onError={() => setImgFailed(true)}
                    />
                )}
                <div className="absolute top-3 right-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm px-3 py-1.5 rounded-full flex items-center gap-1.5 border border-gray-200/80 dark:border-slate-600">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{venue.rating}</span>
                </div>
            </div>

            {/* Content Section */}
            <div className="p-4 sm:p-6 flex flex-col grow space-y-4">
                {/* Header */}
                <div>
                    <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100 line-clamp-2">
                        {venue.name}
                    </h3>
                    <div className="flex items-center gap-1.5 text-gray-500 dark:text-slate-400 mt-1.5 text-sm">
                        <MapPin className="w-4 h-4 shrink-0 text-brand-secondary" />
                        <span className="line-clamp-1">{venue.location}</span>
                    </div>
                </div>

                {/* Capacity */}
                <div className="flex items-center gap-2 text-slate-900 dark:text-slate-100 text-sm">
                    <Users className="w-4 h-4 text-brand-primary shrink-0" />
                    <span className="font-medium">Up to {venue.capacity} people</span>
                </div>

                {/* Features */}
                <div className="space-y-2 grow">
                    <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Amenities</p>
                    <div className="grid grid-cols-2 gap-2">
                        {isLoading ? (
                            Array(4).fill(0).map((_, i) => (
                                <Skeleton key={i} className="h-4 w-full" />
                            ))
                        ) : (
                            displayFeatures.slice(0, 4).map((feature: string, idx: number) => (
                                <div key={idx} className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300">
                                    <CheckCircle className="w-3.5 h-3.5 text-green-500 shrink-0" />
                                    <span className="line-clamp-1">{feature}</span>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Price & CTA */}
                <div className="pt-4 border-t border-border space-y-3 sm:space-y-4">
                    <div>
                        <p className="text-xs text-muted-foreground mb-0.5">Starting from</p>
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
