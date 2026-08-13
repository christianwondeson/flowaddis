'use client';

import { Suspense } from 'react';
import { RatesCalendarManager } from '@/components/inventory/rates-calendar-manager';
import { AdminLoader } from '@/components/ui/admin-loader';

export default function HotelCalendarPage() {
    return (
        <Suspense fallback={<AdminLoader label="Loading rates…" />}>
            <RatesCalendarManager mode="portal" />
        </Suspense>
    );
}
