"use client";

import React, { useState } from 'react';
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

interface BookingModalProps {
    isOpen: boolean;
    onClose: () => void;
    serviceName?: string;
    price?: number;
    type?: 'flight' | 'hotel' | 'shuttle' | 'conference';
}

const bookingSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    phone: z.string().regex(/^(09|07|\+251)\d{8,9}$/, 'Invalid Ethiopian phone number'),
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
    } = useForm<BookingFormData>({
        resolver: zodResolver(bookingSchema),
        defaultValues: {
            name: '',
            email: '',
            phone: '',
            date: '',
        },
    });

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
        alert('Added to Trip! You can continue booking other services.');
    };

    const handleFormSubmit = (data: BookingFormData) => {
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
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-dark/60 backdrop-blur-md">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden max-h-[90vh] overflow-y-auto"
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
                                <Input
                                    id="phone"
                                    label="Phone Number"
                                    type="tel"
                                    placeholder="0912345678"
                                    {...register('phone')}
                                    error={errors.phone?.message}
                                />
                                <Input
                                    id="date"
                                    label="Date"
                                    type="date"
                                    {...register('date')}
                                    error={errors.date?.message}
                                />

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
