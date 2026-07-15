import { fetchSignInMethodsForEmail } from 'firebase/auth';
import { auth } from '@/lib/firebase';

/** Firebase provider ids returned by {@link fetchSignInMethodsForEmail}. */
export async function getSignInMethodsForEmail(email: string): Promise<string[]> {
    const trimmed = email.trim();
    if (!auth || !trimmed.includes('@')) return [];
    try {
        return await fetchSignInMethodsForEmail(auth, trimmed);
    } catch {
        return [];
    }
}

export function isGoogleOnlySignIn(methods: string[]): boolean {
    return methods.length > 0 && methods.every((m) => m === 'google.com');
}

export function hasPasswordSignIn(methods: string[]): boolean {
    return methods.includes('password');
}
