/**
 * Location Presets Data
 * 
 * Curated location presets for Ethiopian diaspora routes
 * Used by location-input component for quick suggestions
 */

import { LocationSuggestion } from '@/types/api';

export const LOCATION_PRESETS: LocationSuggestion[] = [
    {
        type: 'CITY',
        name: 'Addis Ababa',
        cityName: 'Addis Ababa',
        countryName: 'Ethiopia',
        dest_id: '-553173',
        dest_type: 'city',
        image_url: 'https://images.unsplash.com/photo-1544085311-11a028465b03?auto=format&fit=crop&w=200&q=80'
    },
    {
        type: 'CITY',
        name: 'Dubai',
        cityName: 'Dubai',
        countryName: 'United Arab Emirates',
        dest_id: '20088325',
        dest_type: 'city',
        image_url: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=200&q=80'
    },
    {
        type: 'CITY',
        name: 'Nairobi',
        cityName: 'Nairobi',
        countryName: 'Kenya',
        dest_id: '-1262321',
        dest_type: 'city',
        image_url: 'https://images.unsplash.com/photo-1585444797702-5c1579bc9446?auto=format&fit=crop&w=200&q=80'
    },
    {
        type: 'CITY',
        name: 'London',
        cityName: 'London',
        countryName: 'United Kingdom',
        dest_id: '-2601889',
        dest_type: 'city',
        image_url: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=200&q=80'
    },
    {
        type: 'CITY',
        name: 'Istanbul',
        cityName: 'Istanbul',
        countryName: 'Turkey',
        dest_id: '-755070',
        dest_type: 'city',
        image_url: 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?auto=format&fit=crop&w=200&q=80'
    },
    {
        type: 'CITY',
        name: 'New York',
        cityName: 'New York',
        countryName: 'United States',
        dest_id: '20088325',
        dest_type: 'city',
        image_url: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=200&q=80'
    },
];
