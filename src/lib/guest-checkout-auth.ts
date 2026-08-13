/**
 * Guest checkout auth for Nest create-session (needs a Firebase ID token).
 *
 * Prefer Admin-minted custom tokens (ephemeral guest_* UIDs, email NOT on Auth).
 * Client anonymous sign-in is a last resort  Identity Platform often blocks it
 * with ADMIN_ONLY_OPERATION.
 */

import {
    signInAnonymously,
    signInWithCustomToken,
    type User as FirebaseUser,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';

export type GuestCheckoutContact = {
    email: string;
    phone?: string;
    name?: string;
};

function authErrorCode(error: unknown): string {
    if (typeof error === 'object' && error && 'code' in error) {
        return String((error as { code?: unknown }).code || '');
    }
    return '';
}

function authErrorMessage(error: unknown): string {
    if (error instanceof Error) return error.message;
    return String(error);
}

function isAnonymousBlocked(error: unknown): boolean {
    const code = authErrorCode(error);
    const msg = authErrorMessage(error);
    return (
        code === 'auth/operation-not-allowed' ||
        code === 'auth/admin-restricted-operation' ||
        msg.includes('ADMIN_ONLY_OPERATION') ||
        msg.includes('OPERATION_NOT_ALLOWED')
    );
}

function hasGuestContact(contact?: GuestCheckoutContact): contact is GuestCheckoutContact {
    return Boolean(
        contact?.email?.includes('@') &&
            contact.phone &&
            contact.phone.replace(/\D/g, '').length >= 8,
    );
}

async function signInWithAdminGuestToken(contact: GuestCheckoutContact): Promise<FirebaseUser> {
    if (!auth) {
        throw new Error('Authentication is not available. Refresh the page and try again.');
    }

    const res = await fetch('/api/checkout/guest-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            email: contact.email.trim().toLowerCase(),
            phone: contact.phone!.trim(),
            ...(contact.name ? { name: contact.name.trim() } : {}),
        }),
    });

    const data = (await res.json().catch(() => ({}))) as {
        customToken?: string;
        error?: string;
        message?: string;
    };

    if (!res.ok || !data.customToken) {
        throw new Error(
            data.message ||
                data.error ||
                'Could not start guest checkout. Please sign in and try again.',
        );
    }

    const cred = await signInWithCustomToken(auth, data.customToken);
    return cred.user;
}

/**
 * Returns a Firebase ID token for checkout.
 * Signed-in users keep their session; visitors get a silent guest session.
 */
export async function ensureCheckoutIdToken(
    contact?: GuestCheckoutContact,
): Promise<string> {
    if (!auth) {
        throw new Error('Authentication is not available. Refresh the page and try again.');
    }

    const existing = auth.currentUser;
    if (existing) {
        return existing.getIdToken(true);
    }

    // Guest pay with contact → Admin custom token (does not claim email in Firebase Auth).
    if (hasGuestContact(contact)) {
        const user = await signInWithAdminGuestToken(contact);
        return user.getIdToken(true);
    }

    // Last resort: client anonymous (often disabled on Identity Platform).
    try {
        const cred = await signInAnonymously(auth);
        return cred.user.getIdToken(true);
    } catch (error) {
        if (isAnonymousBlocked(error)) {
            throw new Error(
                'Guest checkout needs your email and phone. Go back and enter contact details, or sign in.',
            );
        }
        throw error instanceof Error
            ? error
            : new Error('Could not start guest checkout. Please sign in and try again.');
    }
}

/** Firebase UIDs used for guest checkout (custom-token path). */
export function isCheckoutGuestUid(uid: string | null | undefined): boolean {
    return Boolean(uid && uid.startsWith('guest_'));
}
