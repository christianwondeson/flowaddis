import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/react-query';

interface UseFlightsParams {
    fromCode?: string;
    toCode?: string;
    departDate?: Date;
    returnDate?: Date;
    adults?: number;
    page?: number;
}

export function useFlights({ fromCode, toCode, departDate, returnDate, adults = 1, page = 0 }: UseFlightsParams) {
    return useQuery({
        queryKey: queryKeys.flights.list({ fromCode, toCode, departDate, returnDate, adults, page }),
        queryFn: async () => {
            if (!fromCode || !toCode || !departDate) return [];

            const params = new URLSearchParams({
                fromCode,
                toCode,
                departDate: departDate.toISOString().split('T')[0],
                adults: adults.toString(),
                page: page.toString(),
            });

            if (returnDate) params.append('returnDate', returnDate.toISOString().split('T')[0]);

            const response = await fetch(`/api/flights/search?${params.toString()}`);
            if (!response.ok) throw new Error('Failed to fetch flights');

            const data = await response.json();
            return data.data?.flights || [];
        },
        enabled: !!fromCode && !!toCode && !!departDate,
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
