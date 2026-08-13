'use client';

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

export type HotelReservationDetail = {
    id: string;
    status: string;
    amount: number;
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
    booking: HotelReservationDetail | null;
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
    booking,
}: Props) {
    if (!booking) return null;

    const meal = normalizeMealPlan(booking.meal_plan);
    const mealOpt = MEAL_PLAN_OPTIONS.find((o) => o.code === meal);
    const stayCodes = (booking.stay_codes?.length
        ? booking.stay_codes
        : booking.day_use
          ? ['DU']
          : ['OVN']) as StayCode[];
    const rateSeg = (booking.rate_segment || 'RACK') as RateSegmentCode;
    const flex = (booking.flexibility || 'FLEX') as FlexibilityCode;

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
                        {booking.room_name || 'Room'} · {booking.status}
                    </SheetDescription>
                </SheetHeader>

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
                    </Section>

                    <Section title="Guest">
                        <div className="rounded-xl border border-slate-200 p-3 text-sm space-y-2">
                            <p className="font-semibold">
                                {booking.guest_contact?.name ||
                                    booking.guest_name || <EmptyValue />}
                            </p>
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
                            booking.payment?.card?.brand ? (
                                <div className="rounded-lg bg-slate-50 border border-slate-100 px-3 py-2 space-y-0.5">
                                    <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
                                        Card on file
                                    </p>
                                    <p className="font-semibold text-brand-dark">
                                        {[
                                            booking.payment.card.brand,
                                            booking.payment.card.last4
                                                ? `•••• ${booking.payment.card.last4}`
                                                : null,
                                        ]
                                            .filter(Boolean)
                                            .join(' · ') || 'Card'}
                                    </p>
                                    {booking.payment.card.expiry ? (
                                        <p className="text-xs text-slate-500">
                                            Exp {booking.payment.card.expiry}
                                        </p>
                                    ) : null}
                                    {booking.payment.card.funding ? (
                                        <p className="text-xs text-slate-500 capitalize">
                                            {booking.payment.card.funding}
                                        </p>
                                    ) : null}
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
