import React from 'react';
import type { Hotel } from '@/types';

/** Inventory badge for guest hotel cards / detail. */
export function HotelInventoryBadge({
    inventorySource,
    className = '',
}: {
    inventorySource?: Hotel['inventory_source'] | string | null;
    className?: string;
}) {
    const source = inventorySource || 'rapidapi';
    const isDirect = source === 'bookaddis_direct' || source === 'pms_synced';

    return (
        <span
            className={
                isDirect
                    ? `inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wide bg-teal-600 text-white ${className}`
                    : `inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wide bg-slate-700/90 text-white ${className}`
            }
        >
            {isDirect ? 'BookAddis Direct' : 'Partner Listing'}
        </span>
    );
}

export function isBookaddisBookableHotel(hotel: Pick<Hotel, 'inventory_source' | 'bookable'>): boolean {
    if (hotel.bookable === true) return true;
    if (hotel.bookable === false) return false;
    const src = hotel.inventory_source;
    return src === 'bookaddis_direct' || src === 'pms_synced';
}
