/* eslint-disable @next/next/no-img-element */
import React from 'react';
import { clsx } from 'clsx';

interface LogoProps {
    className?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl';
}

import Image from 'next/image';

export const Logo: React.FC<LogoProps> = ({ className, size = 'md' }) => {
    const sizes = {
        sm: { width: 24, height: 24, text: 'text-xl' },
        md: { width: 32, height: 32, text: 'text-2xl' },
        lg: { width: 48, height: 48, text: 'text-4xl' },
        xl: { width: 64, height: 64, text: 'text-6xl' },
    };

    const { width, height, text } = sizes[size];

    return (
        <div className={clsx('font-extrabold tracking-tight flex items-center gap-2', text, className)}>
            <div className="relative overflow-hidden rounded-lg">
                <Image
                    src="/images/logo.png"
                    alt="BookAddis Logo"
                    width={width}
                    height={height}
                    className="object-contain"
                />
            </div>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-brand-primary to-brand-secondary">
                flowaddis
            </span>
        </div>
    );
};
