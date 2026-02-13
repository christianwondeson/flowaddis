import React from 'react';
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

interface PreloaderProps {
    className?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    fullScreen?: boolean;
    label?: string;
}

export const Preloader: React.FC<PreloaderProps> = ({
    className,
    size = 'md',
    fullScreen = false,
    label
}) => {
    const sizeClasses = {
        sm: 'w-6 h-6',
        md: 'w-10 h-10',
        lg: 'w-16 h-16',
        xl: 'w-24 h-24',
    };

    const containerSize = sizeClasses[size];

    const content = (
        <div className={cn("flex flex-col items-center justify-center gap-4", className)}>
            <div className={cn("relative flex items-center justify-center", containerSize)}>
                {/* Outer pulsing ring */}
                <div className="absolute inset-0 rounded-full border-2 border-brand-primary/20 animate-ping opacity-75" />

                {/* Middle rotating gradient ring */}
                <div className="absolute inset-0 rounded-full border-t-2 border-r-2 border-brand-primary animate-spin" />

                {/* Inner brand circle */}
                <div className="w-1/2 h-1/2 rounded-full bg-gradient-to-br from-brand-primary to-brand-secondary animate-pulse shadow-lg" />
            </div>

            {label && (
                <span className="text-sm font-medium text-gray-600 animate-pulse tracking-wide">
                    {label}
                </span>
            )}
        </div>
    );

    if (fullScreen) {
        return (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/60 backdrop-blur-md transition-all duration-300">
                <div className="p-8 rounded-3xl bg-white/40 shadow-2xl border border-white/20 backdrop-blur-xl scale-110 lg:scale-125">
                    {content}
                </div>
            </div>
        );
    }

    return content;
};
