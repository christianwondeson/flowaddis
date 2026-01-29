import { NextResponse } from 'next/server';
import { API_CONFIG, API_ENDPOINTS, getApiHeaders } from '@/lib/api-config';
import axios from 'axios';

// Simple in-memory cache to reduce rate limits
const cache = new Map<string, { data: any; ts: number }>();
const CACHE_TTL_MS = 1000 * 60 * 5; // 5 minutes

// Enhanced curated fallback with reliable dest_ids for common cities
// Note: Booking.com's dest_ids can change; maintain these carefully if you expand.
const FALLBACK_PRESETS = [
    // Ethiopian cities
    { name: 'Addis Ababa', dest_id: '-553173', dest_type: 'city', search_type: 'city', cc1: 'et', city_name: 'Addis Ababa', country: 'Ethiopia', label: 'Addis Ababa, Ethiopia' },
    { name: 'Bishoftu', dest_id: '-603097', dest_type: 'city', search_type: 'city', cc1: 'et', city_name: 'Bishoftu', country: 'Ethiopia', label: 'Bishoftu, Ethiopia' },
    { name: 'Hawassa', dest_id: '-603014', dest_type: 'city', search_type: 'city', cc1: 'et', city_name: 'Hawassa', country: 'Ethiopia', label: 'Hawassa, Ethiopia' },
    { name: 'Bahir Dar', dest_id: '-603098', dest_type: 'city', search_type: 'city', cc1: 'et', city_name: 'Bahir Dar', country: 'Ethiopia', label: 'Bahir Dar, Ethiopia' },
    { name: 'Gondar', dest_id: '-603099', dest_type: 'city', search_type: 'city', cc1: 'et', city_name: 'Gondar', country: 'Ethiopia', label: 'Gondar, Ethiopia' },
    { name: 'Dire Dawa', dest_id: '-603100', dest_type: 'city', search_type: 'city', cc1: 'et', city_name: 'Dire Dawa', country: 'Ethiopia', label: 'Dire Dawa, Ethiopia' },
    // International cities
    { name: 'Dubai', dest_id: '20088325', dest_type: 'city', search_type: 'city', cc1: 'ae', city_name: 'Dubai', country: 'United Arab Emirates', label: 'Dubai, United Arab Emirates' },
    { name: 'London', dest_id: '-2601889', dest_type: 'city', search_type: 'city', cc1: 'gb', city_name: 'London', country: 'United Kingdom', label: 'London, United Kingdom' },
    { name: 'Istanbul', dest_id: '-755070', dest_type: 'city', search_type: 'city', cc1: 'tr', city_name: 'Istanbul', country: 'Turkey', label: 'Istanbul, Turkey' },
    { name: 'New York', dest_id: '20088325', dest_type: 'city', search_type: 'city', cc1: 'us', city_name: 'New York', country: 'United States', label: 'New York, United States' },
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

        // Send query as-is to the API without modification
        // This allows partial searches like "Lon", "Bah", etc. to work correctly
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

        // Sort results to prioritize Ethiopian destinations
        const results = Array.isArray(response.data) ? response.data : [];
        const sortedResults = results.sort((a: any, b: any) => {
            // Ethiopian destinations (cc1 === 'et') come first
            const aIsEthiopian = a.cc1 === 'et';
            const bIsEthiopian = b.cc1 === 'et';
            if (aIsEthiopian && !bIsEthiopian) return -1;
            if (!aIsEthiopian && bIsEthiopian) return 1;
            // Within same priority, maintain original order
            return 0;
        });

        cache.set(key, { data: sortedResults, ts: now });
        return NextResponse.json(sortedResults);
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
