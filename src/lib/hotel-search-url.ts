import { DEFAULT_HOTEL_DESTINATION_QUERY } from '@/lib/hotel-search-location';

/** Params only used for map “focus” mode — drop when returning to the full hotel list. */
const MAP_FOCUS_PARAM_KEYS = ['highlightId', 'lat', 'lng', 'fromDetail'] as const;

export function destinationQueryFromUrlParams(sp: URLSearchParams): string {
    const q = sp.get('query')?.trim();
    if (q) return q;
    return DEFAULT_HOTEL_DESTINATION_QUERY;
}

/** First segment of a comma-separated address is usually the city (e.g. "Dubai, UAE" → "Dubai"). */
export function deriveDestinationQueryFromHotelLocation(location?: string | null): string | null {
    if (!location?.trim()) return null;
    const parts = location.split(',').map((s) => s.trim()).filter(Boolean);
    return parts[0] || null;
}

export type HotelDetailMapContext = {
    searchQuery?: string | null;
    searchDestId?: string | null;
    searchDestType?: string | null;
    checkIn?: string;
    checkOut?: string;
    adults?: number;
    children?: number;
    rooms?: number;
};

export type HotelDetailMapHotel = {
    id?: string;
    name?: string;
    location?: string;
    coordinates?: { lat?: number; lng?: number } | null;
};

/**
 * Map view for a property: destination = list search (or inferred city), property name = exact hotel name.
 */
export function buildHotelDetailMapUrl(ctx: HotelDetailMapContext, hotel: HotelDetailMapHotel): string {
    const destination =
        ctx.searchQuery?.trim() ||
        deriveDestinationQueryFromHotelLocation(hotel.location) ||
        DEFAULT_HOTEL_DESTINATION_QUERY;

    const p = new URLSearchParams();
    p.set('query', destination);
    if (ctx.searchDestId) p.set('destId', String(ctx.searchDestId));
    if (ctx.searchDestType) p.set('destType', String(ctx.searchDestType));
    if (hotel.name?.trim()) p.set('hotelName', hotel.name.trim());
    if (hotel.id) p.set('highlightId', String(hotel.id));
    if (hotel.coordinates?.lat != null && Number.isFinite(hotel.coordinates.lat)) {
        p.set('lat', String(hotel.coordinates.lat));
    }
    if (hotel.coordinates?.lng != null && Number.isFinite(hotel.coordinates.lng)) {
        p.set('lng', String(hotel.coordinates.lng));
    }
    p.set('fromDetail', '1');
    if (ctx.checkIn) p.set('checkIn', ctx.checkIn);
    if (ctx.checkOut) p.set('checkOut', ctx.checkOut);
    if (ctx.adults != null) p.set('adults', String(ctx.adults));
    if (ctx.children != null) p.set('children', String(ctx.children));
    if (ctx.rooms != null) p.set('rooms', String(ctx.rooms));
    return `/hotels/map?${p.toString()}`;
}

/**
 * After closing the map: keep destination & dates, clear property filter and pin-only params
 * so the list shows all hotels in that area again.
 */
export function buildHotelsListUrlAfterClosingMap(current: URLSearchParams): string {
    const n = new URLSearchParams(current.toString());
    for (const k of MAP_FOCUS_PARAM_KEYS) n.delete(k);
    n.delete('hotelName');
    n.delete('pickLocation');
    return `/hotels?${n.toString()}`;
}
