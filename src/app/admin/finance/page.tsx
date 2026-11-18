'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { adminInventoryFetch } from '@/lib/admin-inventory-api';
import {
    AdminDataTable,
    ADMIN_PAGE_SIZE,
    type AdminColumn,
} from '@/components/ui/admin-data-table';
import { AdminLoader, EmptyValue } from '@/components/ui/admin-loader';
import { formatAdminDate, formatAdminDateTime } from '@/lib/admin-date-format';
import { AlertCircle, Wallet } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
    AdminFinanceFilters,
    type FinanceStatusFilter,
} from '@/components/admin/admin-finance-filters';

type CommissionInvoice = {
    id: string;
    hotel_id: string;
    hotel_name?: string | null;
    status: string;
    amount: number;
    currency: string;
    payment_reference: string;
    period_start?: string | null;
    period_end?: string | null;
    paid_at?: string | null;
    created_at: string;
    due_by?: string | null;
    booking_count?: number | null;
};

type Overview = {
    outstanding_total: number;
    uninvoiced_commission: number;
    paid_this_month: number;
    currency: string;
    unpaid_invoice_count: number;
    hotels_with_unpaid: number;
    outstanding_invoices: CommissionInvoice[];
};

function formatPeriod(start?: string | null, end?: string | null) {
    if (!start || !end) return '—';
    return `${formatAdminDate(start)} – ${formatAdminDate(end)}`;
}

export default function AdminFinancePage() {
    const searchParams = useSearchParams();
    const [overview, setOverview] = useState<Overview | null>(null);
    const [invoices, setInvoices] = useState<CommissionInvoice[]>([]);
    const [status, setStatus] = useState<FinanceStatusFilter>('all');
    const [year, setYear] = useState<number | 'all'>('all');
    const [hotelId, setHotelId] = useState(searchParams.get('hotelId') || '');
    const [from, setFrom] = useState('');
    const [to, setTo] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);

    useEffect(() => {
        const hid = searchParams.get('hotelId');
        if (hid) setHotelId(hid);
    }, [searchParams]);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const qs = new URLSearchParams({ limit: '100' });
            if (status !== 'all') qs.set('status', status);
            if (year !== 'all') qs.set('year', String(year));
            if (hotelId) qs.set('hotelId', hotelId);
            if (from) qs.set('from', new Date(`${from}T00:00:00`).toISOString());
            if (to) qs.set('to', new Date(`${to}T23:59:59`).toISOString());

            const [ov, inv] = await Promise.all([
                adminInventoryFetch<Overview>(
                    'billing/commission/overview',
                    undefined,
                    'Loading finance…',
                ),
                adminInventoryFetch<{ items: CommissionInvoice[] }>(
                    `billing/commission/invoices?${qs.toString()}`,
                    undefined,
                    'Loading invoices…',
                ),
            ]);
            setOverview(ov);
            setInvoices(inv.items || []);
            setPage(1);
        } catch (e) {
            setError((e as Error).message);
        } finally {
            setLoading(false);
        }
    }, [status, year, hotelId, from, to]);

    useEffect(() => {
        void load();
    }, [load]);

    if (loading && !overview) {
        return (
            <div className="p-6">
                <AdminLoader label="Loading portfolio finance…" />
            </div>
        );
    }

    const outstanding = overview?.outstanding_invoices || [];
    const paid = invoices.filter((i) => i.status === 'paid');
    const pending = invoices.filter((i) => i.status !== 'paid');

    const historyColumns: AdminColumn<CommissionInvoice>[] = [
        {
            id: 'doc',
            header: 'Document',
            cell: () => (
                <span className="font-semibold text-slate-800">Commission</span>
            ),
        },
        {
            id: 'hotel',
            header: 'Hotel',
            cell: (r) => (
                <div>
                    <p className="font-semibold text-brand-dark">
                        {r.hotel_name || 'Hotel'}
                    </p>
                    <p className="text-[11px] font-mono text-slate-400 truncate max-w-[120px]">
                        {r.payment_reference}
                    </p>
                </div>
            ),
        },
        {
            id: 'date',
            header: 'Date',
            cell: (r) => formatAdminDate(r.created_at),
        },
        {
            id: 'period',
            header: 'Period',
            cell: (r) => formatPeriod(r.period_start, r.period_end),
        },
        {
            id: 'paid',
            header: 'Payment date',
            cell: (r) =>
                r.paid_at ? formatAdminDate(r.paid_at) : <EmptyValue />,
        },
        {
            id: 'actions',
            header: 'Actions',
            cell: (r) => (
                <Link
                    href={`/admin/statement?hotelId=${r.hotel_id}&from=${r.period_start?.slice(0, 10) || ''}&to=${r.period_end?.slice(0, 10) || ''}`}
                    className="text-sm font-semibold text-teal-700 hover:underline"
                >
                    View statement
                </Link>
            ),
        },
        {
            id: 'status',
            header: 'Status',
            cell: (r) => (
                <span
                    className={cn(
                        'font-semibold capitalize',
                        r.status === 'paid' ? 'text-teal-700' : 'text-amber-700',
                    )}
                >
                    {r.status === 'paid'
                        ? 'Paid'
                        : r.due_by
                          ? `Due by ${formatAdminDate(r.due_by)}`
                          : r.status}
                </span>
            ),
        },
        {
            id: 'amount',
            header: 'Amount',
            align: 'right',
            cell: (r) => (
                <span className="font-extrabold text-brand-dark">
                    {r.currency} {Number(r.amount).toLocaleString()}
                </span>
            ),
        },
    ];

    return (
        <div className="space-y-8 w-full">
            <div>
                <h1 className="text-2xl font-extrabold text-brand-dark flex items-center gap-2">
                    <Wallet className="w-6 h-6 text-teal-700" />
                    Finance
                </h1>
                <p className="text-sm text-slate-600 mt-1">
                    Super Admin portfolio view — commission invoices across every
                    hotel. Hotels pay their own bills in Hotel Admin Finance; this
                    page is for monitoring only.
                </p>
            </div>

            {error ? (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                    {error}
                </div>
            ) : null}

            {overview ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                        <p className="text-[11px] font-bold uppercase text-amber-800">
                            Outstanding
                        </p>
                        <p className="text-xl font-extrabold text-amber-950 mt-1">
                            {overview.currency}{' '}
                            {Number(overview.outstanding_total).toLocaleString()}
                        </p>
                        <p className="text-xs text-amber-800 mt-1">
                            {overview.unpaid_invoice_count} invoice
                            {overview.unpaid_invoice_count === 1 ? '' : 's'} ·{' '}
                            {overview.hotels_with_unpaid} hotel
                            {overview.hotels_with_unpaid === 1 ? '' : 's'}
                        </p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                        <p className="text-[11px] font-bold uppercase text-slate-500">
                            Uninvoiced stays
                        </p>
                        <p className="text-xl font-extrabold text-brand-dark mt-1">
                            {overview.currency}{' '}
                            {Number(overview.uninvoiced_commission).toLocaleString()}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                            Stayed but not yet on a monthly invoice
                        </p>
                    </div>
                    <div className="rounded-2xl border border-teal-100 bg-teal-50/60 p-4">
                        <p className="text-[11px] font-bold uppercase text-teal-800">
                            Paid this month
                        </p>
                        <p className="text-xl font-extrabold text-teal-950 mt-1">
                            {overview.currency}{' '}
                            {Number(overview.paid_this_month).toLocaleString()}
                        </p>
                    </div>
                </div>
            ) : null}

            <section className="space-y-3">
                <h2 className="text-sm font-bold uppercase tracking-wide text-amber-800">
                    Outstanding balances
                </h2>
                <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
                    {outstanding.length === 0 ? (
                        <p className="p-4 text-sm text-slate-500">
                            No unpaid commission invoices.
                        </p>
                    ) : (
                        <ul className="divide-y divide-slate-100">
                            {outstanding.map((inv) => (
                                <li
                                    key={inv.id}
                                    className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm"
                                >
                                    <div className="flex items-start gap-2 min-w-0">
                                        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                                        <div>
                                            <p className="font-semibold text-slate-900">
                                                Commission · {inv.hotel_name || 'Hotel'}
                                            </p>
                                            <p className="text-xs text-slate-500">
                                                {formatPeriod(inv.period_start, inv.period_end)} ·{' '}
                                                {formatAdminDateTime(inv.created_at)}
                                            </p>
                                            <p className="text-xs font-mono text-slate-400">
                                                {inv.payment_reference}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-left sm:text-right shrink-0">
                                        <p className="font-extrabold text-brand-dark">
                                            {inv.currency}{' '}
                                            {Number(inv.amount).toLocaleString()}
                                        </p>
                                        <p className="text-xs text-amber-700 font-semibold">
                                            {inv.due_by
                                                ? `Due by ${formatAdminDate(inv.due_by)}`
                                                : 'Pending'}
                                        </p>
                                        <Link
                                            href={`/admin/statement?hotelId=${inv.hotel_id}&from=${inv.period_start?.slice(0, 10) || ''}&to=${inv.period_end?.slice(0, 10) || ''}`}
                                            className="text-xs text-teal-700 font-semibold hover:underline"
                                        >
                                            View statement
                                        </Link>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </section>

            <section className="space-y-3">
                <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">
                    Invoice history
                </h2>
                <AdminFinanceFilters
                    status={status}
                    onStatusChange={setStatus}
                    year={year}
                    onYearChange={setYear}
                    from={from}
                    to={to}
                    onPeriodChange={(nextFrom, nextTo) => {
                        setFrom(nextFrom);
                        setTo(nextTo);
                    }}
                    hotelId={hotelId}
                    onHotelIdChange={setHotelId}
                    showHotelFilter
                />
                <AdminDataTable
                    columns={historyColumns}
                    rows={[...pending, ...paid]}
                    rowKey={(r) => r.id}
                    loading={loading}
                    emptyLabel="No commission invoices match your filters."
                    page={page}
                    pageSize={ADMIN_PAGE_SIZE}
                    total={invoices.length}
                    onPageChange={setPage}
                    columnPrefsKey="super-admin-finance"
                    minTableWidth={1000}
                />
            </section>
        </div>
    );
}
