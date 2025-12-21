import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/react-query';

interface UseFlightsParams {
    fromCode?: string;
    toCode?: string;
    departDate?: Date;
    returnDate?: Date;
    adults?: number;
    children?: number;
    page?: number;
}

export function useFlights({ fromCode, toCode, departDate, returnDate, adults = 1, children = 0, page = 0 }: UseFlightsParams) {
    return useQuery({
        queryKey: queryKeys.flights.list({ fromCode, toCode, departDate, returnDate, adults, children, page }),
        queryFn: async () => {
            const params = new URLSearchParams({
                adults: adults.toString(),
                children: children.toString(),
                page: page.toString(),
            });

            if (fromCode) params.append('fromCode', fromCode);
            if (toCode) params.append('toCode', toCode);
            if (departDate) params.append('departDate', departDate.toISOString().split('T')[0]);
            if (returnDate) params.append('returnDate', returnDate.toISOString().split('T')[0]);

            const response = await fetch(`/api/flights/search?${params.toString()}`);
            if (!response.ok) throw new Error('Failed to fetch flights');

            const data = await response.json();
            return data.flights || []; // API returns { flights: [...] }
        },
        // Enable even if params are missing, as API has defaults
        enabled: true, 
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
