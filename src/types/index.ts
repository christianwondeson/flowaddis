export interface Hotel {
    id: string;
    name: string;
    location: string;
    rating: number;
    reviews?: number;
    reviewWord?: string;
    price: number;
    originalPrice?: number;
    discountPercentage?: number;
    badges?: string[];
    distance?: string;
    coordinates?: {
        lat: number;
        lng: number;
    };
    image: string;
    amenities?: string[];
    description?: string;
    roomType?: string;
    paymentPolicy?: string;
    cancellationPolicy?: string;
    priceIncludesTaxes?: boolean;
    /** bookaddis_direct | pms_synced | rapidapi */
    inventory_source?: 'bookaddis_direct' | 'pms_synced' | 'rapidapi';
    /** False for RapidAPI partner listings (no BookAddis reservation). */
    bookable?: boolean;
}

export interface HotelFilters {
    minPrice?: number;
    maxPrice?: number;
    stars?: number[];
    sortOrder?: string;
    minRating?: number;
    amenities?: string[];
    hotelName?: string;
    /** Destination text (city / region label)  same as home SearchWidget */
    query?: string;
    /** From LocationInput / URL  pins search to Booking.com destination */
    destId?: string;
    destType?: string;
    /** bookaddis_direct skips RapidAPI (homepage featured, etc.) */
    inventory_source?: 'bookaddis_direct' | 'pms_synced' | 'rapidapi' | 'all';
}

export interface PriceMarker {
    id: string;
    name: string;
    price: number;
    lat: number;
    lng: number;
    image?: string;
    /** Hotel opened from detail page  bounce + fly-to on map */
    isRouteSelected?: boolean;
    /** List hover */
    isHovered?: boolean;
}
