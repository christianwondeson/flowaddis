'use client';

import type { MultiFactorResolver } from 'firebase/auth';
import { PhoneMultiFactorGenerator, signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useAuth } from '@/components/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useEffect, useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
import type { UserRole } from '@/types/auth';

type Props = {
    resolver: MultiFactorResolver;
    /** Email from email/password sign-in (optional for Google-first MFA). */
    loginEmail?: string;
    onSuccess: (role: UserRole) => void;
    onCancel: () => void;
};

/**
 * Second step: SMS code after Firebase returns auth/multi-factor-auth-required (Identity Platform).
 */
export function MfaSignInPanel({ resolver, loginEmail, onSuccess, onCancel }: Props) {
    const { sendSmsForMfaSignIn, completeSmsMfaSignIn, renderRecaptcha, clearRecaptcha } = useAuth();

    const smsHints = useMemo(
        () =>
            resolver.hints
                .map((h, index) => ({ h, index }))
                .filter(({ h }) => h.factorId === PhoneMultiFactorGenerator.FACTOR_ID),
        [resolver],
    );

    const [hintIdx, setHintIdx] = useState(0);
    const [verificationId, setVerificationId] = useState<string | null>(null);
    const [smsCode, setSmsCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [recaptchaReady, setRecaptchaReady] = useState(false);

    useEffect(() => {
        let cancelled = false;
        void (async () => {
            try {
                await renderRecaptcha('mfa-signin-recaptcha', 'normal', () => {
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
    }, [renderRecaptcha, clearRecaptcha]);

    const selectedResolverIndex = smsHints[hintIdx]?.index ?? 0;

    const handleSendSms = async () => {
        if (!auth || !window.recaptchaVerifier) {
            alert('Security check not ready. Refresh the page.');
            return;
        }
        setLoading(true);
        try {
            const vid = await sendSmsForMfaSignIn(
                resolver,
                selectedResolverIndex,
                window.recaptchaVerifier,
            );
            setVerificationId(vid);
        } catch (e) {
            alert(e instanceof Error ? e.message : 'Could not send SMS');
            clearRecaptcha();
            void renderRecaptcha('mfa-signin-recaptcha', 'normal', () => setRecaptchaReady(true));
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async () => {
        if (!verificationId || !smsCode.trim()) return;
        setLoading(true);
        try {
            const role = await completeSmsMfaSignIn(
                resolver,
                verificationId,
                smsCode,
                loginEmail,
            );
            onSuccess(role);
        } catch (e) {
            alert(e instanceof Error ? e.message : 'Verification failed');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = async () => {
        try {
            if (auth) await signOut(auth);
        } catch {
            /* ignore */
        }
        onCancel();
    };

    if (smsHints.length === 0) {
        return (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                This account uses an MFA method we don&apos;t support in this screen yet. Use another sign-in method
                or contact support.
                <Button type="button" variant="outline" className="mt-3" onClick={() => void handleCancel()}>
                    Back
                </Button>
            </div>
        );
    }

    const masked =
        (resolver.hints[selectedResolverIndex] as { phoneNumber?: string })?.phoneNumber ?? 'your phone';

    return (
        <div className="space-y-5 rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <div>
                <h2 className="text-lg font-semibold text-foreground">Two-step verification</h2>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                    Enter the code sent to <span className="font-medium">{masked}</span>, or request a new SMS.
                </p>
            </div>

            {smsHints.length > 1 ? (
                <div className="space-y-2">
                    <Label>Verification method</Label>
                    <select
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800"
                        value={hintIdx}
                        onChange={(e) => {
                            setHintIdx(Number(e.target.value));
                            setVerificationId(null);
                            setSmsCode('');
                        }}
                    >
                        {smsHints.map(({ h }, i) => (
                            <option key={i} value={i}>
                                {(h as { displayName?: string }).displayName || 'Phone'} —{' '}
                                {(h as { phoneNumber?: string }).phoneNumber}
                            </option>
                        ))}
                    </select>
                </div>
            ) : null}

            <div id="mfa-signin-recaptcha" className="flex min-h-[78px] justify-center overflow-hidden rounded-lg" />

            {!verificationId ? (
                <Button
                    type="button"
                    className="w-full"
                    disabled={loading || !recaptchaReady}
                    onClick={() => void handleSendSms()}
                >
                    {loading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Sending…
                        </>
                    ) : (
                        'Send SMS code'
                    )}
                </Button>
            ) : (
                <>
                    <div className="space-y-2">
                        <Label htmlFor="mfa-code">6-digit code</Label>
                        <Input
                            id="mfa-code"
                            inputMode="numeric"
                            autoComplete="one-time-code"
                            value={smsCode}
                            onChange={(e) => setSmsCode(e.target.value.replace(/\D/g, '').slice(0, 8))}
                            placeholder="••••••"
                        />
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row">
                        <Button type="button" className="flex-1" disabled={loading} onClick={() => void handleVerify()}>
                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Verify & sign in'}
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            disabled={loading}
                            onClick={() => void handleSendSms()}
                        >
                            Resend SMS
                        </Button>
                    </div>
                </>
            )}

            <Button type="button" variant="ghost" className="w-full text-slate-600" onClick={() => void handleCancel()}>
                Cancel and use different account
            </Button>
        </div>
    );
}
