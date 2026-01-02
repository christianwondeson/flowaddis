"use client";

import React, { useMemo, useRef, useState } from 'react';

interface HotelDetailGalleryProps {
    images: string[];
    loading?: boolean;
}

export const HotelDetailGallery: React.FC<HotelDetailGalleryProps> = ({ images, loading = false }) => {
    const safeImages = useMemo(() => (images && images.length ? images : [
        'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80',
    ]), [images]);

    const [current, setCurrent] = useState(0);
    const total = safeImages.length;

    // Touch swipe for mobile
    const touchStartX = useRef<number | null>(null);
    const handleTouchStart = (e: React.TouchEvent) => {
        touchStartX.current = e.touches[0].clientX;
    };
    const handleTouchEnd = (e: React.TouchEvent) => {
        if (touchStartX.current == null) return;
        const dx = e.changedTouches[0].clientX - touchStartX.current;
        if (Math.abs(dx) > 30) {
            if (dx < 0) next(); else prev();
        }
        touchStartX.current = null;
    };

    const prev = () => setCurrent((c) => (c - 1 + total) % total);
    const next = () => setCurrent((c) => (c + 1) % total);

    const thumbs = useMemo(() => safeImages.slice(0, 20), [safeImages]);

    if (loading) {
        return (
            <div className="space-y-3">
                <div className="md:hidden h-[280px] rounded-xl overflow-hidden bg-gray-200 animate-pulse" />
                <div className="hidden md:grid grid-cols-1 md:grid-cols-4 gap-3 h-[420px]">
                    <div className="md:col-span-3 rounded-xl bg-gray-200 animate-pulse" />
                    <div className="hidden md:flex md:flex-col gap-3">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="h-24 rounded-lg bg-gray-200 animate-pulse" />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {/* Mobile slider */}
            <div className="md:hidden relative h-[280px] rounded-xl overflow-hidden">
                <img
                    src={safeImages[current]}
                    alt={`Hotel image ${current + 1}`}
                    className="w-full h-full object-cover"
                    onTouchStart={handleTouchStart}
                    onTouchEnd={handleTouchEnd}
                />

                {/* Left/Right controls (bottom aligned) */}
                <button onClick={prev} aria-label="Previous image" className="absolute left-2 bottom-3 bg-white/80 hover:bg-white text-gray-700 w-8 h-8 rounded-full grid place-items-center shadow">
                    ‹
                </button>
                <button onClick={next} aria-label="Next image" className="absolute right-2 bottom-3 bg-white/80 hover:bg-white text-gray-700 w-8 h-8 rounded-full grid place-items-center shadow">
                    ›
                </button>

                {/* Counter */}
                <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-md">
                    {current + 1}/{total}
                </div>
            </div>

            {/* Desktop/Laptop layout */}
            <div className="hidden md:block">
                {/* Top row: main + two stacked previews */}
                <div className="grid grid-cols-3 gap-3 h-[400px]">
                    {/* Main image */}
                    <div className="col-span-2 relative rounded-xl overflow-hidden bg-gray-100">
                        <img
                            src={safeImages[current]}
                            alt={`Hotel main ${current + 1}`}
                            className="w-full h-full object-cover"
                        />
                    </div>

                    {/* Two stacked previews on the right */}
                    <div className="grid grid-rows-2 gap-3 min-h-0">
                        {safeImages.slice(1, 3).map((img, i) => (
                            <button
                                key={i}
                                onClick={() => setCurrent(i + 1)}
                                className="relative rounded-xl overflow-hidden bg-gray-100 h-full w-full"
                                aria-label={`Show image ${i + 2}`}
                            >
                                {img ? (
                                    <img src={img} alt={`Preview ${i + 2}`} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full bg-gray-200" />
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Bottom thumbnail slider (desktop) */}
                {total > 1 && (
                    <div className="relative mt-3">
                        <div className="absolute left-0 bottom-2 z-10">
                            <button
                                onClick={() => {
                                    const el = document.getElementById('thumb-strip');
                                    if (el) el.scrollBy({ left: -400, behavior: 'smooth' });
                                }}
                                className="w-9 h-9 rounded-full bg-white/90 hover:bg-white shadow grid place-items-center"
                                aria-label="Scroll thumbnails left"
                            >
                                ‹
                            </button>
                        </div>
                        <div className="absolute right-0 bottom-2 z-10">
                            <button
                                onClick={() => {
                                    const el = document.getElementById('thumb-strip');
                                    if (el) el.scrollBy({ left: 400, behavior: 'smooth' });
                                }}
                                className="w-9 h-9 rounded-full bg-white/90 hover:bg-white shadow grid place-items-center"
                                aria-label="Scroll thumbnails right"
                            >
                                ›
                            </button>
                        </div>
                        <div id="thumb-strip" className="overflow-x-auto no-scrollbar">
                            <div className="flex gap-3 pr-8">
                                {thumbs.map((img, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setCurrent(idx)}
                                        className={`relative rounded-xl overflow-hidden h-24 w-40 flex-shrink-0 border ${idx === current ? 'border-brand-primary' : 'border-transparent'}`}
                                        aria-label={`Show image ${idx + 1}`}
                                    >
                                        <img src={img} alt={`Thumb ${idx + 1}`} className="w-full h-full object-cover" />
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Bottom thumbnail strip for all screens (optional) */}
            <div className="grid grid-cols-5 gap-2 md:hidden">
                {thumbs.slice(0, 10).map((img, idx) => (
                    <button
                        key={idx}
                        onClick={() => setCurrent(idx)}
                        className={`relative overflow-hidden rounded-md h-14 border ${idx === current ? 'border-brand-primary' : 'border-transparent'}`}
                    >
                        <img src={img} alt={`Thumb ${idx + 1}`} className="w-full h-full object-cover" />
                    </button>
                ))}
            </div>
        </div>
    );
};
