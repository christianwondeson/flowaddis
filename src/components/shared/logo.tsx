import React from 'react';
import { clsx } from 'clsx';

interface LogoProps {
    className?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl' | number;
    showText?: boolean;
    light?: boolean;
}

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

    const iconColor = light ? "var(--color-brand-white)" : "var(--color-brand-primary)";
    const accentColor = "var(--color-brand-secondary)";

    return (
        <div className={clsx('flex items-center gap-2', className)}>
            <svg
                width={width}
                height={width}
                viewBox="0 0 64 64"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
            >
                {/* Bed headboard */}
                <rect x="10" y="20" width="44" height="4" rx="2" fill={iconColor} />
                <rect x="12" y="8" width="40" height="16" rx="4" fill={iconColor} />

                {/* Pillows */}
                <rect x="16" y="12" width="12" height="8" rx="3" fill={light ? "rgba(255,255,255,0.5)" : "var(--color-brand-gray)"} />
                <rect x="36" y="12" width="12" height="8" rx="3" fill={light ? "rgba(255,255,255,0.5)" : "var(--color-brand-gray)"} />

                {/* Bed frame */}
                <rect x="8" y="24" width="48" height="6" rx="2" fill={iconColor} />
                <rect x="6" y="30" width="52" height="10" rx="3" fill={iconColor} />

                {/* Bed legs */}
                <rect x="10" y="40" width="5" height="8" rx="2" fill={iconColor} />
                <rect x="49" y="40" width="5" height="8" rx="2" fill={iconColor} />

                {/* Stars */}
                <circle cx="22" cy="4" r="2" fill={accentColor} />
                <circle cx="32" cy="2" r="2.5" fill={accentColor} />
                <circle cx="42" cy="4" r="2" fill={accentColor} />
            </svg>

            {showText && (
                <span className={clsx(
                    'font-extrabold tracking-tight leading-none',
                    textSize,
                    light ? "text-white" : "text-brand-primary"
                )}>
                    Book<span className="text-brand-secondary">Addis</span>
                </span>
            )}
        </div>
    );
};
