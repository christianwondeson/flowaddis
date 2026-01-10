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
    const [viewMode, setViewMode] = useState<'list' | 'map'>('list');

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
        <div className="h-[calc(100vh-64px)] mt-16 overflow-hidden bg-white relative">
            <div className="flex h-full flex-col lg:flex-row">
                {/* Left Panel: Filters & List */}
                <div className={`w-full lg:w-[500px] xl:w-[600px] h-full flex flex-col border-r border-gray-100 shadow-xl z-10 bg-white transition-all duration-300 ${viewMode === 'map' ? 'hidden lg:flex' : 'flex'}`}>
                    {/* Filter Header */}
                    <div className="p-6 border-b border-gray-100">
                        <h1 className="text-xl font-bold text-brand-dark mb-1">Hotels on Map</h1>
                        <p className="text-sm text-gray-500">
                            {data?.totalCount || 0} properties found in {filters.query}
                        </p>
                    </div>

                    {/* Scrollable Content (Filters + List) */}
                    <div className="flex-grow overflow-y-auto custom-scrollbar scrollbar-hide">
                        {/* Filters Section */}
                        <div className="border-b border-gray-100">
                            <HotelFilters
                                showMapPreview={false}
                                hotels={hotels}
                                filters={filters}
                                onFilterChange={(f) => { setPage(0); setFilters(f); }}
                                checkIn={checkIn}
                                checkOut={checkOut}
                            />
                        </div>

                        {/* Hotel List Section */}
                        <div className="p-6 bg-gray-50/30">
                            <HotelList
                                hotels={hotels}
                                isLoading={isLoading && page === 0}
                                error={error}
                                onBook={(hotel) => router.push(`/hotels/${hotel.id}`)}
                                onHoverStart={(id) => setHoveredId(id)}
                                onHoverEnd={() => setHoveredId(undefined)}
                            />

                            {data?.hasNextPage && !isPlaceholderData && (
                                <div className="flex justify-center mt-8 pb-10">
                                    <Button
                                        variant="outline"
                                        onClick={() => setPage((p) => p + 1)}
                                        className="rounded-full px-10 border-brand-primary text-brand-primary hover:bg-brand-primary hover:text-white transition-all font-bold"
                                    >
                                        Load more results
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Panel: Full-screen Map with Gaps */}
                <div className={`flex-grow h-full relative bg-gray-50 p-0 lg:p-6 transition-all duration-300 ${viewMode === 'list' ? 'hidden lg:block' : 'block'}`}>
                    <div className="w-full h-full lg:rounded-2xl overflow-hidden shadow-inner border-0 lg:border border-gray-200 relative">
                        <LeafletMap
                            center={center}
                            markers={markers}
                            highlightedId={hoveredId}
                            fitToMarkers
                            scrollWheelZoom
                            height="100%"
                            className="w-full h-full"
                        />

                        {/* Floating Close Button */}
                        <button
                            onClick={() => router.push('/hotels')}
                            className="absolute top-4 right-4 z-[1000] bg-white text-brand-dark p-2 rounded-full shadow-lg hover:bg-gray-100 transition-all border border-gray-200 group"
                            title="Close map"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="group-hover:rotate-90 transition-transform duration-200">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile View Toggle Button */}
            <div className="lg:hidden fixed bottom-8 left-1/2 -translate-x-1/2 z-[1001]">
                <Button
                    onClick={() => setViewMode(viewMode === 'list' ? 'map' : 'list')}
                    className="rounded-full shadow-2xl px-6 py-6 bg-brand-dark text-white hover:bg-brand-dark/90 flex items-center gap-2 border-2 border-white/20 backdrop-blur-sm"
                >
                    {viewMode === 'list' ? (
                        <>
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"></polygon><line x1="8" y1="2" x2="8" y2="18"></line><line x1="16" y1="6" x2="16" y2="22"></line></svg>
                            Show Map
                        </>
                    ) : (
                        <>
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
                            Show List
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
}
