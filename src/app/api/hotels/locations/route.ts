import { NextResponse } from 'next/server';
import { API_CONFIG, API_ENDPOINTS, getApiHeaders } from '@/lib/api-config';
import axios from 'axios';

// Simple in-memory cache to reduce rate limits
const cache = new Map<string, { data: any; ts: number }>();
const CACHE_TTL_MS = 1000 * 60 * 5; // 5 minutes

// Enhanced curated fallback with reliable dest_ids for hotel search
// Attractions/regions map to nearest city with hotels when API returns empty
const FALLBACK_PRESETS = [
    // Ethiopian cities (verified dest_ids)
    { name: 'Addis Ababa', dest_id: '-603097', dest_type: 'city', search_type: 'city', cc1: 'et', city_name: 'Addis Ababa', country: 'Ethiopia', label: 'Addis Ababa, Ethiopia' },
    { name: 'Bishoftu', dest_id: '-603094', dest_type: 'city', search_type: 'city', cc1: 'et', city_name: 'Bishoftu', country: 'Ethiopia', label: 'Bishoftu, Ethiopia' },
    { name: 'Hawassa', dest_id: '-603014', dest_type: 'city', search_type: 'city', cc1: 'et', city_name: 'Hawassa', country: 'Ethiopia', label: 'Hawassa, Ethiopia' },
    { name: 'Bahir Dar', dest_id: '-603098', dest_type: 'city', search_type: 'city', cc1: 'et', city_name: 'Bahir Dar', country: 'Ethiopia', label: 'Bahir Dar, Ethiopia' },
    { name: 'Gondar', dest_id: '-603099', dest_type: 'city', search_type: 'city', cc1: 'et', city_name: 'Gondar', country: 'Ethiopia', label: 'Gondar, Ethiopia' },
    { name: 'Gonder', dest_id: '-603099', dest_type: 'city', search_type: 'city', cc1: 'et', city_name: 'Gondar', country: 'Ethiopia', label: 'Gondar, Ethiopia' },
    { name: 'Dire Dawa', dest_id: '-603100', dest_type: 'city', search_type: 'city', cc1: 'et', city_name: 'Dire Dawa', country: 'Ethiopia', label: 'Dire Dawa, Ethiopia' },
    { name: 'Adama', dest_id: '-603094', dest_type: 'city', search_type: 'city', cc1: 'et', city_name: 'Bishoftu', country: 'Ethiopia', label: 'Adama/Bishoftu, Ethiopia' },
    { name: 'Debre Zeit', dest_id: '-603094', dest_type: 'city', search_type: 'city', cc1: 'et', city_name: 'Bishoftu', country: 'Ethiopia', label: 'Debre Zeit, Ethiopia' },
    // Attractions → nearest city with hotels (when API returns empty)
    { name: 'Lalibela', dest_id: '-603099', dest_type: 'city', search_type: 'city', cc1: 'et', city_name: 'Gondar', country: 'Ethiopia', label: 'Lalibela, Ethiopia' },
    { name: 'Axum', dest_id: '-603099', dest_type: 'city', search_type: 'city', cc1: 'et', city_name: 'Gondar', country: 'Ethiopia', label: 'Axum, Ethiopia' },
    { name: 'Harar', dest_id: '-603100', dest_type: 'city', search_type: 'city', cc1: 'et', city_name: 'Dire Dawa', country: 'Ethiopia', label: 'Harar, Ethiopia' },
    { name: 'Arba Minch', dest_id: '-603014', dest_type: 'city', search_type: 'city', cc1: 'et', city_name: 'Hawassa', country: 'Ethiopia', label: 'Arba Minch, Ethiopia' },
    { name: 'Mekele', dest_id: '-603099', dest_type: 'city', search_type: 'city', cc1: 'et', city_name: 'Gondar', country: 'Ethiopia', label: 'Mekele, Ethiopia' },
    { name: 'Mekelle', dest_id: '-603099', dest_type: 'city', search_type: 'city', cc1: 'et', city_name: 'Gondar', country: 'Ethiopia', label: 'Mekelle, Ethiopia' },
    { name: 'Sof Omar', dest_id: '-603014', dest_type: 'city', search_type: 'city', cc1: 'et', city_name: 'Hawassa', country: 'Ethiopia', label: 'Sof Omar Caves, Ethiopia' },
    { name: 'Sof Omar Caves', dest_id: '-603014', dest_type: 'city', search_type: 'city', cc1: 'et', city_name: 'Hawassa', country: 'Ethiopia', label: 'Sof Omar Caves, Ethiopia' },
    { name: 'Wenchi', dest_id: '-603094', dest_type: 'city', search_type: 'city', cc1: 'et', city_name: 'Bishoftu', country: 'Ethiopia', label: 'Wenchi Crater, Ethiopia' },
    { name: 'Bale', dest_id: '-603014', dest_type: 'city', search_type: 'city', cc1: 'et', city_name: 'Hawassa', country: 'Ethiopia', label: 'Bale Mountains, Ethiopia' },
    { name: 'Langano', dest_id: '-603014', dest_type: 'city', search_type: 'city', cc1: 'et', city_name: 'Hawassa', country: 'Ethiopia', label: 'Langano, Ethiopia' },
    { name: 'Omo Valley', dest_id: '-603014', dest_type: 'city', search_type: 'city', cc1: 'et', city_name: 'Hawassa', country: 'Ethiopia', label: 'Omo Valley, Ethiopia' },
    { name: 'Danakil', dest_id: '-603099', dest_type: 'city', search_type: 'city', cc1: 'et', city_name: 'Gondar', country: 'Ethiopia', label: 'Danakil Depression, Ethiopia' },
    // International
    { name: 'Dubai', dest_id: '20088325', dest_type: 'city', search_type: 'city', cc1: 'ae', city_name: 'Dubai', country: 'United Arab Emirates', label: 'Dubai, United Arab Emirates' },
    { name: 'London', dest_id: '-2601889', dest_type: 'city', search_type: 'city', cc1: 'gb', city_name: 'London', country: 'United Kingdom', label: 'London, United Kingdom' },
    { name: 'Istanbul', dest_id: '-755070', dest_type: 'city', search_type: 'city', cc1: 'tr', city_name: 'Istanbul', country: 'Turkey', label: 'Istanbul, Turkey' },
    { name: 'New York', dest_id: '20088325', dest_type: 'city', search_type: 'city', cc1: 'us', city_name: 'New York', country: 'United States', label: 'New York, United States' },
];

// Attraction/partial query → preset name (for when API returns empty)
const ATTRACTION_MATCH: Record<string, string> = {
    'lalibela': 'Lalibela', 'axum': 'Axum', 'harar': 'Harar', 'arba minch': 'Arba Minch',
    'mekele': 'Mekele', 'mekelle': 'Mekelle', 'sof omar': 'Sof Omar Caves', 'wenchi': 'Wenchi',
    'bale': 'Bale', 'langano': 'Langano', 'omo': 'Omo Valley', 'omo valley': 'Omo Valley',
    'danakil': 'Danakil', 'addis': 'Addis Ababa', 'bahir': 'Bahir Dar', 'gondar': 'Gondar',
    'gonder': 'Gonder', 'hawassa': 'Hawassa', 'bishoftu': 'Bishoftu', 'dire dawa': 'Dire Dawa',
};

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

        let results = Array.isArray(response.data) ? response.data : [];

        // When API returns empty, use attraction/city fallback so hotel search still works
        if (results.length === 0) {
            const q = key.replace(/,?\s*ethiopia$/i, '').trim();
            const matchedPreset = Object.entries(ATTRACTION_MATCH).find(([k]) => q.includes(k) || k.includes(q));
            if (matchedPreset) {
                const preset = FALLBACK_PRESETS.find((p) => p.name === matchedPreset[1]);
                if (preset) results = [preset];
            } else {
                const partialMatch = FALLBACK_PRESETS.filter((p) =>
                    p.name.toLowerCase().includes(q) || q.includes(p.name.toLowerCase())
                );
                if (partialMatch.length > 0) results = partialMatch;
            }
        }

        // Sort: Ethiopian destinations first, then by highest hotel count.
        // This ensures when you click a location you get the one with the most hotels.
        const sortedResults = [...results].sort((a: any, b: any) => {
            const aIsEthiopian = a.cc1 === 'et';
            const bIsEthiopian = b.cc1 === 'et';
            if (aIsEthiopian && !bIsEthiopian) return -1;
            if (!aIsEthiopian && bIsEthiopian) return 1;

            const aCount = Number(a.nr_hotels ?? a.hotels ?? a.hotel_count ?? 0) || 0;
            const bCount = Number(b.nr_hotels ?? b.hotels ?? b.hotel_count ?? 0) || 0;
            if (bCount !== aCount) return bCount - aCount;

            // Prefer CITY over LANDMARK/AIRPORT/HOTEL when counts tie
            const rank = (x: any) => {
                const t = (x.dest_type || x.search_type || x.type || '').toString().toLowerCase();
                if (t.includes('city') || t === 'ci') return 0;
                if (t.includes('region')) return 1;
                if (t.includes('landmark') || t === 'la') return 2;
                if (t.includes('airport') || t === 'ai') return 3;
                if (t.includes('hotel') || t === 'ho') return 4;
                return 5;
            };
            return rank(a) - rank(b);
        });

        cache.set(key, { data: sortedResults, ts: now });
        return NextResponse.json(sortedResults);
    } catch (error: any) {
        console.error('Error fetching locations:', error.message);
        if (error.response) {
            console.error('API Response Error:', error.response.status, error.response.data);
        }
        // Fallback: use attraction match or filter presets
        const q = name.toLowerCase().replace(/,?\s*ethiopia$/i, '').trim();
        const matchedPreset = Object.entries(ATTRACTION_MATCH).find(([k]) => q.includes(k) || k.includes(q));
        if (matchedPreset) {
            const preset = FALLBACK_PRESETS.find((p) => p.name === matchedPreset[1]);
            if (preset) return NextResponse.json([preset]);
        }
        const fallback = FALLBACK_PRESETS.filter((i) =>
            i.name.toLowerCase().includes(q) || q.includes(i.name.toLowerCase())
        );
        if (fallback.length > 0) return NextResponse.json(fallback);
        return NextResponse.json({ error: 'Failed to fetch locations', details: error.message }, { status: 500 });
    }
}
