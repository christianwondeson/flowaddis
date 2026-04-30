"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/providers/auth-provider";
import { auth } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ArrowLeft, Loader2 } from "lucide-react";

export default function ChangePasswordPage() {
    const { user, loading, changePassword } = useAuth();
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const isEmailPassword = useMemo(() => {
        const u = auth?.currentUser;
        if (!u) return false;
        return u.providerData.some((p) => p.providerId === "password");
    }, [loading, user?.id]);

    if (loading) {
        return (
            <div className="min-h-screen pt-16 md:pt-20 pb-16 flex items-center justify-center bg-brand-gray/30 dark:bg-background">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary" />
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-screen pt-16 md:pt-20 pb-16 container mx-auto px-4 text-center bg-brand-gray/30 dark:bg-background">
                <h1 className="text-2xl font-bold mb-4 text-foreground">Please sign in to change your password</h1>
                <Button onClick={() => (window.location.href = "/signin")}>Sign In</Button>
            </div>
        );
    }

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isEmailPassword) return;
        if (newPassword !== confirmPassword) {
            toast.error("New password and confirmation do not match.");
            return;
        }
        setSubmitting(true);
        try {
            await changePassword(currentPassword, newPassword);
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Could not update password");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen pt-16 md:pt-20 pb-16 md:pb-20 bg-brand-gray/30 dark:bg-background">
            <div className="container mx-auto px-4 sm:px-6 lg:px-6 max-w-lg">
                <Button variant="ghost" size="sm" asChild className="mb-4 -ml-2 text-slate-600 dark:text-slate-300">
                    <Link href="/settings" className="inline-flex items-center gap-2">
                        <ArrowLeft className="h-4 w-4" aria-hidden />
                        Back to settings
                    </Link>
                </Button>

                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
                    <div className="p-6 border-b border-slate-100 dark:border-slate-700">
                        <h1 className="text-2xl font-bold text-foreground">Change password</h1>
                        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                            Re-enter your current password, then choose a strong new password.
                        </p>
                    </div>

                    <div className="p-6">
                        {!isEmailPassword ? (
                            <p className="text-sm text-slate-600 dark:text-slate-300">
                                This account uses Google sign-in. To change how you sign in, use your Google account
                                security settings. If you originally created an email/password account, sign in with
                                email and password to use this form.
                            </p>
                        ) : (
                            <form onSubmit={(e) => void onSubmit(e)} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="current-password">Current password</Label>
                                    <Input
                                        id="current-password"
                                        type="password"
                                        autoComplete="current-password"
                                        value={currentPassword}
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="new-password">New password</Label>
                                    <Input
                                        id="new-password"
                                        type="password"
                                        autoComplete="new-password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="confirm-password">Confirm new password</Label>
                                    <Input
                                        id="confirm-password"
                                        type="password"
                                        autoComplete="new-password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        required
                                    />
                                </div>
                                <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
                                    {submitting ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin mr-2" aria-hidden />
                                            Updating…
                                        </>
                                    ) : (
                                        "Update password"
                                    )}
                                </Button>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
