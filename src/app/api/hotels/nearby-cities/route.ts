import { NextResponse } from 'next/server';
import { API_CONFIG, API_ENDPOINTS, getApiHeaders } from '@/lib/api-config';
import axios from 'axios';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const lat = searchParams.get('latitude');
    const lng = searchParams.get('longitude');

    if (!lat || !lng) {
        return NextResponse.json({ error: 'Latitude and Longitude are required' }, { status: 400 });
    }

    try {
        const options = {
            method: 'GET',
            url: `https://${API_CONFIG.RAPIDAPI_HOST}${API_ENDPOINTS.HOTELS.NEARBY_CITIES}`,
            params: {
                latitude: lat,
                longitude: lng,
                locale: 'en-gb'
            },
            headers: getApiHeaders(),
        };

        const response = await axios.request(options);
        return NextResponse.json(response.data);
    } catch (error: any) {
        console.error('Error fetching nearby cities:', error.message);
        return NextResponse.json({ error: 'Failed to fetch nearby cities' }, { status: 500 });
    }
}
