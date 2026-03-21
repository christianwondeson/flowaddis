/**
 * Persists booking modal form data across sign-in redirect (sessionStorage).
 */

const HOTEL_KEY = 'flowaddis_booking_draft_hotel_v1';
const FLIGHT_KEY = 'flowaddis_booking_draft_flight_v1';
const MAX_AGE_MS = 24 * 60 * 60 * 1000;

export type HotelBookingDraftPayload = {
    pathname: string;
    externalItemId: string;
    type: string;
    serviceName: string;
    name: string;
    email: string;
    phone: string;
    checkIn: string;
    checkOut: string;
    countryCode: string;
    nationalNumber: string;
};

export type FlightBookingDraftPayload = {
    pathname: string;
    name: string;
    email: string;
    phone: string;
    countryCode: string;
    nationalNumber: string;
};

function isFresh(at: number | undefined): boolean {
    return typeof at === 'number' && Date.now() - at < MAX_AGE_MS;
}

/** Call before redirecting to sign-in so the user can continue after auth. */
export function saveHotelBookingDraftForAuthRedirect(payload: HotelBookingDraftPayload): void {
    if (typeof window === 'undefined') return;
    try {
        sessionStorage.setItem(HOTEL_KEY, JSON.stringify({ ...payload, at: Date.now() }));
    } catch {
        /* ignore quota / private mode */
    }
}

/** Returns draft and removes it when pathname + listing match. */
export function consumeMatchedHotelDraft(
    pathname: string,
    externalItemId: string,
    bookingType: string,
): HotelBookingDraftPayload | null {
    if (typeof window === 'undefined') return null;
    try {
        const raw = sessionStorage.getItem(HOTEL_KEY);
        if (!raw) return null;
        const d = JSON.parse(raw) as HotelBookingDraftPayload & { at?: number };
        if (!isFresh(d.at)) {
            sessionStorage.removeItem(HOTEL_KEY);
            return null;
        }
        if (d.pathname !== pathname || d.externalItemId !== externalItemId || d.type !== bookingType) {
            return null;
        }
        sessionStorage.removeItem(HOTEL_KEY);
        return d;
    } catch {
        return null;
    }
}

export function saveFlightBookingDraftForAuthRedirect(payload: FlightBookingDraftPayload): void {
    if (typeof window === 'undefined') return;
    try {
        sessionStorage.setItem(FLIGHT_KEY, JSON.stringify({ ...payload, at: Date.now() }));
    } catch {
        /* ignore */
    }
}

export function consumeMatchedFlightDraft(pathname: string): FlightBookingDraftPayload | null {
    if (typeof window === 'undefined') return null;
    try {
        const raw = sessionStorage.getItem(FLIGHT_KEY);
        if (!raw) return null;
        const d = JSON.parse(raw) as FlightBookingDraftPayload & { at?: number };
        if (!isFresh(d.at)) {
            sessionStorage.removeItem(FLIGHT_KEY);
            return null;
        }
        if (d.pathname !== pathname) return null;
        sessionStorage.removeItem(FLIGHT_KEY);
        return d;
    } catch {
        return null;
    }
}
