import { NextResponse } from 'next/server';
import { API_CONFIG, API_ENDPOINTS, getApiHeaders } from '@/lib/api-config';
import axios from 'axios';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const hotelId = searchParams.get('hotelId');
    const checkinDate = searchParams.get('checkin_date') || new Date(Date.now() + 86400000).toISOString().split('T')[0];
    const checkoutDate = searchParams.get('checkout_date') || new Date(Date.now() + 172800000).toISOString().split('T')[0];
    const adults = searchParams.get('adults_number_by_rooms') || '2';
    const children = searchParams.get('children_number_by_rooms') || '0';
    const childrenAges = searchParams.get('children_ages') || '';
    const currency = searchParams.get('currency') || 'USD';

    if (!hotelId) {
        return NextResponse.json({ error: 'hotelId is required' }, { status: 400 });
    }

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
