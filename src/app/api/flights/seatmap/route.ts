import { NextResponse } from 'next/server';
import { API_CONFIG, API_ENDPOINTS, getApiHeaders } from '@/lib/api-config';
import axios from 'axios';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const offerToken = searchParams.get('offerToken');
    const currencyCode = searchParams.get('currency_code') || 'USD';

    if (!offerToken) {
        return NextResponse.json({ error: 'offerToken is required' }, { status: 400 });
    }

    try {
        const url = `${API_CONFIG.FLIGHTS_BASE_URL}${API_ENDPOINTS.FLIGHTS.SEAT_MAP}`;
        const response = await axios.get(url, {
            params: { offerToken, currency_code: currencyCode },
            headers: getApiHeaders(API_CONFIG.FLIGHTS_HOST),
        });

        return NextResponse.json({ data: response.data?.data, status: true });
    } catch (error: any) {
        const status = error?.response?.status || 500;
        const data = error?.response?.data;
        console.error('Error fetching seat map:', status, error?.message, data);

        return NextResponse.json({
            data: null,
            status: false,
            error: status,
            message: 'Failed to fetch seat map from upstream',
        }, { status: 200 });
    }
}
