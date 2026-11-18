'use client';

import { useEffect, useState } from 'react';
import { Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
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

export type FinanceStatusFilter = 'all' | 'pending' | 'paid';

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
        Boolean(hotelId);

    const clearFilters = () => {
        onStatusChange('all');
        onYearChange('all');
        onPeriodChange('', '');
        onHotelIdChange?.('');
    };

    return (
        <div className={cn('space-y-4', className)}>
            <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                        <Filter className="w-4 h-4 text-teal-700" />
                        Filter invoices
                    </div>
                    {hasActiveFilters ? (
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="rounded-lg h-8 text-slate-600"
                            onClick={clearFilters}
                        >
                            <X className="w-3.5 h-3.5 mr-1" />
                            Clear all
                        </Button>
                    ) : null}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div>
                        <p className="text-xs font-bold text-slate-500 uppercase mb-1.5">
                            Status
                        </p>
                        <Select
                            value={status}
                            onValueChange={(v) =>
                                onStatusChange(v as FinanceStatusFilter)
                            }
                        >
                            <SelectTrigger className="h-10 rounded-xl border-slate-200">
                                <SelectValue placeholder="All statuses" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All statuses</SelectItem>
                                <SelectItem value="pending">Outstanding</SelectItem>
                                <SelectItem value="paid">Paid</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <p className="text-xs font-bold text-slate-500 uppercase mb-1.5">
                            Year issued
                        </p>
                        <Select
                            value={year === 'all' ? 'all' : String(year)}
                            onValueChange={(v) =>
                                onYearChange(v === 'all' ? 'all' : Number(v))
                            }
                        >
                            <SelectTrigger className="h-10 rounded-xl border-slate-200">
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
                        <div className="sm:col-span-2">
                            <p className="text-xs font-bold text-slate-500 uppercase mb-1.5">
                                Hotel
                            </p>
                            <Select
                                value={hotelId || 'all'}
                                onValueChange={(v) =>
                                    onHotelIdChange(v === 'all' ? '' : v)
                                }
                            >
                                <SelectTrigger className="h-10 rounded-xl border-slate-200">
                                    <SelectValue placeholder="All hotels" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All hotels</SelectItem>
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
