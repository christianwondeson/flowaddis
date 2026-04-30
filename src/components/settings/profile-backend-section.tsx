"use client";

import React, { useCallback, useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, UserCircle } from "lucide-react";

type ProfilePayload = {
    id: string;
    email: string | null;
    name: string | null;
    phone: string | null;
};

export function ProfileBackendSection() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [email, setEmail] = useState("");
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");

    const load = useCallback(async () => {
        if (!auth?.currentUser) {
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const token = await auth.currentUser.getIdToken(true);
            const res = await fetch("/api/profile", {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = (await res.json()) as ProfilePayload & { error?: string };
            if (!res.ok) {
                throw new Error(data.error || "Could not load profile");
            }
            setEmail(data.email || auth.currentUser.email || "");
            setName(data.name || "");
            setPhone(data.phone || "");
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Could not load profile");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void load();
    }, [load]);

    const save = async () => {
        if (!auth?.currentUser) return;
        setSaving(true);
        try {
            const token = await auth.currentUser.getIdToken(true);
            const res = await fetch("/api/profile", {
                method: "PATCH",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ name: name.trim(), phone: phone.trim() }),
            });
            const data = (await res.json()) as ProfilePayload & { error?: string; message?: string };
            if (!res.ok) {
                throw new Error(data.message || data.error || "Save failed");
            }
            setName(data.name || "");
            setPhone(data.phone || "");
            toast.success("Profile saved");
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Save failed");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <section className="space-y-4" aria-labelledby="settings-profile">
                <div className="flex items-center gap-2 text-lg font-semibold text-foreground">
                    <UserCircle className="w-5 h-5 text-brand-primary" aria-hidden />
                    <h2 id="settings-profile">Profile</h2>
                </div>
                <div className="pl-0 sm:pl-7 flex items-center gap-2 text-slate-500">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading profile…
                </div>
            </section>
        );
    }

    return (
        <section className="space-y-4" aria-labelledby="settings-profile">
            <div className="flex items-center gap-2 text-lg font-semibold text-foreground">
                <UserCircle className="w-5 h-5 text-brand-primary" aria-hidden />
                <h2 id="settings-profile">Profile</h2>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 pl-0 sm:pl-7">
                Name and phone are stored on our servers. Email comes from your sign-in account and cannot be changed here.
            </p>
            <div className="space-y-4 pl-0 sm:pl-7 max-w-md">
                <div className="space-y-2">
                    <Label htmlFor="profile-email">Email</Label>
                    <Input id="profile-email" value={email} readOnly disabled className="bg-muted" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="profile-name">Display name</Label>
                    <Input id="profile-name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="profile-phone">Phone (E.164)</Label>
                    <Input
                        id="profile-phone"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+251911234567"
                        autoComplete="tel"
                    />
                    <p className="text-xs text-slate-500">Leave empty to clear. Format: +country then number.</p>
                </div>
                <Button type="button" onClick={() => void save()} disabled={saving}>
                    {saving ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            Saving…
                        </>
                    ) : (
                        "Save profile"
                    )}
                </Button>
            </div>
        </section>
    );
}
