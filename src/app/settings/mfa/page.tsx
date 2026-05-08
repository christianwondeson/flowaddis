'use client';

import Link from 'next/link';
import { useAuth } from '@/components/providers/auth-provider';
import { auth } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Loader2, Shield } from 'lucide-react';
import { multiFactor, PhoneMultiFactorGenerator } from 'firebase/auth';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

export default function MfaSettingsPage() {
    const {
        user,
        loading,
        reauthenticateForMfaEnrollment,
        sendMfaEnrollmentSms,
        completeMfaEnrollment,
        renderRecaptcha,
        clearRecaptcha,
    } = useAuth();

    const [password, setPassword] = useState('');
    const [phone, setPhone] = useState('');
    const [verificationId, setVerificationId] = useState<string | null>(null);
    const [smsCode, setSmsCode] = useState('');
    const [step, setStep] = useState<'reauth' | 'phone' | 'code'>('reauth');
    const [busy, setBusy] = useState(false);
    const [recaptchaReady, setRecaptchaReady] = useState(false);

    const hasPasswordProvider = useMemo(() => {
        const u = auth?.currentUser;
        return u?.providerData.some((p) => p.providerId === 'password') ?? false;
    }, [user?.id, loading]);

    const enrolledSms = useMemo(() => {
        const u = auth?.currentUser;
        if (!u) return 0;
        return multiFactor(u).enrolledFactors.filter(
            (f) => f.factorId === PhoneMultiFactorGenerator.FACTOR_ID,
        ).length;
    }, [user?.id, loading]);

    useEffect(() => {
        if (step !== 'phone') return;
        let cancelled = false;
        void (async () => {
            try {
                await renderRecaptcha('mfa-enroll-recaptcha', 'normal', () => {
                    if (!cancelled) setRecaptchaReady(true);
                });
            } catch {
                /* ignore */
            }
        })();
        return () => {
            cancelled = true;
            clearRecaptcha();
        };
    }, [step, renderRecaptcha, clearRecaptcha]);

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center pt-20">
                <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
            </div>
        );
    }

    if (!user) {
        return (
            <div className="container mx-auto max-w-lg px-4 py-24 text-center">
                <p className="mb-4 text-lg">Sign in to manage two-factor authentication.</p>
                <Button asChild>
                    <Link href="/signin">Sign in</Link>
                </Button>
            </div>
        );
    }

    if (!user.emailVerified) {
        return (
            <div className="container mx-auto max-w-lg px-4 py-16">
                <Button variant="ghost" size="sm" asChild className="mb-6">
                    <Link href="/settings" className="inline-flex items-center gap-2">
                        <ArrowLeft className="h-4 w-4" />
                        Back
                    </Link>
                </Button>
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-950">
                    <h1 className="flex items-center gap-2 text-xl font-semibold">
                        <Shield className="h-6 w-6" />
                        Verify your email first
                    </h1>
                    <p className="mt-2 text-sm">
                        SMS two-factor authentication requires a verified email (Firebase requirement). Check your inbox
                        for a verification link.
                    </p>
                </div>
            </div>
        );
    }

    if (enrolledSms > 0) {
        return (
            <div className="container mx-auto max-w-lg px-4 py-16">
                <Button variant="ghost" size="sm" asChild className="mb-6">
                    <Link href="/settings" className="inline-flex items-center gap-2">
                        <ArrowLeft className="h-4 w-4" />
                        Back
                    </Link>
                </Button>
                <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900">
                    <h1 className="text-xl font-semibold text-foreground">SMS two-factor is enabled</h1>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                        To change or remove factors, use the Firebase-supported account recovery flows or contact
                        support.
                    </p>
                </div>
            </div>
        );
    }

    const onReauth = async () => {
        setBusy(true);
        try {
            await reauthenticateForMfaEnrollment(hasPasswordProvider ? password : undefined);
            setStep('phone');
            setPassword('');
            toast.success('Confirmed. Add your mobile number below.');
        } catch (e) {
            toast.error(e instanceof Error ? e.message : 'Could not verify');
        } finally {
            setBusy(false);
        }
    };

    const onSendSms = async () => {
        if (!phone.trim().startsWith('+')) {
            toast.error('Use international format with country code (e.g. +2519XXXXXXXX).');
            return;
        }
        if (!window.recaptchaVerifier) {
            toast.error('Security check not ready.');
            return;
        }
        setBusy(true);
        try {
            const vid = await sendMfaEnrollmentSms(phone.trim(), window.recaptchaVerifier);
            setVerificationId(vid);
            setStep('code');
            toast.success('SMS sent. Enter the code below.');
        } catch (e) {
            toast.error(e instanceof Error ? e.message : 'Could not send SMS');
            clearRecaptcha();
            void renderRecaptcha('mfa-enroll-recaptcha', 'normal', () => setRecaptchaReady(true));
        } finally {
            setBusy(false);
        }
    };

    const onEnroll = async () => {
        if (!verificationId) return;
        setBusy(true);
        try {
            await completeMfaEnrollment(verificationId, smsCode, 'Mobile phone');
            setStep('reauth');
        } catch (e) {
            toast.error(e instanceof Error ? e.message : 'Enrollment failed');
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="min-h-screen bg-brand-gray/30 pb-16 pt-20 dark:bg-background md:pt-24">
            <div className="container mx-auto max-w-lg px-4">
                <Button variant="ghost" size="sm" asChild className="mb-6">
                    <Link href="/settings" className="inline-flex items-center gap-2">
                        <ArrowLeft className="h-4 w-4" />
                        Back
                    </Link>
                </Button>

                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                    <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
                        <Shield className="h-7 w-7 text-brand-primary" />
                        SMS two-factor authentication
                    </h1>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                        Add a phone number to receive a code when you sign in (Firebase Identity Platform — SMS).
                    </p>

                    {step === 'reauth' ? (
                        <div className="mt-6 space-y-4">
                            {hasPasswordProvider ? (
                                <>
                                    <Label htmlFor="mfa-pw">Current password</Label>
                                    <Input
                                        id="mfa-pw"
                                        type="password"
                                        autoComplete="current-password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                    <Button className="w-full" disabled={busy} onClick={() => void onReauth()}>
                                        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Continue'}
                                    </Button>
                                </>
                            ) : (
                                <Button className="w-full" disabled={busy} onClick={() => void onReauth()}>
                                    {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Continue with Google'}
                                </Button>
                            )}
                        </div>
                    ) : null}

                    {step === 'phone' ? (
                        <div className="mt-6 space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="mfa-phone">Mobile (E.164)</Label>
                                <Input
                                    id="mfa-phone"
                                    placeholder="+251911234567"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                />
                            </div>
                            <div
                                id="mfa-enroll-recaptcha"
                                className="flex min-h-[78px] justify-center overflow-hidden rounded-lg"
                            />
                            <Button
                                className="w-full"
                                disabled={busy || !recaptchaReady}
                                onClick={() => void onSendSms()}
                            >
                                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Send verification code'}
                            </Button>
                        </div>
                    ) : null}

                    {step === 'code' ? (
                        <div className="mt-6 space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="mfa-sms">SMS code</Label>
                                <Input
                                    id="mfa-sms"
                                    inputMode="numeric"
                                    value={smsCode}
                                    onChange={(e) => setSmsCode(e.target.value.replace(/\D/g, '').slice(0, 8))}
                                />
                            </div>
                            <Button className="w-full" disabled={busy} onClick={() => void onEnroll()}>
                                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Enable SMS 2FA'}
                            </Button>
                        </div>
                    ) : null}
                </div>
            </div>
        </div>
    );
}
