"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { confirmPasswordReset, verifyPasswordResetCode } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password-input";
import { AuthLayout } from "@/components/layout/auth-layout";
import { FormField } from "@/components/auth/form-field";
import { validatePasswordStrength, PASSWORD_POLICY_HINT } from "@/lib/password-policy";
import { PasswordStrengthMeter } from "@/components/auth/password-strength-meter";
import { toast } from "sonner";

function ResetPasswordForm() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [oobCode, setOobCode] = useState<string | null>(null);
    const [emailHint, setEmailHint] = useState<string>("");
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [verifying, setVerifying] = useState(true);

    useEffect(() => {
        const code =
            searchParams.get("oobCode") ||
            (typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("oobCode") : null);
        if (!code || !auth) {
            setVerifying(false);
            setOobCode(null);
            return;
        }
        setOobCode(code);
        verifyPasswordResetCode(auth, code)
            .then((email) => {
                setEmailHint(email);
            })
            .catch(() => {
                setOobCode(null);
                toast.error("This reset link is invalid or has expired. Request a new one.");
            })
            .finally(() => setVerifying(false));
    }, [searchParams]);

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        if (!oobCode || !auth) {
            setError("Missing or invalid reset link.");
            return;
        }
        if (password !== confirm) {
            setError("Passwords do not match.");
            return;
        }
        const strength = validatePasswordStrength(password);
        if (!strength.ok) {
            setError(strength.message);
            return;
        }
        setLoading(true);
        try {
            await confirmPasswordReset(auth, oobCode, password);
            toast.success("Password updated. You can sign in with your new password.");
            router.push("/signin");
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Could not reset password.";
            setError(message);
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    if (verifying) {
        return (
            <AuthLayout title="Reset password" subtitle="Checking your link…">
                <p className="text-center text-sm text-gray-600">Please wait.</p>
            </AuthLayout>
        );
    }

    if (!oobCode) {
        return (
            <AuthLayout title="Reset password" subtitle="Link problem">
                <p className="text-sm text-gray-600 text-center mb-4">
                    Open the reset link from your email on this site, or request a new link from the forgot-password
                    page.
                </p>
                <Button className="w-full" variant="outline" onClick={() => router.push("/forgot-password")}>
                    Request new link
                </Button>
            </AuthLayout>
        );
    }

    return (
        <AuthLayout
            title="Choose a new password"
            subtitle={emailHint ? `Account: ${emailHint}` : "Set a strong password"}
            footerLink={{ text: "Back to", href: "/signin", linkText: "Sign in" }}
        >
            <form onSubmit={onSubmit} className="space-y-4">
                <p className="text-xs text-gray-600 bg-gray-50 border border-gray-100 rounded-lg p-3">{PASSWORD_POLICY_HINT}</p>
                <FormField label="New password">
                    <PasswordInput
                        value={password}
                        onChange={(e) => {
                            setPassword(e.target.value);
                            setError("");
                        }}
                        className="w-full"
                        autoComplete="new-password"
                    />
                    <PasswordStrengthMeter password={password} className="mt-2" />
                </FormField>
                <FormField label="Confirm password">
                    <PasswordInput
                        value={confirm}
                        onChange={(e) => {
                            setConfirm(e.target.value);
                            setError("");
                        }}
                        className="w-full"
                        autoComplete="new-password"
                    />
                </FormField>
                {error ? (
                    <p className="text-sm text-red-600" role="alert">
                        {error}
                    </p>
                ) : null}
                <Button type="submit" disabled={loading} className="w-full bg-brand-primary text-white">
                    {loading ? "Saving…" : "Update password"}
                </Button>
            </form>
        </AuthLayout>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={null}>
            <ResetPasswordForm />
        </Suspense>
    );
}
