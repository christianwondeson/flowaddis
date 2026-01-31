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

interface PaymentFormProps {
    amount: number;
    onSuccess: () => void;
    onCancel: () => void;
    isLocal?: boolean; // New prop to determine if local methods (Telebirr/CBE) should be shown
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

export const PaymentForm: React.FC<PaymentFormProps> = ({ amount, onSuccess, onCancel, isLocal = true }) => {
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
                const response = await fetch('/api/checkout', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        amount,
                        currency: 'usd',
                        payment_method_types: ['card'],
                    }),
                });

                const { url, error } = await response.json();
                if (url) {
                    window.location.href = url;
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
        <div className="space-y-6">
            <div className="text-center">
                <h3 className="text-lg font-bold text-brand-dark">Select Payment Method</h3>
                <p className="text-gray-500 text-sm">
                    Total Amount:{' '}
                    <span className="text-brand-primary font-bold text-xl">
                        {formatCurrency(displayAmount, currency)}
                    </span>
                </p>
            </div>

            <div className={`grid gap-3 ${isLocal ? 'grid-cols-3' : 'grid-cols-1'}`}>
                {isLocal && (
                    <>
                        <button
                            type="button"
                            onClick={() => setMethod('telebirr')}
                            className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${method === 'telebirr'
                                ? 'border-[#5C2D91] bg-purple-50 text-[#5C2D91]'
                                : 'border-gray-100 hover:border-gray-200 text-gray-500'
                                }`}
                        >
                            <div className="w-8 h-8 relative">
                                <Image
                                    src="/assets/telebirr-logo.png"
                                    alt="Telebirr"
                                    fill
                                    className="object-contain"
                                    onError={(e) => {
                                        e.currentTarget.style.display = 'none';
                                    }}
                                />
                                {method !== 'telebirr' && <Smartphone className="w-6 h-6" />}
                            </div>
                            <span className="text-xs font-bold">Telebirr</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setMethod('cbebirr')}
                            className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${method === 'cbebirr'
                                ? 'border-[#006838] bg-green-50 text-[#006838]'
                                : 'border-gray-100 hover:border-gray-200 text-gray-500'
                                }`}
                        >
                            <div className="w-8 h-8 relative">
                                <Image
                                    src="/assets/cbe-logo.png"
                                    alt="CBE Birr"
                                    fill
                                    className="object-contain"
                                    onError={(e) => {
                                        e.currentTarget.style.display = 'none';
                                    }}
                                />
                                {method !== 'cbebirr' && <Building2 className="w-6 h-6" />}
                            </div>
                            <span className="text-xs font-bold">CBE Birr</span>
                        </button>
                    </>
                )}

                <button
                    type="button"
                    onClick={() => setMethod('stripe')}
                    className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${method === 'stripe'
                        ? 'border-brand-primary bg-blue-50 text-brand-primary'
                        : 'border-gray-100 hover:border-gray-200 text-gray-500'
                        } ${!isLocal ? 'w-full' : ''}`}
                >
                    <CreditCard className="w-6 h-6" />
                    <span className="text-xs font-bold">International Card</span>
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
                                className="flex-1 bg-[#635BFF] hover:bg-[#5851E0] text-white"
                                disabled={loading}
                                onClick={() => handlePayment({})}
                            >
                                {loading ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    `Pay with Card`
                                )}
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
