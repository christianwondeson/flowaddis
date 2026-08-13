'use client';

import React, { useEffect, useState } from 'react';
import { Preloader } from '@/components/ui/preloader';
import { requestLoading } from '@/lib/request-loading';

/**
 * Shows a brand preloader overlay while Nest/admin fetches are in flight.
 * Mount once in admin (or root) layout.
 */
export function RequestLoadingProvider({ children }: { children: React.ReactNode }) {
    const [count, setCount] = useState(0);
    const [label, setLabel] = useState<string | null>(null);

    useEffect(() => {
        return requestLoading.subscribe((c, l) => {
            setCount(c);
            setLabel(l);
        });
    }, []);

    return (
        <>
            {children}
            {count > 0 && (
                <Preloader
                    fullScreen
                    size="lg"
                    label={label || 'Working on your request…'}
                />
            )}
        </>
    );
}
