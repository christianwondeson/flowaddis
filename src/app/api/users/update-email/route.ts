import { NextResponse } from 'next/server';
import { verifyFirebaseIdToken } from '@/lib/verify-firebase-id-token';
import {
    getAdminAuth,
    getAdminFirestore,
    isFirebaseAdminConfigured,
} from '@/lib/server/firebase-admin';
import { verifyApprovedAdminFromFirestore } from '@/lib/server/firestore-admin-access';
import { validateEmail } from '@/lib/phone-validation';

export async function POST(req: Request) {
    // 1. Verify Bearer token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    const token = authHeader.slice('Bearer '.length).trim();
    if (!token) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    let payload: Record<string, unknown>;
    try {
        payload = await verifyFirebaseIdToken(token);
    } catch {
        return NextResponse.json({ error: 'Invalid or expired session' }, { status: 401 });
    }

    const callerUid = ((payload.sub as string) || (payload.user_id as string) || '').trim();
    if (!callerUid) {
        return NextResponse.json({ error: 'Invalid authentication claims' }, { status: 401 });
    }

    // 2. Parse body
    let body: { targetUid?: string; newEmail?: string };
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: 'Invalid JSON request body' }, { status: 400 });
    }

    const targetUid = (body.targetUid || callerUid).trim();
    const newEmail = (body.newEmail || '').trim().toLowerCase();

    if (!targetUid) {
        return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const emailCheck = validateEmail(newEmail);
    if (!emailCheck.isValid) {
        return NextResponse.json(
            { error: emailCheck.error || 'Please enter a valid email address' },
            { status: 400 },
        );
    }

    // 3. Permission check:
    // Regular users can only update their OWN email.
    // Super Admins can update any user's email.
    if (callerUid !== targetUid) {
        const adminCheck = await verifyApprovedAdminFromFirestore(callerUid);
        if (!adminCheck.ok) {
            return NextResponse.json(
                {
                    error:
                        'Permission denied. Only Super Admins can update email addresses for other users.',
                },
                { status: 403 },
            );
        }
    }

    if (!isFirebaseAdminConfigured()) {
        return NextResponse.json(
            { error: 'Firebase Admin SDK is not configured on the server.' },
            { status: 503 },
        );
    }

    try {
        const adminAuth = getAdminAuth();
        const adminFirestore = getAdminFirestore();

        // 4. Update in Firebase Authentication
        await adminAuth.updateUser(targetUid, {
            email: newEmail,
            emailVerified: true,
        });

        // 5. Update in Firestore users collection
        await adminFirestore.collection('users').doc(targetUid).set(
            {
                email: newEmail,
                updatedAt: new Date().toISOString(),
            },
            { merge: true },
        );

        return NextResponse.json({
            ok: true,
            targetUid,
            email: newEmail,
            message: 'Email successfully updated in Firebase Authentication and Firestore database.',
        });
    } catch (err: any) {
        console.error('[api/users/update-email error]', err);
        const code = err?.code || '';
        if (code === 'auth/email-already-exists') {
            return NextResponse.json(
                { error: 'The email address is already in use by another account.' },
                { status: 409 },
            );
        }
        if (code === 'auth/invalid-email') {
            return NextResponse.json(
                { error: 'Invalid email address format.' },
                { status: 400 },
            );
        }
        if (code === 'auth/user-not-found') {
            return NextResponse.json(
                { error: 'User account not found in Firebase Authentication.' },
                { status: 404 },
            );
        }
        return NextResponse.json(
            { error: err?.message || 'Failed to update email in Firebase Authentication' },
            { status: 500 },
        );
    }
}
