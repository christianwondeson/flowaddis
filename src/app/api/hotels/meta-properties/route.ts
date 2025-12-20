import { NextResponse } from 'next/server';
import { API_CONFIG, API_ENDPOINTS, getApiHeaders } from '@/lib/api-config';
import axios from 'axios';

export async function GET() {
    try {
        const options = {
            method: 'GET',
            url: `https://${API_CONFIG.RAPIDAPI_HOST}${API_ENDPOINTS.HOTELS.META_PROPERTIES}`,
            headers: getApiHeaders(),
        };

        const response = await axios.request(options);
        return NextResponse.json(response.data);
    } catch (error: any) {
        console.error('Error fetching meta properties:', error.message);
        return NextResponse.json({ error: 'Failed to fetch meta properties' }, { status: 500 });
    }
}
