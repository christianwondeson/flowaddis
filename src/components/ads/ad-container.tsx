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
            {/* Mobile Ad Banner - Top of page with auto-rotation */}
            {currentMobileAd && (
                <div className="xl:hidden bg-gradient-to-r from-teal-500 via-blue-500 to-blue-600 sticky top-0 z-40 shadow-lg">
                    <div className="container mx-auto px-3 py-3">
                        <a
                            href={currentMobileAd.linkUrl || '#'}
                            target={currentMobileAd.targetBlank ? '_blank' : '_self'}
                            rel={currentMobileAd.targetBlank ? 'noopener noreferrer' : undefined}
                            className="block"
                        >
                            <div className="relative h-24 sm:h-28 rounded-xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 border-2 border-white/20">
                                <img
                                    src={currentMobileAd.imageUrl}
                                    alt={currentMobileAd.altText}
                                    className="w-full h-full object-contain bg-white"
                                />
                            </div>
                        </a>
                        <div className="flex items-center justify-center gap-3 mt-2">
                            <span className="text-[10px] text-white/80 uppercase tracking-wider font-semibold">
                                Advertisement
                            </span>
                            {/* Rotation indicators */}
                            {mobileAds && mobileAds.length > 1 && (
                                <div className="flex gap-1.5">
                                    {mobileAds.map((_, index) => (
                                        <button
                                            key={index}
                                            onClick={(e) => {
                                                e.preventDefault();
                                                setCurrentMobileAdIndex(index);
                                            }}
                                            className={`h-1.5 rounded-full transition-all ${index === currentMobileAdIndex
                                                    ? 'bg-white w-6'
                                                    : 'bg-white/40 w-1.5 hover:bg-white/60'
                                                }`}
                                            aria-label={`View ad ${index + 1}`}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Desktop Layout */}
            <div className="hidden xl:flex items-start justify-center w-full">
                {/* Left Ad Sidebar - only on 2xl screens */}
                {hasLeftAds && (
                    <div className="hidden 2xl:block">
                        <AdSidebar ads={leftAds} position="left" />
                    </div>
                )}

                {/* Main Content */}
                <div className="flex-1 max-w-[1400px] w-full">
                    {children}
                </div>

                {/* Right Ad Sidebar - on xl and larger screens */}
                {hasRightAds && (
                    <div className="hidden xl:block">
                        <AdSidebar ads={rightAds} position="right" />
                    </div>
                )}
            </div>

            {/* Mobile/Tablet Content - without sidebars */}
            <div className="xl:hidden">
                {children}
            </div>
        </div>
    );
}
