import { useQuery } from '@tanstack/react-query';
import { Hotel, HotelFilters } from '@/types';
import { queryKeys } from '@/lib/react-query';
import { apiClient } from '@/lib/api-client';
import { APP_CONSTANTS } from '@/lib/constants';
import { mergeHotelSearchLocation } from '@/lib/hotel-search-location';

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
    latitude?: number;
    longitude?: number;
}

type UseHotelsQueryOptions = {
    enabled?: boolean;
    /** Override default hotel list caching (use staleTime: 0 + refetchOnMount: true on map page). */
    staleTime?: number;
    refetchOnMount?: boolean | 'always';
    gcTime?: number;
};

export function useHotels(
    { query, destId, destType, checkIn, checkOut, page = 0, pageSize = 10, filters, adults = 2, children = 0, rooms = 1, latitude, longitude }: UseHotelsParams,
    options?: UseHotelsQueryOptions,
) {
    const { query: effectiveQuery, destId: effectiveDestId, destType: effectiveDestType, filterRest } = mergeHotelSearchLocation(
        query,
        destId,
        destType,
        filters,
    );

    return useQuery({
        queryKey: queryKeys.hotels.list({
            query: effectiveQuery,
            destId: effectiveDestId,
            destType: effectiveDestType,
            checkIn,
            checkOut,
            page,
            pageSize,
            filters: filterRest,
            adults,
            children,
            rooms,
            latitude,
            longitude,
        }),
        queryFn: async (): Promise<{ hotels: Hotel[], hasNextPage: boolean, totalCount: number, destId?: string }> => {
            const params: Record<string, any> = {
                query: effectiveQuery,
                page,
                pageSize,
                adults,
                children,
                rooms,
                ...filterRest,
                checkIn: checkIn?.toISOString().split('T')[0],
                checkOut: checkOut?.toISOString().split('T')[0],
                destId: effectiveDestId,
                destType: effectiveDestType,
                latitude,
                longitude,
            };

            // Remove undefined values and handle arrays
            const cleanParams = Object.fromEntries(
                Object.entries(params)
                    .filter(([_, v]) => v !== undefined)
                    .map(([k, v]) => [k, Array.isArray(v) ? v.join(',') : v])
            );

            try {
                const data = await apiClient.get<any>(APP_CONSTANTS.API.HOTELS, cleanParams);

                return {
                    hotels: data.hotels || [],
                    hasNextPage: data.hasNextPage || false,
                    totalCount: data.total || 0,
                    destId: data.destId
                };
            } catch (error) {
                console.error('Error in useHotels:', error);
                return { hotels: [], hasNextPage: false, totalCount: 0 };
            }
        },
        refetchOnWindowFocus: false,
        refetchOnMount: options?.refetchOnMount ?? false,
        refetchOnReconnect: false,
        staleTime: options?.staleTime ?? 60_000,
        gcTime: options?.gcTime,
        enabled: options?.enabled ?? true,
    });
}
