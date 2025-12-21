import { useQuery } from '@tanstack/react-query';
import { Hotel, HotelFilters } from '@/types';
import { queryKeys } from '@/lib/react-query';

interface UseHotelsParams {
    query: string;
    checkIn?: Date;
    checkOut?: Date;
    page?: number;
    filters?: HotelFilters;
    adults?: number;
    children?: number;
    rooms?: number;
}

export function useHotels({ query, checkIn, checkOut, page = 0, filters, adults = 2, children = 0, rooms = 1 }: UseHotelsParams) {
    return useQuery({
        queryKey: queryKeys.hotels.list({ query, checkIn, checkOut, page, filters, adults, children, rooms }),
        queryFn: async (): Promise<{ hotels: Hotel[], hasNextPage: boolean }> => {
            // Build query params
            const params = new URLSearchParams({
                query,
                page: page.toString(),
                adults: adults.toString(),
                children: children.toString(),
                rooms: rooms.toString(),
            });

            if (checkIn) params.append('checkIn', checkIn.toISOString().split('T')[0]);
            if (checkOut) params.append('checkOut', checkOut.toISOString().split('T')[0]);
            if (filters?.sortOrder) params.append('sortOrder', filters.sortOrder);
            if (filters?.minPrice) params.append('minPrice', filters.minPrice.toString());
            if (filters?.maxPrice) params.append('maxPrice', filters.maxPrice.toString());
            if (filters?.minRating) params.append('minRating', filters.minRating.toString());
            if (filters?.stars && filters.stars.length > 0) {
                params.append('stars', filters.stars.join(','));
            }
            if (filters?.amenities && filters.amenities.length > 0) {
                params.append('amenities', filters.amenities.join(','));
            }
            if (filters?.hotelName) params.append('hotelName', filters.hotelName);

            try {
                const response = await fetch(`/api/hotels/search?${params.toString()}`);

                if (!response.ok) {
                    throw new Error('Failed to fetch hotels');
                }

                const data = await response.json();

                return {
                    hotels: data.hotels || [],
                    hasNextPage: data.hasNextPage || false
                };
            } catch (error) {
                console.error('Error in useHotels:', error);
                // Return empty list on error, let the UI handle empty state
                // The API route itself handles mock fallback, so this catch is for network errors
                return { hotels: [], hasNextPage: false };
            }
        },
        placeholderData: (previousData) => previousData,
    });
}
