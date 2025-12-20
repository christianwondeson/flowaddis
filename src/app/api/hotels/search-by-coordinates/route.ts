import { NextResponse } from 'next/server';
import { API_CONFIG, API_ENDPOINTS, getApiHeaders } from '@/lib/api-config';
import axios from 'axios';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const latitude = searchParams.get('latitude');
    const longitude = searchParams.get('longitude');
    const checkIn = searchParams.get('checkIn') || new Date(Date.now() + 86400000).toISOString().split('T')[0];
    const checkOut = searchParams.get('checkOut') || new Date(Date.now() + 172800000).toISOString().split('T')[0];
    const page = searchParams.get('page') || '0';
    const sortOrder = searchParams.get('sortOrder') || 'popularity';
    const categoriesFilterIds = searchParams.get('categories_filter_ids');

    if (!latitude || !longitude) {
        return NextResponse.json({ error: 'Latitude and Longitude are required' }, { status: 400 });
    }

    try {
        const options = {
            method: 'GET',
            url: `https://${API_CONFIG.RAPIDAPI_HOST}${API_ENDPOINTS.HOTELS.SEARCH_BY_COORDINATES}`,
            params: {
                latitude,
                longitude,
                checkin_date: checkIn,
                checkout_date: checkOut,
                page_number: page,
                order_by: sortOrder,
                adults_number: '2',
                children_number: '0',
                room_number: '1',
                units: 'metric',
                locale: 'en-gb',
                filter_by_currency: 'USD',
                include_adjacency: 'true',
                categories_filter_ids: categoriesFilterIds,
            },
            headers: getApiHeaders(),
        };

        const response = await axios.request(options);
        return NextResponse.json(response.data);
    } catch (error: any) {
        console.error('Error fetching hotels by coordinates:', error.message);
        return NextResponse.json({ error: 'Failed to fetch hotels' }, { status: 500 });
    }
}
