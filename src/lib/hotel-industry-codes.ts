/**
 * Hotel industry codes used on guest checkout + hotel-admin reservation detail.
 * Keep labels short; full descriptions are for operator education in the UI.
 */

export type MealPlanCode = 'EP' | 'BB' | 'HB' | 'FB' | 'AI';
export type StayCode = 'RO' | 'DU' | 'ECI' | 'LCO' | 'OVN' | 'EXT';
export type RateSegmentCode =
    | 'RACK'
    | 'CORP'
    | 'GOV'
    | 'GRP'
    | 'PROMO'
    | 'ADV'
    | 'LOS'
    | 'WKD'
    | 'WKY'
    | 'MTH'
    | 'COMP'
    | 'HU';
export type FlexibilityCode = 'NRFN' | 'FLEX';

export type MealPlanOption = {
    code: MealPlanCode;
    label: string;
    description: string;
};

export const MEAL_PLAN_OPTIONS: MealPlanOption[] = [
    {
        code: 'EP',
        label: 'EP  European Plan',
        description: 'Room only, no meals',
    },
    {
        code: 'BB',
        label: 'BB  Bed & Breakfast',
        description: 'Room + breakfast',
    },
    {
        code: 'HB',
        label: 'HB  Half Board (MAP)',
        description: 'Room + breakfast + one meal (usually dinner)',
    },
    {
        code: 'FB',
        label: 'FB  Full Board',
        description: 'Room + breakfast + lunch + dinner',
    },
    {
        code: 'AI',
        label: 'AI  All Inclusive',
        description: 'Room + all meals + drinks/activities',
    },
];

export const STAY_CODE_META: Record<
    StayCode,
    { label: string; description: string }
> = {
    RO: { label: 'RO', description: 'Room only (no overnight package)' },
    DU: { label: 'DU  Day Use', description: 'Daytime hours only, no overnight' },
    ECI: { label: 'ECI  Early Check-In', description: 'Arrival before standard check-in' },
    LCO: { label: 'LCO  Late Check-Out', description: 'Departure after standard check-out' },
    OVN: { label: 'OVN  Overnight', description: 'Standard overnight stay' },
    EXT: { label: 'EXT  Extra Night', description: 'Extension beyond original stay' },
};

export const RATE_SEGMENT_META: Record<
    RateSegmentCode,
    { label: string; description: string }
> = {
    RACK: { label: 'RACK', description: 'Standard published / walk-in rate' },
    CORP: { label: 'CORP', description: 'Negotiated corporate rate' },
    GOV: { label: 'GOV', description: 'Government per diem rate' },
    GRP: { label: 'GRP', description: 'Group booking rate' },
    PROMO: { label: 'PROMO', description: 'Promotional / discounted rate' },
    ADV: { label: 'ADV / AP', description: 'Advance purchase (often non-refundable)' },
    LOS: { label: 'LOS', description: 'Length-of-stay rate' },
    WKD: { label: 'WKD', description: 'Weekend rate' },
    WKY: { label: 'WKY', description: 'Weekly rate' },
    MTH: { label: 'MTH', description: 'Monthly rate' },
    COMP: { label: 'COMP', description: 'Complimentary  no charge' },
    HU: { label: 'HU', description: 'House use  not sold' },
};

export const FLEXIBILITY_META: Record<
    FlexibilityCode,
    { label: string; description: string }
> = {
    NRFN: {
        label: 'NR / NRFN',
        description: 'Non-refundable',
    },
    FLEX: {
        label: 'FLEX / FR',
        description: 'Free cancellation / flexible',
    },
};

const MEAL_ALIASES: Record<string, MealPlanCode> = {
    ep: 'EP',
    european: 'EP',
    european_plan: 'EP',
    room_only: 'EP',
    roomonly: 'EP',
    ro: 'EP',
    bb: 'BB',
    b_and_b: 'BB',
    'b&b': 'BB',
    breakfast: 'BB',
    bed_and_breakfast: 'BB',
    hb: 'HB',
    half_board: 'HB',
    halfboard: 'HB',
    map: 'HB',
    modified_american_plan: 'HB',
    fb: 'FB',
    full_board: 'FB',
    fullboard: 'FB',
    ai: 'AI',
    all_inclusive: 'AI',
    allinclusive: 'AI',
};

export function normalizeMealPlan(input?: string | null): MealPlanCode {
    if (!input) return 'EP';
    const key = String(input)
        .trim()
        .toLowerCase()
        .replace(/[\s-]+/g, '_');
    if (MEAL_ALIASES[key]) return MEAL_ALIASES[key];
    const upper = String(input).trim().toUpperCase();
    if (['EP', 'BB', 'HB', 'FB', 'AI'].includes(upper)) {
        return upper as MealPlanCode;
    }
    return 'EP';
}

export function mealPlanLabel(code?: string | null): string {
    const c = normalizeMealPlan(code);
    const opt = MEAL_PLAN_OPTIONS.find((o) => o.code === c);
    return opt ? `${opt.code} · ${opt.description}` : c;
}

export function rateSegmentFromBookingType(
    bookingType?: string | null,
): RateSegmentCode {
    switch (String(bookingType || '').toLowerCase()) {
        case 'group':
            return 'GRP';
        case 'corporate':
            return 'CORP';
        case 'government':
            return 'GOV';
        default:
            return 'RACK';
    }
}

export function flexibilityFromRefundable(
    refundable?: boolean | null,
): FlexibilityCode {
    return refundable === false ? 'NRFN' : 'FLEX';
}

export function buildStayCodes(opts: {
    dayUse?: boolean;
    earlyCheckIn?: boolean;
    lateCheckOut?: boolean;
    extraNight?: boolean;
}): StayCode[] {
    if (opts.dayUse) return ['DU'];
    const codes: StayCode[] = ['OVN'];
    if (opts.earlyCheckIn) codes.push('ECI');
    if (opts.lateCheckOut) codes.push('LCO');
    if (opts.extraNight) codes.push('EXT');
    return codes;
}

export function formatCodeList(
    codes: string[] | undefined | null,
    meta: Record<string, { label: string; description: string }>,
): Array<{ code: string; label: string; description: string }> {
    if (!Array.isArray(codes) || codes.length === 0) return [];
    return codes.map((code) => {
        const m = meta[code];
        return m
            ? { code, label: m.label, description: m.description }
            : { code, label: code, description: '' };
    });
}

/** Snapshot fields persisted on booking.external_snapshot for hotel admin. */
export type HotelBookingIndustrySnapshot = {
    meal_plan: MealPlanCode;
    meal_plan_label: string;
    stay_codes: StayCode[];
    rate_segment: RateSegmentCode;
    flexibility: FlexibilityCode;
    booking_type?: string;
    special_requests?: string;
    early_check_in?: boolean;
    late_check_out?: boolean;
    day_use?: boolean;
};
