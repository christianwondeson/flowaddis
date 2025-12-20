// API Configuration
export const API_CONFIG = {
    RAPIDAPI_KEY: process.env.NEXT_PUBLIC_RAPIDAPI_KEY || 'a7512b900fmsh9200ccac6d1f7a9p1430b2jsnca937c78f2b2',
    RAPIDAPI_HOST: 'booking-com.p.rapidapi.com',
    BASE_URL: 'https://booking-com.p.rapidapi.com/v1',
} as const;

// API Headers
export const getApiHeaders = () => ({
    'x-rapidapi-key': API_CONFIG.RAPIDAPI_KEY,
    'x-rapidapi-host': API_CONFIG.RAPIDAPI_HOST,
    'Content-Type': 'application/json',
});

// API Endpoints
export const API_ENDPOINTS = {
    HOTELS: {
        SEARCH: '/v2/hotels/search',
        SEARCH_BY_COORDINATES: '/v2/hotels/search-by-coordinates',
        FILTERS: '/v2/hotels/search-filters',
        PHOTOS: '/hotels/photos',
        REVIEWS: '/hotels/review-scores',
        CHILDREN_POLICIES: '/hotels/children-policies',
        META_PROPERTIES: '/v2/hotels/meta-properties',
        CALENDAR_PRICING: '/v2/hotels/calendar-pricing',
        LOCATION_HIGHLIGHTS: '/v1/hotels/location-highlights',
        LOCATIONS: '/v1/hotels/locations',
        NEARBY_CITIES: '/v1/hotels/nearby-cities',
        DETAILS: '/v1/hotels/data',
    },
    FLIGHTS: {
        SEARCH: '/flights/search',
        LOCATIONS: '/flights/locations',
        OFFER_DETAILS: '/flights/offer-details',
    },
    CARS: {
        SEARCH: '/cars/searchCarRentals',
    },
} as const;
