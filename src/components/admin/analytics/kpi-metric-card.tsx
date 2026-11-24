'use client';

import React from 'react';
import { ArrowUpRight, ArrowDownRight, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export type KpiMetricCardProps = {
    title: string;
    value: string;
    subtitle?: string;
    icon: LucideIcon;
    change?: string | null;
    trend?: 'up' | 'down' | 'neutral';
    badgeClass?: string;
    iconBgClass?: string;
    highlight?: boolean;
    onClick?: () => void;
};

export function KpiMetricCard({
    title,
    value,
    subtitle,
    icon: Icon,
    change,
    trend = 'up',
    badgeClass,
    iconBgClass = 'bg-brand-primary/10 text-brand-primary',
    highlight = false,
    onClick,
}: KpiMetricCardProps) {
    return (
        <div
            onClick={onClick}
            className={cn(
                'group relative bg-white p-5 rounded-2xl border transition-all duration-200',
                highlight
                    ? 'border-brand-primary/40 shadow-sm ring-1 ring-brand-primary/20 bg-gradient-to-br from-white to-teal-50/30'
                    : 'border-gray-100 hover:border-gray-200 hover:shadow-md shadow-xs',
                onClick ? 'cursor-pointer' : '',
            )}
        >
            <div className="flex items-start justify-between gap-3 mb-3">
                <div
                    className={cn(
                        'w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105',
                        iconBgClass,
                    )}
                >
                    <Icon className="w-5 h-5" />
                </div>
                {change ? (
                    <div
                        className={cn(
                            'inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-lg border',
                            trend === 'up'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60'
                                : trend === 'down'
                                  ? 'bg-rose-50 text-rose-700 border-rose-200/60'
                                  : 'bg-gray-50 text-gray-700 border-gray-200/60',
                        )}
                    >
                        {trend === 'up' && <ArrowUpRight className="w-3.5 h-3.5" />}
                        {trend === 'down' && <ArrowDownRight className="w-3.5 h-3.5" />}
                        {change}
                    </div>
                ) : badgeClass ? (
                    <span
                        className={cn(
                            'text-[11px] font-semibold px-2 py-0.5 rounded-md',
                            badgeClass,
                        )}
                    >
                        Active
                    </span>
                ) : null}
            </div>

            <div>
                <h3 className="text-gray-500 text-xs font-semibold tracking-wide uppercase">
                    {title}
                </h3>
                <p className="text-2xl font-extrabold text-brand-dark mt-1 tracking-tight">
                    {value}
                </p>
                {subtitle && (
                    <p className="text-xs text-gray-400 mt-1.5 font-medium line-clamp-1">
                        {subtitle}
                    </p>
                )}
            </div>
        </div>
    );
}
