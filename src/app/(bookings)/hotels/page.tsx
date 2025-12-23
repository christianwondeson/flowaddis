"use client";

import React, { useState, useEffect } from 'react';
import { BookingModal } from '@/components/booking/booking-modal';
import { HotelSearchForm } from '@/components/hotels/hotel-search-form';
import { HotelList } from '@/components/hotels/hotel-list';
import { HotelFilters } from '@/components/hotels/hotel-filters';
import { useHotels } from '@/hooks/use-hotels';
import { useAuth } from '@/components/providers/auth-provider';
import { useRouter } from 'next/navigation';
import { HotelFilters as FilterType } from '@/types';
import { formatDateLocal, parseDateLocal } from '@/lib/date-utils';
import { HotelCollection } from '@/components/hotels/hotel-collection';
import { HotelFAQ } from '@/components/hotels/hotel-faq';

export default function HotelsPage() {
    const [isBookingOpen, setIsBookingOpen] = useState(false);
    const [selectedHotel, setSelectedHotel] = useState<any>(null);

    // Search State
    const [destination, setDestination] = useState('Ethiopia');
    const [checkIn, setCheckIn] = useState('');
    const [checkOut, setCheckOut] = useState('');

    // Pagination & Filters
    const [page, setPage] = useState(0);
    const [filters, setFilters] = useState<FilterType>({
        sortOrder: 'popularity',
        stars: [],
        minPrice: undefined,
        maxPrice: undefined,
        minRating: undefined,
        amenities: [],
        hotelName: '',
    });

    // Query State (triggers refetch)
    const [searchParams, setSearchParams] = useState({
        query: 'Ethiopia',
        destId: undefined as string | undefined,
        destType: undefined as string | undefined,
        checkIn: undefined as Date | undefined,
        checkOut: undefined as Date | undefined,
    });

    // Initialize from URL
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const urlQuery = urlParams.get('query') || 'Ethiopia';
        const urlDestId = urlParams.get('destId');
        const urlDestType = urlParams.get('destType');
        const urlCheckIn = urlParams.get('checkIn');
        const urlCheckOut = urlParams.get('checkOut');

        const today = new Date();
        const defaultCheckin = urlCheckIn ? new Date(urlCheckIn) : new Date(today.getTime() + 86400000);
        const defaultCheckout = urlCheckOut ? new Date(urlCheckOut) : new Date(defaultCheckin.getTime() + 86400000);

        setDestination(urlQuery);
        setCheckIn(formatDateLocal(defaultCheckin));
        setCheckOut(formatDateLocal(defaultCheckout));

        setSearchParams({
            query: urlQuery,
            destId: urlDestId || undefined,
            destType: urlDestType || undefined,
            checkIn: defaultCheckin,
            checkOut: defaultCheckout,
        });
    }, []);

    // Stable empty array to prevent infinite loops
    const EMPTY_ARRAY: any[] = [];

    const { data, isLoading, error, isPlaceholderData } = useHotels({
        query: searchParams.query,
        destId: searchParams.destId,
        destType: searchParams.destType,
        checkIn: searchParams.checkIn,
        checkOut: searchParams.checkOut,
        page,
        filters,
    });

    const hotels = data?.hotels || EMPTY_ARRAY;
    const hasNextPage = data?.hasNextPage || false;

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
    const airportShuttleHotels = allHotels.filter(h => h.badges?.some((b: string) => b.toLowerCase().includes('shuttle'))).slice(0, 6);
    const breakfastHotels = allHotels.filter(h => h.amenities?.some((a: string) => a.toLowerCase().includes('breakfast'))).slice(0, 6);
    const budgetHotels = [...allHotels].sort((a, b) => a.price - b.price).slice(0, 6);
    const centerHotels = allHotels.filter(h => h.distance?.toLowerCase().includes('centre') || h.distance?.toLowerCase().includes('center')).slice(0, 6);

    // Infinite Scroll Observer
    useEffect(() => {
        const sentinel = document.getElementById('sentinel');
        if (!sentinel) return;

        const observer = new IntersectionObserver(
            (entries) => {
                const entry = entries[0];
                if (entry.isIntersecting && !isLoading && !isPlaceholderData && hasNextPage) {

                    setPage((prev) => prev + 1);
                }
            },
            { threshold: 0.1, rootMargin: '400px' } // Increased margin for smoother loading
        );

        observer.observe(sentinel);
        return () => observer.disconnect();
    }, [isLoading, isPlaceholderData, hasNextPage, page]);

    const { user } = useAuth();
    const router = useRouter();

    const handleBook = (hotel: any) => {
        const params = new URLSearchParams();
        if (hotel.name) params.set('name', hotel.name);
        if (hotel.price != null) params.set('price', String(Math.round(hotel.price)));
        if (hotel.image) params.set('image', hotel.image);
        if (hotel.location) params.set('location', hotel.location);
        router.push(`/hotels/${hotel.id}?${params.toString()}`);
    };

    const handleSearch = () => {
        if (destination.trim()) {
            setPage(0); // Reset page on new search
            setSearchParams({
                query: destination,
                destId: undefined,
                destType: undefined,
                checkIn: checkIn ? parseDateLocal(checkIn) : undefined,
                checkOut: checkOut ? parseDateLocal(checkOut) : undefined,
            });
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
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
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
                />

                <div className="flex flex-col lg:flex-row gap-8 mt-8">
                    {/* Filters Sidebar */}
                    <div className="w-full lg:w-1/4">
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

                        {/* Infinite Scroll Sentinel */}
                        {hasNextPage && (
                            <div id="sentinel" className="h-20 w-full flex items-center justify-center">
                                {isLoading && <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-primary"></div>}
                            </div>
                        )}

                        {/* Fallback Load More Button */}
                        {hasNextPage && !isLoading && (
                            <div className="flex justify-center mt-4">
                                <button
                                    onClick={() => setPage(p => p + 1)}
                                    className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors text-sm font-bold"
                                >
                                    Load More Results
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
