import React from 'react';
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

interface PreloaderProps {
    className?: string;
    size?: 'sm' | 'md' | 'lg';
    fullScreen?: boolean;
}

export const Preloader: React.FC<PreloaderProps> = ({
    className,
    size = 'md',
    fullScreen = false
}) => {
    const sizeClasses = {
        sm: 'w-5 h-5 border-2',
        md: 'w-8 h-8 border-3',
        lg: 'w-12 h-12 border-4',
    };

    const spinner = (
        <div
            className={cn(
                'rounded-full border-gray-200 border-t-brand-primary animate-spin',
                sizeClasses[size],
                className
            )}
            role="status"
            aria-label="Loading"
        />
    );

    if (fullScreen) {
        return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white/80 backdrop-blur-sm">
                {spinner}
            </div>
        );
    }

    return spinner;
};
