import { NextResponse } from 'next/server';
import { API_CONFIG, API_ENDPOINTS, getApiHeaders } from '@/lib/api-config';
import axios from 'axios';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query') || 'Addis Ababa';
    const checkIn = searchParams.get('checkIn') || new Date(Date.now() + 86400000).toISOString().split('T')[0];
    const checkOut = searchParams.get('checkOut') || new Date(Date.now() + 172800000).toISOString().split('T')[0];
    const page = searchParams.get('page') || '0';
    const sortOrder = searchParams.get('sortOrder') || 'popularity';
    const currency = searchParams.get('currency') || 'USD';

    // Guest Filters
    const adults = searchParams.get('adults') || '2';
    const children = searchParams.get('children') || '0';
    const rooms = searchParams.get('rooms') || '1';

    // Filters
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const stars = searchParams.get('stars');
    const minRating = searchParams.get('minRating');
    const amenities = searchParams.get('amenities');
    const hotelName = searchParams.get('hotelName') || '';

    try {
        // 1. Resolve Location to get dest_id
        // Normalize airport-like codes to city names to improve matching
        const CODE_TO_CITY: Record<string, string> = {
            ADD: 'Addis Ababa',
            DXB: 'Dubai',
            LHR: 'London',
            FRA: 'Frankfurt/Main',
            IST: 'Istanbul',
            JFK: 'New York',
            YYZ: 'Toronto',
            DOH: 'Doha',
            CDG: 'Paris',
        };
        let searchQuery = query.trim();
        const airportCodeMatch = searchQuery.match(/^([A-Za-z]{3})(?:\.(AIRPORT|CITY))?$/);
        if (airportCodeMatch) {
            const code = airportCodeMatch[1].toUpperCase();
            if (CODE_TO_CITY[code]) {
                searchQuery = CODE_TO_CITY[code];
            }
        } else if (searchQuery.includes('.AIRPORT') || searchQuery.includes('.CITY')) {
            const code = searchQuery.split('.')[0].toUpperCase();
            if (CODE_TO_CITY[code]) {
                searchQuery = CODE_TO_CITY[code];
            }
        }

        // Append country context if it clearly targets Ethiopia
        if (searchQuery.toLowerCase().includes('addis') && !searchQuery.toLowerCase().includes('ethiopia')) {
            // Optional: keep simple to avoid over-constraining searches
            // searchQuery = `${searchQuery}, Ethiopia`;
        }

        const locationOptions = {
            method: 'GET',
            url: `https://${API_CONFIG.RAPIDAPI_HOST}${API_ENDPOINTS.HOTELS.LOCATIONS}`,
            params: {
                name: searchQuery,
                locale: 'en-gb',
            },
            headers: getApiHeaders(),
        };

        console.log(`Resolving location for: ${searchQuery}`);
        const locationResponse = await axios.request(locationOptions);
        const locations = locationResponse.data;

        let destId = '-553173'; // Default to Addis Ababa
        let searchType = 'city';
        let destType = 'city';

        if (locations && locations.length > 0) {
            // Prioritize Ethiopian locations if query implies it
            const ethiopianLocation = locations.find((loc: any) => loc.cc1 === 'et');
            const targetLocation = ethiopianLocation || locations[0];

            destId = targetLocation.dest_id;
            searchType = targetLocation.search_type;
            destType = targetLocation.dest_type;
            console.log(`Resolved location to: ${targetLocation.name} (ID: ${destId})`);
        } else {
            console.log('No location found from API for', searchQuery, '- trying curated fallbacks');
            // Curated fallback dest_ids (maintain as needed)
            const FALLBACK_DESTS: Record<string, { dest_id: string; dest_type: string; search_type: string }> = {
                'addis ababa': { dest_id: '-553173', dest_type: 'city', search_type: 'city' },
                'dubai': { dest_id: '20088325', dest_type: 'city', search_type: 'city' },
                'london': { dest_id: '-2601889', dest_type: 'city', search_type: 'city' },
                'frankfurt/main': { dest_id: '-1771148', dest_type: 'city', search_type: 'city' },
                'istanbul': { dest_id: '-755070', dest_type: 'city', search_type: 'city' },
                'new york': { dest_id: '20088325', dest_type: 'city', search_type: 'city' },
            };
            const key = searchQuery.toLowerCase();
            if (FALLBACK_DESTS[key]) {
                destId = FALLBACK_DESTS[key].dest_id;
                searchType = FALLBACK_DESTS[key].search_type;
                destType = FALLBACK_DESTS[key].dest_type;
            } else {
                console.log('No curated fallback; using default Addis Ababa');
            }
        }

        // 2. Build Filter IDs
        const categoriesFilterIds = [];
        if (stars) {
            const starList = stars.split(',');
            categoriesFilterIds.push(...starList.map(s => `class::${s}`));
        }
        if (minRating) {
            categoriesFilterIds.push(`review_score::${parseInt(minRating) / 10}`); // e.g. 80 -> 8
        }
        if (amenities) {
            if (amenities.includes('breakfast')) categoriesFilterIds.push('meal_plan::1');
            if (amenities.includes('cancellation')) categoriesFilterIds.push('free_cancellation::1');
        }

        // 3. Search Hotels
        const searchOptions = {
            method: 'GET',
            url: `https://${API_CONFIG.RAPIDAPI_HOST}${API_ENDPOINTS.HOTELS.SEARCH}`,
            params: {
                dest_id: destId,
                search_type: searchType,
                dest_type: destType,
                checkin_date: checkIn,
                checkout_date: checkOut,
                page_number: page,
                order_by: sortOrder,
                adults_number: adults,
                children_number: children,
                room_number: rooms,
                units: 'metric',
                locale: 'en-gb',
                filter_by_currency: currency,
                include_adjacency: 'true',
                categories_filter_ids: categoriesFilterIds.join(','),
                price_min: minPrice,
                price_max: maxPrice,
            },
            headers: getApiHeaders(),
        };

        console.log('Fetching hotels with params:', JSON.stringify(searchOptions.params, null, 2));

        const response = await axios.request(searchOptions);
        const results = response.data.result || [];
        const totalCount = (response.data.count ?? results.length) as number;

        let hotels = results.map((item: any) => {
            // Price calculation
            const priceBreakdown = item.composite_price_breakdown;
            const grossAmount = priceBreakdown?.gross_amount_per_night?.value || item.min_total_price?.value || 0;
            const strikethroughAmount = priceBreakdown?.strikethrough_amount_per_night?.value;
            const discountPercentage = strikethroughAmount
                ? Math.round(((strikethroughAmount - grossAmount) / strikethroughAmount) * 100)
                : 0;

            // Badges
            const badges = item.badges?.map((badge: any) => badge.text) || [];
            if (item.is_mobile_deal) badges.push('Mobile-only price');

            // Image - prefer high res
            const image = item.max_1440_photo_url ||
                item.max_photo_url ||
                item.main_photo_url ||
                item.photo_urls?.[0] ||
                'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80';

            return {
                id: item.hotel_id?.toString(),
                name: item.hotel_name || 'Unknown Hotel',
                location: item.address || query,
                rating: item.review_score || 0,
                reviews: item.review_nr || 0,
                reviewWord: item.review_score_word || '',
                price: grossAmount,
                originalPrice: strikethroughAmount || (grossAmount * 1.2), // Fallback for UI
                discountPercentage: discountPercentage || 20,
                badges,
                distance: item.distance_to_cc_formatted || `${item.distance_to_cc || 0} km from centre`,
                image,
                coordinates: (item.latitude && item.longitude) ? { lat: item.latitude, lng: item.longitude } : undefined,
                amenities: item.hotel_facilities ? item.hotel_facilities.split(',').slice(0, 5) : ['Free WiFi'],
                description: item.unit_configuration_label || `Stay at ${item.hotel_name}`,
            };
        });

        // Optional server-side filter by hotel name (contains)
        if (hotelName) {
            const nameLc = hotelName.toLowerCase();
            hotels = hotels.filter((h: any) => h.name.toLowerCase().includes(nameLc));
        }

        // Compute hasNextPage heuristically from total count and current page size
        const pageIndex = Number(page) || 0;
        const pageSize = results.length;
        const hasNextPage = pageSize > 0 ? (pageSize * (pageIndex + 1) < totalCount) : false;

        return NextResponse.json({
            hotels,
            total: totalCount,
            hasNextPage,
        });

    } catch (error: any) {
        const status = error?.response?.status;
        console.error('Error fetching hotels:', status, error.message);

        // Mock Data Fallback
        const generateMockHotels = () => {
            const hotelImages = [
                'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80',
                'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=800&q=80',
                'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800&q=80',
                'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=800&q=80',
                'https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=800&q=80',
                'https://images.unsplash.com/photo-1596436889106-be35e843f974?auto=format&fit=crop&w=800&q=80',
                'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?auto=format&fit=crop&w=800&q=80',
                'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80',
            ];
            
            return Array.from({ length: 10 }).map((_, i) => ({
                id: `mock-${i}`,
                name: `Mock Hotel ${i + 1} in ${query}`,
                location: query,
                rating: 8.5,
                reviews: 120 + i * 10,
                reviewWord: 'Very Good',
                price: 150 + i * 20,
                originalPrice: 200 + i * 20,
                discountPercentage: 25,
                badges: ['Free Cancellation'],
                distance: '2 km from centre',
                image: hotelImages[i % hotelImages.length],
                amenities: ['Free WiFi', 'Pool', 'Spa'],
                description: 'A wonderful place to stay.',
            }));
        };

        return NextResponse.json({
            hotels: generateMockHotels(),
            total: 10,
            hasNextPage: false
        });
    }
}
