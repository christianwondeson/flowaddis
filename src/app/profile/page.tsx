"use client";

import React, { useCallback, useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, Calendar, Loader2 } from "lucide-react";
import { ProfileBackendSection } from "@/components/settings/profile-backend-section";
import Link from "next/link";
import { AccountShell } from "@/components/account/account-shell";

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
            <div className="flex min-h-[50vh] flex-col items-center justify-center bg-brand-gray/30 pt-24 dark:bg-background">
                <Loader2 className="h-9 w-9 animate-spin text-brand-primary" aria-hidden />
                <p className="mt-3 text-sm text-muted-foreground">Loading profile…</p>
            </div>
        );
    }

    if (!user) {
        return null;
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
        <AccountShell>
            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm dark:border-slate-700 dark:bg-slate-900">
                <div className="border-b border-border bg-brand-primary/5 p-6 dark:border-slate-700 dark:bg-brand-primary/10">
                    <div className="flex items-center gap-4">
                        <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full border-2 border-white bg-brand-primary/10 shadow-sm dark:border-slate-700 dark:bg-brand-primary/20">
                            <span className="text-3xl font-bold text-brand-primary">{avatarLetter}</span>
                        </div>
                        <div className="min-w-0">
                            <h1 className="text-2xl font-bold text-foreground">{displayName}</h1>
                            <p className="text-muted-foreground">{user.email}</p>
                            {phoneLine ? <p className="mt-0.5 text-sm text-muted-foreground">{phoneLine}</p> : null}
                            <p className="mt-1 text-xs text-muted-foreground">
                                Sign-in identity above; booking name and phone are edited below (server).
                            </p>
                        </div>
                    </div>
                </div>

                <div className="space-y-8 p-6">
                    <ProfileBackendSection embedded onProfileSynced={onProfileSynced} />

                    <div className="border-t border-border dark:border-slate-700" />

                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="role" className="text-muted-foreground">
                                Account role
                            </Label>
                            <div className="relative">
                                <Shield className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    id="role"
                                    value={user.role === "admin" ? "Administrator" : "Standard user"}
                                    readOnly
                                    className={`${inputReadOnlyClass} capitalize`}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="joined" className="text-muted-foreground">
                                Member since
                            </Label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
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

                    <div className="flex flex-col gap-3 border-t border-border pt-4 dark:border-slate-700 sm:flex-row sm:justify-between">
                        <Button variant="outline" asChild className="min-h-[44px] dark:border-slate-600 dark:hover:bg-slate-800">
                            <Link href="/settings">Account settings</Link>
                        </Button>
                    </div>
                </div>
            </div>
        </AccountShell>
    );
}
