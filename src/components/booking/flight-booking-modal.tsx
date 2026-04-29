"use client";

import React, { useMemo, useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { X, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Receipt } from './receipt';
import { PaymentForm } from './payment-form';
import { motion, AnimatePresence } from 'framer-motion';
import { formatCurrency } from '@/lib/currency';
import { useTripStore } from '@/store/trip-store';
import { useAuth } from '@/components/providers/auth-provider';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    saveFlightBookingDraftForAuthRedirect,
    consumeMatchedFlightDraft,
} from '@/lib/booking-draft-storage';

interface FlightBookingModalProps {
    isOpen: boolean;
    onClose: () => void;
    serviceName?: string;
    price?: number;
    flightData?: any;
    isLocal?: boolean;
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

const flightBookingSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    phone: z.string()
        .transform(normalizePhone)
        .refine((v) => /^\+?[1-9]\d{7,14}$/.test(v), 'Enter a valid international phone number (e.g. +14155552671)'),
});

type FlightBookingFormData = z.infer<typeof flightBookingSchema>;

export const FlightBookingModal: React.FC<FlightBookingModalProps> = ({
    isOpen,
    onClose,
    serviceName = 'Flight Booking',
    price = 0,
    flightData,
    isLocal = true,
}) => {
    const pathname = usePathname();
    const { addToTrip, checkoutTrip, currentTrip } = useTripStore();
    const { user, requireAuth } = useAuth();
    const [step, setStep] = useState<'form' | 'payment' | 'receipt'>('form');
    const [bookingData, setBookingData] = useState<any>(null);

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
        setValue,
        setError,
    } = useForm<FlightBookingFormData>({
        resolver: zodResolver(flightBookingSchema),
        defaultValues: {
            name: '',
            email: '',
            phone: '',
        },
    });

    // Country and national number UI state
    const [countryCode, setCountryCode] = useState<string>('ET');
    const selectedCountry: Country = useMemo(() => COUNTRIES.find(c => c.code === countryCode) || COUNTRIES[0], [countryCode]);
    const [nationalNumber, setNationalNumber] = useState<string>('');

    /** RapidAPI flight offer token — required for server-side price verification at checkout */
    const flightOfferToken =
        (flightData?.selectionKey as string | undefined) ||
        (flightData?.id as string | undefined) ||
        '';

    const updatePhoneE164 = (cc: Country, nat: string) => {
        const natDigits = nat.replace(/\D/g, '');
        const e164 = `${cc.dial}${natDigits}`;
        setValue('phone', e164, { shouldValidate: true });
    };

    const persistDraftAndRequireAuth = () => {
        saveFlightBookingDraftForAuthRedirect({ pathname });
        requireAuth();
    };

    useEffect(() => {
        if (!isOpen) return;
        const draft = consumeMatchedFlightDraft(pathname);
        if (!draft) return;
        reset({ name: '', email: '', phone: '' });
        setCountryCode('ET');
        setNationalNumber('');
        toast.success('Please enter your contact details to continue.');
    }, [isOpen, pathname, reset]);

    useEffect(() => {
        if (!isOpen || !user?.email) return;
        setValue('email', user.email, { shouldValidate: true });
    }, [isOpen, user?.email, setValue]);

    const resolveBookingEmail = (data: FlightBookingFormData) =>
        user?.email?.trim() ? user.email.trim() : data.email;

    const handleAddToTrip = (data: FlightBookingFormData) => {
        if (!user) {
            persistDraftAndRequireAuth();
            return;
        }
        const email = resolveBookingEmail(data);
        addToTrip({
            type: 'flight',
            price,
            details: {
                serviceName,
                customerName: data.name,
                email,
                phone: data.phone,
                flightDetails: flightData,
            },
        });
        onClose();
        reset();
        toast.success('Added to Trip! You can continue booking other services.');
    };

    const handleFormSubmit = (data: FlightBookingFormData) => {
        if (!user) {
            persistDraftAndRequireAuth();
            return;
        }
        // Additional country-based length validation
        const natDigits = nationalNumber.replace(/\D/g, '');
        if (natDigits.length < selectedCountry.min || natDigits.length > selectedCountry.max) {
            setError('phone', { type: 'validate', message: `Phone number length should be ${selectedCountry.min === selectedCountry.max ? selectedCountry.min : `${selectedCountry.min}-${selectedCountry.max}`} digits for ${selectedCountry.name}` });
            return;
        }
        setBookingData({ ...data, email: resolveBookingEmail(data) });
        setStep('payment');
    };

    const handlePaymentSuccess = async (paymentMethod: 'stripe' | 'telebirr' | 'cbebirr' | 'pay_on_site') => {
        if (!bookingData) return;

        const formData = bookingData as FlightBookingFormData;
        const email = user?.email?.trim() ? user.email.trim() : formData.email;

        if (currentTrip.length === 0) {
            addToTrip({
                type: 'flight',
                price,
                details: {
                    serviceName,
                    customerName: formData.name,
                    email,
                    phone: formData.phone,
                    flightDetails: flightData,
                },
            });
        }

        const userId = user?.id || 'guest-' + Math.random();
        const tripId = await checkoutTrip(userId);

        const newBooking = {
            id: tripId,
            clientName: formData.name,
            email,
            service: serviceName,
            date: new Date().toLocaleDateString(),
            amount: price,
            status: 'Confirmed' as const,
            paymentMethod,
        };
        setBookingData(newBooking);
        setStep('receipt');
        toast.success(paymentMethod === 'pay_on_site' ? 'Booking reserved. Pay on site.' : 'Payment successful! Your booking is confirmed.');
    };

    const handleClose = () => {
        onClose();
        setTimeout(() => {
            setStep('form');
            reset();
            setBookingData(null);
            setNationalNumber('');
        }, 500);
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-10000 flex items-center justify-center p-4 bg-brand-dark/60 backdrop-blur-md">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-transparent dark:border-slate-700 w-full max-w-md sm:max-w-lg md:max-w-xl max-h-[90vh] overflow-y-auto scrollbar-hide overscroll-contain z-10001"
                >
                    <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-slate-700">
                        <h2 className="text-xl font-bold text-brand-dark dark:text-foreground">
                            {step === 'form'
                                ? 'Complete Your Flight Booking'
                                : step === 'payment'
                                    ? 'Secure Payment'
                                    : 'Booking Confirmed'}
                        </h2>
                        <button
                            onClick={handleClose}
                            className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="p-6">
                        {step === 'form' && (
                            <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5">
                                <div className="bg-brand-gray p-5 rounded-2xl border border-gray-100">
                                    <h3 className="font-bold text-brand-dark text-lg mb-1">{serviceName}</h3>
                                    <p className="text-brand-primary font-extrabold text-2xl">
                                        {formatCurrency(price)}
                                    </p>
                                    {flightData && (
                                        <div className="mt-2 text-xs text-gray-500">
                                            {flightData.departureTime} • {flightData.airline}
                                        </div>
                                    )}
                                </div>

                                <Input
                                    id="name"
                                    label="Passenger Full Name"
                                    {...register('name')}
                                    error={errors.name?.message}
                                />
                                <Input
                                    id="email"
                                    label="Email Address"
                                    type="email"
                                    readOnly={!!user?.email}
                                    title={user?.email ? 'Bookings use your signed-in account email' : undefined}
                                    className={user?.email ? 'bg-gray-50 text-gray-800 cursor-not-allowed' : undefined}
                                    {...register('email')}
                                    error={errors.email?.message}
                                />
                                {user?.email && (
                                    <p className="text-xs text-gray-500 -mt-2">
                                        Confirmations are sent to your account email. To use another address, sign out and
                                        book as a guest or use a different account.
                                    </p>
                                )}

                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Phone Number</label>
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

                                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={handleSubmit(handleAddToTrip)}
                                        className="w-full sm:flex-1"
                                    >
                                        <ShoppingBag className="w-4 h-4 mr-2" /> Add to Trip
                                    </Button>
                                    <Button type="submit" className="w-full sm:flex-1">
                                        Book Now
                                    </Button>
                                </div>
                            </form>
                        )}

                        {step === 'payment' && (
                            <PaymentForm
                                amount={price}
                                onSuccess={handlePaymentSuccess as any}
                                onCancel={() => setStep('form')}
                                isLocal={isLocal}
                                bookingType="flight"
                                source="rapidapi"
                                externalItemId={flightOfferToken}
                                currencyCode={flightData?.price?.currency || 'USD'}
                                externalSnapshot={{
                                    serviceName,
                                    type: 'flight',
                                    airline: flightData?.airline,
                                    flightNumber: flightData?.flightNumber,
                                }}
                            />
                        )}

                        {step === 'receipt' && bookingData && (
                            <Receipt booking={bookingData} onClose={handleClose} kind={bookingData.paymentMethod === 'pay_on_site' ? 'reservation' : 'paid'} />
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
