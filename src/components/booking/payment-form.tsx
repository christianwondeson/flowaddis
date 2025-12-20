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

interface PaymentFormProps {
    amount: number;
    onSuccess: () => void;
    onCancel: () => void;
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

export const PaymentForm: React.FC<PaymentFormProps> = ({ amount, onSuccess, onCancel }) => {
    const [method, setMethod] = useState<PaymentMethod>('telebirr');
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

    const stripeForm = useForm({
        resolver: zodResolver(stripeSchema),
        defaultValues: { cardNumber: '', expiry: '', cvc: '' },
    });

    const handlePayment = async (data: any) => {
        setLoading(true);

        // Simulate payment processing
        setTimeout(() => {
            setLoading(false);
            onSuccess();
        }, 2000);
    };

    const getCurrentForm = () => {
        switch (method) {
            case 'telebirr':
                return telebirrForm;
            case 'cbebirr':
                return cbebirrForm;
            case 'stripe':
                return stripeForm;
        }
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

            <div className="grid grid-cols-3 gap-3">
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

                <button
                    type="button"
                    onClick={() => setMethod('stripe')}
                    className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${method === 'stripe'
                            ? 'border-brand-primary bg-blue-50 text-brand-primary'
                            : 'border-gray-100 hover:border-gray-200 text-gray-500'
                        }`}
                >
                    <CreditCard className="w-6 h-6" />
                    <span className="text-xs font-bold">Card</span>
                </button>
            </div>

            <form onSubmit={getCurrentForm().handleSubmit(handlePayment)} className="space-y-4">
                {method === 'telebirr' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <Input
                            label="Telebirr Phone Number"
                            placeholder="0912345678"
                            {...telebirrForm.register('phone')}
                            error={telebirrForm.formState.errors.phone?.message}
                        />
                        <p className="text-xs text-gray-500 mt-1">Enter your Telebirr registered phone number</p>
                    </motion.div>
                )}

                {method === 'cbebirr' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <Input
                            label="CBE Account Number"
                            placeholder="1000123456"
                            {...cbebirrForm.register('accountNumber')}
                            error={cbebirrForm.formState.errors.accountNumber?.message}
                        />
                        <p className="text-xs text-gray-500 mt-1">Enter your CBE Birr account number</p>
                    </motion.div>
                )}

                {method === 'stripe' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                        <div className="bg-gray-50 p-3 rounded-lg text-xs text-gray-500 mb-2 flex items-center gap-2">
                            <CreditCard className="w-4 h-4" />
                            Secure payment via Stripe
                        </div>
                        <Input
                            label="Card Number"
                            placeholder="1234567812345678"
                            maxLength={16}
                            {...stripeForm.register('cardNumber')}
                            error={stripeForm.formState.errors.cardNumber?.message}
                        />
                        <div className="grid grid-cols-2 gap-3">
                            <Input
                                label="Expiry"
                                placeholder="MM/YY"
                                maxLength={5}
                                {...stripeForm.register('expiry')}
                                error={stripeForm.formState.errors.expiry?.message}
                            />
                            <Input
                                label="CVC"
                                placeholder="123"
                                maxLength={4}
                                {...stripeForm.register('cvc')}
                                error={stripeForm.formState.errors.cvc?.message}
                            />
                        </div>
                    </motion.div>
                )}

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
        </div>
    );
};
