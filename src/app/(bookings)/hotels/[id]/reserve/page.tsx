'use client';

import { Suspense, useMemo } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import {
    HotelBookingSummary,
    type HotelReserveDraft,
} from '@/components/booking/hotel-booking-summary';
import { Preloader } from '@/components/ui/preloader';
import Link from 'next/link';
import { useTranslations } from '@/components/providers/locale-provider';

function ReserveInner() {
    const params = useParams();
    const sp = useSearchParams();
    const { t } = useTranslations();
    const hotelId = String(params.id || '');

    const draft = useMemo((): HotelReserveDraft | null => {
        try {
            const raw = sessionStorage.getItem('bookaddis_reserve_draft');
            if (raw) {
                const parsed = JSON.parse(raw) as HotelReserveDraft;
                if (parsed?.hotelId && String(parsed.hotelId) === hotelId) {
                    return parsed;
                }
            }
        } catch {
            /* ignore */
        }

        const hotelName = sp.get('name') || 'Hotel';
        const roomName = sp.get('room') || 'Room';
        const price = Number(sp.get('price') || 0);
        const checkIn = sp.get('checkIn') || sp.get('checkInDate') || '';
        const checkOut = sp.get('checkOut') || sp.get('checkOutDate') || '';
        if (!checkIn || !checkOut || !price) return null;

        return {
            hotelId,
            hotelName,
            roomName,
            roomQuantity: Math.max(1, Number(sp.get('rooms') || 1)),
            price,
            checkIn,
            checkOut,
            adults: Number(sp.get('adults') || 2),
            children: Number(sp.get('children') || 0),
            inventorySource: sp.get('inventory_source') || undefined,
            roomBlockId: sp.get('roomBlockId') || undefined,
            roomTypeId: sp.get('roomTypeId') || undefined,
            ratePlanId: sp.get('ratePlanId') || undefined,
        };
    }, [hotelId, sp]);

    if (!draft) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4 px-4">
                <p className="text-sm text-slate-600 text-center max-w-md">
                    {t('reserve.noSelection')}
                </p>
                <Link
                    href={`/hotels/${hotelId}?inventory_source=bookaddis_direct#rooms`}
                    className="inline-flex items-center gap-2 rounded-xl bg-brand-primary px-4 py-2.5 text-sm font-bold text-white"
                >
                    {t('reserve.backToHotelRooms')}
                </Link>
            </div>
        );
    }

    const backParams = new URLSearchParams();
    if (draft.checkIn) backParams.set('checkIn', draft.checkIn);
    if (draft.checkOut) backParams.set('checkOut', draft.checkOut);
    if (draft.adults) backParams.set('adults', String(draft.adults));
    if (draft.children != null) backParams.set('children', String(draft.children));
    backParams.set('rooms', String(draft.roomQuantity || 1));
    if (draft.hotelName) backParams.set('name', draft.hotelName);
    backParams.set(
        'inventory_source',
        draft.inventorySource || 'bookaddis_direct',
    );
    backParams.set('bookable', '1');
    for (const key of [
        'searchQuery',
        'searchDestId',
        'searchDestType',
        'location',
        'image',
    ] as const) {
        const v = sp.get(key);
        if (v) backParams.set(key, v);
    }
    const backHref = `/hotels/${hotelId}?${backParams.toString()}#rooms`;

    return <HotelBookingSummary draft={draft} backHref={backHref} />;
}

export default function HotelReservePage() {
    const { t } = useTranslations();
    return (
        <Suspense
            fallback={
                <div className="min-h-screen flex items-center justify-center bg-slate-50">
                    <Preloader size="lg" label={t('reserve.preparing')} />
                </div>
            }
        >
            <ReserveInner />
        </Suspense>
    );
}
