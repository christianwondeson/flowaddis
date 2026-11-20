'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AdminLoader } from '@/components/ui/admin-loader';

/** Merged into Support & Disputes — keep URL for old bookmarks. */
export default function SuperAdminDisputedReviewsRedirect() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/admin/support?tab=reviews');
    }, [router]);

    return (
        <div className="py-20 flex justify-center items-center">
            <AdminLoader label="Opening Support & Disputes…" />
        </div>
    );
}
