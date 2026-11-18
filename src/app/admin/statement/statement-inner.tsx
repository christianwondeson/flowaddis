'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { adminInventoryFetch } from '@/lib/admin-inventory-api';
import {
    AdminDataTable,
    ADMIN_PAGE_SIZE,
    type AdminColumn,
} from '@/components/ui/admin-data-table';
import { AdminLoader, EmptyValue } from '@/components/ui/admin-loader';
import { formatAdminDate } from '@/lib/admin-date-format';
import { cn } from '@/lib/utils';
import { AdminPeriodRangeFilter } from '@/components/admin/admin-period-range-filter';
import { defaultLastMonthRange } from '@/lib/admin-period-utils';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

type StatementRow = {
    booking_id: string;
    book_number: string;
    hotel_id?: string | null;
    hotel_name?: string | null;
    guest_name?: string | null;
    check_in?: string | null;
    check_out?: string | null;
    result: 'pending' | 'stayed' | 'cancelled' | 'no_show';
    original_amount: number;
    commission_amount: number;
    currency: string;
    settlement_model?: string | null;
};

type Statement = {
    period_start: string;
    period_end: string;
    items: StatementRow[];
    commission_total: number;
    currency: string;
    stayed_count: number;
};

type HotelOption = { id: string; name: string };

function resultBadge(result: StatementRow['result']) {
    const map = {
        stayed: 'bg-teal-100 text-teal-800',
        cancelled: 'bg-red-100 text-red-800',
        no_show: 'bg-slate-200 text-slate-700',
        pending: 'bg-slate-100 text-slate-600',
    } as const;
    const label =
        result === 'stayed'
            ? 'Stayed'
            : result === 'cancelled'
              ? 'Cancelled'
              : result === 'no_show'
                ? 'No show'
                : 'Pending';
    return (
        <span
            className={cn(
                'inline-flex rounded-md px-2 py-0.5 text-[11px] font-bold',
                map[result] || map.pending,
            )}
        >
            {label}
        </span>
    );
}

export default function AdminStatementInner() {
    const searchParams = useSearchParams();
    const defaultPeriod = useMemo(() => defaultLastMonthRange(), []);

    const [from, setFrom] = useState(
        searchParams.get('from') || defaultPeriod.from,
    );
    const [to, setTo] = useState(searchParams.get('to') || defaultPeriod.to);
    const [hotelId, setHotelId] = useState(searchParams.get('hotelId') || '');
    const [hotels, setHotels] = useState<HotelOption[]>([]);
    const [statement, setStatement] = useState<Statement | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);

    useEffect(() => {
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
    }, []);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const qs = new URLSearchParams({
                from: new Date(`${from}T00:00:00`).toISOString(),
                to: new Date(`${to}T23:59:59`).toISOString(),
            });
            if (hotelId) qs.set('hotelId', hotelId);
            const data = await adminInventoryFetch<Statement>(
                `billing/commission/statement?${qs.toString()}`,
                undefined,
                'Loading statement…',
            );
            setStatement(data);
            setPage(1);
        } catch (e) {
            setError((e as Error).message);
            setStatement(null);
        } finally {
            setLoading(false);
        }
    }, [from, to, hotelId]);

    useEffect(() => {
        void load();
    }, [load]);

    const items = statement?.items || [];

    const columns: AdminColumn<StatementRow>[] = [
        {
            id: 'hotel',
            header: 'Hotel',
            cell: (r) =>
                r.hotel_name || r.hotel_id ? (
                    <button
                        type="button"
                        onClick={() => {
                            if (r.hotel_id) setHotelId(r.hotel_id);
                        }}
                        className="font-semibold text-teal-800 hover:underline text-left"
                        title="Filter statement to this hotel"
                    >
                        {r.hotel_name || 'Hotel'}
                    </button>
                ) : (
                    <EmptyValue />
                ),
        },
        {
            id: 'book',
            header: 'Book number',
            cell: (r) => (
                <Link
                    href={`/admin/reservations?bookingId=${r.booking_id}`}
                    className="text-xs font-mono text-teal-700 font-bold hover:underline"
                >
                    {r.book_number}
                </Link>
            ),
        },
        {
            id: 'guest',
            header: 'Guest name',
            cell: (r) => r.guest_name || <EmptyValue />,
        },
        {
            id: 'checkin',
            header: 'Check-in',
            cell: (r) =>
                r.check_in ? formatAdminDate(r.check_in) : <EmptyValue />,
        },
        {
            id: 'checkout',
            header: 'Check-out',
            cell: (r) =>
                r.check_out ? formatAdminDate(r.check_out) : <EmptyValue />,
        },
        {
            id: 'result',
            header: 'Result',
            cell: (r) => resultBadge(r.result),
        },
        {
            id: 'amount',
            header: 'Original amount',
            align: 'right',
            cell: (r) => (
                <span
                    className={cn(
                        'font-semibold',
                        r.result === 'cancelled' || r.result === 'no_show'
                            ? 'text-red-700'
                            : 'text-brand-dark',
                    )}
                >
                    {r.currency} {Number(r.original_amount).toLocaleString()}
                </span>
            ),
        },
        {
            id: 'commission',
            header: 'Commission',
            align: 'right',
            cell: (r) => (
                <span className="font-semibold text-brand-dark">
                    {r.currency} {Number(r.commission_amount).toLocaleString()}
                </span>
            ),
        },
    ];

    return (
        <div className="space-y-6 w-full">
            <div>
                <h1 className="text-2xl font-extrabold text-brand-dark">
                    Reservations statement
                </h1>
                <p className="text-sm text-slate-600 mt-1">
                    Portfolio reservations statement across all hotels. Filter by
                    hotel here — hotel agents see their own statement in Hotel Admin.
                </p>
            </div>

            <AdminPeriodRangeFilter
                from={from}
                to={to}
                onChange={(nextFrom, nextTo) => {
                    setFrom(nextFrom);
                    setTo(nextTo);
                }}
                onApply={() => void load()}
                applyLabel="Generate statement"
            >
                <div className="min-w-[220px] flex-1 sm:flex-none sm:min-w-[260px]">
                    <p className="text-xs font-bold text-slate-500 uppercase mb-1.5">
                        Hotel
                    </p>
                    <Select
                        value={hotelId || 'all'}
                        onValueChange={(v) =>
                            setHotelId(v === 'all' ? '' : v)
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
            </AdminPeriodRangeFilter>

            {error ? (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                    {error}
                </div>
            ) : null}

            {statement && !loading ? (
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm flex flex-wrap items-center justify-between gap-2">
                    <span>
                        <strong>{statement.stayed_count}</strong> stayed ·{' '}
                        {formatAdminDate(statement.period_start)} –{' '}
                        {formatAdminDate(statement.period_end)}
                    </span>
                    <span className="font-extrabold text-brand-dark">
                        Commission total: {statement.currency}{' '}
                        {Number(statement.commission_total).toLocaleString()}
                    </span>
                </div>
            ) : null}

            {loading ? (
                <AdminLoader label="Loading statement…" />
            ) : (
                <AdminDataTable
                    columns={columns}
                    rows={items}
                    rowKey={(r) => r.booking_id}
                    loading={false}
                    emptyLabel="No stay outcomes in this period."
                    page={page}
                    pageSize={ADMIN_PAGE_SIZE}
                    total={items.length}
                    onPageChange={setPage}
                    columnPrefsKey="super-admin-statement"
                    minTableWidth={1000}
                />
            )}
        </div>
    );
}
