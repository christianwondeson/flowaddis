/**
 * RapidAPI key for server-side Booking.com proxies.
 * Validation is lazy so `next build` / Firebase App Hosting can run without secrets;
 * routes that call RapidAPI fail at request time if the key is still missing.
 */

export interface ServerEnv {
    RAPIDAPI_KEY: string;
}

/** Next sets this while running `next build` (including Firebase App Hosting / Cloud Build). */
function isNextProductionBuild(): boolean {
    return process.env.NEXT_PHASE === 'phase-production-build';
}

export function readRapidApiKey(): string {
    return (
        process.env.RAPIDAPI_KEY?.trim() ||
        process.env.NEXT_PUBLIC_RAPIDAPI_KEY?.trim() ||
        ''
    );
}

function loadRapidApiKey(): string {
    const key = readRapidApiKey();
    if (!key) {
        // Allow the bundle to build without secrets; real requests still need the key at runtime.
        if (isNextProductionBuild()) {
            return '';
        }
        throw new Error(
            `Missing required environment variables:\n` +
                `  - RAPIDAPI_KEY (recommended, server-only) or NEXT_PUBLIC_RAPIDAPI_KEY is required but not set\n\n` +
                `Set RAPIDAPI_KEY on Firebase Hosting SSR (firebase.json frameworksBackend) or Cloud Run.\n` +
                `Locally use .env.local. See .env.example.`,
        );
    }
    return key;
}

/** Do not cache an empty key from `next build` into the Cloud Run process. */
export function getServerEnv(): ServerEnv {
    return { RAPIDAPI_KEY: loadRapidApiKey() };
}

/** Use from server code paths that call RapidAPI (e.g. api-config getters). */
export function requireRapidApiKey(): string {
    return loadRapidApiKey();
}
