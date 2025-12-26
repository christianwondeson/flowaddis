import { useQuery } from '@tanstack/react-query';
import { Hotel, HotelFilters } from '@/types';
import { queryKeys } from '@/lib/react-query';

interface UseHotelsParams {
    query: string;
    destId?: string;
    destType?: string;
    checkIn?: Date;
    checkOut?: Date;
    page?: number;
    pageSize?: number;
    filters?: HotelFilters;
    adults?: number;
    children?: number;
    rooms?: number;
}

export function useHotels({ query, destId, destType, checkIn, checkOut, page = 0, pageSize = 10, filters, adults = 2, children = 0, rooms = 1, }: UseHotelsParams, options?: { enabled?: boolean }) {
    return useQuery({
        queryKey: queryKeys.hotels.list({ query, destId, destType, checkIn, checkOut, page, pageSize, filters, adults, children, rooms }),
        queryFn: async (): Promise<{ hotels: Hotel[], hasNextPage: boolean, totalCount: number, destId?: string }> => {
            // Build query params
            const params = new URLSearchParams({
                query,
                page: page.toString(),
                pageSize: pageSize.toString(),
                adults: adults.toString(),
                children: children.toString(),
                rooms: rooms.toString(),
            });

            if (destId) params.append('destId', destId);
            if (destType) params.append('destType', destType);
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
                    hasNextPage: data.hasNextPage || false,
                    totalCount: data.total || 0,
                    destId: data.destId
                };
            } catch (error) {
                console.error('Error in useHotels:', error);
                // Return empty list on error, let the UI handle empty state
                // The API route itself handles mock fallback, so this catch is for network errors
                return { hotels: [], hasNextPage: false, totalCount: 0 };
            }
        },
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        refetchOnReconnect: false,
        staleTime: 60_000,
        enabled: options?.enabled ?? true,
    });
}
