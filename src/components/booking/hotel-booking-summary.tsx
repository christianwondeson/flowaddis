'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
    ArrowLeft,
    Pencil,
    AlertCircle,
    CheckCircle2,
    Clock,
    ShieldCheck,
    Wifi,
    Car,
    Bus,
    Plane,
    Utensils,
    Sparkles,
    User,
    Mail,
    Phone,
    MapPin,
    Building2,
    Check,
    ChevronDown,
    ChevronUp,
    Star,
    Tag,
    ThumbsUp,
    HelpCircle,
    X,
    CreditCard,
    Lock,
    Loader2,
    CalendarDays,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { formatCurrency } from '@/lib/currency';
import { formatAdminDate } from '@/lib/admin-date-format';
import { formatDateLocal, parseDateLocal } from '@/lib/date-utils';
import { useAuth } from '@/components/providers/auth-provider';
import { auth } from '@/lib/firebase';
import { Receipt, type BookingReceiptDetails } from '@/components/booking/receipt';
import { PaymentForm } from '@/components/booking/payment-form';
import type { PaymentSuccessResult } from '@/lib/payment-success';
import { toast } from 'sonner';
import {
    COUNTRY_PHONE_CONFIGS,
    getCountryConfig,
    validateEmail,
    validatePhoneNumber,
} from '@/lib/phone-validation';
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
import { resolveStrapiFileUrl } from '@/lib/admin-cms-client';
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

const ARRIVAL_TIME_OPTIONS = [
    { value: '', label: 'Please select' },
    { value: 'unknown', label: "I don't know" },
    { value: '10:00 - 11:00', label: '10:00 AM - 11:00 AM' },
    { value: '11:00 - 12:00', label: '11:00 AM - 12:00 PM' },
    { value: '12:00 - 13:00', label: '12:00 PM - 1:00 PM' },
    { value: '13:00 - 14:00', label: '1:00 PM - 2:00 PM' },
    { value: '14:00 - 15:00', label: '2:00 PM - 3:00 PM' },
    { value: '15:00 - 16:00', label: '3:00 PM - 4:00 PM' },
    { value: '16:00 - 17:00', label: '4:00 PM - 5:00 PM' },
    { value: '17:00 - 18:00', label: '5:00 PM - 6:00 PM' },
    { value: '18:00 - 19:00', label: '6:00 PM - 7:00 PM' },
    { value: '19:00 - 20:00', label: '7:00 PM - 8:00 PM' },
    { value: '20:00 - 21:00', label: '8:00 PM - 9:00 PM' },
    { value: '21:00 - 22:00', label: '9:00 PM - 10:00 PM' },
    { value: '22:00 - 23:00', label: '10:00 PM - 11:00 PM' },
    { value: '23:00 - 00:00', label: '11:00 PM - 12:00 AM' },
    { value: '00:00 - 01:00', label: '12:00 AM - 1:00 AM (the next day)' },
    { value: '01:00 - 02:00', label: '1:00 AM - 2:00 AM (the next day)' },
];

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

    // 3-Step Process state: 2 = Your Details, 3 = Finish booking
    const [currentStep, setCurrentStep] = useState<2 | 3>(2);
    const [confirmedReceipt, setConfirmedReceipt] = useState<BookingReceiptDetails | null>(null);
    const [isPayAtPropertyLoading, setIsPayAtPropertyLoading] = useState(false);
    const [showOptionalPreferences, setShowOptionalPreferences] = useState(false);

    const initialCheckIn = draft.checkIn || new Date().toISOString().slice(0, 10);
    const initialCheckOut = draft.checkOut || new Date(Date.now() + 86400000).toISOString().slice(0, 10);
    const [checkIn, setCheckIn] = useState(initialCheckIn);
    const [checkOut, setCheckOut] = useState(initialCheckOut);

    useEffect(() => {
        if (draft.checkIn && draft.checkIn !== checkIn) setCheckIn(draft.checkIn);
        if (draft.checkOut && draft.checkOut !== checkOut) setCheckOut(draft.checkOut);
    }, [draft.checkIn, draft.checkOut]);

    const [editingDates, setEditingDates] = useState(false);
    const nights = nightsBetween(checkIn, checkOut);

    const firstNameRef = useRef<HTMLInputElement>(null);

    const [firstName, setFirstName] = useState(
        () => user?.name?.split(/\s+/)[0] || '',
    );
    const [lastName, setLastName] = useState(
        () => user?.name?.split(/\s+/).slice(1).join(' ') || '',
    );
    const [email, setEmail] = useState(() => user?.email || '');
    const [emailError, setEmailError] = useState<string | null>(null);
    const [phoneCountry, setPhoneCountry] = useState('ET');
    const [phone, setPhone] = useState(() => user?.phone || '');
    const [phoneError, setPhoneError] = useState<string | null>(null);

    // Guest details & booking options
    const [paperlessConfirmation, setPaperlessConfirmation] = useState(true);
    const [bookingFor, setBookingFor] = useState<'me' | 'someone_else'>('me');
    const [recipientName, setRecipientName] = useState('');
    const [isWorkTrip, setIsWorkTrip] = useState<'yes' | 'no'>('no');
    const [arrivalTime, setArrivalTime] = useState('');
    const [showPriceBreakdown, setShowPriceBreakdown] = useState(true);

    // Cribs and extra beds
    const [needCrib, setNeedCrib] = useState(false);
    const [needExtraBed, setNeedExtraBed] = useState(false);
    const [showCribPolicy, setShowCribPolicy] = useState(false);
    const [showConditionsModal, setShowConditionsModal] = useState(false);
    const [showPriceMatchModal, setShowPriceMatchModal] = useState(false);

    const currentCountryConfig = useMemo(
        () => getCountryConfig(phoneCountry),
        [phoneCountry],
    );

    const phoneValidation = useMemo(
        () =>
            phone.trim()
                ? validatePhoneNumber(phone, phoneCountry)
                : { isValid: false, normalizedE164: '', nationalDigits: '', carrier: null },
        [phone, phoneCountry],
    );

    // Step 3 Payment Choice: 'pay_at_property' | 'pay_now'
    const [paymentPref, setPaymentPref] = useState<'pay_now' | 'pay_at_property'>('pay_at_property');
    const [mealPlan, setMealPlan] = useState<MealPlanCode>('EP');
    const [bookingType, setBookingType] = useState<'individual' | 'group' | 'corporate'>('individual');
    const [earlyCheckIn, setEarlyCheckIn] = useState(false);
    const [lateCheckOut, setLateCheckOut] = useState(false);
    const [dayUse, setDayUse] = useState(false);
    const [specialRequests, setSpecialRequests] = useState('');
    const [wantShuttle, setWantShuttle] = useState(false);
    const [wantRide, setWantRide] = useState(false);
    const [wantCar, setWantCar] = useState(false);
    const [promoCode, setPromoCode] = useState('');
    const [referralCode, setReferralCode] = useState('');
    const [promotions, setPromotions] = useState<HotelPromotion[]>([]);
    const [hotelMedia, setHotelMedia] = useState<Record<string, unknown> | null>(null);
    const [hotelData, setHotelData] = useState<any>(null);

    // Auto-populate promo code from URL if guest arrived via marketing/shareable link
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const sp = new URLSearchParams(window.location.search);
            const urlCode =
                sp.get('promo') ||
                sp.get('promoCode') ||
                sp.get('code') ||
                sp.get('ref') ||
                sp.get('referral');
            if (urlCode && !promoCode) {
                setPromoCode(urlCode.trim().toUpperCase());
            }
        }
    }, [promoCode]);

    useEffect(() => {
        if (!draft.hotelId) return;
        let cancelled = false;
        void (async () => {
            try {
                const isUuid =
                    typeof draft.hotelId === 'string' &&
                    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(draft.hotelId);
                const endpoint =
                    draft.inventorySource === 'bookaddis_direct' || draft.inventorySource === 'pms_synced' || isUuid
                        ? `/api/hotels/direct/${encodeURIComponent(draft.hotelId)}`
                        : `/api/hotels/data?hotelId=${encodeURIComponent(draft.hotelId)}`;

                const res = await fetch(endpoint);
                if (!res.ok) return;
                const data = await res.json();
                if (!cancelled) {
                    setHotelData(data);
                    const media = (data?.media || {}) as Record<string, unknown>;
                    const list = normalizePromotions((media as { promotions?: unknown }).promotions);
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

    const guests = Math.max(1, (Number(draft.adults) || 2) + (Number(draft.children) || 0));

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
                roomTypeId: draft.roomTypeId,
                facility: 'hotel_room',
            }),
        [promotions, checkIn, checkOut, draft.roomTypeId],
    );
    const effectivePromoCode = promoCode.trim() || referralCode.trim();
    const codePromo = useMemo(
        () =>
            effectivePromoCode
                ? resolveHotelPromotionDiscount({
                      promotions,
                      checkIn,
                      checkOut,
                      promoCode: effectivePromoCode,
                      roomTypeId: draft.roomTypeId,
                      facility: 'hotel_room',
                  })
                : { percent: 0, applied: null as HotelPromotion | null },
        [promotions, checkIn, checkOut, effectivePromoCode, draft.roomTypeId],
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

    const total = Math.round((roomAfterPromo + extrasQuote.total) * 100) / 100;

    // OTA-grade tax & charges breakdown (15% VAT, 10% Service Charge, 5% Municipality Fee)
    const taxSummary = useMemo(() => {
        const totalTaxes = Math.round(roomAfterPromo * (0.30 / 1.30) * 100) / 100;
        const vat = Math.round(roomAfterPromo * (0.15 / 1.30) * 100) / 100;
        const service = Math.round(roomAfterPromo * (0.10 / 1.30) * 100) / 100;
        const municipality = Math.round((totalTaxes - vat - service) * 100) / 100;
        const netRoom = Math.round((roomAfterPromo - totalTaxes) * 100) / 100;
        return {
            totalTaxes,
            vat,
            service,
            municipality,
            netRoom,
        };
    }, [roomAfterPromo]);

    const checkInRelativeLabel = useMemo(() => {
        if (!checkIn) return null;
        const now = new Date();
        const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        const diffMs = new Date(`${checkIn}T00:00:00`).getTime() - new Date(`${todayStr}T00:00:00`).getTime();
        const diffDays = Math.round(diffMs / 86400000);
        if (diffDays === 0) return 'Check-in is today';
        if (diffDays === 1) return 'Check-in is tomorrow';
        if (diffDays > 1) return `Check-in is in ${diffDays} days`;
        return null;
    }, [checkIn]);

    const fullName = useMemo(
        () => `${firstName.trim()} ${lastName.trim()}`.trim(),
        [firstName, lastName],
    );

    const hotelImage = useMemo(() => {
        const cover = hotelData?.image || hotelData?.media?.photos?.[0]?.url;
        return resolveStrapiFileUrl(cover) || cover || '/assets/images/addis-view.jpg';
    }, [hotelData]);

    const hotelLocation = useMemo(() => {
        return (
            hotelData?.location ||
            (hotelData?.city ? `${hotelData.city}, ${hotelData.country || 'Ethiopia'}` : 'Bole Road, Africa Avenue, Bole, Addis Ababa, Ethiopia')
        );
    }, [hotelData]);

    const hotelRating = hotelData?.rating || hotelData?.star_rating || 8.4;
    const hotelReviewCount = hotelData?.reviews || 981;
    const checkInTimeLabel = hotelData?.checkin || 'From 2:00 PM';
    const checkOutTimeLabel = hotelData?.checkout || 'Until 12:00 PM';

    const handleFocusGuestForm = () => {
        firstNameRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        firstNameRef.current?.focus();
    };

    const snapshotPayload = useMemo(
        () => ({
            hotel_id: draft.hotelId,
            hotelId: draft.hotelId,
            hotelName: draft.hotelName,
            serviceName: draft.hotelName,
            roomName: draft.roomName,
            room_name: draft.roomName,
            room_type_id: draft.roomTypeId,
            checkin: checkIn,
            checkout: checkOut,
            checkIn: checkIn,
            checkOut: checkOut,
            checkInDate: checkIn,
            checkOutDate: checkOut,
            roomBlockId: draft.roomBlockId,
            roomBookQuantity: draft.roomQuantity || 1,
            roomTypeId: draft.roomTypeId,
            ratePlanId: draft.ratePlanId,
            mealPlan: normalizeMealPlan(mealPlan),
            stay_codes: buildStayCodes({ dayUse, earlyCheckIn, lateCheckOut }),
            rate_segment: rateSegmentFromBookingType(bookingType),
            special_requests: specialRequests.slice(0, 1000),
            arrivalTime: arrivalTime || '14:00 - 15:00',
            isBookingForSomeoneElse: bookingFor === 'someone_else',
            recipientName: bookingFor === 'someone_else' ? recipientName.trim() : undefined,
            isWorkTrip: isWorkTrip === 'yes',
            needCrib,
            needExtraBed,
            addOns: {
                airportShuttle: wantShuttle,
                rideHailing: wantRide,
                carRental: wantCar,
            },
            guest: {
                firstName: firstName.trim(),
                lastName: lastName.trim(),
                email: email.trim().toLowerCase(),
                phone: phoneValidation.normalizedE164 || phone.trim(),
            },
            guestName: bookingFor === 'someone_else' && recipientName.trim() ? recipientName.trim() : fullName,
            guestEmail: email.trim().toLowerCase(),
            guestPhone: phoneValidation.normalizedE164 || phone.trim(),
            customerName: fullName,
        }),
        [
            checkIn,
            checkOut,
            draft.roomBlockId,
            draft.roomQuantity,
            draft.roomTypeId,
            draft.ratePlanId,
            mealPlan,
            dayUse,
            earlyCheckIn,
            lateCheckOut,
            bookingType,
            specialRequests,
            arrivalTime,
            bookingFor,
            recipientName,
            isWorkTrip,
            needCrib,
            needExtraBed,
            wantShuttle,
            wantRide,
            wantCar,
            firstName,
            lastName,
            email,
            phoneValidation.normalizedE164,
            phone,
            fullName,
        ],
    );

    // Validate Step 2 and proceed to Step 3 (Finish booking)
    const proceedToStep3 = () => {
        if (!firstName.trim() || !lastName.trim()) {
            toast.error(t('reserve.toastNameRequired') || 'Please enter your first and last name');
            handleFocusGuestForm();
            return;
        }

        if (bookingFor === 'someone_else' && !recipientName.trim()) {
            toast.error('Please enter the full name of the guest you are booking for');
            return;
        }

        const emailCheck = validateEmail(email);
        if (!emailCheck.isValid) {
            setEmailError(emailCheck.error || 'Please enter a valid email address');
            toast.error(emailCheck.error || 'Please enter a valid email address');
            return;
        }
        setEmailError(null);

        const phoneCheck = validatePhoneNumber(phone, phoneCountry);
        if (!phoneCheck.isValid) {
            setPhoneError(phoneCheck.error || 'Please enter a valid phone number');
            toast.error(phoneCheck.error || 'Please enter a valid phone number');
            return;
        }
        setPhoneError(null);

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
                    arrivalTime: arrivalTime || '14:00 - 15:00',
                    isBookingForSomeoneElse: bookingFor === 'someone_else',
                    recipientName: bookingFor === 'someone_else' ? recipientName.trim() : undefined,
                    isWorkTrip: isWorkTrip === 'yes',
                    paperlessConfirmation,
                    needCrib,
                    needExtraBed,
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
                        email: email.trim().toLowerCase(),
                        phone: phoneCheck.normalizedE164,
                    },
                }),
            );
        } catch {
            /* ignore */
        }

        setCurrentStep(3);
        if (typeof window !== 'undefined') {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    // Fast, instant Pay-at-Hotel confirmation
    const handleConfirmPayAtProperty = async () => {
        setIsPayAtPropertyLoading(true);
        try {
            const { ensureCheckoutIdToken } = await import('@/lib/guest-checkout-auth');
            const token =
                (await auth?.currentUser?.getIdToken()) ||
                (await ensureCheckoutIdToken({
                    email: email.trim().toLowerCase(),
                    phone: phoneValidation.normalizedE164 || phone.trim(),
                    name: fullName,
                }));

            const response = await fetch('/api/checkout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    bookingType: 'hotel',
                    source: draft.inventorySource || 'bookaddis_direct',
                    externalItemId: draft.hotelId,
                    currency: currency || 'ETB',
                    paymentChannel: 'pay_at_property',
                    metadata: {
                        checkin: checkIn,
                        checkout: checkOut,
                        checkIn: checkIn,
                        checkOut: checkOut,
                        adults: draft.adults || 2,
                        roomBlockId: draft.roomBlockId,
                        roomBookQuantity: draft.roomQuantity || 1,
                        roomTypeId: draft.roomTypeId,
                        ratePlanId: draft.ratePlanId,
                    },
                    roomBlockId: draft.roomBlockId,
                    roomBookQuantity: draft.roomQuantity || 1,
                    hotelAdults: draft.adults || 2,
                    roomTypeId: draft.roomTypeId,
                    ratePlanId: draft.ratePlanId,
                    external_snapshot: {
                        ...snapshotPayload,
                        checkin: checkIn,
                        checkout: checkOut,
                        checkIn: checkIn,
                        checkOut: checkOut,
                        payment_timing: 'PAY_AT_PROPERTY',
                    },
                }),
            });

            const payload = await response.json().catch(() => ({}));
            if (!response.ok) {
                toast.error(payload?.error || payload?.message || 'Could not complete reservation');
                return;
            }

            const ref =
                typeof payload?.paymentReference === 'string'
                    ? payload.paymentReference
                    : typeof payload?.payNar === 'string'
                      ? payload.payNar
                      : typeof payload?.bookingId === 'string'
                        ? payload.bookingId
                        : `RES-${Date.now().toString(36).toUpperCase()}`;

            if (ref) {
                try {
                    sessionStorage.setItem('last_pay_nar', ref);
                } catch {
                    /* ignore */
                }
            }

            toast.success('Reservation confirmed! Pay upon arrival at the hotel.');

            setConfirmedReceipt({
                id: ref,
                clientName: bookingFor === 'someone_else' && recipientName.trim() ? recipientName.trim() : fullName,
                email: email.trim().toLowerCase(),
                phone: phoneValidation.normalizedE164 || phone.trim(),
                service: `${draft.hotelName} — ${draft.roomName}`,
                checkIn,
                checkOut,
                amount: total,
                currency,
                status: 'Confirmed',
                paymentMethod: 'pay_on_site',
                paymentReference: ref,
                arrivalTime: arrivalTime || '14:00 - 15:00',
                recipientName: bookingFor === 'someone_else' ? recipientName.trim() : undefined,
                isBookingForSomeoneElse: bookingFor === 'someone_else',
                isWorkTrip: isWorkTrip === 'yes',
                needCrib,
                needExtraBed,
                specialRequests: specialRequests || null,
                addOns: {
                    airportShuttle: wantShuttle,
                    rideHailing: wantRide,
                    carRental: wantCar,
                },
            });

            if (typeof window !== 'undefined') {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        } catch (err: any) {
            console.error('Error confirming pay at property:', err);
            toast.error(err?.message || 'Failed to complete reservation');
        } finally {
            setIsPayAtPropertyLoading(false);
        }
    };

    // Online payment success handler
    const handlePaymentSuccess = (result: PaymentSuccessResult) => {
        const ref = result.paymentReference || `PAY-${Date.now().toString(36).toUpperCase()}`;
        setConfirmedReceipt({
            id: ref,
            clientName: bookingFor === 'someone_else' && recipientName.trim() ? recipientName.trim() : fullName,
            email: email.trim().toLowerCase(),
            phone: phoneValidation.normalizedE164 || phone.trim(),
            service: `${draft.hotelName} — ${draft.roomName}`,
            checkIn,
            checkOut,
            amount: total,
            currency,
            status: 'Confirmed',
            paymentMethod: result.method,
            paymentReference: ref,
            arrivalTime: arrivalTime || '14:00 - 15:00',
            recipientName: bookingFor === 'someone_else' ? recipientName.trim() : undefined,
            isBookingForSomeoneElse: bookingFor === 'someone_else',
            isWorkTrip: isWorkTrip === 'yes',
            needCrib,
            needExtraBed,
            specialRequests: specialRequests || null,
            addOns: {
                airportShuttle: wantShuttle,
                rideHailing: wantRide,
                carRental: wantCar,
            },
        });

        if (typeof window !== 'undefined') {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    return (
        <div className="min-h-screen bg-[#f5f5f5] pb-16 pt-14 md:pt-16 text-slate-800">
            {/* Top Navigation Bar with Interactive 3-Step Stepper */}
            <header className="sticky top-14 md:top-16 z-30 border-b border-slate-200/90 bg-white/95 backdrop-blur-md shadow-sm">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
                    {confirmedReceipt ? (
                        <Link
                            href="/hotels"
                            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-sm hover:border-brand-primary hover:text-brand-primary transition-colors shrink-0"
                        >
                            <ArrowLeft className="w-3.5 h-3.5" />
                            <span>Browse Hotels</span>
                        </Link>
                    ) : currentStep === 3 ? (
                        <button
                            type="button"
                            onClick={() => {
                                setCurrentStep(2);
                                if (typeof window !== 'undefined') {
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                }
                            }}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-sm hover:border-brand-primary hover:text-brand-primary transition-colors shrink-0"
                        >
                            <ArrowLeft className="w-3.5 h-3.5" />
                            <span>Back to your details</span>
                        </button>
                    ) : (
                        <Link
                            href={backHref}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-sm hover:border-brand-primary hover:text-brand-primary transition-colors shrink-0"
                        >
                            <ArrowLeft className="w-3.5 h-3.5" />
                            <span>{t('reserve.backToRooms') || 'Change Room'}</span>
                        </Link>
                    )}

                    {/* Interactive 3-Step Booking Breadcrumb Stepper */}
                    <nav className="flex items-center gap-2 sm:gap-4 text-xs font-semibold text-slate-500">
                        {/* Step 1: Your Selection */}
                        <Link
                            href={backHref}
                            className="flex items-center gap-1.5 text-brand-primary hover:underline"
                        >
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-primary text-white text-[10px] font-bold">
                                ✓
                            </span>
                            <span className="hidden sm:inline font-bold">Your Selection</span>
                        </Link>
                        <div className="h-0.5 w-4 sm:w-8 bg-brand-primary/40" />

                        {/* Step 2: Your Details */}
                        {currentStep === 3 || confirmedReceipt ? (
                            <button
                                type="button"
                                onClick={() => {
                                    if (!confirmedReceipt) setCurrentStep(2);
                                }}
                                className={cn(
                                    'flex items-center gap-1.5 text-brand-primary font-bold',
                                    !confirmedReceipt && 'hover:underline cursor-pointer',
                                )}
                            >
                                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-primary text-white text-[10px] font-bold">
                                    ✓
                                </span>
                                <span>Your Details</span>
                            </button>
                        ) : (
                            <div className="flex items-center gap-1.5 text-brand-primary font-bold">
                                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-primary text-white text-[10px] font-bold ring-2 ring-brand-primary/20">
                                    2
                                </span>
                                <span>Your Details</span>
                            </div>
                        )}
                        <div
                            className={cn(
                                'h-0.5 w-4 sm:w-8 transition-colors',
                                currentStep === 3 || confirmedReceipt
                                    ? 'bg-brand-primary/40'
                                    : 'bg-slate-200',
                            )}
                        />

                        {/* Step 3: Finish booking */}
                        <div
                            className={cn(
                                'flex items-center gap-1.5 font-bold transition-colors',
                                currentStep === 3 || confirmedReceipt
                                    ? 'text-brand-primary'
                                    : 'text-slate-400',
                            )}
                        >
                            <span
                                className={cn(
                                    'flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold',
                                    confirmedReceipt
                                        ? 'bg-brand-primary text-white'
                                        : currentStep === 3
                                          ? 'bg-brand-primary text-white ring-2 ring-brand-primary/20'
                                          : 'bg-slate-100 text-slate-400',
                                )}
                            >
                                {confirmedReceipt ? '✓' : '3'}
                            </span>
                            <span className="hidden sm:inline">Finish booking</span>
                        </div>
                    </nav>

                    <div className="hidden md:block text-right shrink-0">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Total Price</p>
                        <p className="text-base font-extrabold text-brand-dark">{formatCurrency(total, currency)}</p>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 min-w-0">
                {/* 2-Column Booking.com Layout: Left Sidebar + Right Main Form */}
                <div className="grid gap-6 lg:gap-8 lg:grid-cols-[360px_minmax(0,1fr)] xl:grid-cols-[380px_minmax(0,1fr)] items-start min-w-0">
                    {/* LEFT COLUMN: Hotel Card, Stay Details, Price Breakdown & Urgency */}
                    <aside className="space-y-4 order-2 lg:order-1 lg:sticky lg:top-32">
                        {/* 1. Hotel Overview Card */}
                        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
                            <div className="relative h-44 w-full overflow-hidden rounded-xl bg-slate-100">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={hotelImage}
                                    alt={draft.hotelName}
                                    className="h-full w-full object-cover transition duration-300 hover:scale-105"
                                />
                                <div className="absolute top-2.5 left-2.5 flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-bold text-amber-300 backdrop-blur-sm">
                                    <Star className="w-3 h-3 fill-amber-300 text-amber-300" />
                                    <Star className="w-3 h-3 fill-amber-300 text-amber-300" />
                                    <Star className="w-3 h-3 fill-amber-300 text-amber-300" />
                                    <Star className="w-3 h-3 fill-amber-300 text-amber-300" />
                                </div>
                            </div>

                            <div>
                                <div className="flex items-center gap-1.5">
                                    <div className="flex items-center text-amber-400">
                                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                                    </div>
                                    <span className="rounded bg-amber-500/10 p-0.5 text-amber-700">
                                        <ThumbsUp className="w-3 h-3 fill-amber-500 text-amber-600" />
                                    </span>
                                </div>
                                <h2 className="text-lg font-extrabold text-brand-dark leading-snug mt-1">{draft.hotelName}</h2>
                                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                                    {hotelLocation}
                                </p>
                                <p className="text-xs font-semibold text-brand-primary mt-1">
                                    Excellent Location — 9.2
                                </p>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
                                <span className="flex items-center justify-center rounded-lg bg-teal-800 px-2.5 py-1 font-bold text-white text-xs">
                                    {hotelRating}
                                </span>
                                <span className="font-bold text-slate-800">Very Good</span>
                                <span className="text-slate-400">· {hotelReviewCount} reviews</span>
                            </div>

                            <div className="flex flex-wrap gap-1.5 pt-1 text-[11px] text-slate-600">
                                <span className="inline-flex items-center gap-1 rounded-md bg-slate-50 px-2 py-0.5 border border-slate-100">
                                    <Wifi className="w-3 h-3 text-slate-400" /> Free Wifi
                                </span>
                                <span className="inline-flex items-center gap-1 rounded-md bg-slate-50 px-2 py-0.5 border border-slate-100">
                                    <Plane className="w-3 h-3 text-slate-400" /> Airport shuttle
                                </span>
                                <span className="inline-flex items-center gap-1 rounded-md bg-slate-50 px-2 py-0.5 border border-slate-100">
                                    <Car className="w-3 h-3 text-slate-400" /> Parking
                                </span>
                                <span className="inline-flex items-center gap-1 rounded-md bg-slate-50 px-2 py-0.5 border border-slate-100">
                                    <Utensils className="w-3 h-3 text-slate-400" /> Restaurant
                                </span>
                            </div>
                        </div>

                        {/* 2. Your Booking Details Card */}
                        <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-slate-700">Your booking details</span>
                                {currentStep === 2 && (
                                    <button
                                        type="button"
                                        onClick={() => setEditingDates((v) => !v)}
                                        className="inline-flex items-center gap-1 text-xs font-bold text-brand-primary hover:underline"
                                    >
                                        <Pencil className="w-3 h-3" />
                                        <span>Edit dates</span>
                                    </button>
                                )}
                            </div>

                            {/* Check-in / Check-out Dates */}
                            <div className="grid grid-cols-2 gap-3 text-xs">
                                <div className="space-y-0.5">
                                    <span className="text-xs font-semibold text-slate-700">Check-in</span>
                                    <p className="font-bold text-slate-900">{formatAdminDate(checkIn, { weekday: true })}</p>
                                    <span className="text-[11px] text-slate-500">{checkInTimeLabel}</span>
                                </div>
                                <div className="space-y-0.5">
                                    <span className="text-xs font-semibold text-slate-700">Check-out</span>
                                    <p className="font-bold text-slate-900">{formatAdminDate(checkOut, { weekday: true })}</p>
                                    <span className="text-[11px] text-slate-500">{checkOutTimeLabel}</span>
                                </div>
                            </div>

                            {checkInRelativeLabel && (
                                <div className="rounded-lg bg-amber-50/80 border border-amber-200/60 px-2.5 py-1.5 flex items-center gap-1.5 text-xs font-semibold text-amber-900">
                                    <AlertCircle className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                                    <span>{checkInRelativeLabel}</span>
                                </div>
                            )}

                            <div className="space-y-1 text-xs text-slate-700 pt-2 border-t border-slate-100">
                                <p className="font-semibold text-slate-800">You selected</p>
                                <p className="text-slate-600">
                                    {nights} {nights === 1 ? 'night' : 'nights'}, {draft.roomQuantity} room for {draft.adults || 2} adults
                                    {draft.children ? ` · ${draft.children} children` : ''}
                                </p>
                                <p className="font-bold text-brand-dark">{draft.roomQuantity} x {draft.roomName}</p>
                                {currentStep === 2 && (
                                    <Link
                                        href={backHref}
                                        className="text-xs font-semibold text-brand-primary hover:underline block pt-1"
                                    >
                                        Change your selection
                                    </Link>
                                )}
                            </div>

                            {editingDates && currentStep === 2 && (
                                <div className="grid gap-2 sm:grid-cols-2 pt-2 border-t border-slate-100 animate-in fade-in-50">
                                    <div>
                                        <Label className="text-[10px] uppercase font-bold text-slate-400">Check-in</Label>
                                        <Popover
                                            trigger={
                                                <button type="button" className={cn(fieldClass, 'text-xs text-left')}>
                                                    {checkIn ? formatAdminDate(checkIn) : 'Select date'}
                                                </button>
                                            }
                                            content={
                                                <div className="p-1">
                                                    <Calendar
                                                        selected={checkIn ? parseDateLocal(checkIn) : undefined}
                                                        minDate={new Date()}
                                                        onSelect={(d) => {
                                                            const next = formatDateLocal(d);
                                                            setCheckIn(next);
                                                            if (!checkOut || checkOut <= next) {
                                                                setCheckOut(formatDateLocal(new Date(d.getTime() + 86400000)));
                                                            }
                                                        }}
                                                    />
                                                </div>
                                            }
                                        />
                                    </div>
                                    <div>
                                        <Label className="text-[10px] uppercase font-bold text-slate-400">Check-out</Label>
                                        <Popover
                                            trigger={
                                                <button type="button" className={cn(fieldClass, 'text-xs text-left')}>
                                                    {checkOut ? formatAdminDate(checkOut) : 'Select date'}
                                                </button>
                                            }
                                            content={
                                                <div className="p-1">
                                                    <Calendar
                                                        selected={checkOut ? parseDateLocal(checkOut) : undefined}
                                                        minDate={checkIn ? parseDateLocal(checkIn) : new Date()}
                                                        onSelect={(d) => setCheckOut(formatDateLocal(d))}
                                                    />
                                                </div>
                                            }
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* 3. Your Price Summary Card */}
                        <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm space-y-3">
                            <div>
                                <span className="text-xs font-semibold text-slate-700">Your price summary</span>
                                <div className="flex items-baseline justify-between mt-1">
                                    <span className="text-sm font-bold text-slate-800">Total</span>
                                    <p className="text-2xl font-extrabold text-brand-dark">
                                        {formatCurrency(total, currency)}
                                    </p>
                                </div>
                                <p className="text-[11px] text-slate-500">Includes taxes and fees</p>
                            </div>

                            {/* Transparent Price Information Breakdown */}
                            <div className="pt-2 border-t border-slate-100 text-xs">
                                <div className="flex items-center justify-between text-slate-700 font-semibold mb-1.5">
                                    <span>Price information</span>
                                    <button
                                        type="button"
                                        onClick={() => setShowPriceBreakdown((v) => !v)}
                                        className="text-xs font-medium text-brand-primary hover:underline"
                                    >
                                        {showPriceBreakdown ? 'Hide details' : 'Show details'}
                                    </button>
                                </div>

                                {showPriceBreakdown && (
                                    <div className="space-y-1 text-slate-600 animate-in fade-in-50">
                                        <p className="text-[11px] text-slate-500">
                                            Includes {formatCurrency(taxSummary.totalTaxes, currency)} in taxes and fees
                                        </p>
                                        <div className="flex justify-between pl-2 text-[11px] text-slate-600">
                                            <span>15 % VAT</span>
                                            <span>{formatCurrency(taxSummary.vat, currency)}</span>
                                        </div>
                                        <div className="flex justify-between pl-2 text-[11px] text-slate-600">
                                            <span>10 % Service charge</span>
                                            <span>{formatCurrency(taxSummary.service, currency)}</span>
                                        </div>
                                        <div className="flex justify-between pl-2 text-[11px] text-slate-600">
                                            <span>5 % Municipality fee</span>
                                            <span>{formatCurrency(taxSummary.municipality, currency)}</span>
                                        </div>
                                        {appliedPromo.percent > 0 && (
                                            <div className="flex justify-between text-emerald-700 font-semibold pt-1 border-t border-slate-100">
                                                <span>
                                                    Promotion ({appliedPromo.applied?.name || `${appliedPromo.percent}% off`}
                                                    {appliedPromo.applied?.applicable_room_ids &&
                                                    !appliedPromo.applied.applicable_room_ids.includes('all') &&
                                                    draft.roomName
                                                        ? ` · ${appliedPromo.percent}% on ${draft.roomName}`
                                                        : ''}
                                                    )
                                                </span>
                                                <span>-{formatCurrency(roomList - roomAfterPromo, currency)}</span>
                                            </div>
                                        )}
                                        {extrasQuote.total > 0 && (
                                            <div className="flex justify-between text-slate-700 pt-1 border-t border-slate-100 font-medium">
                                                <span>Add-ons & stay extras</span>
                                                <span>+{formatCurrency(extrasQuote.total, currency)}</span>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* 4. Payment Schedule Reassurance */}
                            <div className="space-y-1 text-xs text-slate-600 pt-2 border-t border-slate-100">
                                <span className="font-semibold text-slate-700">Your payment schedule</span>
                                <p className="text-emerald-700 font-semibold">
                                    {paymentPref === 'pay_at_property'
                                        ? "No payment today. You'll pay when you stay."
                                        : 'Pay securely online today. Instant voucher issued.'}
                                </p>
                            </div>

                            {/* 5. Cancellation Policy */}
                            <div className="space-y-1 text-xs text-slate-600 pt-2 border-t border-slate-100">
                                <span className="font-semibold text-slate-700">How much will it cost to cancel?</span>
                                <p className="text-emerald-700 font-semibold">
                                    Free cancellation up to 24 hours before check-in
                                </p>
                            </div>

                            {/* 6. Limited Supply Alert Badge */}
                            <div className="rounded-xl border border-rose-300 bg-rose-50/50 p-3.5 flex items-start gap-2.5 text-xs text-rose-900 shadow-xs">
                                <Clock className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-bold">Limited supply for your dates:</p>
                                    <p className="text-[11px] text-rose-800 mt-0.5">26 four-star hotels like this are already unavailable on our site</p>
                                </div>
                            </div>
                        </div>
                    </aside>

                    {/* RIGHT COLUMN: Step 2 Form OR Step 3 Finish Booking */}
                    <div className="space-y-5 order-1 lg:order-2 min-w-0">
                        {/* ======================================================== */}
                        {/* STEP 3 FINISHED: OFFICIAL CONFIRMATION RECEIPT VOUCHER */}
                        {/* ======================================================== */}
                        {confirmedReceipt ? (
                            <div className="space-y-4">
                                <Receipt
                                    booking={confirmedReceipt}
                                    kind={paymentPref === 'pay_at_property' ? 'reservation' : 'paid'}
                                />
                                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                                    <Link
                                        href="/trips"
                                        className="rounded-xl bg-brand-primary px-6 py-2.5 text-xs sm:text-sm font-bold text-white hover:bg-teal-700 shadow-sm transition-all"
                                    >
                                        View My Reservations
                                    </Link>
                                    <Link
                                        href="/hotels"
                                        className="rounded-xl border border-slate-300 bg-white px-6 py-2.5 text-xs sm:text-sm font-bold text-slate-700 hover:border-brand-primary hover:text-brand-primary shadow-sm transition-all"
                                    >
                                        Book Another Hotel
                                    </Link>
                                </div>
                            </div>
                        ) : currentStep === 3 ? (
                            /* ======================================================== */
                            /* STEP 3: FINISH BOOKING & PAYMENT SETTLEMENT */
                            /* ======================================================== */
                            <div className="space-y-5 animate-in fade-in-50 min-w-0">
                                {/* 1. Review Your Details Card */}
                                <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm space-y-4">
                                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                        <div>
                                            <h2 className="text-lg font-extrabold text-brand-dark">Review your reservation</h2>
                                            <p className="text-xs text-slate-500">Step 3 of 3 · Final details & settlement</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setCurrentStep(2);
                                                if (typeof window !== 'undefined') {
                                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                                }
                                            }}
                                            className="inline-flex items-center gap-1 text-xs font-bold text-brand-primary hover:underline"
                                        >
                                            <Pencil className="w-3.5 h-3.5" />
                                            <span>Edit details</span>
                                        </button>
                                    </div>

                                    <div className="grid gap-3 sm:grid-cols-2 text-xs">
                                        <div className="rounded-xl bg-slate-50 p-3.5 space-y-1">
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Guest Information</span>
                                            <p className="font-bold text-slate-900 text-sm">
                                                {bookingFor === 'someone_else' && recipientName.trim() ? recipientName.trim() : fullName}
                                            </p>
                                            <p className="text-slate-600 flex items-center gap-1.5 pt-0.5">
                                                <Mail className="w-3 h-3 text-slate-400" /> {email}
                                            </p>
                                            <p className="text-slate-600 flex items-center gap-1.5">
                                                <Phone className="w-3 h-3 text-slate-400" /> {phoneValidation.normalizedE164 || phone}
                                            </p>
                                            {bookingFor === 'someone_else' && (
                                                <p className="text-[11px] text-brand-primary font-medium pt-1">
                                                    Booked by {fullName} for {recipientName}
                                                </p>
                                            )}
                                        </div>

                                        <div className="rounded-xl bg-slate-50 p-3.5 space-y-1">
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Stay & Timing</span>
                                            <p className="font-bold text-slate-900 text-sm">{draft.roomQuantity} x {draft.roomName}</p>
                                            <p className="text-slate-600">
                                                {formatAdminDate(checkIn)} → {formatAdminDate(checkOut)} ({nights} {nights === 1 ? 'night' : 'nights'})
                                            </p>
                                            <p className="text-slate-600">
                                                Estimated arrival: <strong className="text-slate-800">{arrivalTime || 'From 2:00 PM'}</strong>
                                            </p>
                                            {needCrib && <p className="text-[11px] text-emerald-700 font-semibold">• Crib requested (Free)</p>}
                                            {needExtraBed && <p className="text-[11px] text-slate-700 font-semibold">• Extra bed requested</p>}
                                            {specialRequests && (
                                                <p className="text-[11px] text-slate-500 italic line-clamp-1 pt-0.5">
                                                    &ldquo;{specialRequests}&rdquo;
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </section>

                                {/* 2. Payment Method Selection & Actions */}
                                <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm space-y-5">
                                    <div>
                                        <h3 className="text-lg font-extrabold text-brand-dark">How would you like to pay?</h3>
                                        <p className="text-xs text-slate-500 mt-0.5">
                                            Choose to pay upon check-in at the hotel or settle instantly online.
                                        </p>
                                    </div>

                                    {/* Payment Method Segment Tabs */}
                                    <div className="grid gap-3 sm:grid-cols-2 min-w-0">
                                        <button
                                            type="button"
                                            onClick={() => setPaymentPref('pay_at_property')}
                                            className={cn(
                                                'rounded-xl p-4 text-left transition-all relative border min-w-0 w-full',
                                                paymentPref === 'pay_at_property'
                                                    ? 'border-2 border-brand-primary bg-brand-primary/5 ring-1 ring-brand-primary/20 shadow-sm'
                                                    : 'border-slate-200 hover:border-slate-300 bg-white',
                                            )}
                                        >
                                            <div className="flex items-center justify-between gap-1 flex-wrap">
                                                <span className="text-sm font-extrabold text-brand-dark">Pay at Hotel</span>
                                                <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-extrabold text-emerald-800 shrink-0">
                                                    Pay on Arrival
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-500 mt-1 break-words">
                                                No payment today. Settle upon check-in at the front desk with cash or cards.
                                            </p>
                                            <div className="mt-3 flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700">
                                                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                                                <span>Free cancellation up to 24h prior</span>
                                            </div>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => setPaymentPref('pay_now')}
                                            className={cn(
                                                'rounded-xl p-4 text-left transition-all relative border min-w-0 w-full',
                                                paymentPref === 'pay_now'
                                                    ? 'border-2 border-brand-primary bg-brand-primary/5 ring-1 ring-brand-primary/20 shadow-sm'
                                                    : 'border-slate-200 hover:border-slate-300 bg-white',
                                            )}
                                        >
                                            <div className="flex items-center justify-between gap-1 flex-wrap">
                                                <span className="text-sm font-extrabold text-brand-dark">Pay Online Now</span>
                                                <span className="rounded bg-teal-100 px-2 py-0.5 text-[10px] font-extrabold text-teal-800 shrink-0">
                                                    Instant Confirmation
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-500 mt-1 break-words">
                                                Prepay securely via CBE Birr, Telebirr, Visa, or Mastercard.
                                            </p>
                                            <div className="mt-3 flex items-center gap-1.5 text-[11px] font-semibold text-brand-primary">
                                                <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                                                <span>Instant digital receipt & voucher</span>
                                            </div>
                                        </button>
                                    </div>

                                    {/* Action Area based on Payment Method Choice */}
                                    {paymentPref === 'pay_at_property' ? (
                                        <div className="space-y-4 pt-2 border-t border-slate-100 min-w-0">
                                            <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 text-xs text-amber-900 space-y-1 break-words">
                                                <p className="font-bold flex items-center gap-1.5 text-sm">
                                                    <Building2 className="w-4 h-4 text-amber-700 shrink-0" />
                                                    <span>No payment required today</span>
                                                </p>
                                                <p className="text-amber-800 leading-relaxed break-words">
                                                    Your room will be reserved immediately under your name at {draft.hotelName}. You will pay{' '}
                                                    <strong>{formatCurrency(total, currency)}</strong> directly to the hotel upon arrival.
                                                </p>
                                            </div>

                                            <Button
                                                type="button"
                                                disabled={isPayAtPropertyLoading}
                                                onClick={handleConfirmPayAtProperty}
                                                className="min-h-[50px] w-full text-sm sm:text-base font-extrabold rounded-xl bg-brand-primary text-white hover:bg-teal-700 shadow-md transition-all flex items-center justify-center gap-2 px-4 whitespace-normal text-center"
                                            >
                                                {isPayAtPropertyLoading ? (
                                                    <>
                                                        <Loader2 className="w-5 h-5 animate-spin shrink-0" />
                                                        <span>Confirming reservation...</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <CheckCircle2 className="w-5 h-5 shrink-0" />
                                                        <span>Complete Reservation (Pay at Hotel)</span>
                                                    </>
                                                )}
                                            </Button>

                                            <p className="text-center text-[11px] text-slate-400 break-words">
                                                By clicking &ldquo;Complete Reservation&rdquo;, you agree to {draft.hotelName}&apos;s booking terms and conditions.
                                            </p>
                                        </div>
                                    ) : (
                                        /* Pay Online Option - Embedded Interactive Payment Form */
                                        <div className="pt-2 border-t border-slate-100">
                                            <PaymentForm
                                                amount={total}
                                                currencyCode={currency}
                                                bookingType="hotel"
                                                source={draft.inventorySource || 'bookaddis_direct'}
                                                externalItemId={draft.hotelId}
                                                customerPhone={phoneValidation.isValid ? phoneValidation.nationalDigits : phone}
                                                preferredPaymentTiming="pay_now"
                                                isLocal={
                                                    draft.inventorySource === 'bookaddis_direct' ||
                                                    draft.inventorySource === 'pms_synced' ||
                                                    currency.toUpperCase() === 'ETB'
                                                }
                                                externalSnapshot={{
                                                    ...snapshotPayload,
                                                    checkin: checkIn,
                                                    checkout: checkOut,
                                                    checkIn: checkIn,
                                                    checkOut: checkOut,
                                                    roomBlockId: draft.roomBlockId,
                                                    roomBookQuantity: draft.roomQuantity,
                                                    hotelAdults: draft.adults,
                                                    roomTypeId: draft.roomTypeId,
                                                    ratePlanId: draft.ratePlanId,
                                                }}
                                                onSuccess={handlePaymentSuccess}
                                                onCancel={() => {
                                                    setCurrentStep(2);
                                                    if (typeof window !== 'undefined') {
                                                        window.scrollTo({ top: 0, behavior: 'smooth' });
                                                    }
                                                }}
                                            />
                                        </div>
                                    )}
                                </section>
                            </div>
                        ) : (
                            /* ======================================================== */
                            /* STEP 2: YOUR DETAILS (SIMPLIFIED & STREAMLINED) */
                            /* ======================================================== */
                            <div className="space-y-5">
                                {/* 1. Sign-in Prompt Banner */}
                                {!user ? (
                                    <div className="rounded-2xl border border-sky-200 bg-white p-4 flex items-center justify-between gap-3 shadow-sm">
                                        <div className="flex items-center gap-3">
                                            <User className="w-5 h-5 text-brand-primary shrink-0" />
                                            <div className="text-xs sm:text-sm text-slate-700">
                                                <Link href="/signin" className="font-bold text-brand-primary hover:underline">
                                                    Sign in
                                                </Link>{' '}
                                                to book with saved details or{' '}
                                                <Link href="/signin?tab=register" className="font-bold text-brand-primary hover:underline">
                                                    register
                                                </Link>{' '}
                                                to manage your bookings on the go!
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 flex items-center gap-3 shadow-sm text-xs sm:text-sm text-emerald-950">
                                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                                        <span>
                                            Signed in as <strong>{user.email}</strong>. This reservation will be linked to your BookAddis profile.
                                        </span>
                                    </div>
                                )}

                                {/* 2. Primary Guest Details Form Card */}
                                <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm space-y-4">
                                    <div>
                                        <h2 className="text-lg font-extrabold text-brand-dark">Enter your details</h2>
                                        <div className="mt-2 rounded-xl bg-slate-50 border border-slate-200/80 px-3.5 py-2.5 text-xs font-medium text-slate-600 flex items-center gap-2">
                                            <AlertCircle className="w-4 h-4 text-slate-500 shrink-0" />
                                            <span>Almost done! Just fill in the * required info</span>
                                        </div>
                                    </div>

                                    {/* Name fields */}
                                    <div className="grid gap-3 sm:grid-cols-2">
                                        <div className="space-y-1.5">
                                            <Label className="text-xs font-bold text-slate-700">First name *</Label>
                                            <Input
                                                ref={firstNameRef}
                                                className={fieldClass}
                                                value={firstName}
                                                onChange={(e) => setFirstName(e.target.value)}
                                                placeholder="First name"
                                                required
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-xs font-bold text-slate-700">Last name *</Label>
                                            <Input
                                                className={fieldClass}
                                                value={lastName}
                                                onChange={(e) => setLastName(e.target.value)}
                                                placeholder="Last name"
                                                required
                                            />
                                        </div>
                                    </div>

                                    {/* Email */}
                                    <div className="space-y-1.5">
                                        <div className="flex items-center justify-between">
                                            <Label htmlFor="guest-email" className="text-xs font-bold text-slate-700">
                                                Email address *
                                            </Label>
                                            {emailError && (
                                                <span className="flex items-center gap-1 text-xs font-semibold text-rose-600">
                                                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                                    <span>{emailError}</span>
                                                </span>
                                            )}
                                        </div>
                                        <Input
                                            id="guest-email"
                                            className={cn(
                                                fieldClass,
                                                emailError && 'border-rose-500 focus-visible:ring-rose-500/20 bg-rose-50/20 text-rose-950',
                                            )}
                                            type="email"
                                            value={email}
                                            onChange={(e) => {
                                                setEmail(e.target.value);
                                                if (emailError) setEmailError(null);
                                            }}
                                            onBlur={() => {
                                                if (email.trim()) {
                                                    const check = validateEmail(email);
                                                    if (!check.isValid) setEmailError(check.error || null);
                                                    else setEmailError(null);
                                                }
                                            }}
                                            disabled={Boolean(user?.email)}
                                            placeholder="name@example.com"
                                            required
                                        />
                                        <p className="text-[11px] text-slate-400">Confirmation email sent to this address</p>
                                    </div>

                                    {/* Country & Phone */}
                                    <div className="grid gap-3 sm:grid-cols-2">
                                        <div className="space-y-1.5">
                                            <Label htmlFor="guest-country" className="text-xs font-bold text-slate-700">
                                                Country/Region *
                                            </Label>
                                            <select
                                                id="guest-country"
                                                className={fieldClass}
                                                value={phoneCountry}
                                                onChange={(e) => {
                                                    setPhoneCountry(e.target.value);
                                                    if (phoneError) setPhoneError(null);
                                                }}
                                            >
                                                {COUNTRY_PHONE_CONFIGS.map((c) => (
                                                    <option key={c.code} value={c.code}>
                                                        {c.flag} {c.name} ({c.dial})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="space-y-1.5">
                                            <div className="flex items-center justify-between">
                                                <Label htmlFor="guest-phone" className="text-xs font-bold text-slate-700">
                                                    Phone number *
                                                </Label>
                                                {phoneValidation.isValid && phoneValidation.carrier && (
                                                    <span className="text-[11px] font-semibold text-emerald-600">
                                                        {phoneValidation.carrier}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="relative">
                                                <Input
                                                    id="guest-phone"
                                                    className={cn(
                                                        fieldClass,
                                                        phoneError && 'border-rose-500 focus-visible:ring-rose-500/20 bg-rose-50/20 text-rose-950',
                                                    )}
                                                    type="tel"
                                                    value={phone}
                                                    onChange={(e) => {
                                                        setPhone(e.target.value);
                                                        if (phoneError) setPhoneError(null);
                                                    }}
                                                    onBlur={() => {
                                                        if (phone.trim()) {
                                                            const check = validatePhoneNumber(phone, phoneCountry);
                                                            if (!check.isValid) setPhoneError(check.error || null);
                                                            else setPhoneError(null);
                                                        }
                                                    }}
                                                    placeholder={currentCountryConfig.placeholder}
                                                    required
                                                />
                                            </div>
                                            {phoneError ? (
                                                <p className="flex items-center gap-1 text-xs font-semibold text-rose-600 mt-1">
                                                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                                    <span>{phoneError}</span>
                                                </p>
                                            ) : (
                                                <p className="text-[11px] text-slate-400 mt-1">
                                                    To verify your booking, and for the property to connect if needed
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Paperless Confirmation Checkbox */}
                                    <label className="flex items-start gap-2.5 pt-2 text-xs font-medium text-slate-700 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="mt-0.5 h-4 w-4 rounded accent-brand-primary"
                                            checked={paperlessConfirmation}
                                            onChange={(e) => setPaperlessConfirmation(e.target.checked)}
                                        />
                                        <div>
                                            <span className="font-semibold text-slate-900">
                                                Yes, I want free paperless confirmation (recommended)
                                            </span>
                                            <p className="text-slate-500 text-[11px]">
                                                We&apos;ll text you a link to download our app
                                            </p>
                                        </div>
                                    </label>

                                    {/* Who are you booking for? */}
                                    <div className="pt-3 border-t border-slate-100 space-y-2">
                                        <Label className="text-xs font-bold text-slate-700">Who are you booking for? (optional)</Label>
                                        <div className="space-y-2 text-xs font-semibold text-slate-800">
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="radio"
                                                    name="bookingFor"
                                                    value="me"
                                                    checked={bookingFor === 'me'}
                                                    onChange={() => setBookingFor('me')}
                                                    className="h-4 w-4 accent-brand-primary"
                                                />
                                                <span>I&apos;m the main guest</span>
                                            </label>
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="radio"
                                                    name="bookingFor"
                                                    value="someone_else"
                                                    checked={bookingFor === 'someone_else'}
                                                    onChange={() => setBookingFor('someone_else')}
                                                    className="h-4 w-4 accent-brand-primary"
                                                />
                                                <span>I&apos;m booking for someone else</span>
                                            </label>
                                        </div>

                                        {bookingFor === 'someone_else' && (
                                            <div className="pt-2 animate-in fade-in-50">
                                                <Label className="text-xs font-bold text-slate-700">Recipient Guest Full Name *</Label>
                                                <Input
                                                    className={cn(fieldClass, 'mt-1')}
                                                    value={recipientName}
                                                    onChange={(e) => setRecipientName(e.target.value)}
                                                    placeholder="Full name of primary guest staying"
                                                    required
                                                />
                                            </div>
                                        )}

                                        {/* Are you traveling for work? */}
                                        <div className="pt-3 border-t border-slate-100 space-y-2">
                                            <Label className="text-xs font-bold text-slate-700">Are you traveling for work? (optional)</Label>
                                            <div className="flex gap-4 text-xs font-semibold text-slate-800">
                                                <label className="flex items-center gap-2 cursor-pointer">
                                                    <input
                                                        type="radio"
                                                        name="isWorkTrip"
                                                        value="yes"
                                                        checked={isWorkTrip === 'yes'}
                                                        onChange={() => setIsWorkTrip('yes')}
                                                        className="h-4 w-4 accent-brand-primary"
                                                    />
                                                    <span>Yes</span>
                                                </label>
                                                <label className="flex items-center gap-2 cursor-pointer">
                                                    <input
                                                        type="radio"
                                                        name="isWorkTrip"
                                                        value="no"
                                                        checked={isWorkTrip === 'no'}
                                                        onChange={() => setIsWorkTrip('no')}
                                                        className="h-4 w-4 accent-brand-primary"
                                                    />
                                                    <span>No</span>
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                </section>

                                {/* 3. Good to know Card */}
                                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-2.5">
                                    <h3 className="font-bold text-slate-900 text-sm">Good to know:</h3>
                                    <div className="flex items-start gap-2.5 text-xs text-slate-700">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                                        <span>No payment needed now. You&apos;ll pay at the property.</span>
                                    </div>
                                    <div className="flex items-start gap-2.5 text-xs text-slate-700">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                                        <span>Congrats! You picked the best rate at {draft.hotelName}. Don&apos;t miss out, book now!</span>
                                    </div>
                                </div>

                                {/* 4. Selected Room Card */}
                                <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm space-y-3">
                                    <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                                        <h3 className="font-extrabold text-brand-dark text-base">{draft.roomName}</h3>
                                        <span className="text-[11px] font-semibold text-slate-500">Non-Smoking</span>
                                    </div>
                                    <div className="space-y-1.5 text-xs text-slate-600">
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold text-slate-800">Guests:</span>
                                            <span>{draft.adults} {draft.adults === 1 ? 'adult' : 'adults'}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold text-slate-800">Main guest:</span>
                                            <span>{fullName.trim() || 'Primary guest'}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-emerald-700 font-semibold pt-1">
                                            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                                            <span>Free cancellation up to 24h before check-in</span>
                                        </div>
                                    </div>
                                </section>

                                {/* 5. Add to your stay Card */}
                                <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm space-y-3">
                                    <h3 className="font-extrabold text-brand-dark text-base">Add to your stay</h3>
                                    <div className="space-y-2.5">
                                        {/* Shuttle */}
                                        <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50/50 cursor-pointer transition-colors">
                                            <input
                                                type="checkbox"
                                                className="mt-1 h-4 w-4 rounded accent-brand-primary shrink-0"
                                                checked={wantShuttle}
                                                onChange={(e) => setWantShuttle(e.target.checked)}
                                            />
                                            <div className="flex-1 text-xs">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-slate-900">
                                                        I&apos;m interested in requesting a free airport shuttle
                                                    </span>
                                                    <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-extrabold text-emerald-800">
                                                        FREE
                                                    </span>
                                                </div>
                                                <p className="text-slate-500 mt-0.5">
                                                    We&apos;ll tell your accommodations you&apos;re interested so they can provide details.
                                                </p>
                                            </div>
                                            <Bus className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                                        </label>

                                        {/* Rental Car Discount */}
                                        <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50/50 cursor-pointer transition-colors">
                                            <input
                                                type="checkbox"
                                                className="mt-1 h-4 w-4 rounded accent-brand-primary shrink-0"
                                                checked={wantCar}
                                                onChange={(e) => setWantCar(e.target.checked)}
                                            />
                                            <div className="flex-1 text-xs">
                                                <span className="font-bold text-slate-900">
                                                    Get 5% off a rental car — with free cancellation available
                                                </span>
                                                <p className="text-slate-500 mt-0.5">
                                                    Save 5% on all rental cars — we&apos;ll show you car rental options in your booking confirmation.
                                                </p>
                                            </div>
                                            <Car className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                                        </label>

                                        {/* Taxi / Ride partner option */}
                                        <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50/50 cursor-pointer transition-colors">
                                            <input
                                                type="checkbox"
                                                className="mt-1 h-4 w-4 rounded accent-brand-primary shrink-0"
                                                checked={wantRide}
                                                onChange={(e) => setWantRide(e.target.checked)}
                                            />
                                            <div className="flex-1 text-xs">
                                                <span className="font-bold text-slate-900">
                                                    Want to book a taxi or shuttle ride in advance?
                                                </span>
                                                <p className="text-slate-500 mt-0.5">
                                                    Avoid surprises — get from the airport to your accommodations without any hassle. We&apos;ll add ride options (RIDE, FERES, Yango) to your confirmation.
                                                </p>
                                            </div>
                                            <span className="text-[10px] font-black uppercase text-slate-400 border border-slate-300 rounded px-1.5 py-0.5 shrink-0 mt-0.5">
                                                TAXI
                                            </span>
                                        </label>
                                    </div>
                                </section>

                                {/* 6. Special Requests Card */}
                                <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm space-y-3">
                                    <h3 className="font-extrabold text-brand-dark text-base">Special requests</h3>
                                    <p className="text-xs text-slate-500 leading-relaxed">
                                        Special requests can&apos;t be guaranteed, but the property will do its best to meet your needs. You can always make a special request after your booking is complete.
                                    </p>
                                    <div className="space-y-1 pt-1">
                                        <Label className="text-xs font-bold text-slate-700">
                                            Please write your requests in English. (optional)
                                        </Label>
                                        <textarea
                                            className="w-full min-h-[90px] rounded-xl border border-slate-200 bg-white p-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/30"
                                            maxLength={1000}
                                            value={specialRequests}
                                            onChange={(e) => setSpecialRequests(e.target.value)}
                                            placeholder="e.g. Quiet room, upper floor, late arrival..."
                                        />
                                        <p className="text-[11px] text-slate-400 text-right">{specialRequests.length}/1000</p>
                                    </div>
                                </section>

                                {/* 7. Your Arrival Time Card */}
                                <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm space-y-3">
                                    <h3 className="font-extrabold text-brand-dark text-base">Your arrival time</h3>
                                    <div className="flex items-start gap-2.5 text-xs text-slate-700">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                                        <span>Your room will be ready for check-in at {checkInTimeLabel.replace(/^From\s+/i, '')}</span>
                                    </div>
                                    <div className="flex items-start gap-2.5 text-xs text-slate-700">
                                        <Building2 className="w-4 h-4 text-brand-primary shrink-0 mt-0.5" />
                                        <span>24-hour front desk — help whenever you need it!</span>
                                    </div>

                                    <div className="pt-1">
                                        <Label htmlFor="arrival-time-select" className="text-xs font-bold text-slate-700">
                                            Add your estimated arrival time (optional)
                                        </Label>
                                        <select
                                            id="arrival-time-select"
                                            className={cn(fieldClass, 'mt-1')}
                                            value={arrivalTime}
                                            onChange={(e) => setArrivalTime(e.target.value)}
                                        >
                                            {ARRIVAL_TIME_OPTIONS.map((opt) => (
                                                <option key={opt.value} value={opt.value}>
                                                    {opt.label}
                                                </option>
                                            ))}
                                        </select>
                                        <p className="text-[11px] text-slate-400 mt-1">Time is for Addis Ababa time zone</p>
                                    </div>
                                </section>

                                {/* 8. Cribs and Extra Beds Card */}
                                <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm space-y-3">
                                    <h3 className="font-extrabold text-brand-dark text-base">Cribs and extra beds</h3>
                                    <div className="space-y-1 text-xs text-slate-500">
                                        <p>• Requests are subject to availability</p>
                                        <p>• Requests need to be confirmed by the property</p>
                                        <p>• Requests not labeled &ldquo;Free&rdquo; could incur extra charges</p>
                                    </div>
                                    <div>
                                        <button
                                            type="button"
                                            onClick={() => setShowCribPolicy(true)}
                                            className="text-xs font-semibold text-brand-primary hover:underline cursor-pointer"
                                        >
                                            Read full crib and extra bed policy
                                        </button>
                                    </div>

                                    <div className="pt-2 border-t border-slate-100 space-y-2">
                                        <p className="text-xs font-bold text-slate-800">
                                            Add to your {draft.roomName}:
                                        </p>
                                        <div className="space-y-2 text-xs font-medium text-slate-800">
                                            <label className="flex items-center gap-2.5 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    className="h-4 w-4 rounded accent-brand-primary"
                                                    checked={needCrib}
                                                    onChange={(e) => setNeedCrib(e.target.checked)}
                                                />
                                                <span className="font-semibold text-slate-900">Crib</span>
                                                <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-extrabold text-emerald-800">
                                                    Free
                                                </span>
                                            </label>
                                            <label className="flex items-center gap-2.5 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    className="h-4 w-4 rounded accent-brand-primary"
                                                    checked={needExtraBed}
                                                    onChange={(e) => setNeedExtraBed(e.target.checked)}
                                                />
                                                <span className="font-semibold text-slate-900">Extra rollaway bed</span>
                                            </label>
                                        </div>
                                    </div>
                                </section>

                                {/* 9. Optional Meal Plan & Promo Codes Card */}
                                <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm space-y-3">
                                    <h3 className="font-extrabold text-brand-dark text-base">Meal plan & promotion</h3>
                                    <div className="space-y-3">
                                        <div>
                                            <Label className="text-xs font-bold text-slate-700">Meal Plan</Label>
                                            <select
                                                className={cn(fieldClass, 'mt-1')}
                                                value={mealPlan}
                                                onChange={(e) => setMealPlan(normalizeMealPlan(e.target.value))}
                                            >
                                                {MEAL_PLAN_OPTIONS.map((opt) => (
                                                    <option key={opt.code} value={opt.code}>
                                                        {opt.label} — {opt.description}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="grid gap-3 sm:grid-cols-2 pt-2 border-t border-slate-100">
                                            <div className="space-y-1">
                                                <Label className="text-xs font-bold text-slate-700">Promo Code</Label>
                                                <Input
                                                    className={fieldClass}
                                                    value={promoCode}
                                                    onChange={(e) => setPromoCode(e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, ''))}
                                                    placeholder="e.g. WELCOME15"
                                                />
                                                {codePromo.percent > 0 && promoCode.trim() && (
                                                    <p className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                                                        ✓ Code applied: {codePromo.percent}% discount!
                                                    </p>
                                                )}
                                                {codePromo.reason && promoCode.trim() && <p className="text-xs text-amber-700">{codePromo.reason}</p>}
                                            </div>
                                            <div className="space-y-1">
                                                <Label className="text-xs font-bold text-slate-700">Referral Code</Label>
                                                <Input
                                                    className={fieldClass}
                                                    value={referralCode}
                                                    onChange={(e) => setReferralCode(e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, ''))}
                                                    placeholder="e.g. FA-ALEM842"
                                                />
                                                {codePromo.percent > 0 && !promoCode.trim() && referralCode.trim() && (
                                                    <p className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                                                        ✓ Referral applied: {codePromo.percent}% discount!
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </section>

                                {/* 10. Bottom Action & CTA Bar */}
                                <div className="pt-2 space-y-3">
                                    <div className="flex items-center justify-between gap-4">
                                        <button
                                            type="button"
                                            onClick={() => setShowPriceMatchModal(true)}
                                            className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-primary hover:underline cursor-pointer shrink-0"
                                        >
                                            <Tag className="w-3.5 h-3.5" />
                                            <span>We Price Match</span>
                                        </button>

                                        <Button
                                            type="button"
                                            className="min-h-[48px] px-8 text-sm sm:text-base font-extrabold rounded-xl bg-brand-primary text-white hover:bg-teal-700 shadow-md transition-all flex items-center gap-2"
                                            onClick={proceedToStep3}
                                        >
                                            <span>Next: Final details</span>
                                            <span>&gt;</span>
                                        </Button>
                                    </div>

                                    <div className="text-right">
                                        <button
                                            type="button"
                                            onClick={() => setShowConditionsModal(true)}
                                            className="text-xs font-medium text-brand-primary hover:underline"
                                        >
                                            What are my booking conditions?
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* OTA Trust & Policy Footer */}
                        <footer className="pt-8 border-t border-slate-200/80 text-center text-xs text-slate-500 space-y-2">
                            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 font-semibold text-brand-primary">
                                <Link href="/about" className="hover:underline">About BookAddis.com</Link>
                                <span>|</span>
                                <Link href="/support" className="hover:underline">Customer Service Help</Link>
                                <span>|</span>
                                <Link href="/terms" className="hover:underline">Terms of Service</Link>
                                <span>|</span>
                                <Link href="/privacy" className="hover:underline">Privacy Notice</Link>
                            </div>
                            <p className="text-[11px] text-slate-400">
                                Copyright © 2024–{new Date().getFullYear()} BookAddis.com™. All rights reserved.
                            </p>
                        </footer>
                    </div>
                </div>
            </main>

            {/* Booking Conditions Modal */}
            {showConditionsModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in-50">
                    <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl space-y-4 max-h-[85vh] overflow-y-auto">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h3 className="text-base font-bold text-brand-dark">Booking Conditions</h3>
                            <button
                                type="button"
                                onClick={() => setShowConditionsModal(false)}
                                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
                            <div>
                                <h4 className="font-bold text-slate-900">Check-in and Check-out</h4>
                                <p>Check-in is available {checkInTimeLabel}. Check-out is until {checkOutTimeLabel}. Early check-in or late check-out is subject to availability and property confirmation.</p>
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-900">Payment Policy</h4>
                                <p>{paymentPref === 'pay_at_property' ? 'You will pay the full amount directly at the property upon check-in in ETB or USD as listed.' : 'Your payment is processed securely online. You will receive an official digital receipt immediately.'}</p>
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-900">Cancellation Policy</h4>
                                <p>Free cancellation is permitted up to 24 hours prior to the scheduled check-in time. Late cancellations or no-shows may incur charges equivalent to the first night of the stay.</p>
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-900">Guest Identification</h4>
                                <p>All adult guests are required to present valid government-issued photographic identification (e.g. Passport, National ID, or Driving License) upon check-in.</p>
                            </div>
                        </div>

                        <div className="pt-2 border-t border-slate-100 text-right">
                            <Button
                                type="button"
                                className="bg-brand-primary text-white hover:bg-teal-700 text-xs font-bold px-4 py-2 rounded-xl"
                                onClick={() => setShowConditionsModal(false)}
                            >
                                Got it
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Price Match Guarantee Modal */}
            {showPriceMatchModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in-50">
                    <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl space-y-4 max-h-[85vh] overflow-y-auto">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <div className="flex items-center gap-2">
                                <Tag className="w-5 h-5 text-brand-primary" />
                                <h3 className="text-base font-bold text-brand-dark">We Price Match</h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowPriceMatchModal(false)}
                                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
                            <p className="font-bold text-sm text-slate-900">
                                Found this reservation cheaper elsewhere? We&apos;ll match the price.
                            </p>
                            <p>
                                At BookAddis.com, we are committed to providing you with the best available hotel rates across Ethiopia. If you find a lower publicly available rate for the identical reservation before your check-in, we will match it or refund the difference!
                            </p>
                            <div className="rounded-xl bg-slate-50 border border-slate-100 p-3 space-y-2">
                                <h4 className="font-bold text-slate-900 text-xs">Requirements for Price Matching:</h4>
                                <ul className="space-y-1 list-disc list-inside text-[11px] text-slate-600">
                                    <li>Same hotel accommodation: <strong>{draft.hotelName}</strong></li>
                                    <li>Same room category: <strong>{draft.roomName}</strong></li>
                                    <li>Same dates of stay and number of guests</li>
                                    <li>Same cancellation policy and booking conditions</li>
                                </ul>
                            </div>
                            <p className="text-[11px] text-slate-500">
                                Simply contact our customer support with the link or screenshot of the cheaper active offer before checking in.
                            </p>
                        </div>

                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                            <Link
                                href="/support"
                                className="text-xs font-bold text-brand-primary hover:underline"
                            >
                                Contact Customer Support
                            </Link>
                            <Button
                                type="button"
                                className="bg-brand-primary text-white hover:bg-teal-700 text-xs font-bold px-5 py-2 rounded-xl"
                                onClick={() => setShowPriceMatchModal(false)}
                            >
                                Understood
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Crib and Extra Bed Policy Modal */}
            {showCribPolicy && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in-50">
                    <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h3 className="text-base font-bold text-brand-dark">Cribs & Extra Bed Policy</h3>
                            <button
                                type="button"
                                onClick={() => setShowCribPolicy(false)}
                                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="space-y-2 text-xs text-slate-600 leading-relaxed">
                            <p>
                                • Baby cribs/infant cots are provided free of charge by most partner hotels upon advance request, subject to availability at check-in.
                            </p>
                            <p>
                                • Extra rollaway beds for older children or adults may incur a supplementary charge payable directly to the hotel front desk.
                            </p>
                            <p>
                                • Your request will be transmitted directly to the front desk team upon booking confirmation.
                            </p>
                        </div>
                        <div className="pt-2 border-t border-slate-100 text-right">
                            <Button
                                type="button"
                                className="bg-brand-primary text-white hover:bg-teal-700 text-xs font-bold px-4 py-2 rounded-xl"
                                onClick={() => setShowCribPolicy(false)}
                            >
                                Close
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
