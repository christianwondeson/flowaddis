import { NextResponse } from 'next/server';
import { API_CONFIG, API_ENDPOINTS, getApiHeaders } from '@/lib/api-config';
import axios from 'axios';

// Addis Ababa Destination ID
const ADDIS_ABABA_DEST_ID = '-553173';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const checkIn = searchParams.get('checkIn') || new Date(Date.now() + 86400000).toISOString().split('T')[0];
    const checkOut = searchParams.get('checkOut') || new Date(Date.now() + 172800000).toISOString().split('T')[0];

    const categoriesFilterIds = searchParams.get('categories_filter_ids');

    // Determine dest_id
    let destId = ADDIS_ABABA_DEST_ID;

    try {
        const options = {
            method: 'GET',
            url: `https://${API_CONFIG.RAPIDAPI_HOST}${API_ENDPOINTS.HOTELS.FILTERS}`,
            params: {
                dest_id: destId,
                dest_type: 'city',
                checkin_date: checkIn,
                checkout_date: checkOut,
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
        console.error('Error fetching hotel filters:', error.message);
        return NextResponse.json({ error: 'Failed to fetch filters' }, { status: 500 });
    }
}
