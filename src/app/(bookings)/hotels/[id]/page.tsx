"use client";

import React, { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { HotelDetailHeader } from '@/components/hotels/hotel-detail-header';
import { HotelDetailGallery } from '@/components/hotels/hotel-detail-gallery';
import { HotelDetailAbout } from '@/components/hotels/hotel-detail-about';
import { HotelDetailAvailability } from '@/components/hotels/hotel-detail-availability';
import { HotelDetailSidebar } from '@/components/hotels/hotel-detail-sidebar';
import { HotelDetailReviews } from '@/components/hotels/hotel-detail-reviews';
import { HotelDetailBookingSidebar } from '@/components/hotels/hotel-detail-booking-sidebar';
import { useHotels } from '@/hooks/use-hotels';
import axios from 'axios';
import { BookingModal } from '@/components/booking/booking-modal';
import { formatDateLocal } from '@/lib/date-utils';
import { Preloader } from '@/components/ui/preloader';
import { Button } from '@/components/ui/button';
import { APP_CONSTANTS } from '@/lib/constants';
import { DEFAULT_HOTEL_DESTINATION_QUERY } from '@/lib/hotel-search-location';
import { buildHotelDetailMapUrl, deriveDestinationQueryFromHotelLocation } from '@/lib/hotel-search-url';
import { useTranslations } from '@/components/providers/locale-provider';
import { resolveStrapiFileUrl } from '@/lib/admin-cms-client';

function HotelDetailPageInner() {
    const { t } = useTranslations();
    const { id } = useParams();
    const router = useRouter();
    const sp = useSearchParams();
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
    const [selectedRoomBlockId, setSelectedRoomBlockId] = useState<string | undefined>(undefined);
    const [selectedRoomQty, setSelectedRoomQty] = useState(1);
    const [selectedRoomTypeId, setSelectedRoomTypeId] = useState<string | undefined>(undefined);
    const [selectedRatePlanId, setSelectedRatePlanId] = useState<string | undefined>(undefined);
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
    const listSeedQuery =
        sp.get('searchQuery')?.trim() ||
        deriveDestinationQueryFromHotelLocation(sp.get('location')) ||
        DEFAULT_HOTEL_DESTINATION_QUERY;
    const listSeedDestId = sp.get('searchDestId') || undefined;
    const listSeedDestType = sp.get('searchDestType') || undefined;

    const { data, isLoading } = useHotels({
        query: listSeedQuery,
        destId: listSeedDestId,
        destType: listSeedDestType,
    });

    useEffect(() => {
        // Seed basic details from URL query string if present
        if (typeof window !== 'undefined') {
            const usp = new URLSearchParams(window.location.search);
            const name = usp.get('name');
            const image = usp.get('image');
            const location = usp.get('location');
            const inventorySource = usp.get('inventory_source') || 'rapidapi';
            const bookableParam = usp.get('bookable');
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
                ...(image ? { image } : {}),
                ...(location ? { location } : {}),
                inventory_source: inventorySource,
                bookable:
                    bookableParam === '1'
                        ? true
                        : bookableParam === '0'
                          ? false
                          : inventorySource === 'bookaddis_direct' ||
                            inventorySource === 'pms_synced',
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
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(hotelId);
        const inventorySource =
            (typeof window !== 'undefined'
                ? new URLSearchParams(window.location.search).get('inventory_source')
                : null) || hotel.inventory_source || 'rapidapi';
        const isDirect =
            inventorySource === 'bookaddis_direct' ||
            inventorySource === 'pms_synced' ||
            isUuid;

        // BookAddis Direct / PMS  load from Nest, skip RapidAPI scrapes
        if (isDirect && isUuid) {
            try {
                const res = await axios.get(`/api/hotels/direct/${encodeURIComponent(hotelId)}`);
                const h = res.data || {};
                const mediaPhotos = Array.isArray(h.media?.photos)
                    ? h.media.photos
                          .map((p: any) => resolveStrapiFileUrl(p?.url) || p?.url)
                          .filter((u: string) => typeof u === 'string' && u.length > 0)
                    : [];
                const cover =
                    resolveStrapiFileUrl(h.image) || h.image || null;
                const images =
                    mediaPhotos.length > 0
                        ? mediaPhotos
                        : cover
                          ? [cover]
                          : [placeholder];
                const amenityLabels = Array.isArray(h.amenities)
                    ? h.amenities
                    : [];
                const facilityGroups = Array.isArray(h.facility_groups)
                    ? h.facility_groups
                    : [];
                const reviewsData = Array.isArray(h.reviews_list)
                    ? h.reviews_list
                    : [];
                const policies = h.policies && typeof h.policies === 'object' ? h.policies : {};
                setHotel((prev: any) => ({
                    ...prev,
                    id: h.id || hotelId,
                    name: h.name || prev.name,
                    location: h.location || prev.location,
                    rating: h.rating ?? h.star_rating ?? prev.rating,
                    reviews: h.reviews ?? reviewsData.length,
                    reviewWord: h.reviewWord || prev.reviewWord,
                    price: h.price ?? prev.price,
                    image: images[0],
                    images,
                    amenities: amenityLabels.length
                        ? amenityLabels
                        : prev.amenities || [],
                    description: h.description || prev.description,
                    inventory_source: h.inventory_source || inventorySource,
                    bookable: true,
                    checkin: h.checkin ?? prev.checkin,
                    checkout: h.checkout ?? prev.checkout,
                    policies,
                    cancellation_policy:
                        policies.cancellation_policy || prev.cancellation_policy,
                    house_rules: Array.isArray(policies.house_rules)
                        ? policies.house_rules
                        : [],
                    pets_policy: policies.pets_policy || null,
                    children_policy: policies.children_policy || null,
                }));
                setFacilities(facilityGroups);
                setReviewsList(reviewsData);
                setApiError(null);
            } catch {
                setApiError({ message: t('hotelDetail.errors.partialLoad') });
            } finally {
                setIsGalleryLoading(false);
            }
            return;
        }

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
                        ? t('hotelDetail.errors.rateLimit')
                        : t('hotelDetail.errors.partialLoad'),
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
            setApiError({ message: t('hotelDetail.errors.generic') });
            setHotel((prev: any) => ({
                ...prev,
                images: [placeholder],
            }));
        } finally {
            setIsGalleryLoading(false);
        }
    }, [id, t]);

    const detailMapHref = useMemo(
        () =>
            buildHotelDetailMapUrl(
                {
                    searchQuery: sp.get('searchQuery'),
                    searchDestId: sp.get('searchDestId'),
                    searchDestType: sp.get('searchDestType'),
                    checkIn: checkInDate,
                    checkOut: checkOutDate,
                    adults,
                    children,
                    rooms,
                },
                hotel,
            ),
        [
            sp.toString(),
            checkInDate,
            checkOutDate,
            adults,
            children,
            rooms,
            hotel.id,
            hotel.name,
            hotel.location,
            hotel.coordinates?.lat,
            hotel.coordinates?.lng,
        ],
    );

    useEffect(() => {
        fetchDetails();
    }, [fetchDetails]);

    /** Keep sidebar + Available rooms filters aligned via the URL. */
    const syncStayQuery = useCallback(
        (patch: {
            checkIn?: string;
            checkOut?: string;
            adults?: number;
            children?: number;
            rooms?: number;
        }) => {
            if (typeof window === 'undefined') return;
            const q = new URLSearchParams(window.location.search);
            if (patch.checkIn) q.set('checkIn', patch.checkIn);
            if (patch.checkOut) q.set('checkOut', patch.checkOut);
            if (patch.adults != null) q.set('adults', String(patch.adults));
            if (patch.children != null) q.set('children', String(patch.children));
            if (patch.rooms != null) q.set('rooms', String(patch.rooms));
            const hotelId = String(
                hotel.id || (Array.isArray(id) ? id[0] : id) || '',
            );
            router.replace(`/hotels/${hotelId}?${q.toString()}`, {
                scroll: false,
            });
        },
        [hotel.id, id, router],
    );

    const scrollToSection = useCallback((tabOrId: string) => {
        const map: Record<string, string> = {
            overview: 'overview',
            pricing: 'rooms',
            facilities: 'facilities',
            rules: 'policies',
            reviews: 'reviews',
            gallery: 'gallery',
            rooms: 'rooms',
            'availability-section': 'rooms',
            policies: 'policies',
        };
        const targetId = map[tabOrId] || tabOrId;
        const tabBySection: Record<string, string> = {
            overview: 'overview',
            gallery: 'overview',
            rooms: 'pricing',
            facilities: 'facilities',
            policies: 'rules',
            reviews: 'reviews',
        };
        setActiveTab(tabBySection[targetId] || tabOrId);
        window.requestAnimationFrame(() => {
            document.getElementById(targetId)?.scrollIntoView({
                behavior: 'smooth',
                block: 'start',
            });
        });
    }, []);

    // Deep-link from reserve "Back to rooms" → #rooms (retry until section mounts)
    useEffect(() => {
        if (typeof window === 'undefined') return;
        const hash = window.location.hash.replace('#', '');
        if (!hash) return;
        if (isLoading && !hotel.name) return;

        let attempts = 0;
        const tryScroll = () => {
            const map: Record<string, string> = {
                rooms: 'rooms',
                'availability-section': 'rooms',
                pricing: 'rooms',
                gallery: 'gallery',
                policies: 'policies',
                reviews: 'reviews',
                overview: 'overview',
                facilities: 'facilities',
            };
            const targetId = map[hash] || hash;
            const el = document.getElementById(targetId);
            if (el) {
                setActiveTab(
                    targetId === 'rooms'
                        ? 'pricing'
                        : targetId === 'policies'
                          ? 'rules'
                          : targetId === 'facilities'
                            ? 'facilities'
                            : targetId === 'reviews'
                              ? 'reviews'
                              : 'overview',
                );
                el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                return;
            }
            attempts += 1;
            if (attempts < 20) {
                window.setTimeout(tryScroll, 150);
            }
        };
        const t = window.setTimeout(tryScroll, 80);
        return () => window.clearTimeout(t);
    }, [id, isLoading, hotel.name, isGalleryLoading]);

    const listBackHref = useMemo(() => {
        const q = new URLSearchParams();
        const searchQuery = sp.get('searchQuery') || listSeedQuery;
        if (searchQuery) q.set('query', searchQuery);
        if (sp.get('searchDestId')) q.set('destId', sp.get('searchDestId')!);
        if (sp.get('searchDestType')) q.set('destType', sp.get('searchDestType')!);
        if (checkInDate) q.set('checkIn', checkInDate);
        if (checkOutDate) q.set('checkOut', checkOutDate);
        q.set('adults', String(adults));
        q.set('children', String(children));
        q.set('rooms', String(rooms));
        const qs = q.toString();
        return qs ? `/hotels?${qs}` : '/hotels';
    }, [
        sp,
        listSeedQuery,
        checkInDate,
        checkOutDate,
        adults,
        children,
        rooms,
    ]);

    if (isLoading && !hotel.name) {
        return (
            <div className="min-h-screen bg-brand-gray dark:bg-background flex items-center justify-center">
                <Preloader size="lg" />
            </div>
        );
    }

    const handleReserveRoom = (selection: {
        price?: number;
        serviceName?: string;
        roomBlockId?: string;
        roomQuantity?: number;
        roomTypeId?: string;
        ratePlanId?: string;
    }) => {
        const price = selection.price || hotel.price || 0;
        const roomName = selection.serviceName || hotel.name || 'Room';
        const qty =
            typeof selection.roomQuantity === 'number' && selection.roomQuantity > 0
                ? selection.roomQuantity
                : 1;
        const hotelId = String(
            hotel.id || (Array.isArray(id) ? id[0] : id) || '',
        );
        const draft = {
            hotelId,
            hotelName: hotel.name || 'Hotel',
            roomName,
            roomQuantity: qty,
            price,
            checkIn: checkInDate,
            checkOut: checkOutDate,
            adults,
            children,
            inventorySource:
                hotel.inventory_source ||
                sp.get('inventory_source') ||
                'rapidapi',
            roomBlockId: selection.roomBlockId
                ? String(selection.roomBlockId)
                : undefined,
            roomTypeId: selection.roomTypeId,
            ratePlanId: selection.ratePlanId,
        };
        try {
            sessionStorage.setItem(
                'bookaddis_reserve_draft',
                JSON.stringify(draft),
            );
        } catch {
            /* ignore */
        }
        const q = new URLSearchParams();
        q.set('name', draft.hotelName);
        q.set('room', roomName);
        q.set('price', String(price));
        q.set('checkIn', checkInDate);
        q.set('checkOut', checkOutDate);
        q.set('rooms', String(qty));
        q.set('adults', String(adults));
        q.set('children', String(children));
        if (draft.inventorySource) {
            q.set('inventory_source', String(draft.inventorySource));
        }
        if (draft.roomBlockId) q.set('roomBlockId', draft.roomBlockId);
        if (draft.roomTypeId) q.set('roomTypeId', draft.roomTypeId);
        if (draft.ratePlanId) q.set('ratePlanId', draft.ratePlanId);
        if (sp.get('searchQuery')) q.set('searchQuery', sp.get('searchQuery')!);
        if (sp.get('searchDestId')) q.set('searchDestId', sp.get('searchDestId')!);
        if (sp.get('searchDestType'))
            q.set('searchDestType', sp.get('searchDestType')!);
        if (sp.get('location')) q.set('location', sp.get('location')!);
        if (sp.get('image') || hotel.image)
            q.set('image', sp.get('image') || hotel.image);
        router.push(`/hotels/${hotelId}/reserve?${q.toString()}`);
    };

    return (
        <div className="min-h-screen bg-brand-gray/30 dark:bg-background pb-24 lg:pb-20 pt-16 md:pt-20">
            <HotelDetailHeader
                hotel={hotel}
                activeTab={activeTab}
                onTabChange={scrollToSection}
                detailMapHref={detailMapHref}
                backHref={listBackHref}
                onBook={() => scrollToSection('pricing')}
            />

            <div className="container mx-auto px-4 py-8">
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Continuous detail page (reference: gallery → about → rooms → policies → reviews) */}
                    <div className="w-full lg:w-3/4 space-y-10 lg:space-y-12">
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
                                    {t('common.tryAgain')}
                                </Button>
                            </div>
                        )}

                        <HotelDetailGallery
                            images={hotel.images || [hotel.image]}
                            loading={isGalleryLoading}
                            placeholderImage={HOTEL_PLACEHOLDER}
                            hotelName={hotel.name || 'Hotel'}
                        />

                        <section id="overview" className="scroll-mt-28">
                            <HotelDetailAbout
                                hotel={hotel}
                                facilities={facilities}
                                loading={isGalleryLoading}
                            />
                        </section>

                        <section id="availability-section" className="scroll-mt-28">
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
                                    syncStayQuery({ checkIn: ci, checkOut: co });
                                }}
                                onGuestsChange={(ad: number, ch: number, rm: number) => {
                                    setAdults(ad);
                                    setChildren(ch);
                                    setRoomsCount(rm);
                                    syncStayQuery({
                                        adults: ad,
                                        children: ch,
                                        rooms: rm,
                                    });
                                }}
                                onBook={handleReserveRoom}
                            />
                        </section>

                        <section
                            id="policies"
                            className="scroll-mt-28"
                        >
                            <h2 className="text-2xl font-bold text-foreground mb-2">
                                {t('hotelDetail.childPolicyTitle')}
                            </h2>
                            <p className="text-sm text-muted-foreground mb-6">
                                {t('hotelDetail.childPolicyIntro')}
                            </p>
                            <div className="space-y-3">
                                <div className="rounded-xl border border-border bg-card p-4">
                                    <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                                        {t('hotelDetail.childPolicyHeading')}
                                    </p>
                                    <p className="mt-1 text-sm text-foreground whitespace-pre-line">
                                        {hotel.children_policy ||
                                            t('hotelDetail.childPolicyFallback')}
                                    </p>
                                </div>
                                {hotel.pets_policy ? (
                                    <div className="rounded-xl border border-border bg-card p-4">
                                        <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                                            {t('hotelDetail.petsPolicyHeading')}
                                        </p>
                                        <p className="mt-1 text-sm">{hotel.pets_policy}</p>
                                    </div>
                                ) : null}
                                <div className="rounded-xl border border-border bg-card p-4">
                                    <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                                        {t('hotelDetail.cancellation')}
                                    </p>
                                    <p className="mt-1 text-sm text-foreground">
                                        {hotel.cancellation_policy ||
                                            t('hotelDetail.cancellationBody')}
                                    </p>
                                </div>
                            </div>
                        </section>

                        <section
                            id="reviews"
                            className="scroll-mt-28"
                        >
                            <h2 className="text-2xl font-bold text-foreground mb-6">
                                {t('hotelDetail.guestReviewsTitle')}
                            </h2>
                            <HotelDetailReviews
                                reviews={reviewsList}
                                loading={isGalleryLoading}
                                hotelId={String(
                                    hotel.id ||
                                        (Array.isArray(id) ? id[0] : id) ||
                                        '',
                                )}
                                allowGuestSubmit={
                                    hotel.inventory_source ===
                                        'bookaddis_direct' ||
                                    hotel.inventory_source === 'pms_synced' ||
                                    hotel.bookable === true
                                }
                            />
                        </section>
                    </div>

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
                                    syncStayQuery({ checkIn: ci, checkOut: co });
                                }}
                                onGuestsChange={(ad, ch, rm) => {
                                    setAdults(ad);
                                    setChildren(ch);
                                    setRoomsCount(rm);
                                    syncStayQuery({
                                        adults: ad,
                                        children: ch,
                                        rooms: rm,
                                    });
                                }}
                                onCheckAvailability={() => scrollToSection('pricing')}
                            />
                            <HotelDetailSidebar
                                hotel={hotel}
                                reviews={reviewsList}
                                detailMapHref={detailMapHref}
                                onBook={() => scrollToSection('pricing')}
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
                    setSelectedRoomBlockId(undefined);
                    setSelectedRoomQty(1);
                    setSelectedRoomTypeId(undefined);
                    setSelectedRatePlanId(undefined);
                }}
                serviceName={selectedServiceName || hotel.name}
                price={selectedPrice || hotel.price}
                externalItemId={String(hotel.id || (Array.isArray(id) ? id[0] : id) || '')}
                type="hotel"
                initialCheckIn={checkInDate}
                initialCheckOut={checkOutDate}
                isLocal={true}
                roomBlockId={selectedRoomBlockId}
                roomBookQuantity={selectedRoomQty}
                hotelAdults={adults}
                inventorySource={hotel.inventory_source || 'rapidapi'}
                roomTypeId={selectedRoomTypeId}
                ratePlanId={selectedRatePlanId}
            />

            {/* Mobile bottom bar  CTA only; room prices live in Available rooms */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-t border-gray-200 dark:border-slate-700 px-4 py-4 z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] dark:shadow-[0_-4px_20px_rgba(0,0,0,0.35)]" style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}>
                <div className="container mx-auto flex items-center justify-between gap-4 max-w-lg">
                    <div className="min-w-0">
                        <p className="text-xs text-gray-500 dark:text-slate-400">
                            {t('hotelDetail.booking.checkAvailability')}
                        </p>
                        <p className="text-sm font-semibold text-brand-dark dark:text-foreground truncate">
                            See Available rooms for live totals
                        </p>
                    </div>
                    <Button
                        onClick={() => scrollToSection('pricing')}
                        className="bg-brand-primary hover:bg-brand-primary/90 active:scale-[0.98] text-white font-bold px-8 py-3 rounded-2xl shrink-0 shadow-lg shadow-brand-primary/25 min-h-[48px]"
                    >
                        {t('hotelDetail.bookNow')}
                    </Button>
                </div>
            </div>
        </div>
    );
}

export default function HotelDetailPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen bg-brand-gray dark:bg-background flex items-center justify-center">
                    <Preloader size="lg" />
                </div>
            }
        >
            <HotelDetailPageInner />
        </Suspense>
    );
}
