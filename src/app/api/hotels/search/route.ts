import { NextResponse } from 'next/server';
import { API_CONFIG, API_ENDPOINTS, getApiHeaders } from '@/lib/api-config';
import axios from 'axios';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query') || 'Addis Ababa';
    const checkIn = searchParams.get('checkIn') || new Date(Date.now() + 86400000).toISOString().split('T')[0];
    const checkOut = searchParams.get('checkOut') || new Date(Date.now() + 172800000).toISOString().split('T')[0];
    const page = searchParams.get('page') || '0';
    const sortOrder = searchParams.get('sortOrder') || 'class_descending';
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

    try {
        let destId = urlDestId;
        let destType = urlDestType || 'city';
        let searchType = urlDestType || 'city';
        const hadUrlDestId = !!urlDestId;

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

            // Curated fallback – attractions map to nearest city with hotels
            const FALLBACK_DESTS: Record<string, { dest_id: string; dest_type: string; search_type: string; cc?: string }> = {
                'addis ababa': { dest_id: '-603097', dest_type: 'city', search_type: 'city', cc: 'et' },
                'bishoftu': { dest_id: '-603094', dest_type: 'city', search_type: 'city', cc: 'et' },
                'hawassa': { dest_id: '-603014', dest_type: 'city', search_type: 'city', cc: 'et' },
                'bahir dar': { dest_id: '-603098', dest_type: 'city', search_type: 'city', cc: 'et' },
                'gondar': { dest_id: '-603099', dest_type: 'city', search_type: 'city', cc: 'et' },
                'gonder': { dest_id: '-603099', dest_type: 'city', search_type: 'city', cc: 'et' },
                'dire dawa': { dest_id: '-603100', dest_type: 'city', search_type: 'city', cc: 'et' },
                'adama': { dest_id: '-603094', dest_type: 'city', search_type: 'city', cc: 'et' },
                'debre zeit': { dest_id: '-603094', dest_type: 'city', search_type: 'city', cc: 'et' },
                'lalibela': { dest_id: '-603099', dest_type: 'city', search_type: 'city', cc: 'et' },
                'axum': { dest_id: '-603099', dest_type: 'city', search_type: 'city', cc: 'et' },
                'harar': { dest_id: '-603100', dest_type: 'city', search_type: 'city', cc: 'et' },
                'arba minch': { dest_id: '-603014', dest_type: 'city', search_type: 'city', cc: 'et' },
                'mekele': { dest_id: '-603099', dest_type: 'city', search_type: 'city', cc: 'et' },
                'mekelle': { dest_id: '-603099', dest_type: 'city', search_type: 'city', cc: 'et' },
                'sof omar': { dest_id: '-603014', dest_type: 'city', search_type: 'city', cc: 'et' },
                'wenchi': { dest_id: '-603094', dest_type: 'city', search_type: 'city', cc: 'et' },
                'bale': { dest_id: '-603014', dest_type: 'city', search_type: 'city', cc: 'et' },
                'langano': { dest_id: '-603014', dest_type: 'city', search_type: 'city', cc: 'et' },
                'omo valley': { dest_id: '-603014', dest_type: 'city', search_type: 'city', cc: 'et' },
                'omo': { dest_id: '-603014', dest_type: 'city', search_type: 'city', cc: 'et' },
                'danakil': { dest_id: '-603099', dest_type: 'city', search_type: 'city', cc: 'et' },
                'dubai': { dest_id: '20088325', dest_type: 'city', search_type: 'city' },
                'london': { dest_id: '-2601889', dest_type: 'city', search_type: 'city' },
                'frankfurt/main': { dest_id: '-1771148', dest_type: 'city', search_type: 'city' },
                'istanbul': { dest_id: '-755070', dest_type: 'city', search_type: 'city' },
                'new york': { dest_id: '20088325', dest_type: 'city', search_type: 'city' },
            };
            const fallbackKey = searchQuery.toLowerCase().replace(/,?\s*ethiopia$/i, '').trim();
            // Try exact match first, then partial (e.g. "sof omar caves" → "sof omar")
            const fallbackMatch = FALLBACK_DESTS[fallbackKey] ?? Object.entries(FALLBACK_DESTS).find(([k]) => fallbackKey.includes(k) || k.includes(fallbackKey))?.[1];
            if (fallbackMatch) {
                destId = fallbackMatch.dest_id;
                searchType = fallbackMatch.search_type;
                destType = fallbackMatch.dest_type;
            } else {
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

                destId = '-603097'; // Default to Addis Ababa, Ethiopia
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
                    // Locations API returned empty – use same fallback as above
                    const key = searchQuery.toLowerCase().replace(/,?\s*ethiopia$/i, '').trim();
                    const apiFallback = FALLBACK_DESTS[key] ?? Object.entries(FALLBACK_DESTS).find(([k]) => key.includes(k) || k.includes(key))?.[1];
                    if (apiFallback) {
                        destId = apiFallback.dest_id;
                        searchType = apiFallback.search_type;
                        destType = apiFallback.dest_type;
                    }
                }
            }
        }

        // Resolve fallback country code for Ethiopia queries
        const queryLower = query.toLowerCase().trim();
        const isEthiopiaQuery = /addis\s*ababa|ethiopia|bahir\s*dar|gonder|gondar|lalibela|hawassa|bishoftu|harar|arba\s*minch|mekele|sof\s*omar|wenchi|bale|langano|omo|danakil|dire\s*dawa/.test(queryLower);
        const filterByCountry = isEthiopiaQuery ? 'et' : undefined;

        // 2. Build Filter IDs
        const categoriesFilterIds: string[] = [];
        if (stars) {
            const starList = stars.split(',');
            categoriesFilterIds.push(...starList.map(s => `class::${s}`));
        }
        if (minRating) {
            // UI passes 60/70/80/90 (meaning 6+/7+/8+/9+). Booking filter id uses reviewscorebuckets.
            const bucket = Math.max(0, Math.min(100, parseInt(minRating, 10) || 0));
            categoriesFilterIds.push(`reviewscorebuckets::${bucket}`);
        }
        if (amenities) {
            if (amenities.includes('breakfast')) categoriesFilterIds.push('meal_plan::1');
            if (amenities.includes('cancellation')) categoriesFilterIds.push('free_cancellation::1');
        }

        // 3. Search Hotels
        const buildSearchOptions = (args: {
            destId?: string | null;
            destType?: string | null;
            searchType?: string | null;
            latitude?: string | null;
            longitude?: string | null;
        }) => {
            const { destId: dId, destType: dType, searchType: sType, latitude: lat, longitude: lng } = args;
            if (lat && lng) {
                return {
                    method: 'GET',
                    url: `https://${API_CONFIG.RAPIDAPI_HOST}${API_ENDPOINTS.HOTELS.SEARCH_BY_COORDINATES}`,
                    params: {
                        latitude: lat,
                        longitude: lng,
                        checkin_date: checkIn,
                        checkout_date: checkOut,
                        page_number: page,
                        rows: String(pageSize),
                        order_by: apiOrderBy,
                        ...(filterByCountry && { filter_by_country: filterByCountry }),
                        adults_number: adults,
                        ...(Number(children) > 0 && { children_number: children }),
                        room_number: rooms,
                        units: 'metric',
                        locale: 'en-gb',
                        filter_by_currency: currency,
                        ...(categoriesFilterIds.length > 0 && { categories_filter_ids: categoriesFilterIds.join(',') }),
                        ...(minPrice && { price_min: minPrice }),
                        ...(maxPrice && { price_max: maxPrice }),
                    },
                    headers: getApiHeaders(),
                };
            }
            return {
                method: 'GET',
                url: `https://${API_CONFIG.RAPIDAPI_HOST}${API_ENDPOINTS.HOTELS.SEARCH}`,
                params: {
                    dest_id: dId,
                    search_type: sType || 'city',
                    dest_type: dType || 'city',
                    checkin_date: checkIn,
                    checkout_date: checkOut,
                    page_number: page,
                    rows: String(pageSize),
                    order_by: apiOrderBy,
                    ...(filterByCountry && { filter_by_country: filterByCountry }),
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
        };

        const latitude = searchParams.get('latitude') || searchParams.get('lat');
        const longitude = searchParams.get('longitude') || searchParams.get('lng');

        const ORDER_MAP: Record<string, string> = {
            class_descending: 'class_descending',
            review_score: 'review_score',
            review_score_descending: 'review_score_descending',
            popularity: 'popularity',
            price: 'price',
            distance: 'distance',
        };
        const apiOrderBy = ORDER_MAP[sortOrder] || sortOrder || 'class_descending';

        let response = await axios.request(buildSearchOptions({ destId, destType, searchType, latitude, longitude }));
        let results = response.data.result || response.data.results || [];

        // If a destId came from the URL (home cards / deep links) and it yields 0 hotels,
        // retry once by resolving a fresh destination from the query using the locations endpoint.
        // This fixes cases where dest_id differs across providers/versions or was hardcoded incorrectly.
        if (!latitude && !longitude && hadUrlDestId && Array.isArray(results) && results.length === 0) {
            try {
                const searchQuery = query.trim();
                const locationResponse = await axios.request({
                    method: 'GET',
                    url: `https://${API_CONFIG.RAPIDAPI_HOST}${API_ENDPOINTS.HOTELS.LOCATIONS}`,
                    params: { name: searchQuery, locale: 'en-gb' },
                    headers: getApiHeaders(),
                });
                const locations = locationResponse.data;
                if (Array.isArray(locations) && locations.length > 0) {
                    const et = locations.find((loc: any) => loc.cc1 === 'et');
                    const target = et || locations[0];
                    const resolvedDestId = target?.dest_id;
                    const resolvedSearchType = target?.search_type;
                    const resolvedDestType = target?.dest_type;
                    if (resolvedDestId && resolvedSearchType) {
                        response = await axios.request(buildSearchOptions({
                            destId: resolvedDestId,
                            destType: resolvedDestType,
                            searchType: resolvedSearchType,
                            latitude: null,
                            longitude: null,
                        }));
                        results = response.data.result || response.data.results || [];
                        destId = resolvedDestId;
                        destType = resolvedDestType;
                        searchType = resolvedSearchType;
                    }
                }
            } catch (e) {
                // ignore retry errors; fall through with empty results
            }
        }

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

            const roomType =
                item.unit_configuration_label ||
                item.room_name ||
                item.accommodation_type_name ||
                item.block?.[0]?.room_name ||
                null;

            const paymentPolicy =
                item.payment_terms?.summary ||
                item.payment_terms?.description ||
                item.paymentterms?.summary ||
                item.paymentterms?.description ||
                (item.is_prepayment_needed === 0 || item.is_prepayment_needed === false ? 'No prepayment needed – pay at property' : null);

            const cancellationPolicy =
                (item.is_free_cancellable === 1 || item.free_cancellation === 1 ? 'Free cancellation' : null) ||
                item.cancellation?.policy ||
                item.cancellation_policy ||
                null;

            const priceIncludesTaxes =
                Boolean(priceBreakdown?.grossPrice?.value) ||
                Boolean(priceBreakdown?.gross_amount_per_night?.value) ||
                Boolean(item.price_breakdown?.all_inclusive_price);

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
                roomType: roomType || undefined,
                paymentPolicy: paymentPolicy || undefined,
                cancellationPolicy: cancellationPolicy || undefined,
                priceIncludesTaxes,
            };
        });

        // Do not filter by `hotelName` here: results are paginated — the matching property may be on
        // another page, which produced "0 hotels" on the map while the list page worked (client-side filter).
        // Main `/hotels` UI already filters by property name on the client.

        // Post-filter: when searching Addis Ababa/Ethiopia, keep only hotels actually in Ethiopia
        if (isEthiopiaQuery && hotels.length > 0) {
            const ethiopiaIndicators = ['ethiopia', 'addis ababa', 'addis', 'ethiopian', 'bole', 'kirkos', 'yeka', 'piassa', 'merkato'];
            const filtered = hotels.filter((h: any) => {
                const loc = ((h.location || '') + ' ' + (h.name || '')).toLowerCase();
                return ethiopiaIndicators.some((term) => loc.includes(term));
            });
            if (filtered.length > 0) hotels = filtered;
        }

        // The external API already handles pagination via page_number parameter
        // So hotels array should already contain just the hotels for this page
        const pageIndex = Number(page) || 0;

        // Compute hasNextPage using totalCount and pageSize
        // Check if there are more results beyond the current page
        let hasNextPage = false;
        if (totalCount && totalCount > (pageIndex + 1) * pageSize) {
            hasNextPage = true;
        } else if (hotels.length >= pageSize) {
            // If API returned a full page, there might be more
            hasNextPage = true;
        }

        return NextResponse.json({
            hotels: hotels,
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
