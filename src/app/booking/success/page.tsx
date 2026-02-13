"use client";

import React, { useEffect, useState, Suspense } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, ArrowRight, Download, Mail, Home, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

function SuccessContent() {
    const searchParams = useSearchParams();
    const sessionId = searchParams.get('session_id');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // In a real app, you might want to verify the session status here
        const timer = setTimeout(() => setLoading(false), 2000);
        return () => clearTimeout(timer);
    }, [sessionId]);

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
                    className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center"
                >
                    <CheckCircle2 className="w-10 h-10 text-green-500" />
                </motion.div>
            </div>

            <h1 className="text-3xl font-bold text-gray-900 mb-3">Booking Confirmed!</h1>
            <p className="text-gray-500 mb-8">
                Thank you for choosing BookAddis. Your payment has been processed successfully and your booking is secured.
            </p>

            <div className="space-y-4 mb-10">
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl text-left border border-gray-100">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                        <Mail className="w-5 h-5 text-brand-primary" />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">E-Ticket Sent</p>
                        <p className="text-sm font-semibold text-gray-700">Check your inbox for details</p>
                    </div>
                </div>

                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl text-left border border-gray-100">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                        <Download className="w-5 h-5 text-brand-primary" />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Booking ID</p>
                        <p className="text-sm font-semibold text-gray-700">#{sessionId ? sessionId.slice(-8).toUpperCase() : 'PROCESSED'}</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-3">
                <Button asChild className="w-full bg-brand-primary hover:bg-brand-dark text-white rounded-xl h-12 font-bold shadow-lg shadow-brand-primary/20">
                    <Link href="/">
                        Return to Home <Home className="ml-2 w-4 h-4" />
                    </Link>
                </Button>
                <Button variant="ghost" className="w-full text-gray-500 hover:text-brand-primary h-12 rounded-xl font-bold">
                    View Booking Details <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
            </div>
        </motion.div>
    );
}

export default function BookingSuccessPage() {
    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <Suspense fallback={
                <div className="flex items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
                </div>
            }>
                <SuccessContent />
            </Suspense>
        </div>
    );
}
