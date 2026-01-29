"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/providers/auth-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PasswordInput } from "@/components/ui/password-input"
import { toast } from "sonner"
import { AuthLayout } from "@/components/layout/auth-layout"
import { FormField } from "@/components/auth/form-field"

export default function SignUpPage() {
    const [name, setName] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [isAdminAccount, setIsAdminAccount] = useState(false)
    const [loading, setLoading] = useState(false)
    const [errors, setErrors] = useState<{
        name?: string
        email?: string
        password?: string
        confirmPassword?: string
    }>({})

    const { register, sendVerificationEmail } = useAuth()
    const router = useRouter()

    const validateForm = () => {
        const newErrors: typeof errors = {}

        if (!name.trim()) newErrors.name = "Full name is required"
        if (!email.includes("@")) newErrors.email = "Please enter a valid email"
        if (password.length < 8) newErrors.password = "Password must be at least 8 characters"
        if (password !== confirmPassword) newErrors.confirmPassword = "Passwords do not match"

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!validateForm()) return

        setLoading(true)
        try {
            await register(name, email, password, isAdminAccount)
            await sendVerificationEmail()

            if (isAdminAccount) {
                toast.success("Account created! Your admin account is pending approval.")
            } else {
                toast.success("Account created! Please check your email to verify your account.")
            }
            router.push("/")
        } catch (error: any) {
            console.error(error)
            toast.error(`Registration failed: ${error.message}`)
        } finally {
            setLoading(false)
        }
    }

    return (
        <AuthLayout
            title="Create Account"
            subtitle="Join FlowAddis today"
            footerLink={{
                text: "Already have an account?",
                href: "/signin",
                linkText: "Sign In",
            }}
        >
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
                {/* Name Field */}
                <FormField label="Full Name" error={errors.name}>
                    <Input
                        type="text"
                        placeholder="John Doe"
                        value={name}
                        onChange={(e) => {
                            setName(e.target.value)
                            setErrors({ ...errors, name: "" })
                        }}
                        className="w-full"
                    />
                </FormField>

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

                {/* Confirm Password Field */}
                <FormField label="Confirm Password" error={errors.confirmPassword}>
                    <PasswordInput
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => {
                            setConfirmPassword(e.target.value)
                            setErrors({ ...errors, confirmPassword: "" })
                        }}
                        className="w-full"
                    />
                </FormField>

                {/* Admin Account Checkbox */}
                <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors">
                    <input
                        type="checkbox"
                        checked={isAdminAccount}
                        onChange={(e) => setIsAdminAccount(e.target.checked)}
                        className="w-5 h-5 rounded border-gray-300 text-brand-primary focus:ring-brand-primary"
                    />
                    <div>
                        <p className="text-sm font-medium text-gray-900">Request Admin Access</p>
                        <p className="text-xs text-gray-500">Register as a business partner (requires approval)</p>
                    </div>
                </label>

                {/* Sign Up Button */}
                <Button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-brand-primary hover:bg-blue-700 text-white font-semibold py-2.5 sm:py-3 rounded-lg transition-colors mt-6"
                >
                    {loading ? "Creating account..." : "Create Account"}
                </Button>

                {/* Terms & Privacy */}
                <p className="text-xs text-center text-gray-500">
                    By signing up, you agree to our{" "}
                    <a href="/terms" className="text-brand-primary hover:underline">
                        Terms of Service
                    </a>{" "}
                    and{" "}
                    <a href="/privacy" className="text-brand-primary hover:underline">
                        Privacy Policy
                    </a>
                </p>
            </form>
        </AuthLayout>
    )
}
