'use client';

import React, { useState, useEffect } from 'react';
import { AdContainerProps } from '@/lib/types/ads';
import { AdSidebar } from './ad-sidebar';

export function AdContainer({ children, leftAds, rightAds }: AdContainerProps) {
    const hasLeftAds = leftAds && leftAds.length > 0;
    const hasRightAds = rightAds && rightAds.length > 0;
    const [currentMobileAdIndex, setCurrentMobileAdIndex] = useState(0);

    // If no ads, just return children
    if (!hasLeftAds && !hasRightAds) {
        return <>{children}</>;
    }

    // Use right ads for mobile banner (or left if right not available)
    const mobileAds = hasRightAds ? rightAds : leftAds;

    // Auto-rotate mobile ads every 8 seconds
    useEffect(() => {
        if (mobileAds && mobileAds.length > 1) {
            const interval = setInterval(() => {
                setCurrentMobileAdIndex((prev) => (prev + 1) % mobileAds.length);
            }, 8000);
            return () => clearInterval(interval);
        }
    }, [mobileAds]);

    const currentMobileAd = mobileAds?.[currentMobileAdIndex];

    return (
        <div className="relative w-full">
            {/* Mobile/Tablet Ad Banner - no upper space, compact */}
            {currentMobileAd && (
                <div className="lg:hidden pt-2">
                    <div className="container mx-auto px-3 sm:px-4 py-0">
                        <a
                            href={currentMobileAd.linkUrl || '#'}
                            target={currentMobileAd.targetBlank ? '_blank' : '_self'}
                            rel={currentMobileAd.targetBlank ? 'noopener noreferrer' : undefined}
                            className="block rounded-xl overflow-hidden border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md"
                        >
                            <div className="relative h-20 sm:h-24 overflow-hidden">
                                <img
                                    src={currentMobileAd.imageUrl}
                                    alt={currentMobileAd.altText}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <div className="flex items-center justify-between px-3 sm:px-4 py-2 bg-slate-950/95">
                                <div className="flex flex-col gap-0.5 min-w-0">
                                    <span className="text-[10px] text-teal-100/90 uppercase tracking-[0.16em] font-semibold">Ad · Sponsored</span>
                                    <span className="text-[11px] sm:text-xs text-slate-50 font-medium truncate">{currentMobileAd.altText}</span>
                                </div>
                                {mobileAds && mobileAds.length > 1 && (
                                    <div className="flex gap-1 ml-2">
                                        {mobileAds.map((_, index) => (
                                            <button
                                                key={index}
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    setCurrentMobileAdIndex(index);
                                                }}
                                                className={`h-1.5 rounded-full transition-all ${index === currentMobileAdIndex ? 'bg-teal-300 w-4' : 'bg-slate-600 w-1.5'}`}
                                                aria-label={`View ad ${index + 1}`}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        </a>
                    </div>
                </div>
            )}

            {/* Unified Layout - [Left Ad | Main Content | Right Ad], tight spacing for ads */}
            <div className="flex flex-col lg:flex-row items-stretch w-full gap-2 px-3 lg:px-4">
                {/* Left Ad Sidebar - sticky, visible on lg+ when left ads provided */}
                {hasLeftAds && (
                    <div className="hidden lg:block shrink-0 w-[200px] xl:w-[220px]">
                        <AdSidebar ads={leftAds} position="left" />
                    </div>
                )}

                {/* Main Content */}
                <div className="flex-1 min-w-0 pt-14 md:pt-16">
                    {children}
                </div>

                {/* Right Ad Sidebar - sticky, visible on lg+ when right ads provided */}
                {hasRightAds && (
                    <div className="hidden lg:block shrink-0 w-[200px] xl:w-[220px]">
                        <AdSidebar ads={rightAds} position="right" />
                    </div>
                )}
            </div>
        </div>
    );
}
