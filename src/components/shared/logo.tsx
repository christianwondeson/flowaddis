import React from 'react';
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
}

const sizeMap = {
    sm: { width: 28, text: 'text-lg' },
    md: { width: 44, text: 'text-2xl' },
    lg: { width: 48, text: 'text-4xl' },
    xl: { width: 64, text: 'text-6xl' },
};

/**
 * BookAddis logo – uses logo.png image, icon only by default.
 * Zooms in on the icon (object-fit) so it is visible; on light header uses invert for contrast.
 */
export const Logo: React.FC<LogoProps> = ({
    className = "",
    size = 'md',
    showText = false,
    light = false,
    textLight
}) => {
    const useLightText = textLight ?? light;
    const width = typeof size === 'number' ? size : sizeMap[size].width;
    const textSize = typeof size === 'number' ? 'text-xl' : sizeMap[size].text;

    return (
        <div className={clsx('flex items-center gap-2', className)}>
            <img
                src="/assets/images/logo.png"
                alt="BookAddis"
                width={width}
                height={width}
                className={clsx(
                    'object-contain',
                    'object-center',
                    // NOTE: This logo asset is multi-color; inverting it makes it an all-white block.
                    // For "light" contexts (transparent header over hero), keep colors and add contrast.
                    light && 'drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]'
                )}
            />
            {showText && (
                <span className={clsx(
                    'font-extrabold tracking-tight leading-none',
                    textSize,
                    useLightText ? "text-white" : "text-teal-600"
                )}>
                    Book<span className="text-teal-500">Addis</span>
                </span>
            )}
        </div>
    );
};
