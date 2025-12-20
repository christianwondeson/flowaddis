import { NextResponse } from 'next/server';
import { API_CONFIG, API_ENDPOINTS, getApiHeaders } from '@/lib/api-config';
import axios from 'axios';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const hotelId = searchParams.get('hotelId');

    if (!hotelId) {
        return NextResponse.json({ error: 'Hotel ID is required' }, { status: 400 });
    }

    try {
        const options = {
            method: 'GET',
            url: `${API_CONFIG.BASE_URL}${API_ENDPOINTS.HOTELS.PHOTOS}`,
            params: {
                hotel_id: hotelId,
                locale: 'en-gb'
            },
            headers: getApiHeaders(),
        };

        const response = await axios.request(options);
        return NextResponse.json(response.data);
    } catch (error: any) {
        console.error('Error fetching hotel photos:', error.message);
        return NextResponse.json({ error: 'Failed to fetch photos' }, { status: 500 });
    }
}
