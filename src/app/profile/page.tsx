"use client";

import React, { useCallback, useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, Calendar } from "lucide-react";
import { ProfileBackendSection } from "@/components/settings/profile-backend-section";
import Link from "next/link";

export default function ProfilePage() {
    const { user, loading } = useAuth();
    const [banner, setBanner] = useState<{ name: string; phone: string } | null>(null);

    const onProfileSynced = useCallback((data: { name: string | null; phone: string | null }) => {
        setBanner({
            name: (data.name ?? "").trim(),
            phone: (data.phone ?? "").trim(),
        });
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen pt-16 md:pt-20 pb-16 flex items-center justify-center bg-brand-gray/30 dark:bg-background">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary" />
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-screen pt-24 pb-12 container mx-auto px-4 text-center bg-background">
                <h1 className="text-2xl font-bold mb-4 text-foreground">Please sign in to view your profile</h1>
                <Button onClick={() => (window.location.href = "/signin")}>Sign In</Button>
            </div>
        );
    }

    const inputReadOnlyClass =
        "pl-10 bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-600 text-foreground";

    const displayName =
        (banner?.name && banner.name.length > 0 ? banner.name : user.name)?.trim() ||
        user.email?.split("@")[0] ||
        "Member";
    const avatarLetter = displayName[0]?.toUpperCase() || user.email[0]?.toUpperCase() || "?";
    const phoneLine = (banner?.phone && banner.phone.length > 0 ? banner.phone : user.phone)?.trim();

    return (
        <div className="min-h-screen pt-16 md:pt-20 pb-16 md:pb-20 bg-brand-gray/30 dark:bg-background">
            <div className="container mx-auto px-4 sm:px-6 lg:px-6 max-w-3xl">
                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
                    <div className="bg-brand-primary/5 dark:bg-brand-primary/10 p-6 border-b border-slate-100 dark:border-slate-700">
                        <div className="flex items-center gap-4">
                            <div className="h-20 w-20 rounded-full bg-brand-primary/10 dark:bg-brand-primary/20 flex items-center justify-center border-2 border-white dark:border-slate-700 shadow-sm">
                                <span className="text-3xl font-bold text-brand-primary">{avatarLetter}</span>
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-foreground">{displayName}</h1>
                                <p className="text-slate-500 dark:text-slate-400">{user.email}</p>
                                {phoneLine ? (
                                    <p className="text-sm text-slate-600 dark:text-slate-300 mt-0.5">{phoneLine}</p>
                                ) : null}
                                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                                    Sign-in identity above; booking name and phone are edited below (server).
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 space-y-8">
                        <ProfileBackendSection embedded onProfileSynced={onProfileSynced} />

                        <div className="border-t border-slate-100 dark:border-slate-700" />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="role" className="text-slate-600 dark:text-slate-300">
                                    Account Role
                                </Label>
                                <div className="relative">
                                    <Shield className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
                                    <Input
                                        id="role"
                                        value={user.role === "admin" ? "Administrator" : "Standard User"}
                                        readOnly
                                        className={`${inputReadOnlyClass} capitalize`}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="joined" className="text-slate-600 dark:text-slate-300">
                                    Member Since
                                </Label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
                                    <Input
                                        id="joined"
                                        value={
                                            user.createdAt?.toDate
                                                ? user.createdAt.toDate().toLocaleDateString()
                                                : "Recently"
                                        }
                                        readOnly
                                        className={inputReadOnlyClass}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="pt-2 border-t border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row justify-between gap-3">
                            <Button variant="outline" asChild className="dark:border-slate-600 dark:hover:bg-slate-800">
                                <Link href="/settings">Account settings</Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
