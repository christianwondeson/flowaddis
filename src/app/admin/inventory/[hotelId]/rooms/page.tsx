'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { RoomsManager } from '@/components/inventory/rooms-manager';
import { BookAddisLiveNote } from '@/components/hotel-portal/bookaddis-live-note';
import { adminInventoryFetch } from '@/lib/admin-inventory-api';

export default function AdminInventoryRoomsPage() {
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
            <RoomsManager
                hotelId={hotelId}
                mode="admin"
                calendarHref={`/admin/inventory/${hotelId}/calendar`}
            />
        </div>
    );
}
