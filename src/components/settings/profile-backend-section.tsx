"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { updateProfile } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { queryKeys } from "@/lib/react-query";
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

type ProfileBackendSectionProps = {
    /** On `/profile` use embedded layout (no duplicate “Profile” section heading). */
    embedded?: boolean;
    /** Called after server profile is loaded or saved, and Firebase/Firestore are synced. */
    onProfileSynced?: (data: ProfilePayload) => void;
};

export function ProfileBackendSection({ embedded = false, onProfileSynced }: ProfileBackendSectionProps) {
    const queryClient = useQueryClient();
    const onProfileSyncedRef = useRef(onProfileSynced);
    onProfileSyncedRef.current = onProfileSynced;
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [email, setEmail] = useState("");
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");

    const syncFirebaseAndFirestore = useCallback(
        async (data: ProfilePayload) => {
            if (!auth?.currentUser) return;
            const u = auth.currentUser;
            const displayName = (data.name ?? "").trim();
            try {
                await updateProfile(u, { displayName });
            } catch (e) {
                console.warn("Firebase updateProfile (displayName)", e);
            }
            if (db) {
                try {
                    const phoneVal = (data.phone ?? "").trim();
                    await setDoc(
                        doc(db, "users", u.uid),
                        {
                            name: data.name ?? "",
                            phone: phoneVal.length > 0 ? phoneVal : null,
                        },
                        { merge: true },
                    );
                } catch (e) {
                    console.warn("Firestore profile merge", e);
                }
            }
            await queryClient.invalidateQueries({ queryKey: queryKeys.user.profile() });
            onProfileSyncedRef.current?.(data);
        },
        [queryClient],
    );

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
            const data = (await res.json()) as ProfilePayload & { error?: string; message?: string };
            if (!res.ok) {
                throw new Error(
                    data.message || data.error || (res.status === 503 ? "API server is not running or BACKEND_URL is wrong." : "Could not load profile"),
                );
            }
            setEmail(data.email || auth.currentUser.email || "");
            setName(data.name || "");
            setPhone(data.phone || "");
            await syncFirebaseAndFirestore(data);
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Could not load profile");
        } finally {
            setLoading(false);
        }
    }, [syncFirebaseAndFirestore]);

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
            await syncFirebaseAndFirestore(data);
            toast.success("Profile saved");
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Save failed");
        } finally {
            setSaving(false);
        }
    };

    const titleBlock = embedded ? null : (
        <>
            <div className="flex items-center gap-2 text-lg font-semibold text-foreground">
                <UserCircle className="w-5 h-5 text-brand-primary" aria-hidden />
                <h2 id="settings-profile">Profile</h2>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 pl-0 sm:pl-7">
                Name and phone are stored on our servers. Email comes from your sign-in account and cannot be changed here.
            </p>
        </>
    );

    if (loading) {
        return (
            <section
                className="space-y-4"
                {...(embedded ? { 'aria-label': 'Loading profile' } : { 'aria-labelledby': 'settings-profile' })}
            >
                {titleBlock}
                <div className={`flex items-center gap-2 text-slate-500 ${embedded ? "" : "pl-0 sm:pl-7"}`}>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading profile…
                </div>
            </section>
        );
    }

    return (
        <section
            className="space-y-4"
            {...(embedded ? { 'aria-labelledby': 'profile-edit' } : { 'aria-labelledby': 'settings-profile' })}
        >
            {titleBlock}
            {embedded ? (
                <p id="profile-edit" className="text-sm text-slate-500 dark:text-slate-400">
                    Update the name and phone we store for bookings. Email is managed by your sign-in provider.
                </p>
            ) : null}
            <div className={`space-y-4 max-w-md ${embedded ? "" : "pl-0 sm:pl-7"}`}>
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
