/**
 * Nest `InitiateBookingDto` uses `forbidNonWhitelisted: true`.
 * Forward only allowed keys so extra client fields (e.g. returnUrl) never hit the API.
 * Never forward client-reported price — Stripe amounts are computed only on the server.
 */
export const NEST_CREATE_SESSION_KEYS = [
    'bookingType',
    'source',
    'externalItemId',
    'currency',
    'metadata',
    'external_snapshot',
] as const;

export function pickNestCreateSessionBody(body: unknown): Record<string, unknown> {
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
        return {};
    }
    const src = body as Record<string, unknown>;
    const out: Record<string, unknown> = {};
    for (const k of NEST_CREATE_SESSION_KEYS) {
        if (src[k] !== undefined && src[k] !== null) {
            out[k] = src[k];
        }
    }
    return out;
}
