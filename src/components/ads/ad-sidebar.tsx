'use client';

import React, { useEffect, useState } from 'react';
import type { AdSidebarProps } from '@/lib/types/ads';
import { SponsoredUnit } from './sponsored-unit';
import { cn } from '@/lib/utils';

export function AdSidebar({ ads, position }: AdSidebarProps) {
    const [index, setIndex] = useState(0);
    const [paused, setPaused] = useState(false);

    useEffect(() => {
        if (ads.length <= 1 || paused) return;
        const id = window.setInterval(() => {
            setIndex((i) => (i + 1) % ads.length);
        }, 16000);
        return () => window.clearInterval(id);
    }, [ads.length, paused]);

    if (!ads?.length) return null;

    const ad = ads[Math.min(index, ads.length - 1)];

    return (
        <aside
            className={cn(
                'sticky top-[calc(5rem+env(safe-area-inset-top,0px))] z-20 self-start w-full max-h-[calc(100vh-6rem)] overflow-y-auto scrollbar-hide opacity-95 hover:opacity-100 transition-opacity',
                position === 'left' ? 'order-first' : 'order-last',
            )}
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            aria-label="Sponsored"
        >
            <SponsoredUnit ad={ad} />
            {ads.length > 1 ? (
                <div className="mt-2.5 flex items-center justify-center gap-1.5">
                    {ads.map((item, i) => (
                        <button
                            key={item.id}
                            type="button"
                            aria-label={`Sponsored ${i + 1}`}
                            onClick={() => setIndex(i)}
                            className={cn(
                                'h-1.5 rounded-full transition-all',
                                i === index
                                    ? 'w-4 bg-slate-400'
                                    : 'w-1.5 bg-slate-200 hover:bg-slate-300',
                            )}
                        />
                    ))}
                </div>
            ) : null}
        </aside>
    );
}
