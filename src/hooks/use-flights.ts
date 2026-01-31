import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/react-query';
import { apiClient } from '@/lib/api-client';
import { APP_CONSTANTS } from '@/lib/constants';

interface UseFlightsParams {
    fromCode?: string; // legacy, will be normalized to IATA
    toCode?: string;   // legacy, will be normalized to IATA
    departDate?: Date;
    returnDate?: Date;
    flightType?: 'ROUNDTRIP' | 'ONEWAY' | 'MULTISTOP';
    cabinClass?: string;
    orderBy?: string;
    adults?: number;
    children?: number;
    page?: number;
    numberOfStops?: 'nonstop_flights' | 'maximum_one_stop' | 'all';
    nonstopFlightsOnly?: boolean;
    priceRange?: string; // "min,max"
    airlines?: string;   // "LH,NK"
    segments?: { from: string; to: string; date: string }[];
    currency?: string;
}

export function useFlights({ fromCode, toCode, departDate, returnDate, flightType = 'ROUNDTRIP', cabinClass, orderBy, adults = 1, children = 0, page = 0, numberOfStops, nonstopFlightsOnly, priceRange, airlines, segments, currency = 'USD' }: UseFlightsParams) {
    const fromId = fromCode;
    const toId = toCode;

    return useQuery({
        queryKey: queryKeys.flights.list({ fromId, toId, departDate, returnDate, adults, children, page, flightType, cabinClass, orderBy, numberOfStops, nonstopFlightsOnly, priceRange, airlines, segments }),
        queryFn: async () => {
            const params: Record<string, any> = {
                fromId,
                toId,
                departureDate: departDate?.toISOString().split('T')[0],
                returnDate: returnDate?.toISOString().split('T')[0],
                adults,
                children,
                page,
                flightType: flightType || 'ROUNDTRIP',
                cabinClass: cabinClass || 'ECONOMY',
                orderBy: orderBy || 'BEST',
                numberOfStops,
                nonstopFlightsOnly,
                priceRange,
                airlines,
                segments: segments ? JSON.stringify(segments) : undefined,
                currency,
            };

            const cleanParams = Object.fromEntries(
                Object.entries(params).filter(([_, v]) => v !== undefined)
            );

            const data = await apiClient.get<any>(APP_CONSTANTS.API.FLIGHTS, cleanParams);
            return {
                flights: data.flights || [],
                searchPath: data.searchPath as string | undefined,
                aggregation: data.aggregation || data.resultSetMetaData || null
            };
        },
        enabled: Boolean((fromId && toId && departDate && (flightType === 'ONEWAY' || returnDate)) || (flightType === 'MULTISTOP' && segments && segments.length > 0)),
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        refetchOnReconnect: false,
        staleTime: 60_000,
    });
}

export function useFlightLocations(query: string) {
    return useQuery({
        queryKey: queryKeys.flights.detail(query),
        queryFn: async () => {
            if (!query || query.length < 3) return [];
            return apiClient.get<any[]>('/api/flights/locations', { name: query });
        },
        enabled: query.length >= 3,
    });
}

export function useFlightDetail(selectionKey?: string) {
    return useQuery({
        queryKey: ['flight-detail', selectionKey],
        queryFn: async () => {
            return apiClient.get<any>('/api/flights/detail', { selectionKey, currency_code: 'USD' });
        },
        enabled: Boolean(selectionKey),
        refetchOnWindowFocus: false,
        staleTime: 60_000,
    });
}
export function useFlightSeatMap(offerToken?: string, currencyCode: string = 'USD') {
    return useQuery({
        queryKey: ['flight-seatmap', offerToken, currencyCode],
        queryFn: async () => {
            return apiClient.get<any>('/api/flights/seatmap', { offerToken, currency_code: currencyCode });
        },
        enabled: Boolean(offerToken),
        refetchOnWindowFocus: false,
        staleTime: 60_000,
    });
}
