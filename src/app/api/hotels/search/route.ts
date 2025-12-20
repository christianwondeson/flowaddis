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

    // Filters
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const stars = searchParams.get('stars');
    const minRating = searchParams.get('minRating');
    const amenities = searchParams.get('amenities');

    try {
        // 1. Resolve Location to get dest_id
        // Append ", Ethiopia" if not present to prioritize Ethiopian results for generic queries
        const searchQuery = (query.toLowerCase().includes('ethiopia') || query.toLowerCase().includes('addis'))
            ? query
            : `${query}`;

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
                adults_number: '2',
                children_number: '0',
                room_number: '1',
                units: 'metric',
                locale: 'en-gb',
                filter_by_currency: 'USD',
                include_adjacency: 'true',
                categories_filter_ids: categoriesFilterIds.join(','),
                price_min: minPrice,
                price_max: maxPrice,
            },
            headers: getApiHeaders(),
        };

    
        const response = await axios.request(searchOptions);
        const results = response.data.result || [];

        const hotels = results.map((item: any) => {
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
                amenities: item.hotel_facilities ? item.hotel_facilities.split(',').slice(0, 5) : ['Free WiFi'],
                description: item.unit_configuration_label || `Stay at ${item.hotel_name}`,
            };
        });

        return NextResponse.json({
            hotels,
            total: hotels.length,
            hasNextPage: hotels.length >= 20
        });

    } catch (error: any) {
        console.error('Error fetching hotels:', error.message);

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
                'https://images.unsplash.com/photo-1571896349842-6e5a51335022?auto=format&fit=crop&w=800&q=80',
                'https://images.unsplash.com/photo-1445019980597-93fa8acb246c?auto=format&fit=crop&w=800&q=80',
                'https://images.unsplash.com/photo-1590490360182-f33db079502d?auto=format&fit=crop&w=800&q=80',
                'https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&w=800&q=80',
                'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=800&q=80',
                'https://images.unsplash.com/photo-1590073242678-cfea53382e52?auto=format&fit=crop&w=800&q=80',
                'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?auto=format&fit=crop&w=800&q=80',
            ];

            const moreHotels = Array.from({ length: 30 }).map((_, i) => ({
                id: `mock-${i + 6}`,
                name: `Addis Hotel ${i + 6}`,
                location: 'Addis Ababa',
                rating: 4.0 + (i % 10) / 10,
                reviews: 100 + i * 10,
                reviewWord: 'Good',
                price: 50 + (i % 5) * 20,
                originalPrice: 80 + (i % 5) * 20,
                discountPercentage: 10,
                badges: [],
                distance: `${2 + i} km from centre`,
                image: hotelImages[i % hotelImages.length],
                amenities: ['Free WiFi'],
                description: 'A comfortable stay in Addis Ababa.',
            }));

            return moreHotels;
        };

        let allMockHotels = generateMockHotels();

        // Filter mock data
        if (query && !query.toLowerCase().includes('addis')) {
            allMockHotels = allMockHotels.filter(h =>
                h.name.toLowerCase().includes(query.toLowerCase()) ||
                h.location.toLowerCase().includes(query.toLowerCase())
            );
        }

        if (stars) {
            const starList = stars.split(',').map(Number);
            allMockHotels = allMockHotels.filter(h => {
                const rating = Math.floor(h.rating);
                return starList.includes(rating) || (rating === 4 && starList.includes(5) && h.rating >= 4.5);
            });
        }

        const pageNum = parseInt(page);
        const pageSize = 10;
        const start = pageNum * pageSize;
        const end = start + pageSize;
        const paginatedHotels = allMockHotels.slice(start, end);

        return NextResponse.json({
            hotels: paginatedHotels,
            total: allMockHotels.length,
            hasNextPage: end < allMockHotels.length,
            fromMock: true
        });
    }
}
