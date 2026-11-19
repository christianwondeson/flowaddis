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
import { AdminLoader, EmptyValue } from '@/components/ui/admin-loader';
import { formatAdminDate } from '@/lib/admin-date-format';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import {
    Printer,
    Download,
    Info,
    AlertCircle,
    CheckCircle2,
    Calendar,
    HelpCircle,
    Loader2,
} from 'lucide-react';

type StatementRow = {
    booking_id: string;
    book_number: string;
    guest_name?: string | null;
    check_in?: string | null;
    check_out?: string | null;
    result: 'pending' | 'stayed' | 'cancelled' | 'no_show' | 'upcoming';
    original_amount: number;
    commission_amount: number;
    commission_percent?: number | null;
    currency: string;
    stay_outcome_at?: string | null;
    hotel_invoice_id?: string | null;
    dispute_status?: 'disputed' | 'resolved' | 'rejected' | null;
    dispute_reason?: string | null;
    disputed_at?: string | null;
    can_dispute?: boolean;
};

type Statement = {
    period_start: string;
    period_end: string;
    items: StatementRow[];
    commission_total: number;
    currency: string;
    stayed_count: number;
};

function formatMonthLabel(d: Date): string {
    const startStr = `1 ${d.toLocaleString('en-US', { month: 'short' })}`;
    const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    const endStr = `${lastDay} ${d.toLocaleString('en-US', { month: 'short' })} ${d.getFullYear()}`;
    return `${startStr} - ${endStr}`;
}

function getRecentMonths(count = 6) {
    const list: Array<{ label: string; from: string; to: string }> = [];
    const now = new Date();
    for (let i = 0; i < count; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const lastDay = new Date(y, d.getMonth() + 1, 0).getDate();
        const from = `${y}-${m}-01`;
        const to = `${y}-${m}-${String(lastDay).padStart(2, '0')}`;
        list.push({
            label: formatMonthLabel(d),
            from,
            to,
        });
    }
    return list;
}

function resultBadge(result: StatementRow['result']) {
    const map = {
        stayed: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
        cancelled: 'bg-rose-50 text-rose-700 border border-rose-200',
        no_show: 'bg-slate-100 text-slate-700 border border-slate-200',
        upcoming: 'bg-sky-50 text-sky-700 border border-sky-200',
        pending: 'bg-amber-50 text-amber-700 border border-amber-200',
    } as const;

    const label =
        result === 'stayed'
            ? 'Stayed'
            : result === 'cancelled'
              ? 'Cancelled'
              : result === 'no_show'
                ? 'No show'
                : result === 'upcoming'
                  ? 'Upcoming'
                  : 'Pending';

    return (
        <span
            className={cn(
                'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold capitalize',
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
    const months = useMemo(() => getRecentMonths(8), []);

    const [selectedMonthIndex, setSelectedMonthIndex] = useState<number>(0);
    const [from, setFrom] = useState(
        searchParams.get('from') || months[0]?.from || '',
    );
    const [to, setTo] = useState(
        searchParams.get('to') || months[0]?.to || '',
    );
    const [customRange, setCustomRange] = useState(false);

    const [statement, setStatement] = useState<Statement | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);

    // Disputes
    const [selectedForDispute, setSelectedForDispute] = useState<Set<string>>(
        new Set(),
    );
    const [disputeModalOpen, setDisputeModalOpen] = useState(false);
    const [infoModalOpen, setInfoModalOpen] = useState(false);
    const [disputeReason, setDisputeReason] = useState('no_show');
    const [disputeNotes, setDisputeNotes] = useState('');
    const [submittingDispute, setSubmittingDispute] = useState(false);

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
            setSelectedForDispute(new Set());
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

    const handleMonthSelect = (idx: number) => {
        setSelectedMonthIndex(idx);
        const m = months[idx];
        if (m) {
            setFrom(m.from);
            setTo(m.to);
            setCustomRange(false);
        }
    };

    const toggleDisputeSelect = (bookingId: string) => {
        setSelectedForDispute((prev) => {
            const next = new Set(prev);
            if (next.has(bookingId)) next.delete(bookingId);
            else next.add(bookingId);
            return next;
        });
    };

    const handleSelectAllDisputable = () => {
        if (!statement) return;
        const disputable = statement.items
            .filter((i) => i.can_dispute)
            .map((i) => i.booking_id);
        if (selectedForDispute.size === disputable.length) {
            setSelectedForDispute(new Set());
        } else {
            setSelectedForDispute(new Set(disputable));
        }
    };

    const handleDisputeSubmit = async () => {
        if (selectedForDispute.size === 0) return;
        setSubmittingDispute(true);
        try {
            for (const bookingId of Array.from(selectedForDispute)) {
                await hotelAdminFetch(
                    `hotels/${hotelId}/billing/commission/dispute`,
                    {
                        method: 'POST',
                        body: JSON.stringify({
                            bookingId,
                            reason: disputeReason,
                            notes: disputeNotes,
                        }),
                    },
                );
            }
            toast.success(
                `Dispute submitted for ${selectedForDispute.size} reservation(s).`,
            );
            setDisputeModalOpen(false);
            setDisputeNotes('');
            void load();
        } catch (e) {
            toast.error((e as Error).message);
        } finally {
            setSubmittingDispute(false);
        }
    };

    const exportCsv = () => {
        if (!statement || statement.items.length === 0) {
            toast.error('No statement data to export.');
            return;
        }
        const headers = [
            'Book Number',
            'Guest Name',
            'Check-in',
            'Check-out',
            'Result',
            'Original Amount',
            'Commission Amount',
            'Currency',
            'Dispute Status',
        ];
        const csvRows = [headers.join(',')];
        for (const item of statement.items) {
            csvRows.push(
                [
                    `"${item.book_number}"`,
                    `"${item.guest_name || ''}"`,
                    `"${item.check_in || ''}"`,
                    `"${item.check_out || ''}"`,
                    `"${item.result}"`,
                    item.original_amount,
                    item.commission_amount,
                    `"${item.currency}"`,
                    `"${item.dispute_status || 'none'}"`,
                ].join(','),
            );
        }
        const blob = new Blob([csvRows.join('\n')], {
            type: 'text/csv;charset=utf-8;',
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `reservations-statement-${from}-to-${to}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const items = statement?.items || [];
    const disputableItems = items.filter((i) => i.can_dispute);
    const totalSelectedCommission = items
        .filter((i) => selectedForDispute.has(i.booking_id))
        .reduce((sum, i) => sum + i.commission_amount, 0);

    const columns: AdminColumn<StatementRow>[] = [
        {
            id: 'book',
            header: 'Book number',
            alwaysVisible: true,
            cell: (r) => (
                <Link
                    href={`/admin/hotel/${hotelId}/reservations?bookingId=${r.booking_id}`}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1"
                >
                    {r.book_number}
                </Link>
            ),
        },
        {
            id: 'guest',
            header: 'Guest name',
            cell: (r) => (
                <span className="font-medium text-slate-900">
                    {r.guest_name || <EmptyValue />}
                </span>
            ),
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
            header: `Original amount (${statement?.currency || 'ETB'})`,
            align: 'right',
            cell: (r) => {
                const isZeroCommission =
                    r.result === 'cancelled' || r.result === 'no_show';
                return (
                    <span
                        className={cn(
                            'font-medium text-sm',
                            isZeroCommission
                                ? 'text-rose-600'
                                : 'text-slate-900',
                        )}
                    >
                        {r.currency} {Number(r.original_amount).toLocaleString()}
                    </span>
                );
            },
        },
        {
            id: 'commission',
            header: `Commission amount (${statement?.currency || 'ETB'})`,
            align: 'right',
            cell: (r) => (
                <span className="font-semibold text-sm text-slate-900">
                    {r.currency}{' '}
                    {Number(r.commission_amount).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                    })}
                </span>
            ),
        },
        {
            id: 'dispute',
            header: 'Dispute commission amount',
            cell: (r) => {
                if (r.dispute_status === 'disputed') {
                    return (
                        <span
                            className="inline-flex items-center gap-1 rounded bg-amber-50 px-2 py-0.5 text-xs font-bold text-amber-700 border border-amber-200"
                            title={r.dispute_reason || 'Dispute submitted'}
                        >
                            <AlertCircle className="w-3 h-3 text-amber-600" />
                            Disputed
                        </span>
                    );
                }
                if (r.commission_amount > 0 && r.can_dispute) {
                    return (
                        <input
                            type="checkbox"
                            checked={selectedForDispute.has(r.booking_id)}
                            onChange={() => toggleDisputeSelect(r.booking_id)}
                            className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 w-4 h-4 cursor-pointer"
                            aria-label={`Dispute commission for booking ${r.book_number}`}
                        />
                    );
                }
                return null;
            },
        },
    ];

    return (
        <div className="space-y-6 w-full print:p-0">
            {/* Header matching Booking.com Extranet */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
                <div>
                    <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                        Reservations statement
                    </h1>
                    <p className="text-sm text-slate-500 mt-0.5">
                        Here you can see reservations that have been invoiced.
                    </p>
                </div>
                <div className="flex items-center gap-2 print:hidden">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="rounded-xl text-slate-700 font-medium hover:bg-slate-50"
                        onClick={() => window.print()}
                    >
                        <Printer className="w-4 h-4 mr-1.5 text-slate-500" />
                        Print this page
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="rounded-xl text-slate-600 font-medium"
                        onClick={() => setInfoModalOpen(true)}
                    >
                        <HelpCircle className="w-4 h-4 mr-1.5 text-slate-500" />
                        Disputes info
                    </Button>
                </div>
            </div>

            {/* Filter Controls Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-50 border border-slate-200 rounded-2xl p-4 print:hidden">
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2">
                        <Label
                            htmlFor="statement-period"
                            className="text-xs font-bold text-slate-700 uppercase tracking-wider"
                        >
                            Period:
                        </Label>
                        <select
                            id="statement-period"
                            value={customRange ? 'custom' : selectedMonthIndex}
                            onChange={(e) => {
                                if (e.target.value === 'custom') {
                                    setCustomRange(true);
                                } else {
                                    handleMonthSelect(Number(e.target.value));
                                }
                            }}
                            className="h-9 px-3 rounded-xl border border-slate-300 bg-white text-sm font-medium text-slate-800 shadow-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                        >
                            {months.map((m, idx) => (
                                <option key={m.from} value={idx}>
                                    {m.label}
                                </option>
                            ))}
                            <option value="custom">Custom Date Range…</option>
                        </select>
                    </div>

                    {customRange && (
                        <div className="flex items-center gap-2">
                            <Input
                                type="date"
                                value={from}
                                onChange={(e) => setFrom(e.target.value)}
                                className="h-9 rounded-xl w-36 text-xs bg-white"
                            />
                            <span className="text-slate-400 text-xs">to</span>
                            <Input
                                type="date"
                                value={to}
                                onChange={(e) => setTo(e.target.value)}
                                className="h-9 rounded-xl w-36 text-xs bg-white"
                            />
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="rounded-xl border-slate-300 text-slate-800 hover:bg-white"
                        onClick={exportCsv}
                    >
                        <Download className="w-4 h-4 mr-1.5 text-slate-500" />
                        Generate statement (CSV)
                    </Button>
                </div>
            </div>

            {error ? (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                    {error}
                </div>
            ) : null}

            {/* Statement Summary Card */}
            {statement && !loading ? (
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-4 text-sm text-slate-600">
                        <div>
                            <span className="text-xs text-slate-400 block uppercase font-bold">
                                Period
                            </span>
                            <strong className="text-slate-900">
                                {formatAdminDate(statement.period_start)} –{' '}
                                {formatAdminDate(statement.period_end)}
                            </strong>
                        </div>
                        <div className="h-6 w-px bg-slate-200" />
                        <div>
                            <span className="text-xs text-slate-400 block uppercase font-bold">
                                Stayed Stays
                            </span>
                            <strong className="text-emerald-700">
                                {statement.stayed_count}
                            </strong>
                        </div>
                        <div className="h-6 w-px bg-slate-200" />
                        <div>
                            <span className="text-xs text-slate-400 block uppercase font-bold">
                                Total Bookings
                            </span>
                            <strong className="text-slate-900">
                                {statement.items.length}
                            </strong>
                        </div>
                    </div>
                    <div className="text-right">
                        <span className="text-xs text-slate-400 block uppercase font-bold">
                            Total Commission Due
                        </span>
                        <span className="text-lg font-extrabold text-teal-800">
                            {statement.currency}{' '}
                            {Number(statement.commission_total).toLocaleString(
                                undefined,
                                {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                },
                            )}
                        </span>
                    </div>
                </div>
            ) : null}

            {/* Selection Banner for Disputes */}
            {selectedForDispute.size > 0 && (
                <div className="sticky top-4 z-20 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 flex items-center justify-between shadow-md animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-amber-600" />
                        <span>
                            <strong>{selectedForDispute.size}</strong>{' '}
                            reservation(s) selected for dispute · Commission:{' '}
                            <strong>
                                {statement?.currency || 'ETB'}{' '}
                                {totalSelectedCommission.toLocaleString()}
                            </strong>
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="rounded-xl text-amber-800 hover:bg-amber-100"
                            onClick={() => setSelectedForDispute(new Set())}
                        >
                            Clear
                        </Button>
                        <Button
                            type="button"
                            size="sm"
                            className="rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold"
                            onClick={() => setDisputeModalOpen(true)}
                        >
                            Dispute selected commission
                        </Button>
                    </div>
                </div>
            )}

            {/* Statement Table */}
            {loading ? (
                <AdminLoader label="Loading statement…" />
            ) : (
                <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
                    <AdminDataTable
                        columns={columns}
                        rows={items}
                        rowKey={(r) => r.booking_id}
                        loading={false}
                        emptyLabel="No reservations found for this period."
                        page={page}
                        pageSize={ADMIN_PAGE_SIZE}
                        total={items.length}
                        onPageChange={setPage}
                        columnPrefsKey={`hotel-statement-${hotelId}`}
                        minTableWidth={950}
                    />
                </div>
            )}

            {/* Dispute Commission Dialog */}
            <Modal
                isOpen={disputeModalOpen}
                onClose={() => setDisputeModalOpen(false)}
                title="Dispute Commission"
            >
                <div className="space-y-4">
                    <p className="text-sm text-slate-600">
                        Dispute commission for the{' '}
                        <strong>{selectedForDispute.size}</strong> selected
                        reservation(s). BookAddis Finance reviews all disputes
                        prior to monthly invoice finalization.
                    </p>

                    <div className="space-y-1.5">
                        <Label htmlFor="dispute-reason">Reason for dispute</Label>
                        <select
                            id="dispute-reason"
                            value={disputeReason}
                            onChange={(e) => setDisputeReason(e.target.value)}
                            className="w-full h-10 px-3 rounded-xl border border-slate-300 text-sm bg-white"
                        >
                            <option value="no_show">
                                Guest did not show up (No show)
                            </option>
                            <option value="cancelled_direct">
                                Guest cancelled reservation directly with hotel
                            </option>
                            <option value="shortened_stay">
                                Guest checked out early / shortened stay
                            </option>
                            <option value="incorrect_rate">
                                Incorrect room rate or discounted rate charged
                            </option>
                            <option value="duplicate_reservation">
                                Duplicate reservation
                            </option>
                            <option value="other">Other reason</option>
                        </select>
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="dispute-notes">
                            Additional notes / proof (optional)
                        </Label>
                        <textarea
                            id="dispute-notes"
                            rows={3}
                            value={disputeNotes}
                            onChange={(e) => setDisputeNotes(e.target.value)}
                            placeholder="Provide details or PMS check-in reference..."
                            className="w-full p-3 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-teal-500"
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                        <Button
                            type="button"
                            variant="outline"
                            className="rounded-xl"
                            onClick={() => setDisputeModalOpen(false)}
                            disabled={submittingDispute}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            className="rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold"
                            onClick={() => void handleDisputeSubmit()}
                            disabled={submittingDispute}
                        >
                            {submittingDispute ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Submitting dispute…
                                </>
                            ) : (
                                'Submit dispute'
                            )}
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Disputes Info Modal */}
            <Modal
                isOpen={infoModalOpen}
                onClose={() => setInfoModalOpen(false)}
                title="Commission & Disputes Information"
            >
                <div className="space-y-4 text-sm text-slate-700">
                    <div className="rounded-xl bg-teal-50 p-4 border border-teal-200">
                        <h4 className="font-bold text-teal-900 mb-1">
                            Booking.com Extranet Commission Model
                        </h4>
                        <p className="text-teal-800 text-xs leading-relaxed">
                            All confirmed reservations with checkout dates in
                            this calendar month are listed on this statement.
                            Bookings are considered <strong>Stayed</strong> by
                            default unless reported otherwise.
                        </p>
                    </div>

                    <div className="space-y-2">
                        <h5 className="font-bold text-slate-900">
                            1. How commissions are calculated
                        </h5>
                        <p className="text-slate-600 text-xs leading-relaxed">
                            Commission is calculated as a percentage (e.g. 15%)
                            of the original room stay amount. For bookings
                            cancelled without penalty or reported as no-show
                            without fee, commission is <strong>0</strong>.
                        </p>
                    </div>

                    <div className="space-y-2">
                        <h5 className="font-bold text-slate-900">
                            2. When to dispute commission
                        </h5>
                        <p className="text-slate-600 text-xs leading-relaxed">
                            If a guest did not stay, cancelled directly, or
                            shortened their stay, select the checkbox next to the
                            reservation and click &quot;Dispute selected
                            commission&quot;. All disputes must be filed before
                            the 4th of the following month.
                        </p>
                    </div>

                    <div className="space-y-2">
                        <h5 className="font-bold text-slate-900">
                            3. Monthly Invoices
                        </h5>
                        <p className="text-slate-600 text-xs leading-relaxed">
                            On the 3rd of each month, a single monthly commission
                            invoice is generated aggregating all stayed
                            reservations for the previous month. You can pay via
                            CBE Birr, Telebirr, or Bank Transfer under Invoices.
                        </p>
                    </div>

                    <div className="flex justify-end pt-3 border-t border-slate-100">
                        <Button
                            type="button"
                            className="rounded-xl"
                            onClick={() => setInfoModalOpen(false)}
                        >
                            Got it
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
