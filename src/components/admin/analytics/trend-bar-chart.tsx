'use client';

import React, { useState } from 'react';
import { BarChart3, TrendingUp, Calendar, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

export type TrendDataPoint = {
    month: string;
    ym: string;
    bookings: number;
    revenue: number;
};

export type TrendBarChartProps = {
    title?: string;
    subtitle?: string;
    data: TrendDataPoint[];
    currency?: string;
    primaryLabel?: string;
    secondaryLabel?: string;
    showDualToggle?: boolean;
    initialMetric?: 'both' | 'primary' | 'secondary';
    heightClassName?: string;
    className?: string;
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

function formatCompact(n: number) {
    return new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(
        n || 0,
    );
}

export function TrendBarChart({
    title = 'Booking & Revenue Trajectory',
    subtitle = 'Historical trends and velocity over time',
    data = [],
    currency = 'ETB',
    primaryLabel = 'Paid Revenue',
    secondaryLabel = 'Reservations',
    showDualToggle = true,
    initialMetric = 'both',
    heightClassName = 'h-64',
    className,
}: TrendBarChartProps) {
    const [graphMetric, setGraphMetric] = useState<'both' | 'primary' | 'secondary'>(initialMetric);
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

    const maxBookings = Math.max(1, ...data.map((d) => d.bookings || 0));
    const maxRevenue = Math.max(1, ...data.map((d) => d.revenue || 0));
    const totalBookings = data.reduce((acc, d) => acc + (d.bookings || 0), 0);
    const totalRevenue = data.reduce((acc, d) => acc + (d.revenue || 0), 0);
    const avgTicket = totalBookings > 0 ? Math.round(totalRevenue / totalBookings) : 0;
    const peakItem = data.reduce(
        (max, d) => ((d.revenue || 0) > (max?.revenue || 0) ? d : max),
        data[0],
    );

    return (
        <div
            className={cn(
                'bg-white p-6 md:p-8 rounded-2xl shadow-xs border border-gray-100 flex flex-col justify-between',
                className,
            )}
        >
            <div>
                {/* Header row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-lg font-extrabold text-brand-dark tracking-tight">
                                {title}
                            </h2>
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-primary/10 text-brand-primary">
                                <BarChart3 className="w-3.5 h-3.5" />
                                Live Ledger
                            </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
                    </div>

                    {showDualToggle && (
                        <div className="flex items-center bg-gray-100/90 p-1 rounded-xl text-xs font-semibold self-start sm:self-auto border border-gray-200/50">
                            <button
                                type="button"
                                onClick={() => setGraphMetric('both')}
                                className={cn(
                                    'px-3 py-1.5 rounded-lg transition-all',
                                    graphMetric === 'both'
                                        ? 'bg-white text-brand-dark shadow-xs font-bold'
                                        : 'text-gray-600 hover:text-gray-900',
                                )}
                            >
                                Dual View
                            </button>
                            <button
                                type="button"
                                onClick={() => setGraphMetric('secondary')}
                                className={cn(
                                    'px-3 py-1.5 rounded-lg transition-all',
                                    graphMetric === 'secondary'
                                        ? 'bg-white text-teal-800 shadow-xs font-bold'
                                        : 'text-gray-600 hover:text-gray-900',
                                )}
                            >
                                {secondaryLabel}
                            </button>
                            <button
                                type="button"
                                onClick={() => setGraphMetric('primary')}
                                className={cn(
                                    'px-3 py-1.5 rounded-lg transition-all',
                                    graphMetric === 'primary'
                                        ? 'bg-white text-emerald-800 shadow-xs font-bold'
                                        : 'text-gray-600 hover:text-gray-900',
                                )}
                            >
                                {primaryLabel}
                            </button>
                        </div>
                    )}
                </div>

                {/* KPI summary ribbon */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6 p-3 bg-gray-50/80 rounded-xl border border-gray-100 text-xs">
                    <div>
                        <span className="text-gray-400 block font-medium">Total Bookings</span>
                        <span className="font-bold text-sm text-teal-900">
                            {totalBookings} reservations
                        </span>
                    </div>
                    <div>
                        <span className="text-gray-400 block font-medium">Confirmed Volume</span>
                        <span className="font-bold text-sm text-emerald-900">
                            {formatMoney(totalRevenue, currency)}
                        </span>
                    </div>
                    <div>
                        <span className="text-gray-400 block font-medium">Average Order</span>
                        <span className="font-bold text-sm text-gray-800">
                            {formatMoney(avgTicket, currency)}
                        </span>
                    </div>
                    <div>
                        <span className="text-gray-400 block font-medium">Peak Volume</span>
                        <span className="font-bold text-sm text-purple-900">
                            {peakItem?.month || '—'}{' '}
                            <span className="text-xs font-normal text-purple-700">
                                ({formatCompact(peakItem?.revenue || 0)})
                            </span>
                        </span>
                    </div>
                </div>
            </div>

            {/* Chart Canvas */}
            <div className={cn('relative pt-6 pb-2', heightClassName)}>
                {/* Horizontal gridlines */}
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none text-[10px] text-gray-300">
                    <div className="border-b border-dashed border-gray-100 w-full flex justify-between pr-2">
                        <span>
                            {graphMetric === 'secondary'
                                ? `${maxBookings} bkgs`
                                : graphMetric === 'primary'
                                  ? formatCompact(maxRevenue)
                                  : '100%'}
                        </span>
                    </div>
                    <div className="border-b border-dashed border-gray-100 w-full flex justify-between pr-2">
                        <span>
                            {graphMetric === 'secondary'
                                ? `${Math.round(maxBookings * 0.75)} bkgs`
                                : graphMetric === 'primary'
                                  ? formatCompact(maxRevenue * 0.75)
                                  : '75%'}
                        </span>
                    </div>
                    <div className="border-b border-dashed border-gray-100 w-full flex justify-between pr-2">
                        <span>
                            {graphMetric === 'secondary'
                                ? `${Math.round(maxBookings * 0.5)} bkgs`
                                : graphMetric === 'primary'
                                  ? formatCompact(maxRevenue * 0.5)
                                  : '50%'}
                        </span>
                    </div>
                    <div className="border-b border-dashed border-gray-100 w-full flex justify-between pr-2">
                        <span>
                            {graphMetric === 'secondary'
                                ? `${Math.round(maxBookings * 0.25)} bkgs`
                                : graphMetric === 'primary'
                                  ? formatCompact(maxRevenue * 0.25)
                                  : '25%'}
                        </span>
                    </div>
                    <div className="border-b border-gray-200 w-full flex justify-between pr-2">
                        <span>0</span>
                    </div>
                </div>

                {/* Bars container */}
                {data.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-sm text-gray-400">
                        No activity recorded in this period.
                    </div>
                ) : (
                    <div className="h-full flex items-end justify-between gap-2 sm:gap-4 relative z-10 pl-6">
                        {data.map((row, idx) => {
                            const isHovered = hoveredIndex === idx;
                            const hBook =
                                maxBookings > 0 ? (row.bookings / maxBookings) * 100 : 0;
                            const hRev =
                                maxRevenue > 0 ? (row.revenue / maxRevenue) * 100 : 0;
                            const bookBarH = row.bookings > 0 ? Math.max(hBook, 12) : 4;
                            const revBarH = row.revenue > 0 ? Math.max(hRev, 12) : 4;

                            return (
                                <div
                                    key={row.ym || idx}
                                    onMouseEnter={() => setHoveredIndex(idx)}
                                    onMouseLeave={() => setHoveredIndex(null)}
                                    className="flex-1 flex flex-col items-center h-full justify-end group relative cursor-pointer"
                                >
                                    {/* Tooltip */}
                                    <div
                                        className={cn(
                                            'absolute -top-20 left-1/2 -translate-x-1/2 bg-gray-900/95 backdrop-blur-xs text-white text-xs font-medium px-3.5 py-2.5 rounded-xl shadow-xl z-30 transition-all pointer-events-none whitespace-nowrap border border-gray-800',
                                            isHovered
                                                ? 'opacity-100 scale-100'
                                                : 'opacity-0 scale-95 pointer-events-none',
                                        )}
                                    >
                                        <div className="font-bold text-gray-200 mb-1 flex items-center gap-1.5">
                                            <Calendar className="w-3 h-3 text-brand-primary" />
                                            {row.month} ({row.ym})
                                        </div>
                                        <div className="flex items-center gap-1.5 text-teal-300">
                                            <span className="w-2 h-2 rounded-full bg-teal-400 inline-block" />
                                            <strong>{row.bookings}</strong> {secondaryLabel}
                                        </div>
                                        <div className="flex items-center gap-1.5 text-emerald-300">
                                            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                                            <strong>{formatMoney(row.revenue, currency)}</strong> volume
                                        </div>
                                        {row.bookings > 0 && (
                                            <div className="text-[10px] text-gray-400 mt-1 border-t border-gray-800 pt-1">
                                                Avg order:{' '}
                                                {formatMoney(
                                                    Math.round(row.revenue / row.bookings),
                                                    currency,
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Bars */}
                                    <div className="w-full flex items-end justify-center gap-1.5 h-full relative">
                                        {(graphMetric === 'both' || graphMetric === 'secondary') && (
                                            <div className="flex-1 max-w-[28px] flex flex-col items-center justify-end h-full">
                                                <span
                                                    className={cn(
                                                        'text-[10px] font-bold mb-1 transition-opacity',
                                                        row.bookings > 0
                                                            ? 'text-teal-800'
                                                            : 'text-gray-300 opacity-60',
                                                    )}
                                                >
                                                    {row.bookings}
                                                </span>
                                                <div
                                                    className={cn(
                                                        'w-full rounded-t-md transition-all duration-300',
                                                        row.bookings > 0
                                                            ? 'bg-gradient-to-t from-teal-600 to-teal-400 group-hover:from-teal-500 group-hover:to-teal-300 shadow-xs'
                                                            : 'bg-gray-100 group-hover:bg-gray-200',
                                                    )}
                                                    style={{ height: `${bookBarH}%` }}
                                                />
                                            </div>
                                        )}

                                        {(graphMetric === 'both' || graphMetric === 'primary') && (
                                            <div className="flex-1 max-w-[28px] flex flex-col items-center justify-end h-full">
                                                {graphMetric === 'primary' && (
                                                    <span
                                                        className={cn(
                                                            'text-[10px] font-bold mb-1 transition-opacity',
                                                            row.revenue > 0
                                                                ? 'text-emerald-800'
                                                                : 'text-gray-300 opacity-60',
                                                        )}
                                                    >
                                                        {row.revenue > 0
                                                            ? formatCompact(row.revenue)
                                                            : '0'}
                                                    </span>
                                                )}
                                                <div
                                                    className={cn(
                                                        'w-full rounded-t-md transition-all duration-300',
                                                        row.revenue > 0
                                                            ? 'bg-gradient-to-t from-emerald-600 to-emerald-400 group-hover:from-emerald-500 group-hover:to-emerald-300 shadow-xs'
                                                            : 'bg-gray-100 group-hover:bg-gray-200',
                                                    )}
                                                    style={{ height: `${revBarH}%` }}
                                                />
                                            </div>
                                        )}
                                    </div>

                                    {/* Month Label */}
                                    <div
                                        className={cn(
                                            'text-[11px] text-center mt-2.5 font-bold transition-colors',
                                            isHovered
                                                ? 'text-brand-dark'
                                                : 'text-gray-500 group-hover:text-brand-dark',
                                        )}
                                    >
                                        {row.month}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Legend & footer */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-t border-gray-100 pt-4 mt-2 text-xs gap-2">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-xs bg-gradient-to-r from-teal-600 to-teal-400" />
                        <span className="font-semibold text-gray-700">{secondaryLabel}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-xs bg-gradient-to-r from-emerald-600 to-emerald-400" />
                        <span className="font-semibold text-gray-700">
                            {primaryLabel} ({currency})
                        </span>
                    </div>
                </div>
                <span className="text-gray-400 text-[11px] font-medium">
                    Continuous chronological ledger
                </span>
            </div>
        </div>
    );
}
