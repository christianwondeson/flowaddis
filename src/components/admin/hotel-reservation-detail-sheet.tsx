'use client';

import React from 'react';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { EmptyValue } from '@/components/ui/admin-loader';
import { formatAdminDate, formatAdminDateTime } from '@/lib/admin-date-format';
import {
    FLEXIBILITY_META,
    MEAL_PLAN_OPTIONS,
    RATE_SEGMENT_META,
    STAY_CODE_META,
    mealPlanLabel,
    normalizeMealPlan,
    type FlexibilityCode,
    type RateSegmentCode,
    type StayCode,
} from '@/lib/hotel-industry-codes';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { hotelAdminFetch } from '@/lib/hotel-admin-api';
import { toast } from 'sonner';
import { FileText, Loader2, Wallet } from 'lucide-react';
import Link from 'next/link';
import { formatDateLocal } from '@/lib/date-utils';
import { monthBounds } from '@/lib/admin-period-utils';
import { formatFriendlyFailureReason } from './booking-com-reservation-cols';

export type HotelReservationDetail = {
    id: string;
    status: string;
    failure_reason?: string | null;
    reservation_status?: string | null;
    settlement_model?: 'pay_at_property' | 'prepaid' | null;
    payment_timing?: string | null;
    commission_status?: string | null;
    remittance_payout?: {
        status?: string;
        amount?: number;
        currency?: string;
        cbe_reference?: string | null;
        beneficiary_name?: string | null;
    } | null;
    card_guarantee?: {
        brand?: string | null;
        last4?: string | null;
        expiry?: string | null;
        funding?: string | null;
        storage_mode?: string;
        provider?: string | null;
    } | null;
    stay_outcome?: string | null;
    stay_outcome_at?: string | null;
    amount: number;
    confirmed_gross_amount?: number | null;
    commission_amount?: number | null;
    commission_percent?: number | null;
    commission_estimated?: boolean;
    gross_for_commission?: number | null;
    currency: string;
    payment_reference?: string | null;
    payment_channel?: string | null;
    check_in?: string | null;
    check_out?: string | null;
    guest_name?: string | null;
    guest_email?: string | null;
    guest_phone?: string | null;
    room_name?: string | null;
    quantity?: number | null;
    adults?: number | null;
    children?: number | null;
    room_type_id?: string | null;
    rate_plan_id?: string | null;
    meal_plan?: string | null;
    meal_plan_label?: string | null;
    stay_codes?: string[] | null;
    rate_segment?: string | null;
    flexibility?: string | null;
    booking_type?: string | null;
    product_kind?: string | null;
    product_id?: string | null;
    special_requests?: string | null;
    early_check_in?: boolean;
    late_check_out?: boolean;
    day_use?: boolean;
    add_ons?: Record<string, unknown> | null;
    room_total?: number | null;
    extras_total?: number | null;
    extras_lines?: Array<{
        code?: string;
        label?: string;
        amount?: number;
        detail?: string;
    }> | null;
    payment_pref?: string | null;
    arrival_time?: string | null;
    need_crib?: boolean;
    need_extra_bed?: boolean;
    is_booking_for_someone_else?: boolean;
    recipient_name?: string | null;
    is_work_trip?: boolean;
    paperless_confirmation?: boolean;
    snapshot?: Record<string, unknown> | null;
    created_at?: string;
    guest_contact?: {
        name?: string | null;
        email?: string | null;
        phone?: string | null;
        mailto?: string | null;
        tel?: string | null;
    } | null;
    payment?: {
        id?: string;
        provider?: string | null;
        channel?: string | null;
        status?: string | null;
        amount?: number;
        currency?: string;
        transaction_id?: string | null;
        payment_reference?: string | null;
        confirmed_at?: string | null;
        payer_phone?: string | null;
        card?: {
            brand?: string | null;
            last4?: string | null;
            expiry?: string | null;
            funding?: string | null;
        } | null;
    } | null;
};

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    hotelId?: string;
    /** Hide POS stay actions (Super Admin portfolio view). */
    readOnly?: boolean;
    /**
     * Keep Statement / Finance links inside Super Admin routes
     * (never jump into Hotel Admin).
     */
    adminPortfolio?: boolean;
    booking: HotelReservationDetail | null;
    onUpdated?: (booking: HotelReservationDetail) => void;
};

function CodeChip({
    code,
    label,
    description,
}: {
    code: string;
    label: string;
    description: string;
}) {
    return (
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
            <p className="text-xs font-extrabold text-brand-dark tracking-wide">
                {label || code}
            </p>
            {description ? (
                <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">
                    {description}
                </p>
            ) : null}
        </div>
    );
}

function Section({
    title,
    children,
}: {
    title: string;
    children: React.ReactNode;
}) {
    return (
        <section className="space-y-2">
            <h3 className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
                {title}
            </h3>
            {children}
        </section>
    );
}

export function HotelReservationDetailSheet({
    open,
    onOpenChange,
    hotelId,
    readOnly = false,
    adminPortfolio = false,
    booking,
    onUpdated,
}: Props) {
    const [acting, setActing] = React.useState<
        'stayed' | 'no_show' | 'cancelled' | null
    >(null);
    const [confirmedAmount, setConfirmedAmount] = React.useState('');

    React.useEffect(() => {
        if (booking) {
            setConfirmedAmount(String(booking.amount ?? ''));
        }
    }, [booking?.id, booking?.amount]);

    if (!booking) return null;

    const statusNorm = String(booking.status || '').toLowerCase();
    const canSetOutcome =
        Boolean(hotelId) &&
        !readOnly &&
        !adminPortfolio &&
        (!booking.stay_outcome || booking.stay_outcome === 'pending') &&
        (statusNorm === 'confirmed' || statusNorm === 'paid');

    const runAction = async (
        action: 'stayed' | 'no_show' | 'cancelled',
    ) => {
        if (!hotelId) return;
        setActing(action);
        try {
            const path =
                action === 'stayed'
                    ? `hotels/${hotelId}/bookings/${booking.id}/stayed`
                    : action === 'no_show'
                      ? `hotels/${hotelId}/bookings/${booking.id}/no-show`
                      : `hotels/${hotelId}/bookings/${booking.id}/cancelled`;
            const body =
                action === 'stayed' && confirmedAmount
                    ? JSON.stringify({
                          confirmed_amount: Number(confirmedAmount),
                      })
                    : undefined;
            const res = await hotelAdminFetch<{
                stay_outcome: string;
                gross_amount: number;
                commission_amount: number;
                commission_percent: number;
            }>(path, { method: 'POST', body });
            const updated: HotelReservationDetail = {
                ...booking,
                stay_outcome: res.stay_outcome,
                stay_outcome_at: new Date().toISOString(),
                confirmed_gross_amount: res.gross_amount,
                commission_amount: res.commission_amount,
                commission_percent: res.commission_percent,
                reservation_status:
                    res.stay_outcome === 'stayed'
                        ? 'OK'
                        : res.stay_outcome === 'no_show'
                          ? 'No show'
                          : res.stay_outcome === 'cancelled'
                            ? 'Cancelled'
                            : booking.reservation_status,
            };
            onUpdated?.(updated);
            toast.success(
                action === 'stayed'
                    ? 'Stay confirmed — commission recorded.'
                    : action === 'no_show'
                      ? 'No-show recorded.'
                      : 'Cancellation recorded.',
            );
        } catch (e) {
            toast.error((e as Error).message);
        } finally {
            setActing(null);
        }
    };

    const meal = normalizeMealPlan(booking.meal_plan);
    const mealOpt = MEAL_PLAN_OPTIONS.find((o) => o.code === meal);
    const stayCodes = (booking.stay_codes?.length
        ? booking.stay_codes
        : booking.day_use
          ? ['DU']
          : ['OVN']) as StayCode[];
    const rateSeg = (booking.rate_segment || 'RACK') as RateSegmentCode;
    const flex = (booking.flexibility || 'FLEX') as FlexibilityCode;

    const bookNumber =
        booking.payment_reference || booking.id.slice(0, 8).toUpperCase();

    const billingPeriod = (() => {
        const raw =
            booking.stay_outcome_at ||
            booking.check_out ||
            booking.check_in ||
            booking.created_at;
        if (!raw) return null;
        const { start, end } = monthBounds(new Date(raw));
        return {
            from: formatDateLocal(start),
            to: formatDateLocal(end),
        };
    })();

    const statementHref = adminPortfolio
        ? (() => {
              const qs = new URLSearchParams();
              if (hotelId) qs.set('hotelId', hotelId);
              if (billingPeriod) {
                  qs.set('from', billingPeriod.from);
                  qs.set('to', billingPeriod.to);
              }
              const q = qs.toString();
              return `/admin/statement${q ? `?${q}` : ''}`;
          })()
        : hotelId
          ? billingPeriod
              ? `/admin/hotel/${hotelId}/statement?from=${billingPeriod.from}&to=${billingPeriod.to}`
              : `/admin/hotel/${hotelId}/statement`
          : '/admin/statement';

    const invoicesHref = adminPortfolio
        ? hotelId
            ? `/admin/finance?hotelId=${hotelId}`
            : '/admin/finance'
        : hotelId
          ? `/admin/hotel/${hotelId}/billing`
          : '/admin/finance';

    const commissionStatusLabel = (() => {
        const s = (booking.commission_status || '').toLowerCase();
        if (s === 'invoiced' || s === 'paid') return 'On invoice';
        if (s === 'pending' || booking.stay_outcome === 'stayed') {
            return 'Recorded — awaiting monthly invoice';
        }
        if (booking.stay_outcome === 'cancelled' || booking.stay_outcome === 'no_show') {
            return 'No commission';
        }
        return 'Not yet settled';
    })();

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent
                side="right"
                className="w-full sm:max-w-lg overflow-y-auto"
            >
                <SheetHeader className="text-left pr-8">
                    <SheetTitle className="text-xl font-extrabold text-brand-dark">
                        {booking.guest_name || 'Guest reservation'}
                    </SheetTitle>
                    <SheetDescription>
                        <span className="font-mono text-teal-800 font-semibold">
                            {bookNumber}
                        </span>
                        {' · '}
                        {booking.room_name || 'Room'} ·{' '}
                        {booking.reservation_status || booking.status}
                    </SheetDescription>
                </SheetHeader>

                {formatFriendlyFailureReason(booking.failure_reason, booking.reservation_status || booking.status) && (
                    <div className="rounded-xl border border-rose-200 bg-rose-50/90 p-4 my-3 text-sm shadow-xs">
                        <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-rose-800">
                            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0 animate-pulse" />
                            Cancellation / Failure Reason
                        </div>
                        <p className="text-base font-bold text-rose-950 mt-1.5">
                            {formatFriendlyFailureReason(booking.failure_reason, booking.reservation_status || booking.status)}
                        </p>
                        {booking.failure_reason && (
                            <p className="text-xs text-rose-800 mt-1.5 font-mono bg-white/70 p-2 rounded-lg border border-rose-200">
                                System log: {booking.failure_reason}
                            </p>
                        )}
                    </div>
                )}

                <Section title="Commission & billing">
                    <div className="rounded-xl border border-slate-200 p-3 text-sm space-y-3">
                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                            <div>
                                <p className="text-[11px] font-bold uppercase text-slate-500">
                                    Commission
                                </p>
                                <p className="font-extrabold text-brand-dark mt-0.5">
                                    {booking.currency}{' '}
                                    {Number(
                                        booking.commission_amount ?? 0,
                                    ).toLocaleString()}
                                    {booking.commission_percent != null
                                        ? ` (${booking.commission_percent}%)`
                                        : ''}
                                    {booking.commission_estimated
                                        ? ' · est.'
                                        : ''}
                                </p>
                                <p className="text-xs text-slate-500 mt-1">
                                    {commissionStatusLabel}
                                </p>
                            </div>
                            <div className="text-right text-xs text-slate-500">
                                {booking.settlement_model === 'prepaid'
                                    ? 'Prepaid'
                                    : booking.settlement_model ===
                                        'pay_at_property'
                                      ? 'Pay at hotel'
                                      : null}
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-2 pt-1 border-t border-slate-100">
                            <Button
                                asChild
                                type="button"
                                size="sm"
                                variant="outline"
                                className="rounded-xl"
                            >
                                <Link href={statementHref}>
                                    <FileText className="w-3.5 h-3.5 mr-1.5" />
                                    View statement
                                </Link>
                            </Button>
                            <Button
                                asChild
                                type="button"
                                size="sm"
                                variant="outline"
                                className="rounded-xl"
                            >
                                <Link href={invoicesHref}>
                                    <Wallet className="w-3.5 h-3.5 mr-1.5" />
                                    {hotelId && !adminPortfolio
                                        ? 'Open invoices'
                                        : 'Open finance'}
                                </Link>
                            </Button>
                        </div>
                        <p className="text-[11px] text-slate-500 leading-snug">
                            Same as Booking.com: confirm the stay here, then the
                            commission line appears on your reservations
                            statement and monthly invoice.
                        </p>
                    </div>
                </Section>

                {canSetOutcome ? (
                    <Section title="After guest arrives (POS)">
                        <p className="text-sm text-slate-600">
                            {booking.settlement_model === 'prepaid'
                                ? 'Guest already prepaid BookAddis. Confirm stay for your records — commission was taken when we transferred your net payout.'
                                : 'Real flow: guest shows up → you collect payment on the POS → Confirm stayed. BookAddis then records commission (price × your %).'}
                        </p>
                        {booking.settlement_model !== 'prepaid' &&
                        confirmedAmount ? (
                            <p className="text-xs text-slate-500 rounded-lg bg-slate-50 border border-slate-100 px-3 py-2">
                                Preview:{' '}
                                <strong>
                                    {booking.currency}{' '}
                                    {Number(confirmedAmount).toLocaleString()}
                                </strong>
                                {booking.commission_percent != null
                                    ? ` × ${booking.commission_percent}% = ${booking.currency} ${(
                                          (Number(confirmedAmount) *
                                              Number(booking.commission_percent)) /
                                          100
                                      ).toLocaleString(undefined, {
                                          maximumFractionDigits: 2,
                                      })}`
                                    : ' × hotel commission %'}
                            </p>
                        ) : null}
                        {acting === 'stayed' || canSetOutcome ? (
                            <div className="space-y-2">
                                <Label htmlFor="confirmed-amount">
                                    Amount collected on POS ({booking.currency})
                                </Label>
                                <Input
                                    id="confirmed-amount"
                                    type="number"
                                    min={0}
                                    value={confirmedAmount}
                                    onChange={(e) =>
                                        setConfirmedAmount(e.target.value)
                                    }
                                    className="h-10 rounded-xl"
                                    disabled={Boolean(acting)}
                                />
                            </div>
                        ) : null}
                        <div className="flex flex-wrap gap-2 pt-1">
                            <Button
                                type="button"
                                size="sm"
                                className="rounded-xl"
                                disabled={Boolean(acting)}
                                onClick={() => void runAction('stayed')}
                            >
                                {acting === 'stayed' ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    'Paid on POS — Confirm stayed'
                                )}
                            </Button>
                            <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="rounded-xl"
                                disabled={Boolean(acting)}
                                onClick={() => void runAction('no_show')}
                            >
                                {acting === 'no_show' ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    'Report no-show'
                                )}
                            </Button>
                            <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="rounded-xl"
                                disabled={Boolean(acting)}
                                onClick={() => void runAction('cancelled')}
                            >
                                {acting === 'cancelled' ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    'Mark cancelled'
                                )}
                            </Button>
                        </div>
                    </Section>
                ) : booking.stay_outcome && booking.stay_outcome !== 'pending' ? (
                    <Section title="Stay outcome">
                        <div className="rounded-xl border border-slate-200 p-3 text-sm space-y-1">
                            <p className="font-semibold capitalize">
                                {booking.reservation_status ||
                                    booking.stay_outcome.replace('_', ' ')}
                            </p>
                            {booking.stay_outcome_at ? (
                                <p className="text-xs text-slate-500">
                                    Recorded{' '}
                                    {formatAdminDateTime(booking.stay_outcome_at)}
                                </p>
                            ) : null}
                            {booking.commission_amount != null ? (
                                <p className="text-brand-dark font-bold">
                                    Commission: {booking.currency}{' '}
                                    {Number(booking.commission_amount).toLocaleString()}
                                    {booking.commission_percent != null
                                        ? ` (${booking.commission_percent}%)`
                                        : ''}
                                    {booking.commission_estimated
                                        ? ' · estimated'
                                        : ''}
                                </p>
                            ) : null}
                        </div>
                    </Section>
                ) : null}

                {booking.settlement_model === 'prepaid' &&
                booking.remittance_payout ? (
                    <Section title="Prepaid transfer">
                        <div className="rounded-xl border border-teal-100 bg-teal-50/50 p-3 text-sm space-y-1">
                            <p className="font-semibold text-teal-900">
                                Net transfer · {booking.remittance_payout.status}
                            </p>
                            <p>
                                {booking.remittance_payout.currency}{' '}
                                {Number(
                                    booking.remittance_payout.amount,
                                ).toLocaleString()}{' '}
                                → {booking.remittance_payout.beneficiary_name}
                            </p>
                            {booking.remittance_payout.cbe_reference ? (
                                <p className="text-xs font-mono text-slate-500">
                                    Ref {booking.remittance_payout.cbe_reference}
                                </p>
                            ) : null}
                        </div>
                    </Section>
                ) : null}

                <div className="mt-6 space-y-6">
                    <Section title="Stay">
                        <div className="grid grid-cols-2 gap-2 text-sm">
                            <div className="rounded-xl border border-slate-200 p-3">
                                <p className="text-[11px] text-slate-500 font-bold uppercase">
                                    Check-in
                                </p>
                                <p className="font-semibold mt-0.5">
                                    {booking.check_in
                                        ? formatAdminDate(booking.check_in, {
                                              weekday: true,
                                          })
                                        : <EmptyValue />}
                                </p>
                            </div>
                            <div className="rounded-xl border border-slate-200 p-3">
                                <p className="text-[11px] text-slate-500 font-bold uppercase">
                                    Check-out
                                </p>
                                <p className="font-semibold mt-0.5">
                                    {booking.check_out
                                        ? formatAdminDate(booking.check_out, {
                                              weekday: true,
                                          })
                                        : <EmptyValue />}
                                </p>
                            </div>
                        </div>
                        <p className="text-sm text-slate-600">
                            {booking.quantity || 1} room
                            {(booking.quantity || 1) === 1 ? '' : 's'}
                            {booking.adults != null
                                ? ` · ${booking.adults} adult${booking.adults === 1 ? '' : 's'}`
                                : ''}
                            {booking.children
                                ? ` · ${booking.children} child${booking.children === 1 ? '' : 'ren'}`
                                : ''}
                        </p>
                        {(booking.arrival_time || (booking.snapshot as any)?.arrival_time) && (
                            <div className="rounded-xl bg-teal-50 border border-teal-100 p-2.5 text-xs text-teal-900 mt-2 flex items-center justify-between">
                                <span className="font-semibold">Estimated arrival time:</span>
                                <span className="font-extrabold text-brand-primary">
                                    {booking.arrival_time || (booking.snapshot as any)?.arrival_time} (EAT)
                                </span>
                            </div>
                        )}
                        {(booking.need_crib || booking.need_extra_bed || (booking.snapshot as any)?.need_crib || (booking.snapshot as any)?.need_extra_bed) && (
                            <div className="rounded-xl bg-slate-50 border border-slate-200 p-2.5 text-xs text-slate-800 mt-2 space-y-1">
                                <span className="font-bold text-[10px] uppercase tracking-wider text-slate-400">Bedding Requests:</span>
                                <div className="flex flex-wrap gap-2 pt-0.5">
                                    {(booking.need_crib || (booking.snapshot as any)?.need_crib) && (
                                        <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-800">
                                            Crib requested (Free)
                                        </span>
                                    )}
                                    {(booking.need_extra_bed || (booking.snapshot as any)?.need_extra_bed) && (
                                        <span className="rounded-md bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-900">
                                            Extra bed requested
                                        </span>
                                    )}
                                </div>
                            </div>
                        )}
                    </Section>

                    <Section title="Guest">
                        <div className="rounded-xl border border-slate-200 p-3 text-sm space-y-2">
                            {((booking.is_booking_for_someone_else || (booking.snapshot as any)?.is_booking_for_someone_else) &&
                            (booking.recipient_name || (booking.snapshot as any)?.recipient_name)) && (
                                <div className="rounded-xl bg-amber-50 border border-amber-200 p-2.5 text-xs text-amber-950 mb-2">
                                    <span className="font-bold">Booked on behalf of someone else</span>
                                    <p className="mt-0.5">Staying Guest: <strong>{booking.recipient_name || (booking.snapshot as any)?.recipient_name}</strong></p>
                                    <p className="text-[11px] text-amber-700">Booked by Account: {booking.guest_contact?.name || booking.guest_name}</p>
                                </div>
                            )}
                            <div className="flex items-center justify-between">
                                <p className="font-semibold">
                                    {booking.guest_contact?.name ||
                                        booking.guest_name || <EmptyValue />}
                                </p>
                                {(booking.is_work_trip || (booking.snapshot as any)?.is_work_trip) && (
                                    <span className="rounded-md bg-sky-50 px-2 py-0.5 text-[10px] font-bold text-sky-700 border border-sky-200">
                                        💼 Work Trip
                                    </span>
                                )}
                            </div>
                            {(booking.guest_contact?.email ||
                                booking.guest_email) && (
                                <a
                                    href={
                                        booking.guest_contact?.mailto ||
                                        `mailto:${booking.guest_email}`
                                    }
                                    className="block text-brand-primary font-medium hover:underline break-all"
                                >
                                    {booking.guest_contact?.email ||
                                        booking.guest_email}
                                </a>
                            )}
                            {(booking.guest_contact?.phone ||
                                booking.guest_phone) && (
                                <a
                                    href={
                                        booking.guest_contact?.tel ||
                                        `tel:${String(
                                            booking.guest_phone,
                                        ).replace(/\s+/g, '')}`
                                    }
                                    className="block text-brand-primary font-medium hover:underline"
                                >
                                    {booking.guest_contact?.phone ||
                                        booking.guest_phone}
                                </a>
                            )}
                            {!booking.guest_email &&
                            !booking.guest_phone &&
                            !booking.guest_contact?.email &&
                            !booking.guest_contact?.phone ? (
                                <p className="text-slate-500">
                                    <EmptyValue />
                                </p>
                            ) : null}
                        </div>
                    </Section>

                    <Section title="Payment">
                        <div className="rounded-xl border border-slate-200 p-3 text-sm space-y-2">
                            <p className="font-extrabold text-brand-dark">
                                {booking.currency}{' '}
                                {Number(booking.amount).toLocaleString()}
                            </p>
                            {booking.room_total != null ||
                            booking.extras_total != null ||
                            (booking.extras_lines &&
                                booking.extras_lines.length > 0) ? (
                                <div className="rounded-lg bg-slate-50 border border-slate-100 px-3 py-2 space-y-1.5">
                                    <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
                                        Stay breakdown
                                    </p>
                                    {booking.room_total != null ? (
                                        <p className="flex justify-between gap-2">
                                            <span className="text-slate-600">Room</span>
                                            <span className="font-medium">
                                                {booking.currency}{' '}
                                                {Number(booking.room_total).toLocaleString()}
                                            </span>
                                        </p>
                                    ) : null}
                                    {(booking.extras_lines || []).map((line, idx) => (
                                        <p
                                            key={`${line.code || 'x'}-${idx}`}
                                            className="flex justify-between gap-2"
                                        >
                                            <span className="text-slate-600 min-w-0">
                                                {line.label || line.code || 'Extra'}
                                                {line.detail ? (
                                                    <span className="block text-[11px] text-slate-400">
                                                        {line.detail}
                                                    </span>
                                                ) : null}
                                            </span>
                                            <span className="font-medium shrink-0">
                                                {booking.currency}{' '}
                                                {Number(line.amount || 0).toLocaleString()}
                                            </span>
                                        </p>
                                    ))}
                                    {booking.extras_total != null &&
                                    !(booking.extras_lines || []).length ? (
                                        <p className="flex justify-between gap-2">
                                            <span className="text-slate-600">Extras</span>
                                            <span className="font-medium">
                                                {booking.currency}{' '}
                                                {Number(booking.extras_total).toLocaleString()}
                                            </span>
                                        </p>
                                    ) : null}
                                </div>
                            ) : null}
                            <p className="text-slate-600">
                                Channel:{' '}
                                {booking.payment?.channel ||
                                    booking.payment_channel ||
                                    booking.payment_pref ||
                                    ' '}
                            </p>
                            {booking.payment?.status ? (
                                <p className="text-slate-600">
                                    Payment status: {booking.payment.status}
                                    {booking.payment.provider
                                        ? ` · ${booking.payment.provider}`
                                        : ''}
                                </p>
                            ) : null}
                            {booking.payment?.card?.last4 ||
                            booking.payment?.card?.brand ||
                            booking.card_guarantee?.last4 ? (
                                <div className="rounded-lg bg-slate-50 border border-slate-100 px-3 py-2 space-y-0.5">
                                    <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
                                        Card guarantee (PCI-safe)
                                    </p>
                                    <p className="font-semibold text-brand-dark">
                                        {[
                                            booking.card_guarantee?.brand ||
                                                booking.payment?.card?.brand,
                                            booking.card_guarantee?.last4 ||
                                            booking.payment?.card?.last4
                                                ? `•••• ${booking.card_guarantee?.last4 || booking.payment?.card?.last4}`
                                                : null,
                                        ]
                                            .filter(Boolean)
                                            .join(' · ') || 'Card'}
                                    </p>
                                    {(booking.card_guarantee?.expiry ||
                                        booking.payment?.card?.expiry) && (
                                        <p className="text-xs text-slate-500">
                                            Exp{' '}
                                            {booking.card_guarantee?.expiry ||
                                                booking.payment?.card?.expiry}
                                        </p>
                                    )}
                                    <p className="text-[10px] text-slate-400">
                                        Masked only — full PAN never stored on
                                        BookAddis (
                                        {booking.card_guarantee?.storage_mode ||
                                            'hosted checkout'}
                                        )
                                    </p>
                                </div>
                            ) : null}
                            {booking.payment?.payer_phone ? (
                                <p className="text-slate-600">
                                    Mobile money phone:{' '}
                                    <a
                                        href={`tel:${booking.payment.payer_phone.replace(/\s+/g, '')}`}
                                        className="text-brand-primary hover:underline"
                                    >
                                        {booking.payment.payer_phone}
                                    </a>
                                </p>
                            ) : null}
                            <p className="text-xs font-mono text-slate-500 break-all">
                                {booking.payment?.transaction_id ||
                                    booking.payment_reference ||
                                    booking.id}
                            </p>
                        </div>
                    </Section>

                    <Section title="Add-ons ordered">
                        {booking.add_ons &&
                        typeof booking.add_ons === 'object' &&
                        (booking.add_ons.airportShuttle ||
                            booking.add_ons.airport_shuttle ||
                            booking.add_ons.rideHailing ||
                            booking.add_ons.ride_hailing ||
                            booking.add_ons.carRental ||
                            booking.add_ons.car_rental) ? (
                            <ul className="text-sm space-y-1.5">
                                {booking.add_ons.airportShuttle ||
                                booking.add_ons.airport_shuttle ? (
                                    <li className="font-medium text-brand-dark">
                                        Airport shuttle
                                    </li>
                                ) : null}
                                {booking.add_ons.rideHailing ||
                                booking.add_ons.ride_hailing ? (
                                    <li className="font-medium text-brand-dark">
                                        Ride hailing
                                    </li>
                                ) : null}
                                {booking.add_ons.carRental ||
                                booking.add_ons.car_rental ? (
                                    <li className="font-medium text-brand-dark">
                                        Car rental
                                    </li>
                                ) : null}
                            </ul>
                        ) : (
                            <p className="text-sm text-slate-500">
                                <EmptyValue>None selected</EmptyValue>
                            </p>
                        )}
                    </Section>

                    <Section title="Meal plan">
                        <CodeChip
                            code={meal}
                            label={mealOpt?.label || meal}
                            description={
                                mealOpt?.description ||
                                mealPlanLabel(booking.meal_plan)
                            }
                        />
                        <div className="rounded-xl border border-dashed border-slate-200 p-3 space-y-1.5">
                            <p className="text-[11px] font-bold text-slate-500 uppercase">
                                Reference  meal plans
                            </p>
                            <ul className="text-[11px] text-slate-600 space-y-1">
                                {MEAL_PLAN_OPTIONS.map((o) => (
                                    <li key={o.code}>
                                        <span className="font-bold text-slate-800">
                                            {o.code}
                                        </span>{' '}
                                         {o.description}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </Section>

                    <Section title="Stay / occupancy codes">
                        <div className="grid gap-2">
                            {stayCodes.map((code) => {
                                const meta = STAY_CODE_META[code];
                                return (
                                    <CodeChip
                                        key={code}
                                        code={code}
                                        label={meta?.label || code}
                                        description={meta?.description || ''}
                                    />
                                );
                            })}
                        </div>
                        {(booking.early_check_in ||
                            booking.late_check_out ||
                            booking.day_use) && (
                            <p className="text-[11px] text-slate-500">
                                Flags:{' '}
                                {[
                                    booking.day_use ? 'Day use' : null,
                                    booking.early_check_in
                                        ? 'Early check-in'
                                        : null,
                                    booking.late_check_out
                                        ? 'Late check-out'
                                        : null,
                                ]
                                    .filter(Boolean)
                                    .join(' · ')}
                            </p>
                        )}
                    </Section>

                    <Section title="Rate / segment">
                        <CodeChip
                            code={rateSeg}
                            label={RATE_SEGMENT_META[rateSeg]?.label || rateSeg}
                            description={
                                RATE_SEGMENT_META[rateSeg]?.description ||
                                (booking.booking_type
                                    ? `Booking type: ${booking.booking_type}`
                                    : '')
                            }
                        />
                    </Section>

                    <Section title="Cancellation / flexibility">
                        <CodeChip
                            code={flex}
                            label={FLEXIBILITY_META[flex]?.label || flex}
                            description={
                                FLEXIBILITY_META[flex]?.description || ''
                            }
                        />
                    </Section>

                    {booking.special_requests ? (
                        <Section title="Special requests">
                            <p className="text-sm text-slate-700 whitespace-pre-wrap rounded-xl border border-slate-200 p-3">
                                {booking.special_requests}
                            </p>
                        </Section>
                    ) : null}

                    <Section title="System">
                        <p className="text-xs text-slate-500">
                            Booked{' '}
                            {booking.created_at
                                ? formatAdminDateTime(booking.created_at)
                                : ' '}
                        </p>
                        {booking.room_type_id ? (
                            <p className="text-[11px] font-mono text-slate-400 break-all">
                                Room type {booking.room_type_id}
                            </p>
                        ) : null}
                        {booking.rate_plan_id ? (
                            <p className="text-[11px] font-mono text-slate-400 break-all">
                                Rate plan {booking.rate_plan_id}
                            </p>
                        ) : null}
                    </Section>
                </div>
            </SheetContent>
        </Sheet>
    );
}
