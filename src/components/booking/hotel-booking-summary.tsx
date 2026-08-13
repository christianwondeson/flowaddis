'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { formatCurrency } from '@/lib/currency';
import { formatAdminDate } from '@/lib/admin-date-format';
import { formatDateLocal, parseDateLocal } from '@/lib/date-utils';
import { useAuth } from '@/components/providers/auth-provider';
import { BookingModal } from '@/components/booking/booking-modal';
import { toast } from 'sonner';
import {
    normalizePromotions,
    resolveHotelPromotionDiscount,
    type HotelPromotion,
} from '@/lib/hotel-promotions';
import {
    MEAL_PLAN_OPTIONS,
    buildStayCodes,
    mealPlanLabel,
    normalizeMealPlan,
    rateSegmentFromBookingType,
    type MealPlanCode,
} from '@/lib/hotel-industry-codes';
import { computeStayExtras } from '@/lib/hotel-stay-extras';
import { useTranslations } from '@/components/providers/locale-provider';
import { cn } from '@/lib/utils';

export type HotelReserveDraft = {
    hotelId: string;
    hotelName: string;
    roomName: string;
    roomQuantity: number;
    price: number;
    currency?: string;
    checkIn: string;
    checkOut: string;
    adults?: number;
    children?: number;
    inventorySource?: string;
    roomBlockId?: string;
    roomTypeId?: string;
    ratePlanId?: string;
};

type Props = {
    draft: HotelReserveDraft;
    backHref: string;
};

const fieldClass =
    'h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-medium text-brand-dark shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/30 focus-visible:border-brand-primary';

function nightsBetween(checkIn: string, checkOut: string): number {
    const a = new Date(`${checkIn}T12:00:00`);
    const b = new Date(`${checkOut}T12:00:00`);
    const ms = b.getTime() - a.getTime();
    if (!Number.isFinite(ms) || ms <= 0) return 1;
    return Math.max(1, Math.round(ms / 86400000));
}

export function HotelBookingSummary({ draft, backHref }: Props) {
    const { user } = useAuth();
    const { t } = useTranslations();
    const currency = draft.currency || 'ETB';

    const [checkIn, setCheckIn] = useState(draft.checkIn);
    const [checkOut, setCheckOut] = useState(draft.checkOut);
    const [editingDates, setEditingDates] = useState(false);
    const nights = nightsBetween(checkIn, checkOut);

    const [firstName, setFirstName] = useState(
        () => user?.name?.split(/\s+/)[0] || '',
    );
    const [lastName, setLastName] = useState(
        () => user?.name?.split(/\s+/).slice(1).join(' ') || '',
    );
    const [email, setEmail] = useState(() => user?.email || '');
    const [phoneCountry, setPhoneCountry] = useState('ET');
    const [phone, setPhone] = useState('');

    const [paymentPref, setPaymentPref] = useState<
        'pay_now' | 'pay_at_property'
    >('pay_now');
    const [mealPlan, setMealPlan] = useState<MealPlanCode>('EP');
    const [bookingType, setBookingType] = useState<
        'individual' | 'group' | 'corporate'
    >('individual');
    const [earlyCheckIn, setEarlyCheckIn] = useState(false);
    const [lateCheckOut, setLateCheckOut] = useState(false);
    const [dayUse, setDayUse] = useState(false);
    const [specialRequests, setSpecialRequests] = useState('');
    const [wantShuttle, setWantShuttle] = useState(false);
    const [wantRide, setWantRide] = useState(false);
    const [wantCar, setWantCar] = useState(false);
    const [promoCode, setPromoCode] = useState('');
    const [referralCode, setReferralCode] = useState('');
    const [payOpen, setPayOpen] = useState(false);
    const [promotions, setPromotions] = useState<HotelPromotion[]>([]);
    const [hotelMedia, setHotelMedia] = useState<Record<string, unknown> | null>(
        null,
    );

    useEffect(() => {
        if (!draft.hotelId || draft.inventorySource !== 'bookaddis_direct') return;
        let cancelled = false;
        void (async () => {
            try {
                const res = await fetch(`/api/hotels/direct/${draft.hotelId}`);
                if (!res.ok) return;
                const data = await res.json();
                const media = (data?.media || {}) as Record<string, unknown>;
                const list = normalizePromotions(
                    (media as { promotions?: unknown }).promotions,
                );
                if (!cancelled) {
                    setPromotions(list);
                    setHotelMedia(media);
                }
            } catch {
                /* ignore */
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [draft.hotelId, draft.inventorySource]);

    const guests = Math.max(
        1,
        (Number(draft.adults) || 2) + (Number(draft.children) || 0),
    );

    const extrasQuote = useMemo(
        () =>
            computeStayExtras({
                media: hotelMedia,
                currency,
                selection: {
                    mealPlan,
                    earlyCheckIn,
                    lateCheckOut,
                    dayUse,
                    wantShuttle,
                    wantRide,
                    wantCar,
                    nights,
                    guests,
                },
            }),
        [
            hotelMedia,
            currency,
            mealPlan,
            earlyCheckIn,
            lateCheckOut,
            dayUse,
            wantShuttle,
            wantRide,
            wantCar,
            nights,
            guests,
        ],
    );

    const autoPromo = useMemo(
        () =>
            resolveHotelPromotionDiscount({
                promotions,
                checkIn,
                checkOut,
            }),
        [promotions, checkIn, checkOut],
    );
    const codePromo = useMemo(
        () =>
            promoCode.trim()
                ? resolveHotelPromotionDiscount({
                      promotions,
                      checkIn,
                      checkOut,
                      promoCode,
                  })
                : { percent: 0, applied: null as HotelPromotion | null },
        [promotions, checkIn, checkOut, promoCode],
    );
    const appliedPromo =
        codePromo.percent > 0
            ? codePromo
            : autoPromo.percent > 0
              ? autoPromo
              : { percent: 0, applied: null as HotelPromotion | null };

    const roomList = Number(draft.price) || 0;
    const roomAfterPromo = useMemo(() => {
        if (!appliedPromo.percent) return roomList;
        return Math.round(roomList * (1 - appliedPromo.percent / 100) * 100) / 100;
    }, [roomList, appliedPromo.percent]);

    const total =
        Math.round((roomAfterPromo + extrasQuote.total) * 100) / 100;

    const fullName = useMemo(
        () => `${firstName.trim()} ${lastName.trim()}`.trim(),
        [firstName, lastName],
    );

    const confirm = () => {
        if (!firstName.trim() || !lastName.trim()) {
            toast.error(t('reserve.toastNameRequired'));
            return;
        }
        const emailNorm = email.trim().toLowerCase();
        if (!emailNorm.includes('@') || emailNorm.length < 5) {
            toast.error(t('reserve.toastEmailRequired'));
            return;
        }
        const phoneDigits = phone.replace(/\D/g, '');
        if (phoneDigits.length < 8) {
            toast.error(t('reserve.toastPhoneRequired'));
            return;
        }
        const meal = normalizeMealPlan(mealPlan);
        const stay_codes = buildStayCodes({
            dayUse,
            earlyCheckIn,
            lateCheckOut,
        });
        const rate_segment = rateSegmentFromBookingType(bookingType);
        try {
            sessionStorage.setItem(
                'bookaddis_reserve_extras',
                JSON.stringify({
                    mealPlan: meal,
                    meal_plan: meal,
                    meal_plan_label: mealPlanLabel(meal),
                    stay_codes,
                    rate_segment,
                    flexibility: 'FLEX',
                    early_check_in: earlyCheckIn,
                    late_check_out: lateCheckOut,
                    day_use: dayUse,
                    bookingType,
                    booking_type: bookingType,
                    specialRequests: specialRequests.slice(0, 1000),
                    special_requests: specialRequests.slice(0, 1000),
                    addOns: {
                        airportShuttle: wantShuttle,
                        rideHailing: wantRide,
                        carRental: wantCar,
                    },
                    adults: draft.adults ?? 2,
                    children: draft.children ?? 0,
                    room_total: roomAfterPromo,
                    extras_total: extrasQuote.total,
                    extras_lines: extrasQuote.lines,
                    promoCode: promoCode.trim() || null,
                    referralCode: referralCode.trim() || null,
                    promotionId: appliedPromo.applied?.id || null,
                    promotionPercent: appliedPromo.percent || null,
                    promotionName: appliedPromo.applied?.name || null,
                    listPrice: roomList,
                    discountedPrice: total,
                    paymentPref,
                    payment_pref: paymentPref,
                    phoneCountry,
                    guest: {
                        firstName: firstName.trim(),
                        lastName: lastName.trim(),
                        email: emailNorm,
                        phone: phone.trim(),
                    },
                }),
            );
        } catch {
            /* ignore */
        }
        setPayOpen(true);
    };

    const roomsLabel =
        draft.roomQuantity === 1
            ? t('reserve.roomsCount', { count: draft.roomQuantity })
            : t('reserve.roomsCountPlural', { count: draft.roomQuantity });

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 pt-14 md:pt-16">
            <div className="sticky top-14 md:top-16 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
                <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
                    <Link
                        href={backHref}
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-bold text-brand-dark shadow-sm hover:border-brand-primary/50 hover:text-brand-primary transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        {t('reserve.backToRooms')}
                    </Link>
                    <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                            {t('reserve.bookingSummary')}
                        </p>
                        <p className="text-sm font-bold text-brand-dark truncate">
                            {draft.hotelName}
                        </p>
                    </div>
                    <div className="hidden sm:block text-right shrink-0">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                            {t('reserve.stickyTotal')}
                        </p>
                        <p className="text-base font-extrabold text-brand-dark">
                            {formatCurrency(total, currency)}
                        </p>
                    </div>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-4 py-6 sm:py-8">
                <div className="mb-6">
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-dark tracking-tight">
                        {draft.hotelName}
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">
                        {t('reserve.reviewStay')}
                    </p>
                </div>

                <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
                    <div className="space-y-5">
                        <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm space-y-4">
                            <div>
                                <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
                                    {t('reserve.room')}
                                </p>
                                <p className="text-lg font-bold text-brand-dark mt-1">
                                    {draft.roomName}
                                </p>
                                <p className="text-sm text-slate-600 mt-0.5">
                                    {roomsLabel}
                                    {draft.adults != null
                                        ? ` · ${
                                              draft.adults === 1
                                                  ? t('reserve.adultsCount', {
                                                        count: draft.adults,
                                                    })
                                                  : t('reserve.adultsCountPlural', {
                                                        count: draft.adults,
                                                    })
                                          }`
                                        : ''}
                                    {draft.children
                                        ? ` · ${
                                              draft.children === 1
                                                  ? t('reserve.childrenCount', {
                                                        count: draft.children,
                                                    })
                                                  : t('reserve.childrenCountPlural', {
                                                        count: draft.children,
                                                    })
                                          }`
                                        : ''}
                                </p>
                            </div>

                            <button
                                type="button"
                                className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-primary"
                                onClick={() => setEditingDates((v) => !v)}
                            >
                                <Pencil className="w-3.5 h-3.5" />
                                {editingDates
                                    ? t('reserve.doneEditingDates')
                                    : t('reserve.changeDates')}
                            </button>

                            {editingDates ? (
                                <div className="grid gap-3 sm:grid-cols-2">
                                    <div className="space-y-1.5">
                                        <Label>{t('reserve.checkIn')}</Label>
                                        <Popover
                                            trigger={
                                                <button
                                                    type="button"
                                                    className={cn(fieldClass, 'text-left')}
                                                >
                                                    {checkIn
                                                        ? formatAdminDate(checkIn)
                                                        : t('reserve.selectDate')}
                                                </button>
                                            }
                                            content={
                                                <div className="p-1">
                                                    <Calendar
                                                        selected={
                                                            checkIn
                                                                ? parseDateLocal(checkIn)
                                                                : undefined
                                                        }
                                                        minDate={new Date()}
                                                        onSelect={(d) => {
                                                            const next = formatDateLocal(d);
                                                            setCheckIn(next);
                                                            if (!checkOut || checkOut <= next) {
                                                                setCheckOut(
                                                                    formatDateLocal(
                                                                        new Date(
                                                                            d.getTime() +
                                                                                86400000,
                                                                        ),
                                                                    ),
                                                                );
                                                            }
                                                        }}
                                                    />
                                                </div>
                                            }
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label>{t('reserve.checkOut')}</Label>
                                        <Popover
                                            trigger={
                                                <button
                                                    type="button"
                                                    className={cn(fieldClass, 'text-left')}
                                                >
                                                    {checkOut
                                                        ? formatAdminDate(checkOut)
                                                        : t('reserve.selectDate')}
                                                </button>
                                            }
                                            content={
                                                <div className="p-1">
                                                    <Calendar
                                                        selected={
                                                            checkOut
                                                                ? parseDateLocal(checkOut)
                                                                : undefined
                                                        }
                                                        minDate={
                                                            checkIn
                                                                ? parseDateLocal(checkIn)
                                                                : new Date()
                                                        }
                                                        onSelect={(d) =>
                                                            setCheckOut(formatDateLocal(d))
                                                        }
                                                    />
                                                </div>
                                            }
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="grid gap-3 sm:grid-cols-2 text-sm">
                                    <div className="rounded-xl bg-slate-50 border border-slate-100 px-3.5 py-3">
                                        <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
                                            {t('reserve.checkIn')}
                                        </p>
                                        <p className="font-semibold text-brand-dark mt-0.5">
                                            {formatAdminDate(checkIn, { weekday: true })}
                                        </p>
                                    </div>
                                    <div className="rounded-xl bg-slate-50 border border-slate-100 px-3.5 py-3">
                                        <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
                                            {t('reserve.checkOut')}
                                        </p>
                                        <p className="font-semibold text-brand-dark mt-0.5">
                                            {formatAdminDate(checkOut, { weekday: true })}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </section>

                        <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm space-y-4">
                            <div>
                                <h2 className="font-bold text-brand-dark text-lg">
                                    {t('reserve.personalDetails')}
                                </h2>
                                <p className="text-xs text-slate-500 mt-1">
                                    {t('reserve.personalHint')}
                                </p>
                            </div>
                            <div className="grid gap-3 sm:grid-cols-2">
                                <div className="space-y-1.5">
                                    <Label>{t('reserve.firstName')}</Label>
                                    <Input
                                        className={fieldClass}
                                        value={firstName}
                                        onChange={(e) => setFirstName(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label>{t('reserve.lastName')}</Label>
                                    <Input
                                        className={fieldClass}
                                        value={lastName}
                                        onChange={(e) => setLastName(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="space-y-1.5 sm:col-span-2">
                                    <Label>{t('reserve.emailAddress')}</Label>
                                    <Input
                                        className={fieldClass}
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        disabled={Boolean(user?.email)}
                                        required
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label>{t('reserve.country')}</Label>
                                    <select
                                        className={fieldClass}
                                        value={phoneCountry}
                                        onChange={(e) => setPhoneCountry(e.target.value)}
                                    >
                                        <option value="ET">Ethiopia</option>
                                        <option value="KE">Kenya</option>
                                        <option value="US">United States</option>
                                        <option value="GB">United Kingdom</option>
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <Label>{t('reserve.phone')}</Label>
                                    <Input
                                        className={fieldClass}
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        placeholder={t('reserve.phonePlaceholder')}
                                        required
                                    />
                                </div>
                            </div>
                        </section>

                        <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm space-y-3">
                            <div>
                                <h2 className="font-bold text-brand-dark text-lg">
                                    {t('reserve.paymentOptions')}
                                </h2>
                                <p className="text-xs text-slate-500 mt-1">
                                    {t('reserve.paymentHint')}
                                </p>
                            </div>
                            <div className="grid gap-2 sm:grid-cols-2">
                                {(
                                    [
                                        ['pay_now', 'reserve.payNow', 'reserve.payNowHint'],
                                        [
                                            'pay_at_property',
                                            'reserve.payAtHotel',
                                            'reserve.payAtHotelHint',
                                        ],
                                    ] as const
                                ).map(([id, labelKey, hintKey]) => (
                                    <button
                                        key={id}
                                        type="button"
                                        onClick={() => setPaymentPref(id)}
                                        className={
                                            paymentPref === id
                                                ? 'rounded-xl border-2 border-brand-primary bg-brand-primary/5 px-3.5 py-3.5 text-left'
                                                : 'rounded-xl border border-slate-200 px-3.5 py-3.5 text-left hover:border-brand-primary/40'
                                        }
                                    >
                                        <span className="block text-sm font-semibold">
                                            {t(labelKey)}
                                        </span>
                                        <span className="block text-[11px] text-slate-500 mt-0.5">
                                            {t(hintKey)}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </section>

                        <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm space-y-3">
                            <div>
                                <h2 className="font-bold text-brand-dark text-lg">
                                    {t('reserve.mealPlan')}
                                </h2>
                                <p className="text-xs text-slate-500 mt-1">
                                    {t('reserve.mealPlanHint')}
                                </p>
                            </div>
                            <select
                                className={fieldClass}
                                value={mealPlan}
                                onChange={(e) =>
                                    setMealPlan(normalizeMealPlan(e.target.value))
                                }
                            >
                                {MEAL_PLAN_OPTIONS.map((opt) => (
                                    <option key={opt.code} value={opt.code}>
                                        {opt.label}  {opt.description}
                                    </option>
                                ))}
                            </select>
                            {extrasQuote.lines.some((l) => l.code.startsWith('meal_')) ? (
                                <p className="text-xs font-semibold text-emerald-700">
                                    {t('reserve.mealPriced', {
                                        amount: formatCurrency(
                                            extrasQuote.lines
                                                .filter((l) => l.code.startsWith('meal_'))
                                                .reduce((s, l) => s + l.amount, 0),
                                            currency,
                                        ),
                                    })}
                                </p>
                            ) : (
                                <p className="text-xs text-slate-500">
                                    {t('reserve.mealFree')}
                                </p>
                            )}
                        </section>

                        <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm space-y-3">
                            <h2 className="font-bold text-brand-dark text-lg">
                                {t('reserve.stayOptions')}
                            </h2>
                            {(
                                [
                                    [
                                        'dayUse',
                                        dayUse,
                                        (v: boolean) => {
                                            setDayUse(v);
                                            if (v) {
                                                setEarlyCheckIn(false);
                                                setLateCheckOut(false);
                                            }
                                        },
                                        'reserve.dayUse',
                                        'reserve.dayUseHint',
                                        false,
                                    ],
                                    [
                                        'eci',
                                        earlyCheckIn,
                                        setEarlyCheckIn,
                                        'reserve.earlyCheckIn',
                                        'reserve.earlyCheckInHint',
                                        dayUse,
                                    ],
                                    [
                                        'lco',
                                        lateCheckOut,
                                        setLateCheckOut,
                                        'reserve.lateCheckOut',
                                        'reserve.lateCheckOutHint',
                                        dayUse,
                                    ],
                                ] as const
                            ).map(([key, checked, set, labelKey, hintKey, disabled]) => (
                                <label
                                    key={key}
                                    className={cn(
                                        'flex items-start gap-3 rounded-xl border border-slate-100 px-3 py-2.5 text-sm',
                                        disabled && 'opacity-50',
                                    )}
                                >
                                    <input
                                        type="checkbox"
                                        className="mt-1 accent-brand-primary"
                                        checked={checked}
                                        disabled={disabled}
                                        onChange={(e) => set(e.target.checked)}
                                    />
                                    <span>
                                        <span className="font-semibold">{t(labelKey)}</span>
                                        <span className="block text-xs text-slate-500">
                                            {t(hintKey)}
                                        </span>
                                    </span>
                                </label>
                            ))}
                        </section>

                        <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm space-y-3">
                            <h2 className="font-bold text-brand-dark text-lg">
                                {t('reserve.bookingType')}
                            </h2>
                            <div className="flex flex-wrap gap-2">
                                {(
                                    [
                                        ['individual', 'reserve.typeIndividual'],
                                        ['group', 'reserve.typeGroup'],
                                        ['corporate', 'reserve.typeCorporate'],
                                    ] as const
                                ).map(([id, labelKey]) => (
                                    <button
                                        key={id}
                                        type="button"
                                        onClick={() => setBookingType(id)}
                                        className={
                                            bookingType === id
                                                ? 'rounded-xl bg-brand-primary px-3.5 py-2 text-sm font-semibold text-white'
                                                : 'rounded-xl border border-slate-200 px-3.5 py-2 text-sm font-medium hover:border-brand-primary/40'
                                        }
                                    >
                                        {t(labelKey)}
                                    </button>
                                ))}
                            </div>
                        </section>

                        <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm space-y-2">
                            <h2 className="font-bold text-brand-dark text-lg">
                                {t('reserve.specialRequests')}
                            </h2>
                            <p className="text-xs text-slate-500">
                                {t('reserve.specialHint')}
                            </p>
                            <textarea
                                className="w-full min-h-[110px] rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/30"
                                maxLength={1000}
                                value={specialRequests}
                                onChange={(e) => setSpecialRequests(e.target.value)}
                                placeholder={t('reserve.specialPlaceholder')}
                            />
                            <p className="text-xs text-slate-400 text-right">
                                {specialRequests.length}/1000
                            </p>
                        </section>

                        <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm space-y-3">
                            <div>
                                <h2 className="font-bold text-brand-dark text-lg">
                                    {t('reserve.orderExtras')}
                                </h2>
                                <p className="text-xs text-slate-500 mt-1">
                                    {t('reserve.orderExtrasHint')}
                                </p>
                            </div>
                            {(
                                [
                                    [
                                        wantShuttle,
                                        setWantShuttle,
                                        'reserve.airportShuttle',
                                        'airport_shuttle',
                                    ],
                                    [
                                        wantRide,
                                        setWantRide,
                                        'reserve.rideHailing',
                                        'ride_hailing',
                                    ],
                                    [wantCar, setWantCar, 'reserve.carRental', 'car_rental'],
                                ] as const
                            ).map(([checked, set, labelKey, code]) => {
                                const line = extrasQuote.lines.find((l) => l.code === code);
                                return (
                                    <label
                                        key={code}
                                        className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 px-3 py-2.5 text-sm"
                                    >
                                        <span className="inline-flex items-center gap-2.5">
                                            <input
                                                type="checkbox"
                                                className="accent-brand-primary"
                                                checked={checked}
                                                onChange={(e) => set(e.target.checked)}
                                            />
                                            <span className="font-semibold">{t(labelKey)}</span>
                                        </span>
                                        {line ? (
                                            <span className="text-xs font-bold text-brand-dark">
                                                +{formatCurrency(line.amount, currency)}
                                            </span>
                                        ) : null}
                                    </label>
                                );
                            })}
                        </section>

                        <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm grid gap-4 sm:grid-cols-2">
                            <div className="space-y-1.5">
                                <Label>{t('reserve.promoCode')}</Label>
                                <Input
                                    className={fieldClass}
                                    value={promoCode}
                                    onChange={(e) => setPromoCode(e.target.value)}
                                    placeholder={t('reserve.promoPlaceholder')}
                                />
                                {codePromo.reason ? (
                                    <p className="text-xs text-amber-700">{codePromo.reason}</p>
                                ) : null}
                            </div>
                            <div className="space-y-1.5">
                                <Label>{t('reserve.referralCode')}</Label>
                                <Input
                                    className={fieldClass}
                                    value={referralCode}
                                    onChange={(e) => setReferralCode(e.target.value)}
                                    placeholder={t('reserve.referralPlaceholder')}
                                />
                            </div>
                            {appliedPromo.applied ? (
                                <div className="sm:col-span-2 rounded-xl bg-emerald-50 border border-emerald-100 px-3.5 py-2.5 text-sm text-emerald-900">
                                    {t('reserve.promoApplied', {
                                        name: appliedPromo.applied.name,
                                        percent: appliedPromo.percent,
                                        amount: formatCurrency(total, currency),
                                    })}
                                </div>
                            ) : autoPromo.applied == null &&
                              promotions.some((p) => p.active) ? (
                                <p className="sm:col-span-2 text-xs text-slate-500">
                                    {t('reserve.promoAvailable')}
                                </p>
                            ) : null}
                        </section>

                        <Button
                            type="button"
                            className="w-full min-h-[52px] text-base font-bold rounded-xl lg:hidden"
                            onClick={confirm}
                        >
                            {t('reserve.confirmBooking')}
                        </Button>
                        <p className="text-center text-xs text-slate-500 lg:hidden">
                            {t('reserve.termsPrefix')}{' '}
                            <Link href="/terms" className="underline">
                                {t('reserve.terms')}
                            </Link>{' '}
                            {t('reserve.and')}{' '}
                            <Link href="/privacy" className="underline">
                                {t('reserve.privacy')}
                            </Link>
                            .
                        </p>
                    </div>

                    <aside className="lg:sticky lg:top-36 space-y-3">
                        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
                            <p className="text-sm font-bold text-brand-dark">
                                {nights === 1
                                    ? t('reserve.priceDetails', { nights })
                                    : t('reserve.priceDetailsPlural', { nights })}
                            </p>
                            {appliedPromo.percent > 0 && appliedPromo.applied ? (
                                <>
                                    <div className="flex justify-between text-sm text-slate-500 line-through">
                                        <span>{t('reserve.roomCharges')}</span>
                                        <span>{formatCurrency(roomList, currency)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm text-emerald-700">
                                        <span>
                                            {appliedPromo.applied.name} (−
                                            {appliedPromo.percent}%)
                                        </span>
                                        <span>
                                            −
                                            {formatCurrency(
                                                roomList - roomAfterPromo,
                                                currency,
                                            )}
                                        </span>
                                    </div>
                                </>
                            ) : (
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-600">
                                        {t('reserve.roomCharges')}
                                    </span>
                                    <span className="font-medium">
                                        {formatCurrency(roomAfterPromo, currency)}
                                    </span>
                                </div>
                            )}
                            {extrasQuote.lines.map((line) => (
                                <div
                                    key={line.code}
                                    className="flex justify-between text-sm gap-3"
                                >
                                    <span className="text-slate-600 min-w-0">
                                        {line.label}
                                        {line.detail ? (
                                            <span className="block text-[11px] text-slate-400 truncate">
                                                {line.detail}
                                            </span>
                                        ) : null}
                                    </span>
                                    <span className="font-medium shrink-0">
                                        {formatCurrency(line.amount, currency)}
                                    </span>
                                </div>
                            ))}
                            {extrasQuote.total > 0 ? (
                                <div className="flex justify-between text-sm border-t border-slate-100 pt-2">
                                    <span className="text-slate-600">
                                        {t('reserve.stayExtras')}
                                    </span>
                                    <span className="font-medium">
                                        {formatCurrency(extrasQuote.total, currency)}
                                    </span>
                                </div>
                            ) : null}
                            <div className="flex justify-between text-base font-extrabold text-brand-dark border-t border-slate-100 pt-3">
                                <span>{t('reserve.total')}</span>
                                <span>{formatCurrency(total, currency)}</span>
                            </div>
                            <Button
                                type="button"
                                className="w-full min-h-[48px] text-base font-bold rounded-xl hidden lg:inline-flex"
                                onClick={confirm}
                            >
                                {t('reserve.confirmBooking')}
                            </Button>
                            <p className="hidden lg:block text-center text-[11px] text-slate-500 leading-relaxed">
                                {t('reserve.termsPrefix')}{' '}
                                <Link href="/terms" className="underline">
                                    {t('reserve.terms')}
                                </Link>{' '}
                                {t('reserve.and')}{' '}
                                <Link href="/privacy" className="underline">
                                    {t('reserve.privacy')}
                                </Link>
                                .
                            </p>
                        </div>
                    </aside>
                </div>
            </div>

            <BookingModal
                isOpen={payOpen}
                onClose={() => setPayOpen(false)}
                serviceName={`${draft.hotelName} · ${draft.roomName}`}
                price={total}
                type="hotel"
                initialCheckIn={checkIn}
                initialCheckOut={checkOut}
                externalItemId={draft.hotelId}
                roomBlockId={draft.roomBlockId}
                roomBookQuantity={draft.roomQuantity}
                hotelAdults={draft.adults}
                inventorySource={draft.inventorySource}
                roomTypeId={draft.roomTypeId}
                ratePlanId={draft.ratePlanId}
                initialGuestName={fullName}
                initialGuestEmail={email}
                initialGuestPhone={phone}
                startAtPayment
                preferredPaymentTiming={paymentPref}
                isLocal={
                    draft.inventorySource === 'bookaddis_direct' ||
                    draft.inventorySource === 'pms_synced' ||
                    currency.toUpperCase() === 'ETB'
                }
            />
        </div>
    );
}
