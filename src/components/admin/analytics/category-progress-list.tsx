'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

export type CategoryItem = {
    label: string;
    count: number;
    percentage: number;
    amount?: number;
    currency?: string;
    icon?: LucideIcon;
    colorClass?: string;
    subtext?: string;
};

export type CategoryProgressListProps = {
    title: string;
    subtitle?: string;
    badgeText?: string;
    items: CategoryItem[];
    emptyText?: string;
    className?: string;
    showAmounts?: boolean;
};

function formatMoney(amount: number, currency = 'ETB') {
    try {
        return new Intl.NumberFormat('en-ET', {
            style: 'currency',
            currency: currency || 'ETB',
            maximumFractionDigits: amount >= 1000 ? 0 : 2,
        }).format(amount || 0);
    } catch {
        return `${currency} ${Number(amount || 0).toLocaleString()}`;
    }
}

export function CategoryProgressList({
    title,
    subtitle,
    badgeText,
    items = [],
    emptyText = 'No data available for this range.',
    className,
    showAmounts = false,
}: CategoryProgressListProps) {
    const totalCount = items.reduce((s, it) => s + (it.count || 0), 0);

    return (
        <div
            className={cn(
                'bg-white p-6 md:p-8 rounded-2xl shadow-xs border border-gray-100 flex flex-col justify-between',
                className,
            )}
        >
            <div>
                <div className="flex items-center justify-between mb-2">
                    <h2 className="text-lg font-extrabold text-brand-dark tracking-tight">
                        {title}
                    </h2>
                    {badgeText && (
                        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-700">
                            {badgeText}
                        </span>
                    )}
                </div>
                {subtitle && <p className="text-xs text-gray-500 mb-6">{subtitle}</p>}

                {items.length === 0 ? (
                    <div className="py-12 text-center text-sm text-gray-400">
                        {emptyText}
                    </div>
                ) : (
                    <div className="space-y-4">
                        {items.map((item, idx) => {
                            const Icon = item.icon;
                            const barColor =
                                item.colorClass ||
                                [
                                    'bg-teal-500',
                                    'bg-emerald-500',
                                    'bg-amber-500',
                                    'bg-sky-500',
                                    'bg-purple-500',
                                    'bg-slate-400',
                                ][idx % 6];

                            return (
                                <div key={item.label || idx} className="space-y-1.5">
                                    <div className="flex items-center justify-between text-xs">
                                        <div className="flex items-center gap-2 font-semibold text-gray-700">
                                            {Icon && (
                                                <div className="w-6 h-6 rounded-md bg-gray-100 flex items-center justify-center text-gray-600 shrink-0">
                                                    <Icon className="w-3.5 h-3.5" />
                                                </div>
                                            )}
                                            <span>{item.label}</span>
                                            {item.subtext && (
                                                <span className="text-[11px] text-gray-400 font-normal">
                                                    ({item.subtext})
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-right">
                                            <span className="font-extrabold text-brand-dark">
                                                {item.count}
                                            </span>
                                            <span className="text-gray-400 ml-1">
                                                ({item.percentage}%)
                                            </span>
                                            {showAmounts && item.amount !== undefined && (
                                                <span className="text-[11px] font-bold text-emerald-700 block">
                                                    {formatMoney(
                                                        item.amount,
                                                        item.currency || 'ETB',
                                                    )}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Progress Track */}
                                    <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
                                        <div
                                            className={cn(
                                                'h-full rounded-full transition-all duration-500',
                                                barColor,
                                            )}
                                            style={{
                                                width: `${Math.min(100, Math.max(2, item.percentage))}%`,
                                            }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <div className="border-t border-gray-100 pt-4 mt-6 flex items-center justify-between text-[11px] text-gray-400 font-medium">
                <span>{items.length} segments reported</span>
                <span>Total count: {totalCount}</span>
            </div>
        </div>
    );
}
