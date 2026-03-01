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
            {/* Mobile Ad Banner - Inline below header, reduced padding to avoid extra gap */}
            {currentMobileAd && (
                <div className="xl:hidden pt-14 md:pt-16">
                    <div className="container mx-auto px-4 sm:px-6 py-2">
                        <a
                            href={currentMobileAd.linkUrl || '#'}
                            target={currentMobileAd.targetBlank ? '_blank' : '_self'}
                            rel={currentMobileAd.targetBlank ? 'noopener noreferrer' : undefined}
                            className="block rounded-2xl overflow-hidden border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow"
                        >
                            <div className="relative h-20 sm:h-24 rounded-2xl overflow-hidden">
                                <img
                                    src={currentMobileAd.imageUrl}
                                    alt={currentMobileAd.altText}
                                    className="w-full h-full object-contain bg-gray-50"
                                />
                            </div>
                            <div className="flex items-center justify-between px-3 py-1.5">
                                <span className="text-[10px] text-gray-400 uppercase tracking-wider">Ad</span>
                                {mobileAds && mobileAds.length > 1 && (
                                    <div className="flex gap-1">
                                        {mobileAds.map((_, index) => (
                                            <button
                                                key={index}
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    setCurrentMobileAdIndex(index);
                                                }}
                                                className={`h-1 rounded-full transition-all ${index === currentMobileAdIndex ? 'bg-teal-600 w-4' : 'bg-gray-300 w-1'}`}
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

            {/* Desktop Layout - mockup: [Filter | Listings | Advertisement], tight padding */}
            <div className="hidden xl:flex items-start justify-between w-full gap-4 px-4 lg:px-6">
                {/* Left Ad Sidebar - only on 2xl screens */}
                {hasLeftAds && (
                    <div className="hidden 2xl:block shrink-0">
                        <AdSidebar ads={leftAds} position="left" />
                    </div>
                )}

                {/* Main Content - takes remaining space, no max-width to fill layout */}
                <div className="flex-1 min-w-0 mt-16">
                    {children}
                </div>

                {/* Right Ad Sidebar - mockup: Advertisement on far right */}
                {hasRightAds && (
                    <div className="shrink-0">
                        <AdSidebar ads={rightAds} position="right" />
                    </div>
                )}
            </div>

            {/* Mobile/Tablet Content - without sidebars, no extra top padding (handled by page) */}
            <div className="xl:hidden">
                {children}
            </div>
        </div>
    );
}
