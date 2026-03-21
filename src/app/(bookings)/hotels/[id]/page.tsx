"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { HotelDetailHeader } from '@/components/hotels/hotel-detail-header';
import { HotelDetailGallery } from '@/components/hotels/hotel-detail-gallery';
import { HotelDetailAbout } from '@/components/hotels/hotel-detail-about';
import { HotelDetailAvailability } from '@/components/hotels/hotel-detail-availability';
import { HotelDetailSidebar } from '@/components/hotels/hotel-detail-sidebar';
import { HotelDetailBookingSidebar } from '@/components/hotels/hotel-detail-booking-sidebar';
import { useHotels } from '@/hooks/use-hotels';
import axios from 'axios';
import { BookingModal } from '@/components/booking/booking-modal';
import { formatDateLocal } from '@/lib/date-utils';
import { Preloader } from '@/components/ui/preloader';
import { Button } from '@/components/ui/button';
import { APP_CONSTANTS } from '@/lib/constants';

export default function HotelDetailPage() {
    const { id } = useParams();
    const [activeTab, setActiveTab] = useState('overview');
    const HOTEL_PLACEHOLDER = APP_CONSTANTS.ASSETS?.HOTEL_PLACEHOLDER || '/assets/images/addis-view.jpg';
    const [hotel, setHotel] = useState<any>({
        id,
        name: '',
        location: '',
        rating: 0,
        reviews: 0,
        reviewWord: '',
        price: 0,
        image: HOTEL_PLACEHOLDER,
        images: [HOTEL_PLACEHOLDER],
    });
    const [isBookingOpen, setIsBookingOpen] = useState(false);
    const [selectedPrice, setSelectedPrice] = useState<number>(0);
    const [selectedServiceName, setSelectedServiceName] = useState<string>('');
    const [selectedExternalItemId, setSelectedExternalItemId] = useState<string>('');
    const [isGalleryLoading, setIsGalleryLoading] = useState<boolean>(true);
    const [facilities, setFacilities] = useState<any[]>([]);
    const [apiError, setApiError] = useState<{ message: string; isRateLimit?: boolean } | null>(null);
    const [reviewsList, setReviewsList] = useState<any[]>([]);

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

    const fetchDetails = useCallback(async () => {
        if (!id) return;
        setApiError(null);
        setIsGalleryLoading(true);
        const hotelId = Array.isArray(id) ? id[0] : id;
        const placeholder = APP_CONSTANTS.ASSETS?.HOTEL_PLACEHOLDER || '/assets/images/addis-view.jpg';

        try {
            const [photosRes, reviewsRes, descRes, detailsRes] = await Promise.allSettled([
                axios.get(`/api/hotels/photos?hotelId=${encodeURIComponent(hotelId)}`),
                axios.get(`/api/hotels/reviews?hotelId=${encodeURIComponent(hotelId)}`),
                axios.get(`/api/hotels/description?hotelId=${encodeURIComponent(hotelId)}&locale=en-gb`),
                axios.get(`/api/hotels/data?hotelId=${encodeURIComponent(hotelId)}`),
            ]);

            const isRateLimited = (r: PromiseSettledResult<any>) =>
                r.status === 'rejected' && r.reason?.response?.status === 429;
            const isServerError = (r: PromiseSettledResult<any>) =>
                r.status === 'rejected' && (r.reason?.response?.status === 500 || r.reason?.response?.status === 429);
            const hasCriticalError = [photosRes, detailsRes].some((r) => r.status === 'rejected');
            const anyRateLimit = [photosRes, reviewsRes, descRes, detailsRes].some(isRateLimited);

            if (hasCriticalError || anyRateLimit) {
                setApiError({
                    message: anyRateLimit
                        ? "We're experiencing high demand. Hotel photos and details are temporarily limited. Please try again in a moment."
                        : "We couldn't load some hotel details. Please try again.",
                    isRateLimit: anyRateLimit,
                });
            }

            const photos = photosRes.status === 'fulfilled' ? (photosRes.value.data?.photos || photosRes.value.data || []) : [];
            const rawImages = Array.isArray(photos)
                ? photos.map((p: any) => p.url_max || p.url_1440 || p.url_square60 || p.photo_url).filter(Boolean)
                : [];
            let images = rawImages.filter((url: string) => typeof url === 'string' && (url.startsWith('http://') || url.startsWith('https://')));

            const details = detailsRes.status === 'fulfilled' ? (detailsRes.value.data?.data || detailsRes.value.data || {}) : {};
            const mainPhotoUrl = details?.main_photo_url && typeof details.main_photo_url === 'string'
                ? details.main_photo_url
                : null;
            if (images.length === 0 && mainPhotoUrl && (mainPhotoUrl.startsWith('http://') || mainPhotoUrl.startsWith('https://'))) {
                images = [mainPhotoUrl];
            }
            if (images.length === 0) {
                images = [placeholder];
            }

            const desc = descRes.status === 'fulfilled'
                ? (descRes.value.data?.description || descRes.value.data?.data?.description || descRes.value.data?.data?.[0]?.description || '')
                : (Array.isArray(details?.description_translations) && details.description_translations[0]?.description
                    ? details.description_translations[0].description
                    : '');
            const mappedAmenities: string[] = Array.isArray(details?.facilities)
                ? details.facilities.map((f: any) => f.name || f)
                : (Array.isArray(details?.amenities) ? details.amenities : []);
            const mappedName = details?.name || details?.hotel_name || undefined;
            const mappedAddress = (typeof details?.address === 'string' ? details.address : null) || undefined;
            const mappedRating = details?.review_score ?? details?.reviewScore;
            const mappedReviewCount = details?.review_nr ?? details?.reviewCount;
            const mappedCoordinates = details?.coordinates || details?.location_coordinates || (details?.location && (details.location.longitude != null || details.location.latitude != null) ? details.location : undefined);
            const facilitiesData = details?.facility_groups || details?.facilities || [];
            const ct = details?.checkin_checkout_times;
            let checkin: string | null = null;
            let checkout: string | null = null;
            if (ct) {
                checkin = ct.checkin_from ? `From ${String(ct.checkin_from).replace(/:\d{2}$/, '')}` : (ct.checkin_to ? `Until ${String(ct.checkin_to).replace(/:\d{2}$/, '')}` : null);
                checkout = ct.checkout_to ? `Until ${String(ct.checkout_to).replace(/:\d{2}$/, '')}` : (ct.checkout_from ? `From ${String(ct.checkout_from).replace(/:\d{2}$/, '')}` : null);
            }
            if (!checkin && details?.checkin) checkin = details.checkin.from ? `From ${details.checkin.from}` : details.checkin.to ? `Until ${details.checkin.to}` : null;
            if (!checkout && details?.checkout) checkout = details.checkout.to ? `Until ${details.checkout.to}` : details.checkout.from ? `From ${details.checkout.from}` : null;

            const reviewsData = reviewsRes.status === 'fulfilled'
                ? (reviewsRes.value.data?.result || reviewsRes.value.data?.reviews || [])
                : [];
            setReviewsList(Array.isArray(reviewsData) ? reviewsData : []);

            setFacilities(facilitiesData);
            setHotel((prev: any) => ({
                ...prev,
                images,
                description: desc || prev.description,
                amenities: mappedAmenities?.length ? mappedAmenities : prev.amenities,
                name: mappedName ?? prev.name,
                location: mappedAddress ?? prev.location,
                rating: mappedRating != null ? mappedRating : prev.rating,
                reviews: mappedReviewCount != null ? mappedReviewCount : prev.reviews,
                coordinates: mappedCoordinates ?? prev.coordinates,
                checkin: checkin ?? prev.checkin,
                checkout: checkout ?? prev.checkout,
            }));
        } catch (e) {
            setApiError({ message: "We couldn't load hotel details. Please try again." });
            setHotel((prev: any) => ({
                ...prev,
                images: [placeholder],
            }));
        } finally {
            setIsGalleryLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchDetails();
    }, [fetchDetails]);

    if (isLoading && !hotel.name) {
        return (
            <div className="min-h-screen bg-brand-gray dark:bg-background flex items-center justify-center">
                <Preloader size="lg" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-brand-gray/30 dark:bg-background pb-24 lg:pb-20 pt-16 md:pt-20">
            <HotelDetailHeader
                hotel={hotel}
                activeTab={activeTab}
                onTabChange={setActiveTab}
                onBook={() => {
                    setActiveTab('pricing');
                    window.scrollTo({
                        top: document.getElementById('availability-section')?.offsetTop || 400,
                        behavior: 'smooth'
                    });
                }}
            />

            <div className="container mx-auto px-4 py-8">
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Main Content */}
                    <div className="w-full lg:w-3/4 space-y-12">
                        {activeTab === 'overview' && (
                            <>
                                {apiError && (
                                    <div className="rounded-xl border border-amber-200 dark:border-amber-800/50 bg-amber-50 dark:bg-amber-950/30 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                        <p className="text-sm text-amber-800 dark:text-amber-200">
                                            {apiError.message}
                                        </p>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => fetchDetails()}
                                            className="shrink-0 border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-950/50"
                                        >
                                            Try again
                                        </Button>
                                    </div>
                                )}
                                <HotelDetailGallery
                                    images={hotel.images || [hotel.image]}
                                    loading={isGalleryLoading}
                                    placeholderImage={HOTEL_PLACEHOLDER}
                                />
                                <HotelDetailAbout hotel={hotel} facilities={facilities} loading={isGalleryLoading} />
                            </>
                        )}

                        {activeTab === 'pricing' && (
                            <div id="availability-section">
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
                                    onBook={(p?: number, s?: string, rid?: string) => {
                                        if (p) setSelectedPrice(p);
                                        if (s) setSelectedServiceName(s);
                                        if (rid) setSelectedExternalItemId(rid);
                                        setIsBookingOpen(true);
                                    }}
                                />
                            </div>
                        )}

                        {activeTab === 'facilities' && (
                            <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 shadow-sm border border-gray-100 dark:border-slate-700">
                                <h2 className="text-2xl font-bold text-brand-dark dark:text-foreground mb-6">Facilities & Amenities</h2>
                                <HotelDetailAbout hotel={hotel} facilities={facilities} loading={isGalleryLoading} />
                            </div>
                        )}

                        {activeTab === 'rules' && (
                            <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 shadow-sm border border-gray-100 dark:border-slate-700">
                                <h2 className="text-2xl font-bold text-brand-dark dark:text-foreground mb-6">House Rules</h2>
                                <div className="space-y-6">
                                    <div className="flex gap-4 p-4 bg-brand-gray dark:bg-slate-800/80 rounded-xl">
                                        <div className="font-bold w-32">Check-in</div>
                                        <div>{hotel.checkin || 'From 14:00'}</div>
                                    </div>
                                    <div className="flex gap-4 p-4 bg-brand-gray dark:bg-slate-800/80 rounded-xl">
                                        <div className="font-bold w-32">Check-out</div>
                                        <div>{hotel.checkout || 'Until 12:00'}</div>
                                    </div>
                                    <div className="flex gap-4 p-4 bg-brand-gray dark:bg-slate-800/80 rounded-xl">
                                        <div className="font-bold w-32">Cancellation</div>
                                        <div>Cancellation and prepayment policies vary according to accommodation type. See each room option for details.</div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'reviews' && (
                            <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 shadow-sm border border-gray-100 dark:border-slate-700">
                                <h2 className="text-2xl font-bold text-brand-dark dark:text-foreground mb-6">Guest Reviews</h2>
                                <HotelDetailSidebar hotel={hotel} reviews={reviewsList} onBook={() => setActiveTab('pricing')} />
                            </div>
                        )}
                    </div>

                    {/* Sidebar - Booking widget + review/map (mockup: Best Price, dates, guest, price, Check Availability) */}
                    <div className="hidden lg:block lg:w-1/4">
                        <div className="sticky top-24 space-y-4">
                            <HotelDetailBookingSidebar
                                hotel={hotel}
                                checkIn={checkInDate}
                                checkOut={checkOutDate}
                                adults={adults}
                                children={children}
                                rooms={rooms}
                                onDateChange={(ci, co) => {
                                    setCheckInDate(ci);
                                    setCheckOutDate(co);
                                }}
                                onGuestsChange={(ad, ch, rm) => {
                                    setAdults(ad);
                                    setChildren(ch);
                                    setRoomsCount(rm);
                                }}
                                onCheckAvailability={() => {
                                    setActiveTab('pricing');
                                    window.scrollTo({
                                        top: document.getElementById('availability-section')?.offsetTop || 400,
                                        behavior: 'smooth'
                                    });
                                }}
                            />
                            <HotelDetailSidebar
                                hotel={hotel}
                                reviews={reviewsList}
                                onBook={() => {
                                    setActiveTab('pricing');
                                    window.scrollTo({
                                        top: document.getElementById('availability-section')?.offsetTop || 400,
                                        behavior: 'smooth'
                                    });
                                }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <BookingModal
                isOpen={isBookingOpen}
                onClose={() => {
                    setIsBookingOpen(false);
                    setSelectedServiceName('');
                }}
                serviceName={selectedServiceName || hotel.name}
                price={selectedPrice || hotel.price}
                externalItemId={selectedExternalItemId || hotel.id || (Array.isArray(id) ? id[0] : id)}
                type="hotel"
                initialCheckIn={checkInDate}
                initialCheckOut={checkOutDate}
                isLocal={true}
            />

            {/* Mobile bottom bar - fixed, safe-area aware */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-t border-gray-200 dark:border-slate-700 px-4 py-4 z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] dark:shadow-[0_-4px_20px_rgba(0,0,0,0.35)]" style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}>
                <div className="container mx-auto flex items-center justify-between gap-4 max-w-lg">
                    <div>
                        <p className="text-xs text-gray-500 dark:text-slate-400">From</p>
                        <p className="text-xl font-bold text-brand-dark dark:text-foreground">
                            ${hotel.price}<span className="text-sm font-normal text-gray-500 dark:text-slate-400">/night</span>
                        </p>
                    </div>
                    <Button
                        onClick={() => {
                            setActiveTab('pricing');
                            window.scrollTo({
                                top: document.getElementById('availability-section')?.offsetTop || 400,
                                behavior: 'smooth'
                            });
                        }}
                        className="bg-brand-primary hover:bg-brand-primary/90 active:scale-[0.98] text-white font-bold px-8 py-3 rounded-2xl shrink-0 shadow-lg shadow-brand-primary/25 min-h-[48px]"
                    >
                        Book now
                    </Button>
                </div>
            </div>
        </div>
    );
}
