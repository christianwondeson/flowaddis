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
    const pageSizeParam = searchParams.get('pageSize');
    const pageSize = pageSizeParam ? Math.max(1, Math.min(50, parseInt(pageSizeParam))) : 10;
    const currency = searchParams.get('currency') || 'USD';

    const adults = searchParams.get('adults') || '2';
    const children = searchParams.get('children') || '0';
    const rooms = searchParams.get('rooms') || '1';

    // Direct IDs
    const urlDestId = searchParams.get('destId');
    const urlDestType = searchParams.get('destType');

    // Filters
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const stars = searchParams.get('stars');
    const minRating = searchParams.get('minRating');
    const amenities = searchParams.get('amenities');
    const hotelName = searchParams.get('hotelName') || '';

    try {
        let destId = urlDestId;
        let destType = urlDestType || 'city';
        let searchType = urlDestType || 'city';

        if (!destId) {
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

            const locationOptions = {
                method: 'GET',
                url: `https://${API_CONFIG.RAPIDAPI_HOST}${API_ENDPOINTS.HOTELS.LOCATIONS}`,
                params: {
                    name: searchQuery,
                    locale: 'en-gb',
                },
                headers: getApiHeaders(),
            };

            const locationResponse = await axios.request(locationOptions);
            const locations = locationResponse.data;

            destId = '-553173'; // Default to Addis Ababa
            searchType = 'city';
            destType = 'city';

            if (locations && locations.length > 0) {
                // Prioritize Ethiopian locations if query implies it
                const ethiopianLocation = locations.find((loc: any) => loc.cc1 === 'et');
                const targetLocation = ethiopianLocation || locations[0];

                destId = targetLocation.dest_id;
                searchType = targetLocation.search_type;
                destType = targetLocation.dest_type;
            } else {
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
                }
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
                search_type: searchType || 'city',
                dest_type: destType || 'city',
                checkin_date: checkIn,
                checkout_date: checkOut,
                page_number: page,
                order_by: sortOrder,
                adults_number: adults,
                ...(Number(children) > 0 && { children_number: children }),
                room_number: rooms,
                units: 'metric',
                locale: 'en-gb',
                filter_by_currency: currency,
                include_adjacency: 'true',
                ...(categoriesFilterIds.length > 0 && { categories_filter_ids: categoriesFilterIds.join(',') }),
                ...(minPrice && { price_min: minPrice }),
                ...(maxPrice && { price_max: maxPrice }),
            },
            headers: getApiHeaders(),
        };


        const response = await axios.request(searchOptions);
        const results = response.data.result || response.data.results || [];

        // Robust total count detection
        const totalCount = (
            response.data.count ??
            response.data.total_count ??
            response.data.total_results ??
            response.data.total ??
            (response.data.aggregation?.totalCount) ??
            (response.data.aggregation?.filteredTotalCount) ??
            results.length
        ) as number;

        let hotels = results.map((item: any) => {
            // ... mapping logic ...
            // (Keeping existing mapping logic)
            const priceBreakdown = item.priceBreakdown || item.composite_price_breakdown;
            const grossAmount = priceBreakdown?.grossPrice?.value || priceBreakdown?.gross_amount_per_night?.value || item.min_total_price?.value || 0;
            const strikethroughAmount = priceBreakdown?.strikethroughPrice?.value || priceBreakdown?.strikethrough_amount_per_night?.value;
            const discountPercentage = strikethroughAmount
                ? Math.round(((strikethroughAmount - grossAmount) / strikethroughAmount) * 100)
                : 0;

            const badges = item.badges?.map((badge: any) => badge.text) || [];
            if (item.is_mobile_deal || item.isMobileDeal) badges.push('Mobile-only price');

            const image = item.photoMainUrl ||
                item.max_1440_photo_url ||
                item.max_photo_url ||
                item.main_photo_url ||
                (item.photo_urls && item.photo_urls.length > 0 ? item.photo_urls[0] : null) ||
                (item.photoUrls && item.photoUrls.length > 0 ? item.photoUrls[0] : null) ||
                item.url_1440 ||
                item.url_square600 ||
                'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80';

            return {
                id: (item.id || item.hotel_id)?.toString(),
                name: item.name || item.hotel_name || 'Unknown Hotel',
                location: item.address || query,
                rating: item.reviewScore || item.review_score || 0,
                reviews: item.reviewCount || item.review_nr || 0,
                reviewWord: item.reviewScoreWord || item.review_score_word || '',
                price: grossAmount,
                originalPrice: strikethroughAmount || (grossAmount * 1.2),
                discountPercentage: discountPercentage || 20,
                badges,
                distance: item.distance_to_cc_formatted || (item.distance_to_cc ? `${item.distance_to_cc} km from centre` : 'Near centre'),
                image,
                coordinates: (item.latitude && item.longitude) ? { lat: item.latitude, lng: item.longitude } : undefined,
                amenities: item.hotel_facilities ? item.hotel_facilities.split(',').slice(0, 5) : ['Free WiFi'],
                description: item.unit_configuration_label || `Stay at ${item.name || item.hotel_name || 'this hotel'}`,
            };
        });

        if (hotelName) {
            const nameLc = hotelName.toLowerCase();
            hotels = hotels.filter((h: any) => h.name.toLowerCase().includes(nameLc));
        }

        // Pagination limiting on our side to ensure consistent page size
        const pageIndex = Number(page) || 0;
        const start = 0;
        const limitedHotels = hotels.slice(start, pageSize);

        // Compute hasNextPage using totalCount and pageSize
        let hasNextPage = false;
        if (totalCount && totalCount > (pageIndex + 1) * pageSize) {
            hasNextPage = true;
        } else if (hotels.length > pageSize) {
            // If API returned more than our pageSize, assume there are more
            hasNextPage = true;
        }

        console.log(`[API] Search: query=${query}, page=${pageIndex}, pageSize=${pageSize}, totalCount=${totalCount}, returned=${limitedHotels.length}, hasNext=${hasNextPage}`);

        return NextResponse.json({
            hotels: limitedHotels,
            total: totalCount,
            hasNextPage,
            destId,
        });

    } catch (error: any) {
        const status = error?.response?.status;
        console.error('Error fetching hotels:', status, error?.message);
        if (error?.response?.data) {
            console.error('API Error Details:', JSON.stringify(error.response.data, null, 2));
        }
        // Return empty results on error (no mock data)
        return NextResponse.json({ hotels: [], total: 0, hasNextPage: false });
    }
}
