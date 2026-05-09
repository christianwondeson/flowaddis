/**
 * In-memory throttling for POST /api/auth/password-login (user enumeration / brute force).
 * Replace with Redis for multi-instance deployments.
 */

import { getClientIpFromHeaders } from '@/lib/auth-rate-limit';

export { getClientIpFromHeaders };

type Entry = {
    fails: number[];
    blockedUntil?: number;
};

const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILS_IN_WINDOW = 20;
const BLOCK_MS = 30 * 60 * 1000;

const store = new Map<string, Entry>();

function prune(ts: number[]): number[] {
    const cutoff = Date.now() - WINDOW_MS;
    return ts.filter((t) => t > cutoff);
}

export function isPasswordLoginIpBlocked(ip: string): { blocked: boolean; retryAfterSec?: number } {
    const e = store.get(ip);
    if (e?.blockedUntil && Date.now() < e.blockedUntil) {
        return {
            blocked: true,
            retryAfterSec: Math.max(1, Math.ceil((e.blockedUntil - Date.now()) / 1000)),
        };
    }
    return { blocked: false };
}

export function recordPasswordLoginFailure(ip: string): void {
    let e = store.get(ip) ?? { fails: [] };
    e.fails = prune(e.fails);
    e.fails.push(Date.now());
    if (e.fails.length >= MAX_FAILS_IN_WINDOW) {
        e.blockedUntil = Date.now() + BLOCK_MS;
        e.fails = [];
    }
    store.set(ip, e);
}

export function recordPasswordLoginSuccess(ip: string): void {
    store.delete(ip);
}
