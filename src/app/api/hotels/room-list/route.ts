import { NextResponse } from 'next/server';
import { API_CONFIG, API_ENDPOINTS, getApiHeaders, rapidApiMissingResponse } from '@/lib/api-config';
import { assertHotelDetailAccess } from '@/lib/hotel-public-api-guard';
import { getSafeBackendBaseUrl } from '@/lib/safe-backend-url';
import axios from 'axios';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const checkinDate = searchParams.get('checkin_date') || new Date(Date.now() + 86400000).toISOString().split('T')[0];
    const checkoutDate = searchParams.get('checkout_date') || new Date(Date.now() + 172800000).toISOString().split('T')[0];
    const adults = searchParams.get('adults_number_by_rooms') || searchParams.get('adults_number') || '2';
    const children = searchParams.get('children_number_by_rooms') || searchParams.get('children_number') || '0';
    const childrenAges = searchParams.get('children_ages') || '';
    const currency = searchParams.get('currency') || 'USD';

    const guarded = assertHotelDetailAccess(request, searchParams.get('hotelId'));
    if (!guarded.ok) return guarded.response;
    const hotelId = guarded.hotelId;

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(hotelId);

    // BookAddis Direct Hotel: proxy to NestJS availability instead of failing on RapidAPI
    if (isUuid) {
        try {
            const backend = getSafeBackendBaseUrl();
            const qs = new URLSearchParams({
                checkIn: checkinDate,
                checkOut: checkoutDate,
            });
            const res = await fetch(
                `${backend}/api/v1/hotels/${encodeURIComponent(hotelId)}/availability?${qs}`,
                { next: { revalidate: 15 } },
            );
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                return NextResponse.json(
                    { error: data?.message || data?.error || 'Direct hotel availability failed' },
                    { status: res.status },
                );
            }

            const offers = Array.isArray(data?.offers) ? data.offers : [];
            const block = offers.map((offer: any) => ({
                room_id: offer.room_type_id,
                room_name: offer.room_type_name,
                block_id: offer.rate_plan_id,
                price: offer.pricing?.total_stay_rate ?? offer.pricing?.nightly_base_rate ?? 0,
                currency: offer.pricing?.currency ?? 'ETB',
                meal_plan: offer.meal_plan,
                bed_configuration: offer.bed_configuration,
                photos: offer.photos || [],
                allotment_available: offer.allotment_available ?? 1,
            }));
            const rooms: Record<string, any> = {};
            offers.forEach((offer: any) => {
                if (offer.room_type_id) {
                    rooms[offer.room_type_id] = {
                        name: offer.room_type_name,
                        photos: (offer.photos || []).map((url: string) => ({ url_original: url })),
                        bed_configurations: offer.bed_configuration ? [{ description: offer.bed_configuration }] : [],
                    };
                }
            });

            return NextResponse.json([{ block, rooms, offers, hotel_id: hotelId, inventory_source: 'bookaddis_direct' }]);
        } catch (err: any) {
            console.error('Error in room-list direct hotel fallback:', err.message);
            return NextResponse.json({ error: 'Failed to fetch direct hotel room list' }, { status: 502 });
        }
    }

    const missing = rapidApiMissingResponse();
    if (missing) return missing;

    try {
        const options = {
            method: 'GET',
            url: `https://${API_CONFIG.RAPIDAPI_HOST}${API_ENDPOINTS.HOTELS.ROOM_LIST}`,
            params: {
                hotel_id: hotelId,
                checkin_date: checkinDate,
                checkout_date: checkoutDate,
                locale: 'en-gb',
                units: 'metric',
                adults_number_by_rooms: adults,
                currency: currency,
                ...(children !== '0' && { children_number_by_rooms: children }),
                ...(childrenAges && { children_ages: childrenAges }),
            },
            headers: getApiHeaders(),
        };

        const response = await axios.request(options);
        return NextResponse.json(response.data);
    } catch (error: any) {
        console.error('Error fetching room list:', error.message);
        return NextResponse.json({ error: 'Failed to fetch room list' }, { status: 500 });
    }
}
