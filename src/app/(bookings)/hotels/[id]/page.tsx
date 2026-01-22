"use client";

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { HotelDetailHeader } from '@/components/hotels/hotel-detail-header';
import { HotelDetailGallery } from '@/components/hotels/hotel-detail-gallery';
import { HotelDetailAbout } from '@/components/hotels/hotel-detail-about';
import { HotelDetailAvailability } from '@/components/hotels/hotel-detail-availability';
import { HotelDetailSidebar } from '@/components/hotels/hotel-detail-sidebar';
import { useHotels } from '@/hooks/use-hotels';
import axios from 'axios';
import { BookingModal } from '@/components/booking/booking-modal';
import { formatDateLocal } from '@/lib/date-utils';
import { Preloader } from '@/components/ui/preloader';

export default function HotelDetailPage() {
    const { id } = useParams();
    const [activeTab, setActiveTab] = useState('overview');
    const [hotel, setHotel] = useState<any>({
        id,
        name: '',
        location: '',
        rating: 0,
        reviews: 0,
        reviewWord: '',
        price: 0,
        image: '/images/hotel-placeholder.jpg',
        images: [
            '/images/hotel-placeholder.jpg',
            '/images/hotel-placeholder.jpg',
            '/images/hotel-placeholder.jpg',
            '/images/hotel-placeholder.jpg',
        ]
    });
    const [isBookingOpen, setIsBookingOpen] = useState(false);
    const [isGalleryLoading, setIsGalleryLoading] = useState<boolean>(true);

    // Manage dates
    const [checkInDate, setCheckInDate] = useState<string>('');
    const [checkOutDate, setCheckOutDate] = useState<string>('');

    // Manage guests and rooms
    const [adults, setAdults] = useState<number>(2);
    const [children, setChildren] = useState<number>(0);
    const [rooms, setRoomsCount] = useState<number>(1);

    // In a real app, we would fetch by ID. 
    // For now, we'll find it from the search results or use mock data.
    const { data, isLoading } = useHotels({ query: 'Ethiopia' });

    useEffect(() => {
        // Seed basic details from URL query string if present
        if (typeof window !== 'undefined') {
            const usp = new URLSearchParams(window.location.search);
            const name = usp.get('name');
            const price = usp.get('price');
            const image = usp.get('image');
            const location = usp.get('location');
            const ci = usp.get('checkIn') || usp.get('checkin') || usp.get('checkInDate') || formatDateLocal(new Date(Date.now() + 86400000));
            const co = usp.get('checkOut') || usp.get('checkout') || usp.get('checkOutDate') || formatDateLocal(new Date(Date.now() + 172800000));
            const ad = Number(usp.get('adults')) || 2;
            const ch = Number(usp.get('children')) || 0;
            const rm = Number(usp.get('rooms')) || 1;

            setCheckInDate(ci);
            setCheckOutDate(co);
            setAdults(ad);
            setChildren(ch);
            setRoomsCount(rm);

            setHotel((prev: any) => ({
                ...prev,
                ...(name ? { name } : {}),
                ...(price ? { price: Number(price) } : {}),
                ...(image ? { image } : {}),
                ...(location ? { location } : {}),
            }));
        }

        if (data?.hotels) {
            const found = data.hotels.find((h: any) => h.id === id);
            if (found) {
                setHotel(found);
            }
        }
    }, [id, data]);

    // Fetch photos, reviews, description, and details for this hotel
    useEffect(() => {
        const fetchDetails = async () => {
            try {
                if (!id) return;
                const hotelId = Array.isArray(id) ? id[0] : id;

                const [photosRes, reviewsRes, descRes, detailsRes] = await Promise.all([
                    axios.get(`/api/hotels/photos?hotelId=${encodeURIComponent(hotelId)}`),
                    axios.get(`/api/hotels/reviews?hotelId=${encodeURIComponent(hotelId)}`),
                    axios.get(`/api/hotels/description?hotelId=${encodeURIComponent(hotelId)}&locale=en-gb`),
                    axios.get(`/api/hotels/data?hotelId=${encodeURIComponent(hotelId)}`),
                ]);

                const photos = photosRes.data?.photos || photosRes.data || [];
                const images = Array.isArray(photos)
                    ? photos.map((p: any) => p.url_max || p.url_1440 || p.url_square600 || p.photo_url).filter(Boolean)
                    : hotel.images;

                const desc = descRes.data?.description || descRes.data?.data?.description || descRes.data?.data?.[0]?.description || '';

                // Map details endpoint (varies by API). Try common fields safely.
                const details = detailsRes.data?.data || detailsRes.data || {};
                const mappedAmenities: string[] = Array.isArray(details?.facilities)
                    ? details.facilities.map((f: any) => f.name || f)
                    : (Array.isArray(details?.amenities) ? details.amenities : []);
                const mappedName = details?.name || details?.hotel_name || undefined;
                const mappedAddress = details?.address || details?.location || undefined;
                const mappedRating = details?.review_score || details?.reviewScore || undefined;
                const mappedReviewCount = details?.review_nr || details?.reviewCount || undefined;

                setHotel((prev: any) => ({
                    ...prev,
                    images: images && images.length > 0 ? images : prev.images,
                    description: desc || prev.description,
                    amenities: mappedAmenities && mappedAmenities.length > 0 ? mappedAmenities : prev.amenities,
                    name: mappedName || prev.name,
                    location: mappedAddress || prev.location,
                    rating: mappedRating != null ? mappedRating : prev.rating,
                    reviews: mappedReviewCount != null ? mappedReviewCount : prev.reviews,
                }));
                setIsGalleryLoading(false);
            } catch (e) {
                // Silent fail; keep mock data
                console.warn('Failed to fetch extra hotel details');
                setIsGalleryLoading(false);
            }
        };
        fetchDetails();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    if (isLoading && !hotel.name) {
        return (
            <div className="min-h-screen bg-brand-gray flex items-center justify-center">
                <Preloader size="lg" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-brand-gray pb-20 pt-15">
            <HotelDetailHeader
                hotel={hotel}
                activeTab={activeTab}
                onTabChange={setActiveTab}
                onBook={() => setIsBookingOpen(true)}
            />

            <div className="container mx-auto px-4 py-8">
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Main Content */}
                    <div className="w-full lg:w-3/4 space-y-12">
                        {activeTab === 'overview' && (
                            <>
                                <HotelDetailGallery images={hotel.images || [hotel.image]} loading={isGalleryLoading} />
                                <HotelDetailAbout hotel={hotel} />
                            </>
                        )}

                        {activeTab === 'pricing' && (
                            <HotelDetailAvailability
                                hotel={hotel}
                                checkInDate={checkInDate}
                                checkOutDate={checkOutDate}
                                adults={adults}
                                childrenCount={children}
                                roomsCount={rooms}
                                onDateChange={(ci: string, co: string) => {
                                    setCheckInDate(ci);
                                    setCheckOutDate(co);
                                }}
                                onGuestsChange={(ad: number, ch: number, rm: number) => {
                                    setAdults(ad);
                                    setChildren(ch);
                                    setRoomsCount(rm);
                                }}
                                onBook={() => setIsBookingOpen(true)}
                            />
                        )}

                        {activeTab === 'facilities' && (
                            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                                <h2 className="text-2xl font-bold text-brand-dark mb-6">Facilities & Amenities</h2>
                                <HotelDetailAbout hotel={hotel} />
                            </div>
                        )}

                        {activeTab === 'rules' && (
                            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                                <h2 className="text-2xl font-bold text-brand-dark mb-6">House Rules</h2>
                                <div className="space-y-6">
                                    <div className="flex gap-4 p-4 bg-brand-gray rounded-xl">
                                        <div className="font-bold w-32">Check-in</div>
                                        <div>From 15:00 to 00:00</div>
                                    </div>
                                    <div className="flex gap-4 p-4 bg-brand-gray rounded-xl">
                                        <div className="font-bold w-32">Check-out</div>
                                        <div>Until 11:00</div>
                                    </div>
                                    <div className="flex gap-4 p-4 bg-brand-gray rounded-xl">
                                        <div className="font-bold w-32">Cancellation</div>
                                        <div>Cancellation and prepayment policies vary according to accommodation type.</div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'reviews' && (
                            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                                <h2 className="text-2xl font-bold text-brand-dark mb-6">Guest Reviews</h2>
                                <HotelDetailSidebar hotel={hotel} onBook={() => setIsBookingOpen(true)} />
                            </div>
                        )}
                    </div>

                    {/* Sidebar */}
                    {activeTab === 'overview' && (
                        <div className="w-full lg:w-1/4">
                            <HotelDetailSidebar hotel={hotel} onBook={() => setIsBookingOpen(true)} />
                        </div>
                    )}
                </div>
            </div>

            {/* Booking Modal */}
            <BookingModal
                isOpen={isBookingOpen}
                onClose={() => setIsBookingOpen(false)}
                serviceName={hotel.name}
                price={hotel.price}
                type="hotel"
                initialCheckIn={checkInDate}
                initialCheckOut={checkOutDate}
            />
        </div>
    );
}
