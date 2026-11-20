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
import { validateEmail } from "@/lib/phone-validation";

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
    const [isEditingEmail, setIsEditingEmail] = useState(false);
    const [newEmailInput, setNewEmailInput] = useState("");
    const [savingEmail, setSavingEmail] = useState(false);
    const [emailError, setEmailError] = useState<string | null>(null);

    const saveEmail = async () => {
        if (!auth?.currentUser) return;
        const normalized = newEmailInput.trim().toLowerCase();
        if (normalized === email.toLowerCase()) {
            setIsEditingEmail(false);
            return;
        }
        const check = validateEmail(normalized);
        if (!check.isValid) {
            setEmailError(check.error || "Please enter a valid email address");
            return;
        }

        setSavingEmail(true);
        setEmailError(null);
        try {
            const token = await auth.currentUser.getIdToken(true);
            const res = await fetch("/api/users/update-email", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    targetUid: auth.currentUser.uid,
                    newEmail: normalized,
                }),
            });
            const data = (await res.json().catch(() => ({}))) as { error?: string };
            if (!res.ok) {
                throw new Error(data.error || "Failed to update email");
            }
            await auth.currentUser.getIdToken(true);
            setEmail(normalized);
            setIsEditingEmail(false);
            await queryClient.invalidateQueries({ queryKey: queryKeys.user.all });
            toast.success("Email successfully updated in Firebase and database!");
        } catch (e) {
            const msg = e instanceof Error ? e.message : "Failed to update email";
            setEmailError(msg);
            toast.error(msg);
        } finally {
            setSavingEmail(false);
        }
    };

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
            await queryClient.invalidateQueries({ queryKey: queryKeys.user.all });
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
                <h2 id="settings-profile">Profile & Account</h2>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 pl-0 sm:pl-7">
                Manage your sign-in email, display name, and contact phone number.
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
                    Update your sign-in email address, display name, and booking contact phone.
                </p>
            ) : null}
            <div className={`space-y-4 max-w-md ${embedded ? "" : "pl-0 sm:pl-7"}`}>
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="profile-email">Sign-in email</Label>
                        {!isEditingEmail ? (
                            <button
                                type="button"
                                onClick={() => {
                                    setNewEmailInput(email);
                                    setIsEditingEmail(true);
                                }}
                                className="text-xs font-semibold text-brand-primary hover:underline"
                            >
                                Change email
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={() => {
                                    setIsEditingEmail(false);
                                    setEmailError(null);
                                }}
                                className="text-xs text-muted-foreground hover:underline"
                            >
                                Cancel
                            </button>
                        )}
                    </div>
                    {!isEditingEmail ? (
                        <Input id="profile-email" value={email} readOnly disabled className="bg-muted text-muted-foreground font-mono text-sm" />
                    ) : (
                        <div className="space-y-2 rounded-xl border border-teal-200 bg-teal-50/50 p-3 dark:border-teal-900/60 dark:bg-teal-950/20">
                            <Input
                                id="profile-email-edit"
                                type="email"
                                value={newEmailInput}
                                onChange={(e) => {
                                    setNewEmailInput(e.target.value);
                                    if (emailError) setEmailError(null);
                                }}
                                placeholder="Enter your new email address"
                                error={emailError || undefined}
                                className="bg-white dark:bg-slate-900"
                            />
                            <div className="flex items-center gap-2">
                                <Button
                                    type="button"
                                    size="sm"
                                    onClick={() => void saveEmail()}
                                    disabled={
                                        savingEmail ||
                                        !newEmailInput ||
                                        newEmailInput.trim().toLowerCase() === email.toLowerCase()
                                    }
                                    className="h-8 text-xs font-semibold"
                                >
                                    {savingEmail ? (
                                        <>
                                            <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                                            Updating Firebase…
                                        </>
                                    ) : (
                                        "Update email"
                                    )}
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        setIsEditingEmail(false);
                                        setEmailError(null);
                                    }}
                                    className="h-8 text-xs"
                                >
                                    Cancel
                                </Button>
                            </div>
                            <p className="text-[11px] text-muted-foreground leading-tight">
                                Updates your login credential in Firebase Authentication and your profile database.
                            </p>
                        </div>
                    )}
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
