/**
 * Downsize Booking.com / bstatic CDN URLs for list cards and thumbnails.
 * RapidAPI often returns max1024 / max1280 / max1440 originals which are
 * expensive when `images.unoptimized` is on (Firebase Hosting).
 */
export function optimizeHotelImageUrl(
  url: string | null | undefined,
  size: 'thumb' | 'card' | 'hero' = 'card',
): string {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (!trimmed) return '';

  // Unsplash already accepts fit/crop query params — clamp width.
  if (trimmed.includes('images.unsplash.com')) {
    try {
      const u = new URL(trimmed);
      const w = size === 'thumb' ? '400' : size === 'card' ? '800' : '1600';
      u.searchParams.set('auto', 'format');
      u.searchParams.set('fit', 'crop');
      u.searchParams.set('w', w);
      u.searchParams.set('q', '75');
      return u.toString();
    } catch {
      return trimmed;
    }
  }

  // Booking.com CDN size segments in the path.
  if (trimmed.includes('bstatic.com') || trimmed.includes('booking.com')) {
    const target =
      size === 'thumb'
        ? 'square200'
        : size === 'card'
          ? 'square600'
          : 'max1024x768';
    return trimmed
      .replace(
        /\/(max\d+x\d+|max\d+|square\d+|max_photo)\//i,
        `/${target}/`,
      )
      .replace(
        /_(max\d+x\d+|max\d+|square\d+)\./i,
        `_${target}.`,
      );
  }

  return trimmed;
}

/** Prefer a list-sized photo from a RapidAPI hotel payload. */
export function pickListHotelPhoto(item: Record<string, unknown>): string {
  const candidates = [
    item.url_square600,
    item.photoMainUrl,
    item.main_photo_url,
    Array.isArray(item.photo_urls) ? item.photo_urls[0] : null,
    Array.isArray(item.photoUrls) ? item.photoUrls[0] : null,
    item.max_photo_url,
    item.max_1440_photo_url,
    item.url_1440,
  ];
  for (const c of candidates) {
    if (typeof c === 'string' && c.trim()) {
      return optimizeHotelImageUrl(c, 'card');
    }
  }
  return optimizeHotelImageUrl(
    'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80',
    'card',
  );
}
