/**
 * RapidAPI key for server-side Booking.com proxies.
 * Validation is lazy so `next build` / Firebase App Hosting can run without secrets;
 * routes that call RapidAPI fail at request time if the key is still missing.
 */

export interface ServerEnv {
    RAPIDAPI_KEY: string;
}

let cached: ServerEnv | null = null;

/** Next sets this while running `next build` (including Firebase App Hosting / Cloud Build). */
function isNextProductionBuild(): boolean {
    return process.env.NEXT_PHASE === 'phase-production-build';
}

function loadRapidApiKey(): string {
    const key =
        process.env.RAPIDAPI_KEY?.trim() ||
        process.env.NEXT_PUBLIC_RAPIDAPI_KEY?.trim();
    if (!key) {
        // Allow the bundle to build without secrets; real requests still need the key at runtime.
        if (isNextProductionBuild()) {
            return '';
        }
        throw new Error(
            `Missing required environment variables:\n` +
                `  - RAPIDAPI_KEY (recommended, server-only) or NEXT_PUBLIC_RAPIDAPI_KEY is required but not set\n\n` +
                `Set RAPIDAPI_KEY (or NEXT_PUBLIC_RAPIDAPI_KEY) in Firebase App Hosting env / Cloud Run / GitHub Actions for deploy.\n` +
                `Locally use .env.local. See .env.example.`
        );
    }
    return key;
}

/** Validates once per process when first needed (not at module load). */
export function getServerEnv(): ServerEnv {
    if (!cached) {
        cached = { RAPIDAPI_KEY: loadRapidApiKey() };
    }
    return cached;
}

/** Use from server code paths that call RapidAPI (e.g. api-config getters). */
export function requireRapidApiKey(): string {
    return getServerEnv().RAPIDAPI_KEY;
}
