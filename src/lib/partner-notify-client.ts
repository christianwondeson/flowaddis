import { auth } from '@/lib/firebase';

export async function notifyHotelPartner(payload: {
    to: string;
    userName: string;
    hotelName: string;
    decision: 'approved' | 'rejected' | 'received';
    notes?: string;
    portalUrl?: string;
}): Promise<{ sent: boolean }> {
    const token = await auth?.currentUser?.getIdToken();
    if (!token) throw new Error('Not signed in');
    const res = await fetch('/api/admin/partner-notify', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
        throw new Error(
            (data as { error?: string }).error || 'Failed to send email',
        );
    }
    return { sent: Boolean((data as { sent?: boolean }).sent) };
}
