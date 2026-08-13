'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Preloader } from '@/components/ui/preloader';

/** Merged into Support & Disputes  keep URL for old bookmarks. */
export default function SuperAdminDisputedReviewsRedirect() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/admin/support?tab=reviews');
    }, [router]);

    return (
        <Preloader
            fullScreen
            size="lg"
            label="Opening Support & Disputes…"
        />
    );
}
