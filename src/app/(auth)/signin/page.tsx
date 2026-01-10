"use client"

import type React from "react"
import { Suspense, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/components/providers/auth-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PasswordInput } from "@/components/ui/password-input"
import { Mail, Lock } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
import { Logo } from "@/components/shared/logo"

function SignInContent() {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [loading, setLoading] = useState(false)
    const [errors, setErrors] = useState<{ email?: string; password?: string }>({})

    const { login, loginWithGoogle } = useAuth()
    const router = useRouter()
    const searchParams = useSearchParams()

    const from = searchParams.get("redirect") || searchParams.get("from") || "/"

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

        setLoading(true)
        try {
            const role = await login(email, password)
            if (role === 'admin' && from === '/') {
                router.push('/admin')
            } else {
                router.push(from)
            }
        } catch (error: any) {
            console.error("Error during sign-in:", error)
            toast.error(`Sign-in failed: ${error.message || "Unknown error"}`)
        } finally {
            setLoading(false)
        }
    }

    const handleGoogleSignIn = async () => {
        setLoading(true)
        try {
            const role = await loginWithGoogle()
            if (role === 'admin' && from === '/') {
                router.push('/admin')
            } else {
                router.push(from)
            }
        } catch (error: any) {
            console.error(error)
            toast.error(`Google sign-in failed: ${error.message}`)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="flex justify-center mb-6">
                    <Logo size="lg" />
                </div>
                <h2 className="text-center text-3xl font-extrabold text-gray-900">
                    Welcome Back
                </h2>
                <p className="mt-2 text-center text-sm text-gray-600">
                    Sign in to continue to BookAddis
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <Input
                            label="Email Address"
                            type="email"
                            placeholder="name@company.com"
                            value={email}
                            onChange={(e) => {
                                setEmail(e.target.value)
                                setErrors({ ...errors, email: "" })
                            }}
                            icon={<Mail className="w-5 h-5" />}
                            error={errors.email}
                        />

                        <PasswordInput
                            label="Password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => {
                                setPassword(e.target.value)
                                setErrors({ ...errors, password: "" })
                            }}
                            icon={<Lock className="w-5 h-5" />}
                            error={errors.password}
                        />


                        <div className="mt-2">
                            <Link href={`/forgot-password?redirect=${encodeURIComponent(from)}`}>
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="w-full py-3 flex items-center justify-center gap-3 border-brand-border hover:bg-brand-light transition-colors bg-transparent"
                                    disabled={loading}
                                >
                                    <Lock className="w-5 h-5" />
                                    <span className="font-semibold text-gray-700">Forgot Password</span>
                                </Button>
                            </Link>
                        </div>


                        <Button
                            type="submit"
                            className="w-full bg-brand-primary hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors"
                            disabled={loading}
                        >
                            {loading ? "Processing..." : "Sign In"}
                        </Button>

                        <div className="relative my-6">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-brand-border"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-3 bg-white text-gray-600">Or continue with</span>
                            </div>
                        </div>

                        <Button
                            type="button"
                            variant="outline"
                            className="w-full py-3 flex items-center justify-center gap-3 border-brand-border hover:bg-brand-light transition-colors bg-transparent"
                            onClick={handleGoogleSignIn}
                            disabled={loading}
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
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
                            <span className="font-semibold text-gray-700">Sign in with Google</span>
                        </Button>
                    </form>

                    <div className="mt-6">
                        <div className="relative">
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-white text-gray-500">
                                    Don't have an account?{' '}
                                    <Link href="/signup" className="font-medium text-brand-primary hover:text-brand-dark">
                                        Sign Up
                                    </Link>
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default function SignInPage() {
    return (
        <Suspense fallback={null}>
            <SignInContent />
        </Suspense>
    )
}
