'use client';

import React, { useEffect, useState } from 'react';
import { BedDouble, Bus, Plane, Ticket, type LucideIcon } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export interface PreloaderCategory {
    icon: LucideIcon | React.ComponentType<{ className?: string; strokeWidth?: number }>;
    label: string;
}

export const PRELOADER_CATEGORIES: PreloaderCategory[] = [
    { icon: Plane, label: 'Flights' },
    { icon: BedDouble, label: 'Hotels' },
    { icon: Bus, label: 'Shuttles' },
    { icon: Ticket, label: 'Events' },
];

export interface PreloaderProps {
    className?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    fullScreen?: boolean;
    label?: string;
    onComplete?: () => void;
    progress?: number;
    showProgress?: boolean;
    categories?: PreloaderCategory[];
}

/**
 * Premium Travel Brand Preloader for BookAddis / FlowAddis.
 * Features concentric animated rings, rotating core travel categories (Flights, Hotels, Shuttles, Events),
 * smooth tracking typography, soft ambient emerald glow, and an emerald gradient progress bar.
 */
export const Preloader: React.FC<PreloaderProps> = ({
    className,
    size = 'md',
    fullScreen = false,
    label,
    onComplete,
    progress: controlledProgress,
    showProgress = true,
    categories = PRELOADER_CATEGORIES,
}) => {
    const isControlled = typeof controlledProgress === 'number';
    const [progress, setProgress] = useState(isControlled ? controlledProgress : 0);
    const [activeIndex, setActiveIndex] = useState(0);

    // Sync controlled progress if passed
    useEffect(() => {
        if (isControlled) {
            setProgress(Math.min(100, Math.max(0, controlledProgress)));
        }
    }, [isControlled, controlledProgress]);

    // Animate progress
    useEffect(() => {
        if (isControlled) return;

        const interval = setInterval(() => {
            setProgress((prev) => {
                if (onComplete) {
                    const next = prev + Math.random() * 6 + 3;
                    return next >= 100 ? 100 : next;
                }
                // Indeterminate progress: smoothly approach ~92% and hold until resolved
                if (prev < 90) {
                    const step = Math.max(0.5, (90 - prev) * 0.08);
                    return prev + step;
                }
                return prev;
            });
        }, 180);

        return () => clearInterval(interval);
    }, [isControlled, onComplete]);

    // Rotate travel categories
    useEffect(() => {
        if (!categories || categories.length === 0) return;
        const interval = setInterval(() => {
            setActiveIndex((prev) => (prev + 1) % categories.length);
        }, 1000);

        return () => clearInterval(interval);
    }, [categories]);

    // Handle onComplete callback when progress reaches 100%
    useEffect(() => {
        if (progress >= 100 && onComplete) {
            const doneTimer = setTimeout(() => {
                onComplete();
            }, 500);
            return () => clearTimeout(doneTimer);
        }
    }, [progress, onComplete]);

    // Determine if full-screen mode or standalone prominent mode
    const isFullScreen = fullScreen || Boolean(onComplete);
    const isCompact = size === 'sm';
    const isMedium = size === 'md' && !isFullScreen;

    // Compact inline spinner (e.g. inside a small button or pill)
    if (isCompact) {
        return (
            <div
                className={cn('relative inline-flex items-center justify-center h-6 w-6', className)}
                role="status"
                aria-live="polite"
            >
                <div aria-hidden className="absolute inset-0 rounded-full border border-emerald-100" />
                <div
                    aria-hidden
                    className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-emerald-500 [animation-duration:1.5s]"
                />
                <span className="sr-only">Loading…</span>
            </div>
        );
    }

    // Medium inline spinner (e.g. inside an AdminLoader table row or form card)
    if (isMedium) {
        return (
            <div
                className={cn('flex flex-col items-center justify-center gap-3 p-4', className)}
                role="status"
                aria-live="polite"
            >
                <div className="relative flex h-14 w-14 items-center justify-center">
                    <div
                        aria-hidden
                        className="absolute inset-0 rounded-full border border-gray-100 dark:border-slate-800"
                    />
                    <div
                        aria-hidden
                        className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-emerald-500 [animation-duration:2.4s]"
                    />
                    <div
                        aria-hidden
                        className="absolute inset-1.5 rounded-full border border-gray-100 dark:border-slate-800"
                    />
                    <div className="relative h-6 w-6 text-emerald-600">
                        {categories.map((category, index) => {
                            const Icon = category.icon;
                            return (
                                <span
                                    key={category.label}
                                    className={`absolute inset-0 flex items-center justify-center transition-all duration-500 ease-out ${
                                        index === activeIndex
                                            ? 'scale-100 opacity-100'
                                            : 'scale-75 opacity-0'
                                    }`}
                                >
                                    <Icon className="h-5 w-5" strokeWidth={1.75} />
                                </span>
                            );
                        })}
                    </div>
                </div>

                {label ? (
                    <p className="text-xs font-semibold text-slate-700 text-center">{label}</p>
                ) : (
                    <p className="h-4 w-28 text-center text-[10px] font-medium tracking-[0.25em] text-gray-400 uppercase">
                        {categories[activeIndex]?.label}
                    </p>
                )}
            </div>
        );
    }

    // Full / Compact Travel Brand Preloader
    const fullContent = (
        <div className="relative flex flex-col items-center px-7 py-5 rounded-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-white/80 dark:border-slate-800 shadow-xl shadow-slate-900/5 select-none transition-all">
            {/* Soft background ambient glow */}
            <div
                aria-hidden
                className="pointer-events-none absolute -top-12 left-1/2 h-44 w-44 -translate-x-1/2 rounded-full bg-emerald-400/15 blur-2xl"
            />

            {/* Concentric rotating rings with cycling category icons - compact 16x16 */}
            <div className="relative flex h-16 w-16 items-center justify-center">
                <div
                    aria-hidden
                    className="absolute inset-0 rounded-full border border-gray-100 dark:border-slate-800"
                />
                <div
                    aria-hidden
                    className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-emerald-500 [animation-duration:2s]"
                />
                <div
                    aria-hidden
                    className="absolute inset-1.5 rounded-full border border-gray-100 dark:border-slate-800"
                />
                <div className="relative h-6 w-6 text-emerald-600">
                    {categories.map((category, index) => {
                        const Icon = category.icon;
                        return (
                            <span
                                key={category.label}
                                className={`absolute inset-0 flex items-center justify-center transition-all duration-500 ease-out ${
                                    index === activeIndex
                                        ? 'scale-100 opacity-100'
                                        : 'scale-75 opacity-0'
                                }`}
                            >
                                <Icon className="h-5.5 w-5.5" strokeWidth={1.75} />
                            </span>
                        );
                    })}
                    <span className="sr-only">{categories[activeIndex]?.label || 'Loading'}</span>
                </div>
            </div>

            {/* Label: either passed custom label or cycling uppercase category tracking */}
            {label ? (
                <div className="relative mt-3 text-center max-w-xs px-2">
                    <p className="text-xs font-semibold tracking-wide text-gray-800 dark:text-gray-100">{label}</p>
                    <p className="mt-0.5 h-3.5 text-[9px] font-medium tracking-[0.25em] text-emerald-600 uppercase">
                        {categories[activeIndex]?.label}
                    </p>
                </div>
            ) : (
                <p className="relative mt-3 h-4 w-32 text-center text-[10px] font-medium tracking-[0.25em] text-gray-500 dark:text-gray-400 uppercase">
                    {categories.map((category, index) => (
                        <span
                            key={category.label}
                            className={`absolute inset-0 text-center transition-opacity duration-500 ${
                                index === activeIndex ? 'opacity-100' : 'opacity-0'
                            }`}
                        >
                            {category.label}
                        </span>
                    ))}
                </p>
            )}

            {/* Smooth emerald progress bar - compact 36px width */}
            {showProgress ? (
                <div className="mt-3.5 h-[2.5px] w-36 overflow-hidden rounded-full bg-gray-200/80 dark:bg-slate-800">
                    <div
                        className="h-full rounded-full bg-gradient-to-r from-emerald-500/70 to-emerald-500 transition-all duration-200 ease-out"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            ) : null}
        </div>
    );

    if (isFullScreen) {
        return (
            <div
                className={cn(
                    'fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white/50 dark:bg-slate-950/50 backdrop-blur-[2px] transition-all',
                    className,
                )}
                role="status"
                aria-live="polite"
                aria-busy="true"
            >
                {fullContent}
            </div>
        );
    }

    return (
        <div
            className={cn('flex flex-col items-center justify-center py-8', className)}
            role="status"
            aria-live="polite"
            aria-busy="true"
        >
            {fullContent}
        </div>
    );
};

export default Preloader;
