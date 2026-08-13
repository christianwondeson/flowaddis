/** First usable photo URL from Nest hotel/room `media` JSON. */
export function getHotelCoverUrl(media: unknown): string | null {
    if (!media || typeof media !== 'object') return null;
    const photos = (media as { photos?: unknown }).photos;
    if (!Array.isArray(photos) || photos.length === 0) return null;
    const first = photos[0];
    if (typeof first === 'string' && first.trim()) return first.trim();
    if (first && typeof first === 'object') {
        const url = (first as { url?: unknown }).url;
        if (typeof url === 'string' && url.trim()) return url.trim();
    }
    return null;
}

/** Optional brand / chain label stored on hotel amenities or media. */
export function getHotelBrandLabel(
    hotel: {
        name?: string | null;
        amenities?: Record<string, unknown> | null;
        media?: Record<string, unknown> | null;
    } | null | undefined,
): string | null {
    if (!hotel) return null;
    const fromAmenities = hotel.amenities?.brand ?? hotel.amenities?.brand_name;
    if (typeof fromAmenities === 'string' && fromAmenities.trim()) {
        return fromAmenities.trim();
    }
    const fromMedia = hotel.media?.brand ?? hotel.media?.brand_name;
    if (typeof fromMedia === 'string' && fromMedia.trim()) {
        return fromMedia.trim();
    }
    return null;
}
