"use client"

import type React from "react"
import { Suspense, useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/components/providers/auth-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PasswordInput } from "@/components/ui/password-input"
import { toast } from "sonner"
import Link from "next/link"
import { AuthLayout } from "@/components/layout/auth-layout"
import { FormField } from "@/components/auth/form-field"

function SignInContent() {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [loading, setLoading] = useState(false)
    const [recaptchaSolved, setRecaptchaSolved] = useState(false)
    const [errors, setErrors] = useState<{ email?: string; password?: string }>({})

    const { login, loginWithGoogle, renderRecaptcha, clearRecaptcha } = useAuth()
    const router = useRouter()
    const searchParams = useSearchParams()

    const from = searchParams.get("redirect") || searchParams.get("from") || "/"

    useEffect(() => {
        // Render visible reCAPTCHA for Email mode
        // Note: We don't include recaptchaSolved in dependencies to avoid re-rendering/clearing when solved
        if (!recaptchaSolved) {
            renderRecaptcha('recaptcha-container', 'normal', () => {
                setRecaptchaSolved(true);
            });
        }

        // Cleanup on unmount
        return () => {
            clearRecaptcha();
        };
    }, [renderRecaptcha, clearRecaptcha, true]); // Restored size 3 to fix hook error, but 'true' is stable

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

        if (!recaptchaSolved) {
            toast.error("Please verify that you are not a robot.")
            return
        }

        setLoading(true)
        try {
            const role = await login(email, password)
            // Use Next.js router for smooth client-side navigation
            if (role === 'admin' && from === '/') {
                router.push('/admin')
            } else {
                router.push(from)
            }
        } catch (error: any) {
            // console.error("Error during sign-in:", error)
            toast.error(error.message || "An unexpected error occurred during sign-in.")
        } finally {
            setLoading(false)
        }
    }

    const handleGoogleSignIn = async () => {
        setLoading(true)
        try {
            const role = await loginWithGoogle()
            // Use Next.js router for smooth client-side navigation
            if (role === 'admin' && from === '/') {
                router.push('/admin')
            } else {
                router.push(from)
            }
        } catch (error: any) {
            // console.error(error)
            toast.error(error.message || "An unexpected error occurred during registration.")
        } finally {
            setLoading(false)
        }
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
                        }}
                        className="w-full"
                    />
                </FormField>

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
                    disabled={loading || !recaptchaSolved}
                    className="w-full bg-brand-primary hover:bg-teal-700 text-white font-semibold py-2.5 sm:py-3 rounded-2xl transition-all duration-300 disabled:opacity-50 min-h-[48px]"
                >
                    {loading ? "Signing in..." : "Sign In"}
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
                    disabled={loading}
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
        <Suspense fallback={null}>
            <SignInContent />
        </Suspense>
    )
}
