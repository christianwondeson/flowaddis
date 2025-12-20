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
}

export interface HotelFilters {
    minPrice?: number;
    maxPrice?: number;
    stars?: number[];
    sortOrder?: string;
    minRating?: number;
    amenities?: string[];
    hotelName?: string;
}

export interface TripItem {
    id: string;
    type: 'flight' | 'hotel' | 'shuttle' | 'conference';
    details: any;
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
