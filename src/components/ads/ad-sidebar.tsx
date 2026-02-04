'use client';

import React, { useState, useEffect } from 'react';
import { AdSidebarProps, AdConfig } from '@/lib/types/ads';

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
        <div className="relative w-full h-auto overflow-hidden rounded-lg shadow-sm border border-gray-100 bg-white group hover:shadow-md transition-shadow">
            <img
                src={currentAd.imageUrl}
                alt={currentAd.altText}
                className="w-full h-auto object-cover"
            />
            {ads.length > 1 && (
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {ads.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => setCurrentAdIndex(index)}
                            className={`w-2 h-2 rounded-full transition-all ${index === currentAdIndex
                                    ? 'bg-white w-4'
                                    : 'bg-white/50 hover:bg-white/75'
                                }`}
                            aria-label={`Go to ad ${index + 1}`}
                        />
                    ))}
                </div>
            )}
        </div>
    );

    return (
        <aside
            className={`hidden xl:block sticky top-24 ${position === 'left' ? 'mr-6' : 'ml-6'
                }`}
        >
            <div className="w-[300px] space-y-4">
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
                <div className="text-center">
                    <span className="text-xs text-gray-400 uppercase tracking-wider">Advertisement</span>
                </div>
            </div>
        </aside>
    );
}
