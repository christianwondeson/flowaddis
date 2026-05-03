/**
 * Environment Variable Validation
 * 
 * This module validates that all required environment variables are present
 * and provides type-safe access to them. The app will fail fast on startup
 * if any required variables are missing.
 */

interface EnvConfig {
    /** Prefer server-only `RAPIDAPI_KEY`; legacy `NEXT_PUBLIC_RAPIDAPI_KEY` still supported. */
    RAPIDAPI_KEY: string;
}

function validateEnv(): EnvConfig {
    const errors: string[] = [];

    const RAPIDAPI_KEY =
        process.env.RAPIDAPI_KEY?.trim() ||
        process.env.NEXT_PUBLIC_RAPIDAPI_KEY?.trim();

    if (!RAPIDAPI_KEY) {
        errors.push(
            'RAPIDAPI_KEY (recommended, server-only) or NEXT_PUBLIC_RAPIDAPI_KEY is required but not set',
        );
    }

    // If there are any errors, throw with helpful message
    if (errors.length > 0) {
        throw new Error(
            `Missing required environment variables:\n${errors.map(e => `  - ${e}`).join('\n')}\n\n` +
            `Please check your .env.local file and ensure all required variables are set.\n` +
            `See .env.example for the complete list of required variables.\n` +
            `Tip: set RAPIDAPI_KEY (without NEXT_PUBLIC_) so the key is never bundled for the browser.`
        );
    }

    return {
        RAPIDAPI_KEY: RAPIDAPI_KEY!,
    };
}

// Validate on module load
export const env = validateEnv();
