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
    query?: string;
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

export interface PriceMarker {
    id: string;
    name: string;
    price: number;
    lat: number;
    lng: number;
    image?: string;
}

export type PaymentStatus = 'pending' | 'succeeded' | 'failed' | 'refunded';

export interface Booking {
    id: string;
    userId: string;
    serviceId: string;
    serviceType: 'flight' | 'hotel' | 'shuttle' | 'conference';
    serviceName: string;
    customerInfo: {
        name: string;
        email: string;
        phone: string;
    };
    bookingDetails: {
        checkIn?: string;
        checkOut?: string;
        guests?: number;
        rooms?: number;
        [key: string]: any;
    };
    payment: {
        amount: number;
        currency: string;
        method: 'stripe' | 'paypal' | 'revolut' | 'telebirr' | 'cbebirr';
        status: PaymentStatus;
        transactionId?: string;
    };
    status: 'pending' | 'confirmed' | 'cancelled';
    createdAt: string;
    updatedAt: string;
}
