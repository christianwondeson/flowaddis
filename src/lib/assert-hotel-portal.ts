import { verifyFirebaseIdToken } from '@/lib/verify-firebase-id-token';
import { getSafeBackendBaseUrl } from '@/lib/safe-backend-url';
import {
    isApprovedFirestoreAdmin,
    isHotelPortalFirestoreRole,
    normalizeFirestoreRole,
} from '@/lib/auth/firestore-admin-role';
import { getAdminFirestore, isFirebaseAdminConfigured } from '@/lib/server/firebase-admin';

export class HotelPortalAuthError extends Error {
    constructor(
        message: string,
        readonly status: number,
    ) {
        super(message);
        this.name = 'HotelPortalAuthError';
    }
}

function uidFromPayload(payload: Record<string, unknown>): string | null {
    const sub = payload.sub;
    if (typeof sub === 'string' && sub.trim()) return sub.trim();
    const userId = payload.user_id;
    if (typeof userId === 'string' && userId.trim()) return userId.trim();
    return null;
}

/**
 * Firebase ID token + Firestore role must be hotel portal (or Super Admin).
 * Optional hotelId: confirms Nest membership / superadmin access.
 */
export async function assertHotelPortalAccess(
    req: Request,
    hotelId?: string | null,
): Promise<{ uid: string; role: string }> {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
        throw new HotelPortalAuthError('Authentication required', 401);
    }
    const token = authHeader.slice('Bearer '.length).trim();
    if (!token) {
        throw new HotelPortalAuthError('Authentication required', 401);
    }

    let payload: Awaited<ReturnType<typeof verifyFirebaseIdToken>>;
    try {
        payload = await verifyFirebaseIdToken(token);
    } catch {
        throw new HotelPortalAuthError('Invalid or expired session', 401);
    }

    const uid = uidFromPayload(payload as Record<string, unknown>);
    if (!uid) {
        throw new HotelPortalAuthError('Invalid session', 401);
    }

    if (!isFirebaseAdminConfigured()) {
        throw new HotelPortalAuthError('Server auth is not configured', 503);
    }

    let role = '';
    let adminStatus: string | undefined;
    try {
        const snap = await getAdminFirestore().collection('users').doc(uid).get();
        if (!snap.exists) {
            throw new HotelPortalAuthError('User profile not found', 403);
        }
        const d = snap.data() as { role?: unknown; adminStatus?: unknown };
        role = normalizeFirestoreRole(d?.role) || '';
        adminStatus = typeof d?.adminStatus === 'string' ? d.adminStatus : undefined;
    } catch (e) {
        if (e instanceof HotelPortalAuthError) throw e;
        throw new HotelPortalAuthError('Unable to verify hotel portal access', 503);
    }

    if (role === 'admin') {
        if (!isApprovedFirestoreAdmin(role, adminStatus)) {
            throw new HotelPortalAuthError('Super Admin access is not approved', 403);
        }
    } else if (!isHotelPortalFirestoreRole(role)) {
        throw new HotelPortalAuthError('Hotel portal access required', 403);
    }

    if (hotelId) {
        try {
            const backend = getSafeBackendBaseUrl();
            const probe = await fetch(
                `${backend}/api/v1/hotel-admin/hotels/${encodeURIComponent(hotelId)}`,
                {
                    headers: { Authorization: authHeader },
                    cache: 'no-store',
                    signal: AbortSignal.timeout(12_000),
                },
            );
            if (probe.status === 403 || probe.status === 404) {
                throw new HotelPortalAuthError(
                    'You do not have access to this hotel',
                    403,
                );
            }
            if (!probe.ok && probe.status !== 401) {
                // Soft-fail membership probe on Nest outage  role gate already passed.
                console.warn(
                    '[assertHotelPortalAccess] hotel probe unexpected',
                    probe.status,
                );
            }
            if (probe.status === 401) {
                throw new HotelPortalAuthError('Invalid or expired session', 401);
            }
        } catch (e) {
            if (e instanceof HotelPortalAuthError) throw e;
            console.warn(
                '[assertHotelPortalAccess] hotel probe failed',
                (e as Error).message,
            );
        }
    }

    return { uid, role };
}
