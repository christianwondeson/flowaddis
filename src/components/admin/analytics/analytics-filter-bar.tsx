'use client';

import React from 'react';
import { Filter, Search, RotateCcw, X, Building, CheckCircle2, CreditCard } from 'lucide-react';
import { cn } from '@/lib/utils';

export type TimeRangeValue = 'today' | '7days' | '30days' | '90days' | 'year' | 'all';

export type AnalyticsFilterBarProps = {
    timeRange: TimeRangeValue;
    onTimeRangeChange: (val: TimeRangeValue) => void;
    hotels?: Array<{ id: string; name: string }>;
    selectedHotelId?: string;
    onHotelChange?: (hotelId: string) => void;
    status?: string;
    onStatusChange?: (status: string) => void;
    statusOptions?: Array<{ label: string; value: string }>;
    paymentMethod?: string;
    onPaymentMethodChange?: (method: string) => void;
    paymentOptions?: Array<{ label: string; value: string }>;
    searchQuery?: string;
    onSearchQueryChange?: (q: string) => void;
    searchPlaceholder?: string;
    onReset?: () => void;
    className?: string;
};

export function AnalyticsFilterBar({
    timeRange,
    onTimeRangeChange,
    hotels,
    selectedHotelId = '',
    onHotelChange,
    status = 'all',
    onStatusChange,
    statusOptions = [
        { label: 'All Statuses', value: 'all' },
        { label: 'Confirmed / Paid', value: 'confirmed' },
        { label: 'Pending / Initiated', value: 'pending' },
        { label: 'Cancelled / Failed', value: 'cancelled' },
    ],
    paymentMethod = 'all',
    onPaymentMethodChange,
    paymentOptions = [
        { label: 'All Payment Methods', value: 'all' },
        { label: 'CBE Birr', value: 'cbe' },
        { label: 'Telebirr', value: 'telebirr' },
        { label: 'MPGS / Cards', value: 'mpgs' },
        { label: 'Pay at Property', value: 'cash' },
    ],
    searchQuery = '',
    onSearchQueryChange,
    searchPlaceholder = 'Search guest, booking ref, or property…',
    onReset,
    className,
}: AnalyticsFilterBarProps) {
    const activeFiltersCount =
        (timeRange !== '30days' ? 1 : 0) +
        (selectedHotelId ? 1 : 0) +
        (status !== 'all' ? 1 : 0) +
        (paymentMethod !== 'all' ? 1 : 0) +
        (searchQuery.trim().length > 0 ? 1 : 0);

    return (
        <div
            className={cn(
                'bg-white rounded-2xl border border-gray-200/80 p-3 sm:p-4 shadow-xs space-y-3',
                className,
            )}
        >
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs font-bold text-gray-700">
                    <Filter className="w-4 h-4 text-brand-primary" />
                    <span>Filter & Analytics Controls</span>
                    {activeFiltersCount > 0 && (
                        <span className="inline-flex items-center justify-center bg-brand-primary text-white text-[10px] font-extrabold rounded-full w-5 h-5">
                            {activeFiltersCount}
                        </span>
                    )}
                </div>

                {activeFiltersCount > 0 && onReset && (
                    <button
                        type="button"
                        onClick={onReset}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-brand-primary transition-colors cursor-pointer"
                    >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Reset filters</span>
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-2.5">
                {/* Time Range Selector */}
                <div className="relative">
                    <label className="text-[10px] uppercase font-bold text-gray-400 mb-1 block">
                        Time Window
                    </label>
                    <select
                        value={timeRange}
                        onChange={(e) => onTimeRangeChange(e.target.value as TimeRangeValue)}
                        className="w-full bg-gray-50/80 hover:bg-white focus:bg-white border border-gray-200 text-xs font-semibold text-gray-700 rounded-xl px-3 py-2 cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
                    >
                        <option value="today">Today (24h)</option>
                        <option value="7days">Last 7 Days</option>
                        <option value="30days">Last 30 Days (Standard)</option>
                        <option value="90days">Last 90 Days (Quarter)</option>
                        <option value="year">This Year (YTD)</option>
                        <option value="all">All Time (Full Ledger)</option>
                    </select>
                </div>

                {/* Hotel Selector (if provided) */}
                {hotels && onHotelChange && (
                    <div className="relative">
                        <label className="text-[10px] uppercase font-bold text-gray-400 mb-1 block">
                            Property / Destination
                        </label>
                        <select
                            value={selectedHotelId}
                            onChange={(e) => onHotelChange(e.target.value)}
                            className="w-full bg-gray-50/80 hover:bg-white focus:bg-white border border-gray-200 text-xs font-semibold text-gray-700 rounded-xl px-3 py-2 cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary truncate"
                        >
                            <option value="">All Hotels (Global Platform)</option>
                            {hotels.map((h) => (
                                <option key={h.id} value={h.id}>
                                    {h.name}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                {/* Status Selector */}
                {onStatusChange && (
                    <div className="relative">
                        <label className="text-[10px] uppercase font-bold text-gray-400 mb-1 block">
                            Reservation Status
                        </label>
                        <select
                            value={status}
                            onChange={(e) => onStatusChange(e.target.value)}
                            className="w-full bg-gray-50/80 hover:bg-white focus:bg-white border border-gray-200 text-xs font-semibold text-gray-700 rounded-xl px-3 py-2 cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
                        >
                            {statusOptions.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                {/* Payment Method Selector */}
                {onPaymentMethodChange && (
                    <div className="relative">
                        <label className="text-[10px] uppercase font-bold text-gray-400 mb-1 block">
                            Payment Channel
                        </label>
                        <select
                            value={paymentMethod}
                            onChange={(e) => onPaymentMethodChange(e.target.value)}
                            className="w-full bg-gray-50/80 hover:bg-white focus:bg-white border border-gray-200 text-xs font-semibold text-gray-700 rounded-xl px-3 py-2 cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
                        >
                            {paymentOptions.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                {/* Instant Search Input */}
                {onSearchQueryChange && (
                    <div className="relative">
                        <label className="text-[10px] uppercase font-bold text-gray-400 mb-1 block">
                            Search Query
                        </label>
                        <div className="relative flex items-center">
                            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 pointer-events-none" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => onSearchQueryChange(e.target.value)}
                                placeholder={searchPlaceholder}
                                className="w-full bg-gray-50/80 hover:bg-white focus:bg-white border border-gray-200 text-xs font-medium text-gray-800 rounded-xl pl-8 pr-7 py-2 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
                            />
                            {searchQuery && (
                                <button
                                    type="button"
                                    onClick={() => onSearchQueryChange('')}
                                    className="absolute right-2 text-gray-400 hover:text-gray-600 p-0.5 cursor-pointer"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
