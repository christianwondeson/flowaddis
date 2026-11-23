'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface LogoProps extends React.ImgHTMLAttributes<HTMLImageElement> {
    variant?: 'card' | 'mark' | 'white';
}

/**
 * Official RIDE Ethiopia brand logo (Hybrid Designs PLC)
 * Uses official brand asset /assets/images/partners/ride-logo.png
 * Short code: 8294
 */
export function RideLogo({ className, variant, alt = 'RIDE Ethiopia', ...props }: LogoProps) {
    return (
        <img
            src="/assets/images/partners/ride-logo.png"
            alt={alt}
            className={cn('h-8 w-auto object-contain shrink-0', className)}
            loading="lazy"
            {...props}
        />
    );
}

/**
 * Official FERES (ፈረስ) brand logo
 * Uses official brand asset /assets/images/partners/feres-logo.png
 * Short code: 6090
 */
export function FeresLogo({ className, variant, alt = 'FERES Ethiopia', ...props }: LogoProps) {
    return (
        <img
            src="/assets/images/partners/feres-logo.png"
            alt={alt}
            className={cn('h-8 w-auto object-contain shrink-0', className)}
            loading="lazy"
            {...props}
        />
    );
}

/**
 * Official YANGO brand logo
 * Uses official brand asset /assets/images/partners/yango-logo.png
 */
export function YangoLogo({ className, variant, alt = 'Yango Ethiopia', ...props }: LogoProps) {
    return (
        <img
            src="/assets/images/partners/yango-logo.png"
            alt={alt}
            className={cn('h-8 w-auto object-contain shrink-0', className)}
            loading="lazy"
            {...props}
        />
    );
}

/**
 * Deprecated placeholder - Meter taxi removed per user request.
 */
export function MeterTaxiLogo(_props: LogoProps) {
    return null;
}

/**
 * Sleek interactive partner badges strip
 * Displays the 3 official Ethiopian ride-hailing services: RIDE, FERES, YANGO
 */
export function RidePartnerBadges({
    size = 'md',
    showLabel = true,
    className,
}: {
    size?: 'sm' | 'md' | 'lg';
    showLabel?: boolean;
    className?: string;
}) {
    const sizeClasses = {
        sm: 'h-6',
        md: 'h-7 sm:h-9',
        lg: 'h-8 sm:h-11',
    };

    return (
        <div className={cn('flex flex-wrap items-center gap-2 sm:gap-3', className)}>
            {showLabel && (
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Trusted ride-hailing partners:
                </span>
            )}
            <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto no-scrollbar py-1">
                <div
                    className="shrink-0 transition-transform hover:-translate-y-0.5"
                    title="RIDE - Call 8294"
                >
                    <RideLogo className={cn(sizeClasses[size], 'drop-shadow-xs')} />
                </div>
                <div
                    className="shrink-0 transition-transform hover:-translate-y-0.5"
                    title="FERES - Call 6090"
                >
                    <FeresLogo className={cn(sizeClasses[size], 'drop-shadow-xs')} />
                </div>
                <div
                    className="shrink-0 transition-transform hover:-translate-y-0.5"
                    title="Yango - Book via App"
                >
                    <YangoLogo className={cn(sizeClasses[size], 'drop-shadow-xs')} />
                </div>
            </div>
        </div>
    );
}
