'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { adminInventoryFetch } from '@/lib/admin-inventory-api';
import {
    AdminDataTable,
    ADMIN_PAGE_SIZE,
    type AdminColumn,
} from '@/components/ui/admin-data-table';
import { EmptyValue } from '@/components/ui/admin-loader';
import { Preloader } from '@/components/ui/preloader';
import { formatAdminDate, formatAdminDateTime } from '@/lib/admin-date-format';
import {
    AlertCircle,
    Wallet,
    Download,
    CheckCircle2,
    Clock,
    AlertTriangle,
    FileText,
    Building2,
    RefreshCw,
    ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
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
    const [searchQuery, setSearchQuery] = useState('');
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
            if (status === 'pending' || status === 'paid') qs.set('status', status);
            else if (status === 'overdue') qs.set('status', 'pending');
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

    // Client-side filtering for search query and overdue condition
    const filteredInvoices = useMemo(() => {
        let list = invoices;
        const now = new Date();

        if (status === 'overdue') {
            list = list.filter(
                (i) => i.status !== 'paid' && i.due_by && new Date(i.due_by) < now,
            );
        } else if (status === 'pending') {
            list = list.filter((i) => i.status !== 'paid');
        } else if (status === 'paid') {
            list = list.filter((i) => i.status === 'paid');
        }

        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase().trim();
            list = list.filter(
                (i) =>
                    (i.payment_reference && i.payment_reference.toLowerCase().includes(q)) ||
                    (i.hotel_name && i.hotel_name.toLowerCase().includes(q)) ||
                    (i.id && i.id.toLowerCase().includes(q)),
            );
        }
        return list;
    }, [invoices, status, searchQuery]);

    const filteredTotalAmount = useMemo(() => {
        return filteredInvoices.reduce((sum, inv) => sum + Number(inv.amount || 0), 0);
    }, [filteredInvoices]);

    const exportCsv = () => {
        if (filteredInvoices.length === 0) return;
        const headers = [
            'Invoice ID',
            'Hotel ID',
            'Hotel Name',
            'Payment Reference',
            'Status',
            'Amount',
            'Currency',
            'Period Start',
            'Period End',
            'Due Date',
            'Payment Date',
            'Created At',
        ];
        const rows = filteredInvoices.map((inv) => [
            `"${inv.id}"`,
            `"${inv.hotel_id}"`,
            `"${inv.hotel_name || ''}"`,
            `"${inv.payment_reference}"`,
            `"${inv.status}"`,
            inv.amount,
            `"${inv.currency}"`,
            `"${inv.period_start || ''}"`,
            `"${inv.period_end || ''}"`,
            `"${inv.due_by || ''}"`,
            `"${inv.paid_at || ''}"`,
            `"${inv.created_at}"`,
        ]);
        const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute(
            'download',
            `Commission_Invoices_${new Date().toISOString().slice(0, 10)}.csv`,
        );
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (loading && !overview) {
        return (
            <div className="py-24 flex items-center justify-center">
                <Preloader label="Loading portfolio finance & commission invoices…" />
            </div>
        );
    }

    const outstanding = overview?.outstanding_invoices || [];

    const isOverdue = (r: CommissionInvoice) => {
        return r.status !== 'paid' && Boolean(r.due_by && new Date(r.due_by) < new Date());
    };

    const historyColumns: AdminColumn<CommissionInvoice>[] = [
        {
            id: 'doc',
            header: 'Document',
            cell: (r) => (
                <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-teal-700 shrink-0" />
                    <div>
                        <span className="font-bold text-slate-800 text-sm">Commission</span>
                        <p className="text-[11px] text-slate-400">Monthly billing</p>
                    </div>
                </div>
            ),
        },
        {
            id: 'hotel',
            header: 'Hotel & Reference',
            cell: (r) => (
                <div>
                    <p className="font-extrabold text-brand-dark flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        {r.hotel_name || 'Hotel Partner'}
                    </p>
                    <p className="text-[11px] font-mono text-slate-500 tracking-wider">
                        {r.payment_reference}
                    </p>
                </div>
            ),
        },
        {
            id: 'date',
            header: 'Date Issued',
            cell: (r) => (
                <span className="text-sm text-slate-700">
                    {formatAdminDate(r.created_at)}
                </span>
            ),
        },
        {
            id: 'period',
            header: 'Stay Period',
            cell: (r) => (
                <span className="text-sm text-slate-600 font-medium">
                    {formatPeriod(r.period_start, r.period_end)}
                </span>
            ),
        },
        {
            id: 'paid',
            header: 'Payment Date',
            cell: (r) =>
                r.paid_at ? (
                    <span className="text-sm text-emerald-700 font-semibold">
                        {formatAdminDate(r.paid_at)}
                    </span>
                ) : (
                    <EmptyValue />
                ),
        },
        {
            id: 'status',
            header: 'Status',
            cell: (r) => {
                if (r.status === 'paid') {
                    return (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Paid
                        </span>
                    );
                }
                if (isOverdue(r)) {
                    return (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                            Overdue ({formatAdminDate(r.due_by)})
                        </span>
                    );
                }
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                        {r.due_by ? `Due by ${formatAdminDate(r.due_by)}` : 'Pending'}
                    </span>
                );
            },
        },
        {
            id: 'amount',
            header: 'Commission Amount',
            align: 'right',
            cell: (r) => (
                <div className="text-right">
                    <span className="font-extrabold text-brand-dark text-sm sm:text-base">
                        {r.currency} {Number(r.amount).toLocaleString()}
                    </span>
                    {r.booking_count != null ? (
                        <p className="text-[11px] text-slate-400">
                            {r.booking_count} reservation{r.booking_count === 1 ? '' : 's'}
                        </p>
                    ) : null}
                </div>
            ),
        },
        {
            id: 'actions',
            header: 'Actions',
            align: 'right',
            cell: (r) => (
                <Link
                    href={`/admin/statement?hotelId=${r.hotel_id}&from=${r.period_start?.slice(0, 10) || ''}&to=${r.period_end?.slice(0, 10) || ''}`}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-teal-700 bg-teal-50 border border-teal-200 hover:bg-teal-100 transition-colors"
                >
                    Statement
                    <ExternalLink className="w-3 h-3" />
                </Link>
            ),
        },
    ];

    return (
        <div className="space-y-8 w-full">
            {/* Header with Title & Action Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-extrabold text-brand-dark flex items-center gap-2">
                        <Wallet className="w-7 h-7 text-teal-700" />
                        Billing & Invoices
                    </h1>
                    <p className="text-sm text-slate-600 mt-1 max-w-3xl">
                        Super Admin portfolio overview — manage commission invoices, payment reconciliation,
                        and itemized booking statements across all partner hotels.
                    </p>
                </div>
                <div className="flex items-center gap-2.5 shrink-0">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={exportCsv}
                        disabled={filteredInvoices.length === 0}
                        className="gap-2 rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50 font-bold"
                    >
                        <Download className="w-4 h-4" />
                        Export CSV
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => void load()}
                        className="gap-2 rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50 font-bold"
                    >
                        <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
                        Refresh
                    </Button>
                </div>
            </div>

            {error ? (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
                    <span>{error}</span>
                </div>
            ) : null}

            {/* Interactive Overview KPI Cards */}
            {overview ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <button
                        type="button"
                        onClick={() => setStatus((prev) => (prev === 'pending' ? 'all' : 'pending'))}
                        className={cn(
                            'text-left rounded-2xl border p-5 transition-all cursor-pointer shadow-sm hover:shadow-md',
                            status === 'pending'
                                ? 'border-amber-400 bg-amber-50/90 ring-2 ring-amber-400/40'
                                : 'border-amber-200 bg-amber-50/50 hover:bg-amber-50',
                        )}
                    >
                        <div className="flex items-center justify-between">
                            <p className="text-[11px] font-bold uppercase tracking-wider text-amber-800">
                                Outstanding Portfolio
                            </p>
                            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-200 text-amber-900">
                                Click to filter
                            </span>
                        </div>
                        <p className="text-2xl font-black text-amber-950 mt-2">
                            {overview.currency}{' '}
                            {Number(overview.outstanding_total).toLocaleString()}
                        </p>
                        <p className="text-xs text-amber-800 font-semibold mt-1">
                            {overview.unpaid_invoice_count} unpaid invoice
                            {overview.unpaid_invoice_count === 1 ? '' : 's'} across{' '}
                            {overview.hotels_with_unpaid} hotel
                            {overview.hotels_with_unpaid === 1 ? '' : 's'}
                        </p>
                    </button>

                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                            Uninvoiced Stays
                        </p>
                        <p className="text-2xl font-black text-brand-dark mt-2">
                            {overview.currency}{' '}
                            {Number(overview.uninvoiced_commission).toLocaleString()}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                            Accrued from completed bookings, pending next monthly cycle
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() => setStatus((prev) => (prev === 'paid' ? 'all' : 'paid'))}
                        className={cn(
                            'text-left rounded-2xl border p-5 transition-all cursor-pointer shadow-sm hover:shadow-md',
                            status === 'paid'
                                ? 'border-emerald-400 bg-emerald-50/90 ring-2 ring-emerald-400/40'
                                : 'border-emerald-200 bg-emerald-50/50 hover:bg-emerald-50',
                        )}
                    >
                        <div className="flex items-center justify-between">
                            <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
                                Paid This Month
                            </p>
                            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900">
                                Click to filter
                            </span>
                        </div>
                        <p className="text-2xl font-black text-emerald-950 mt-2">
                            {overview.currency}{' '}
                            {Number(overview.paid_this_month).toLocaleString()}
                        </p>
                        <p className="text-xs text-emerald-700 font-semibold mt-1">
                            Successfully collected and reconciled commissions
                        </p>
                    </button>
                </div>
            ) : null}

            {/* Outstanding Alert Section if any */}
            {outstanding.length > 0 && (
                <section className="space-y-3">
                    <div className="flex items-center justify-between">
                        <h2 className="text-sm font-bold uppercase tracking-wide text-amber-800 flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-amber-600" />
                            Outstanding Balances Requiring Action ({outstanding.length})
                        </h2>
                    </div>
                    <div className="rounded-2xl border border-amber-200 bg-white overflow-hidden shadow-sm">
                        <ul className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
                            {outstanding.map((inv) => (
                                <li
                                    key={inv.id}
                                    className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-sm hover:bg-amber-50/30 transition-colors"
                                >
                                    <div className="flex items-start gap-3 min-w-0">
                                        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                                        <div>
                                            <p className="font-extrabold text-slate-900">
                                                Commission · {inv.hotel_name || 'Hotel Partner'}
                                            </p>
                                            <p className="text-xs text-slate-500">
                                                Period: {formatPeriod(inv.period_start, inv.period_end)} ·{' '}
                                                Issued: {formatAdminDateTime(inv.created_at)}
                                            </p>
                                            <p className="text-xs font-mono text-slate-400">
                                                Ref: {inv.payment_reference}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 shrink-0 sm:text-right">
                                        <div>
                                            <p className="font-black text-brand-dark text-base">
                                                {inv.currency}{' '}
                                                {Number(inv.amount).toLocaleString()}
                                            </p>
                                            <p className="text-xs text-amber-700 font-semibold">
                                                {inv.due_by
                                                    ? `Due by ${formatAdminDate(inv.due_by)}`
                                                    : 'Pending'}
                                            </p>
                                        </div>
                                        <Link
                                            href={`/admin/statement?hotelId=${inv.hotel_id}&from=${inv.period_start?.slice(0, 10) || ''}&to=${inv.period_end?.slice(0, 10) || ''}`}
                                            className="px-3 py-1.5 rounded-lg text-xs font-bold text-teal-700 bg-teal-50 border border-teal-200 hover:bg-teal-100 transition-colors whitespace-nowrap"
                                        >
                                            View Statement
                                        </Link>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                </section>
            )}

            {/* Filterable Invoice History Table Section */}
            <section className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <h2 className="text-base font-extrabold text-brand-dark">
                        Invoice History & Statement Records
                    </h2>
                    <div className="text-xs font-semibold text-slate-500">
                        Showing {filteredInvoices.length} matching invoices · Total:{' '}
                        <span className="font-bold text-brand-dark">
                            {overview?.currency || 'ETB'} {filteredTotalAmount.toLocaleString()}
                        </span>
                    </div>
                </div>

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
                    searchQuery={searchQuery}
                    onSearchQueryChange={setSearchQuery}
                />

                <AdminDataTable
                    columns={historyColumns}
                    rows={filteredInvoices}
                    rowKey={(r) => r.id}
                    loading={loading}
                    emptyLabel={
                        searchQuery || status !== 'all' || year !== 'all' || from || hotelId
                            ? "No commission invoices match your filter criteria."
                            : "No commission invoices generated yet."
                    }
                    page={page}
                    pageSize={ADMIN_PAGE_SIZE}
                    total={filteredInvoices.length}
                    onPageChange={setPage}
                    columnPrefsKey="super-admin-finance"
                    minTableWidth={1050}
                />
            </section>
        </div>
    );
}
