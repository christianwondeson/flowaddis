import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/react-query';

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
    // Optional future filters
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
            const params = new URLSearchParams({
                adults: adults.toString(),
                children: children.toString(),
                page: page.toString(),
                flightType: flightType || 'ROUNDTRIP',
                cabinClass: cabinClass || 'ECONOMY',
                orderBy: orderBy || 'BEST',
            });

            if (fromId) params.append('fromId', fromId);
            if (toId) params.append('toId', toId);
            if (departDate) params.append('departureDate', departDate.toISOString().split('T')[0]);
            if (returnDate) params.append('returnDate', returnDate.toISOString().split('T')[0]);
            if (numberOfStops) params.append('numberOfStops', numberOfStops);
            if (nonstopFlightsOnly != null) params.append('nonstopFlightsOnly', String(nonstopFlightsOnly));
            if (priceRange) params.append('priceRange', priceRange);
            if (airlines) params.append('airlines', airlines);

            const response = await fetch(`/api/flights/search?${params.toString()}`);
            if (!response.ok) throw new Error('Failed to fetch flights');

            const data = await response.json();
            return { flights: data.flights || [], searchPath: data.searchPath as string | undefined };
        },
        // Only run when we have a from/to and required dates
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
            const response = await fetch(`/api/flights/locations?name=${encodeURIComponent(query)}`);
            if (!response.ok) throw new Error('Failed to fetch locations');
            return response.json();
        },
        enabled: query.length >= 3,
    });
}

export function useFlightDetail(selectionKey?: string, searchPath?: string) {
    return useQuery({
        queryKey: ['flight-detail', selectionKey, searchPath],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (selectionKey) params.set('selectionKey', selectionKey);
            if (searchPath) params.set('searchPath', searchPath);
            const res = await fetch(`/api/flights/detail?${params.toString()}`);
            if (!res.ok) throw new Error('Failed to fetch flight detail');
            const data = await res.json();
            return data.detail;
        },
        enabled: Boolean(selectionKey && searchPath),
        refetchOnWindowFocus: false,
        staleTime: 60_000,
    });
}
