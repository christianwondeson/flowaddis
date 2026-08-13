/** Hotel industry promotions stored on hotel.media.promotions */

export type HotelPromotionType =
    | 'early_bird'
    | 'last_minute'
    | 'promo_code'
    | 'long_stay';

export type HotelPromotion = {
    id: string;
    type: HotelPromotionType;
    name: string;
    /** Percent off the stay total (1–90). */
    discount_percent: number;
    active: boolean;
    /** For promo_code type  guest enters this at checkout. */
    code?: string;
    /**
     * Early bird: guest must book at least N days before check-in.
     * Last minute: guest must book within N days of check-in.
     */
    book_window_days?: number;
    /** Long stay: minimum nights. */
    min_nights?: number;
    valid_from?: string | null;
    valid_to?: string | null;
    description?: string;
};

export const PROMOTION_TYPE_LABELS: Record<HotelPromotionType, string> = {
    early_bird: 'Early bird',
    last_minute: 'Last minute (late bird)',
    promo_code: 'Promo code',
    long_stay: 'Long stay',
};

export function normalizePromotions(raw: unknown): HotelPromotion[] {
    if (!Array.isArray(raw)) return [];
    return raw
        .filter((p) => p && typeof p === 'object')
        .map((p) => {
            const o = p as Record<string, unknown>;
            const type = String(o.type || 'promo_code') as HotelPromotionType;
            return {
                id: String(o.id || cryptoRandom()),
                type: (
                    ['early_bird', 'last_minute', 'promo_code', 'long_stay'] as const
                ).includes(type as HotelPromotionType)
                    ? type
                    : 'promo_code',
                name: String(o.name || 'Promotion'),
                discount_percent: Math.min(
                    90,
                    Math.max(1, Number(o.discount_percent) || 1),
                ),
                active: o.active !== false,
                code:
                    typeof o.code === 'string'
                        ? o.code.trim().toUpperCase()
                        : undefined,
                book_window_days:
                    o.book_window_days != null
                        ? Number(o.book_window_days)
                        : undefined,
                min_nights:
                    o.min_nights != null ? Number(o.min_nights) : undefined,
                valid_from:
                    typeof o.valid_from === 'string' ? o.valid_from : null,
                valid_to: typeof o.valid_to === 'string' ? o.valid_to : null,
                description:
                    typeof o.description === 'string' ? o.description : undefined,
            };
        });
}

function cryptoRandom() {
    try {
        return crypto.randomUUID();
    } catch {
        return `promo_${Date.now()}`;
    }
}

function nightsBetween(checkIn: string, checkOut: string): number {
    const a = new Date(`${checkIn}T12:00:00`).getTime();
    const b = new Date(`${checkOut}T12:00:00`).getTime();
    if (Number.isNaN(a) || Number.isNaN(b) || b <= a) return 0;
    return Math.round((b - a) / 86400000);
}

function daysUntil(checkIn: string): number {
    const a = new Date();
    a.setHours(0, 0, 0, 0);
    const b = new Date(`${checkIn}T12:00:00`);
    b.setHours(0, 0, 0, 0);
    return Math.round((b.getTime() - a.getTime()) / 86400000);
}

function inValidityWindow(p: HotelPromotion, todayIso: string): boolean {
    if (p.valid_from && todayIso < p.valid_from) return false;
    if (p.valid_to && todayIso > p.valid_to) return false;
    return true;
}

/**
 * Pick best applicable automatic promo + optional promo code.
 * Returns percent off (0 if none).
 */
export function resolveHotelPromotionDiscount(params: {
    promotions: HotelPromotion[];
    checkIn?: string;
    checkOut?: string;
    promoCode?: string;
}): {
    percent: number;
    applied: HotelPromotion | null;
    reason?: string;
} {
    const { promotions, checkIn, checkOut, promoCode } = params;
    const today = new Date().toISOString().slice(0, 10);
    const active = promotions.filter(
        (p) => p.active && inValidityWindow(p, today),
    );
    if (!active.length) return { percent: 0, applied: null };

    const nights =
        checkIn && checkOut ? nightsBetween(checkIn, checkOut) : 0;
    const lead = checkIn ? daysUntil(checkIn) : null;

    let best: HotelPromotion | null = null;

    const code = promoCode?.trim().toUpperCase();
    if (code) {
        const match = active.find(
            (p) =>
                p.type === 'promo_code' &&
                p.code &&
                p.code.toUpperCase() === code,
        );
        if (match) {
            return { percent: match.discount_percent, applied: match };
        }
        return {
            percent: 0,
            applied: null,
            reason: 'Promo code not valid for this hotel',
        };
    }

    for (const p of active) {
        if (p.type === 'promo_code') continue;
        if (p.type === 'early_bird') {
            const need = p.book_window_days ?? 14;
            if (lead == null || lead < need) continue;
        }
        if (p.type === 'last_minute') {
            const within = p.book_window_days ?? 3;
            if (lead == null || lead < 0 || lead > within) continue;
        }
        if (p.type === 'long_stay') {
            const min = p.min_nights ?? 3;
            if (nights < min) continue;
        }
        if (!best || p.discount_percent > best.discount_percent) {
            best = p;
        }
    }

    return best
        ? { percent: best.discount_percent, applied: best }
        : { percent: 0, applied: null };
}
