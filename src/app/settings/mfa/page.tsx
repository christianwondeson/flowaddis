'use client';

import Link from 'next/link';
import { useAuth } from '@/components/providers/auth-provider';
import { auth } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Loader2, Mail, Shield } from 'lucide-react';
import { multiFactor, PhoneMultiFactorGenerator, reload } from 'firebase/auth';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

export default function MfaSettingsPage() {
    const {
        user,
        loading,
        sendVerificationEmail,
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
    const [emailVerifiedLocal, setEmailVerifiedLocal] = useState(false);

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
    }, [user?.id, loading, emailVerifiedLocal]);

    useEffect(() => {
        setEmailVerifiedLocal(Boolean(user?.emailVerified || auth?.currentUser?.emailVerified));
    }, [user?.emailVerified, user?.id]);

    useEffect(() => {
        // Prefill from profile phone when entering the phone step
        if (step === 'phone' && !phone && user?.phone) {
            const p = String(user.phone).trim();
            if (p.startsWith('+')) setPhone(p);
        }
    }, [step, phone, user?.phone]);

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

    const refreshEmailVerified = async () => {
        if (!auth?.currentUser) return;
        setBusy(true);
        try {
            await reload(auth.currentUser);
            const ok = auth.currentUser.emailVerified;
            setEmailVerifiedLocal(ok);
            if (ok) {
                toast.success('Email verified  you can set up SMS 2FA now.');
            } else {
                toast.message(
                    'Still not verified. Open the link in the email from Firebase, then click again.',
                );
            }
        } catch (e) {
            toast.error(e instanceof Error ? e.message : 'Could not refresh status');
        } finally {
            setBusy(false);
        }
    };

    const resendVerification = async () => {
        setBusy(true);
        try {
            await sendVerificationEmail();
            toast.success(
                'Verification email sent. Check inbox and spam for Firebase / BookAddis.',
            );
        } catch (e) {
            toast.error(e instanceof Error ? e.message : 'Could not send email');
        } finally {
            setBusy(false);
        }
    };

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

    if (!emailVerifiedLocal) {
        return (
            <div className="container mx-auto max-w-lg px-4 py-16">
                <Button variant="ghost" size="sm" asChild className="mb-6">
                    <Link href="/settings" className="inline-flex items-center gap-2">
                        <ArrowLeft className="h-4 w-4" />
                        Back
                    </Link>
                </Button>
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-950 space-y-4">
                    <h1 className="flex items-center gap-2 text-xl font-semibold">
                        <Shield className="h-6 w-6" />
                        Verify your email first
                    </h1>
                    <p className="text-sm">
                        Firebase blocks SMS 2FA until the account email is verified. This is separate
                        from the phone number stored on your profile document.
                    </p>
                    <p className="text-sm font-medium">
                        Signed in as {user.email || 'your account'}
                    </p>
                    <ol className="list-decimal pl-5 text-sm space-y-1.5">
                        <li>Click <strong>Send verification email</strong> below.</li>
                        <li>
                            Open the message from Firebase (check Spam / Promotions). Subject is
                            usually “Verify your email”.
                        </li>
                        <li>Click the link in that email.</li>
                        <li>Return here and click <strong>I verified  refresh</strong>.</li>
                    </ol>
                    <div className="flex flex-col sm:flex-row gap-2 pt-2">
                        <Button
                            type="button"
                            disabled={busy}
                            onClick={() => void resendVerification()}
                            className="gap-2"
                        >
                            {busy ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Mail className="h-4 w-4" />
                            )}
                            Send verification email
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            disabled={busy}
                            onClick={() => void refreshEmailVerified()}
                        >
                            I verified  refresh
                        </Button>
                    </div>
                    <p className="text-xs text-amber-900/80">
                        No email? In Firebase Console → Authentication → Templates, confirm the
                        “Email address verification” template is enabled. Also check the address is
                        correct and not blocked by your provider.
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
                        Next sign-in will ask for an SMS code after password/Google.
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
            toast.error('Security check not ready  wait for reCAPTCHA, then retry.');
            return;
        }
        setBusy(true);
        toast.message('Sending SMS via Firebase… (can take up to ~45s)');
        try {
            const vid = await sendMfaEnrollmentSms(phone.trim(), window.recaptchaVerifier);
            setVerificationId(vid);
            setStep('code');
            toast.success('SMS sent. Enter the code below.');
        } catch (e) {
            const msg = e instanceof Error ? e.message : 'Could not send SMS';
            console.error('[mfa-enroll] send SMS failed', e);
            toast.error(msg, { duration: 12_000 });
            clearRecaptcha();
            setRecaptchaReady(false);
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
                        After password/Google, Firebase will SMS a code to this number. Profile phone
                        in Firestore is not used for 2FA  you enroll it here.
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
                                <p className="text-xs text-slate-500">
                                    Ethiopia numbers must start with +251 (no leading 0 after country
                                    code).
                                </p>
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
                                <Label htmlFor="mfa-sms">6-digit SMS code</Label>
                                <Input
                                    id="mfa-sms"
                                    inputMode="numeric"
                                    autoComplete="one-time-code"
                                    maxLength={6}
                                    value={smsCode}
                                    onChange={(e) => setSmsCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    placeholder="000000"
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
