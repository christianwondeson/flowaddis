"use client";

import React, { useMemo, useState } from 'react';
import { X, ShoppingBag, Calendar as CalendarIcon } from 'lucide-react';
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
import { Popover } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface BookingModalProps {
    isOpen: boolean;
    onClose: () => void;
    serviceName?: string;
    price?: number;
    type?: 'flight' | 'hotel' | 'shuttle' | 'conference';
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
const bookingSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    phone: z.string()
        .transform(normalizePhone)
        // E.164 pattern: +{country}{nsn} with 8-15 digits total, allow also local numbers without + if valid length
        .refine((v) => /^\+?[1-9]\d{7,14}$/.test(v), 'Enter a valid international phone number (e.g. +14155552671)'),
    date: z.string().min(1, 'Date is required'),
});

type BookingFormData = z.infer<typeof bookingSchema>;

export const BookingModal: React.FC<BookingModalProps> = ({
    isOpen,
    onClose,
    serviceName = 'Service',
    price = 0,
    type = 'hotel',
}) => {
    const { addToTrip, checkoutTrip, currentTrip } = useTripStore();
    const { user } = useAuth();
    const [step, setStep] = useState<'form' | 'payment' | 'receipt'>('form');
    const [bookingData, setBookingData] = useState<any>(null);

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
            date: '',
        },
    });
    const selectedDate = watch('date');

    // Country and national number UI state
    const [countryCode, setCountryCode] = useState<string>('ET');
    const selectedCountry: Country = useMemo(() => COUNTRIES.find(c => c.code === countryCode) || COUNTRIES[0], [countryCode]);
    const [nationalNumber, setNationalNumber] = useState<string>('');

    const updatePhoneE164 = (cc: Country, nat: string) => {
        const natDigits = nat.replace(/\D/g, '');
        const e164 = `${cc.dial}${natDigits}`;
        setValue('phone', e164, { shouldValidate: true });
    };

    const handleAddToTrip = (data: BookingFormData) => {
        addToTrip({
            type,
            price,
            details: {
                serviceName,
                customerName: data.name,
                email: data.email,
                phone: data.phone,
                date: data.date
            },
        });
        onClose();
        reset();
        toast.success('Added to Trip! You can continue booking other services.');
    };

    const handleFormSubmit = (data: BookingFormData) => {
        // Additional country-based length validation
        const natDigits = nationalNumber.replace(/\D/g, '');
        if (natDigits.length < selectedCountry.min || natDigits.length > selectedCountry.max) {
            setError('phone', { type: 'validate', message: `Phone number length should be ${selectedCountry.min === selectedCountry.max ? selectedCountry.min : `${selectedCountry.min}-${selectedCountry.max}`} digits for ${selectedCountry.name}` });
            return;
        }
        setBookingData(data); // Store form data
        setStep('payment');
    };

    const handlePaymentSuccess = async () => {
        if (!bookingData) return;

        const formData = bookingData;

        if (currentTrip.length === 0) {
            addToTrip({
                type,
                price,
                details: {
                    serviceName,
                    customerName: formData.name,
                    email: formData.email,
                    phone: formData.phone,
                    date: formData.date
                },
            });
        }

        const userId = user?.id || 'guest-' + Math.random();
        const tripId = await checkoutTrip(userId);

        const newBooking = {
            id: tripId,
            clientName: formData.name,
            email: formData.email,
            service: serviceName,
            date: formData.date,
            amount: price,
            status: 'Confirmed' as const,
        };
        setBookingData(newBooking);
        setStep('receipt');
        toast.success('Payment successful! Your booking is confirmed.');
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
            <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-brand-dark/60 backdrop-blur-md">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="bg-white rounded-3xl shadow-2xl w-full max-w-md sm:max-w-lg md:max-w-xl overflow-hidden max-h-[90vh] overflow-y-auto z-[10001]"
                >
                    <div className="flex justify-between items-center p-6 border-b border-gray-100">
                        <h2 className="text-xl font-bold text-brand-dark">
                            {step === 'form'
                                ? 'Complete Your Booking'
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
                                        {formatCurrency(price)}{' '}
                                        <span className="text-gray-500 font-medium text-sm">/ unit</span>
                                    </p>
                                </div>

                                <Input
                                    id="name"
                                    label="Full Name"
                                    {...register('name')}
                                    error={errors.name?.message}
                                />
                                <Input
                                    id="email"
                                    label="Email Address"
                                    type="email"
                                    {...register('email')}
                                    error={errors.email?.message}
                                />
                                {/* Country selector + phone input */}
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Phone Number</label>
                                    <div className="grid grid-cols-3 gap-2">
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
                                        <div className="col-span-2">
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
                                <Popover
                                    trigger={
                                        <div className="w-full cursor-pointer">
                                            <label htmlFor="date" className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Date</label>
                                            <div className="flex items-center gap-3 w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl hover:bg-white hover:border-brand-primary/50 transition-all group">
                                                <CalendarIcon className="w-5 h-5 text-gray-400 group-hover:text-brand-primary transition-colors" />
                                                <span className="text-gray-900 font-medium">{selectedDate || 'Select Date'}</span>
                                            </div>
                                        </div>
                                    }
                                    content={
                                        <Calendar
                                            selected={selectedDate ? new Date(selectedDate) : undefined}
                                            onSelect={(date) => setValue('date', date.toISOString().split('T')[0], { shouldValidate: true })}
                                            minDate={new Date()}
                                        />
                                    }
                                />
                                {errors.date?.message && (
                                    <p className="text-red-500 text-xs mt-1 ml-1">{errors.date.message}</p>
                                )}

                                <div className="flex gap-3 pt-4">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={handleSubmit(handleAddToTrip)}
                                        className="flex-1"
                                    >
                                        <ShoppingBag className="w-4 h-4 mr-2" /> Add to Trip
                                    </Button>
                                    <Button type="submit" className="flex-1">
                                        Book Now
                                    </Button>
                                </div>
                            </form>
                        )}

                        {step === 'payment' && (
                            <PaymentForm
                                amount={price}
                                onSuccess={handlePaymentSuccess}
                                onCancel={() => setStep('form')}
                            />
                        )}

                        {step === 'receipt' && bookingData && (
                            <Receipt booking={bookingData} onClose={handleClose} />
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
