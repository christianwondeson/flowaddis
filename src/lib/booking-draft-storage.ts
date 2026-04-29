/**
 * Persists only non-sensitive booking context across sign-in (sessionStorage).
 * PII (name, email, phone) is never written — users re-enter contact after auth.
 */

const HOTEL_KEY = 'flowaddis_booking_draft_hotel_v2';
const FLIGHT_KEY = 'flowaddis_booking_draft_flight_v2';
const LEGACY_HOTEL_KEY = 'flowaddis_booking_draft_hotel_v1';
const LEGACY_FLIGHT_KEY = 'flowaddis_booking_draft_flight_v1';
const MAX_AGE_MS = 24 * 60 * 60 * 1000;

/** Input may include PII for call-site convenience; it is stripped before storage. */
export type HotelBookingDraftInput = {
    pathname: string;
    externalItemId: string;
    type: string;
    serviceName: string;
    checkIn: string;
    checkOut: string;
    name?: string;
    email?: string;
    phone?: string;
    countryCode?: string;
    nationalNumber?: string;
    roomBlockId?: string;
    roomBookQuantity?: number;
    hotelAdults?: number;
};

export type HotelBookingDraftStored = {
    pathname: string;
    externalItemId: string;
    type: string;
    serviceName: string;
    checkIn: string;
    checkOut: string;
    roomBlockId?: string;
    roomBookQuantity?: number;
    hotelAdults?: number;
};

export type FlightBookingDraftInput = {
    pathname: string;
    name?: string;
    email?: string;
    phone?: string;
    countryCode?: string;
    nationalNumber?: string;
};

export type FlightBookingDraftStored = {
    pathname: string;
};

function isFresh(at: number | undefined): boolean {
    return typeof at === 'number' && Date.now() - at < MAX_AGE_MS;
}

function stripLegacyDraftKeys(): void {
    if (typeof window === 'undefined') return;
    try {
        sessionStorage.removeItem(LEGACY_HOTEL_KEY);
        sessionStorage.removeItem(LEGACY_FLIGHT_KEY);
    } catch {
        /* ignore */
    }
}

/** Call before redirecting to sign-in so the user can continue after auth. */
export function saveHotelBookingDraftForAuthRedirect(payload: HotelBookingDraftInput): void {
    if (typeof window === 'undefined') return;
    stripLegacyDraftKeys();
    const safe: HotelBookingDraftStored & { at: number } = {
        pathname: payload.pathname,
        externalItemId: payload.externalItemId,
        type: payload.type,
        serviceName: payload.serviceName,
        checkIn: payload.checkIn,
        checkOut: payload.checkOut,
        at: Date.now(),
    };
    if (payload.roomBlockId) safe.roomBlockId = payload.roomBlockId;
    if (typeof payload.roomBookQuantity === 'number' && payload.roomBookQuantity > 0) {
        safe.roomBookQuantity = Math.floor(payload.roomBookQuantity);
    }
    if (typeof payload.hotelAdults === 'number' && payload.hotelAdults > 0) {
        safe.hotelAdults = payload.hotelAdults;
    }
    try {
        sessionStorage.setItem(HOTEL_KEY, JSON.stringify(safe));
    } catch {
        /* ignore quota / private mode */
    }
}

/** Returns draft and removes it when pathname + listing match. */
export function consumeMatchedHotelDraft(
    pathname: string,
    externalItemId: string,
    bookingType: string,
): HotelBookingDraftStored | null {
    if (typeof window === 'undefined') return null;
    stripLegacyDraftKeys();
    try {
        const raw = sessionStorage.getItem(HOTEL_KEY);
        if (!raw) return null;
        const d = JSON.parse(raw) as HotelBookingDraftStored & { at?: number };
        if (!isFresh(d.at)) {
            sessionStorage.removeItem(HOTEL_KEY);
            return null;
        }
        if (d.pathname !== pathname || d.externalItemId !== externalItemId || d.type !== bookingType) {
            return null;
        }
        sessionStorage.removeItem(HOTEL_KEY);
        const { at: _a, ...rest } = d;
        return rest;
    } catch {
        return null;
    }
}

export function saveFlightBookingDraftForAuthRedirect(payload: FlightBookingDraftInput): void {
    if (typeof window === 'undefined') return;
    stripLegacyDraftKeys();
    const safe: FlightBookingDraftStored & { at: number } = {
        pathname: payload.pathname,
        at: Date.now(),
    };
    try {
        sessionStorage.setItem(FLIGHT_KEY, JSON.stringify(safe));
    } catch {
        /* ignore */
    }
}

export function consumeMatchedFlightDraft(pathname: string): FlightBookingDraftStored | null {
    if (typeof window === 'undefined') return null;
    stripLegacyDraftKeys();
    try {
        const raw = sessionStorage.getItem(FLIGHT_KEY);
        if (!raw) return null;
        const d = JSON.parse(raw) as FlightBookingDraftStored & { at?: number };
        if (!isFresh(d.at)) {
            sessionStorage.removeItem(FLIGHT_KEY);
            return null;
        }
        if (d.pathname !== pathname) return null;
        sessionStorage.removeItem(FLIGHT_KEY);
        const { at: _a, ...rest } = d;
        return rest;
    } catch {
        return null;
    }
}
