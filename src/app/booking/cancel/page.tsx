"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { XCircle, ArrowLeft, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function BookingCancelPage() {
    const router = useRouter();

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
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
                        <HelpCircle className="w-5 h-5 text-orange-500 flex-shrink-0" />
                        <p className="text-sm text-orange-700 italic">
                            "My bank was charged but I see this page" - Don't worry, any pending authorization will be automatically reversed by your bank within a few days.
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-3">
                    <Button onClick={() => router.back()} className="w-full bg-brand-primary hover:bg-brand-dark text-white rounded-xl h-12 font-bold shadow-lg shadow-brand-primary/20">
                        Try Again <ArrowLeft className="ml-2 w-4 h-4" />
                    </Button>
                    <Button asChild variant="ghost" className="w-full text-gray-500 hover:text-brand-primary h-12 rounded-xl font-bold">
                        <Link href="/">Back to Home</Link>
                    </Button>
                </div>
            </motion.div>
        </div>
    );
}
