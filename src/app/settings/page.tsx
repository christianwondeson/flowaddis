"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Lock, Globe } from "lucide-react";
import { AppearanceThemeSection } from "@/components/settings/appearance-theme-section";

export default function SettingsPage() {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen pt-16 md:pt-20 pb-16 flex items-center justify-center bg-brand-gray/30 dark:bg-background">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary" />
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-screen pt-16 md:pt-20 pb-16 container mx-auto px-4 sm:px-6 lg:px-6 text-center bg-brand-gray/30 dark:bg-background">
                <h1 className="text-2xl font-bold mb-4 text-foreground">Please sign in to access settings</h1>
                <Button onClick={() => (window.location.href = "/signin")}>Sign In</Button>
            </div>
        );
    }

    return (
        <div className="min-h-screen pt-16 md:pt-20 pb-16 md:pb-20 bg-brand-gray/30 dark:bg-background">
            <div className="container mx-auto px-4 sm:px-6 lg:px-6 max-w-3xl">
                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
                    <div className="p-6 border-b border-slate-100 dark:border-slate-700">
                        <h1 className="text-2xl font-bold text-foreground">Account Settings</h1>
                        <p className="text-slate-500 dark:text-slate-400">Manage your preferences and account security</p>
                    </div>

                    <div className="p-6 space-y-8">
                        <AppearanceThemeSection />

                        <div className="border-t border-slate-100 dark:border-slate-700" />

                        <section className="space-y-4" aria-labelledby="settings-language">
                            <div className="flex items-center gap-2 text-lg font-semibold text-foreground">
                                <Globe className="w-5 h-5 text-brand-primary" aria-hidden />
                                <h2 id="settings-language">Language and Region</h2>
                            </div>
                            <div className="space-y-4 pl-0 sm:pl-7">
                                <div className="flex items-center justify-between gap-4">
                                    <div className="space-y-0.5">
                                        <Label className="text-base text-foreground">Language</Label>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">English (US)</p>
                                    </div>
                                    <Button variant="outline" size="sm" className="dark:border-slate-600 dark:hover:bg-slate-800">
                                        Change
                                    </Button>
                                </div>
                            </div>
                        </section>

                        <div className="border-t border-slate-100 dark:border-slate-700" />

                        <section className="space-y-4" aria-labelledby="settings-security">
                            <div className="flex items-center gap-2 text-lg font-semibold text-foreground">
                                <Lock className="w-5 h-5 text-brand-primary" aria-hidden />
                                <h2 id="settings-security">Security</h2>
                            </div>
                            <div className="space-y-4 pl-0 sm:pl-7">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                    <div className="space-y-0.5">
                                        <Label className="text-base text-foreground">Password</Label>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">
                                            Update your password (email/password sign-in only).
                                        </p>
                                    </div>
                                    <Button variant="outline" size="sm" asChild className="dark:border-slate-600 dark:hover:bg-slate-800 shrink-0">
                                        <Link href="/settings/password">Change password</Link>
                                    </Button>
                                </div>
                            </div>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
}
