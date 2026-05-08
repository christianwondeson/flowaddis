/** Returned by `/api/admin/cms/*` JSON bodies so the UI can show targeted help text. */
export const ADMIN_CMS_ERROR_CODE = {
    ADMIN_REQUIRED: 'ADMIN_REQUIRED',
    SESSION_INVALID: 'SESSION_INVALID',
    BACKEND_CONFIG: 'BACKEND_CONFIG',
    ADMIN_PROBE_FAILED: 'ADMIN_PROBE_FAILED',
    STRAPI_CONFIG: 'STRAPI_CONFIG',
} as const;

export type AdminCmsErrorCode = (typeof ADMIN_CMS_ERROR_CODE)[keyof typeof ADMIN_CMS_ERROR_CODE];
