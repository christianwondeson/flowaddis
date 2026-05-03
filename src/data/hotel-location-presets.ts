import type { LocationSuggestion } from '@/types/api';

/**
 * Curated hotel destinations (Booking-style dest_ids) used by LocationInput first-click
 * and kept in sync with `/api/hotels/locations` fallbacks.
 */
export const HOTEL_LOCATION_PRESETS: LocationSuggestion[] = [
    { name: 'Addis Ababa', dest_id: '-603097', dest_type: 'city', cityName: 'Addis Ababa', country: 'Ethiopia', label: 'Addis Ababa, Ethiopia' },
    { name: 'Bishoftu', dest_id: '-603094', dest_type: 'city', cityName: 'Bishoftu', country: 'Ethiopia', label: 'Bishoftu, Ethiopia' },
    { name: 'Hawassa', dest_id: '-603014', dest_type: 'city', cityName: 'Hawassa', country: 'Ethiopia', label: 'Hawassa, Ethiopia' },
    { name: 'Bahir Dar', dest_id: '-603098', dest_type: 'city', cityName: 'Bahir Dar', country: 'Ethiopia', label: 'Bahir Dar, Ethiopia' },
    { name: 'Gondar', dest_id: '-603099', dest_type: 'city', cityName: 'Gondar', country: 'Ethiopia', label: 'Gondar, Ethiopia' },
    { name: 'Lalibela', dest_id: '-603099', dest_type: 'city', cityName: 'Gondar', country: 'Ethiopia', label: 'Lalibela, Ethiopia' },
    { name: 'Harar', dest_id: '-603100', dest_type: 'city', cityName: 'Dire Dawa', country: 'Ethiopia', label: 'Harar, Ethiopia' },
    { name: 'Arba Minch', dest_id: '-603014', dest_type: 'city', cityName: 'Hawassa', country: 'Ethiopia', label: 'Arba Minch, Ethiopia' },
    { name: 'Mekelle', dest_id: '-603099', dest_type: 'city', cityName: 'Gondar', country: 'Ethiopia', label: 'Mekelle, Ethiopia' },
    { name: 'Axum', dest_id: '-603099', dest_type: 'city', cityName: 'Gondar', country: 'Ethiopia', label: 'Axum, Ethiopia' },
    { name: 'Debre Zeit', dest_id: '-603094', dest_type: 'city', cityName: 'Bishoftu', country: 'Ethiopia', label: 'Debre Zeit, Ethiopia' },
    { name: 'Dubai', dest_id: '20088325', dest_type: 'city', cityName: 'Dubai', country: 'UAE', label: 'Dubai, UAE' },
    { name: 'London', dest_id: '-2601889', dest_type: 'city', cityName: 'London', country: 'UK', label: 'London, UK' },
];
