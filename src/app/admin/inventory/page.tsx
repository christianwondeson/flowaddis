'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AdminLoader } from '@/components/ui/admin-loader';

/**
 * Legacy "Manage hotels" list  merged into /admin/partners?tab=hotels.
 * Per-hotel routes under /admin/inventory/[hotelId] remain.
 */
export default function AdminInventoryRedirectPage() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/admin/partners?tab=hotels');
    }, [router]);

    return <AdminLoader label="Opening Hotels…" />;
}
