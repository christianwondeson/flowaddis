/**
 * Helpers for Ethiopian local rails (CBE Birr USSD push, etc.).
 * Mirrors Nest InitiateBookingDto metadata + payment status polling.
 */

/** Convert +2519… / 2519… / 09… to local 09xxxxxxxx for UI validation. */
export function etMsisdnToLocalDisplay(phone: string | undefined | null): string {
    if (!phone?.trim()) return '';
    const digits = phone.replace(/\D/g, '');
    if (digits.startsWith('251') && digits.length === 12) {
        return `0${digits.slice(3)}`;
    }
    if (digits.startsWith('0') && digits.length === 10) {
        return digits;
    }
    if (digits.length === 9 && /^9/.test(digits)) {
        return `0${digits}`;
    }
    return '';
}

export function buildLocalCheckoutMetadata(params: {
    customerMsisdn: string;
    externalSnapshot?: Record<string, unknown>;
}): Record<string, unknown> {
    const snap = params.externalSnapshot ?? {};
    const meta: Record<string, unknown> = {
        customerMsisdn: params.customerMsisdn,
        phone: params.customerMsisdn,
    };

    const checkin = snap.checkIn ?? snap.checkin;
    const checkout = snap.checkOut ?? snap.checkout;
    if (checkin != null && checkin !== '') meta.checkin = checkin;
    if (checkout != null && checkout !== '') meta.checkout = checkout;
    if (snap.adults != null && snap.adults !== '') meta.adults = snap.adults;
    if (snap.roomBlockId != null && snap.roomBlockId !== '') meta.roomBlockId = snap.roomBlockId;
    if (snap.roomBookQuantity != null && snap.roomBookQuantity !== '') {
        meta.roomBookQuantity = snap.roomBookQuantity;
    }

    return meta;
}

export type PaymentStatusPollResult =
    | { status: 'PAID' | 'CONFIRMED' }
    | { status: 'FAILED' | 'EXPIRED' | 'INITIATED' | string }
    | { error: string };

/** Poll Nest payment status via Next proxy. */
export async function fetchPaymentStatus(
    paymentReference: string,
    idToken: string,
): Promise<PaymentStatusPollResult> {
    const res = await fetch(`/api/payments/status/${encodeURIComponent(paymentReference)}`, {
        headers: { Authorization: `Bearer ${idToken}` },
    });
    const data = (await res.json().catch(() => ({}))) as { status?: string; message?: string; error?: string };
    if (!res.ok) {
        return { error: data.message || data.error || `Status check failed (${res.status})` };
    }
    const status = typeof data.status === 'string' ? data.status : 'UNKNOWN';
    if (status === 'PAID' || status === 'CONFIRMED') {
        return { status };
    }
    return { status };
}

export const ET_MOBILE_PATTERN = /^(09|07)\d{8}$/;
