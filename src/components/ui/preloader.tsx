'use client';

import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface PreloaderProps {
    className?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    fullScreen?: boolean;
    label?: string;
}

/**
 * Brand BookAddis preloader  rings + mark (not a plain text spinner).
 */
export const Preloader: React.FC<PreloaderProps> = ({
    className,
    size = 'md',
    fullScreen = false,
    label,
}) => {
    const sizeClasses = {
        sm: 'w-7 h-7',
        md: 'w-11 h-11',
        lg: 'w-16 h-16',
        xl: 'w-24 h-24',
    };

    const containerSize = sizeClasses[size];

    const content = (
        <div
            className={cn('flex flex-col items-center justify-center gap-4', className)}
            role="status"
            aria-live="polite"
            aria-busy="true"
        >
            <div className={cn('relative flex items-center justify-center', containerSize)}>
                <div className="absolute inset-0 rounded-full border-2 border-brand-primary/15" />
                <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-brand-primary border-r-brand-primary/70 animate-spin" />
                <div className="absolute inset-[18%] rounded-full border border-brand-secondary/40 animate-pulse" />
                <div className="relative z-[1] flex h-[42%] w-[42%] items-center justify-center rounded-full bg-gradient-to-br from-brand-primary to-brand-secondary shadow-md shadow-brand-primary/25">
                    <span className="text-[0.55em] font-extrabold tracking-tight text-white select-none">
                        BA
                    </span>
                </div>
            </div>
            {label ? (
                <div className="text-center max-w-xs px-2">
                    <p className="text-sm font-semibold text-brand-dark">{label}</p>
                    <div className="mt-2 flex items-center justify-center gap-1" aria-hidden>
                        <span className="h-1.5 w-1.5 rounded-full bg-brand-primary animate-bounce [animation-delay:0ms]" />
                        <span className="h-1.5 w-1.5 rounded-full bg-brand-primary animate-bounce [animation-delay:150ms]" />
                        <span className="h-1.5 w-1.5 rounded-full bg-brand-primary animate-bounce [animation-delay:300ms]" />
                    </div>
                </div>
            ) : (
                <span className="sr-only">Loading</span>
            )}
        </div>
    );

    if (fullScreen) {
        return (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/70 backdrop-blur-md">
                <div className="rounded-3xl border border-white/40 bg-white/80 px-10 py-8 shadow-2xl">
                    {content}
                </div>
            </div>
        );
    }

    return content;
};
