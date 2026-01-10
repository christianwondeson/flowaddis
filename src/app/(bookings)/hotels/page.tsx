"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { BookingModal } from '@/components/booking/booking-modal';
import { HotelSearchForm } from '@/components/hotels/hotel-search-form';
import { HotelList } from '@/components/hotels/hotel-list';
import { HotelFilters } from '@/components/hotels/hotel-filters';
import { useHotels } from '@/hooks/use-hotels';
import { useAuth } from '@/components/providers/auth-provider';
import { useRouter, useSearchParams } from 'next/navigation';
import { HotelFilters as FilterType } from '@/types';
import { formatDateLocal, parseDateLocal } from '@/lib/date-utils';
import { HotelCollection } from '@/components/hotels/hotel-collection';
import { HotelFAQ } from '@/components/hotels/hotel-faq';
import { HotelFilterBar } from '@/components/hotels/hotel-filter-bar';
import { Preloader } from '@/components/ui/preloader';

function HotelsPageContent() {
    // Read initial params from URL synchronously to avoid an extra initial fetch
    const search = useSearchParams();
    const initialQuery = search.get('query') || 'Addis Ababa';
    const initialDestId = search.get('destId') || undefined;
    const initialDestType = search.get('destType') || undefined;
    const urlCheckIn = search.get('checkIn');
    const urlCheckOut = search.get('checkOut');
    const today = new Date();
    const defaultCheckin = urlCheckIn ? new Date(urlCheckIn) : new Date(today.getTime() + 86400000);
    const defaultCheckout = urlCheckOut ? new Date(urlCheckOut) : new Date(defaultCheckin.getTime() + 86400000);
    const initialCheckInStr = formatDateLocal(defaultCheckin);
    const initialCheckOutStr = formatDateLocal(defaultCheckout);
    const initialSortOrder = (search.get('sortOrder') as any) || 'popularity';
    const initialStars = (search.get('stars') || '')
        .split(',')
        .map(s => Number(s))
        .filter(Boolean);
    const initialMinPrice = search.get('minPrice');
    const initialMaxPrice = search.get('maxPrice');
    const initialMinRating = search.get('minRating');
    const initialAmenities = (search.get('amenities') || '')
        .split(',')
        .filter(Boolean);
    const initialHotelName = search.get('hotelName') || '';
    const [isBookingOpen, setIsBookingOpen] = useState(false);
    const [selectedHotel, setSelectedHotel] = useState<any>(null);

    // Search State
    const [destination, setDestination] = useState(initialQuery);
    const [checkIn, setCheckIn] = useState(initialCheckInStr);
    const [checkOut, setCheckOut] = useState(initialCheckOutStr);
    // Controls whether mobile search renders expanded initially (collapse if URL has params)
    const [hasSearched, setHasSearched] = useState(Boolean(search?.toString()))

    // Pagination & Filters
    const [page, setPage] = useState(0);
    const [filters, setFilters] = useState<FilterType>({
        sortOrder: initialSortOrder,
        stars: initialStars,
        minPrice: initialMinPrice ? Number(initialMinPrice) : undefined,
        maxPrice: initialMaxPrice ? Number(initialMaxPrice) : undefined,
        minRating: initialMinRating ? Number(initialMinRating) : undefined,
        amenities: initialAmenities,
        hotelName: initialHotelName,
    });

    // Query State (triggers refetch)
    const [searchParams, setSearchParams] = useState<{
        query: string;
        destId?: string;
        destType?: string;
        checkIn?: Date;
        checkOut?: Date;
    }>({
        query: initialQuery,
        destId: initialDestId,
        destType: initialDestType,
        checkIn: defaultCheckin,
        checkOut: defaultCheckout,
    });

    // Keep hasSearched in sync once on mount (in case of SSR hydration differences)
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const urlParams = new URLSearchParams(window.location.search);
            setHasSearched(Boolean(urlParams.size));
        }
    }, []);

    const { data, isLoading, error, isPlaceholderData } = useHotels({
        query: searchParams.query,
        destId: searchParams.destId,
        destType: searchParams.destType,
        checkIn: searchParams.checkIn,
        checkOut: searchParams.checkOut,
        page,
        pageSize: 10,
        filters,
    });

    const hotels = data?.hotels || [];
    const hasNextPage = data?.hasNextPage || false;
    const isLoadingMore = isLoading && page > 0;

    // Accumulate hotels for "Load More"
    const [allHotels, setAllHotels] = useState<any[]>([]);

    useEffect(() => {
        if (isLoading) return;

        if (page === 0) {

            setAllHotels(hotels);
        } else if (hotels.length > 0 && !isPlaceholderData) {

            setAllHotels((prev) => {
                // Avoid duplicates by ID
                const existingIds = new Set(prev.map(h => h.id));
                const newHotels = hotels.filter((h: any) => !existingIds.has(h.id));

                if (newHotels.length === 0) {

                    return prev;
                }
                return [...prev, ...newHotels];
            });
        }
    }, [hotels, page, isPlaceholderData, isLoading]);

    // Mock collections for demonstration
    const airportShuttleHotels = allHotels
        .filter(h => h.badges?.some((b: string) => b.toLowerCase().includes('shuttle')))
        .slice(0, 6);
    const breakfastHotels = allHotels
        .filter(h => h.amenities?.some((a: string) => a.toLowerCase().includes('breakfast')))
        .slice(0, 6);
    const budgetHotels = [...allHotels]
        .sort((a, b) => a.price - b.price)
        .slice(0, 6);
    // Hotels located in the center, sorted by best rating
    const centerHotels = [...allHotels]
        .filter(h => h.distance?.toLowerCase().includes('centre') || h.distance?.toLowerCase().includes('center'))
        .sort((a, b) => (b.rating || 0) - (a.rating || 0))
        .slice(0, 6);
    // Most booked: approximate by highest number of reviews
    const mostBookedHotels = [...allHotels]
        .sort((a, b) => (b.reviews || 0) - (a.reviews || 0))
        .slice(0, 6);

    const { user } = useAuth();
    const router = useRouter();

    const buildUrlWithState = (extra: Record<string, any> = {}) => {
        const params = new URLSearchParams();
        if (destination) params.set('query', destination);
        if (checkIn) params.set('checkIn', checkIn);
        if (checkOut) params.set('checkOut', checkOut);
        // persist destination identifiers from current searchParams if available
        if (searchParams.destId) params.set('destId', searchParams.destId);
        if (searchParams.destType) params.set('destType', searchParams.destType);
        if (filters.sortOrder) params.set('sortOrder', String(filters.sortOrder));
        if (filters.stars && filters.stars.length > 0) params.set('stars', filters.stars.join(','));
        if (filters.minPrice != null) params.set('minPrice', String(filters.minPrice));
        if (filters.maxPrice != null) params.set('maxPrice', String(filters.maxPrice));
        if (filters.minRating != null) params.set('minRating', String(filters.minRating));
        if (filters.amenities && filters.amenities.length > 0) params.set('amenities', filters.amenities.join(','));
        if (filters.hotelName) params.set('hotelName', filters.hotelName);
        // merge extras
        Object.entries(extra).forEach(([k, v]) => {
            if (v === undefined || v === null || v === '') return;
            params.set(k, String(v));
        });
        return `?${params.toString()}`;
    };

    const handleBook = (hotel: any) => {
        const params = new URLSearchParams();
        if (hotel.name) params.set('name', hotel.name);
        if (hotel.price != null) params.set('price', String(Math.round(hotel.price)));
        if (hotel.image) params.set('image', hotel.image);
        if (hotel.location) params.set('location', hotel.location);
        // Preserve current search context for the detail page and back navigation
        if (checkIn) params.set('checkin', checkIn);
        if (checkOut) params.set('checkout', checkOut);
        // You can also pass guest counts if you track them here (defaulting for now)
        params.set('adults', '2');
        params.set('children', '0');
        params.set('rooms', '1');
        router.push(`/hotels/${hotel.id}?${params.toString()}`);
    };

    const handleSearch = () => {
        if (destination.trim()) {
            setPage(0); // Reset page on new search
            const ci = checkIn ? parseDateLocal(checkIn) : searchParams.checkIn;
            const co = checkOut ? parseDateLocal(checkOut) : searchParams.checkOut;
            setSearchParams({
                query: destination,
                destId: undefined,
                destType: undefined,
                checkIn: ci,
                checkOut: co,
            });
            setHasSearched(true); // Collapse mobile detail after searching
            // Sync URL for persistence across navigation
            router.push(buildUrlWithState());
        }
    };

    const handleFilterChange = (newFilters: FilterType) => {
        setPage(0); // Reset page on filter change
        setFilters(newFilters);

        // Sync destination if changed in filters
        if (newFilters.query !== filters.query && newFilters.query !== undefined) {
            setDestination(newFilters.query);
            setSearchParams(prev => ({
                ...prev,
                query: newFilters.query!,
                destId: undefined, // Reset ID if query changes manually
                destType: undefined
            }));
        }
        // Update URL to persist filters
        const nextUrl = buildUrlWithState({
            sortOrder: newFilters.sortOrder,
            stars: newFilters.stars && newFilters.stars.length ? newFilters.stars.join(',') : undefined,
            minPrice: newFilters.minPrice,
            maxPrice: newFilters.maxPrice,
            minRating: newFilters.minRating,
            amenities: newFilters.amenities && newFilters.amenities.length ? newFilters.amenities.join(',') : undefined,
            hotelName: newFilters.hotelName,
        });
        router.push(nextUrl);
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-20 pt-24 md:pt-15">
            {/* Header Section */}
            <div className="bg-brand-primary text-white py-12 md:py-16">
                <div className="container mx-auto px-4">
                    <h1 className="text-3xl md:text-4xl font-bold mb-3 md:mb-4">Luxury Stays in Addis Ababa</h1>
                    <p className="text-blue-100 text-base md:text-lg max-w-2xl">
                        Discover top-rated hotels with world-class amenities and Ethiopian hospitality.
                    </p>
                </div>
            </div>

            <div className="container mx-auto px-4 -mt-8 md:-mt-10">
                <HotelSearchForm
                    destination={destination}
                    checkIn={checkIn}
                    checkOut={checkOut}
                    isLoading={isLoading && page === 0}
                    onDestinationChange={setDestination}
                    onCheckInChange={setCheckIn}
                    onCheckOutChange={setCheckOut}
                    onSearch={handleSearch}
                    initialOpen={!hasSearched}
                />

                {/* Mobile Filter Bar (Sort, Filter, Map) */}
                <div className="mt-4">
                    <HotelFilterBar
                        hotels={allHotels}
                        filters={filters}
                        onFilterChange={handleFilterChange}
                        checkIn={checkIn}
                        checkOut={checkOut}
                        destId={data?.destId}
                        linkParams={{
                            query: destination,
                            checkIn: checkIn || undefined,
                            checkOut: checkOut || undefined,
                            adults: '2',
                            children: '0',
                            rooms: '1',
                            sortOrder: filters.sortOrder,
                            minPrice: filters.minPrice,
                            maxPrice: filters.maxPrice,
                            minRating: filters.minRating,
                            stars: (filters.stars || []).join(','),
                            amenities: (filters.amenities || []).join(','),
                            hotelName: filters.hotelName || undefined,
                        }}
                    />
                </div>

                <div className="flex flex-col lg:flex-row gap-8 mt-8">
                    {/* Filters Sidebar (visible on lg and above) */}
                    <div className="hidden lg:block lg:w-1/4">
                        <HotelFilters
                            hotels={allHotels}
                            filters={filters}
                            onFilterChange={handleFilterChange}
                            checkIn={checkIn}
                            checkOut={checkOut}
                            destId={data?.destId}
                            linkParams={{
                                query: destination,
                                checkIn: checkIn || undefined,
                                checkOut: checkOut || undefined,
                                adults: '2',
                                children: '0',
                                rooms: '1',
                                sortOrder: filters.sortOrder,
                                minPrice: filters.minPrice,
                                maxPrice: filters.maxPrice,
                                minRating: filters.minRating,
                                stars: (filters.stars || []).join(','),
                                amenities: (filters.amenities || []).join(','),
                                hotelName: filters.hotelName || undefined,
                            }}
                        />
                    </div>

                    {/* Results Content */}
                    <div className="w-full lg:w-3/4 space-y-6">
                        {/* Results Header */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
                            <h1 className="text-xl md:text-2xl font-bold text-gray-900">
                                {searchParams.query || 'Ethiopia'} – {data?.totalCount || 0} hotels and places to stay
                            </h1>

                            {/* Sorting Tabs */}
                            <div className="flex flex-wrap gap-2">
                                {[
                                    { label: 'Lowest Price First', value: 'price' },
                                    { label: 'Star rating and price', value: 'class_descending' },
                                ].map((tab) => {
                                    const isActive = filters.sortOrder === tab.value;
                                    return (
                                        <button
                                            key={tab.value}
                                            onClick={() => setFilters({ ...filters, sortOrder: tab.value })}
                                            className={`px-3 py-1.5 text-[11px] font-bold rounded-full border transition-all ${isActive
                                                ? "bg-blue-600 border-blue-600 text-white shadow-sm"
                                                : "bg-white border-gray-200 text-gray-600 hover:border-blue-600 hover:text-blue-600"
                                                }`}
                                        >
                                            {tab.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Hotel List */}
                        <HotelList
                            hotels={allHotels.filter(
                                (h) => !filters.hotelName || h.name.toLowerCase().includes(filters.hotelName.toLowerCase())
                            )}
                            isLoading={isLoading && page === 0}
                            error={error}
                            onBook={handleBook}
                        />

                        {/* Infinite scroll sentinel removed */}

                        {/* Load More Button with loading indicator */}
                        {hasNextPage && (
                            <div className="flex justify-center mt-4">
                                <button
                                    onClick={() => !isLoadingMore && setPage(p => p + 1)}
                                    disabled={isLoadingMore}
                                    aria-busy={isLoadingMore}
                                    className={`px-4 py-2 rounded-lg transition-colors text-sm font-bold flex items-center gap-2 
                                        ${isLoadingMore ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                                >
                                    {isLoadingMore && (
                                        <Preloader size="sm" className="border-gray-300 border-t-brand-primary" />
                                    )}
                                    {isLoadingMore ? 'Loading…' : 'Load More Results'}
                                </button>
                            </div>
                        )}

                        {/* Collections Sections */}
                        <div className="pt-12 space-y-4">
                            <HotelCollection
                                title={`Hotels with airport shuttles in ${searchParams.query || 'Addis Ababa'}`}
                                hotels={airportShuttleHotels}
                                onBook={handleBook}
                                onSeeAll={() => { }}
                            />

                            <HotelCollection
                                title={`Most booked hotels in ${searchParams.query || 'Addis Ababa'} and surrounding area`}
                                hotels={allHotels.slice(0, 6)}
                                onBook={handleBook}
                                onSeeAll={() => { }}
                            />

                            <HotelCollection
                                title={`Best hotels with breakfast in ${searchParams.query || 'Addis Ababa'} and nearby`}
                                hotels={breakfastHotels}
                                onBook={handleBook}
                                onSeeAll={() => { }}
                            />

                            <HotelCollection
                                title={`Hotels located in the center of ${searchParams.query || 'Addis Ababa'}`}
                                hotels={centerHotels}
                                onBook={handleBook}
                                onSeeAll={() => { }}
                            />

                            <HotelCollection
                                title={`Budget hotels in ${searchParams.query || 'Addis Ababa'} and nearby`}
                                hotels={budgetHotels}
                                onBook={handleBook}
                                onSeeAll={() => { }}
                            />
                        </div>

                        {/* FAQ Section */}
                        <HotelFAQ location={searchParams.query || 'Addis Ababa'} />
                    </div>
                </div>
            </div>

            <BookingModal
                isOpen={isBookingOpen}
                onClose={() => setIsBookingOpen(false)}
                serviceName={selectedHotel ? selectedHotel.name : 'Hotel Booking'}
                price={selectedHotel?.price || 0}
                type="hotel"
            />
        </div>
    );
}

export default function HotelsPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Preloader size="lg" /></div>}>
            <HotelsPageContent />
        </Suspense>
    );
}
