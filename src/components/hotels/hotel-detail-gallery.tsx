"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Camera, ChevronLeft, ChevronRight, X, Maximize2, Minimize2, ZoomIn, ZoomOut, LayoutGrid } from 'lucide-react';
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
        const seen = new Set<string>();
        const list: string[] = [];
        for (const raw of images || []) {
            if (typeof raw !== 'string' || !raw.trim()) continue;
            const normalized = normalizeUrl(raw, PLACEHOLDER_IMG);
            const key = normalized
                .replace(/^https?:\/\//i, '')
                .split('?')[0]
                .replace(/\/+$/, '')
                .toLowerCase();
            if (!seen.has(key)) {
                seen.add(key);
                list.push(normalized);
            }
        }
        return list.length ? list : [PLACEHOLDER_IMG];
    }, [images, PLACEHOLDER_IMG]);

    const [current, setCurrent] = useState(0);
    const [lightbox, setLightbox] = useState(false);
    const [isNativeFullscreen, setIsNativeFullscreen] = useState(false);
    const [fitMode, setFitMode] = useState<'contain' | 'cover'>('contain');
    const [showThumbnails, setShowThumbnails] = useState(true);
    const total = safeImages.length;
    const lightboxContainerRef = useRef<HTMLDivElement>(null);

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

    const prev = useCallback(() => setCurrent((c) => (c - 1 + total) % total), [total]);
    const next = useCallback(() => setCurrent((c) => (c + 1) % total), [total]);

    const toggleFullscreen = useCallback(async () => {
        try {
            if (!document.fullscreenElement) {
                if (lightboxContainerRef.current?.requestFullscreen) {
                    await lightboxContainerRef.current.requestFullscreen();
                }
            } else {
                if (document.exitFullscreen) {
                    await document.exitFullscreen();
                }
            }
        } catch {
            // Fullscreen API may be blocked or not supported on some mobile devices
        }
    }, []);

    // Sync fullscreen state
    useEffect(() => {
        const handleFsChange = () => {
            setIsNativeFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFsChange);
        return () => document.removeEventListener('fullscreenchange', handleFsChange);
    }, []);

    // Body scroll lock & Keyboard navigation
    useEffect(() => {
        if (!lightbox) return;

        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                if (document.fullscreenElement) {
                    void document.exitFullscreen();
                } else {
                    setLightbox(false);
                }
            } else if (e.key === 'ArrowLeft') {
                prev();
            } else if (e.key === 'ArrowRight') {
                next();
            } else if (e.key.toLowerCase() === 'f') {
                void toggleFullscreen();
            } else if (e.key.toLowerCase() === 'z') {
                setFitMode((m) => (m === 'contain' ? 'cover' : 'contain'));
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            document.body.style.overflow = originalOverflow;
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [lightbox, prev, next, toggleFullscreen]);

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
                <div
                    ref={lightboxContainerRef}
                    className="fixed inset-0 z-[100] bg-black text-white flex flex-col select-none overflow-hidden"
                >
                    {/* Floating sleek top bar */}
                    <div className="absolute top-0 inset-x-0 z-30 flex items-center justify-between px-4 sm:px-6 py-3.5 bg-gradient-to-b from-black/85 via-black/40 to-transparent">
                        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                            <span className="text-sm sm:text-base font-bold truncate max-w-[200px] sm:max-w-md text-white drop-shadow">
                                {hotelName}
                            </span>
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-sm text-slate-100 shrink-0">
                                {current + 1} / {total}
                            </span>
                        </div>

                        <div className="flex items-center gap-1.5 sm:gap-2">
                            {/* Fit vs Fill Screen toggle (eliminates any letterbox gaps) */}
                            <button
                                type="button"
                                onClick={() =>
                                    setFitMode((m) => (m === 'contain' ? 'cover' : 'contain'))
                                }
                                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-medium text-white transition backdrop-blur-sm"
                                title={
                                    fitMode === 'cover'
                                        ? 'Fit to screen (Z)'
                                        : 'Fill screen / No gaps (Z)'
                                }
                            >
                                {fitMode === 'cover' ? (
                                    <>
                                        <ZoomOut className="w-3.5 h-3.5" />
                                        <span className="hidden sm:inline">Fit</span>
                                    </>
                                ) : (
                                    <>
                                        <ZoomIn className="w-3.5 h-3.5" />
                                        <span className="hidden sm:inline">Fill</span>
                                    </>
                                )}
                            </button>

                            {/* Thumbnails toggle */}
                            {total > 1 ? (
                                <button
                                    type="button"
                                    onClick={() => setShowThumbnails((v) => !v)}
                                    className={`p-2 rounded-lg transition backdrop-blur-sm ${
                                        showThumbnails
                                            ? 'bg-white/25 text-white'
                                            : 'bg-white/10 hover:bg-white/20 text-slate-300'
                                    }`}
                                    title={showThumbnails ? 'Hide thumbnails' : 'Show thumbnails'}
                                >
                                    <LayoutGrid className="w-4 h-4" />
                                </button>
                            ) : null}

                            {/* Native Fullscreen toggle */}
                            <button
                                type="button"
                                onClick={() => void toggleFullscreen()}
                                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition backdrop-blur-sm"
                                title={isNativeFullscreen ? 'Exit fullscreen (F)' : 'Fullscreen (F)'}
                            >
                                {isNativeFullscreen ? (
                                    <Minimize2 className="w-4 h-4" />
                                ) : (
                                    <Maximize2 className="w-4 h-4" />
                                )}
                            </button>

                            {/* Close */}
                            <button
                                type="button"
                                onClick={() => setLightbox(false)}
                                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition backdrop-blur-sm ml-1"
                                aria-label="Close"
                                title="Close (Esc)"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Main Image Viewport - Full Viewport with NO restrictive max-h-80vh */}
                    <div
                        className="relative flex-1 w-full h-full flex items-center justify-center overflow-hidden bg-black"
                        onTouchStart={handleTouchStart}
                        onTouchEnd={handleTouchEnd}
                    >
                        {/* Prev Button */}
                        {total > 1 ? (
                            <button
                                type="button"
                                onClick={prev}
                                aria-label="Previous image"
                                className="absolute left-3 sm:left-6 z-20 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-black/40 hover:bg-black/75 border border-white/20 text-white backdrop-blur-md grid place-items-center shadow-2xl transition hover:scale-105 active:scale-95"
                            >
                                <ChevronLeft className="w-6 h-6" />
                            </button>
                        ) : null}

                        {/* Full Size Image */}
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={safeImages[current]}
                            alt={`${hotelName} view ${current + 1}`}
                            className={`w-full h-full ${
                                fitMode === 'cover' ? 'object-cover' : 'object-contain'
                            } transition-transform duration-200`}
                        />

                        {/* Next Button */}
                        {total > 1 ? (
                            <button
                                type="button"
                                onClick={next}
                                aria-label="Next image"
                                className="absolute right-3 sm:right-6 z-20 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-black/40 hover:bg-black/75 border border-white/20 text-white backdrop-blur-md grid place-items-center shadow-2xl transition hover:scale-105 active:scale-95"
                            >
                                <ChevronRight className="w-6 h-6" />
                            </button>
                        ) : null}
                    </div>

                    {/* Floating Bottom Thumbnails Bar */}
                    {showThumbnails && total > 1 ? (
                        <div className="absolute bottom-0 inset-x-0 z-30 pt-6 pb-4 px-4 bg-gradient-to-t from-black/85 via-black/40 to-transparent">
                            <div className="flex gap-2 justify-start sm:justify-center overflow-x-auto max-w-5xl mx-auto py-1 no-scrollbar">
                                {safeImages.map((img, idx) => (
                                    <button
                                        type="button"
                                        key={idx}
                                        onClick={() => setCurrent(idx)}
                                        className={`h-14 w-20 sm:h-16 sm:w-24 shrink-0 rounded-lg overflow-hidden border-2 transition-all duration-150 ${
                                            idx === current
                                                ? 'border-emerald-400 ring-2 ring-emerald-400/60 scale-105 opacity-100 shadow-xl'
                                                : 'border-white/20 opacity-60 hover:opacity-100 hover:border-white/60'
                                        }`}
                                    >
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={img}
                                            alt=""
                                            className="w-full h-full object-cover"
                                            loading="lazy"
                                        />
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : null}
                </div>
            ) : null}
        </>
    );
};
