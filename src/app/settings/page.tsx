"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "@/components/providers/auth-provider";
import { useTranslations } from "@/components/providers/locale-provider";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Lock, Globe } from "lucide-react";
import { AppearanceThemeSection } from "@/components/settings/appearance-theme-section";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import type { AppLocale } from "@/lib/i18n/config";

export default function SettingsPage() {
    const { user, loading } = useAuth();
    const { t, locale, setLocale } = useTranslations();

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
                <h1 className="text-2xl font-bold mb-4 text-foreground">{t("settings.signInRequired")}</h1>
                <Button onClick={() => (window.location.href = "/signin")}>{t("common.signIn")}</Button>
            </div>
        );
    }

    return (
        <div className="min-h-screen pt-16 md:pt-20 pb-16 md:pb-20 bg-brand-gray/30 dark:bg-background">
            <div className="container mx-auto px-4 sm:px-6 lg:px-6 max-w-3xl">
                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
                    <div className="p-6 border-b border-slate-100 dark:border-slate-700">
                        <h1 className="text-2xl font-bold text-foreground">{t("settings.title")}</h1>
                        <p className="text-slate-500 dark:text-slate-400">{t("settings.subtitle")}</p>
                    </div>

                    <div className="p-6 space-y-8">
                        <AppearanceThemeSection />

                        <div className="border-t border-slate-100 dark:border-slate-700" />

                        <section className="space-y-4" aria-labelledby="settings-language">
                            <div className="flex items-center gap-2 text-lg font-semibold text-foreground">
                                <Globe className="w-5 h-5 text-brand-primary" aria-hidden />
                                <h2 id="settings-language">{t("settings.languageRegion")}</h2>
                            </div>
                            <div className="space-y-4 pl-0 sm:pl-7">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div className="space-y-0.5 flex-1 max-w-md">
                                        <Label className="text-base text-foreground">{t("settings.language")}</Label>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">{t("settings.languageHint")}</p>
                                    </div>
                                    <Select
                                        value={locale}
                                        onValueChange={(v) => setLocale(v as AppLocale)}
                                    >
                                        <SelectTrigger className="w-full sm:w-[240px] dark:border-slate-600 dark:bg-slate-900">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="en">{t("settings.englishRegion")}</SelectItem>
                                            <SelectItem value="am">{t("settings.amharicRegion")}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </section>

                        <div className="border-t border-slate-100 dark:border-slate-700" />

                        <section className="space-y-4" aria-labelledby="settings-security">
                            <div className="flex items-center gap-2 text-lg font-semibold text-foreground">
                                <Lock className="w-5 h-5 text-brand-primary" aria-hidden />
                                <h2 id="settings-security">{t("settings.security")}</h2>
                            </div>
                            <div className="space-y-4 pl-0 sm:pl-7">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                    <div className="space-y-0.5">
                                        <Label className="text-base text-foreground">{t("settings.mfaTitle")}</Label>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">{t("settings.mfaHint")}</p>
                                    </div>
                                    <Button variant="outline" size="sm" asChild className="dark:border-slate-600 dark:hover:bg-slate-800 shrink-0">
                                        <Link href="/settings/mfa">{t("settings.mfaSetup")}</Link>
                                    </Button>
                                </div>
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                    <div className="space-y-0.5">
                                        <Label className="text-base text-foreground">{t("settings.passwordTitle")}</Label>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">{t("settings.passwordHint")}</p>
                                    </div>
                                    <Button variant="outline" size="sm" asChild className="dark:border-slate-600 dark:hover:bg-slate-800 shrink-0">
                                        <Link href="/settings/password">{t("settings.changePassword")}</Link>
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
