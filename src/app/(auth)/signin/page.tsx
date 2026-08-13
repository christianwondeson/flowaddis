"use client"

import type React from "react"
import type { MultiFactorResolver } from "firebase/auth"
import { Suspense, useState, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/components/providers/auth-provider"
import type { UserRole } from "@/types/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PasswordInput } from "@/components/ui/password-input"
import { toast } from "sonner"
import Link from "next/link"
import { AuthLayout } from "@/components/layout/auth-layout"
import { FormField } from "@/components/auth/form-field"
import { isMfaSignInRequiredError } from "@/lib/mfa-sign-in-error"
import { MfaSignInPanel } from "@/components/auth/mfa-sign-in-panel"
import { buildAuthContinueHref } from "@/lib/auth/post-login-path"
import { executeRecaptchaEnterprise, getRecaptchaEnterpriseSiteKey } from "@/lib/recaptcha-enterprise"
import {
    annotateRecaptchaAssessmentWithApi,
    isIncorrectPasswordAuthError,
    verifyRecaptchaEnterpriseWithApi,
} from "@/lib/recaptcha-verify-client"
import { RECAPTCHA_ACTIONS } from "@/lib/recaptcha-actions"
import { getSignInMethodsForEmail, isGoogleOnlySignIn } from "@/lib/auth/sign-in-methods"
import { Preloader } from "@/components/ui/preloader"

function SignInContent() {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [submitting, setSubmitting] = useState(false)
    const [routing, setRouting] = useState(false)
    const [recaptchaSolved, setRecaptchaSolved] = useState(false)
    const [googleOnlyAccount, setGoogleOnlyAccount] = useState(false)
    const [errors, setErrors] = useState<{ email?: string; password?: string }>({})

    const { user, loading, login, loginWithGoogle, renderRecaptcha, clearRecaptcha } = useAuth()
    const router = useRouter()
    const searchParams = useSearchParams()

    const from = searchParams.get("redirect") || searchParams.get("from") || "/"

    const [mfaResolver, setMfaResolver] = useState<MultiFactorResolver | null>(null)
    const [mfaEmail, setMfaEmail] = useState("")
    /** Prevents useEffect from overriding pushAfterLogin with stale role=user before Firestore loads */
    const skipSessionRedirectRef = useRef(false)

    const pushAfterLogin = (_role?: UserRole) => {
        skipSessionRedirectRef.current = true
        setRouting(true)
        // Resolve role + hotelPartnerStatus on /auth/continue (avoids wrong dashboard for pending hotels).
        router.replace(buildAuthContinueHref(from))
    }

    useEffect(() => {
        if (skipSessionRedirectRef.current || mfaResolver || loading || !user) return
        setRouting(true)
        router.replace(buildAuthContinueHref(from))
    }, [mfaResolver, loading, user, from, router])

    useEffect(() => {
        if (mfaResolver) return;
        let cancelled = false;
        setRecaptchaSolved(false);
        void renderRecaptcha('recaptcha-container', 'normal', () => {
            if (!cancelled) setRecaptchaSolved(true);
        });

        return () => {
            cancelled = true;
            // Only clear on real unmount / MFA switch  avoids wiping the widget
            // when auth finishes initializing (renderRecaptcha identity changes).
            clearRecaptcha();
            setRecaptchaSolved(false);
        };
        // Intentionally omit renderRecaptcha from deps: it changes when Firebase
        // auth hydrates and was clearing the checkbox in normal browser sessions.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mfaResolver, clearRecaptcha]);

    const refreshSignInMethods = async (value: string) => {
        if (!value.includes("@")) {
            setGoogleOnlyAccount(false)
            return
        }
        const methods = await getSignInMethodsForEmail(value)
        setGoogleOnlyAccount(isGoogleOnlySignIn(methods))
    }

    const validateForm = () => {
        const newErrors: typeof errors = {}
        if (!email) newErrors.email = "Email is required"
        if (!email.includes("@")) newErrors.email = "Please enter a valid email"
        if (!password) newErrors.password = "Password is required"
        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!validateForm()) return

        const methods = await getSignInMethodsForEmail(email)
        if (isGoogleOnlySignIn(methods)) {
            setGoogleOnlyAccount(true)
            toast.error("This account uses Google Sign-In. Use the Google button below  your Gmail password does not sign in here.")
            return
        }

        if (!recaptchaSolved) {
            toast.error("Please verify that you are not a robot.")
            return
        }

        if (getRecaptchaEnterpriseSiteKey()) {
            let enterpriseToken: string | undefined
            try {
                enterpriseToken = await executeRecaptchaEnterprise(RECAPTCHA_ACTIONS.LOGIN)
            } catch (err) {
                console.error("[signin] reCAPTCHA Enterprise execute failed", err)
                toast.error(
                    "Security verification failed. Use your BookAddis site key in .env (not the Identity Platform key). Refresh and try again.",
                )
                return
            }
            if (!enterpriseToken) {
                toast.error("Security verification failed. Refresh the page and try again.")
                return
            }
            const accountId = email.trim().toLowerCase()
            const verified = await verifyRecaptchaEnterpriseWithApi(
                enterpriseToken,
                RECAPTCHA_ACTIONS.LOGIN,
                { email: accountId, accountId },
            )
            if (!verified.ok) {
                console.error("[signin] reCAPTCHA verify API rejected", verified)
                const reason = verified.reason || "Verification failed. Please try again."
                const lowScore = /score below threshold/i.test(reason)
                toast.error(
                    lowScore
                        ? "Google scored this sign-in as risky (extensions, VPN, or automation). Disable ad blockers, try a normal window or Incognito, then retry."
                        : reason,
                )
                return
            }
        }

        const accountId = email.trim().toLowerCase()
        setSubmitting(true)
        try {
            const role = await login(email, password)
            void annotateRecaptchaAssessmentWithApi({
                annotation: "LEGITIMATE",
                reasons: ["CORRECT_PASSWORD"],
                accountId,
                clearStored: true,
            })
            pushAfterLogin(role)
        } catch (error: unknown) {
            if (isMfaSignInRequiredError(error)) {
                void annotateRecaptchaAssessmentWithApi({
                    reasons: ["CORRECT_PASSWORD"],
                    accountId,
                    clearStored: false,
                })
                setMfaEmail(email)
                setMfaResolver(error.resolver)
                return
            }
            if (isIncorrectPasswordAuthError(error)) {
                void annotateRecaptchaAssessmentWithApi({
                    reasons: ["INCORRECT_PASSWORD"],
                    accountId,
                    clearStored: true,
                })
            }
            const message = error instanceof Error ? error.message : "An unexpected error occurred during sign-in."
            toast.error(message)
        } finally {
            setSubmitting(false)
        }
    }

    const handleGoogleSignIn = async () => {
        setSubmitting(true)
        try {
            // Google OAuth uses Firebase signInWithPopup  no Enterprise execute needed.
            // A separate action (e.g. google_signin) is rejected by policy-based reCAPTCHA keys.
            const role = await loginWithGoogle()
            pushAfterLogin(role)
        } catch (error: unknown) {
            if (isMfaSignInRequiredError(error)) {
                setMfaEmail("")
                setMfaResolver(error.resolver)
                return
            }
            const message = error instanceof Error ? error.message : "An unexpected error occurred during sign-in."
            toast.error(message)
        } finally {
            setSubmitting(false)
        }
    }

    // Auth bootstrap, post-login navigation, or already-signed-in redirect
    if (loading || routing || (user && !mfaResolver)) {
        return (
            <Preloader
                fullScreen
                size="lg"
                label={
                    loading
                        ? "Checking your session…"
                        : routing
                          ? "Opening your account…"
                          : "Signing you in…"
                }
            />
        )
    }

    if (mfaResolver) {
        return (
            <AuthLayout title="Two-step verification" subtitle="Complete sign-in with your phone">
                <MfaSignInPanel
                    resolver={mfaResolver}
                    loginEmail={mfaEmail || undefined}
                    onSuccess={() => {
                        void annotateRecaptchaAssessmentWithApi({
                            annotation: "LEGITIMATE",
                            reasons: ["PASSED_TWO_FACTOR"],
                            accountId: mfaEmail.trim().toLowerCase() || undefined,
                            clearStored: true,
                        })
                        setMfaResolver(null);
                        pushAfterLogin();
                    }}
                    onCancel={() => setMfaResolver(null)}
                />
            </AuthLayout>
        );
    }

    return (
        <AuthLayout
            title="Welcome Back"
            subtitle="Sign in to your account to continue"
            footerLink={{
                text: "Don't have an account?",
                href: "/signup",
                linkText: "Sign Up",
            }}
        >
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
                {/* Email Field */}
                <FormField label="Email Address" error={errors.email}>
                    <Input
                        type="email"
                        placeholder="name@company.com"
                        value={email}
                        onChange={(e) => {
                            setEmail(e.target.value)
                            setErrors({ ...errors, email: "" })
                            setGoogleOnlyAccount(false)
                        }}
                        onBlur={(e) => void refreshSignInMethods(e.target.value)}
                        className="w-full"
                    />
                </FormField>

                {googleOnlyAccount && (
                    <p
                        role="status"
                        className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-900"
                    >
                        This email is registered with <strong>Google Sign-In</strong>. Use the Google button
                        below. Your Gmail password is not stored in BookAddis and cannot be used on this form.
                    </p>
                )}

                {/* Password Field */}
                <FormField label="Password" error={errors.password}>
                    <PasswordInput
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => {
                            setPassword(e.target.value)
                            setErrors({ ...errors, password: "" })
                        }}
                        className="w-full"
                    />
                </FormField>

                {/* Forgot Password Link */}
                <div className="flex justify-end">
                    <Link
                        href={`/forgot-password?redirect=${encodeURIComponent(from)}`}
                        className="text-xs sm:text-sm font-medium text-brand-primary hover:text-teal-700 transition-colors"
                    >
                        Forgot password?
                    </Link>
                </div>

                {/* Visible reCAPTCHA container */}
                <div id="recaptcha-container" className="flex justify-center my-4 overflow-hidden rounded-lg min-h-[78px]"></div>

                {/* Sign In Button */}
                <Button
                    type="submit"
                    disabled={submitting || !recaptchaSolved}
                    className="w-full bg-brand-primary hover:bg-teal-700 text-white font-semibold py-2.5 sm:py-3 rounded-2xl transition-all duration-300 disabled:opacity-50 min-h-[48px]"
                >
                    {submitting ? "Signing in..." : "Sign In"}
                </Button>

                {/* Divider */}
                <div className="relative my-6 sm:my-8">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-200"></div>
                    </div>
                    <div className="relative flex justify-center text-xs sm:text-sm">
                        <span className="px-2 bg-white text-gray-600 font-medium">Or continue with</span>
                    </div>
                </div>

                {/* Google Sign In */}
                <Button
                    type="button"
                    variant="outline"
                    disabled={submitting}
                    className="w-full py-2.5 sm:py-3 flex items-center justify-center gap-2.5 border border-gray-300 hover:bg-gray-50 transition-colors text-gray-700 font-medium bg-transparent"
                    onClick={handleGoogleSignIn}
                >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1c-4.3 0-8.01 2.47-9.82 6.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    <span>Google</span>
                </Button>
            </form>
        </AuthLayout>
    )
}

export default function SignInPage() {
    return (
        <Suspense
            fallback={
                <Preloader fullScreen size="lg" label="Loading…" />
            }
        >
            <SignInContent />
        </Suspense>
    )
}
