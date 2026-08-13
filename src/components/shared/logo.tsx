import React from 'react';
import Image from 'next/image';
import { clsx } from 'clsx';

interface LogoProps {
    className?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl' | number;
    /** When true, show "BookAddis" text next to the icon. Default: false (icon only). */
    showText?: boolean;
    /** When true, invert icon for white logo on light/transparent bg (header). */
    light?: boolean;
    /** When true, use white text (for dark backgrounds like footer). Defaults to light. */
    textLight?: boolean;
    /** LCP-critical (auth / header). */
    priority?: boolean;
}

const sizeMap = {
    sm: { width: 28, text: 'text-lg' },
    md: { width: 44, text: 'text-2xl' },
    lg: { width: 48, text: 'text-4xl' },
    xl: { width: 64, text: 'text-6xl' },
};

/**
 * BookAddis logo – optimized via next/image.
 */
export const Logo: React.FC<LogoProps> = ({
    className = '',
    size = 'md',
    showText = false,
    light = false,
    textLight,
    priority = false,
}) => {
    const useLightText = textLight ?? light;
    const width = typeof size === 'number' ? size : sizeMap[size].width;
    const textSize = typeof size === 'number' ? 'text-xl' : sizeMap[size].text;

    return (
        <div className={clsx('flex items-center gap-2', className)}>
            <Image
                src="/assets/images/logo.png"
                alt="BookAddis"
                width={width}
                height={width}
                priority={priority}
                className={clsx(
                    'shrink-0 object-contain object-center',
                    light && 'drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]',
                )}
                style={{ width, height: width, maxHeight: width }}
            />
            {showText && (
                <span
                    className={clsx(
                        'font-extrabold tracking-tight leading-none',
                        textSize,
                        useLightText ? 'text-white' : 'text-teal-600',
                    )}
                >
                    Book<span className="text-teal-500">Addis</span>
                </span>
            )}
        </div>
    );
};
