'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface LogoProps extends React.SVGProps<SVGSVGElement> {
    variant?: 'card' | 'mark' | 'white';
}

/**
 * Official RIDE Ethiopia brand logo (Hybrid Designs PLC)
 * Colors: Yellow (#FFC20E) and Dark Green (#006837)
 * Short code: 8294
 */
export function RideLogo({ className, variant = 'card', ...props }: LogoProps) {
    if (variant === 'mark') {
        return (
            <svg
                viewBox="0 0 110 32"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className={cn('h-8 w-auto', className)}
                aria-label="RIDE Ethiopia logo"
                {...props}
            >
                <rect x="0" y="3" width="26" height="26" rx="6" fill="#FFC20E" />
                <path d="M5 16 L21 16 M13 8 L13 24" stroke="#006837" strokeWidth="2.5" strokeLinecap="round" />
                <text
                    x="32"
                    y="22"
                    fontFamily="'Plus Jakarta Sans', Arial, sans-serif"
                    fontWeight="900"
                    fontSize="22"
                    fill="#006837"
                    letterSpacing="0.5"
                >
                    RIDE
                </text>
                <rect x="82" y="7" width="28" height="17" rx="5" fill="#006837" />
                <text
                    x="96"
                    y="19"
                    fontFamily="'Plus Jakarta Sans', sans-serif"
                    fontWeight="800"
                    fontSize="9"
                    fill="#FFC20E"
                    textAnchor="middle"
                >
                    8294
                </text>
            </svg>
        );
    }

    if (variant === 'white') {
        return (
            <svg
                viewBox="0 0 160 50"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className={cn('h-9 w-auto', className)}
                aria-label="RIDE Ethiopia logo"
                {...props}
            >
                <rect width="160" height="50" rx="10" fill="#FFFFFF" fillOpacity="0.15" />
                <g transform="translate(14, 11)">
                    <rect width="28" height="28" rx="7" fill="#FFC20E" />
                    <text x="14" y="20" fontFamily="'Plus Jakarta Sans', Arial, sans-serif" fontWeight="900" fontSize="16" fill="#006837" textAnchor="middle">R</text>
                </g>
                <text
                    x="48"
                    y="32"
                    fontFamily="'Plus Jakarta Sans', Arial, sans-serif"
                    fontWeight="900"
                    fontSize="24"
                    fill="#FFFFFF"
                    letterSpacing="1"
                >
                    RIDE
                </text>
                <rect x="114" y="14" width="36" height="22" rx="6" fill="#FFC20E" />
                <text
                    x="132"
                    y="29.5"
                    fontFamily="'Plus Jakarta Sans', sans-serif"
                    fontWeight="800"
                    fontSize="11"
                    fill="#006837"
                    textAnchor="middle"
                >
                    8294
                </text>
            </svg>
        );
    }

    // Default 'card' style matching official RIDE taxi decals
    return (
        <svg
            viewBox="0 0 160 50"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={cn('h-10 w-auto', className)}
            aria-label="RIDE Ethiopia logo"
            {...props}
        >
            <rect width="160" height="50" rx="10" fill="#FFC20E" />
            <path
                d="M0 10C0 4.477 4.477 0 10 0H26L16 50H10C4.477 50 0 45.523 0 40V10Z"
                fill="#006837"
            />
            {/* Iconic taxi car glyph */}
            <g transform="translate(16, 13)">
                <rect x="0" y="7" width="22" height="11" rx="3" fill="#006837" />
                <path d="M3 7L6 2H16L19 7H3Z" fill="#006837" />
                <circle cx="5" cy="18" r="2.5" fill="#FFC20E" stroke="#006837" strokeWidth="1.5" />
                <circle cx="17" cy="18" r="2.5" fill="#FFC20E" stroke="#006837" strokeWidth="1.5" />
                <rect x="9" y="0.5" width="4" height="2" rx="0.5" fill="#006837" />
            </g>
            <text
                x="46"
                y="32"
                fontFamily="'Plus Jakarta Sans', Arial, Helvetica, sans-serif"
                fontWeight="900"
                fontSize="24"
                fill="#006837"
                letterSpacing="1"
            >
                RIDE
            </text>
            <rect x="114" y="14" width="38" height="22" rx="6" fill="#006837" />
            <text
                x="133"
                y="29.5"
                fontFamily="'Plus Jakarta Sans', sans-serif"
                fontWeight="800"
                fontSize="11"
                fill="#FFC20E"
                textAnchor="middle"
                letterSpacing="0.5"
            >
                8294
            </text>
        </svg>
    );
}

/**
 * Official FERES (ፈረስ) brand logo
 * Colors: Emerald Green (#00A859) and White
 * Emblem: Galloping Horse silhouette
 * Short code: 6090
 */
export function FeresLogo({ className, variant = 'card', ...props }: LogoProps) {
    if (variant === 'mark') {
        return (
            <svg
                viewBox="0 0 120 32"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className={cn('h-8 w-auto', className)}
                aria-label="Feres logo"
                {...props}
            >
                <circle cx="14" cy="16" r="13" fill="#00A859" />
                <path
                    d="M9 20 C10 18, 11 16.5, 12 15 C11 13.5, 11 12, 12 10.5 C13 9, 14.5 7.5, 16 6.8 C16.5 6.6, 17.5 6.4, 18 6.8 C18.5 7.2, 18.5 8.2, 18.8 8.6 C19.5 7.8, 20 7.4, 20.5 7.6 C21 7.7, 20.8 8.6, 20.5 9.3 C21.5 8.9, 22.2 8.9, 22.5 9.3 C22.2 10.1, 21.2 10.8, 20 11.6 C18.8 12.3, 18 12.7, 17.5 13.5 C16.8 15, 16.3 16.5, 16.3 18 C15.5 18.7, 13.8 19.5, 12 19.5 Z"
                    fill="#FFFFFF"
                />
                <text
                    x="34"
                    y="22"
                    fontFamily="'Plus Jakarta Sans', Arial, sans-serif"
                    fontWeight="900"
                    fontSize="20"
                    fill="#00A859"
                    letterSpacing="1"
                >
                    FERES
                </text>
                <rect x="94" y="7" width="25" height="17" rx="4" fill="#00A859" fillOpacity="0.15" />
                <text
                    x="106.5"
                    y="19"
                    fontFamily="'Plus Jakarta Sans', sans-serif"
                    fontWeight="800"
                    fontSize="8.5"
                    fill="#00A859"
                    textAnchor="middle"
                >
                    6090
                </text>
            </svg>
        );
    }

    if (variant === 'white') {
        return (
            <svg
                viewBox="0 0 160 50"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className={cn('h-9 w-auto', className)}
                aria-label="Feres logo"
                {...props}
            >
                <rect width="160" height="50" rx="10" fill="#FFFFFF" fillOpacity="0.15" />
                <g transform="translate(8, 7)">
                    <circle cx="18" cy="18" r="18" fill="#FFFFFF" />
                    <path
                        d="M12 25 C13 23, 14 21, 15 20 C14 18, 14 16, 15 14 C16 12, 18 10, 20 9 C20.5 8.8, 21.5 8.5, 22 9 C22.5 9.5, 22.8 11, 23 11.5 C24 10.5, 24.5 10, 25 10.2 C25.5 10.4, 25.2 11.5, 25 12.5 C26 12, 27 12, 27.5 12.5 C27 13.5, 26 14.5, 24.5 15.5 C23 16.5, 22 17, 21.5 18 C20.5 20, 20 22, 20 24 C19 25, 17 26, 15 26 C13.5 26, 12.5 25.5, 12 25 Z"
                        fill="#00A859"
                    />
                    <path d="M22 21 L26 26 M18 23 L16 28 M16 23 L13 27" stroke="#00A859" strokeWidth="1.8" strokeLinecap="round" />
                </g>
                <text
                    x="52"
                    y="32"
                    fontFamily="'Plus Jakarta Sans', Arial, sans-serif"
                    fontWeight="900"
                    fontSize="24"
                    fill="#FFFFFF"
                    letterSpacing="1.5"
                >
                    FERES
                </text>
                <rect x="115" y="14" width="37" height="22" rx="6" fill="#FFFFFF" fillOpacity="0.25" />
                <text
                    x="133.5"
                    y="29.5"
                    fontFamily="'Plus Jakarta Sans', sans-serif"
                    fontWeight="800"
                    fontSize="11"
                    fill="#FFFFFF"
                    textAnchor="middle"
                >
                    6090
                </text>
            </svg>
        );
    }

    // Default 'card' style with Emerald green background
    return (
        <svg
            viewBox="0 0 160 50"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={cn('h-10 w-auto', className)}
            aria-label="Feres logo"
            {...props}
        >
            <rect width="160" height="50" rx="10" fill="#00A859" />
            <g transform="translate(8, 7)">
                <circle cx="18" cy="18" r="18" fill="#FFFFFF" />
                <path
                    d="M12 25 C13 23, 14 21, 15 20 C14 18, 14 16, 15 14 C16 12, 18 10, 20 9 C20.5 8.8, 21.5 8.5, 22 9 C22.5 9.5, 22.8 11, 23 11.5 C24 10.5, 24.5 10, 25 10.2 C25.5 10.4, 25.2 11.5, 25 12.5 C26 12, 27 12, 27.5 12.5 C27 13.5, 26 14.5, 24.5 15.5 C23 16.5, 22 17, 21.5 18 C20.5 20, 20 22, 20 24 C19 25, 17 26, 15 26 C13.5 26, 12.5 25.5, 12 25 Z"
                    fill="#00A859"
                />
                <path
                    d="M14 18 C11 19, 9 21, 7 24 C8.5 23, 10 22.5, 12 22"
                    fill="#00A859"
                    stroke="#00A859"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                />
                <path d="M22 21 L26 26 M18 23 L16 28 M16 23 L13 27" stroke="#00A859" strokeWidth="1.8" strokeLinecap="round" />
            </g>
            <text
                x="52"
                y="32"
                fontFamily="'Plus Jakarta Sans', Arial, sans-serif"
                fontWeight="900"
                fontSize="24"
                fill="#FFFFFF"
                letterSpacing="1.5"
            >
                FERES
            </text>
            <rect x="115" y="14" width="37" height="22" rx="6" fill="#FFFFFF" fillOpacity="0.2" />
            <rect x="115" y="14" width="37" height="22" rx="6" stroke="#FFFFFF" strokeWidth="1" strokeOpacity="0.8" />
            <text
                x="133.5"
                y="29.5"
                fontFamily="'Plus Jakarta Sans', sans-serif"
                fontWeight="800"
                fontSize="11"
                fill="#FFFFFF"
                textAnchor="middle"
                letterSpacing="0.5"
            >
                6090
            </text>
        </svg>
    );
}

/**
 * Official YANGO brand logo
 * Colors: Bright Red (#EB1537) and White
 * Emblem: Stylized ribbon Y inside rounded squircle
 */
export function YangoLogo({ className, variant = 'card', ...props }: LogoProps) {
    if (variant === 'mark') {
        return (
            <svg
                viewBox="0 0 110 32"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className={cn('h-8 w-auto', className)}
                aria-label="Yango logo"
                {...props}
            >
                <rect x="2" y="3" width="26" height="26" rx="7" fill="#EB1537" />
                <path
                    d="M9 10 C9 13, 13 16, 15 18 L15 22 C15 23, 16 23.5, 17 23.5 C18 23.5, 19 23, 19 22 L19 18 C21 16, 25 13, 25 10"
                    stroke="#FFFFFF"
                    strokeWidth="2.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                <text
                    x="35"
                    y="22"
                    fontFamily="'Plus Jakarta Sans', Arial, sans-serif"
                    fontWeight="900"
                    fontSize="22"
                    fill="#EB1537"
                    letterSpacing="-0.5"
                >
                    yango
                </text>
            </svg>
        );
    }

    if (variant === 'white') {
        return (
            <svg
                viewBox="0 0 160 50"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className={cn('h-9 w-auto', className)}
                aria-label="Yango logo"
                {...props}
            >
                <rect width="160" height="50" rx="10" fill="#FFFFFF" fillOpacity="0.15" />
                <g transform="translate(10, 8)">
                    <rect width="34" height="34" rx="9" fill="#EB1537" />
                    <path
                        d="M10 10 C10 14, 15 18, 17 21 L17 26 C17 27.5, 18 28, 19.5 28 C21 28, 22 27.5, 22 26 L22 21 C24 18, 29 14, 29 10"
                        stroke="#FFFFFF"
                        strokeWidth="4.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </g>
                <text
                    x="54"
                    y="32"
                    fontFamily="'Plus Jakarta Sans', Arial, sans-serif"
                    fontWeight="900"
                    fontSize="24"
                    fill="#FFFFFF"
                    letterSpacing="-0.5"
                >
                    yango
                </text>
                <rect x="119" y="14" width="33" height="22" rx="6" fill="#EB1537" />
                <text
                    x="135.5"
                    y="29.5"
                    fontFamily="'Plus Jakarta Sans', sans-serif"
                    fontWeight="800"
                    fontSize="10"
                    fill="#FFFFFF"
                    textAnchor="middle"
                >
                    APP
                </text>
            </svg>
        );
    }

    // Default 'card' style with signature Yango red
    return (
        <svg
            viewBox="0 0 160 50"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={cn('h-10 w-auto', className)}
            aria-label="Yango logo"
            {...props}
        >
            <rect width="160" height="50" rx="10" fill="#EB1537" />
            <g transform="translate(10, 8)">
                <rect width="34" height="34" rx="9" fill="#FFFFFF" />
                <path
                    d="M10 10 C10 14, 15 18, 17 21 L17 26 C17 27.5, 18 28, 19.5 28 C21 28, 22 27.5, 22 26 L22 21 C24 18, 29 14, 29 10"
                    stroke="#EB1537"
                    strokeWidth="4.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </g>
            <text
                x="54"
                y="32"
                fontFamily="'Plus Jakarta Sans', Arial, sans-serif"
                fontWeight="900"
                fontSize="24"
                fill="#FFFFFF"
                letterSpacing="-0.5"
            >
                yango
            </text>
            <rect x="119" y="14" width="33" height="22" rx="6" fill="#FFFFFF" fillOpacity="0.2" />
            <rect x="119" y="14" width="33" height="22" rx="6" stroke="#FFFFFF" strokeWidth="1" strokeOpacity="0.8" />
            <text
                x="135.5"
                y="29.5"
                fontFamily="'Plus Jakarta Sans', sans-serif"
                fontWeight="800"
                fontSize="10"
                fill="#FFFFFF"
                textAnchor="middle"
                letterSpacing="0.5"
            >
                RIDE
            </text>
        </svg>
    );
}

/**
 * Official Addis Ababa Meter Taxi (ሜትር ታክሲ) logo
 * Colors: Traditional Yellow (#FFCC00) and Navy/Blue (#003366)
 * Short code: 6303
 */
export function MeterTaxiLogo({ className, variant = 'card', ...props }: LogoProps) {
    if (variant === 'mark') {
        return (
            <svg
                viewBox="0 0 120 32"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className={cn('h-8 w-auto', className)}
                aria-label="Meter Taxi logo"
                {...props}
            >
                <rect x="2" y="6" width="24" height="18" rx="4" fill="#FFCC00" stroke="#003366" strokeWidth="1.5" />
                <text x="14" y="18" fontFamily="'Plus Jakarta Sans', Arial, sans-serif" fontWeight="900" fontSize="7" fill="#003366" textAnchor="middle">TAXI</text>
                <text
                    x="32"
                    y="18"
                    fontFamily="'Plus Jakarta Sans', Arial, sans-serif"
                    fontWeight="900"
                    fontSize="13"
                    fill="#003366"
                >
                    METER TAXI
                </text>
                <text
                    x="32"
                    y="27"
                    fontFamily="'Noto Sans Ethiopic', sans-serif"
                    fontWeight="800"
                    fontSize="9"
                    fill="#003366"
                >
                    ሜትር ታክሲ
                </text>
            </svg>
        );
    }

    return (
        <svg
            viewBox="0 0 160 50"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={cn('h-10 w-auto', className)}
            aria-label="Addis Ababa Meter Taxi logo"
            {...props}
        >
            <rect width="160" height="50" rx="10" fill="#FFCC00" />
            <rect x="0" y="38" width="160" height="12" fill="#003366" />
            <g transform="translate(10, 8)">
                <rect x="2" y="5" width="28" height="16" rx="4" fill="#FFFFFF" stroke="#003366" strokeWidth="2" />
                <path d="M4 21 L28 21 L26 25 L6 25 Z" fill="#003366" />
                <text x="16" y="16.5" fontFamily="'Plus Jakarta Sans', Arial, sans-serif" fontWeight="900" fontSize="7" fill="#003366" textAnchor="middle" letterSpacing="0.5">TAXI</text>
            </g>
            <text x="46" y="23" fontFamily="'Plus Jakarta Sans', Arial, sans-serif" fontWeight="900" fontSize="13.5" fill="#003366" letterSpacing="0.5">METER TAXI</text>
            <text x="46" y="34" fontFamily="'Noto Sans Ethiopic', sans-serif" fontWeight="800" fontSize="10.5" fill="#003366">ሜትር ታክሲ</text>
            <rect x="117" y="11" width="35" height="20" rx="5" fill="#003366" />
            <text x="134.5" y="25" fontFamily="'Plus Jakarta Sans', sans-serif" fontWeight="800" fontSize="9.5" fill="#FFCC00" textAnchor="middle" letterSpacing="0.5">6303</text>
        </svg>
    );
}

/**
 * Sleek interactive partner badges strip
 * Suitable for hero banners, search widgets, and card footers
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
                    Trusted transit & meter taxi:
                </span>
            )}
            <div className="flex items-center gap-1.5 sm:gap-2.5 overflow-x-auto no-scrollbar py-1">
                <div
                    className="shrink-0 transition-transform hover:-translate-y-0.5"
                    title="RIDE - Call 8294"
                >
                    <RideLogo className={cn(sizeClasses[size], 'drop-shadow-sm')} />
                </div>
                <div
                    className="shrink-0 transition-transform hover:-translate-y-0.5"
                    title="FERES - Call 6090"
                >
                    <FeresLogo className={cn(sizeClasses[size], 'drop-shadow-sm')} />
                </div>
                <div
                    className="shrink-0 transition-transform hover:-translate-y-0.5"
                    title="Yango - Book via App"
                >
                    <YangoLogo className={cn(sizeClasses[size], 'drop-shadow-sm')} />
                </div>
                <div
                    className="shrink-0 transition-transform hover:-translate-y-0.5"
                    title="Meter Taxi - Call 6303"
                >
                    <MeterTaxiLogo className={cn(sizeClasses[size], 'drop-shadow-sm')} />
                </div>
            </div>
        </div>
    );
}
