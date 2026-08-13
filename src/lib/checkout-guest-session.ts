import type { GuestCheckoutContact } from '@/lib/guest-checkout-auth';

const STORAGE_KEY = 'bookaddis_checkout_guest';

/** Persist guest contact so MPGS return can re-mint a Firebase token. */
export function storeCheckoutGuestContact(contact: GuestCheckoutContact): void {
    try {
        sessionStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({
                email: contact.email.trim().toLowerCase(),
                phone: contact.phone?.trim() || '',
                ...(contact.name ? { name: contact.name.trim() } : {}),
            }),
        );
    } catch {
        /* ignore */
    }
}

export function readCheckoutGuestContact(): GuestCheckoutContact | null {
    try {
        const raw = sessionStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        const data = JSON.parse(raw) as Partial<GuestCheckoutContact>;
        if (
            typeof data.email !== 'string' ||
            !data.email.includes('@') ||
            typeof data.phone !== 'string' ||
            data.phone.replace(/\D/g, '').length < 8
        ) {
            return null;
        }
        return {
            email: data.email.trim().toLowerCase(),
            phone: data.phone.trim(),
            ...(typeof data.name === 'string' && data.name.trim()
                ? { name: data.name.trim() }
                : {}),
        };
    } catch {
        return null;
    }
}
