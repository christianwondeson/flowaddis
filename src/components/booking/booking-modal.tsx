"use client";

import React, { useMemo, useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { X, ShoppingBag, Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Receipt } from './receipt';
import { PaymentForm } from './payment-form';
import { motion, AnimatePresence } from 'framer-motion';
import { formatCurrency } from '@/lib/currency';
import { formatDateEnglishStr } from '@/lib/date-utils';
import { useTripStore } from '@/store/trip-store';
import { useAuth } from '@/components/providers/auth-provider';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Popover } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { consumeMatchedHotelDraft } from '@/lib/booking-draft-storage';
import { useTranslations } from '@/components/providers/locale-provider';
import type { PaymentSuccessResult } from '@/lib/payment-success';

interface BookingModalProps {
    isOpen: boolean;
    onClose: () => void;
    serviceName?: string;
    price?: number;
    type?: 'flight' | 'hotel' | 'shuttle' | 'conference';
    initialCheckIn?: string;
    initialCheckOut?: string;
    isLocal?: boolean;
    externalItemId?: string;
    /** RapidAPI room-list block id (from Book now on a rate) for server-side price verification */
    roomBlockId?: string;
    /** Number of rooms of that rate (matches UI selector). Defaults to 1. */
    roomBookQuantity?: number;
    /** Guest count forwarded to Nest for room-list verification */
    hotelAdults?: number;
    /** Phase 3 inventory tag  bookaddis_direct | pms_synced | rapidapi */
    inventorySource?: 'bookaddis_direct' | 'pms_synced' | 'rapidapi' | string;
    /** Direct inventory  required for allotment hold */
    roomTypeId?: string;
    ratePlanId?: string;
    /** Prefill from Siyago-style reserve summary */
    initialGuestName?: string;
    initialGuestEmail?: string;
    initialGuestPhone?: string;
    /** Skip guest form and open on payment when summary already collected details */
    startAtPayment?: boolean;
    /** From Siyago reserve summary  industry payment timing */
    preferredPaymentTiming?: 'pay_now' | 'pay_at_property' | 'mobile_money';
    /** Hotel-owned shuttle / conference product id (media row). */
    productId?: string;
}

const normalizePhone = (v: string) => v.replace(/[^+\d]/g, '');

type Country = { code: string; name: string; dial: string; flag: string; min: number; max: number };
const COUNTRIES: Country[] = [
    { code: 'ET', name: 'Ethiopia', dial: '+251', flag: '🇪🇹', min: 9, max: 9 },
    { code: 'US', name: 'United States', dial: '+1', flag: '🇺🇸', min: 10, max: 10 },
    { code: 'CA', name: 'Canada', dial: '+1', flag: '🇨🇦', min: 10, max: 10 },
    { code: 'GB', name: 'United Kingdom', dial: '+44', flag: '🇬🇧', min: 10, max: 10 },
    { code: 'AE', name: 'United Arab Emirates', dial: '+971', flag: '🇦🇪', min: 9, max: 9 },
    { code: 'DE', name: 'Germany', dial: '+49', flag: '🇩🇪', min: 10, max: 11 },
    { code: 'TR', name: 'Turkey', dial: '+90', flag: '🇹🇷', min: 10, max: 11 },
    { code: 'SA', name: 'Saudi Arabia', dial: '+966', flag: '🇸🇦', min: 9, max: 9 },
    { code: 'KE', name: 'Kenya', dial: '+254', flag: '🇰🇪', min: 9, max: 9 },
    { code: 'NG', name: 'Nigeria', dial: '+234', flag: '🇳🇬', min: 7, max: 10 },
    { code: 'ZA', name: 'South Africa', dial: '+27', flag: '🇿🇦', min: 9, max: 9 },
    { code: 'FR', name: 'France', dial: '+33', flag: '🇫🇷', min: 9, max: 9 },
    { code: 'IN', name: 'India', dial: '+91', flag: '🇮🇳', min: 10, max: 10 },
    { code: 'CN', name: 'China', dial: '+86', flag: '🇨🇳', min: 11, max: 11 },
];
type BookingFormData = {
    name: string;
    email: string;
    phone: string;
    checkIn: string;
    checkOut: string;
};

export const BookingModal: React.FC<BookingModalProps> = ({
    isOpen,
    onClose,
    serviceName = 'Service',
    price = 0,
    type = 'hotel',
    initialCheckIn = '',
    initialCheckOut = '',
    isLocal: isLocalProp,
    externalItemId = 'N/A',
    roomBlockId,
    roomBookQuantity = 1,
    hotelAdults,
    inventorySource = 'rapidapi',
    roomTypeId,
    ratePlanId,
    initialGuestName,
    initialGuestEmail,
    initialGuestPhone,
    startAtPayment = false,
    preferredPaymentTiming,
    productId,
}) => {
    const { t, locale } = useTranslations();
    const pathname = usePathname();
    const isDirectProduct =
        type === 'shuttle' ||
        type === 'conference' ||
        (type === 'hotel' &&
            (inventorySource === 'bookaddis_direct' ||
                inventorySource === 'pms_synced'));
    /** Direct / ETB inventory always offers CBE Birr + local rails. */
    const isLocal = isLocalProp ?? isDirectProduct;

    const bookingSchema = useMemo(
        () =>
            z
                .object({
                    name: z.string().min(2, t('bookingUi.validation.nameMin')),
                    email: z.string().email(t('bookingUi.validation.emailInvalid')),
                    phone: z
                        .string()
                        .transform(normalizePhone)
                        .refine((v) => /^\+?[1-9]\d{7,14}$/.test(v), t('bookingUi.validation.phoneInvalid')),
                    checkIn: z.string().min(1, t('bookingUi.validation.checkInRequired')),
                    checkOut: z.string().min(1, t('bookingUi.validation.checkOutRequired')),
                })
                .refine(
                    (data) => {
                        const ci = new Date(data.checkIn);
                        const co = new Date(data.checkOut);
                        // Same-day allowed for shuttle / conference hire.
                        if (type === 'shuttle' || type === 'conference') {
                            return co.getTime() >= ci.getTime();
                        }
                        return co.getTime() > ci.getTime();
                    },
                    {
                        message: t('bookingUi.validation.checkoutAfterCheckin'),
                        path: ['checkOut'],
                    },
                ),
        [t, type],
    );

    const { addToTrip, checkoutTrip, currentTrip } = useTripStore();
    const { user } = useAuth();
    const [step, setStep] = useState<'form' | 'payment' | 'receipt'>(
        startAtPayment ? 'payment' : 'form',
    );
    const [bookingData, setBookingData] = useState<any>(null);

    // Create a snapshot for the service identification
    const externalSnapshot = useMemo(
        () => ({
            serviceName,
            checkIn: initialCheckIn,
            checkOut: initialCheckOut,
            type,
            timestamp: new Date().toISOString(),
            inventory_source:
                type === 'shuttle' || type === 'conference'
                    ? 'bookaddis_direct'
                    : inventorySource,
            hotel_id: externalItemId,
            ...(productId
                ? {
                      product_id: productId,
                      productId,
                      product_kind: type === 'shuttle' ? 'shuttle' : type === 'conference' ? 'conference' : undefined,
                  }
                : {}),
            ...(roomTypeId
                ? {
                      room_type_id: roomTypeId,
                      roomTypeId,
                  }
                : {}),
            ...(ratePlanId
                ? {
                      rate_plan_id: ratePlanId,
                      ratePlanId,
                  }
                : {}),
            ...(roomBlockId
                ? {
                      roomBlockId,
                      roomBookQuantity: Math.max(1, Math.floor(roomBookQuantity || 1)),
                  }
                : {}),
            ...(typeof hotelAdults === 'number' && hotelAdults > 0 ? { adults: hotelAdults } : {}),
            ...(roomTypeId
                ? { roomBookQuantity: Math.max(1, Math.floor(roomBookQuantity || 1)), quantity: Math.max(1, Math.floor(roomBookQuantity || 1)) }
                : {}),
        }),
        [
            serviceName,
            initialCheckIn,
            initialCheckOut,
            type,
            inventorySource,
            externalItemId,
            productId,
            roomTypeId,
            ratePlanId,
            roomBlockId,
            roomBookQuantity,
            hotelAdults,
        ],
    );

    const checkoutExternalSnapshot = useMemo(() => {
        let industry: Record<string, unknown> = {};
        try {
            const raw =
                typeof window !== 'undefined'
                    ? sessionStorage.getItem('bookaddis_reserve_extras')
                    : null;
            if (raw) {
                const extras = JSON.parse(raw) as Record<string, unknown>;
                industry = {
                    meal_plan: extras.meal_plan || extras.mealPlan || 'EP',
                    meal_plan_label: extras.meal_plan_label || null,
                    stay_codes: extras.stay_codes || ['OVN'],
                    rate_segment: extras.rate_segment || 'RACK',
                    flexibility: extras.flexibility || 'FLEX',
                    booking_type: extras.booking_type || extras.bookingType || null,
                    special_requests:
                        extras.special_requests || extras.specialRequests || null,
                    early_check_in: Boolean(extras.early_check_in),
                    late_check_out: Boolean(extras.late_check_out),
                    day_use: Boolean(extras.day_use),
                    payment_pref: extras.payment_pref || extras.paymentPref || null,
                    add_ons: extras.addOns || extras.add_ons || null,
                    room_total: extras.room_total ?? null,
                    extras_total: extras.extras_total ?? null,
                    extras_lines: extras.extras_lines || null,
                    promo_code: extras.promoCode || null,
                    promotion_id: extras.promotionId || null,
                    promotion_percent: extras.promotionPercent || null,
                    list_price: extras.listPrice || null,
                    discounted_price: extras.discountedPrice || null,
                    adults:
                        typeof (extras as { adults?: number }).adults === 'number'
                            ? (extras as { adults?: number }).adults
                            : hotelAdults ?? null,
                    children:
                        typeof (extras as { children?: number }).children ===
                        'number'
                            ? (extras as { children?: number }).children
                            : null,
                };
            }
        } catch {
            /* ignore */
        }

        if (!bookingData) {
            return { ...externalSnapshot, ...industry };
        }
        const bd = bookingData as BookingFormData;
        return {
            ...externalSnapshot,
            ...industry,
            checkIn: bd.checkIn || externalSnapshot.checkIn,
            checkOut: bd.checkOut || externalSnapshot.checkOut,
            guestName: bd.name,
            guestEmail: bd.email,
            guestPhone: bd.phone,
            customerName: bd.name,
            email: bd.email,
            phone: bd.phone,
        };
    }, [bookingData, externalSnapshot, hotelAdults]);

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
        setValue,
        watch,
        setError,
    } = useForm<BookingFormData>({
        resolver: zodResolver(bookingSchema),
        defaultValues: {
            name: '',
            email: '',
            phone: '',
            checkIn: initialCheckIn,
            checkOut: initialCheckOut,
        },
    });
    const selectedCheckIn = watch('checkIn');
    const selectedCheckOut = watch('checkOut');

    // Country and national number UI state
    const [countryCode, setCountryCode] = useState<string>('ET');
    const selectedCountry: Country = useMemo(() => COUNTRIES.find(c => c.code === countryCode) || COUNTRIES[0], [countryCode]);
    const [nationalNumber, setNationalNumber] = useState<string>('');

    const updatePhoneE164 = (cc: Country, nat: string) => {
        const natDigits = nat.replace(/\D/g, '');
        const e164 = `${cc.dial}${natDigits}`;
        setValue('phone', e164, { shouldValidate: true });
    };

    // Restore draft after sign-in, or sync dates / guest from summary when opening
    useEffect(() => {
        if (!isOpen) return;
        type ExtrasGuest = {
            firstName?: string;
            lastName?: string;
            email?: string;
            phone?: string;
        };
        let extrasGuest: ExtrasGuest | null = null;
        try {
            const raw = sessionStorage.getItem('bookaddis_reserve_extras');
            if (raw) {
                extrasGuest =
                    (JSON.parse(raw) as { guest?: ExtrasGuest }).guest || null;
            }
        } catch {
            /* ignore */
        }

        const draft = consumeMatchedHotelDraft(pathname, String(externalItemId), type);
        const nameFromSummary =
            initialGuestName ||
            (extrasGuest
                ? `${extrasGuest.firstName || ''} ${extrasGuest.lastName || ''}`.trim()
                : '');
        const emailFromSummary = initialGuestEmail || extrasGuest?.email || '';
        const phoneFromSummary = initialGuestPhone || extrasGuest?.phone || '';

        if (draft) {
            reset({
                name: nameFromSummary,
                email: emailFromSummary,
                phone: phoneFromSummary,
                checkIn: draft.checkIn || initialCheckIn,
                checkOut: draft.checkOut || initialCheckOut,
            });
            setCountryCode('ET');
            setNationalNumber('');
            toast.success(t('bookingUi.toastDatesRestored'));
            return;
        }
        reset({
            name: nameFromSummary,
            email: emailFromSummary || user?.email || '',
            phone: phoneFromSummary,
            checkIn: initialCheckIn,
            checkOut: initialCheckOut,
        });
        if (
            startAtPayment &&
            nameFromSummary &&
            (emailFromSummary || user?.email) &&
            phoneFromSummary
        ) {
            const data = {
                name: nameFromSummary,
                email: emailFromSummary || user?.email || '',
                phone: phoneFromSummary,
                checkIn: initialCheckIn,
                checkOut: initialCheckOut,
            };
            setBookingData(data);
            setStep('payment');
        }
    }, [
        isOpen,
        pathname,
        externalItemId,
        type,
        initialCheckIn,
        initialCheckOut,
        reset,
        setValue,
        initialGuestName,
        initialGuestEmail,
        initialGuestPhone,
        startAtPayment,
        user?.email,
        t,
    ]);

    // Signed-in bookings always use the account email (confirmations + fraud prevention)
    useEffect(() => {
        if (!isOpen || !user?.email) return;
        setValue('email', user.email, { shouldValidate: true });
    }, [isOpen, user?.email, setValue]);

    const resolveBookingEmail = (data: BookingFormData) =>
        user?.email?.trim() ? user.email.trim() : data.email;

    const handleAddToTrip = (data: BookingFormData) => {
        const email = resolveBookingEmail(data);
        addToTrip({
            type,
            price,
            details: {
                serviceName,
                customerName: data.name,
                email,
                phone: data.phone,
                checkIn: data.checkIn,
                checkOut: data.checkOut,
            },
        });
        onClose();
        reset();
        toast.success(t('bookingUi.toastAddedToTrip'));
    };

    const handleFormSubmit = (data: BookingFormData) => {
        // Additional country-based length validation
        const natDigits = nationalNumber.replace(/\D/g, '');
        if (natDigits.length < selectedCountry.min || natDigits.length > selectedCountry.max) {
            setError('phone', {
                type: 'validate',
                message:
                    selectedCountry.min === selectedCountry.max
                        ? t('bookingUi.phoneLengthExact', {
                              n: selectedCountry.min,
                              country: selectedCountry.name,
                          })
                        : t('bookingUi.phoneLengthRange', {
                              min: selectedCountry.min,
                              max: selectedCountry.max,
                              country: selectedCountry.name,
                          }),
            });
            return;
        }
        setBookingData({ ...data, email: resolveBookingEmail(data) });
        setStep('payment');
    };

    const handlePaymentSuccess = async (result: PaymentSuccessResult) => {
        if (!bookingData) return;

        const formData = bookingData as BookingFormData;
        const email = user?.email?.trim() ? user.email.trim() : formData.email;
        const settledAmount =
            typeof result.amount === 'number' && result.amount > 0
                ? result.amount
                : price;
        const settledCurrency =
            result.currency ||
            (inventorySource === 'bookaddis_direct' ||
            inventorySource === 'pms_synced'
                ? 'ETB'
                : 'USD');

        if (currentTrip.length === 0) {
            addToTrip({
                type,
                price: settledAmount,
                details: {
                    serviceName,
                    customerName: formData.name,
                    email,
                    phone: formData.phone,
                    checkIn: formData.checkIn,
                    checkOut: formData.checkOut,
                    currency: settledCurrency,
                },
            });
        }

        const userId = user?.id || 'guest-' + Math.random();
        const tripId = await checkoutTrip(userId);

        const newBooking = {
            id: result.bookingId || tripId,
            clientName: formData.name,
            email,
            service: serviceName,
            checkIn: formData.checkIn,
            checkOut: formData.checkOut,
            amount: settledAmount,
            currency: settledCurrency,
            status: 'Confirmed' as const,
            paymentMethod: result.method,
            paymentReference: result.paymentReference || null,
        };
        setBookingData(newBooking);
        setStep('receipt');
        const moneyLabel = formatCurrency(settledAmount, settledCurrency);
        toast.success(
            result.method === 'pay_on_site'
                ? `${t('bookingUi.toastReserveDone')} · ${moneyLabel}`
                : `${t('bookingUi.toastPaymentDone')} · ${moneyLabel}`,
        );
    };

    const handleClose = () => {
        onClose();
        setStep('form');
        reset();
        setBookingData(null);
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[10000] flex items-end justify-center overflow-hidden bg-brand-dark/60 p-0 backdrop-blur-md sm:items-center sm:p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.98, y: 16 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.98, y: 16 }}
                    className="relative z-[10001] flex max-h-[min(92dvh,920px)] w-full max-w-md flex-col overflow-hidden rounded-t-2xl border border-gray-100 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900 sm:max-w-lg sm:rounded-2xl md:max-w-xl"
                >
                    <div className="flex shrink-0 items-center justify-between border-b border-gray-100 px-4 py-3 dark:border-slate-700 sm:px-6 sm:py-4">
                        <h2 className="text-lg font-bold text-brand-dark dark:text-foreground sm:text-xl">
                            {step === 'form'
                                ? t('bookingUi.modalTitleForm')
                                : step === 'payment'
                                    ? t('bookingUi.modalTitlePayment')
                                    : t('bookingUi.modalTitleReceipt')}
                        </h2>
                        <button
                            onClick={handleClose}
                            className="rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                            type="button"
                            aria-label="Close"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain scrollbar-hide px-4 py-4 sm:px-6 sm:py-5">
                        {step === 'form' && (
                            <form key={locale} onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5">
                                <div className="bg-brand-gray p-5 rounded-2xl border border-gray-100">
                                    <h3 className="font-bold text-brand-dark text-lg mb-1">{serviceName}</h3>
                                    <p className="text-brand-primary font-extrabold text-2xl">
                                        {formatCurrency(price)}{' '}
                                        <span className="text-gray-500 font-medium text-sm">{t('bookingUi.unitSuffix')}</span>
                                    </p>
                                </div>

                                <Input
                                    id="name"
                                    label={t('bookingUi.fullName')}
                                    {...register('name')}
                                    error={errors.name?.message}
                                />
                                <Input
                                    id="email"
                                    label={t('bookingUi.emailAddress')}
                                    type="email"
                                    readOnly={!!user?.email}
                                    title={user?.email ? t('bookingUi.emailReadonlyTitle') : undefined}
                                    className={user?.email ? 'bg-gray-50 text-gray-800 cursor-not-allowed' : undefined}
                                    {...register('email')}
                                    error={errors.email?.message}
                                />
                                {user?.email && (
                                    <p className="text-xs text-gray-500 -mt-2">
                                        {t('bookingUi.emailLockedHint')}
                                    </p>
                                )}
                                {/* Country selector + phone input */}
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">{t('bookingUi.phoneNumber')}</label>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                        <div className="col-span-1">
                                            <Select value={countryCode} onValueChange={(v) => {
                                                setCountryCode(v);
                                                updatePhoneE164(COUNTRIES.find(c => c.code === v) || selectedCountry, nationalNumber);
                                            }}>
                                                <SelectTrigger className="w-full text-xs h-11">
                                                    <span className="flex items-center gap-2">
                                                        <span>{selectedCountry.flag}</span>
                                                        <span className="font-bold">{selectedCountry.dial}</span>
                                                    </span>
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {COUNTRIES.map(c => (
                                                        <SelectItem key={c.code} value={c.code}>
                                                            <span className="flex items-center gap-2 text-sm">
                                                                <span>{c.flag}</span>
                                                                <span className="w-6 inline-block">{c.dial}</span>
                                                                <span className="text-gray-700">{c.name}</span>
                                                            </span>
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="col-span-1 sm:col-span-2">
                                            <Input
                                                id="phone"
                                                label={undefined as any}
                                                type="tel"
                                                placeholder={`e.g. ${selectedCountry.dial} ...`}
                                                value={nationalNumber}
                                                onChange={(e) => {
                                                    const v = e.target.value;
                                                    setNationalNumber(v);
                                                    updatePhoneE164(selectedCountry, v);
                                                }}
                                                error={errors.phone?.message}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <Popover
                                        trigger={
                                            <div className="w-full cursor-pointer">
                                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">{t('bookingUi.checkIn')}</label>
                                                <div className="flex items-center gap-3 w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl hover:bg-white hover:border-brand-primary/50 transition-all group">
                                                    <CalendarIcon className="w-5 h-5 text-gray-400 group-hover:text-brand-primary transition-colors" />
                                                    <span className="text-gray-900 font-medium">{formatDateEnglishStr(selectedCheckIn) || t('bookingUi.selectDate')}</span>
                                                </div>
                                            </div>
                                        }
                                        content={
                                            <Calendar
                                                selected={selectedCheckIn ? new Date(selectedCheckIn) : undefined}
                                                onSelect={(date) => setValue('checkIn', date.toISOString().split('T')[0], { shouldValidate: true })}
                                                minDate={new Date()}
                                            />
                                        }
                                    />
                                    {errors.checkIn?.message && (
                                        <p className="text-red-500 text-xs mt-1 ml-1 sm:col-span-2">{errors.checkIn.message}</p>
                                    )}

                                    <Popover
                                        trigger={
                                            <div className="w-full cursor-pointer">
                                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">{t('bookingUi.checkOut')}</label>
                                                <div className="flex items-center gap-3 w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl hover:bg-white hover:border-brand-primary/50 transition-all group">
                                                    <CalendarIcon className="w-5 h-5 text-gray-400 group-hover:text-brand-primary transition-colors" />
                                                    <span className="text-gray-900 font-medium">{formatDateEnglishStr(selectedCheckOut) || t('bookingUi.selectDate')}</span>
                                                </div>
                                            </div>
                                        }
                                        content={
                                            <Calendar
                                                selected={selectedCheckOut ? new Date(selectedCheckOut) : undefined}
                                                onSelect={(date) => setValue('checkOut', date.toISOString().split('T')[0], { shouldValidate: true })}
                                                minDate={selectedCheckIn ? new Date(new Date(selectedCheckIn).getTime() + 86400000) : new Date()}
                                            />
                                        }
                                    />
                                    {errors.checkOut?.message && (
                                        <p className="text-red-500 text-xs mt-1 ml-1 sm:col-span-2">{errors.checkOut.message}</p>
                                    )}
                                </div>

                                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={handleSubmit(handleAddToTrip)}
                                        className="w-full sm:flex-1"
                                    >
                                        <ShoppingBag className="w-4 h-4 mr-2" /> {t('bookingUi.addToTrip')}
                                    </Button>
                                    <Button type="submit" className="w-full sm:flex-1">
                                        {t('bookingUi.bookNow')}
                                    </Button>
                                </div>
                            </form>
                        )}

                        {step === 'payment' && (
                            <PaymentForm
                                amount={price || 0}
                                onSuccess={handlePaymentSuccess}
                                onCancel={() => setStep('form')}
                                isLocal={isLocal}
                                bookingType={type as any}
                                source={
                                    type === 'shuttle' || type === 'conference'
                                        ? 'bookaddis_direct'
                                        : type === 'hotel'
                                          ? inventorySource === 'bookaddis_direct' ||
                                            inventorySource === 'pms_synced'
                                              ? inventorySource
                                              : 'rapidapi'
                                          : 'amadeus'
                                }
                                externalItemId={externalItemId}
                                externalSnapshot={checkoutExternalSnapshot}
                                currencyCode={
                                    type === 'shuttle' ||
                                    type === 'conference' ||
                                    inventorySource === 'bookaddis_direct' ||
                                    inventorySource === 'pms_synced'
                                        ? 'ETB'
                                        : undefined
                                }
                                customerPhone={(bookingData as BookingFormData | null)?.phone}
                                preferredPaymentTiming={preferredPaymentTiming}
                            />
                        )}

                        {step === 'receipt' && bookingData && (
                            <Receipt
                                booking={bookingData}
                                onClose={handleClose}
                                kind={
                                    bookingData.paymentMethod === 'pay_on_site'
                                        ? 'reservation'
                                        : 'paid'
                                }
                            />
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
