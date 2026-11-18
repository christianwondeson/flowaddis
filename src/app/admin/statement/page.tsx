'use client';

import { Suspense } from 'react';
import { AdminLoader } from '@/components/ui/admin-loader';
import AdminStatementInner from './statement-inner';

/** Super Admin portfolio statement (Booking.com Finance → Reservations statement). */
export default function AdminStatementPage() {
    return (
        <Suspense
            fallback={
                <div className="p-6">
                    <AdminLoader label="Loading statement…" />
                </div>
            }
        >
            <AdminStatementInner />
        </Suspense>
    );
}
