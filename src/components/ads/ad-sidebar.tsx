'use client';

import React, { useState, useEffect } from 'react';
import { AdSidebarProps } from '@/lib/types/ads';

export function AdSidebar({ ads, position }: AdSidebarProps) {
    const [currentAdIndex, setCurrentAdIndex] = useState(0);

    useEffect(() => {
        if (ads.length > 1) {
            const interval = setInterval(() => {
                setCurrentAdIndex((prev) => (prev + 1) % ads.length);
            }, 10000); // Rotate every 10 seconds

            return () => clearInterval(interval);
        }
    }, [ads.length]);

    if (!ads || ads.length === 0) {
        return null;
    }

    const currentAd = ads[currentAdIndex];

    const handleAdClick = () => {
        // Track ad click (can be extended with analytics)
    };

    const adContent = (
        <div className="relative w-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm group transition-shadow hover:shadow-md">
            <div className="relative w-full aspect-3/4 flex items-center justify-center overflow-hidden">
                <img
                    src={currentAd.imageUrl}
                    alt={currentAd.altText}
                    className="w-full h-full object-cover"
                />
            </div>
            <div className="flex items-center justify-between gap-2 px-3 py-2 bg-slate-950/95">
                <div className="flex flex-col gap-0.5 min-w-0">
                    <span className="text-[10px] text-teal-100/90 uppercase tracking-[0.16em] font-semibold">Ad · Sponsored</span>
                    <span className="text-[11px] text-slate-50 font-medium truncate">{currentAd.altText}</span>
                </div>
                {ads.length > 1 && (
                    <div className="flex items-center gap-1 shrink-0">
                            {ads.map((_, index) => (
                                <button
                                    key={index}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setCurrentAdIndex(index);
                                    }}
                                    className={`h-1.5 rounded-full transition-all ${index === currentAdIndex
                                        ? 'w-4 bg-teal-300'
                                        : 'w-1.5 bg-slate-600 hover:bg-slate-400'
                                        }`}
                                    aria-label={`Go to ad ${index + 1}`}
                                />
                            ))}
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <aside
            className={`sticky top-24 z-30 shrink-0 self-start ${position === 'left' ? 'order-first' : 'order-last'}`}
        >
            <div className="w-full">
                {currentAd.linkUrl ? (
                    <a
                        href={currentAd.linkUrl}
                        target={currentAd.targetBlank ? '_blank' : '_self'}
                        rel={currentAd.targetBlank ? 'noopener noreferrer' : undefined}
                        onClick={handleAdClick}
                        className="block"
                    >
                        {adContent}
                    </a>
                ) : (
                    <div onClick={handleAdClick}>{adContent}</div>
                )}
            </div>
        </aside>
    );
}
