'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { hotelAdminFetch } from '@/lib/hotel-admin-api';
import {
    AdminDataTable,
    ADMIN_PAGE_SIZE,
    type AdminColumn,
} from '@/components/ui/admin-data-table';
import { AdminLoader } from '@/components/ui/admin-loader';
import { EmptyValue } from '@/components/ui/admin-loader';
import { formatAdminDate } from '@/lib/admin-date-format';
import { cn } from '@/lib/utils';
import { AdminPeriodRangeFilter } from '@/components/admin/admin-period-range-filter';
import { defaultLastMonthRange } from '@/lib/admin-period-utils';

type StatementRow = {
    booking_id: string;
    book_number: string;
    guest_name?: string | null;
    check_in?: string | null;
    check_out?: string | null;
    result: 'pending' | 'stayed' | 'cancelled' | 'no_show';
    original_amount: number;
    commission_amount: number;
    currency: string;
    stay_outcome_at?: string | null;
};

type Statement = {
    period_start: string;
    period_end: string;
    items: StatementRow[];
    commission_total: number;
    currency: string;
    stayed_count: number;
};

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
                'inline-flex rounded-md px-2 py-0.5 text-[11px] font-bold capitalize',
                map[result] || map.pending,
            )}
        >
            {label}
        </span>
    );
}

export default function HotelStatementPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const hotelId = String(params.hotelId || '');
    const defaultPeriod = useMemo(() => defaultLastMonthRange(), []);

    const [from, setFrom] = useState(
        searchParams.get('from') || defaultPeriod.from,
    );
    const [to, setTo] = useState(searchParams.get('to') || defaultPeriod.to);
    const [statement, setStatement] = useState<Statement | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);

    const load = useCallback(async () => {
        if (!hotelId || !from || !to) return;
        setLoading(true);
        setError(null);
        try {
            const fromIso = new Date(`${from}T00:00:00`).toISOString();
            const toIso = new Date(`${to}T23:59:59`).toISOString();
            const data = await hotelAdminFetch<Statement>(
                `hotels/${hotelId}/billing/commission/statement?from=${encodeURIComponent(fromIso)}&to=${encodeURIComponent(toIso)}`,
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
    }, [hotelId, from, to]);

    useEffect(() => {
        void load();
    }, [load]);

    const items = statement?.items || [];

    const columns: AdminColumn<StatementRow>[] = [
        {
            id: 'book',
            header: 'Book number',
            cell: (r) => (
                <Link
                    href={`/admin/hotel/${hotelId}/reservations?bookingId=${r.booking_id}`}
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
                    Stays invoiced for this property only. Use Invoices to pay
                    your commission bill.
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
            />

            {error ? (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                    {error}
                </div>
            ) : null}

            {statement && !loading ? (
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm flex flex-wrap items-center justify-between gap-2">
                    <span>
                        <strong>{statement.stayed_count}</strong> stayed · Period{' '}
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
                    emptyLabel="No stay outcomes recorded in this period."
                    page={page}
                    pageSize={ADMIN_PAGE_SIZE}
                    total={items.length}
                    onPageChange={setPage}
                    columnPrefsKey={`hotel-statement-${hotelId}`}
                    minTableWidth={900}
                />
            )}
        </div>
    );
}
