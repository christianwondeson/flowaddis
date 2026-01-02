import { env } from './env';

// API Configuration
export const API_CONFIG = {
    RAPIDAPI_KEY: env.NEXT_PUBLIC_RAPIDAPI_KEY,
    RAPIDAPI_HOST: 'booking-com.p.rapidapi.com',
    BASE_URL: 'https://booking-com.p.rapidapi.com/v1',
    // Flights config per user: https://booking-com18.p.rapidapi.com/flights
    FLIGHTS_HOST: 'booking-com18.p.rapidapi.com',
    FLIGHTS_BASE_URL: 'https://booking-com18.p.rapidapi.com/flights',
} as const;

// API Headers (optionally override host)
export const getApiHeaders = (hostOverride?: string) => ({
    'x-rapidapi-key': API_CONFIG.RAPIDAPI_KEY,
    'x-rapidapi-host': hostOverride || API_CONFIG.RAPIDAPI_HOST,
    'Content-Type': 'application/json',
});

// API Endpoints
export const API_ENDPOINTS = {
    HOTELS: {
        SEARCH: '/v2/hotels/search',
        SEARCH_BY_COORDINATES: '/v2/hotels/search-by-coordinates',
        FILTERS: '/v2/hotels/search-filters',
        PHOTOS: '/hotels/photos',
        REVIEW_SCORES: '/hotels/review-scores',
        REVIEWS: '/v1/hotels/reviews',
        FACILITIES: '/v1/hotels/facilities',
        DESCRIPTION: '/v2/hotels/description',
        CHILDREN_POLICIES: '/hotels/children-policies',
        META_PROPERTIES: '/v2/hotels/meta-properties',
        CALENDAR_PRICING: '/v2/hotels/calendar-pricing',
        LOCATION_HIGHLIGHTS: '/v1/hotels/location-highlights',
        LOCATIONS: '/v1/hotels/locations',
        NEARBY_CITIES: '/v1/hotels/nearby-cities',
        DETAILS: '/v1/hotels/data',
        ROOM_LIST: '/v1/hotels/room-list',
    },
    FLIGHTS: {
        // Note: when using FLIGHTS_BASE_URL above, these are relative to that base
        SEARCH_RETURN: '/search-return',
        SEARCH_ONEWAY: '/search-oneway',
        LOCATIONS: '/auto-complete',
        OFFER_DETAILS: '/offer-details',
    },
    CARS: {
        SEARCH: '/cars/searchCarRentals',
    },
} as const;
