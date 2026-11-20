'use client';

import React, { useEffect, useState } from 'react';
import { Preloader } from '@/components/ui/preloader';
import { requestLoading } from '@/lib/request-loading';

/**
 * Shows a brand preloader overlay while major blocking mutations are in flight.
 * Uses a 150ms debounce so fast requests complete without visual flicker.
 */
export function RequestLoadingProvider({ children }: { children: React.ReactNode }) {
    const [count, setCount] = useState(0);
    const [label, setLabel] = useState<string | null>(null);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        return requestLoading.subscribe((c, l) => {
            setCount(c);
            setLabel(l);
        });
    }, []);

    useEffect(() => {
        if (count > 0) {
            // Debounce appearance by 150ms to prevent preloader flicker on fast responses
            const timer = setTimeout(() => {
                setVisible(true);
            }, 150);
            return () => clearTimeout(timer);
        } else {
            setVisible(false);
        }
    }, [count]);

    return (
        <>
            {children}
            {visible && count > 0 && (
                <Preloader
                    fullScreen
                    size="lg"
                    label={label || 'Working on your request…'}
                />
            )}
        </>
    );
}
