/**
 * API Response Type Definitions
 * 
 * Centralized type definitions for all API responses to replace 'any' types
 * and provide better type safety throughout the application.
 */

// ============================================================================
// Location & Search Types
// ============================================================================

export interface LocationSuggestion {
    id?: string;
    name: string;
    label?: string;
    type?: 'CITY' | 'AIRPORT' | 'REGION';

    // Hotel-specific fields
    dest_id?: string;
    dest_type?: string;
    city_name?: string;
    cityName?: string;
    country?: string;
    countryName?: string;
    nr_hotels?: number;
    cc1?: string; // Country code
    latitude?: number;
    longitude?: number;

    // Flight-specific fields
    code?: string;
    iata_code?: string;
    short_code?: string;

    // UI fields
    image_url?: string;
    photoUri?: string;
}

// ============================================================================
// Hotel Types
// ============================================================================

export interface Hotel {
    id: string;
    name: string;
    location: string;
    rating: number;
    reviews: number;
    reviewWord: string;
    price: number;
    originalPrice?: number;
    discountPercentage?: number;
    badges: string[];
    distance: string;
    image: string;
    coordinates?: {
        lat: number;
        lng: number;
    };
    amenities: string[];
    description: string;
}

export interface HotelFilters {
    minPrice?: number;
    maxPrice?: number;
    stars?: string;
    minRating?: number;
    amenities?: string;
    hotelName?: string;
}

export interface RoomBlock {
    room_id: string;
    block_id?: string;
    name_without_policy: string;
    nr_adults: number;
    nr_children?: number;
    extrabed_available?: boolean;
    refundable: number;
    price_breakdown: {
        all_inclusive_price: number;
        currency: string;
        charges_details?: {
            translated_copy: string;
        };
    };
    transactional_policy_objects?: Array<{
        text: string;
    }>;
}

export interface RoomDetails {
    room_name: string;
    bed_configurations?: Array<{
        bed_types: Array<{
            name_with_count: string;
        }>;
    }>;
    highlights?: Array<{
        translated_name: string;
    }>;
}

// ============================================================================
// Flight Types
// ============================================================================

export interface Flight {
    id: string;
    airline: string;
    flightNumber: string;
    departure: {
        airport: string;
        time: string;
        date: string;
    };
    arrival: {
        airport: string;
        time: string;
        date: string;
    };
    duration: string;
    price: number;
    currency: string;
    stops: number;
    class: 'economy' | 'business' | 'first';
}

// ============================================================================
// Trip & Booking Types
// ============================================================================

export interface TripItem {
    id: string;
    type: 'flight' | 'hotel' | 'shuttle' | 'conference';
    details: any; // Can be further typed based on type
    price: number;
}

export interface Trip {
    id: string;
    userId: string;
    items: TripItem[];
    totalAmount: number;
    status: 'pending' | 'confirmed' | 'cancelled';
    date: string;
}

// ============================================================================
// API Response Wrappers
// ============================================================================

export interface ApiResponse<T> {
    data: T;
    error?: string;
}

export interface PaginatedResponse<T> {
    items: T[];
    total: number;
    page: number;
    pageSize: number;
    hasNextPage: boolean;
}

export interface HotelSearchResponse {
    hotels: Hotel[];
    total: number;
    hasNextPage: boolean;
    destId?: string;
}
