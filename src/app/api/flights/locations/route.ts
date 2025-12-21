import { NextResponse } from 'next/server';
import { API_CONFIG, API_ENDPOINTS, getApiHeaders } from '@/lib/api-config';
import axios from 'axios';

// Simple in-memory cache (server runtime)
const cache = new Map<string, { data: any; ts: number }>();
const CACHE_TTL_MS = 1000 * 60 * 5; // 5 minutes

// Curated fallback for Ethiopian diaspora routes
const FALLBACK_PRESETS = [
    { type: 'AIRPORT', name: 'Addis Ababa Bole International Airport', short_code: 'ADD', code: 'ADD.AIRPORT', cityName: 'Addis Ababa', countryName: 'Ethiopia' },
    { type: 'AIRPORT', name: 'Dubai International Airport', short_code: 'DXB', code: 'DXB.AIRPORT', cityName: 'Dubai', countryName: 'United Arab Emirates' },
    { type: 'AIRPORT', name: 'Heathrow Airport', short_code: 'LHR', code: 'LHR.AIRPORT', cityName: 'London', countryName: 'United Kingdom' },
    { type: 'AIRPORT', name: 'Frankfurt Airport', short_code: 'FRA', code: 'FRA.AIRPORT', cityName: 'Frankfurt', countryName: 'Germany' },
    { type: 'AIRPORT', name: 'Istanbul Airport', short_code: 'IST', code: 'IST.AIRPORT', cityName: 'Istanbul', countryName: 'Turkey' },
    { type: 'AIRPORT', name: 'John F. Kennedy International Airport', short_code: 'JFK', code: 'JFK.AIRPORT', cityName: 'New York', countryName: 'United States' },
    { type: 'AIRPORT', name: 'Toronto Pearson International Airport', short_code: 'YYZ', code: 'YYZ.AIRPORT', cityName: 'Toronto', countryName: 'Canada' },
    { type: 'AIRPORT', name: 'Doha Hamad International Airport', short_code: 'DOH', code: 'DOH.AIRPORT', cityName: 'Doha', countryName: 'Qatar' },
    { type: 'AIRPORT', name: 'Paris Charles de Gaulle Airport', short_code: 'CDG', code: 'CDG.AIRPORT', cityName: 'Paris', countryName: 'France' },
];

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get('name');

    if (!name) {
        return NextResponse.json({ error: 'Location name is required' }, { status: 400 });
    }

    const key = name.toLowerCase();
    const now = Date.now();
    const cached = cache.get(key);
    if (cached && now - cached.ts < CACHE_TTL_MS) {
        return NextResponse.json(cached.data);
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
        } as const;

        const response = await axios.request(options);
        // Keep original structure but also map to simplified items the UI can use.
        const items = Array.isArray(response.data) ? response.data : [];
        cache.set(key, { data: items, ts: now });
        return NextResponse.json(items);
    } catch (error: any) {
        const status = error?.response?.status;
        console.error('Error fetching flight locations:', status, error?.message);

        // On rate limit or upstream error, serve a filtered curated fallback matching the query.
        const q = name.toLowerCase();
        // Exact code match first
        const exact = FALLBACK_PRESETS.find(
            (i) => i.code?.toLowerCase() === q || i.short_code?.toLowerCase() === q
        );
        if (exact) {
            return NextResponse.json([exact]);
        }
        const fallback = FALLBACK_PRESETS.filter(
            (i) => i.name.toLowerCase().includes(q)
               || i.short_code.toLowerCase().includes(q)
               || i.cityName.toLowerCase().includes(q)
               || i.code?.toLowerCase().includes(q)
        );
        if (fallback.length > 0) {
            return NextResponse.json(fallback);
        }
        return NextResponse.json({ error: 'Failed to fetch locations', details: error?.message }, { status: 500 });
    }
}
