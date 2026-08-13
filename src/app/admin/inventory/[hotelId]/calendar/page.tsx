'use client';

import { Suspense, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { RatesCalendarManager } from '@/components/inventory/rates-calendar-manager';
import { BookAddisLiveNote } from '@/components/hotel-portal/bookaddis-live-note';
import { adminInventoryFetch } from '@/lib/admin-inventory-api';
import { AdminLoader } from '@/components/ui/admin-loader';

export default function AdminInventoryCalendarPage() {
    const params = useParams();
    const hotelId = String(params.hotelId || '');
    const [status, setStatus] = useState<string | null>(null);

    useEffect(() => {
        if (!hotelId) return;
        void adminInventoryFetch<{ status?: string }>(`hotels/${hotelId}`)
            .then((h) => setStatus(h.status || null))
            .catch(() => setStatus(null));
    }, [hotelId]);

    return (
        <div className="space-y-4">
            <BookAddisLiveNote status={status} />
            <Suspense fallback={<AdminLoader label="Loading rates…" />}>
                <RatesCalendarManager mode="admin" />
            </Suspense>
        </div>
    );
}
