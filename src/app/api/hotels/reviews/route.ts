import { NextResponse } from 'next/server';
import { API_CONFIG, API_ENDPOINTS, getApiHeaders } from '@/lib/api-config';
import { assertHotelDetailAccess } from '@/lib/hotel-public-api-guard';
import axios from 'axios';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const guarded = assertHotelDetailAccess(request, searchParams.get('hotelId'));
    if (!guarded.ok) return guarded.response;
    const hotelId = guarded.hotelId;

    try {
        const options = {
            method: 'GET',
            url: `https://${API_CONFIG.RAPIDAPI_HOST}${API_ENDPOINTS.HOTELS.REVIEWS}`,
            params: {
                hotel_id: hotelId,
                locale: searchParams.get('locale') || 'en-gb',
                customer_type: searchParams.get('customer_type') || 'solo_traveller,review_category_group_of_friends',
                language_filter: searchParams.get('language_filter') || 'en-gb,de,fr',
                sort_type: searchParams.get('sort_type') || 'SORT_MOST_RELEVANT',
                page_number: searchParams.get('page_number') || '0',
            },
            headers: getApiHeaders(),
        };

        const response = await axios.request(options);
        return NextResponse.json(response.data);
    } catch (error: any) {
        console.error('Error fetching hotel reviews:', error.message);
        return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 });
    }
}
