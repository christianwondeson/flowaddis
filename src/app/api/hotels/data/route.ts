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
            url: `https://${API_CONFIG.RAPIDAPI_HOST}${API_ENDPOINTS.HOTELS.DETAILS}`,
            params: {
                hotel_id: hotelId,
                locale: 'en-gb'
            },
            headers: getApiHeaders(),
        };

        const response = await axios.request(options);
        return NextResponse.json(response.data);
    } catch (error: any) {
        console.error('Error fetching hotel details:', error.message);
        return NextResponse.json({ error: 'Failed to fetch hotel details' }, { status: 500 });
    }
}
