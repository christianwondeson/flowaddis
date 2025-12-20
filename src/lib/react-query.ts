import { QueryClient, DefaultOptions } from '@tanstack/react-query';

const queryConfig: DefaultOptions = {
    queries: {
        // Stale time: Data is considered fresh for 5 minutes
        staleTime: 1000 * 60 * 5,
        // Cache time: Unused data stays in cache for 10 minutes
        gcTime: 1000 * 60 * 10,
        // Retry failed requests 3 times with exponential backoff
        retry: 3,
        retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
        // Refetch on window focus (can be disabled for better UX)
        refetchOnWindowFocus: false,
        // Refetch on reconnect
        refetchOnReconnect: true,
        // Refetch on mount if data is stale
        refetchOnMount: true,
    },
    mutations: {
        // Retry mutations once
        retry: 1,
    },
};

export const queryClient = new QueryClient({
    defaultOptions: queryConfig,
});

// Query keys factory for better organization
export const queryKeys = {
    hotels: {
        all: ['hotels'] as const,
        list: (filters: any) => [...queryKeys.hotels.all, 'list', filters] as const,
        detail: (id: string) => [...queryKeys.hotels.all, 'detail', id] as const,
    },
    flights: {
        all: ['flights'] as const,
        list: (filters: any) => [...queryKeys.flights.all, 'list', filters] as const,
        detail: (id: string) => [...queryKeys.flights.all, 'detail', id] as const,
    },
    user: {
        all: ['user'] as const,
        profile: () => [...queryKeys.user.all, 'profile'] as const,
        trips: () => [...queryKeys.user.all, 'trips'] as const,
    },
} as const;
