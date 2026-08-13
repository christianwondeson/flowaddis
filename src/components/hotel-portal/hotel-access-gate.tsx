'use client';

import Link from 'next/link';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Building2 } from 'lucide-react';
import { useHotelPortal } from '@/components/hotel-portal/hotel-portal-context';
import { useAuth } from '@/components/providers/auth-provider';
import { AdminLoader } from '@/components/ui/admin-loader';

/**
 * Stops hotel-scoped pages from hammering Nest when the signed-in operator
 * has no membership for the URL hotelId (the 403 source).
 * Uses a single AdminLoader  never stack with page loaders + global Preloader.
 */
export function HotelAccessGate({ children }: { children: React.ReactNode }) {
    const params = useParams();
    const pathname = usePathname();
    const router = useRouter();
    const { user } = useAuth();
    const { hotels, loading, error } = useHotelPortal();

    const hotelId = typeof params?.hotelId === 'string' ? params.hotelId : '';
    const isPicker = pathname === '/admin/hotel' || pathname === '/admin/hotel/';
    /** Old empty “momona” row  live inventory/bookings are on Momona Hotel. */
    const LIVE_MOMONA_ID = '63acf293-7df4-4567-8c82-0660d7bf6a0b';
    const ARCHIVED_MOMONA_ID = 'c4dc1b1e-f78a-45c4-9592-d733ef13fbe2';
    const allowed = !hotelId || hotels.some((h) => h.id === hotelId);

    useEffect(() => {
        if (!hotelId || isPicker) return;
        if (hotelId === ARCHIVED_MOMONA_ID) {
            router.replace(pathname.replace(ARCHIVED_MOMONA_ID, LIVE_MOMONA_ID));
            return;
        }
        if (loading || error) return;
        if (!allowed) {
            router.replace('/admin/hotel');
        }
    }, [allowed, error, hotelId, isPicker, loading, pathname, router]);

    if (isPicker || !hotelId) {
        return <>{children}</>;
    }

    // First membership load only  once hotels exist, render children immediately.
    if (loading && hotels.length === 0) {
        return <AdminLoader label="Loading property…" />;
    }

    if (!allowed && !loading) {
        const pending = user?.hotelPartnerStatus === 'pending';
        return (
            <div className="rounded-xl border border-amber-200 bg-amber-50/70 px-5 py-8 text-center max-w-lg mx-auto">
                <Building2 className="w-8 h-8 text-amber-700 mx-auto mb-3" />
                <h2 className="font-bold text-brand-dark">No access to this property</h2>
                <p className="text-sm text-slate-600 mt-2">
                    {pending
                        ? 'Your partner request is still pending Super Admin approval. You will get portal access after a hotel is assigned.'
                        : 'This hotel is not assigned to your account. Ask a BookAddis Super Admin to grant membership, then open it from Your properties.'}
                </p>
                <Link
                    href="/admin/hotel"
                    className="inline-block mt-4 text-sm font-semibold text-brand-primary hover:underline"
                >
                    Back to your properties
                </Link>
            </div>
        );
    }

    return <>{children}</>;
}
