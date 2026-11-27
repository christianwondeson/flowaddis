'use client';

/**
 * Shared Booking.com-style reservation row helpers for hotel admin + super admin.
 */

import { cn } from '@/lib/utils';
import { formatAdminDate } from '@/lib/admin-date-format';
import { EmptyValue } from '@/components/ui/admin-loader';

export type CommissionReservationRow = {
    id: string;
    hotel_id?: string | null;
    hotel_name?: string | null;
    guest_name?: string | null;
    adults?: number | null;
    children?: number | null;
    check_in?: string | null;
    check_out?: string | null;
    room_name?: string | null;
    booked_on?: string | Date | null;
    created_at?: string | Date | null;
    reservation_status?: string | null;
    status?: string | null;
    amount: number;
    confirmed_gross_amount?: number | null;
    commission_amount?: number | null;
    commission_percent?: number | null;
    commission_estimated?: boolean;
    currency: string;
    payment_reference?: string | null;
    settlement_model?: string | null;
    payment_timing?: string | null;
    payment_pref?: string | null;
    arrival_time?: string | null;
    need_crib?: boolean;
    need_extra_bed?: boolean;
    is_booking_for_someone_else?: boolean;
    recipient_name?: string | null;
    is_work_trip?: boolean;
    special_requests?: string | null;
    add_ons?: Record<string, unknown> | null;
    failure_reason?: string | null;
};

/**
 * Transforms technical payment or booking failure logs into
 * non-technical, user-friendly language understandable by hotel front desk & reservation users.
 */
export function formatFriendlyFailureReason(
    rawReason?: string | null,
    status?: string | null,
): string | null {
    const st = String(status || '').toLowerCase();
    const isProblemStatus =
        st.includes('cancel') ||
        st.includes('fail') ||
        st.includes('expire') ||
        st.includes('no_show') ||
        st.includes('no show');

    if (!rawReason && !isProblemStatus) return null;

    const raw = String(rawReason || '').trim();
    const lower = raw.toLowerCase();

    if (!raw) {
        if (st.includes('no_show') || st.includes('no show')) return 'Guest did not check in (No show)';
        if (st.includes('expire')) return 'Payment window expired';
        if (st.includes('cancel')) return 'Cancelled by guest or reception';
        if (st.includes('fail')) return 'Payment authorization unsuccessful';
        return null;
    }

    if (lower.includes('insufficient') || lower.includes('balance') || lower.includes('funds')) {
        return 'Insufficient account balance';
    }
    if (lower.includes('timeout') || lower.includes('timed out') || lower.includes('time_out')) {
        return 'Payment authorization timed out';
    }
    if (lower.includes('pin') || lower.includes('otp') || lower.includes('authentication')) {
        return 'Security PIN or verification failed';
    }
    if (lower.includes('decline') || lower.includes('rejected') || lower.includes('not approved')) {
        return 'Card declined by issuing bank';
    }
    if (lower.includes('caller error') || lower.includes('user cancelled') || lower.includes('customer cancelled')) {
        return 'Cancelled by customer';
    }
    if (lower.includes('inventory') || lower.includes('hold') || lower.includes('exhausted') || lower.includes('no longer')) {
        return 'Room inventory no longer available';
    }
    if (lower.includes('expired') || lower.includes('session')) {
        return 'Checkout session expired';
    }
    if (lower.includes('limit') || lower.includes('exceeded')) {
        return 'Account transaction limit exceeded';
    }
    if (lower.includes('network') || lower.includes('connect') || lower.includes('unreachable') || lower.includes('gateway')) {
        return 'Bank gateway temporarily unavailable';
    }

    // Clean up technical prefixes like "QueryFailedError: ", "Error: ", or "[100]"
    const cleaned = raw
        .replace(/^[A-Z0-9_-]+:\s*/i, '')
        .replace(/\[\d+\]\s*/g, '')
        .replace(/QueryFailedError:\s*/i, '')
        .replace(/Error:\s*/i, '');

    return cleaned.length > 55 ? `${cleaned.slice(0, 52)}…` : cleaned;
}

export function reservationStatusBadge(
    status?: string | null,
    failureReason?: string | null,
) {
    const s = (status || '').toLowerCase();
    const cancelled = s.includes('cancel') || s.includes('fail') || s.includes('expire');
    const noShow = s.includes('no show') || s.includes('no_show');
    const ok = s === 'ok' || s === 'stayed';
    const friendlyReason = formatFriendlyFailureReason(failureReason, status);

    return (
        <div className="flex flex-col">
            <span
                className={cn(
                    'text-[13px] font-bold',
                    cancelled
                        ? 'text-red-600'
                        : noShow
                          ? 'text-slate-600'
                          : ok
                            ? 'text-slate-900'
                            : 'text-slate-600',
                )}
            >
                {status || '—'}
            </span>
            {friendlyReason && cancelled && (
                <span
                    className="text-[11px] font-medium text-rose-600 leading-tight mt-0.5 max-w-[220px]"
                    title={friendlyReason}
                >
                    {friendlyReason}
                </span>
            )}
        </div>
    );
}

export function paymentTypeLabel(b: CommissionReservationRow) {
    if (
        b.settlement_model === 'prepaid' ||
        b.payment_timing === 'PREPAY'
    ) {
        return 'Prepaid';
    }
    if (
        b.settlement_model === 'pay_at_property' ||
        b.payment_timing === 'PAY_AT_PROPERTY' ||
        b.payment_pref === 'pay_at_property'
    ) {
        return 'Pay at hotel';
    }
    return '—';
}

export function occupancyLine(b: CommissionReservationRow) {
    const parts: string[] = [];
    if (b.adults != null) {
        parts.push(`${b.adults} adult${b.adults === 1 ? '' : 's'}`);
    }
    if (b.children) {
        parts.push(
            `${b.children} child${b.children === 1 ? '' : 'ren'}`,
        );
    }
    return parts.length ? parts.join(', ') : null;
}

export function priceCell(b: CommissionReservationRow) {
    const isZero =
        b.reservation_status === 'Cancelled' ||
        b.reservation_status === 'No show';
    const value = Number(b.confirmed_gross_amount ?? b.amount);
    return (
        <span
            className={cn(
                'font-semibold whitespace-nowrap',
                isZero ? 'text-red-700' : 'text-slate-900',
            )}
        >
            {b.currency} {value.toLocaleString()}
        </span>
    );
}

export function commissionCell(b: CommissionReservationRow) {
    const pct =
        b.commission_percent != null && Number.isFinite(Number(b.commission_percent))
            ? ` (${Number(b.commission_percent)}%)`
            : '';
    return (
        <span className="font-semibold whitespace-nowrap text-slate-900">
            {b.currency} {Number(b.commission_amount ?? 0).toLocaleString()}
            <span className="text-[11px] font-medium text-slate-500">{pct}</span>
        </span>
    );
}

export function dateCell(value?: string | Date | null) {
    if (!value) return <EmptyValue />;
    return (
        <span className="whitespace-nowrap text-sm">
            {formatAdminDate(value)}
        </span>
    );
}

/** Compact expand panel shared by Super Admin + Hotel Admin reservation tables. */
export function reservationExpandPanel(
    b: CommissionReservationRow & {
        guest_email?: string | null;
        guest_phone?: string | null;
        commission_status?: string | null;
        stay_outcome?: string | null;
    },
    opts?: {
        onOpenDetail?: () => void;
        statementHref?: string;
        invoicesHref?: string;
    },
) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
            <div className="rounded-xl border border-slate-200 bg-white p-3">
                <p className="text-[11px] font-bold uppercase text-slate-500">
                    Guest contact
                </p>
                <p className="font-semibold text-brand-dark mt-1">
                    {b.recipient_name ? `${b.recipient_name} (Guest)` : (b.guest_name || '—')}
                </p>
                {b.recipient_name && b.guest_name && (
                    <p className="text-[11px] text-amber-700">Booked by: {b.guest_name}</p>
                )}
                <p className="text-xs text-slate-500 mt-0.5 break-all">
                    {b.guest_email || 'No email'}
                </p>
                <p className="text-xs text-slate-500">{b.guest_phone || 'No phone'}</p>
                {b.arrival_time && (
                    <p className="mt-1 text-[11px] font-semibold text-brand-primary">
                        Arrival: {b.arrival_time}
                    </p>
                )}
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-3">
                <p className="text-[11px] font-bold uppercase text-slate-500">
                    Payment
                </p>
                <p className="font-semibold mt-1">{paymentTypeLabel(b)}</p>
                <p className="text-xs text-slate-500 mt-0.5 font-mono">
                    {b.payment_reference || b.id.slice(0, 8)}
                </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-3">
                <p className="text-[11px] font-bold uppercase text-slate-500">
                    Commission
                </p>
                <p className="font-extrabold text-brand-dark mt-1">
                    {b.currency} {Number(b.commission_amount ?? 0).toLocaleString()}
                    {b.commission_percent != null
                        ? ` (${b.commission_percent}%)`
                        : ''}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                    {b.commission_status ||
                        b.stay_outcome ||
                        b.reservation_status ||
                        '—'}
                </p>
            </div>
            {formatFriendlyFailureReason(b.failure_reason, b.reservation_status || b.status) && (
                <div className="rounded-xl border border-rose-200 bg-rose-50/70 p-3 sm:col-span-2 lg:col-span-4">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-rose-800">
                        Cancellation / Failure Reason
                    </p>
                    <p className="text-xs font-semibold text-rose-900 mt-0.5">
                        {formatFriendlyFailureReason(b.failure_reason, b.reservation_status || b.status)}
                    </p>
                    {b.failure_reason && (
                        <p className="text-[10px] text-rose-700/70 mt-0.5 font-mono">
                            Notice: {b.failure_reason}
                        </p>
                    )}
                </div>
            )}
            <div className="rounded-xl border border-slate-200 bg-white p-3 flex flex-col justify-between gap-2">
                <div>
                    <p className="text-[11px] font-bold uppercase text-slate-500">
                        Actions
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                        Expand shows a quick summary. Open detail for full stay
                        actions and billing links.
                    </p>
                </div>
                <div className="flex flex-wrap gap-2">
                    {opts?.onOpenDetail ? (
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                opts.onOpenDetail?.();
                            }}
                            className="h-8 rounded-lg bg-teal-600 px-3 text-xs font-semibold text-white hover:bg-teal-700"
                        >
                            Open detail
                        </button>
                    ) : null}
                    {opts?.statementHref ? (
                        <a
                            href={opts.statementHref}
                            onClick={(e) => e.stopPropagation()}
                            className="h-8 inline-flex items-center rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-teal-800 hover:bg-slate-50"
                        >
                            Statement
                        </a>
                    ) : null}
                    {opts?.invoicesHref ? (
                        <a
                            href={opts.invoicesHref}
                            onClick={(e) => e.stopPropagation()}
                            className="h-8 inline-flex items-center rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-teal-800 hover:bg-slate-50"
                        >
                            Invoices
                        </a>
                    ) : null}
                </div>
            </div>
        </div>
    );
}
