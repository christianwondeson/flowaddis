import { Hotel } from '@/types';

export const FEATURED_HOTELS: Hotel[] = [
    {
        id: 'fh-1',
        name: 'Skylight Hotel',
        location: 'Bole, Addis Ababa',
        rating: 9.2,
        reviews: 1250,
        reviewWord: 'Superb',
        price: 150,
        image: 'https://images.unsplash.com/photo-1629140727571-9b5c6f6267b4?auto=format&fit=crop&w=800&q=80',
        amenities: ['Free WiFi', 'Pool', 'Restaurant', 'Spa', 'Gym', 'Bar'],
        description: 'Luxury hotel in the heart of Bole',
        distance: '2 km from centre',
        badges: ['Popular', 'Free Cancellation']
    },
    {
        id: 'fh-2',
        name: 'Sheraton Addis',
        location: 'Kirkos, Addis Ababa',
        rating: 9.5,
        reviews: 2100,
        reviewWord: 'Exceptional',
        price: 280,
        originalPrice: 350,
        discountPercentage: 20,
        image: 'https://images.unsplash.com/photo-1741506131058-533fcf894483?auto=format&fit=crop&w=800&q=80',
        amenities: ['Free WiFi', 'Pool', 'Restaurant', 'Spa', 'Gym', 'Bar', 'Conference Rooms'],
        description: 'Iconic luxury hotel with world-class amenities',
        distance: '1 km from centre',
        badges: ['Luxury', 'Business Friendly']
    },
    {
        id: 'fh-3',
        name: 'Hyatt Regency',
        location: 'Meskel Square, Addis Ababa',
        rating: 9.0,
        reviews: 1800,
        reviewWord: 'Wonderful',
        price: 220,
        image: 'https://images.unsplash.com/photo-1754294681773-25c7a42e503b?auto=format&fit=crop&w=800&q=80',
        amenities: ['Free WiFi', 'Pool', 'Restaurant', 'Gym', 'Bar'],
        description: 'Modern hotel near Meskel Square',
        distance: '0.5 km from centre',
        badges: ['Central Location', 'Free Breakfast']
    },
    {
        id: 'fh-4',
        name: 'Radisson Blu',
        location: 'Kazanchis, Addis Ababa',
        rating: 8.8,
        reviews: 950,
        reviewWord: 'Fabulous',
        price: 180,
        image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80',
        amenities: ['Free WiFi', 'Pool', 'Restaurant', 'Spa'],
        description: 'Contemporary hotel with excellent service',
        distance: '3 km from centre',
        badges: ['Modern', 'Pet Friendly']
    }
];
