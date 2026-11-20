"use client"

import type React from "react"
import type { MultiFactorResolver } from "firebase/auth"
import { Suspense, useState, useEffect, useRef, useCallback } from "react"
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
import { buildAuthContinueHref, getPostAuthPath } from "@/lib/auth/post-login-path"
import { Mail, Lock, ArrowRight, Loader2 } from "lucide-react"
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
    const [recaptchaError, setRecaptchaError] = useState<string | null>(null)
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

    const pushAfterLogin = (resolvedRole?: UserRole) => {
        skipSessionRedirectRef.current = true
        setRouting(true)
        const targetRole = resolvedRole || user?.role || "user"
        const partnerStatus = user?.hotelPartnerStatus
        const dest = getPostAuthPath({ role: targetRole, hotelPartnerStatus: partnerStatus }, from)
        router.replace(dest)
    }

    useEffect(() => {
        if (skipSessionRedirectRef.current || mfaResolver || loading || !user) return
        setRouting(true)
        const dest = getPostAuthPath(user, from)
        router.replace(dest)
    }, [mfaResolver, loading, user, from, router])

    const initRecaptcha = useCallback(() => {
        if (mfaResolver) return
        setRecaptchaError(null)
        setRecaptchaSolved(false)
        renderRecaptcha('recaptcha-container', 'normal', () => {
            setRecaptchaSolved(true)
            setRecaptchaError(null)
        })?.catch((err: unknown) => {
            console.warn('[signin] reCAPTCHA render failed:', err)
            setRecaptchaError(
                'Security verification failed to load (network or domain error). Please retry.',
            )
        })
    }, [mfaResolver, renderRecaptcha])

    useEffect(() => {
        initRecaptcha()

        return () => {
            clearRecaptcha()
            setRecaptchaSolved(false)
        }
        // Intentionally omit renderRecaptcha from deps: it changes when Firebase
        // auth hydrates and was clearing the checkbox in normal browser sessions.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mfaResolver, clearRecaptcha])

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

    // If user is already authenticated with an established session, redirect seamlessly
    if (user && !mfaResolver && !submitting) {
        return (
            <Preloader
                fullScreen
                size="lg"
                label="Redirecting to your account…"
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
            <form onSubmit={handleSubmit} className="space-y-3.5 sm:space-y-4">
                {/* Email Field */}
                <FormField label="Email address" error={errors.email}>
                    <Input
                        type="email"
                        placeholder="name@example.com"
                        icon={<Mail className="h-4 w-4 text-slate-400" />}
                        value={email}
                        onChange={(e) => {
                            setEmail(e.target.value)
                            setErrors({ ...errors, email: "" })
                            setGoogleOnlyAccount(false)
                        }}
                        onBlur={(e) => void refreshSignInMethods(e.target.value)}
                        className="w-full rounded-xl bg-slate-50/70 dark:bg-slate-800/40 h-11 sm:h-12 px-3 sm:px-3.5 text-sm sm:text-base"
                    />
                </FormField>

                {googleOnlyAccount && (
                    <p
                        role="status"
                        className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs sm:text-sm text-amber-900"
                    >
                        This email is registered with <strong>Google Sign-In</strong>. Use the Google button
                        below. Your Gmail password is not stored in BookAddis and cannot be used on this form.
                    </p>
                )}

                {/* Password Field */}
                <FormField label="Password" error={errors.password}>
                    <PasswordInput
                        placeholder="Enter your password"
                        icon={<Lock className="h-4 w-4 text-slate-400" />}
                        value={password}
                        onChange={(e) => {
                            setPassword(e.target.value)
                            setErrors({ ...errors, password: "" })
                        }}
                        className="w-full rounded-xl bg-slate-50/70 dark:bg-slate-800/40 h-11 sm:h-12 px-3 sm:px-3.5 text-sm sm:text-base"
                    />
                </FormField>

                {/* Forgot Password Link */}
                <div className="flex justify-end">
                    <Link
                        href={`/forgot-password?redirect=${encodeURIComponent(from)}`}
                        className="py-0.5 text-xs sm:text-sm font-semibold text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300 transition-colors"
                    >
                        Forgot password?
                    </Link>
                </div>

                {/* Visible reCAPTCHA container */}
                <div id="recaptcha-container" className="flex justify-center my-1.5 sm:my-2 overflow-hidden rounded-lg min-h-[78px]"></div>

                {recaptchaError && (
                    <div className="flex flex-col items-center gap-2 p-3 my-1.5 sm:my-2 text-xs rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-200">
                        <p className="text-center font-medium">{recaptchaError}</p>
                        <button
                            type="button"
                            onClick={() => initRecaptcha()}
                            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-medium transition-colors shadow-sm"
                        >
                            Retry Verification
                        </button>
                    </div>
                )}

                {/* Sign In Button */}
                <button
                    type="submit"
                    disabled={submitting || !recaptchaSolved}
                    className="group flex w-full items-center justify-center gap-2 rounded-xl h-11 sm:h-12 min-h-[46px] sm:min-h-[48px] text-sm sm:text-base font-bold text-white shadow-lg bg-gradient-to-r from-teal-500 to-emerald-600 shadow-teal-500/25 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-teal-500/35 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                >
                    {submitting ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Signing in…
                        </>
                    ) : (
                        <>
                            <span>Sign in</span>
                            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                        </>
                    )}
                </button>

                {/* Divider */}
                <div className="relative my-4 sm:my-5">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-slate-200 dark:border-slate-800"></div>
                    </div>
                    <div className="relative flex justify-center text-xs">
                        <span className="px-3 bg-white dark:bg-slate-900 text-slate-400 font-medium">Or continue with</span>
                    </div>
                </div>

                {/* Google Sign In */}
                <button
                    type="button"
                    disabled={submitting}
                    className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 h-11 sm:h-12 min-h-[44px] sm:min-h-[48px] text-sm sm:text-base font-semibold text-slate-700 dark:text-slate-200 shadow-sm transition-all duration-200 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 disabled:opacity-50"
                    onClick={handleGoogleSignIn}
                >
                    <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1c-4.3 0-8.01 2.47-9.82 6.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    <span>Google</span>
                </button>
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
