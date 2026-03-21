"use client";

import React, { Suspense } from 'react';
import { motion } from 'framer-motion';
import { XCircle, ArrowLeft, HelpCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { BOOKADDIS_HOME, sanitizeCheckoutReturnUrl } from '@/lib/checkout-return-url';

function CancelContent() {
    const searchParams = useSearchParams();
    const returnUrl = sanitizeCheckoutReturnUrl(searchParams.get('return_url'), BOOKADDIS_HOME);

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md w-full bg-white rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] p-8 md:p-12 text-center border border-gray-100"
        >
            <div className="mb-8 flex justify-center">
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", damping: 12, stiffness: 200, delay: 0.2 }}
                    className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center"
                >
                    <XCircle className="w-10 h-10 text-red-500" />
                </motion.div>
            </div>

            <h1 className="text-3xl font-bold text-gray-900 mb-3">Booking Cancelled</h1>
            <p className="text-gray-500 mb-8">
                Your payment was not completed and the booking was cancelled. No charges were made to your card.
            </p>

            <div className="bg-orange-50 p-4 rounded-2xl text-left border border-orange-100 mb-10">
                <div className="flex gap-3">
                    <HelpCircle className="w-5 h-5 text-orange-500 shrink-0" />
                    <p className="text-sm text-orange-700 italic">
                        &quot;My bank was charged but I see this page&quot; - Don&apos;t worry, any pending authorization will be automatically reversed by your bank within a few days.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-3">
                <Button
                    type="button"
                    onClick={() => {
                        window.location.href = returnUrl;
                    }}
                    className="w-full bg-brand-primary hover:bg-brand-dark text-white rounded-xl h-12 font-bold shadow-lg shadow-brand-primary/20"
                >
                    <ArrowLeft className="mr-2 w-4 h-4" />
                    Back to BookAddis
                </Button>
                <Button asChild variant="ghost" className="w-full text-gray-500 hover:text-brand-primary h-12 rounded-xl font-bold">
                    <Link href="/">Continue on FlowAddis</Link>
                </Button>
            </div>
        </motion.div>
    );
}

export default function BookingCancelPage() {
    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <Suspense
                fallback={
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
                    </div>
                }
            >
                <CancelContent />
            </Suspense>
        </div>
    );
}
