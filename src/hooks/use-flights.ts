import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/react-query';
import { apiClient } from '@/lib/api-client';
import { APP_CONSTANTS } from '@/lib/constants';

interface UseFlightsParams {
    fromCode?: string; // legacy, will be normalized to IATA
    toCode?: string;   // legacy, will be normalized to IATA
    departDate?: Date;
    returnDate?: Date;
    flightType?: 'ROUNDTRIP' | 'ONEWAY';
    cabinClass?: string;
    orderBy?: string;
    adults?: number;
    children?: number;
    page?: number;
    numberOfStops?: 'nonstop_flights' | 'maximum_one_stop' | 'all';
    nonstopFlightsOnly?: boolean;
    priceRange?: string; // "min,max"
    airlines?: string;   // "LH,NK"
}

export function useFlights({ fromCode, toCode, departDate, returnDate, flightType = 'ROUNDTRIP', cabinClass, orderBy, adults = 1, children = 0, page = 0, numberOfStops, nonstopFlightsOnly, priceRange, airlines }: UseFlightsParams) {
    const iata = (code?: string) => code ? (code.includes('.') ? code.split('.')[0] : code).toUpperCase().slice(0, 3) : undefined;
    const fromId = iata(fromCode);
    const toId = iata(toCode);

    return useQuery({
        queryKey: queryKeys.flights.list({ fromId, toId, departDate, returnDate, adults, children, page, flightType, cabinClass, orderBy, numberOfStops, nonstopFlightsOnly, priceRange, airlines }),
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
            };

            const cleanParams = Object.fromEntries(
                Object.entries(params).filter(([_, v]) => v !== undefined)
            );

            const data = await apiClient.get<any>(APP_CONSTANTS.API.FLIGHTS, cleanParams);
            return { flights: data.flights || [], searchPath: data.searchPath as string | undefined };
        },
        enabled: Boolean(fromId && toId && departDate && (flightType === 'ONEWAY' || returnDate)),
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

export function useFlightDetail(selectionKey?: string, searchPath?: string) {
    return useQuery({
        queryKey: ['flight-detail', selectionKey, searchPath],
        queryFn: async () => {
            return apiClient.get<any>('/api/flights/detail', { selectionKey, searchPath });
        },
        enabled: Boolean(selectionKey && searchPath),
        refetchOnWindowFocus: false,
        staleTime: 60_000,
    });
}
