"use client";

import React from 'react';
import { LucideIcon } from 'lucide-react';
import { clsx } from 'clsx';

interface ServicePageWrapperProps {
    icon: LucideIcon;
    title: string;
    description: string;
    accentColor?: 'primary' | 'secondary' | 'accent';
    children: React.ReactNode;
}

export function ServicePageWrapper({
    icon: Icon,
    title,
    description,
    accentColor = 'primary',
    children
}: ServicePageWrapperProps) {
    const accentColors = {
        primary: 'bg-brand-primary text-white',
        secondary: 'bg-brand-secondary text-white',
        accent: 'bg-brand-gray text-brand-dark',
    };

    return (
        <div className="min-h-screen bg-brand-gray/30 pb-20 pt-0">
            {/* Header Section - compact, no extra top margin */}
            <div className={clsx(accentColors[accentColor], "py-8 md:py-12")}>
                <div className="container mx-auto px-4">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-md border border-white/20">
                            <Icon className="w-10 h-10" />
                        </div>
                        <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight">{title}</h1>
                    </div>
                    <p className="text-white/80 text-base md:text-xl max-w-3xl leading-relaxed">
                        {description}
                    </p>
                </div>
            </div>

            <div className="container mx-auto px-4 sm:px-6 lg:px-6 -mt-6 md:-mt-8">
                {children}
            </div>
        </div>
    );
}
