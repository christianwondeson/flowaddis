/**
 * Stay add-ons priced on top of room nights (meal plan, shuttle, ride, etc.).
 * Hotel can override via `hotel.media.extras_pricing`.
 */

export type MealPlanBillable = 'BB' | 'HB' | 'FB' | 'AI';

export type ExtrasPricingConfig = {
    /** Per guest per night supplements (EP = 0). */
    meal_plan_per_guest_night: Record<MealPlanBillable, number>;
    early_check_in: number;
    late_check_out: number;
    /** Flat fee; null = use cheapest active hotel shuttle. */
    airport_shuttle: number | null;
    ride_hailing: number;
    car_rental: number;
};

export type HotelShuttlePriceRow = {
    price?: string | number | null;
    status?: string | null;
    name?: string | null;
    from?: string | null;
    to?: string | null;
    currency?: string | null;
};

export type StayExtrasSelection = {
    mealPlan?: string | null;
    earlyCheckIn?: boolean;
    lateCheckOut?: boolean;
    dayUse?: boolean;
    wantShuttle?: boolean;
    wantRide?: boolean;
    wantCar?: boolean;
    nights: number;
    guests: number;
};

export type StayExtraLine = {
    code: string;
    label: string;
    amount: number;
    detail?: string;
};

export type StayExtrasQuote = {
    lines: StayExtraLine[];
    total: number;
    currency: string;
};

export const DEFAULT_EXTRAS_PRICING: ExtrasPricingConfig = {
    meal_plan_per_guest_night: {
        BB: 450,
        HB: 900,
        FB: 1350,
        AI: 2000,
    },
    early_check_in: 500,
    late_check_out: 500,
    airport_shuttle: null,
    ride_hailing: 350,
    car_rental: 500,
};

function num(v: unknown, fallback: number): number {
    const n = Number(v);
    return Number.isFinite(n) && n >= 0 ? n : fallback;
}

export function resolveExtrasPricing(
    media: Record<string, unknown> | null | undefined,
): ExtrasPricingConfig {
    const raw = (media?.extras_pricing || media?.extrasPricing || {}) as Record<
        string,
        unknown
    >;
    const mealRaw = (raw.meal_plan_per_guest_night ||
        raw.mealPlanPerGuestNight ||
        {}) as Record<string, unknown>;
    const d = DEFAULT_EXTRAS_PRICING;
    return {
        meal_plan_per_guest_night: {
            BB: num(mealRaw.BB, d.meal_plan_per_guest_night.BB),
            HB: num(mealRaw.HB, d.meal_plan_per_guest_night.HB),
            FB: num(mealRaw.FB, d.meal_plan_per_guest_night.FB),
            AI: num(mealRaw.AI, d.meal_plan_per_guest_night.AI),
        },
        early_check_in: num(raw.early_check_in ?? raw.earlyCheckIn, d.early_check_in),
        late_check_out: num(raw.late_check_out ?? raw.lateCheckOut, d.late_check_out),
        airport_shuttle:
            raw.airport_shuttle === null || raw.airportShuttle === null
                ? null
                : raw.airport_shuttle != null || raw.airportShuttle != null
                  ? num(raw.airport_shuttle ?? raw.airportShuttle, 0)
                  : d.airport_shuttle,
        ride_hailing: num(raw.ride_hailing ?? raw.rideHailing, d.ride_hailing),
        car_rental: num(raw.car_rental ?? raw.carRental, d.car_rental),
    };
}

export function cheapestActiveShuttle(
    shuttles: HotelShuttlePriceRow[] | null | undefined,
): { price: number; label: string } | null {
    if (!Array.isArray(shuttles) || shuttles.length === 0) return null;
    let best: { price: number; label: string } | null = null;
    for (const s of shuttles) {
        if (String(s.status || 'active').toLowerCase() !== 'active') continue;
        const price = Number(s.price);
        if (!Number.isFinite(price) || price < 0) continue;
        const label =
            [s.name, s.from && s.to ? `${s.from} → ${s.to}` : null]
                .filter(Boolean)
                .join(' · ') || 'Airport shuttle';
        if (!best || price < best.price) best = { price, label };
    }
    return best;
}

export function computeStayExtras(params: {
    media?: Record<string, unknown> | null;
    selection: StayExtrasSelection;
    currency?: string;
}): StayExtrasQuote {
    const pricing = resolveExtrasPricing(params.media);
    const nights = Math.max(1, Math.floor(params.selection.nights || 1));
    const guests = Math.max(1, Math.floor(params.selection.guests || 1));
    const meal = String(params.selection.mealPlan || 'EP').toUpperCase();
    const lines: StayExtraLine[] = [];

    if (meal === 'BB' || meal === 'HB' || meal === 'FB' || meal === 'AI') {
        const unit = pricing.meal_plan_per_guest_night[meal];
        const amount = Math.round(unit * guests * nights * 100) / 100;
        if (amount > 0) {
            lines.push({
                code: `meal_${meal}`,
                label: `Meal plan (${meal})`,
                amount,
                detail: `${unit} × ${guests} guest${guests === 1 ? '' : 's'} × ${nights} night${nights === 1 ? '' : 's'}`,
            });
        }
    }

    if (!params.selection.dayUse && params.selection.earlyCheckIn && pricing.early_check_in > 0) {
        lines.push({
            code: 'early_check_in',
            label: 'Early check-in',
            amount: pricing.early_check_in,
        });
    }
    if (!params.selection.dayUse && params.selection.lateCheckOut && pricing.late_check_out > 0) {
        lines.push({
            code: 'late_check_out',
            label: 'Late check-out',
            amount: pricing.late_check_out,
        });
    }

    if (params.selection.wantShuttle) {
        const shuttles = (params.media?.shuttles || []) as HotelShuttlePriceRow[];
        const fromFleet = cheapestActiveShuttle(shuttles);
        const amount =
            pricing.airport_shuttle != null
                ? pricing.airport_shuttle
                : fromFleet?.price ?? 800;
        if (amount > 0) {
            lines.push({
                code: 'airport_shuttle',
                label: 'Airport shuttle',
                amount,
                detail: fromFleet?.label,
            });
        }
    }

    if (params.selection.wantRide && pricing.ride_hailing > 0) {
        lines.push({
            code: 'ride_hailing',
            label: 'Ride hailing',
            amount: pricing.ride_hailing,
            detail: 'Coordination / booking fee',
        });
    }

    if (params.selection.wantCar && pricing.car_rental > 0) {
        lines.push({
            code: 'car_rental',
            label: 'Car rental',
            amount: pricing.car_rental,
            detail: 'Coordination / booking fee',
        });
    }

    const total =
        Math.round(lines.reduce((s, l) => s + l.amount, 0) * 100) / 100;

    return {
        lines,
        total,
        currency: (params.currency || 'ETB').toUpperCase(),
    };
}
