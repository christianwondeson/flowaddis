import React from 'react';
import { clsx } from 'clsx';

interface LogoProps {
    className?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Logo: React.FC<LogoProps> = ({ className, size = 'md' }) => {
    const sizes = {
        sm: 'text-xl',
        md: 'text-2xl',
        lg: 'text-4xl',
        xl: 'text-6xl',
    };

    return (
        <div className={clsx('font-extrabold tracking-tight flex items-center gap-1', sizes[size], className)}>
            <div className="w-2 h-2 rounded-full bg-brand-primary mt-1"></div>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-brand-primary to-brand-secondary">
                FlowAddis
            </span>
        </div>
    );
};
