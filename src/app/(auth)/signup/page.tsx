"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Logo } from '@/components/shared/logo';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { signUpSchema, SignUpValues } from '@/lib/validations/auth';
import { handleAuthError } from '@/lib/utils/error-handling';

function SignUpContent() {
    const [loading, setLoading] = useState(false);
    const { register, sendVerificationEmail, loginWithGoogle } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();

    const from = searchParams.get('redirect') || '/';

    const form = useForm<SignUpValues>({
        resolver: zodResolver(signUpSchema),
        defaultValues: {
            name: '',
            email: '',
            password: '',
        },
    });

    const onSubmit = async (data: SignUpValues) => {
        setLoading(true);
        try {
            await register(data.name, data.email, data.password, data.adminCode);
            await sendVerificationEmail();

            toast.success(
                'Account created! Please check your email (including spam folder) to verify your account.',
                { duration: 5000 }
            );

            // Use replace to prevent back button issues
            router.replace(from);
        } catch (error) {
            console.error('❌ Signup error:', error);
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
                    <h1 className="text-2xl font-bold text-brand-dark">Create Account</h1>
                    <p className="text-gray-500">Join Flowaddis today</p>
                </div>

                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <Input
                        label="Full Name"
                        placeholder="John Doe"
                        {...form.register('name')}
                        error={form.formState.errors.name?.message}
                    />
                    <Input
                        label="Email Address"
                        type="email"
                        placeholder="john@example.com"
                        {...form.register('email')}
                        error={form.formState.errors.email?.message}
                    />
                    <PasswordInput
                        label="Password"
                        placeholder="••••••••"
                        {...form.register('password')}
                        error={form.formState.errors.password?.message}
                    />

                    <div className="pt-2 border-t border-gray-100">
                        <Input
                            label="Admin Access Code (Optional)"
                            placeholder="Enter code to create admin account"
                            type="password"
                            {...form.register('adminCode')}
                            error={form.formState.errors.adminCode?.message}
                        />
                        <p className="text-xs text-gray-400 mt-1">Leave blank for regular user account</p>
                    </div>

                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? 'Creating Account...' : 'Sign Up'}
                    </Button>

                    <div className="relative my-4">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-200"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-white text-gray-500">Or continue with</span>
                        </div>
                    </div>

                    <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        onClick={async () => {
                            try {
                                const role = await loginWithGoogle();
                                toast.success("Successfully signed up with Google!");
                                if (role === 'admin') {
                                    router.replace('/admin');
                                } else {
                                    router.replace(from);
                                }
                            } catch (error) {
                                console.error(error);
                                handleAuthError(error);
                            }
                        }}
                    >
                        <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                            <path
                                fill="currentColor"
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            />
                            <path
                                fill="currentColor"
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            />
                            <path
                                fill="currentColor"
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                            />
                            <path
                                fill="currentColor"
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            />
                        </svg>
                        Sign up with Google
                    </Button>
                </form>

                <div className="mt-6 text-center text-sm text-gray-500">
                    Already have an account?{' '}
                    <Link href={`/signin?redirect=${encodeURIComponent(from)}`} className="text-brand-primary font-bold hover:underline">
                        Sign In
                    </Link>
                </div>
            </motion.div>
        </div>
    );
}

export default function SignUpPage() {
    return (
        <React.Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
            <SignUpContent />
        </React.Suspense>
    );
}
