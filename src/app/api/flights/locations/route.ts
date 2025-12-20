import { NextResponse } from 'next/server';
import { API_CONFIG, API_ENDPOINTS, getApiHeaders } from '@/lib/api-config';
import axios from 'axios';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get('name');

    if (!name) {
        return NextResponse.json({ error: 'Location name is required' }, { status: 400 });
    }

    try {
        const options = {
            method: 'GET',
            url: `${API_CONFIG.BASE_URL}${API_ENDPOINTS.FLIGHTS.LOCATIONS}`,
            params: {
                name: name,
                locale: 'en-gb'
            },
            headers: getApiHeaders(),
        };

        const response = await axios.request(options);
        return NextResponse.json(response.data);
    } catch (error: any) {
        console.error('Error fetching flight locations:', error.message);
        return NextResponse.json({ error: 'Failed to fetch locations' }, { status: 500 });
    }
}
