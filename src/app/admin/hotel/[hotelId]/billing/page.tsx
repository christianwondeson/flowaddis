'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { hotelAdminFetch } from '@/lib/hotel-admin-api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AdminLoader } from '@/components/ui/admin-loader';
import {
    AdminDataTable,
    ADMIN_PAGE_SIZE,
    type AdminColumn,
} from '@/components/ui/admin-data-table';
import { toast } from 'sonner';
import { Copy, FileText, Loader2, Printer, Download, Building2 } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { formatAdminDate } from '@/lib/admin-date-format';
import { cn } from '@/lib/utils';
import {
    AdminFinanceFilters,
    type FinanceStatusFilter,
} from '@/components/admin/admin-finance-filters';
import { monthBounds } from '@/lib/admin-period-utils';

type CommissionInvoice = {
    id: string;
    kind: string;
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

type CommissionOutstanding = {
    has_unpaid: boolean;
    invoice: CommissionInvoice | null;
};

type PayoutProfile = {
    bank_name?: string | null;
    account_number?: string | null;
    account_name?: string | null;
    cbe_account?: string | null;
    preferred_rail?: string;
    commission_percent?: string | null;
} | null;

type Overview = {
    commission: CommissionOutstanding;
    payout_profile: PayoutProfile;
};

function formatPeriod(start?: string | null, end?: string | null) {
    if (!start || !end) return '—';
    return `${formatAdminDate(start)} – ${formatAdminDate(end)}`;
}

function statementHref(
    hotelId: string,
    periodStart?: string | null,
    periodEnd?: string | null,
) {
    const qs = new URLSearchParams();
    if (periodStart) qs.set('from', periodStart.slice(0, 10));
    if (periodEnd) qs.set('to', periodEnd.slice(0, 10));
    const q = qs.toString();
    return `/admin/hotel/${hotelId}/statement${q ? `?${q}` : ''}`;
}

function copyRef(ref: string) {
    void navigator.clipboard.writeText(ref).then(
        () => toast.success('Invoice number copied'),
        () => toast.error('Could not copy'),
    );
}

export default function HotelBillingPage() {
    const params = useParams();
    const hotelId = String(params.hotelId || '');
    const [overview, setOverview] = useState<Overview | null>(null);
    const [invoices, setInvoices] = useState<CommissionInvoice[]>([]);
    const [pendingInvoices, setPendingInvoices] = useState<CommissionInvoice[]>(
        [],
    );
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [status, setStatus] = useState<FinanceStatusFilter>('all');
    const [year, setYear] = useState<number | 'all'>(new Date().getFullYear());
    const [from, setFrom] = useState('');
    const [to, setTo] = useState('');
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [generating, setGenerating] = useState(false);
    const [paying, setPaying] = useState(false);
    const [payMsisdn, setPayMsisdn] = useState('');
    const [pendingPayRef, setPendingPayRef] = useState<string | null>(null);
    const [savingPayout, setSavingPayout] = useState(false);
    const [payoutForm, setPayoutForm] = useState({
        account_name: '',
        cbe_account: '',
        bank_name: '',
        account_number: '',
    });
    const [bankInstructionsOpen, setBankInstructionsOpen] = useState(false);
    const [invoiceForPrint, setInvoiceForPrint] = useState<CommissionInvoice | null>(
        null,
    );

    const lastMonth = useMemo(() => {
        const d = new Date();
        d.setMonth(d.getMonth() - 1);
        return monthBounds(d);
    }, []);

    const load = useCallback(async () => {
        if (!hotelId) return;
        setLoading(true);
        try {
            const qs = new URLSearchParams({ limit: '100' });
            if (status !== 'all') qs.set('status', status);
            if (year !== 'all') qs.set('year', String(year));
            if (from) qs.set('from', new Date(`${from}T00:00:00`).toISOString());
            if (to) qs.set('to', new Date(`${to}T23:59:59`).toISOString());

            const [ov, inv, pending] = await Promise.all([
                hotelAdminFetch<Overview>(`hotels/${hotelId}/billing`),
                hotelAdminFetch<{ items: CommissionInvoice[] }>(
                    `hotels/${hotelId}/billing/commission/invoices?${qs.toString()}`,
                ),
                hotelAdminFetch<{ items: CommissionInvoice[] }>(
                    `hotels/${hotelId}/billing/commission/invoices?status=pending&limit=50`,
                ),
            ]);
            setOverview(ov);
            setInvoices(inv.items || []);
            setPendingInvoices(pending.items || []);
            setPage(1);
            const pendingIds = (pending.items || []).map((i) => i.id);
            setSelectedIds(new Set(pendingIds));
            const profile = ov.payout_profile;
            if (profile) {
                setPayoutForm({
                    account_name: profile.account_name || '',
                    cbe_account: profile.cbe_account || '',
                    bank_name: profile.bank_name || '',
                    account_number: profile.account_number || '',
                });
            }
        } catch (e) {
            toast.error((e as Error).message);
        } finally {
            setLoading(false);
        }
    }, [hotelId, status, year, from, to]);

    useEffect(() => {
        void load();
    }, [load]);

    const savePayout = async () => {
        setSavingPayout(true);
        try {
            await hotelAdminFetch(`hotels/${hotelId}/billing/payout-profile`, {
                method: 'PUT',
                body: JSON.stringify({
                    ...payoutForm,
                    preferred_rail: 'cbe',
                }),
            });
            toast.success('Payout profile saved.');
            void load();
        } catch (e) {
            toast.error((e as Error).message);
        } finally {
            setSavingPayout(false);
        }
    };

    const generateLastMonth = async () => {
        setGenerating(true);
        try {
            const fromIso = lastMonth.start.toISOString();
            const toIso = new Date(
                lastMonth.end.getFullYear(),
                lastMonth.end.getMonth(),
                lastMonth.end.getDate(),
                23,
                59,
                59,
            ).toISOString();
            await hotelAdminFetch(
                `hotels/${hotelId}/billing/commission/generate?from=${encodeURIComponent(fromIso)}&to=${encodeURIComponent(toIso)}`,
                { method: 'POST' },
            );
            toast.success('Commission invoice generated.');
            void load();
        } catch (e) {
            toast.error((e as Error).message);
        } finally {
            setGenerating(false);
        }
    };

    const paySelected = async () => {
        const selected = pendingInvoices.filter((i) => selectedIds.has(i.id));
        const invoice = selected[0] || overview?.commission?.invoice;
        if (!invoice?.id) {
            toast.error('Select an outstanding invoice to pay.');
            return;
        }
        const msisdn = payMsisdn.trim();
        if (!msisdn) {
            toast.error('Enter CBE Birr mobile number.');
            return;
        }
        setPaying(true);
        try {
            const res = await hotelAdminFetch<{ paymentReference: string }>(
                `hotels/${hotelId}/billing/commission/pay/cbe-birr`,
                {
                    method: 'POST',
                    body: JSON.stringify({
                        invoiceId: invoice.id,
                        customerMsisdn: msisdn,
                    }),
                },
            );
            setPendingPayRef(res.paymentReference);
            toast.message('Approve the CBE Birr prompt on your phone.');
        } catch (e) {
            toast.error((e as Error).message);
        } finally {
            setPaying(false);
        }
    };

    useEffect(() => {
        if (!pendingPayRef || !hotelId) return;
        let cancelled = false;
        const id = window.setInterval(async () => {
            try {
                const st = await hotelAdminFetch<{ status: string }>(
                    `hotels/${hotelId}/billing/invoices/status?paymentReference=${encodeURIComponent(pendingPayRef)}`,
                );
                if (cancelled) return;
                if (st.status === 'paid') {
                    window.clearInterval(id);
                    setPendingPayRef(null);
                    toast.success('Commission invoice paid.');
                    void load();
                }
            } catch {
                /* poll */
            }
        }, 4000);
        return () => {
            cancelled = true;
            window.clearInterval(id);
        };
    }, [pendingPayRef, hotelId, load]);

    if (!overview && loading) {
        return (
            <div className="p-6 sm:p-8">
                <AdminLoader label="Loading finance…" />
            </div>
        );
    }

    if (!overview) {
        return null;
    }

    const amountDue = pendingInvoices
        .filter((i) => selectedIds.has(i.id))
        .reduce((sum, i) => sum + Number(i.amount || 0), 0);
    const currency =
        pendingInvoices[0]?.currency ||
        invoices[0]?.currency ||
        'ETB';

    const toggleSelect = (id: string) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const historyColumns: AdminColumn<CommissionInvoice>[] = [
        {
            id: 'doc',
            header: 'Document',
            cell: () => (
                <span className="font-semibold text-slate-800">Commission</span>
            ),
        },
        {
            id: 'number',
            header: 'Number',
            cell: (r) => (
                <button
                    type="button"
                    onClick={() => copyRef(r.payment_reference)}
                    className="inline-flex items-center gap-1 text-xs font-mono text-slate-600 hover:text-teal-800"
                    title="Copy invoice number"
                >
                    {r.payment_reference}
                    <Copy className="w-3 h-3 shrink-0" />
                </button>
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
                r.paid_at ? formatAdminDate(r.paid_at) : '—',
        },
        {
            id: 'actions',
            header: 'Actions',
            cell: (r) => (
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => setInvoiceForPrint(r)}
                        className="inline-flex items-center gap-0.5 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:underline"
                        title="View / Print PDF"
                    >
                        PDF ⤓
                    </button>
                    <span className="text-slate-300">|</span>
                    <Link
                        href={statementHref(hotelId, r.period_start, r.period_end)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-teal-700 hover:underline"
                    >
                        <FileText className="w-3.5 h-3.5" />
                        View statement
                    </Link>
                </div>
            ),
        },
        {
            id: 'status',
            header: 'Status',
            cell: (r) => (
                <span
                    className={cn(
                        'font-semibold',
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
        <div className="p-4 sm:p-6 lg:p-8 w-full mx-auto space-y-6 sm:space-y-8">
            <div>
                <h1 className="text-xl sm:text-2xl font-extrabold text-brand-dark tracking-tight">
                    Invoices
                </h1>
                <p className="text-sm text-slate-500 mt-1 max-w-2xl">
                    Your property&apos;s commission bills only. Pay outstanding
                    invoices here — Super Admin monitors the portfolio separately.
                </p>
            </div>

            <section className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <h2 className="text-base font-bold text-amber-800">
                        Outstanding balances
                    </h2>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="rounded-xl"
                        disabled={generating}
                        onClick={() => void generateLastMonth()}
                    >
                        {generating ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Generating…
                            </>
                        ) : (
                            'Generate last month invoice'
                        )}
                    </Button>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white overflow-x-auto">
                    {pendingInvoices.length === 0 ? (
                        <p className="p-4 text-sm text-slate-500">
                            No outstanding commission invoices.
                        </p>
                    ) : (
                        <table className="w-full text-sm min-w-[720px]">
                            <thead>
                                <tr className="border-b border-slate-100 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                                    <th className="p-3 w-10" />
                                    <th className="p-3">Document</th>
                                    <th className="p-3">Number</th>
                                    <th className="p-3">Date</th>
                                    <th className="p-3">Period</th>
                                    <th className="p-3">Actions</th>
                                    <th className="p-3">Status</th>
                                    <th className="p-3 text-right">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {pendingInvoices.map((inv) => (
                                    <tr key={inv.id} className="align-middle">
                                        <td className="p-3">
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.has(inv.id)}
                                                onChange={() =>
                                                    toggleSelect(inv.id)
                                                }
                                                className="rounded border-slate-300"
                                                aria-label={`Select ${inv.payment_reference}`}
                                            />
                                        </td>
                                        <td className="p-3 font-semibold text-slate-800">
                                            Commission
                                        </td>
                                        <td className="p-3">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    copyRef(inv.payment_reference)
                                                }
                                                className="inline-flex items-center gap-1 text-xs font-mono text-slate-600 hover:text-teal-800"
                                            >
                                                {inv.payment_reference}
                                                <Copy className="w-3 h-3" />
                                            </button>
                                        </td>
                                        <td className="p-3 text-slate-700">
                                            {formatAdminDate(inv.created_at)}
                                        </td>
                                        <td className="p-3 text-slate-700">
                                            {formatPeriod(
                                                inv.period_start,
                                                inv.period_end,
                                            )}
                                        </td>
                                        <td className="p-3">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => setInvoiceForPrint(inv)}
                                                    className="inline-flex items-center gap-0.5 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:underline"
                                                    title="View / Print PDF"
                                                >
                                                    PDF ⤓
                                                </button>
                                                <span className="text-slate-300">|</span>
                                                <Link
                                                    href={statementHref(
                                                        hotelId,
                                                        inv.period_start,
                                                        inv.period_end,
                                                    )}
                                                    className="inline-flex items-center gap-1 font-semibold text-teal-700 hover:underline"
                                                >
                                                    <FileText className="w-3.5 h-3.5" />
                                                    View statement
                                                </Link>
                                            </div>
                                        </td>
                                        <td className="p-3 font-semibold text-amber-700">
                                            {inv.due_by
                                                ? `Due by ${formatAdminDate(inv.due_by)}`
                                                : 'Pending'}
                                        </td>
                                        <td className="p-3 text-right font-extrabold text-brand-dark">
                                            {inv.currency}{' '}
                                            {Number(inv.amount).toLocaleString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {pendingInvoices.length > 0 ? (
                    <div className="space-y-2">
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 flex flex-col lg:flex-row lg:items-end gap-4 justify-between">
                            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-end flex-1">
                                <div className="min-w-[200px]">
                                    <Label htmlFor="commission-msisdn">
                                        CBE Birr number
                                    </Label>
                                    <Input
                                        id="commission-msisdn"
                                        placeholder="0912345678"
                                        value={payMsisdn}
                                        onChange={(e) => setPayMsisdn(e.target.value)}
                                        className="mt-1 h-10 rounded-xl bg-white"
                                        disabled={paying || Boolean(pendingPayRef)}
                                    />
                                </div>
                                <Button
                                    type="button"
                                    className="rounded-xl h-10 bg-teal-700 hover:bg-teal-800 text-white font-semibold"
                                    disabled={
                                        paying ||
                                        Boolean(pendingPayRef) ||
                                        selectedIds.size === 0
                                    }
                                    onClick={() => void paySelected()}
                                >
                                    {paying || pendingPayRef
                                        ? 'Waiting for payment…'
                                        : 'Proceed to pay'}
                                </Button>
                            </div>
                            <div className="text-sm lg:text-right shrink-0 space-y-1">
                                <p className="text-slate-600">
                                    Total amount due:{' '}
                                    <strong className="text-brand-dark">
                                        {currency}{' '}
                                        {pendingInvoices
                                            .reduce(
                                                (s, i) => s + Number(i.amount || 0),
                                                0,
                                            )
                                            .toLocaleString()}
                                    </strong>
                                </p>
                                <p className="text-slate-600">
                                    Amount to be paid:{' '}
                                    <strong className="text-brand-dark">
                                        {currency} {amountDue.toLocaleString()}
                                    </strong>
                                </p>
                            </div>
                        </div>
                        <p className="text-xs text-slate-500 px-1">
                            If you&apos;d like to pay via bank transfer, refer to the{' '}
                            <button
                                type="button"
                                onClick={() => setBankInstructionsOpen(true)}
                                className="text-teal-700 underline font-semibold hover:text-teal-900"
                            >
                                payment instructions
                            </button>
                            .
                        </p>
                    </div>
                ) : null}
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
                />
                <AdminDataTable
                    columns={historyColumns}
                    rows={invoices}
                    rowKey={(r) => r.id}
                    loading={loading}
                    emptyLabel="No invoices match your filters."
                    page={page}
                    pageSize={ADMIN_PAGE_SIZE}
                    total={invoices.length}
                    onPageChange={setPage}
                    columnPrefsKey={`hotel-invoices-${hotelId}`}
                    minTableWidth={1000}
                />
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 space-y-4">
                <h2 className="font-bold text-brand-dark">Payout profile</h2>
                <p className="text-sm text-slate-500">
                    Bank details for prepaid net transfers. Commission rate:{' '}
                    <strong>
                        {overview.payout_profile?.commission_percent
                            ? `${Number(overview.payout_profile.commission_percent)}%`
                            : '15% (default)'}
                    </strong>
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5 sm:col-span-2">
                        <Label>Account name</Label>
                        <Input
                            value={payoutForm.account_name}
                            onChange={(e) =>
                                setPayoutForm((f) => ({
                                    ...f,
                                    account_name: e.target.value,
                                }))
                            }
                            className="h-11 rounded-xl"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label>CBE account</Label>
                        <Input
                            value={payoutForm.cbe_account}
                            onChange={(e) =>
                                setPayoutForm((f) => ({
                                    ...f,
                                    cbe_account: e.target.value,
                                }))
                            }
                            className="h-11 rounded-xl"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label>Bank name</Label>
                        <Input
                            value={payoutForm.bank_name}
                            onChange={(e) =>
                                setPayoutForm((f) => ({
                                    ...f,
                                    bank_name: e.target.value,
                                }))
                            }
                            className="h-11 rounded-xl"
                        />
                    </div>
                </div>
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => void savePayout()}
                    disabled={savingPayout}
                    className="rounded-xl"
                >
                    {savingPayout ? 'Saving…' : 'Save payout profile'}
                </Button>
            </section>

            {/* Bank Transfer Instructions Modal */}
            <Modal
                isOpen={bankInstructionsOpen}
                onClose={() => setBankInstructionsOpen(false)}
                title="Bank Transfer Payment Instructions"
            >
                <div className="space-y-4 text-sm text-slate-700">
                    <p className="text-slate-600">
                        To settle your outstanding commission invoice via bank
                        transfer or mobile banking, please use the following
                        official BookAddis account details:
                    </p>

                    <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 space-y-3 font-mono text-xs">
                        <div>
                            <span className="text-slate-400 block font-sans text-xs">
                                Beneficiary Name:
                            </span>
                            <strong className="text-slate-900 text-sm">
                                BookAddis Technologies PLC
                            </strong>
                        </div>
                        <div>
                            <span className="text-slate-400 block font-sans text-xs">
                                Bank Name:
                            </span>
                            <strong className="text-slate-900">
                                Commercial Bank of Ethiopia (CBE)
                            </strong>
                        </div>
                        <div>
                            <span className="text-slate-400 block font-sans text-xs">
                                Account Number:
                            </span>
                            <div className="flex items-center gap-2">
                                <strong className="text-teal-800 text-sm">
                                    1000456789123
                                </strong>
                                <button
                                    type="button"
                                    onClick={() => copyRef('1000456789123')}
                                    className="p-1 hover:bg-slate-200 rounded"
                                    title="Copy account number"
                                >
                                    <Copy className="w-3.5 h-3.5 text-slate-500" />
                                </button>
                            </div>
                        </div>
                        <div>
                            <span className="text-slate-400 block font-sans text-xs">
                                Telebirr Merchant ID:
                            </span>
                            <div className="flex items-center gap-2">
                                <strong className="text-slate-900 text-sm">
                                    654321 (+251911234567)
                                </strong>
                                <button
                                    type="button"
                                    onClick={() => copyRef('654321')}
                                    className="p-1 hover:bg-slate-200 rounded"
                                    title="Copy Telebirr ID"
                                >
                                    <Copy className="w-3.5 h-3.5 text-slate-500" />
                                </button>
                            </div>
                        </div>
                        <div className="border-t border-slate-200 pt-2">
                            <span className="text-amber-800 block font-sans text-xs font-bold">
                                Important Payment Reference:
                            </span>
                            <p className="text-slate-700 font-sans text-xs mt-0.5">
                                Please quote your Invoice Number (e.g.{' '}
                                {pendingInvoices[0]?.payment_reference ||
                                    '1660385575'}
                                ) in the transfer remarks or description field so
                                payment can be matched automatically.
                            </p>
                        </div>
                    </div>

                    <div className="flex justify-end pt-2">
                        <Button
                            type="button"
                            className="rounded-xl"
                            onClick={() => setBankInstructionsOpen(false)}
                        >
                            Understood
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Print / View PDF Invoice Modal */}
            <Modal
                isOpen={Boolean(invoiceForPrint)}
                onClose={() => setInvoiceForPrint(null)}
                title={`Commission Invoice #${invoiceForPrint?.payment_reference || ''}`}
            >
                {invoiceForPrint && (
                    <div className="space-y-6 text-sm">
                        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                            <div>
                                <h3 className="text-lg font-extrabold text-slate-900">
                                    BookAddis Technologies PLC
                                </h3>
                                <p className="text-xs text-slate-500">
                                    Commission Invoice · Tax ID: 0078912345
                                </p>
                            </div>
                            <div className="text-right">
                                <span
                                    className={cn(
                                        'inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider',
                                        invoiceForPrint.status === 'paid'
                                            ? 'bg-emerald-100 text-emerald-800'
                                            : 'bg-amber-100 text-amber-800',
                                    )}
                                >
                                    {invoiceForPrint.status === 'paid'
                                        ? 'Paid'
                                        : 'Outstanding'}
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-xs">
                            <div>
                                <span className="text-slate-400 block font-bold uppercase">
                                    Invoice Number
                                </span>
                                <strong className="text-slate-900 font-mono text-sm">
                                    {invoiceForPrint.payment_reference}
                                </strong>
                            </div>
                            <div>
                                <span className="text-slate-400 block font-bold uppercase">
                                    Invoice Date
                                </span>
                                <strong className="text-slate-900">
                                    {formatAdminDate(invoiceForPrint.created_at)}
                                </strong>
                            </div>
                            <div>
                                <span className="text-slate-400 block font-bold uppercase">
                                    Billing Period
                                </span>
                                <strong className="text-slate-900">
                                    {formatPeriod(
                                        invoiceForPrint.period_start,
                                        invoiceForPrint.period_end,
                                    )}
                                </strong>
                            </div>
                            <div>
                                <span className="text-slate-400 block font-bold uppercase">
                                    Payment Due Date
                                </span>
                                <strong className="text-slate-900">
                                    {invoiceForPrint.due_by
                                        ? formatAdminDate(invoiceForPrint.due_by)
                                        : 'Due upon receipt'}
                                </strong>
                            </div>
                        </div>

                        <div className="rounded-xl border border-slate-200 overflow-hidden">
                            <table className="w-full text-xs">
                                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-left">
                                    <tr>
                                        <th className="p-3">Description</th>
                                        <th className="p-3">Stay Outcomes</th>
                                        <th className="p-3 text-right">
                                            Total Commission
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td className="p-3 font-medium text-slate-800">
                                            OTA Platform Commission Fees (Direct &amp; POS
                                            reservations)
                                        </td>
                                        <td className="p-3 text-slate-600">
                                            {invoiceForPrint.booking_count != null
                                                ? `${invoiceForPrint.booking_count} bookings`
                                                : 'Stayed stays'}
                                        </td>
                                        <td className="p-3 text-right font-bold text-slate-900">
                                            {invoiceForPrint.currency}{' '}
                                            {Number(
                                                invoiceForPrint.amount,
                                            ).toLocaleString(undefined, {
                                                minimumFractionDigits: 2,
                                                maximumFractionDigits: 2,
                                            })}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        <div className="flex items-center justify-between border-t border-slate-200 pt-4">
                            <Link
                                href={statementHref(
                                    hotelId,
                                    invoiceForPrint.period_start,
                                    invoiceForPrint.period_end,
                                )}
                                className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-700 hover:underline"
                            >
                                <FileText className="w-4 h-4" />
                                View itemized reservation statement
                            </Link>

                            <div className="flex items-center gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="rounded-xl"
                                    onClick={() => window.print()}
                                >
                                    <Printer className="w-4 h-4 mr-1.5" />
                                    Print Invoice
                                </Button>
                                <Button
                                    type="button"
                                    size="sm"
                                    className="rounded-xl"
                                    onClick={() => setInvoiceForPrint(null)}
                                >
                                    Close
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}
