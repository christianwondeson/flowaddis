'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { hotelAdminFetch } from '@/lib/hotel-admin-api';
import { formatAdminDate } from '@/lib/admin-date-format';

type CommissionInvoice = {
    id: string;
    amount: number;
    currency: string;
    period_start?: string | null;
    period_end?: string | null;
    due_by?: string | null;
};

type CommissionOutstanding = {
    has_unpaid: boolean;
    invoice: CommissionInvoice | null;
};

/**
 * Booking.com-style alert when the hotel has an unpaid commission invoice.
 */
export function HotelBillingBanner({ hotelId }: { hotelId: string }) {
    const [outstanding, setOutstanding] = useState<CommissionOutstanding | null>(
        null,
    );

    useEffect(() => {
        if (!hotelId) return;
        let cancelled = false;
        void hotelAdminFetch<{ commission: CommissionOutstanding }>(
            `hotels/${hotelId}/billing`,
        )
            .then((ov) => {
                if (!cancelled) setOutstanding(ov.commission);
            })
            .catch(() => {
                if (!cancelled) setOutstanding(null);
            });
        return () => {
            cancelled = true;
        };
    }, [hotelId]);

    if (!outstanding?.has_unpaid || !outstanding.invoice) return null;

    const inv = outstanding.invoice;
    const period =
        inv.period_start && inv.period_end
            ? `${formatAdminDate(inv.period_start)} – ${formatAdminDate(inv.period_end)}`
            : null;

    return (
        <div className="mb-4 sm:mb-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-amber-700" />
            <div className="min-w-0 flex-1">
                <p className="font-semibold">You have an unpaid commission invoice</p>
                <p className="text-amber-900/90 mt-0.5">
                    {inv.currency} {Number(inv.amount).toLocaleString()}
                    {period ? ` · ${period}` : ''}
                    {inv.due_by
                        ? ` · Due by ${formatAdminDate(inv.due_by)}`
                        : ''}
                </p>
                <Link
                    href={`/admin/hotel/${hotelId}/billing`}
                    className="inline-block mt-2 font-semibold text-teal-800 hover:underline"
                >
                    Go to Invoices →
                </Link>
            </div>
        </div>
    );
}
