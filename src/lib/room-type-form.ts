/** Booking.com–style room details stored on Nest columns + amenities JSON. */

export type BedType =
    | 'single'
    | 'twin'
    | 'double'
    | 'queen'
    | 'king'
    | 'sofa_bed'
    | 'bunk'
    | 'futon';

export type BedOption = { type: BedType; count: number };

export type RoomCategory =
    | 'single'
    | 'twin'
    | 'double'
    | 'triple'
    | 'family'
    | 'suite'
    | 'studio'
    | 'dorm'
    | 'other';

export const BED_TYPE_LABELS: Record<BedType, string> = {
    single: 'Single bed',
    twin: 'Twin bed',
    double: 'Double bed',
    queen: 'Queen bed',
    king: 'King bed',
    sofa_bed: 'Sofa bed',
    bunk: 'Bunk bed',
    futon: 'Futon',
};

export const ROOM_CATEGORY_LABELS: Record<RoomCategory, string> = {
    single: 'Single',
    twin: 'Twin',
    double: 'Double',
    triple: 'Triple',
    family: 'Family',
    suite: 'Suite',
    studio: 'Studio',
    dorm: 'Dorm / shared',
    other: 'Other',
};

export const ROOM_AMENITY_OPTIONS = [
    { key: 'wifi', label: 'Wi‑Fi' },
    { key: 'ac', label: 'Air conditioning' },
    { key: 'heating', label: 'Heating' },
    { key: 'tv', label: 'TV' },
    { key: 'balcony', label: 'Balcony' },
    { key: 'city_view', label: 'City view' },
    { key: 'garden_view', label: 'Garden view' },
    { key: 'private_bathroom', label: 'Private bathroom' },
    { key: 'bathtub', label: 'Bathtub' },
    { key: 'shower', label: 'Shower' },
    { key: 'minibar', label: 'Minibar' },
    { key: 'safe', label: 'Safe' },
    { key: 'desk', label: 'Desk' },
    { key: 'kettle', label: 'Electric kettle' },
    { key: 'coffee_maker', label: 'Coffee maker' },
    { key: 'wheelchair', label: 'Wheelchair accessible' },
] as const;

export type AdvancedRoomFormState = {
    name: string;
    category: RoomCategory;
    description: string;
    smoking: 'non_smoking' | 'smoking' | 'both';
    size_sqm: string;
    max_occupancy: string;
    max_adults: string;
    max_children: string;
    max_infants: string;
    exclude_infants: boolean;
    extra_bed: boolean;
    crib: boolean;
    beds: BedOption[];
    total_inventory: string;
    base_price: string;
    currency: string;
    rate_plan_name: string;
    free_cancellation_hours: string;
    refundable: boolean;
    pay_at_property: boolean;
    prepay: boolean;
    amenityFlags: Record<string, boolean>;
};

export const emptyAdvancedRoomForm = (): AdvancedRoomFormState => ({
    name: '',
    category: 'double',
    description: '',
    smoking: 'non_smoking',
    size_sqm: '',
    max_occupancy: '2',
    max_adults: '2',
    max_children: '1',
    max_infants: '1',
    exclude_infants: true,
    extra_bed: false,
    crib: true,
    beds: [{ type: 'double', count: 1 }],
    total_inventory: '1',
    base_price: '',
    currency: 'ETB',
    rate_plan_name: 'Standard rate',
    free_cancellation_hours: '24',
    refundable: true,
    pay_at_property: true,
    prepay: true,
    amenityFlags: Object.fromEntries(
        ROOM_AMENITY_OPTIONS.map((a) => [a.key, false]),
    ),
});

export function formatBedConfiguration(beds: BedOption[]): string {
    return beds
        .filter((b) => b.count > 0)
        .map((b) => `${b.count}× ${BED_TYPE_LABELS[b.type]}`)
        .join(', ');
}

export function sleepingSpots(beds: BedOption[]): number {
    return beds.reduce((sum, b) => {
        // Bunk beds: each unit sleeps 2
        if (b.type === 'bunk') return sum + b.count * 2;
        return sum + b.count;
    }, 0);
}

export function buildRoomAmenitiesPayload(
    form: AdvancedRoomFormState,
): Record<string, unknown> {
    const flags: Record<string, boolean> = {};
    for (const opt of ROOM_AMENITY_OPTIONS) {
        if (form.amenityFlags[opt.key]) flags[opt.key] = true;
    }
    return {
        ...flags,
        category: form.category,
        smoking: form.smoking,
        size_sqm: form.size_sqm ? Number(form.size_sqm) : null,
        occupancy: {
            max_guests: Number(form.max_occupancy) || 2,
            max_adults: Number(form.max_adults) || 2,
            max_children: Number(form.max_children) || 0,
            max_infants: Number(form.max_infants) || 0,
            exclude_infants: form.exclude_infants,
        },
        family: {
            extra_bed: form.extra_bed,
            crib: form.crib,
        },
        beds: form.beds.filter((b) => b.count > 0),
    };
}

export function buildCreateRoomBody(
    form: AdvancedRoomFormState,
    photos?: Array<Record<string, unknown>>,
) {
    const maxOcc = Number(form.max_occupancy) || 2;
    return {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        max_occupancy: maxOcc,
        bed_configuration: formatBedConfiguration(form.beds) || undefined,
        total_inventory: Number(form.total_inventory) || 1,
        amenities: buildRoomAmenitiesPayload(form),
        media: photos?.length ? { photos } : undefined,
        is_active: true,
    };
}

export function buildRatePlanBody(form: AdvancedRoomFormState) {
    const timings: string[] = [];
    if (form.prepay) timings.push('PREPAY');
    if (form.pay_at_property) timings.push('PAY_AT_PROPERTY');
    if (!timings.length) timings.push('PREPAY');

    return {
        name: form.rate_plan_name.trim() || 'Standard rate',
        payment_timings: timings,
        cancellation_policy: {
            refundable: form.refundable,
            free_cancellation_hours: Number(form.free_cancellation_hours) || 24,
        },
        currency: (form.currency || 'ETB').toUpperCase(),
        base_price: form.base_price ? Number(form.base_price) : undefined,
    };
}
