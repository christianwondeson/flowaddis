import { verifyFirebaseIdToken } from '@/lib/verify-firebase-id-token';
import { getSafeBackendBaseUrl } from '@/lib/safe-backend-url';

export class CmsAuthError extends Error {
    constructor(
        message: string,
        readonly status: number,
    ) {
        super(message);
        this.name = 'CmsAuthError';
    }
}

/**
 * Verifies Firebase ID token, then confirms the caller is allowed to use admin CMS
 * by delegating to Nest (same role checks as payment admin).
 */
export async function assertFirebaseAndNestAdmin(req: Request): Promise<void> {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
        throw new CmsAuthError('Authentication required', 401);
    }
    const raw = authHeader.slice('Bearer '.length).trim();
    if (!raw) {
        throw new CmsAuthError('Authentication required', 401);
    }

    try {
        await verifyFirebaseIdToken(raw);
    } catch {
        throw new CmsAuthError('Invalid or expired session', 401);
    }

    let backend: string;
    try {
        backend = getSafeBackendBaseUrl();
    } catch {
        throw new CmsAuthError('BACKEND_URL is not configured correctly', 503);
    }

    const probe = await fetch(`${backend}/api/v1/admin/payments?limit=1`, {
        method: 'GET',
        headers: {
            Authorization: authHeader,
        },
    });

    if (probe.status === 403) {
        throw new CmsAuthError('Admin access required', 403);
    }
    if (probe.status === 401) {
        throw new CmsAuthError('Invalid or expired session', 401);
    }
    if (!probe.ok) {
        throw new CmsAuthError('Could not verify admin privileges', 502);
    }
}
