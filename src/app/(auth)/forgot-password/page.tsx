"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { Suspense } from 'react';
import { useAuth } from '@/components/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CheckCircle, Mail, ArrowRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';
import { AuthLayout } from '@/components/layout/auth-layout';
import { FormField } from '@/components/auth/form-field';

const forgotPasswordSchema = z.object({
    email: z.string().email({ message: "Please enter a valid email address" }),
});

type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

function ForgotPasswordContent() {
    const [loading, setLoading] = useState(false);
    const [emailSent, setEmailSent] = useState(false);
    const [sentEmail, setSentEmail] = useState('');
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');

    const { sendPasswordReset } = useAuth();

    const validateForm = () => {
        if (!email) {
            setError('Email is required');
            return false;
        }
        if (!email.includes('@')) {
            setError('Please enter a valid email address');
            return false;
        }
        setError('');
        return true;
    };

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;

        setLoading(true);
        try {
            await sendPasswordReset(email);
            setSentEmail(email);
            setEmailSent(true);
            toast.success("Password reset email sent!");
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Failed to send reset email. Please try again.";
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    if (emailSent) {
        return (
            <AuthLayout
                title="Check Your Email"
                subtitle="Reset link sent successfully"
            >
                <div className="text-center space-y-6">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto text-green-600">
                        <CheckCircle className="w-8 h-8" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-brand-dark mb-2">Password reset email sent</h3>
                        <p className="text-sm text-gray-600">
                            We sent a password reset link to <span className="font-semibold text-brand-dark">{sentEmail}</span>. Check your email to continue.
                        </p>
                    </div>
                </div>
            </AuthLayout>
        );
    }

    return (
        <AuthLayout
            title="Reset Password"
            subtitle="Enter your email to receive a reset link"
            footerLink={{
                text: "Remember your password?",
                href: "/signin",
                linkText: "Sign In",
            }}
        >
            <form onSubmit={onSubmit} className="space-y-4 sm:space-y-5">
                <FormField label="Email address" error={error}>
                    <Input
                        type="email"
                        placeholder="name@example.com"
                        icon={<Mail className="h-4 w-4 text-slate-400" />}
                        value={email}
                        onChange={(e) => {
                            setEmail(e.target.value);
                            setError('');
                        }}
                        className="w-full rounded-xl bg-slate-50/70 dark:bg-slate-800/40 py-2.5 text-sm"
                    />
                </FormField>

                <button
                    type="submit"
                    disabled={loading}
                    className="group flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white shadow-lg bg-gradient-to-r from-teal-500 to-emerald-600 shadow-teal-500/25 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-teal-500/35 active:translate-y-0 disabled:opacity-50 min-h-[46px]"
                >
                    {loading ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Sending link…
                        </>
                    ) : (
                        <>
                            Send Reset Link
                            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                        </>
                    )}
                </button>
            </form>
        </AuthLayout>
    );
}

export default function ForgotPasswordPage() {
    return (
        <Suspense fallback={null}>
            <ForgotPasswordContent />
        </Suspense>
    );
}
