"use client";

import React, { useMemo, useRef, useState } from 'react';
import { Camera, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { APP_CONSTANTS } from '@/lib/constants';
import { resolveStrapiFileUrl } from '@/lib/admin-cms-client';

interface HotelDetailGalleryProps {
    images: string[];
    loading?: boolean;
    /** Fallback when API returns 500 or image fails. */
    placeholderImage?: string;
    hotelName?: string;
}

const DEFAULT_PLACEHOLDER =
    APP_CONSTANTS.ASSETS?.HOTEL_PLACEHOLDER ||
    'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80';

function normalizeUrl(url: string, placeholder: string): string {
    if (!url) return placeholder;
    return resolveStrapiFileUrl(url) || url;
}

/**
 * Booking.com / Expedia-style photo mosaic for hotel detail.
 */
export const HotelDetailGallery: React.FC<HotelDetailGalleryProps> = ({
    images,
    loading = false,
    placeholderImage,
    hotelName = 'Hotel',
}) => {
    const PLACEHOLDER_IMG = placeholderImage || DEFAULT_PLACEHOLDER;
    const safeImages = useMemo(() => {
        const list = (images || [])
            .filter((url): url is string => typeof url === 'string' && url.length > 0)
            .map((u) => normalizeUrl(u, PLACEHOLDER_IMG));
        return list.length ? list : [PLACEHOLDER_IMG];
    }, [images, PLACEHOLDER_IMG]);

    const [current, setCurrent] = useState(0);
    const [lightbox, setLightbox] = useState(false);
    const total = safeImages.length;

    const touchStartX = useRef<number | null>(null);
    const handleTouchStart = (e: React.TouchEvent) => {
        touchStartX.current = e.touches[0].clientX;
    };
    const handleTouchEnd = (e: React.TouchEvent) => {
        if (touchStartX.current == null) return;
        const dx = e.changedTouches[0].clientX - touchStartX.current;
        if (Math.abs(dx) > 30) {
            if (dx < 0) next();
            else prev();
        }
        touchStartX.current = null;
    };

    const prev = () => setCurrent((c) => (c - 1 + total) % total);
    const next = () => setCurrent((c) => (c + 1) % total);

    const side = safeImages.slice(1, 5);
    while (side.length < 4 && total > 0) {
        side.push(safeImages[side.length % total] || PLACEHOLDER_IMG);
    }

    if (loading) {
        return (
            <div
                id="gallery"
                className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 gap-1.5 md:gap-2 h-[280px] md:h-[420px] rounded-2xl overflow-hidden"
            >
                <div className="md:col-span-2 md:row-span-2 bg-gray-200 dark:bg-slate-800 animate-pulse" />
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="hidden md:block bg-gray-200 dark:bg-slate-800 animate-pulse" />
                ))}
            </div>
        );
    }

    return (
        <>
            <div id="gallery" className="relative">
                {/* Mobile */}
                <div className="md:hidden relative h-[300px] rounded-2xl overflow-hidden bg-gray-100 dark:bg-slate-800">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={safeImages[current]}
                        alt={`${hotelName} photo ${current + 1}`}
                        className="w-full h-full object-cover"
                        onTouchStart={handleTouchStart}
                        onTouchEnd={handleTouchEnd}
                        onClick={() => setLightbox(true)}
                        onError={(e) => {
                            e.currentTarget.src = PLACEHOLDER_IMG;
                        }}
                    />
                    <button
                        type="button"
                        onClick={prev}
                        aria-label="Previous"
                        className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/95 shadow grid place-items-center"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                        type="button"
                        onClick={next}
                        aria-label="Next"
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/95 shadow grid place-items-center"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                    <div className="absolute bottom-3 right-3 bg-black/70 text-white text-xs font-semibold px-2.5 py-1 rounded-full">
                        {current + 1} / {total}
                    </div>
                </div>

                {/* Desktop mosaic  reference style */}
                <div className="hidden md:grid grid-cols-4 grid-rows-2 gap-2 h-[420px] rounded-2xl overflow-hidden">
                    <button
                        type="button"
                        className="col-span-2 row-span-2 relative group"
                        onClick={() => {
                            setCurrent(0);
                            setLightbox(true);
                        }}
                    >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={safeImages[0]}
                            alt={`${hotelName} main`}
                            className="w-full h-full object-cover transition duration-300 group-hover:scale-[1.02]"
                            onError={(e) => {
                                e.currentTarget.src = PLACEHOLDER_IMG;
                            }}
                        />
                    </button>
                    {side.map((img, i) => (
                        <button
                            type="button"
                            key={`${img}-${i}`}
                            className="relative group overflow-hidden bg-gray-100"
                            onClick={() => {
                                setCurrent(Math.min(i + 1, total - 1));
                                setLightbox(true);
                            }}
                        >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={img}
                                alt={`${hotelName} ${i + 2}`}
                                className="w-full h-full object-cover transition duration-300 group-hover:scale-[1.03]"
                                onError={(e) => {
                                    e.currentTarget.src = PLACEHOLDER_IMG;
                                }}
                            />
                            {i === 3 && total > 5 ? (
                                <span className="absolute inset-0 bg-black/45 flex items-center justify-center text-white font-bold text-sm gap-2">
                                    <Camera className="w-4 h-4" />
                                    See all {total} photos
                                </span>
                            ) : null}
                        </button>
                    ))}
                </div>

                <button
                    type="button"
                    onClick={() => setLightbox(true)}
                    className="hidden md:inline-flex absolute bottom-4 right-4 items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm font-bold text-brand-dark shadow-lg border border-slate-200 hover:bg-slate-50"
                >
                    <Camera className="w-4 h-4" />
                    {total} photos
                </button>
            </div>

            {lightbox ? (
                <div className="fixed inset-0 z-[100] bg-black/95 flex flex-col">
                    <div className="flex items-center justify-between px-4 py-3 text-white">
                        <p className="text-sm font-semibold">
                            {hotelName} · {current + 1} / {total}
                        </p>
                        <button
                            type="button"
                            onClick={() => setLightbox(false)}
                            className="p-2 rounded-full hover:bg-white/10"
                            aria-label="Close"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    <div className="flex-1 relative flex items-center justify-center px-4 pb-6">
                        <button
                            type="button"
                            onClick={prev}
                            className="absolute left-3 md:left-8 w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 text-white grid place-items-center"
                        >
                            <ChevronLeft className="w-6 h-6" />
                        </button>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={safeImages[current]}
                            alt=""
                            className="max-h-[80vh] max-w-full object-contain rounded-lg"
                        />
                        <button
                            type="button"
                            onClick={next}
                            className="absolute right-3 md:right-8 w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 text-white grid place-items-center"
                        >
                            <ChevronRight className="w-6 h-6" />
                        </button>
                    </div>
                    <div className="overflow-x-auto px-4 pb-4">
                        <div className="flex gap-2 justify-center min-w-min mx-auto">
                            {safeImages.map((img, idx) => (
                                <button
                                    type="button"
                                    key={idx}
                                    onClick={() => setCurrent(idx)}
                                    className={`h-14 w-20 shrink-0 rounded-md overflow-hidden border-2 ${
                                        idx === current
                                            ? 'border-white'
                                            : 'border-transparent opacity-70'
                                    }`}
                                >
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={img} alt="" className="w-full h-full object-cover" />
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            ) : null}
        </>
    );
};
