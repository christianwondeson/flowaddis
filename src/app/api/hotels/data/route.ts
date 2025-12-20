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
