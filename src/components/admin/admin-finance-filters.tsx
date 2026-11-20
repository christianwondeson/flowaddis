'use client';

import { useEffect, useState } from 'react';
import { Filter, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { AdminPeriodRangeFilter } from '@/components/admin/admin-period-range-filter';
import { adminInventoryFetch } from '@/lib/admin-inventory-api';
import { cn } from '@/lib/utils';

export type FinanceStatusFilter = 'all' | 'pending' | 'paid' | 'overdue';

type HotelOption = { id: string; name: string };

type Props = {
    status: FinanceStatusFilter;
    onStatusChange: (status: FinanceStatusFilter) => void;
    year: number | 'all';
    onYearChange: (year: number | 'all') => void;
    from: string;
    to: string;
    onPeriodChange: (from: string, to: string) => void;
    hotelId?: string;
    onHotelIdChange?: (hotelId: string) => void;
    showHotelFilter?: boolean;
    searchQuery?: string;
    onSearchQueryChange?: (query: string) => void;
    className?: string;
};

export function AdminFinanceFilters({
    status,
    onStatusChange,
    year,
    onYearChange,
    from,
    to,
    onPeriodChange,
    hotelId = '',
    onHotelIdChange,
    showHotelFilter = false,
    searchQuery = '',
    onSearchQueryChange,
    className,
}: Props) {
    const [hotels, setHotels] = useState<HotelOption[]>([]);
    const currentYear = new Date().getFullYear();
    const years = [currentYear, currentYear - 1, currentYear - 2, currentYear - 3];

    useEffect(() => {
        if (!showHotelFilter) return;
        let cancelled = false;
        void (async () => {
            try {
                const data = await adminInventoryFetch<
                    { items?: HotelOption[] } | HotelOption[]
                >('hotels?limit=100');
                const items = Array.isArray(data) ? data : data.items || [];
                if (!cancelled) setHotels(items);
            } catch {
                if (!cancelled) setHotels([]);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [showHotelFilter]);

    const hasActiveFilters =
        status !== 'all' ||
        year !== 'all' ||
        Boolean(from && to) ||
        Boolean(hotelId) ||
        Boolean(searchQuery.trim());

    const clearFilters = () => {
        onStatusChange('all');
        onYearChange('all');
        onPeriodChange('', '');
        onHotelIdChange?.('');
        onSearchQueryChange?.('');
    };

    const statusOptions: { label: string; value: FinanceStatusFilter }[] = [
        { label: 'All Statuses', value: 'all' },
        { label: 'Outstanding', value: 'pending' },
        { label: 'Paid', value: 'paid' },
        { label: 'Overdue', value: 'overdue' },
    ];

    return (
        <div className={cn('space-y-4', className)}>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
                        <Filter className="w-4 h-4 text-teal-700" />
                        Filter & Search Invoices
                    </div>

                    {/* Quick status tabs */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-hide">
                        {statusOptions.map((opt) => {
                            const active = status === opt.value;
                            return (
                                <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => onStatusChange(opt.value)}
                                    className={cn(
                                        'px-3 py-1.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap',
                                        active
                                            ? 'bg-teal-700 text-white shadow-sm'
                                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900',
                                    )}
                                >
                                    {opt.label}
                                </button>
                            );
                        })}
                    </div>

                    {hasActiveFilters ? (
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="rounded-lg h-8 text-xs text-slate-600 hover:text-red-600"
                            onClick={clearFilters}
                        >
                            <X className="w-3.5 h-3.5 mr-1" />
                            Clear filters
                        </Button>
                    ) : null}
                </div>

                {/* Search Bar + Selects Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
                    {onSearchQueryChange ? (
                        <div className="sm:col-span-2">
                            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                                Search Reference or Hotel
                            </p>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <Input
                                    placeholder="Search by invoice #, payment ref, or hotel name…"
                                    value={searchQuery}
                                    onChange={(e) => onSearchQueryChange(e.target.value)}
                                    className="pl-9 pr-8 h-10 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white text-sm"
                                />
                                {searchQuery ? (
                                    <button
                                        type="button"
                                        onClick={() => onSearchQueryChange('')}
                                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                        aria-label="Clear search text"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                ) : null}
                            </div>
                        </div>
                    ) : null}

                    <div>
                        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                            Status
                        </p>
                        <Select
                            value={status}
                            onValueChange={(v) =>
                                onStatusChange(v as FinanceStatusFilter)
                            }
                        >
                            <SelectTrigger className="h-10 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white text-sm">
                                <SelectValue placeholder="All statuses" />
                            </SelectTrigger>
                            <SelectContent>
                                {statusOptions.map((opt) => (
                                    <SelectItem key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                            Year issued
                        </p>
                        <Select
                            value={year === 'all' ? 'all' : String(year)}
                            onValueChange={(v) =>
                                onYearChange(v === 'all' ? 'all' : Number(v))
                            }
                        >
                            <SelectTrigger className="h-10 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white text-sm">
                                <SelectValue placeholder="All years" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All years</SelectItem>
                                {years.map((y) => (
                                    <SelectItem key={y} value={String(y)}>
                                        {y}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {showHotelFilter && onHotelIdChange ? (
                        <div className="sm:col-span-2 lg:col-span-4">
                            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                                Filter by Hotel Partner
                            </p>
                            <Select
                                value={hotelId || 'all'}
                                onValueChange={(v) =>
                                    onHotelIdChange(v === 'all' ? '' : v)
                                }
                            >
                                <SelectTrigger className="h-10 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white text-sm">
                                    <SelectValue placeholder="All hotels (Entire Portfolio)" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All hotels (Entire Portfolio)</SelectItem>
                                    {hotels.map((h) => (
                                        <SelectItem key={h.id} value={h.id}>
                                            {h.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    ) : null}
                </div>
            </div>

            <AdminPeriodRangeFilter
                from={from}
                to={to}
                onChange={onPeriodChange}
                className="border-dashed"
            />
        </div>
    );
}
