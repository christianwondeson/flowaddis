"use client";

import React, { useEffect, useMemo, useState } from 'react';
import nextDynamic from 'next/dynamic';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { PriceMarker, Hotel } from '@/types';
const LeafletMap = nextDynamic(() => import('@/components/map/leaflet-map').then(m => m.LeafletMap), { ssr: false });
import { HotelList } from '@/components/hotels/hotel-list';
import { HotelFilters } from '@/components/hotels/hotel-filters';
import { useHotels } from '@/hooks/use-hotels';

export function HotelsMapContent() {
    const router = useRouter();
    const params = useSearchParams();

    // Pull initial params if present
    const initialQuery = params.get('query') || 'Ethiopia';
    const initialCheckIn = params.get('checkIn') || '';
    const initialCheckOut = params.get('checkOut') || '';
    const initialSort = params.get('sortOrder') || 'popularity';
    const initialMinPrice = params.get('minPrice');
    const initialMaxPrice = params.get('maxPrice');
    const initialMinRating = params.get('minRating');
    const initialStars = params.get('stars');
    const initialAmenities = params.get('amenities');
    const initialHotelName = params.get('hotelName') || '';

    const [checkIn, setCheckIn] = useState<string | undefined>(initialCheckIn || undefined);
    const [checkOut, setCheckOut] = useState<string | undefined>(initialCheckOut || undefined);
    const [page, setPage] = useState(0);
    const [filters, setFilters] = useState<any>({
        query: initialQuery,
        sortOrder: initialSort,
        minPrice: initialMinPrice ? Number(initialMinPrice) : undefined,
        maxPrice: initialMaxPrice ? Number(initialMaxPrice) : undefined,
        minRating: initialMinRating ? Number(initialMinRating) : undefined,
        stars: initialStars ? initialStars.split(',').filter(Boolean).map((s) => Number(s)) : [],
        amenities: initialAmenities ? initialAmenities.split(',').filter(Boolean) : [],
        hotelName: initialHotelName || '',
    });

    const checkInDate = useMemo(() => checkIn ? new Date(checkIn) : undefined, [checkIn]);
    const checkOutDate = useMemo(() => checkOut ? new Date(checkOut) : undefined, [checkOut]);

    const { data, isLoading, error, isPlaceholderData } = useHotels({
        query: filters.query,
        checkIn: checkInDate,
        checkOut: checkOutDate,
        page,
        filters,
    });

    const [hotels, setHotels] = useState<Hotel[]>([]);
    const [hoveredId, setHoveredId] = useState<string | undefined>(undefined);

    // Reset hotels when filters or query change
    useEffect(() => {
        setHotels([]);
        setPage(0);
    }, [checkIn, checkOut, filters]);

    // Accumulate hotels when data changes
    useEffect(() => {
        if (data?.hotels) {
            if (page === 0) {
                setHotels(data.hotels);
            } else {
                setHotels((prev) => {
                    // Avoid duplicates
                    const existingIds = new Set(prev.map((h) => h.id));
                    const newHotels = data.hotels.filter((h) => !existingIds.has(h.id));
                    return [...prev, ...newHotels];
                });
            }
        }
    }, [data, page]);

    const center = useMemo((): [number, number] => {
        if (hotels.length > 0 && hotels[0].coordinates) {
            return [hotels[0].coordinates.lat, hotels[0].coordinates.lng];
        }
        return [9.0108, 38.7613];
    }, [hotels]);
    const markers: PriceMarker[] = hotels
        .filter((h) => h.coordinates)
        .map((h) => ({
            id: h.id,
            name: h.name,
            price: h.price,
            lat: h.coordinates!.lat,
            lng: h.coordinates!.lng,
            image: h.image,
        }));

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="container mx-auto px-4 py-4 lg:py-6">
                <div className="flex items-center justify-between mb-4">
                    <h1 className="text-2xl font-bold text-brand-dark">Hotels on Map</h1>
                    <Button onClick={() => router.push('/hotels')} className="rounded-full">Close map</Button>
                </div>

                {/* Three-column layout: Filters | List | Map */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">
                    {/* Filters */}
                    <aside className="lg:col-span-3">
                        <div className="sticky top-24">
                            <HotelFilters
                                showMapPreview={false}
                                hotels={hotels}
                                filters={filters}
                                onFilterChange={(f) => { setPage(0); setFilters(f); }}
                                checkIn={checkIn}
                                checkOut={checkOut}
                            />
                        </div>
                    </aside>

                    {/* Hotel List */}
                    <section className="lg:col-span-5">
                        <div className="bg-white rounded-xl p-4 md:p-6 border border-gray-100 shadow-sm">
                            <HotelList
                                hotels={hotels}
                                isLoading={isLoading && page === 0}
                                error={error}
                                onBook={(hotel) => router.push(`/hotels/${hotel.id}`)}
                                onHoverStart={(id) => setHoveredId(id)}
                                onHoverEnd={() => setHoveredId(undefined)}
                            />
                            {data?.hasNextPage && !isPlaceholderData && (
                                <div className="flex justify-center mt-4">
                                    <Button variant="outline" onClick={() => setPage((p) => p + 1)}>Load more</Button>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Map */}
                    <section className="lg:col-span-4">
                        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-2 sticky top-24">
                            <LeafletMap center={center} markers={markers} highlightedId={hoveredId} fitToMarkers scrollWheelZoom height="calc(100vh - 140px)" className="rounded-xl" />
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}
