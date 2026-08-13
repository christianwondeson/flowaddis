'use client';

import { useParams } from 'next/navigation';
import { RoomsManager } from '@/components/inventory/rooms-manager';

export default function HotelRoomsPage() {
    const params = useParams();
    const hotelId = String(params.hotelId || '');
    return (
        <RoomsManager
            hotelId={hotelId}
            mode="portal"
            calendarHref={`/admin/hotel/${hotelId}/calendar`}
            showLiveNote
        />
    );
}
