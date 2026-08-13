'use client';

import React, { useEffect, useState } from 'react';
import type { AdContainerProps } from '@/lib/types/ads';
import { AdSidebar } from './ad-sidebar';
import { SponsoredUnit } from './sponsored-unit';
import { cn } from '@/lib/utils';

/** Matches fixed Header height (~61–68px + safe area). */
const HEADER_CLEAR =
    'pt-[calc(4.25rem+env(safe-area-inset-top,0px))] md:pt-[calc(4.5rem+env(safe-area-inset-top,0px))]';

/**
 * Listing layout:
 * Main content first; ad rails use a comfortable width on large screens only.
 */
export function AdContainer({
    children,
    leftAds,
    rightAds,
    header,
    contentClassName,
    clearFixedHeader = true,
}: AdContainerProps) {
    const hasLeft = Boolean(leftAds?.length);
    const hasRight = Boolean(rightAds?.length);
    const mobileAds = hasRight ? rightAds! : hasLeft ? leftAds! : [];
    const [mobileIndex, setMobileIndex] = useState(0);
    const [paused, setPaused] = useState(false);

    useEffect(() => {
        if (mobileAds.length <= 1 || paused) return;
        const id = window.setInterval(() => {
            setMobileIndex((i) => (i + 1) % mobileAds.length);
        }, 16000);
        return () => window.clearInterval(id);
    }, [mobileAds.length, paused]);

    if (!hasLeft && !hasRight && !header) {
        return (
            <div className={cn(clearFixedHeader && HEADER_CLEAR)}>{children}</div>
        );
    }

    const mobileAd = mobileAds[Math.min(mobileIndex, Math.max(mobileAds.length - 1, 0))];

    return (
        <div className={cn('relative w-full', clearFixedHeader && HEADER_CLEAR)}>
            {header ? <div className="w-full">{header}</div> : null}

            {mobileAd ? (
                <div
                    className="lg:hidden mx-auto w-full max-w-[1200px] px-4 sm:px-5 pt-3"
                    onMouseEnter={() => setPaused(true)}
                    onMouseLeave={() => setPaused(false)}
                >
                    <SponsoredUnit ad={mobileAd} compact />
                    {mobileAds.length > 1 ? (
                        <div className="mt-2 flex justify-center gap-1.5">
                            {mobileAds.map((a, i) => (
                                <button
                                    key={a.id}
                                    type="button"
                                    aria-label={`Sponsored ${i + 1}`}
                                    onClick={() => setMobileIndex(i)}
                                    className={cn(
                                        'h-1.5 rounded-full transition-all',
                                        i === mobileIndex
                                            ? 'w-4 bg-slate-400'
                                            : 'w-1.5 bg-slate-200',
                                    )}
                                />
                            ))}
                        </div>
                    ) : null}
                </div>
            ) : null}

            <div className="w-full bg-[#f3f6f8] dark:bg-slate-950/60 border-t border-slate-200/70 dark:border-slate-800">
                <div className="mx-auto w-full max-w-[1760px] flex flex-col xl:flex-row items-start gap-3 xl:gap-4 px-3 sm:px-4 lg:px-4 pt-0 pb-8 lg:pb-12">
                    {hasLeft ? (
                        <div className="hidden 2xl:block shrink-0 w-[168px] pt-5">
                            <AdSidebar ads={leftAds!} position="left" />
                        </div>
                    ) : null}

                    <div
                        className={cn(
                            'flex-1 min-w-0 w-full',
                            header && '-mt-5 sm:-mt-6 md:-mt-7',
                            !header && 'pt-4 lg:pt-5',
                            contentClassName,
                        )}
                    >
                        {children}
                    </div>

                    {hasRight ? (
                        <div className="hidden xl:block shrink-0 w-[168px] pt-5">
                            <AdSidebar ads={rightAds!} position="right" />
                        </div>
                    ) : null}
                </div>
            </div>
        </div>
    );
}
