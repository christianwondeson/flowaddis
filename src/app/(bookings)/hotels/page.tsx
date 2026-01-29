"use client";

import React, { useState, useEffect, Suspense, useMemo } from 'react';
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
    const initialAdults = Number(search.get('adults')) || 2;
    const initialChildren = Number(search.get('children')) || 0;
    const initialRooms = Number(search.get('rooms')) || 1;

    const [isBookingOpen, setIsBookingOpen] = useState(false);
    const [selectedHotel, setSelectedHotel] = useState<any>(null);

    // Search State
    const [destination, setDestination] = useState(initialQuery);
    const [checkIn, setCheckIn] = useState(initialCheckInStr);
    const [checkOut, setCheckOut] = useState(initialCheckOutStr);
    const [guests, setGuests] = useState({ adults: initialAdults, children: initialChildren, rooms: initialRooms });

    // Track pending location selection from the form
    const [pendingLocation, setPendingLocation] = useState<{ destId?: string; destType?: string; latitude?: number; longitude?: number }>({});

    const handleLocationSelect = (location: any) => {
        setPendingLocation({
            destId: location.dest_id,
            destType: location.dest_type,
            latitude: location.latitude,
            longitude: location.longitude
        });
    };

    const handleDestinationChange = (value: string) => {
        setDestination(value);
        // Clear pending location if user types manually
        setPendingLocation({});
    };

    // Controls whether mobile search renders expanded initially (collapse by default since we search on load)
    const [hasSearched, setHasSearched] = useState(true);

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
        latitude?: number;
        longitude?: number;
        checkIn?: Date;
        checkOut?: Date;
        adults: number;
        children: number;
        rooms: number;
    }>({
        query: initialQuery,
        destId: initialDestId,
        destType: initialDestType,
        latitude: search.get('latitude') ? Number(search.get('latitude')) : undefined,
        longitude: search.get('longitude') ? Number(search.get('longitude')) : undefined,
        checkIn: defaultCheckin,
        checkOut: defaultCheckout,
        adults: initialAdults,
        children: initialChildren,
        rooms: initialRooms,
    });

    // Keep state in sync with URL (handles back/forward navigation)
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const urlParams = new URLSearchParams(window.location.search);
        const hasParams = urlParams.size > 0;
        setHasSearched(hasParams);

        if (hasParams) {
            const q = urlParams.get('query') || 'Addis Ababa';
            const ci = urlParams.get('checkIn');
            const co = urlParams.get('checkOut');
            const ad = Number(urlParams.get('adults')) || 2;
            const ch = Number(urlParams.get('children')) || 0;
            const rm = Number(urlParams.get('rooms')) || 1;

            setDestination(q);
            if (ci) setCheckIn(ci);
            if (co) setCheckOut(co);
            setGuests({ adults: ad, children: ch, rooms: rm });

            const ciDate = ci ? parseDateLocal(ci) : new Date(Date.now() + 86400000);
            const coDate = co ? parseDateLocal(co) : new Date(ciDate.getTime() + 86400000);

            setSearchParams({
                query: q,
                destId: urlParams.get('destId') || undefined,
                destType: urlParams.get('destType') || undefined,
                latitude: urlParams.get('latitude') ? Number(urlParams.get('latitude')) : undefined,
                longitude: urlParams.get('longitude') ? Number(urlParams.get('longitude')) : undefined,
                checkIn: ciDate,
                checkOut: coDate,
                adults: ad,
                children: ch,
                rooms: rm,
            });

            // Update filters from URL
            setFilters({
                sortOrder: (urlParams.get('sortOrder') as any) || 'popularity',
                stars: (urlParams.get('stars') || '').split(',').map(Number).filter(Boolean),
                minPrice: urlParams.get('minPrice') ? Number(urlParams.get('minPrice')) : undefined,
                maxPrice: urlParams.get('maxPrice') ? Number(urlParams.get('maxPrice')) : undefined,
                minRating: urlParams.get('minRating') ? Number(urlParams.get('minRating')) : undefined,
                amenities: (urlParams.get('amenities') || '').split(',').filter(Boolean),
                hotelName: urlParams.get('hotelName') || '',
            });
        }
    }, [search]);

    const { data, isLoading, error, isPlaceholderData } = useHotels({
        query: searchParams.query,
        destId: searchParams.destId,
        destType: searchParams.destType,
        latitude: searchParams.latitude,
        longitude: searchParams.longitude,
        checkIn: searchParams.checkIn,
        checkOut: searchParams.checkOut,
        adults: searchParams.adults,
        children: searchParams.children,
        rooms: searchParams.rooms,
        page,
        pageSize: 10,
        filters,
    });

    const hotels = data?.hotels || [];
    const hasNextPage = data?.hasNextPage || false;
    const isLoadingMore = isLoading && page > 0;

    // Accumulate hotels for "Load More"
    const [allHotels, setAllHotels] = useState<any[]>([]);
    // Stabilize total count
    const [initialTotalCount, setInitialTotalCount] = useState<number | null>(null);

    // Session Storage Persistence
    const STORAGE_KEY = 'hotel_search_state';

    // Save state to session storage whenever relevant data changes
    useEffect(() => {
        if (allHotels.length > 0) {
            const stateToSave = {
                allHotels,
                page,
                searchParams,
                filters,
                totalCount: initialTotalCount,
                timestamp: Date.now()
            };
            sessionStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
        }
    }, [allHotels, page, searchParams, filters]);

    // Restore state on mount
    useEffect(() => {
        const savedState = sessionStorage.getItem(STORAGE_KEY);
        if (savedState) {
            try {
                const parsed = JSON.parse(savedState);
                // Only restore if less than 30 minutes old and matches current query context
                const isFresh = Date.now() - parsed.timestamp < 30 * 60 * 1000;

                // Check if URL params match the saved state to decide whether to restore
                const urlParams = new URLSearchParams(window.location.search);
                const currentQuery = urlParams.get('query') || 'Addis Ababa';

                if (isFresh && parsed.searchParams.query === currentQuery) {
                    setAllHotels(parsed.allHotels);
                    setPage(parsed.page);
                    if (parsed.totalCount) setInitialTotalCount(parsed.totalCount);
                    // We don't overwrite filters/searchParams here as they are driven by URL
                    // But we ensure the list matches what was previously seen
                }
            } catch (e) {
                console.error('Failed to parse saved hotel state', e);
            }
        }
    }, []);

    useEffect(() => {
        if (isLoading) return;

        // Always update total count when on page 0 (fresh search/filter)
        // This ensures the count stays in sync with the actual API response
        if (data?.totalCount !== undefined && page === 0) {
            if (initialTotalCount !== data.totalCount) {
                setInitialTotalCount(data.totalCount);
            }
        }

        if (page === 0 && !sessionStorage.getItem(STORAGE_KEY)) {
            // Only overwrite if we didn't just restore from session
            if (hotels.length > 0) {
                setAllHotels(hotels);
            }
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
    }, [hotels, page, isPlaceholderData, isLoading, data?.totalCount, initialTotalCount]);

    // Memoize collections to prevent unnecessary recalculations and ensure stable displays
    const collections = useMemo(() => {
        const airportShuttle = allHotels
            .filter(h => h.badges?.some((b: string) => b.toLowerCase().includes('shuttle')))
            .slice(0, 6);

        const breakfast = allHotels
            .filter(h => h.amenities?.some((a: string) => a.toLowerCase().includes('breakfast')))
            .slice(0, 6);

        const budget = [...allHotels]
            .sort((a, b) => a.price - b.price)
            .slice(0, 6);

        // Hotels located in the center, sorted by best rating
        const center = [...allHotels]
            .filter(h => h.distance?.toLowerCase().includes('centre') || h.distance?.toLowerCase().includes('center'))
            .sort((a, b) => (b.rating || 0) - (a.rating || 0))
            .slice(0, 6);

        // Most booked: approximate by highest number of reviews
        const mostBooked = [...allHotels]
            .sort((a, b) => (b.reviews || 0) - (a.reviews || 0))
            .slice(0, 6);

        return {
            airportShuttle,
            breakfast,
            budget,
            center,
            mostBooked
        };
    }, [allHotels]);

    const { user } = useAuth();
    const router = useRouter();

    const buildUrlWithState = (extra: Record<string, any> = {}) => {
        const params = new URLSearchParams();
        if (destination) params.set('query', destination);
        if (checkIn) params.set('checkIn', checkIn);
        if (checkOut) params.set('checkOut', checkOut);
        if (guests.adults) params.set('adults', String(guests.adults));
        if (guests.children !== undefined) params.set('children', String(guests.children));
        if (guests.rooms) params.set('rooms', String(guests.rooms));

        // persist destination identifiers from current searchParams if available
        if (searchParams.destId) params.set('destId', searchParams.destId);
        if (searchParams.destType) params.set('destType', searchParams.destType);
        if (searchParams.latitude) params.set('latitude', String(searchParams.latitude));
        if (searchParams.longitude) params.set('longitude', String(searchParams.longitude));
        if (filters.sortOrder) params.set('sortOrder', String(filters.sortOrder));
        if (filters.stars && filters.stars.length > 0) params.set('stars', filters.stars.join(','));
        if (filters.minPrice != null) params.set('minPrice', String(filters.minPrice));
        if (filters.maxPrice != null) params.set('maxPrice', String(filters.maxPrice));
        if (filters.minRating != null) params.set('minRating', String(filters.minRating));
        if (filters.amenities && filters.amenities.length > 0) params.set('amenities', filters.amenities.join(','));
        if (filters.hotelName) params.set('hotelName', filters.hotelName);
        // merge extras
        // merge extras
        Object.entries(extra).forEach(([k, v]) => {
            if (v === undefined || v === null) return;
            if (v === '') {
                params.delete(k);
                return;
            }
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
        // Preserve current search context for the detail page and back navigation
        if (checkIn) params.set('checkIn', checkIn);
        if (checkOut) params.set('checkOut', checkOut);
        if (guests.adults) params.set('adults', String(guests.adults));
        if (guests.children !== undefined) params.set('children', String(guests.children));
        if (guests.rooms) params.set('rooms', String(guests.rooms));
        router.push(`/hotels/${hotel.id}?${params.toString()}`);
    };

    const handleSearch = () => {
        if (destination.trim()) {
            // Clear saved state on new search
            sessionStorage.removeItem(STORAGE_KEY);
            // Don't clear allHotels here - let it update naturally to prevent flickering
            setInitialTotalCount(null); // Reset total count

            setPage(0); // Reset page on new search
            const ci = checkIn ? parseDateLocal(checkIn) : searchParams.checkIn;
            const co = checkOut ? parseDateLocal(checkOut) : searchParams.checkOut;

            // Use pending location if available, otherwise preserve existing if query hasn't changed
            const newDestId = pendingLocation.destId ?? (destination === searchParams.query ? searchParams.destId : undefined);
            const newDestType = pendingLocation.destType ?? (destination === searchParams.query ? searchParams.destType : undefined);
            const newLat = pendingLocation.latitude ?? (destination === searchParams.query ? searchParams.latitude : undefined);
            const newLng = pendingLocation.longitude ?? (destination === searchParams.query ? searchParams.longitude : undefined);

            setSearchParams({
                query: destination,
                destId: newDestId,
                destType: newDestType,
                latitude: newLat,
                longitude: newLng,
                checkIn: ci,
                checkOut: co,
                adults: guests.adults,
                children: guests.children,
                rooms: guests.rooms,
            });
            setHasSearched(true); // Collapse mobile detail after searching
            // Sync URL for persistence across navigation
            router.push(buildUrlWithState({ destId: newDestId, destType: newDestType, latitude: newLat, longitude: newLng }));
        }
    };

    const handleFilterChange = (newFilters: FilterType) => {
        sessionStorage.removeItem(STORAGE_KEY); // Clear state on filter change
        // Don't clear allHotels here - prevent flickering during filter changes
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
        <div className="min-h-screen bg-gray-50 pb-20 pt-10 md:pt-15">
            {/* Header Section */}
            <div className="bg-brand-primary text-white py-12 md:py-16">
                <div className="container mx-auto px-4">
                    <h1 className="text-3xl md:text-4xl font-bold mb-3 md:mb-4">Luxury Stays in Addis Ababa</h1>
                    <p className="text-blue-100 text-base md:text-lg max-w-2xl">
                        Discover top-rated hotels with world-class amenities and Ethiopian hospitality.
                    </p>
                </div>
            </div>

            <div className="container mx-auto px-4 -mt-10 md:-mt-12">
                <HotelSearchForm
                    destination={destination}
                    checkIn={checkIn}
                    checkOut={checkOut}
                    guests={guests}
                    isLoading={isLoading && page === 0}
                    onDestinationChange={handleDestinationChange}
                    onLocationSelect={handleLocationSelect}
                    onCheckInChange={setCheckIn}
                    onCheckOutChange={setCheckOut}
                    onGuestsChange={setGuests}
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

                <div className="flex flex-col lg:flex-row gap-8 mt-4">
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
                                {searchParams.query || 'Ethiopia'} – {initialTotalCount || 0} hotels and places to stay
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

                        {/* Load More Button with enhanced loading indicator */}
                        {hasNextPage && (
                            <div className="flex justify-center mt-6">
                                <button
                                    onClick={() => !isLoadingMore && setPage(p => p + 1)}
                                    disabled={isLoadingMore}
                                    aria-busy={isLoadingMore}
                                    className={`px-6 py-3 rounded-xl transition-all text-sm font-bold flex items-center gap-3 shadow-sm ${isLoadingMore
                                        ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                        : 'bg-brand-primary text-white hover:bg-brand-primary/90 hover:shadow-md'
                                        }`}
                                >
                                    {isLoadingMore && (
                                        <Preloader size="sm" className="border-2 border-white/30 border-t-white" />
                                    )}
                                    {isLoadingMore ? 'Loading more hotels...' : 'Load More Results'}
                                </button>
                            </div>
                        )}

                        {/* Collections Sections */}
                        <div className="pt-12 space-y-4">
                            <HotelCollection
                                title={`Hotels with airport shuttles in ${searchParams.query || 'Addis Ababa'}`}
                                hotels={collections.airportShuttle}
                                onBook={handleBook}
                                onSeeAll={() => { }}
                            />

                            <HotelCollection
                                title={`Most booked hotels in ${searchParams.query || 'Addis Ababa'} and surrounding area`}
                                hotels={collections.mostBooked}
                                onBook={handleBook}
                                onSeeAll={() => { }}
                            />

                            <HotelCollection
                                title={`Best hotels with breakfast in ${searchParams.query || 'Addis Ababa'} and nearby`}
                                hotels={collections.breakfast}
                                onBook={handleBook}
                                onSeeAll={() => { }}
                            />

                            <HotelCollection
                                title={`Hotels located in the center of ${searchParams.query || 'Addis Ababa'}`}
                                hotels={collections.center}
                                onBook={handleBook}
                                onSeeAll={() => { }}
                            />


                            <HotelCollection
                                title={`Budget hotels in ${searchParams.query || 'Addis Ababa'} and nearby`}
                                hotels={collections.budget}
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
