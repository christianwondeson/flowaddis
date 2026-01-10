"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/providers/auth-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PasswordInput } from "@/components/ui/password-input"
import { User, Mail, Lock, ShieldCheck } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
import { Logo } from "@/components/shared/logo"

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
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="flex justify-center mb-6">
                    <Logo size="lg" />
                </div>
                <h2 className="text-center text-3xl font-extrabold text-gray-900">
                    Create Account
                </h2>
                <p className="mt-2 text-center text-sm text-gray-600">
                    Join BookAddis today
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <Input
                            label="Full Name"
                            placeholder="Name"
                            value={name}
                            onChange={(e) => {
                                setName(e.target.value)
                                setErrors({ ...errors, name: "" })
                            }}
                            icon={<User className="w-5 h-5" />}
                            error={errors.name}
                        />

                        <Input
                            label="Email Address"
                            type="email"
                            placeholder="Email"
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

                        <PasswordInput
                            label="Confirm Password"
                            placeholder="••••••••"
                            value={confirmPassword}
                            onChange={(e) => {
                                setConfirmPassword(e.target.value)
                                setErrors({ ...errors, confirmPassword: "" })
                            }}
                            icon={<Lock className="w-5 h-5" />}
                            error={errors.confirmPassword}
                        />

                        <div className="flex items-start gap-3 p-4 rounded-lg bg-blue-50 border border-blue-200">
                            <input
                                type="checkbox"
                                id="admin-account"
                                checked={isAdminAccount}
                                onChange={(e) => setIsAdminAccount(e.target.checked)}
                                className="w-5 h-5 mt-0.5 rounded border-gray-300 cursor-pointer accent-brand-primary"
                            />
                            <label htmlFor="admin-account" className="flex-1 cursor-pointer">
                                <div className="flex items-center gap-2">
                                    <ShieldCheck className="w-5 h-5 text-brand-primary" />
                                    <span className="font-semibold text-gray-800">Request Admin Account</span>
                                </div>
                                <p className="text-sm text-gray-600 mt-1">
                                    Check this box if you're a business partner or admin. Your account will require approval.
                                </p>
                            </label>
                        </div>

                        <Button
                            type="submit"
                            className="w-full bg-brand-primary hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors"
                            disabled={loading}
                        >
                            {loading ? "Creating Account..." : "Sign Up"}
                        </Button>
                    </form>

                    <div className="mt-6">
                        <div className="relative">
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-white text-gray-500">
                                    Already have an account?{' '}
                                    <Link href="/signin" className="font-medium text-brand-primary hover:text-brand-dark">
                                        Sign In
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
