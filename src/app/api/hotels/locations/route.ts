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
            url: `https://${API_CONFIG.RAPIDAPI_HOST}${API_ENDPOINTS.HOTELS.LOCATIONS}`,
            params: {
                name: name,
                locale: 'en-gb'
            },
            headers: getApiHeaders(),
        };

        
        const response = await axios.request(options);
        return NextResponse.json(response.data);
    } catch (error: any) {
        console.error('Error fetching locations:', error.message);
        if (error.response) {
            console.error('API Response Error:', error.response.status, error.response.data);
        }
        return NextResponse.json({ error: 'Failed to fetch locations', details: error.message }, { status: 500 });
    }
}
