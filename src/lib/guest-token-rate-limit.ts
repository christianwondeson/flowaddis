/**
 * Simple in-memory rate limit for guest checkout token minting.
 * Softens abuse without Redis; resets on process restart (acceptable for Next).
 */

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

export function assertGuestTokenRateLimit(params: {
    ip: string;
    email: string;
}): { ok: true } | { ok: false; retryAfterSec: number } {
    const now = Date.now();
    const windowMs = 60 * 60 * 1000; // 1 hour

    const checks: Array<{ key: string; limit: number }> = [
        { key: `ip:${params.ip || 'unknown'}`, limit: 20 },
        { key: `email:${params.email}`, limit: 8 },
    ];

    for (const { key, limit } of checks) {
        let b = buckets.get(key);
        if (!b || now >= b.resetAt) {
            b = { count: 0, resetAt: now + windowMs };
            buckets.set(key, b);
        }
        if (b.count >= limit) {
            return {
                ok: false,
                retryAfterSec: Math.max(1, Math.ceil((b.resetAt - now) / 1000)),
            };
        }
    }

    for (const { key } of checks) {
        const b = buckets.get(key)!;
        b.count += 1;
    }

    // Opportunistic cleanup
    if (buckets.size > 5000) {
        for (const [k, b] of buckets) {
            if (now >= b.resetAt) buckets.delete(k);
        }
    }

    return { ok: true };
}
