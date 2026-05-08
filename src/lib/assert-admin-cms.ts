import { verifyFirebaseIdToken } from '@/lib/verify-firebase-id-token';
import { getSafeBackendBaseUrl } from '@/lib/safe-backend-url';
import { ADMIN_CMS_ERROR_CODE, type AdminCmsErrorCode } from '@/lib/admin-cms-error-codes';

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

/**
 * Verifies Firebase ID token, then confirms the caller is allowed to use admin CMS
 * by delegating to Nest (same Firestore-backed admin checks as other admin routes).
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

    try {
        await verifyFirebaseIdToken(raw);
    } catch {
        throw new CmsAuthError('Invalid or expired session', 401, ADMIN_CMS_ERROR_CODE.SESSION_INVALID);
    }

    let backend: string;
    try {
        backend = getSafeBackendBaseUrl();
    } catch {
        throw new CmsAuthError(
            'BACKEND_URL is not configured correctly',
            503,
            ADMIN_CMS_ERROR_CODE.BACKEND_CONFIG,
        );
    }

    const probe = await fetch(`${backend}/api/v1/admin/cms-access`, {
        method: 'GET',
        headers: {
            Authorization: authHeader,
        },
    });

    if (probe.status === 403) {
        throw new CmsAuthError('Admin access required', 403, ADMIN_CMS_ERROR_CODE.ADMIN_REQUIRED);
    }
    if (probe.status === 401) {
        throw new CmsAuthError('Invalid or expired session', 401, ADMIN_CMS_ERROR_CODE.SESSION_INVALID);
    }
    if (!probe.ok) {
        throw new CmsAuthError(
            'Could not verify admin privileges',
            502,
            ADMIN_CMS_ERROR_CODE.ADMIN_PROBE_FAILED,
        );
    }
}
