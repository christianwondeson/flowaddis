"use client";

import type { ReactNode } from "react";
import { AlertCircle } from "lucide-react";
import { ADMIN_CMS_ERROR_CODE, type AdminCmsErrorCode } from "@/lib/admin-cms-error-codes";

type Props = {
    error: string | null;
    errorCode?: AdminCmsErrorCode | null;
};

export function AdminCmsErrorBanner({ error, errorCode }: Props) {
    if (!error) return null;

    let hint: ReactNode = null;
    if (errorCode === ADMIN_CMS_ERROR_CODE.ADMIN_REQUIRED) {
        hint = (
            <p className="mt-2 text-xs text-amber-800/80">
                Nest rejected this account as admin. In Firestore <code className="rounded bg-white/80 px-1">users/&lt;uid&gt;</code>,
                set <code className="rounded bg-white/80 px-1">role</code> to <code className="rounded bg-white/80 px-1">admin</code> and{" "}
                <code className="rounded bg-white/80 px-1">adminStatus</code> to <code className="rounded bg-white/80 px-1">approved</code> (not{" "}
                <code className="rounded bg-white/80 px-1">pending</code> or <code className="rounded bg-white/80 px-1">rejected</code>).                 Ensure the Nest API can read Firestore (Firebase Admin on the API) with{" "}
                <code className="rounded bg-white/80 px-1">FIRESTORE_DATABASE_ID=flowaddis-db</code> on{" "}
                <code className="rounded bg-white/80 px-1">api.bookaddis.com</code>, then restart Nest.{" "}
                <code className="rounded bg-white/80 px-1">BACKEND_URL</code> on the Next server must point at that API.
            </p>
        );
    } else if (errorCode === ADMIN_CMS_ERROR_CODE.STRAPI_CONFIG) {
        hint = (
            <p className="mt-2 text-xs text-amber-800/80">
                Strapi or env config: start Strapi, then set <code className="rounded bg-white/80 px-1">STRAPI_URL</code> and{" "}
                <code className="rounded bg-white/80 px-1">STRAPI_API_TOKEN</code> on the Next server. For images in the browser, set{" "}
                <code className="rounded bg-white/80 px-1">NEXT_PUBLIC_STRAPI_URL</code>.
            </p>
        );
    } else if (errorCode === ADMIN_CMS_ERROR_CODE.BACKEND_CONFIG || errorCode === ADMIN_CMS_ERROR_CODE.ADMIN_PROBE_FAILED) {
        hint = (
            <p className="mt-2 text-xs text-amber-800/80">
                Check <code className="rounded bg-white/80 px-1">BACKEND_URL</code> (Nest origin, no <code className="rounded bg-white/80 px-1">/api</code> suffix) and that the Nest process is running and reachable from Next.
            </p>
        );
    } else if (errorCode === ADMIN_CMS_ERROR_CODE.SESSION_INVALID) {
        hint = (
            <p className="mt-2 text-xs text-amber-800/80">
                Sign out and sign in again so your session token is refreshed.
            </p>
        );
    } else {
        hint = (
            <p className="mt-2 text-xs text-amber-800/80">
                If this persists, verify Strapi (<code className="rounded bg-white/80 px-1">STRAPI_URL</code>,{" "}
                <code className="rounded bg-white/80 px-1">STRAPI_API_TOKEN</code>), Nest (<code className="rounded bg-white/80 px-1">BACKEND_URL</code>), and Firestore admin fields for your user.
            </p>
        );
    }

    return (
        <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
                <p className="font-semibold">Could not load CMS</p>
                <p className="text-amber-800/90">{error}</p>
                {hint}
            </div>
        </div>
    );
}
