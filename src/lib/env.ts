/**
 * Environment Variable Validation
 * 
 * This module validates that all required environment variables are present
 * and provides type-safe access to them. The app will fail fast on startup
 * if any required variables are missing.
 */

interface EnvConfig {
    NEXT_PUBLIC_RAPIDAPI_KEY: string;
    // Add other required env vars here as needed
}

function validateEnv(): EnvConfig {
    const errors: string[] = [];

    // Check for required environment variables
    const NEXT_PUBLIC_RAPIDAPI_KEY = process.env.NEXT_PUBLIC_RAPIDAPI_KEY;

    if (!NEXT_PUBLIC_RAPIDAPI_KEY) {
        errors.push('NEXT_PUBLIC_RAPIDAPI_KEY is required but not set');
    }

    // If there are any errors, throw with helpful message
    if (errors.length > 0) {
        throw new Error(
            `Missing required environment variables:\n${errors.map(e => `  - ${e}`).join('\n')}\n\n` +
            `Please check your .env.local file and ensure all required variables are set.\n` +
            `See .env.example for the complete list of required variables.`
        );
    }

    return {
        NEXT_PUBLIC_RAPIDAPI_KEY: NEXT_PUBLIC_RAPIDAPI_KEY!,
    };
}

// Validate on module load
export const env = validateEnv();
