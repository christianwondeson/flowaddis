import { toast } from 'sonner';
import { getFirebaseAuthUserMessage } from '@/lib/firebase-auth-user-message';

/**
 * Displays a Firebase Auth error via toast using safe copy only (no raw API bodies).
 */
export function handleAuthError(error: unknown): void {
    toast.error(getFirebaseAuthUserMessage(error, 'toast'));
}
