"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { Suspense } from 'react';
import { useAuth } from '@/components/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CheckCircle } from 'lucide-react';
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
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || "Failed to send reset email");
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
                    <Link href="/signin" className="block">
                        <Button className="w-full bg-brand-primary hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg transition-colors">
                            Back to Sign In
                        </Button>
                    </Link>
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
                <FormField label="Email Address" error={error}>
                    <Input
                        type="email"
                        placeholder="name@company.com"
                        value={email}
                        onChange={(e) => {
                            setEmail(e.target.value);
                            setError('');
                        }}
                        className="w-full"
                    />
                </FormField>

                <Button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-brand-primary hover:bg-blue-700 text-white font-semibold py-2.5 sm:py-3 rounded-lg transition-colors"
                >
                    {loading ? 'Sending...' : 'Send Reset Link'}
                </Button>

                <div className="text-center">
                    <Link
                        href="/signin"
                        className="text-xs sm:text-sm font-medium text-gray-600 hover:text-brand-primary transition-colors"
                    >
                        ← Back to Sign In
                    </Link>
                </div>
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
