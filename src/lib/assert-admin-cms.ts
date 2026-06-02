import { verifyFirebaseIdToken } from '@/lib/verify-firebase-id-token';
import { getSafeBackendBaseUrl } from '@/lib/safe-backend-url';
import { ADMIN_CMS_ERROR_CODE, type AdminCmsErrorCode } from '@/lib/admin-cms-error-codes';
import { verifyApprovedAdminFromFirestore } from '@/lib/server/firestore-admin-access';

export class CmsAuthError extends Error {
    constructor(
        message: string,
        readonly status: number,
        readonly code: AdminCmsErrorCode,
    ) {
        super(message);
        this.name = 'CmsAuthError';
    }
}

function uidFromTokenPayload(payload: Record<string, unknown>): string | null {
    const sub = payload.sub;
    if (typeof sub === 'string' && sub.trim()) {
        return sub.trim();
    }
    const userId = payload.user_id;
    if (typeof userId === 'string' && userId.trim()) {
        return userId.trim();
    }
    return null;
}

async function assertAdminViaNest(authHeader: string): Promise<'ok' | 'forbidden' | 'unreachable'> {
    let backend: string;
    try {
        backend = getSafeBackendBaseUrl();
    } catch {
        return 'unreachable';
    }

    try {
        const probe = await fetch(`${backend}/api/v1/admin/cms-access`, {
            method: 'GET',
            headers: { Authorization: authHeader },
            cache: 'no-store',
        });
        if (probe.status === 200) {
            return 'ok';
        }
        if (probe.status === 403) {
            return 'forbidden';
        }
        if (probe.status === 401) {
            return 'forbidden';
        }
        console.warn('[assertAdminViaNest] unexpected status', probe.status);
        return 'unreachable';
    } catch (err) {
        console.warn('[assertAdminViaNest] fetch failed', (err as Error).message);
        return 'unreachable';
    }
}

/**
 * Verifies Firebase ID token, then confirms admin via Nest (preferred) or Firestore Admin on Next (fallback).
 * Fallback fixes CMS when api.bookaddis.com cannot read Firestore (e.g. wrong FIRESTORE_DATABASE_ID on VPS).
 */
export async function assertFirebaseAndNestAdmin(req: Request): Promise<void> {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
        throw new CmsAuthError('Authentication required', 401, ADMIN_CMS_ERROR_CODE.SESSION_INVALID);
    }
    const raw = authHeader.slice('Bearer '.length).trim();
    if (!raw) {
        throw new CmsAuthError('Authentication required', 401, ADMIN_CMS_ERROR_CODE.SESSION_INVALID);
    }

    let payload: Awaited<ReturnType<typeof verifyFirebaseIdToken>>;
    try {
        payload = await verifyFirebaseIdToken(raw);
    } catch {
        throw new CmsAuthError('Invalid or expired session', 401, ADMIN_CMS_ERROR_CODE.SESSION_INVALID);
    }

    const uid = uidFromTokenPayload(payload as Record<string, unknown>);
    if (!uid) {
        throw new CmsAuthError('Invalid session token', 401, ADMIN_CMS_ERROR_CODE.SESSION_INVALID);
    }

    const nest = await assertAdminViaNest(authHeader);
    if (nest === 'ok') {
        return;
    }

    if (nest === 'unreachable') {
        try {
            getSafeBackendBaseUrl();
        } catch {
            throw new CmsAuthError(
                'BACKEND_URL is not configured correctly',
                503,
                ADMIN_CMS_ERROR_CODE.BACKEND_CONFIG,
            );
        }
    }

    const firestore = await verifyApprovedAdminFromFirestore(uid);
    if (firestore.ok) {
        if (nest === 'forbidden') {
            console.warn(
                `[CMS] Nest denied admin for ${uid} but Firestore confirms admin — check api.bookaddis.com FIRESTORE_DATABASE_ID=flowaddis-db and restart Nest.`,
            );
        }
        return;
    }

    if (firestore.reason === 'not_configured' || firestore.reason === 'read_failed') {
        if (nest === 'forbidden') {
            throw new CmsAuthError('Admin access required', 403, ADMIN_CMS_ERROR_CODE.ADMIN_REQUIRED);
        }
        throw new CmsAuthError(
            'Could not verify admin privileges',
            502,
            ADMIN_CMS_ERROR_CODE.ADMIN_PROBE_FAILED,
        );
    }

    throw new CmsAuthError('Admin access required', 403, ADMIN_CMS_ERROR_CODE.ADMIN_REQUIRED);
}
