'use client';

import { useHotelPortalOptional } from '@/components/hotel-portal/hotel-portal-context';
import { useParams } from 'next/navigation';

type Props = {
    /** When set (e.g. Super Admin inventory), skip portal context. */
    status?: string | null;
};

/** Reminds operators that calendar/rooms feed guest BookAddis when published. */
export function BookAddisLiveNote({ status: statusProp }: Props) {
    const params = useParams();
    const hotelId = typeof params?.hotelId === 'string' ? params.hotelId : '';
    const portal = useHotelPortalOptional();
    const fromPortal = portal?.hotels.find((h) => h.id === hotelId)?.status;
    const status = statusProp !== undefined ? statusProp : fromPortal;
    const published = status === 'published';

    return (
        <div
            className={
                published
                    ? 'rounded-lg border border-green-200 bg-green-50/80 px-3 py-2 text-xs text-green-950'
                    : 'rounded-lg border border-amber-200 bg-amber-50/80 px-3 py-2 text-xs text-amber-950'
            }
        >
            {published ? (
                <>
                    <strong>Live on BookAddis:</strong> room types, bed setup, allotment, and
                    daily prices you save here are what guests see when they search and book
                    this property.
                </>
            ) : (
                <>
                    <strong>Draft:</strong> you can set rooms and prices, but guests will not
                    see this hotel until a BookAddis Super Admin publishes it under{' '}
                    <em>Hotels</em> (Super Admin).
                </>
            )}
        </div>
    );
}
