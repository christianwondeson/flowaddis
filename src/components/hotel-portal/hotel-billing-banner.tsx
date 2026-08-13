'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { hotelAdminFetch } from '@/lib/hotel-admin-api';

type Access = {
    allowed: boolean;
    reason: string;
    status: string;
};

/**
 * Soft notice near expiry / past due while still on an allowed page.
 * Hard block is handled by HotelSubscriptionGate (redirect to Billing).
 */
export function HotelBillingBanner({ hotelId }: { hotelId: string }) {
    const [access, setAccess] = useState<Access | null>(null);

    useEffect(() => {
        if (!hotelId) return;
        let cancelled = false;
        void hotelAdminFetch<{ access: Access }>(`hotels/${hotelId}/billing`)
            .then((ov) => {
                if (!cancelled) setAccess(ov.access);
            })
            .catch(() => {
                if (!cancelled) setAccess(null);
            });
        return () => {
            cancelled = true;
        };
    }, [hotelId]);

    if (!access || access.allowed) return null;

    return (
        <div className="mb-4 sm:mb-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-amber-700" />
            <div className="min-w-0 flex-1">
                <p className="font-semibold">Subscription needs attention</p>
                <p className="text-amber-900/90 mt-0.5">{access.reason}</p>
                <Link
                    href={`/admin/hotel/${hotelId}/billing`}
                    className="inline-block mt-2 font-semibold text-teal-800 hover:underline"
                >
                    Go to Billing →
                </Link>
            </div>
        </div>
    );
}
