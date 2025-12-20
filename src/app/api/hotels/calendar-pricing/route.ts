import { NextResponse } from 'next/server';
import { API_CONFIG, API_ENDPOINTS, getApiHeaders } from '@/lib/api-config';
import axios from 'axios';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const hotelId = searchParams.get('hotelId');
    const checkIn = searchParams.get('checkIn') || new Date(Date.now() + 86400000).toISOString().split('T')[0];
    const checkOut = searchParams.get('checkOut') || new Date(Date.now() + 172800000).toISOString().split('T')[0];

    if (!hotelId) {
        return NextResponse.json({ error: 'Hotel ID is required' }, { status: 400 });
    }

    try {
        const options = {
            method: 'GET',
            url: `https://${API_CONFIG.RAPIDAPI_HOST}${API_ENDPOINTS.HOTELS.CALENDAR_PRICING}`,
            params: {
                hotel_id: hotelId,
                checkin_date: checkIn,
                checkout_date: checkOut,
                adults_number: '2',
                children_number: '0',
                locale: 'en-gb',
                currency_code: 'USD',
            },
            headers: getApiHeaders(),
        };

        const response = await axios.request(options);
        return NextResponse.json(response.data);
    } catch (error: any) {
        console.error('Error fetching calendar pricing:', error.message);
        return NextResponse.json({ error: 'Failed to fetch calendar pricing' }, { status: 500 });
    }
}
