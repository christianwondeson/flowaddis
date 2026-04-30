import type { HotelFilters } from '@/types';

/**
 * Merge top-level + filters location fields (same rules as home SearchWidget).
 * When user types a known city without picking from LocationInput, supply dest_id.
 */
export function mergeHotelSearchLocation(
    topQuery: string,
    topDestId: string | undefined,
    topDestType: string | undefined,
    filters?: HotelFilters,
): {
    query: string;
    destId?: string;
    destType?: string;
    filterRest: Omit<HotelFilters, 'query' | 'destId' | 'destType'>;
} {
    const f = filters ?? {};
    // Prefer URL `topQuery` so we never mix a stale filter-bar query with new destId/lat-lng from navigation.
    let query = String(topQuery ?? f.query ?? '').trim() || 'Addis Ababa';
    let destId = topDestId ?? f.destId;
    let destType = topDestType ?? f.destType;
    if (destId === '' || destId == null) destId = undefined;
    if (destType === '' || destType == null) destType = undefined;

    const qLower = query.toLowerCase();
    if (!destId) {
        if (qLower === 'addis ababa' || qLower === 'addis ababa, ethiopia') {
            destId = '-603097';
            destType = destType ?? 'city';
        }
    }

    const { query: _q, destId: _d, destType: _t, ...filterRest } = f;

    return {
        query,
        destId,
        destType,
        filterRest: filterRest as Omit<HotelFilters, 'query' | 'destId' | 'destType'>,
    };
}
