import React from 'react';
import { clsx } from 'clsx';

interface LogoProps {
    className?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl' | number;
    showText?: boolean;
    light?: boolean;
}

/**
 * BookAddis logo – bed icon with person resting (accommodation/booking).
 * Transparent background, brand colors. Represents hotels, comfort, and travel.
 */
export const Logo: React.FC<LogoProps> = ({
    className = "",
    size = 'md',
    showText = true,
    light = false
}) => {
    const sizes = {
        sm: { width: 24, text: 'text-lg' },
        md: { width: 32, text: 'text-2xl' },
        lg: { width: 48, text: 'text-4xl' },
        xl: { width: 64, text: 'text-6xl' },
    };

    const width = typeof size === 'number' ? size : sizes[size].width;
    const textSize = typeof size === 'number' ? 'text-xl' : sizes[size].text;

    const fill = light ? "#ffffff" : "#0d9488";

    return (
        <div className={clsx('flex items-center gap-2', className)}>
            <svg
                width={width}
                height={width}
                viewBox="0 0 64 64"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden
            >
                {/* Bed icon – matches reference: headboard, mattress, footboard, pillow, person's head. Transparent background. */}
                {/* Headboard (vertical bar left) */}
                <rect x="10" y="18" width="8" height="32" rx="2" fill={fill} />
                {/* Mattress (horizontal base) */}
                <rect x="18" y="42" width="28" height="12" rx="2" fill={fill} />
                {/* Footboard (vertical bar right) */}
                <rect x="44" y="34" width="8" height="22" rx="2" fill={fill} />
                {/* Pillow (elongated horizontal rectangle on left of mattress) */}
                <rect x="20" y="44" width="12" height="8" rx="3" fill={fill} />
                {/* Person's head (circle on pillow) */}
                <circle cx="26" cy="47" r="5" fill={fill} />
            </svg>

            {showText && (
                <span className={clsx(
                    'font-extrabold tracking-tight leading-none',
                    textSize,
                    light ? "text-white" : "text-teal-600"
                )}>
                    Book<span className="text-teal-500">Addis</span>
                </span>
            )}
        </div>
    );
};
