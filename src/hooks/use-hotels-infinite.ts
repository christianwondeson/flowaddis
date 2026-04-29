import { useInfiniteQuery } from '@tanstack/react-query';
import { Hotel, HotelFilters } from '@/types';
import { queryKeys } from '@/lib/react-query';
import { apiClient } from '@/lib/api-client';
import { APP_CONSTANTS } from '@/lib/constants';
import { mergeHotelSearchLocation } from '@/lib/hotel-search-location';
import { formatDateLocal } from '@/lib/date-utils';

interface UseHotelsInfiniteParams {
    query: string;
    destId?: string;
    destType?: string;
    checkIn?: Date;
    checkOut?: Date;
    pageSize?: number;
    filters?: HotelFilters;
    adults?: number;
    children?: number;
    rooms?: number;
    latitude?: number;
    longitude?: number;
}

type UseHotelsInfiniteOptions = {
    enabled?: boolean;
    staleTime?: number;
};

export function useHotelsInfinite(
    { query, destId, destType, checkIn, checkOut, pageSize = 50, filters, adults = 2, children = 0, rooms = 1, latitude, longitude }: UseHotelsInfiniteParams,
    options?: UseHotelsInfiniteOptions,
) {
    const { query: effectiveQuery, destId: effectiveDestId, destType: effectiveDestType, filterRest } = mergeHotelSearchLocation(
        query,
        destId,
        destType,
        filters,
    );

    return useInfiniteQuery({
        queryKey: [...queryKeys.hotels.all, 'infinite', effectiveQuery, effectiveDestId, effectiveDestType, checkIn, checkOut, pageSize, filterRest, adults, children, rooms, latitude, longitude],
        queryFn: async ({ pageParam = 0 }): Promise<{ hotels: Hotel[]; hasNextPage: boolean; totalCount: number; destId?: string }> => {
            const params: Record<string, any> = {
                query: effectiveQuery,
                page: pageParam,
                pageSize,
                adults,
                children,
                rooms,
                ...filterRest,
                checkIn: checkIn ? formatDateLocal(checkIn) : undefined,
                checkOut: checkOut ? formatDateLocal(checkOut) : undefined,
                destId: effectiveDestId,
                destType: effectiveDestType,
                latitude,
                longitude,
            };

            const cleanParams = Object.fromEntries(
                Object.entries(params)
                    .filter(([_, v]) => v !== undefined)
                    .map(([k, v]) => [k, Array.isArray(v) ? v.join(',') : v]),
            );

            const data = await apiClient.get<any>(APP_CONSTANTS.API.HOTELS, cleanParams);
            return {
                hotels: data.hotels || [],
                hasNextPage: data.hasNextPage || false,
                totalCount: data.total || 0,
                destId: data.destId,
            };
        },
        initialPageParam: 0,
        getNextPageParam: (lastPage, allPages) => {
            if (!lastPage.hasNextPage) return undefined;
            return allPages.length;
        },
        refetchOnWindowFocus: false,
        refetchOnMount: true,
        refetchOnReconnect: false,
        staleTime: options?.staleTime ?? 0,
        enabled: options?.enabled ?? true,
    });
}
