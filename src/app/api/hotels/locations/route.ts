import { NextResponse } from 'next/server';
import { API_CONFIG, API_ENDPOINTS, getApiHeaders } from '@/lib/api-config';
import axios from 'axios';

// Simple in-memory cache to reduce rate limits
const cache = new Map<string, { data: any; ts: number }>();
const CACHE_TTL_MS = 1000 * 60 * 5; // 5 minutes

// Minimal curated fallback with reliable dest_ids for common cities
// Note: Booking.com's dest_ids can change; maintain these carefully if you expand.
const FALLBACK_PRESETS = [
    { name: 'Addis Ababa', dest_id: '-553173', dest_type: 'city', search_type: 'city', cc1: 'et' },
    { name: 'Dubai', dest_id: '20088325', dest_type: 'city', search_type: 'city', cc1: 'ae' },
    { name: 'London', dest_id: '-2601889', dest_type: 'city', search_type: 'city', cc1: 'gb' },
    { name: 'Frankfurt/Main', dest_id: '-1771148', dest_type: 'city', search_type: 'city', cc1: 'de' },
    { name: 'Istanbul', dest_id: '-755070', dest_type: 'city', search_type: 'city', cc1: 'tr' },
    { name: 'New York', dest_id: '20088325', dest_type: 'city', search_type: 'city', cc1: 'us' }, // placeholder dest_id reused; prefer API results normally
];

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get('name');

    if (!name) {
        return NextResponse.json({ error: 'Location name is required' }, { status: 400 });
    }

    try {
        const key = name.toLowerCase();
        const now = Date.now();
        const cached = cache.get(key);
        if (cached && now - cached.ts < CACHE_TTL_MS) {
            return NextResponse.json(cached.data);
        }

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
        cache.set(key, { data: response.data, ts: now });
        return NextResponse.json(response.data);
    } catch (error: any) {
        console.error('Error fetching locations:', error.message);
        if (error.response) {
            console.error('API Response Error:', error.response.status, error.response.data);
        }
        // Fallback: filter curated presets
        const q = name.toLowerCase();
        const fallback = FALLBACK_PRESETS.filter((i) => i.name.toLowerCase().includes(q));
        if (fallback.length > 0) {
            return NextResponse.json(fallback);
        }
        return NextResponse.json({ error: 'Failed to fetch locations', details: error.message }, { status: 500 });
    }
}
