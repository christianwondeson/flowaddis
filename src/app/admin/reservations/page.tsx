'use client';

import { Suspense } from 'react';
import { AdminLoader } from '@/components/ui/admin-loader';
import AdminReservationsInner from './reservations-inner';

export default function AdminReservationsPage() {
    return (
        <Suspense
            fallback={
                <div className="p-6">
                    <AdminLoader label="Loading reservations…" />
                </div>
            }
        >
            <AdminReservationsInner />
        </Suspense>
    );
}
