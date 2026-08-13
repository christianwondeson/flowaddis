/** Single catalog for Hotel Admin facilities + guest Direct detail grouping. */

export const HOTEL_AMENITY_LABELS: Record<string, string> = {
    wifi: 'Free Wi‑Fi',
    parking: 'Parking',
    ev_charging: 'EV charging',
    ac: 'Air conditioning',
    heating: 'Heating',
    elevator: 'Elevator',
    breakfast: 'Breakfast available',
    twenty_four_reception: '24-hour front desk',
    pool: 'Swimming pool',
    indoor_pool: 'Indoor pool',
    gym: 'Fitness center',
    spa: 'Spa',
    sauna: 'Sauna',
    hot_tub: 'Hot tub / jacuzzi',
    restaurant: 'Restaurant',
    bar: 'Bar',
    room_service: 'Room service',
    coffee_shop: 'Coffee shop',
    minibar: 'Minibar',
    airport_shuttle: 'Airport shuttle',
    laundry: 'Laundry',
    dry_cleaning: 'Dry cleaning',
    conference: 'Meeting rooms',
    business_center: 'Business center',
    concierge: 'Concierge',
    pet_friendly: 'Pet friendly',
    wheelchair: 'Wheelchair accessible',
    non_smoking: 'Non-smoking rooms',
    family_rooms: 'Family rooms',
    cctv: 'CCTV common areas',
    security_24h: '24h security',
    safe_deposit: 'Safe deposit box',
    fire_extinguishers: 'Fire extinguishers',
    smoke_alarms: 'Smoke alarms',
    tv: 'Flat-screen TV',
    desk: 'Work desk',
    bathtub: 'Bathtub',
    shower: 'Shower',
    hairdryer: 'Hairdryer',
    balcony: 'Balcony',
    city_view: 'City view',
    king_bed: 'King bed',
    twin_beds: 'Twin beds',
    sofa_bed: 'Sofa bed',
};

/** Keys stored in amenities JSON that are not facility flags. */
export const AMENITY_META_KEYS = new Set(['brand', 'custom_facilities']);

/** Free-text facilities hotels add beyond the catalog. */
export function customFacilitiesFromRecord(
    amenities: Record<string, unknown> | null | undefined,
): string[] {
    if (!amenities || typeof amenities !== 'object') return [];
    const raw = amenities.custom_facilities;
    if (!Array.isArray(raw)) return [];
    return raw
        .map((v) => String(v || '').trim())
        .filter((v) => v.length > 0)
        .slice(0, 40);
}

export const FACILITY_GROUP_META: Array<{
    id: string;
    facility_type_name: string;
    hint: string;
    keys: string[];
}> = [
    {
        id: 'essentials',
        facility_type_name: 'Essentials',
        hint: 'Wi‑Fi, parking, A/C',
        keys: [
            'wifi',
            'parking',
            'ev_charging',
            'ac',
            'heating',
            'elevator',
            'breakfast',
            'twenty_four_reception',
        ],
    },
    {
        id: 'wellness',
        facility_type_name: 'Wellness',
        hint: 'Pool, gym, spa',
        keys: ['pool', 'indoor_pool', 'gym', 'spa', 'sauna', 'hot_tub'],
    },
    {
        id: 'dining',
        facility_type_name: 'Food & drink',
        hint: 'Restaurant & bar',
        keys: ['restaurant', 'bar', 'room_service', 'coffee_shop', 'minibar'],
    },
    {
        id: 'services',
        facility_type_name: 'Services',
        hint: 'Shuttle, laundry…',
        keys: [
            'airport_shuttle',
            'laundry',
            'dry_cleaning',
            'conference',
            'business_center',
            'concierge',
            'pet_friendly',
            'wheelchair',
            'non_smoking',
            'family_rooms',
        ],
    },
    {
        id: 'safety',
        facility_type_name: 'Safety & security',
        hint: 'CCTV, safe…',
        keys: [
            'cctv',
            'security_24h',
            'safe_deposit',
            'fire_extinguishers',
            'smoke_alarms',
        ],
    },
    {
        id: 'in_room',
        facility_type_name: 'In-room',
        hint: 'TV, bathroom, beds',
        keys: [
            'tv',
            'desk',
            'bathtub',
            'shower',
            'hairdryer',
            'balcony',
            'city_view',
            'king_bed',
            'twin_beds',
            'sofa_bed',
        ],
    },
];

export const ALL_FACILITY_KEYS = new Set(
    FACILITY_GROUP_META.flatMap((g) => g.keys),
);

export function labelAmenityKey(key: string): string {
    return (
        HOTEL_AMENITY_LABELS[key] ||
        key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
    );
}

export function isAmenityFlagEnabled(
    amenities: Record<string, unknown> | null | undefined,
    key: string,
): boolean {
    if (!amenities || AMENITY_META_KEYS.has(key)) return false;
    const v = amenities[key];
    return v === true || v === 1 || v === 'true' || v === 'yes';
}

export function amenityKeysFromRecord(
    amenities: Record<string, unknown> | null | undefined,
): string[] {
    if (!amenities || typeof amenities !== 'object') return [];
    return Object.keys(amenities).filter((k) =>
        isAmenityFlagEnabled(amenities, k),
    );
}

export function amenityLabelsFromRecord(
    amenities: Record<string, unknown> | null | undefined,
): string[] {
    return [
        ...amenityKeysFromRecord(amenities).map(labelAmenityKey),
        ...customFacilitiesFromRecord(amenities),
    ];
}

/** Merge facility checkboxes without wiping meta keys like brand / custom_facilities. */
export function mergeFacilityAmenities(
    existing: Record<string, unknown> | null | undefined,
    selected: Record<string, boolean>,
    customFacilities?: string[],
): Record<string, unknown> {
    const base = { ...(existing || {}) };
    for (const key of ALL_FACILITY_KEYS) {
        if (selected[key]) base[key] = true;
        else delete base[key];
    }
    if (customFacilities !== undefined) {
        const cleaned = customFacilities
            .map((v) => String(v || '').trim())
            .filter((v) => v.length > 0)
            .slice(0, 40);
        if (cleaned.length) base.custom_facilities = cleaned;
        else delete base.custom_facilities;
    }
    return base;
}

export function facilityGroupsFromAmenities(
    amenities: Record<string, unknown> | null | undefined,
): Array<{
    facility_type_name: string;
    facilities: Array<{ facility_name: string }>;
}> {
    const keys = new Set(amenityKeysFromRecord(amenities));
    const groups = FACILITY_GROUP_META.map((g) => {
        const facilities = g.keys
            .filter((k) => keys.has(k))
            .map((k) => ({ facility_name: labelAmenityKey(k) }));
        return {
            facility_type_name: g.facility_type_name,
            facilities,
        };
    }).filter((g) => g.facilities.length > 0);

    const known = new Set(FACILITY_GROUP_META.flatMap((g) => g.keys));
    const extra = [...keys]
        .filter((k) => !known.has(k))
        .map((k) => ({ facility_name: labelAmenityKey(k) }));
    const custom = customFacilitiesFromRecord(amenities).map((name) => ({
        facility_name: name,
    }));
    const other = [...extra, ...custom];
    if (other.length) {
        groups.push({ facility_type_name: 'Other', facilities: other });
    }
    return groups;
}
