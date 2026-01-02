"use client";

import React, { Suspense, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Logo } from '@/components/shared/logo';
import { motion } from 'framer-motion';
import { Mail, ArrowRight, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { signInSchema, SignInValues } from '@/lib/validations/auth';
import { handleAuthError } from '@/lib/utils/error-handling';

function SignInContent() {
    const [loading, setLoading] = useState(false);
    const [magicLinkSent, setMagicLinkSent] = useState(false);
    const [authMethod, setAuthMethod] = useState<'password' | 'magic'>('password');
    const [shouldRedirect, setShouldRedirect] = useState(false);

    const { user, loading: authLoading, login, sendMagicLink, loginWithGoogle } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();

    const from = searchParams.get('redirect') || searchParams.get('from') || '/';

    // Handle redirect after successful authentication
    useEffect(() => {
        if (user && !authLoading && shouldRedirect) {
            // Use replace to prevent back button issues
            router.replace(from);
            setShouldRedirect(false);
        }
    }, [user, authLoading, shouldRedirect, from, router]);

    const form = useForm<SignInValues>({
        resolver: zodResolver(signInSchema),
        defaultValues: {
            email: '',
            password: '',
        },
    });

    const onSubmit = async (data: SignInValues) => {
        setLoading(true);
        try {
            if (authMethod === 'password') {
                const role = await login(data.email, data.password);
                toast.success("Successfully signed in!");

                // Set flag to trigger redirect in useEffect
                if (role === 'admin') {
                    router.replace('/admin');
                } else {
                    setShouldRedirect(true);
                }
            } else {
                await sendMagicLink(data.email);
                window.localStorage.setItem('emailForSignIn', data.email);
                toast.success("Magic Link Sent! Check your email.");
                setMagicLinkSent(true);
            }
        } catch (error) {
            console.error("Error during sign-in:", error);
            handleAuthError(error);
        } finally {
            setLoading(false);
        }
    };

    const handleMagicLinkSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const email = form.getValues('email');
        const result = await form.trigger('email');

        if (!result) return;

        setLoading(true);
        try {
            await sendMagicLink(email);
            window.localStorage.setItem('emailForSignIn', email);
            toast.success("Magic Link Sent! Check your email.");
            setMagicLinkSent(true);
        } catch (error: any) {
            console.error("Error during magic link sending:", error);
            handleAuthError(error);
        } finally {
            setLoading(false);
        }
    }

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
                    <h1 className="text-2xl font-bold text-brand-dark">Welcome Back</h1>
                    <p className="text-gray-500">Sign in to continue to Flowaddis</p>
                </div>

                {magicLinkSent ? (
                    <div className="text-center space-y-4 py-8">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto text-green-500">
                            <CheckCircle className="w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-bold text-brand-dark">Check your email</h3>
                        <p className="text-gray-500">
                            We sent a magic link to <span className="font-bold text-brand-dark">{form.getValues('email')}</span>.
                            <br />Click the link to sign in.
                        </p>
                        <p className="text-xs text-gray-400 mt-4">
                            (Note: This is a demo. In production, this would send a real email from info@flowaddis.com)
                        </p>
                        <Button variant="outline" onClick={() => setMagicLinkSent(false)} className="mt-4">
                            Back to Sign In
                        </Button>
                    </div>
                ) : (
                    <form onSubmit={authMethod === 'password' ? form.handleSubmit(onSubmit) : handleMagicLinkSubmit} className="space-y-6">
                        {/* Auth Method Toggle */}
                        <div className="flex p-1 bg-gray-100 rounded-xl">
                            <button
                                type="button"
                                onClick={() => {
                                    setAuthMethod('password');
                                    form.clearErrors();
                                }}
                                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${authMethod === 'password' ? 'bg-white shadow text-brand-primary' : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                Password
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setAuthMethod('magic');
                                    form.clearErrors();
                                }}
                                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${authMethod === 'magic' ? 'bg-white shadow text-brand-primary' : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                Magic Link
                            </button>
                        </div>

                        <Input
                            label="Email Address"
                            type="email"
                            placeholder="name@company.com"
                            {...form.register('email')}
                            error={form.formState.errors.email?.message}
                            icon={<Mail className="w-4 h-4" />}
                        />

                        {authMethod === 'password' && (
                            <div className="space-y-1">
                                <PasswordInput
                                    label="Password"
                                    placeholder="••••••••"
                                    {...form.register('password')}
                                    error={form.formState.errors.password?.message}
                                />
                                <div className="flex justify-end">
                                    <Link
                                        href="/forgot-password"
                                        className="text-sm font-medium text-brand-primary hover:underline"
                                    >
                                        Forgot Password?
                                    </Link>
                                </div>
                            </div>
                        )}

                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? 'Processing...' : authMethod === 'password' ? 'Sign In' : 'Send Magic Link'}
                            {!loading && authMethod === 'magic' && <ArrowRight className="w-4 h-4 ml-2" />}
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
                                    toast.success("Successfully signed in with Google!");
                                    if (role === 'admin') {
                                        router.replace('/admin');
                                    } else {
                                        setShouldRedirect(true);
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
                            Sign in with Google
                        </Button>
                    </form>
                )}

                {!magicLinkSent && (
                    <div className="mt-6 text-center text-sm text-gray-500">
                        Don't have an account?{' '}
                        <Link href={`/signup?redirect=${encodeURIComponent(from)}`} className="text-brand-primary font-bold hover:underline">
                            Sign Up
                        </Link>
                    </div>
                )}
            </motion.div>
        </div>
    );
}

export default function SignInPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading…</div>}>
            <SignInContent />
        </Suspense>
    );
}
