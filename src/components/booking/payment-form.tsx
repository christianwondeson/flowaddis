"use client";

import React, { useState } from 'react';
import { Smartphone, Building2, CreditCard, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion } from 'framer-motion';
import { formatCurrency } from '@/lib/currency';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Image from 'next/image';
import { toast } from 'sonner';
import { auth } from '@/lib/firebase';
import { getStripe } from '@/lib/stripe';

interface PaymentFormProps {
    amount: number;
    onSuccess: () => void;
    onCancel: () => void;
    isLocal?: boolean; // New prop to determine if local methods (Telebirr/CBE) should be shown
    // Optional metadata for Stripe backend spec
    bookingType?: 'flight' | 'hotel' | 'event' | 'car';
    source?: string; // e.g., 'amadeus', 'duffel', 'local'
    externalItemId?: string; // ID from provider/search result
    currencyCode?: string; // default USD
    externalSnapshot?: Record<string, any>;
}

type PaymentMethod = 'telebirr' | 'cbebirr' | 'stripe';

// Validation schemas
const telebirrSchema = z.object({
    phone: z.string().regex(/^(09|07)\d{8}$/, 'Invalid Ethiopian phone number (e.g., 0912345678)'),
});

const cbebirrSchema = z.object({
    accountNumber: z.string().min(10, 'Account number must be at least 10 digits').regex(/^\d+$/, 'Only numbers allowed'),
});

const stripeSchema = z.object({
    cardNumber: z.string().regex(/^\d{16}$/, 'Card number must be 16 digits'),
    expiry: z.string().regex(/^(0[1-9]|1[0-2])\/\d{2}$/, 'Format: MM/YY'),
    cvc: z.string().regex(/^\d{3,4}$/, 'CVC must be 3-4 digits'),
});

export const PaymentForm: React.FC<PaymentFormProps> = ({ amount, onSuccess, onCancel, isLocal = true, bookingType = 'flight', source = 'local', externalItemId = 'N/A', currencyCode = 'USD', externalSnapshot = {} }) => {
    // Default to stripe if not local, otherwise telebirr
    const [method, setMethod] = useState<PaymentMethod>(isLocal ? 'telebirr' : 'stripe');
    const [loading, setLoading] = useState(false);

    const currency = method === 'stripe' ? 'USD' : 'ETB';
    const displayAmount = method === 'stripe' ? amount : amount * 55; // Rough USD to ETB conversion

    const telebirrForm = useForm({
        resolver: zodResolver(telebirrSchema),
        defaultValues: { phone: '' },
    });

    const cbebirrForm = useForm({
        resolver: zodResolver(cbebirrSchema),
        defaultValues: { accountNumber: '' },
    });

    // We no longer need a react-hook-form for stripe as it's a redirect

    const handlePayment = async (data: any) => {
        setLoading(true);

        if (method === 'stripe') {
            try {
                // Ensure user is logged in
                if (!auth?.currentUser) {
                    toast.error('Please sign in to continue to payment.');
                    setLoading(false);
                    return;
                }

                // Force-refresh Firebase ID token to avoid invalid/expired tokens
                const token = await auth.currentUser.getIdToken(true);

                const response = await fetch('/api/checkout', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...(token ? { Authorization: `Bearer ${token}` } : {}),
                    },
                    // Match backend API spec
                    body: JSON.stringify({
                        bookingType,
                        source,
                        externalItemId,
                        displayedPrice: amount,
                        currency: currencyCode || 'USD',
                        external_snapshot: externalSnapshot,
                    }),
                });

                // Handle response
                if (response.status === 401) {
                    toast.error('Authentication failed. Please sign out and sign in again.');
                }
                const payload = await response.json();
                const { url, error, sessionId } = payload || {};

                if (url) {
                    window.location.href = url;
                    return;
                }
                if (sessionId) {
                    const stripe = await getStripe();
                    if (!stripe) {
                        toast.error('Stripe failed to load.');
                    } else {
                        const { error: stripeError } = await (stripe as any).redirectToCheckout({ sessionId });
                        if (stripeError) {
                            console.error('Stripe redirect error:', stripeError);
                            toast.error(stripeError.message || 'Unable to redirect to Stripe.');
                        }
                    }
                    return;
                }
                if (error) {
                    toast.error(error);
                }
            } catch (err) {
                toast.error('Failed to initialize Stripe checkout');
                console.error(err);
            } finally {
                setLoading(false);
            }
            return;
        }

        // Local payment processing (simulated)
        setTimeout(() => {
            setLoading(false);
            onSuccess();
        }, 2000);
    };

    const onSubmit = (data: any) => {
        handlePayment(data);
    };

    return (
        <div className="space-y-8">
            <div className="text-center space-y-2">
                <h3 className="text-2xl font-bold text-brand-dark">Choose Payment Method</h3>
                <p className="text-gray-600 text-base">
                    Total Amount:{' '}
                    <span className="text-brand-primary font-bold text-2xl">
                        {formatCurrency(displayAmount, currency)}
                    </span>
                </p>
            </div>

            <div className={`grid gap-4 md:gap-6 ${isLocal ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-1'}`}>
                {isLocal && (
                    <>
                        <button
                            type="button"
                            onClick={() => setMethod('telebirr')}
                            className={`p-4 md:p-6 rounded-2xl border-3 flex flex-col items-center justify-center gap-2 md:gap-4 transition-all duration-300 min-h-[120px] md:min-h-[160px] ${method === 'telebirr'
                                ? 'border-[#5C2D91] bg-[#5C2D91]/10 shadow-lg ring-2 ring-[#5C2D91]/20'
                                : 'border-gray-200 hover:border-[#5C2D91]/40 hover:shadow-md bg-white'
                                }`}
                        >
                            <div className="w-12 h-12 md:w-20 md:h-20 relative">
                                <Image
                                    src="/assets/images/telebirr.png"
                                    alt="Telebirr"
                                    fill
                                    className={`object-contain transition-all duration-300 ${method === 'telebirr' ? 'scale-110' : 'opacity-80'}`}
                                />
                            </div>
                            <span className={`text-sm uppercase tracking-wide font-bold transition-colors ${method === 'telebirr' ? 'text-[#5C2D91]' : 'text-gray-600'}`}>Telebirr</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setMethod('cbebirr')}
                            className={`p-4 md:p-6 rounded-2xl border-3 flex flex-col items-center justify-center gap-2 md:gap-4 transition-all duration-300 min-h-[120px] md:min-h-[160px] ${method === 'cbebirr'
                                ? 'border-[#006838] bg-[#006838]/10 shadow-lg ring-2 ring-[#006838]/20'
                                : 'border-gray-200 hover:border-[#006838]/40 hover:shadow-md bg-white'
                                }`}
                        >
                            <div className="w-12 h-12 md:w-20 md:h-20 relative">
                                <Image
                                    src="/assets/images/branch.png"
                                    alt="CBE Birr"
                                    fill
                                    className={`object-contain transition-all duration-300 ${method === 'cbebirr' ? 'scale-110' : 'opacity-80'}`}
                                />
                            </div>
                            <span className={`text-sm uppercase tracking-wide font-bold transition-colors ${method === 'cbebirr' ? 'text-[#006838]' : 'text-gray-600'}`}>Bank Transfer</span>
                        </button>
                    </>
                )}

                <button
                    type="button"
                    onClick={() => setMethod('stripe')}
                    className={`p-4 md:p-6 rounded-2xl border-3 flex flex-col items-center justify-center gap-2 md:gap-4 transition-all duration-300 min-h-[120px] md:min-h-[160px] ${method === 'stripe'
                        ? 'border-[#635BFF] bg-[#635BFF]/10 shadow-lg ring-2 ring-[#635BFF]/20'
                        : 'border-gray-200 hover:border-[#635BFF]/40 hover:shadow-md bg-white'
                        } ${!isLocal ? 'w-full' : ''}`}
                >
                    <div className={`w-12 h-12 md:w-20 md:h-20 rounded-2xl flex items-center justify-center transition-all duration-300 overflow-hidden relative ${method === 'stripe' ? 'scale-110 shadow-lg' : 'opacity-80'}`}>
                        {/* Colorful Gradient Card Background */}
                        <div className="absolute inset-0 bg-gradient-to-br from-[#0061ff] via-[#6033ff] to-[#ff00c6] animate-gradient-xy"></div>
                        {/* Decorative elements to make it look like a card */}
                        <div className="absolute top-2 left-2 w-6 h-4 bg-white/20 rounded-sm blur-[1px]"></div>
                        <div className="absolute bottom-2 right-2 flex gap-1">
                            <div className="w-4 h-4 rounded-full bg-red-500/80"></div>
                            <div className="w-4 h-4 rounded-full bg-yellow-500/80 -ml-2"></div>
                        </div>
                        <CreditCard className="w-6 h-6 md:w-10 md:h-10 text-white relative z-10" />
                    </div>
                    <div className="text-center">
                        <span className={`block text-sm uppercase tracking-wide font-bold transition-colors ${method === 'stripe' ? 'text-[#635BFF]' : 'text-gray-600'}`}>International Cards</span>
                        <div className="flex items-center justify-center gap-1 mt-1">
                            <span className="text-[10px] text-gray-500 font-medium">Visa</span>
                            <div className="w-1 h-1 rounded-full bg-gray-300"></div>
                            <span className="text-[10px] text-gray-500 font-medium">Mastercard</span>
                            <div className="w-1 h-1 rounded-full bg-gray-300"></div>
                            <span className="text-[10px] text-gray-500 font-medium">Amex</span>
                        </div>
                    </div>
                </button>
            </div>

            <div className="space-y-4">
                {method === 'telebirr' && isLocal && (
                    <form onSubmit={telebirrForm.handleSubmit(onSubmit)} className="space-y-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            <Input
                                label="Telebirr Phone Number"
                                placeholder="0912345678"
                                {...telebirrForm.register('phone')}
                                error={telebirrForm.formState.errors.phone?.message}
                            />
                            <p className="text-xs text-gray-500 mt-1">Enter your Telebirr registered phone number</p>
                        </motion.div>
                        <div className="flex gap-3 pt-4">
                            <Button variant="outline" onClick={onCancel} className="flex-1" type="button">
                                Cancel
                            </Button>
                            <Button className="flex-1" disabled={loading} type="submit">
                                {loading ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    `Pay ${formatCurrency(displayAmount, currency)}`
                                )}
                            </Button>
                        </div>
                    </form>
                )}

                {method === 'cbebirr' && isLocal && (
                    <form onSubmit={cbebirrForm.handleSubmit(onSubmit)} className="space-y-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            <Input
                                label="CBE Account Number"
                                placeholder="1000123456"
                                {...cbebirrForm.register('accountNumber')}
                                error={cbebirrForm.formState.errors.accountNumber?.message}
                            />
                            <p className="text-xs text-gray-500 mt-1">Enter your CBE Birr account number</p>
                        </motion.div>
                        <div className="flex gap-3 pt-4">
                            <Button variant="outline" onClick={onCancel} className="flex-1" type="button">
                                Cancel
                            </Button>
                            <Button className="flex-1" disabled={loading} type="submit">
                                {loading ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    `Pay ${formatCurrency(displayAmount, currency)}`
                                )}
                            </Button>
                        </div>
                    </form>
                )}

                {method === 'stripe' && (
                    <div className="space-y-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                            <div className="bg-blue-50 p-4 rounded-xl text-sm text-blue-700 border border-blue-100 flex items-center gap-3">
                                <CreditCard className="w-5 h-5 flex-shrink-0" />
                                <div>
                                    <p className="font-bold">Secure Stripe Payment</p>
                                    <p className="text-xs opacity-80">You will be redirected to Stripe's secure checkout page to complete your payment.</p>
                                </div>
                            </div>
                        </motion.div>
                        <div className="flex gap-3 pt-4">
                            <Button variant="outline" onClick={onCancel} className="flex-1" type="button">
                                Cancel
                            </Button>
                            <Button
                                className="flex-1"
                                disabled={loading}
                                onClick={() => handlePayment({})}
                            >
                                {loading ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    `Pay ${formatCurrency(displayAmount, currency)}`
                                )}
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
