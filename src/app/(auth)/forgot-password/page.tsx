"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Logo } from '@/components/shared/logo';
import { motion } from 'framer-motion';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { handleAuthError } from '@/lib/utils/error-handling';

const forgotPasswordSchema = z.object({
    email: z.string().email({ message: "Please enter a valid email address" }),
});

type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

function ForgotPasswordContent() {
    const [loading, setLoading] = useState(false);
    const [emailSent, setEmailSent] = useState(false);
    const { sendPasswordReset } = useAuth();
    const searchParams = useSearchParams();
    const from = searchParams.get('redirect') || '/';

    const form = useForm<ForgotPasswordValues>({
        resolver: zodResolver(forgotPasswordSchema),
        defaultValues: {
            email: '',
        },
    });

    const onSubmit = async (data: ForgotPasswordValues) => {
        setLoading(true);
        try {
            await sendPasswordReset(data.email);
            setEmailSent(true);
            toast.success("Password reset email sent!");
        } catch (error: any) {
            console.error(error);
            handleAuthError(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-brand-gray p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md"
            >
                <div className="text-center mb-8">
                    <div className="flex justify-center mb-4">
                        <Logo className="text-2xl" />
                    </div>
                    <h1 className="text-2xl font-bold text-brand-dark">Reset Password</h1>
                    <p className="text-gray-500">Enter your email to receive reset instructions</p>
                </div>

                {emailSent ? (
                    <div className="text-center space-y-4 py-8">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto text-green-500">
                            <CheckCircle className="w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-bold text-brand-dark">Check your email</h3>
                        <p className="text-gray-500">
                            We sent password reset instructions to <span className="font-bold text-brand-dark">{form.getValues('email')}</span>.
                        </p>
                        <Link href={`/signin?redirect=${encodeURIComponent(from)}`}>
                            <Button variant="outline" className="mt-6 w-full">
                                Back to Sign In
                            </Button>
                        </Link>
                    </div>
                ) : (
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <Input
                            label="Email Address"
                            type="email"
                            placeholder="name@company.com"
                            {...form.register('email')}
                            error={form.formState.errors.email?.message}
                            icon={<Mail className="w-4 h-4" />}
                        />

                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? 'Sending...' : 'Send Reset Link'}
                        </Button>

                        <div className="mt-6 text-center text-sm">
                            <Link href={`/signin?redirect=${encodeURIComponent(from)}`} className="text-gray-500 hover:text-brand-primary flex items-center justify-center gap-2">
                                <ArrowLeft className="w-4 h-4" /> Back to Sign In
                            </Link>
                        </div>
                    </form>
                )}
            </motion.div>
        </div>
    );
}

export default function ForgotPasswordPage() {
    return (
        <React.Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
            <ForgotPasswordContent />
        </React.Suspense>
    );
}
