'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';
import { clsx } from 'clsx';

interface ServicePageWrapperProps {
    icon: LucideIcon;
    title: string;
    description: string;
    accentColor?: 'primary' | 'secondary' | 'accent';
    children: React.ReactNode;
    /**
     * When true (default), only render the hero  children are expected to be
     * a full-width AdContainer (or similar) below. When false, wrap children
     * in a centered container with negative margin over the hero.
     */
    fullBleedBody?: boolean;
}

export function ServicePageWrapper({
    icon: Icon,
    title,
    description,
    accentColor = 'primary',
    children,
    fullBleedBody = true,
}: ServicePageWrapperProps) {
    const accentColors = {
        primary: 'bg-brand-primary text-white',
        secondary: 'bg-brand-secondary text-white',
        accent: 'bg-brand-gray dark:bg-slate-800 text-brand-dark dark:text-foreground',
    };

    return (
        <div className="min-h-screen bg-brand-gray/30 dark:bg-background pb-16 md:pb-20">
            <div
                className={clsx(
                    accentColors[accentColor],
                    'pt-[calc(4.5rem+env(safe-area-inset-top,0px))] pb-8 md:pb-10',
                )}
            >
                <div className="container mx-auto px-4 sm:px-6">
                    <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
                        <div className="p-3 sm:p-4 bg-white/10 rounded-2xl backdrop-blur-md border border-white/20 shrink-0">
                            <Icon className="w-7 h-7 sm:w-9 sm:h-9" />
                        </div>
                        <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight leading-tight">
                            {title}
                        </h1>
                    </div>
                    <p className="text-white/85 text-sm sm:text-base md:text-lg max-w-3xl leading-relaxed">
                        {description}
                    </p>
                </div>
            </div>

            {fullBleedBody ? (
                <div className="w-full -mt-4 md:-mt-5 relative z-[1]">{children}</div>
            ) : (
                <div className="container mx-auto px-4 sm:px-6 -mt-6 md:-mt-8 relative z-[1]">
                    {children}
                </div>
            )}
        </div>
    );
}
