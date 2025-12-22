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
import { formatDateLocal } from '@/lib/date-utils';

export default function HotelsPage() {
    const [isBookingOpen, setIsBookingOpen] = useState(false);
    const [selectedHotel, setSelectedHotel] = useState<any>(null);

    // Search State
    const [destination, setDestination] = useState('Addis Ababa');
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
        query: 'Addis Ababa',
        checkIn: undefined as Date | undefined,
        checkOut: undefined as Date | undefined,
    });

    // Initialize dates
    useEffect(() => {
        const today = new Date();
        const defaultCheckin = new Date(today);
        defaultCheckin.setDate(today.getDate() + 14);
        const defaultCheckout = new Date(defaultCheckin);
        defaultCheckout.setDate(defaultCheckin.getDate() + 1);

        const checkInStr = formatDateLocal(defaultCheckin);
        const checkOutStr = formatDateLocal(defaultCheckout);

        setCheckIn(checkInStr);
        setCheckOut(checkOutStr);

        // Initial search
        setSearchParams({
            query: 'Addis Ababa',
            checkIn: defaultCheckin,
            checkOut: defaultCheckout,
        });
    }, []);

    // Stable empty array to prevent infinite loops
    const EMPTY_ARRAY: any[] = [];

    const { data, isLoading, error, isPlaceholderData } = useHotels({
        query: searchParams.query,
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
        if (page === 0) {
            console.log('Page 0: Resetting allHotels to current hotels');
            setAllHotels(hotels);
        } else if (hotels.length > 0 && !isPlaceholderData) {
            console.log(`Page ${page}: Appending ${hotels.length} new hotels`);
            setAllHotels((prev) => {
                // Avoid duplicates by ID
                const existingIds = new Set(prev.map(h => h.id));
                const newHotels = hotels.filter((h: any) => !existingIds.has(h.id));

                if (newHotels.length === 0) {
                    console.log('No new hotels to append');
                    return prev;
                }
                return [...prev, ...newHotels];
            });
        }
    }, [hotels, page, isPlaceholderData]);

    // Infinite Scroll Observer
    useEffect(() => {
        const sentinel = document.getElementById('sentinel');
        if (!sentinel) return;

        const observer = new IntersectionObserver(
            (entries) => {
                const entry = entries[0];
                if (entry.isIntersecting && !isLoading && !isPlaceholderData && hasNextPage) {
                    console.log('Sentinel visible, loading next page:', page + 1);
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
        if (!user) {
            router.push('/signin?redirect=/hotels');
            return;
        }
        setSelectedHotel(hotel);
        setIsBookingOpen(true);
    };

    const handleSearch = () => {
        if (destination.trim()) {
            setPage(0); // Reset page on new search
            setSearchParams({
                query: destination,
                checkIn: checkIn ? new Date(checkIn) : undefined,
                checkOut: checkOut ? new Date(checkOut) : undefined,
            });
        }
    };

    const handleFilterChange = (newFilters: FilterType) => {
        setPage(0); // Reset page on filter change
        setFilters(newFilters);
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

                    {/* Hotel List */}
                    <div className="w-full lg:w-3/4">
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
                                    className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                                >
                                    Load More Results
                                </button>
                            </div>
                        )}

                        {isLoading && page > 0 && (
                            <div className="flex justify-center mt-4">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-primary"></div>
                            </div>
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
            />
        </div>
    );
}
