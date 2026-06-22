/**
 * CBE Birr USSD push checkout helpers (CP4I C2B).
 * Phone is sent as metadata.customerMsisdn — backend normalizes to 251XXXXXXXXX.
 */

/** Accept 09xxxxxxxx, 9xxxxxxxx, +251..., 251... */
export function isValidCbeBirrMsisdn(raw: string): boolean {
    const trimmed = raw.trim();
    if (!trimmed) return false;
    const digits = trimmed.replace(/\D/g, '');
    if (digits.startsWith('251') && digits.length === 12) return true;
    if (digits.startsWith('0') && digits.length === 10 && /^0[79]/.test(digits)) return true;
    if (digits.length === 9 && /^9/.test(digits)) return true;
    return false;
}

export function buildNestCheckoutMetadata(
    externalSnapshot: Record<string, unknown>,
    customerMsisdn?: string,
): Record<string, unknown> {
    const snap = externalSnapshot || {};
    const meta: Record<string, unknown> = {};

    if (customerMsisdn?.trim()) {
        meta.customerMsisdn = customerMsisdn.trim();
    }

    const checkin = snap.checkIn ?? snap.checkin;
    const checkout = snap.checkOut ?? snap.checkout;
    if (typeof checkin === 'string' && checkin) meta.checkin = checkin;
    if (typeof checkout === 'string' && checkout) meta.checkout = checkout;

    const adults = snap.adults;
    if (adults != null) meta.adults = String(adults);

    const roomBlockId = snap.roomBlockId;
    if (roomBlockId != null) meta.roomBlockId = String(roomBlockId);

    const qty = snap.roomBookQuantity;
    if (qty != null) meta.roomBookQuantity = String(qty);

    return meta;
}
