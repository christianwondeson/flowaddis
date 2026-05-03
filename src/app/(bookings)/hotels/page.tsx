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
import { AdContainer } from '@/components/ads/ad-container';
import { AdConfig } from '@/lib/types/ads';
import { DEFAULT_HOTEL_DESTINATION_QUERY } from '@/lib/hotel-search-location';

// Left sidebar ads (sticky with filters)
const HOTEL_ADS_LEFT: AdConfig[] = [
    {
        id: 'hotel-left-1',
        imageUrl: '/ads/partnership-mobile-ad.png',
        altText: 'Partnership Opportunities - Advertise Your Brand',
        linkUrl: '/contact',
        targetBlank: false
    }
];

// Right sidebar ads (sticky when scrolling)
const HOTEL_ADS_RIGHT: AdConfig[] = [
    {
        id: 'hotel-promo-1',
        imageUrl: '/ads/hotel-ad-sample.png',
        altText: 'Luxury Stays in Addis Ababa',
        linkUrl: '#',
        targetBlank: false
    },
    {
        id: 'partnership-opportunity-2',
        imageUrl: '/ads/partnership-mobile-ad.png',
        altText: 'Partnership Opportunities - Advertise Your Brand',
        linkUrl: '/contact',
        targetBlank: false
    }
];

function HotelsPageContent() {
    // Read initial params from URL synchronously to avoid an extra initial fetch
    const search = useSearchParams();
    const searchStr = search.toString();
    const isPickLocationMode = new URLSearchParams(searchStr).get('pickLocation') === '1';
    const initialQuery = search.get('query') || DEFAULT_HOTEL_DESTINATION_QUERY;
    const initialDestId = search.get('destId') || undefined;
    const initialDestType = search.get('destType') || undefined;
    const urlCheckIn = search.get('checkIn');
    const urlCheckOut = search.get('checkOut');
    const today = new Date();
    const defaultCheckin = urlCheckIn ? new Date(urlCheckIn) : new Date(today.getTime() + 86400000);
    const defaultCheckout = urlCheckOut ? new Date(urlCheckOut) : new Date(defaultCheckin.getTime() + 86400000);
    const initialCheckInStr = formatDateLocal(defaultCheckin);
    const initialCheckOutStr = formatDateLocal(defaultCheckout);
    // Default to showing highest class / highly rated hotels first
    const initialSortOrder = (search.get('sortOrder') as any) || 'class_descending';
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

    // Controls whether mobile search renders expanded initially
    const [hasSearched, setHasSearched] = useState(!isPickLocationMode);

    // Pagination & Filters
    const [page, setPage] = useState(0);
    const [filters, setFilters] = useState<FilterType>({
        query: initialQuery,
        destId: initialDestId,
        destType: initialDestType,
        sortOrder: initialSortOrder,
        stars: initialStars,
        minPrice: initialMinPrice ? Number(initialMinPrice) : undefined,
        maxPrice: initialMaxPrice ? Number(initialMaxPrice) : undefined,
        minRating: initialMinRating ? Number(initialMinRating) : undefined,
        amenities: initialAmenities,
        hotelName: initialHotelName,
    });

    // Query State derived from URL (Single Source of Truth)
    const searchParams = useMemo(() => {
        const urlParams = new URLSearchParams(searchStr);
        const q = urlParams.get('query') || DEFAULT_HOTEL_DESTINATION_QUERY;
        const ci = urlParams.get('checkIn');
        const co = urlParams.get('checkOut');
        const ad = Number(urlParams.get('adults')) || 2;
        const ch = Number(urlParams.get('children')) || 0;
        const rm = Number(urlParams.get('rooms')) || 1;

        const ciDate = ci ? parseDateLocal(ci) : new Date(Date.now() + 86400000);
        const coDate = co ? parseDateLocal(co) : new Date(ciDate.getTime() + 86400000);

        return {
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
        };
    }, [searchStr]);

    // Sync local form state with URL when URL changes
    useEffect(() => {
        setDestination(searchParams.query);
        setCheckIn(formatDateLocal(searchParams.checkIn));
        setCheckOut(formatDateLocal(searchParams.checkOut));
        setGuests({
            adults: searchParams.adults,
            children: searchParams.children,
            rooms: searchParams.rooms
        });
        const urlPick = new URLSearchParams(searchStr).get('pickLocation') === '1';
        setHasSearched(!urlPick);

        // Update filters from URL
        const urlParams = new URLSearchParams(searchStr);
        setFilters({
            query: urlParams.get('query') || DEFAULT_HOTEL_DESTINATION_QUERY,
            destId: urlParams.get('destId') || undefined,
            destType: urlParams.get('destType') || undefined,
            // If no explicit sort in URL, prefer highest class / highly rated by default
            sortOrder: (urlParams.get('sortOrder') as any) || 'class_descending',
            stars: (urlParams.get('stars') || '').split(',').map(Number).filter(Boolean),
            minPrice: urlParams.get('minPrice') ? Number(urlParams.get('minPrice')) : undefined,
            maxPrice: urlParams.get('maxPrice') ? Number(urlParams.get('maxPrice')) : undefined,
            minRating: urlParams.get('minRating') ? Number(urlParams.get('minRating')) : undefined,
            amenities: (urlParams.get('amenities') || '').split(',').filter(Boolean),
            hotelName: urlParams.get('hotelName') || '',
        });
    }, [searchParams, searchStr]);

    // Pick-mode landing: bring the search card into view (mobile + desktop)
    useEffect(() => {
        if (!isPickLocationMode) return;
        const id = 'hotel-search-anchor';
        const frame = window.requestAnimationFrame(() => {
            document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
        return () => window.cancelAnimationFrame(frame);
    }, [isPickLocationMode]);

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
    }, { enabled: !isPickLocationMode });

    const EMPTY_HOTELS: any[] = [];
    const hotels = data?.hotels ?? EMPTY_HOTELS;
    const hasNextPage = data?.hasNextPage || false;
    const isLoadingMore = isLoading && page > 0;

    // Accumulate hotels for "Load More"
    const [allHotels, setAllHotels] = useState<any[]>([]);
    // Stabilize total count
    const [initialTotalCount, setInitialTotalCount] = useState<number | null>(null);

    /** Legacy key: previously stored full hotel results (prices/PII risk). Removed — URL + refetch is source of truth. */
    const LEGACY_HOTEL_SEARCH_STORAGE_KEY = 'hotel_search_state';
    useEffect(() => {
        try {
            sessionStorage.removeItem(LEGACY_HOTEL_SEARCH_STORAGE_KEY);
        } catch {
            /* ignore */
        }
    }, []);

    useEffect(() => {
        if (isPickLocationMode) return;
        if (isLoading) return;

        // Always update total count when on page 0 (fresh search/filter)
        // This ensures the count stays in sync with the actual API response
        if (data?.totalCount !== undefined && page === 0) {
            if (initialTotalCount !== data.totalCount) {
                setInitialTotalCount(data.totalCount);
            }
        }

        if (page === 0) {
            setAllHotels((prev) => (prev === hotels ? prev : hotels));
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

        // Never persist pick-location mode into actual searches
        params.delete('pickLocation');

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
        // Never put price in the URL — auditors flagged tampering; Stripe/Nest always derive amount server-side.
        if (hotel.image) params.set('image', hotel.image);
        if (hotel.location) params.set('location', hotel.location);
        if (searchParams.query) params.set('searchQuery', searchParams.query);
        if (searchParams.destId) params.set('searchDestId', searchParams.destId);
        if (searchParams.destType) params.set('searchDestType', searchParams.destType);
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
            sessionStorage.removeItem(LEGACY_HOTEL_SEARCH_STORAGE_KEY);
            setInitialTotalCount(null); // Reset total count
            setPage(0); // Reset page on new search

            // Use pending location if available, otherwise preserve existing if query hasn't changed
            const newDestId = pendingLocation.destId ?? (destination === searchParams.query ? searchParams.destId : undefined);
            const newDestType = pendingLocation.destType ?? (destination === searchParams.query ? searchParams.destType : undefined);
            const newLat = pendingLocation.latitude ?? (destination === searchParams.query ? searchParams.latitude : undefined);
            const newLng = pendingLocation.longitude ?? (destination === searchParams.query ? searchParams.longitude : undefined);

            // Sync URL for persistence across navigation - this will trigger the useMemo and fetch
            router.push(buildUrlWithState({ destId: newDestId, destType: newDestType, latitude: newLat, longitude: newLng }));
        }
    };

    /** Run search immediately when user selects a location (auto-search for easier UX) */
    const handleLocationSelectAndSearch = (location: { name?: string; label?: string; dest_id?: string; dest_type?: string }) => {
        const name = (location.name ?? location.label ?? destination).toString().trim() || DEFAULT_HOTEL_DESTINATION_QUERY;
        const destId = location.dest_id;
        const destType = location.dest_type;
        setDestination(name);
        setPendingLocation({ destId, destType });
        sessionStorage.removeItem(LEGACY_HOTEL_SEARCH_STORAGE_KEY);
        setInitialTotalCount(null);
        setPage(0);
        router.push(buildUrlWithState({ query: name, destId, destType }));
    };

    const handleFilterChange = (newFilters: FilterType) => {
        sessionStorage.removeItem(LEGACY_HOTEL_SEARCH_STORAGE_KEY); // Clear state on filter change
        setPage(0); // Reset page on filter change
        setInitialTotalCount(null); // Reset total until new data arrives

        const extras: Record<string, string | number | undefined> = {
            sortOrder: newFilters.sortOrder,
            stars: newFilters.stars && newFilters.stars.length ? newFilters.stars.join(',') : "",
            minPrice: newFilters.minPrice ?? "",
            maxPrice: newFilters.maxPrice ?? "",
            minRating: newFilters.minRating ?? "",
            amenities: newFilters.amenities && newFilters.amenities.length ? newFilters.amenities.join(',') : "",
            hotelName: newFilters.hotelName || "",
        };
        if (newFilters.query !== undefined) {
            extras.query = newFilters.query;
        }
        // LocationInput: only touch URL dest when filters payload includes destId (select or typed clear)
        if (Object.prototype.hasOwnProperty.call(newFilters, 'destId')) {
            extras.destId = newFilters.destId || '';
            extras.destType = newFilters.destType || '';
        }

        const nextUrl = buildUrlWithState(extras);
        router.push(nextUrl);
    };

    const displayLocation = searchParams.query === DEFAULT_HOTEL_DESTINATION_QUERY
        ? 'Addis Ababa, Ethiopia'
        : (searchParams.query || DEFAULT_HOTEL_DESTINATION_QUERY);

    const staySummary = useMemo(() => {
        try {
            const nights = Math.max(
                1,
                Math.round((searchParams.checkOut.getTime() - searchParams.checkIn.getTime()) / 86400000)
            );
            const adults = searchParams.adults || 2;
            return `${nights} night${nights !== 1 ? 's' : ''}, ${adults} adult${adults !== 1 ? 's' : ''}`;
        } catch {
            return '1 night, 2 adults';
        }
    }, [searchParams.checkIn, searchParams.checkOut, searchParams.adults]);

    return (
        <AdContainer leftAds={HOTEL_ADS_LEFT} rightAds={HOTEL_ADS_RIGHT}>
            <div className="min-h-screen pt-0 pb-8 md:pb-20 page-muted">
                {/* Header Section - compact per mockup */}
                <div className="bg-teal-600 text-white py-4 sm:py-5 md:py-6">
                    <div className="container mx-auto px-4 sm:px-6 lg:px-6">
                        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-1 md:mb-2 tracking-tight">
                            Luxury Stays in {displayLocation}
                        </h1>
                        {isPickLocationMode ? (
                            <p className="text-teal-100/95 text-sm sm:text-base max-w-2xl mt-1">
                                Pick your destination from the suggestions, then press Search — we have not run your hotel search yet.
                            </p>
                        ) : (
                            <p className="text-teal-100/90 text-sm sm:text-base max-w-2xl">
                                Discover the perfect accommodation for your trip.
                            </p>
                        )}
                    </div>
                </div>

                <div className="container mx-auto px-4 sm:px-6 lg:px-6 -mt-4 sm:-mt-5 md:-mt-6">
                    <div id="hotel-search-anchor" className="scroll-mt-20 sm:scroll-mt-24">
                    <HotelSearchForm
                        destination={destination}
                        checkIn={checkIn}
                        checkOut={checkOut}
                        guests={guests}
                        isLoading={isLoading && page === 0}
                        onDestinationChange={handleDestinationChange}
                        onLocationSelect={handleLocationSelect}
                        onLocationSelectAndSearch={handleLocationSelectAndSearch}
                        onCheckInChange={setCheckIn}
                        onCheckOutChange={setCheckOut}
                        onGuestsChange={setGuests}
                        onSearch={handleSearch}
                        initialOpen={!hasSearched}
                        // When arriving from home cards, open dropdown so user selects exact destination first
                        locationAutoOpen={isPickLocationMode}
                        pickLocationMode={isPickLocationMode}
                    />
                    </div>

                    {/* Mobile Filter Bar (Sort, Filter, Map) — hidden until a real search runs */}
                    {!isPickLocationMode && (
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
                                destId: searchParams.destId,
                                destType: searchParams.destType,
                                checkIn: checkIn || undefined,
                                checkOut: checkOut || undefined,
                                adults: String(guests.adults),
                                children: String(guests.children),
                                rooms: String(guests.rooms),
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
                    )}

                    <div className="flex flex-col lg:flex-row gap-8 mt-4">
                        {/* Filters Sidebar (visible on lg and above, sticky when scrolling) */}
                        {!isPickLocationMode && (
                        <div className="hidden lg:block lg:w-1/4 shrink-0">
                            <div className="sticky top-24 self-start">
                                <HotelFilters
                                hotels={allHotels}
                                filters={filters}
                                onFilterChange={handleFilterChange}
                                checkIn={checkIn}
                                checkOut={checkOut}
                                destId={data?.destId}
                                linkParams={{
                                    query: destination,
                                    destId: searchParams.destId,
                                    destType: searchParams.destType,
                                    checkIn: checkIn || undefined,
                                    checkOut: checkOut || undefined,
                                    adults: String(guests.adults),
                                    children: String(guests.children),
                                    rooms: String(guests.rooms),
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
                        </div>
                        )}

                        {/* Results Content */}
                        <div className={isPickLocationMode ? 'w-full space-y-6' : 'w-full lg:w-3/4 space-y-6'}>
                            {/* Results Header - mockup: "Addis Ababa - 207 hotels" */}
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                                <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-slate-100">
                                    {isPickLocationMode
                                        ? 'Ready when you are'
                                        : `${searchParams.query || DEFAULT_HOTEL_DESTINATION_QUERY} – ${filters.hotelName
                                              ? allHotels.filter((h) =>
                                                    h.name.toLowerCase().includes(filters.hotelName!.toLowerCase()),
                                                ).length
                                              : initialTotalCount ?? 0} hotels`}
                                </h2>

                                {/* Sorting Tabs - mockup style */}
                                {!isPickLocationMode && (
                                <div className="flex flex-wrap gap-2">
                                    {[
                                        { label: 'Lowest Price First', value: 'price' },
                                        { label: 'Star rating and price', value: 'class_descending' },
                                    ].map((tab) => {
                                        const isActive = filters.sortOrder === tab.value;
                                        return (
                                            <button
                                                key={tab.value}
                                                onClick={() => handleFilterChange({ ...filters, sortOrder: tab.value })}
                                                className={`px-4 py-2.5 text-sm font-bold rounded-xl border transition-all duration-200 min-h-[44px] ${isActive
                                                    ? "bg-teal-600 border-teal-600 text-white shadow-sm"
                                                    : "bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-600 text-gray-600 dark:text-slate-300 hover:border-teal-600 hover:text-teal-600 dark:hover:text-teal-400"
                                                    }`}
                                            >
                                                {tab.label}
                                            </button>
                                        );
                                    })}
                                </div>
                                )}
                            </div>

                            {/* Hotel List */}
                            <HotelList
                                hotels={allHotels.filter(
                                    (h) => !filters.hotelName || h.name.toLowerCase().includes(filters.hotelName.toLowerCase())
                                )}
                                isLoading={isLoading && page === 0}
                                error={error}
                                onBook={handleBook}
                                staySummary={staySummary}
                                awaitingDestinationPick={isPickLocationMode}
                            />

                            {/* Infinite scroll sentinel removed */}

                            {/* Load More Button with enhanced loading indicator */}
                            {!isPickLocationMode && hasNextPage && (
                                <div className="flex justify-center mt-6">
                                    <button
                                        onClick={() => !isLoadingMore && setPage(p => p + 1)}
                                        disabled={isLoadingMore}
                                        aria-busy={isLoadingMore}
                                        className={`px-6 py-3 rounded-2xl transition-all duration-300 text-sm font-bold flex items-center gap-3 shadow-sm min-h-[48px] ${isLoadingMore
                                            ? 'bg-gray-200 dark:bg-slate-700 text-gray-500 dark:text-slate-400 cursor-not-allowed'
                                            : 'bg-teal-600 text-white hover:bg-teal-700 hover:shadow-md active:scale-[0.99]'
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
                            {!isPickLocationMode && (
                            <div className="pt-12 space-y-4">
                                <HotelCollection
                                    title={`Hotels with airport shuttles in ${searchParams.query || DEFAULT_HOTEL_DESTINATION_QUERY}`}
                                    hotels={collections.airportShuttle}
                                    onBook={handleBook}
                                    onSeeAll={() => { }}
                                />

                                <HotelCollection
                                    title={`Most booked hotels in ${searchParams.query || DEFAULT_HOTEL_DESTINATION_QUERY} and surrounding area`}
                                    hotels={collections.mostBooked}
                                    onBook={handleBook}
                                    onSeeAll={() => { }}
                                />

                                <HotelCollection
                                    title={`Best hotels with breakfast in ${searchParams.query || DEFAULT_HOTEL_DESTINATION_QUERY} and nearby`}
                                    hotels={collections.breakfast}
                                    onBook={handleBook}
                                    onSeeAll={() => { }}
                                />

                                <HotelCollection
                                    title={`Hotels located in the center of ${searchParams.query || DEFAULT_HOTEL_DESTINATION_QUERY}`}
                                    hotels={collections.center}
                                    onBook={handleBook}
                                    onSeeAll={() => { }}
                                />


                                <HotelCollection
                                    title={`Budget hotels in ${searchParams.query || DEFAULT_HOTEL_DESTINATION_QUERY} and nearby`}
                                    hotels={collections.budget}
                                    onBook={handleBook}
                                    onSeeAll={() => { }}
                                />
                            </div>
                            )}

                            {/* FAQ Section */}
                            {!isPickLocationMode && (
                            <HotelFAQ location={searchParams.query || DEFAULT_HOTEL_DESTINATION_QUERY} />
                            )}
                        </div>
                    </div>
                </div>

                <BookingModal
                    isOpen={isBookingOpen}
                    onClose={() => setIsBookingOpen(false)}
                    serviceName={selectedHotel ? selectedHotel.name : 'Hotel Booking'}
                    price={selectedHotel?.price || 0}
                    type="hotel"
                    isLocal={true}
                />
            </div>
        </AdContainer>
    );
}

export default function HotelsPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Preloader size="lg" /></div>}>
            <HotelsPageContent />
        </Suspense>
    );
}
