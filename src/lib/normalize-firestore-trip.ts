import type { Trip, TripItem } from '@/store/trip-store';

/**
 * Migrates legacy Firestore `trips` shapes to the current Trip type (safe for older docs).
 */
export function normalizeFirestoreTrip(raw: Record<string, unknown>, id: string): Trip {
    const itemsRaw = raw.items;
    const items: TripItem[] = Array.isArray(itemsRaw)
        ? itemsRaw.map((it, i) => {
              const o = it as Record<string, unknown>;
              const price = typeof o.price === 'number' && Number.isFinite(o.price) ? o.price : 0;
              const type =
                  o.type === 'flight' ||
                  o.type === 'hotel' ||
                  o.type === 'shuttle' ||
                  o.type === 'conference'
                      ? o.type
                      : 'hotel';
              return {
                  id: typeof o.id === 'string' ? o.id : `legacy-${i}`,
                  type,
                  details: o.details != null && typeof o.details === 'object' ? o.details : {},
                  price,
              };
          })
        : [];

    const totalRaw = raw.totalAmount;
    const totalAmount =
        typeof totalRaw === 'number' && Number.isFinite(totalRaw)
            ? totalRaw
            : items.reduce((s, x) => s + x.price, 0);

    const statusRaw = raw.status;
    const status =
        statusRaw === 'pending' || statusRaw === 'confirmed' || statusRaw === 'cancelled'
            ? statusRaw
            : 'confirmed';

    const dateRaw = raw.date;
    const date =
        typeof dateRaw === 'string' && dateRaw.length > 0 ? dateRaw : new Date(0).toISOString();

    const userId = typeof raw.userId === 'string' ? raw.userId : '';

    return {
        id,
        userId,
        items,
        totalAmount,
        status,
        date,
    };
}
