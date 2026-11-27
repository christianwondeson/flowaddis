"use client";

import React, { useCallback, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useRequireSignedIn } from "@/hooks/use-require-signed-in";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Shield,
    Calendar,
    Loader2,
    User,
    Building2,
    Sparkles,
    Coins,
    Globe,
    Briefcase,
    ArrowRight,
    ExternalLink,
    CheckCircle2,
    Hotel,
    Info,
    Gift,
    Copy,
    Check,
} from "lucide-react";
import { generateUserPromoCode } from "@/lib/hotel-promotions";
import { ProfileBackendSection } from "@/components/settings/profile-backend-section";
import { HotelPartnerRequestForm } from "@/components/account/hotel-partner-request-form";
import Link from "next/link";
import { AccountShell } from "@/components/account/account-shell";
import { canAccessHotelPortal } from "@/lib/auth/admin-utils";

export default function ProfilePage() {
    const searchParams = useSearchParams();
    const { user, loading } = useRequireSignedIn();
    const [banner, setBanner] = useState<{ name: string; phone: string } | null>(null);

    // Tab state: 'guest' (default) vs 'partner'
    const initialTab = searchParams?.get("tab") === "partner" ? "partner" : "guest";
    const [activeTab, setActiveTab] = useState<"guest" | "partner">(initialTab);

    // Guest travel preferences
    const [preferredCurrency, setPreferredCurrency] = useState("ETB");
    const [preferredLanguage, setPreferredLanguage] = useState("en");
    const [travelNotes, setTravelNotes] = useState("");
    const [prefSaved, setPrefSaved] = useState(false);

    // Partner registration visibility toggle for guests who click to apply
    const [showPartnerForm, setShowPartnerForm] = useState(false);

    useEffect(() => {
        if (typeof window !== "undefined") {
            const savedCurr = localStorage.getItem("bookaddis_pref_currency") || "ETB";
            const savedLang = localStorage.getItem("bookaddis_pref_lang") || "en";
            const savedNotes = localStorage.getItem("bookaddis_pref_notes") || "";
            setPreferredCurrency(savedCurr);
            setPreferredLanguage(savedLang);
            setTravelNotes(savedNotes);
        }
    }, []);

    const saveGuestPreferences = (e: React.FormEvent) => {
        e.preventDefault();
        if (typeof window !== "undefined") {
            localStorage.setItem("bookaddis_pref_currency", preferredCurrency);
            localStorage.setItem("bookaddis_pref_lang", preferredLanguage);
            localStorage.setItem("bookaddis_pref_notes", travelNotes.trim());
        }
        setPrefSaved(true);
        setTimeout(() => setPrefSaved(false), 3000);
    };

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
        return (
            <div className="flex min-h-[50vh] flex-col items-center justify-center bg-brand-gray/30 pt-24 dark:bg-background">
                <Loader2 className="h-9 w-9 animate-spin text-brand-primary" aria-hidden />
                <p className="mt-3 text-sm text-muted-foreground">Signing out…</p>
            </div>
        );
    }

    const inputReadOnlyClass =
        "pl-10 bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-600 text-foreground";

    const displayName =
        (banner?.name && banner.name.length > 0 ? banner.name : user.name)?.trim() ||
        user.email?.split("@")[0] ||
        "Guest";
    const avatarLetter = displayName[0]?.toUpperCase() || user.email[0]?.toUpperCase() || "G";
    const phoneLine = (banner?.phone && banner.phone.length > 0 ? banner.phone : user.phone)?.trim();

    const isPartner = canAccessHotelPortal(user);
    const partnerStatus = user.hotelPartnerStatus || "none";

    const [copiedCode, setCopiedCode] = useState(false);
    const [copiedLink, setCopiedLink] = useState(false);
    const promoCode = user.myPromoCode || user.referralCode || generateUserPromoCode(displayName);

    const copyCodeToClipboard = async () => {
        if (!promoCode) return;
        try {
            await navigator.clipboard.writeText(promoCode);
            setCopiedCode(true);
            setTimeout(() => setCopiedCode(false), 2000);
        } catch {
            /* ignore */
        }
    };

    const copyLinkToClipboard = async () => {
        if (!promoCode) return;
        try {
            const origin = typeof window !== "undefined" ? window.location.origin : "https://bookaddis.com";
            await navigator.clipboard.writeText(`${origin}/signup?ref=${promoCode}`);
            setCopiedLink(true);
            setTimeout(() => setCopiedLink(false), 2000);
        } catch {
            /* ignore */
        }
    };

    return (
        <AccountShell>
            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm dark:border-slate-700 dark:bg-slate-900">
                {/* Profile Header Hero */}
                <div className="border-b border-border bg-brand-primary/5 p-6 dark:border-slate-700 dark:bg-brand-primary/10">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full border-2 border-white bg-brand-primary/10 shadow-sm dark:border-slate-700 dark:bg-brand-primary/20">
                                <span className="text-3xl font-bold text-brand-primary">{avatarLetter}</span>
                            </div>
                            <div className="min-w-0">
                                <h1 className="text-2xl font-bold text-foreground">{displayName}</h1>
                                <p className="text-muted-foreground">{user.email}</p>
                                {phoneLine ? <p className="mt-0.5 text-sm text-muted-foreground">{phoneLine}</p> : null}
                                <div className="mt-1 flex items-center gap-2">
                                    <span className="inline-flex items-center rounded-full bg-blue-100 dark:bg-blue-900/40 px-2.5 py-0.5 text-xs font-semibold text-blue-800 dark:text-blue-300">
                                        {isPartner
                                            ? "Hotel Partner"
                                            : user.role === "admin"
                                              ? "Super Admin"
                                              : "BookAddis Guest"}
                                    </span>
                                    {partnerStatus === "pending" && (
                                        <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
                                            Partner KYC Pending
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Quick links to Trips / Bookings */}
                        <div className="flex items-center gap-2 sm:self-start">
                            <Button variant="outline" size="sm" asChild className="gap-1.5 text-xs">
                                <Link href="/trips">
                                    <Briefcase className="w-3.5 h-3.5 text-brand-primary" />
                                    My Trips
                                </Link>
                            </Button>
                            {isPartner && (
                                <Button size="sm" asChild className="gap-1.5 text-xs bg-brand-primary text-white">
                                    <Link href="/admin/hotel">
                                        <Hotel className="w-3.5 h-3.5" />
                                        Hotel Portal
                                    </Link>
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Section Switcher Tabs */}
                    <div className="mt-6 flex border-b border-slate-200 dark:border-slate-700 -mb-6">
                        <button
                            type="button"
                            onClick={() => setActiveTab("guest")}
                            className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-bold transition-all ${
                                activeTab === "guest"
                                    ? "border-brand-primary text-brand-primary dark:text-teal-400"
                                    : "border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400"
                            }`}
                        >
                            <User className="h-4 w-4" />
                            Guest Profile (Personal)
                        </button>

                        <button
                            type="button"
                            onClick={() => setActiveTab("partner")}
                            className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-bold transition-all ${
                                activeTab === "partner"
                                    ? "border-brand-primary text-brand-primary dark:text-teal-400"
                                    : "border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400"
                            }`}
                        >
                            <Building2 className="h-4 w-4" />
                            List Your Hotel / Partner Extranet
                            {partnerStatus === "pending" && (
                                <span className="h-2 w-2 rounded-full bg-amber-500" />
                            )}
                        </button>
                    </div>
                </div>

                {/* Tab 1: Guest Personal Profile */}
                {activeTab === "guest" && (
                    <div className="space-y-8 p-6">
                        {/* Personal Contact Details */}
                        <div>
                            <h2 className="text-lg font-bold text-foreground mb-1">Personal Contact Details</h2>
                            <p className="text-xs text-muted-foreground mb-4">
                                Used to autofill reservations and deliver booking confirmations.
                            </p>
                            <ProfileBackendSection embedded onProfileSynced={onProfileSynced} />
                        </div>

                        <div className="border-t border-border dark:border-slate-700" />

                        {/* Account Role & Membership */}
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="role" className="text-muted-foreground font-semibold">
                                    Account Status
                                </Label>
                                <div className="relative">
                                    <Shield className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        id="role"
                                        value={
                                            user.role === "admin"
                                                ? "Super Admin"
                                                : isPartner
                                                  ? "Verified Hotel Partner"
                                                  : "BookAddis Verified Guest"
                                        }
                                        readOnly
                                        className={`${inputReadOnlyClass} capitalize`}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="joined" className="text-muted-foreground font-semibold">
                                    Member Since
                                </Label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        id="joined"
                                        value={
                                            user.createdAt?.toDate
                                                ? user.createdAt.toDate().toLocaleDateString("en-US", {
                                                      year: "numeric",
                                                      month: "long",
                                                      day: "numeric",
                                                  })
                                                : "Active Member"
                                        }
                                        readOnly
                                        className={inputReadOnlyClass}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="border-t border-border dark:border-slate-700" />

                        {/* Guest Referral & Personal Promo Code */}
                        <div className="rounded-2xl border border-indigo-200/80 bg-gradient-to-br from-indigo-50/80 via-white to-sky-50/50 p-5 shadow-xs dark:border-indigo-900/50 dark:bg-slate-900/80">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="space-y-1">
                                    <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400">
                                        <Gift className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                                        Your Personal Promo & Referral Code
                                    </span>
                                    <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                                        Give 10% Off, Share BookAddis
                                    </h3>
                                    <p className="text-xs text-slate-600 dark:text-slate-400 max-w-xl">
                                        Share your unique code with colleagues, friends, or family. When entered during hotel checkout or sign-up, they immediately receive 10% off their booking.
                                    </p>
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                    <div className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-800 rounded-xl px-3.5 py-2 shadow-xs">
                                        <span className="font-mono text-sm sm:text-base font-extrabold text-indigo-950 dark:text-indigo-200 tracking-wider">
                                            {promoCode}
                                        </span>
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="ghost"
                                            onClick={copyCodeToClipboard}
                                            className="h-8 px-2.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-950"
                                        >
                                            {copiedCode ? (
                                                <span className="flex items-center gap-1 text-emerald-600">
                                                    <Check className="w-3.5 h-3.5" /> Copied
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-1">
                                                    <Copy className="w-3.5 h-3.5" /> Copy Code
                                                </span>
                                            )}
                                        </Button>
                                    </div>
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        onClick={copyLinkToClipboard}
                                        className="h-10 text-xs font-semibold border-indigo-200 hover:bg-indigo-50 dark:border-indigo-800 dark:hover:bg-slate-800"
                                    >
                                        {copiedLink ? (
                                            <span className="flex items-center gap-1 text-emerald-600">
                                                <Check className="w-3.5 h-3.5" /> Link Copied
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-1">
                                                <Copy className="w-3.5 h-3.5" /> Copy Invite Link
                                            </span>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </div>

                        <div className="border-t border-border dark:border-slate-700" />

                        {/* Guest Travel & Booking Preferences */}
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h2 className="text-lg font-bold text-foreground">Travel & Booking Preferences</h2>
                                    <p className="text-xs text-muted-foreground">
                                        Customize your preferred currency and default room requirements.
                                    </p>
                                </div>
                                {prefSaved && (
                                    <span className="flex items-center gap-1 text-xs font-bold text-emerald-600">
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                        Preferences Saved
                                    </span>
                                )}
                            </div>

                            <form onSubmit={saveGuestPreferences} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                        <Coins className="w-4 h-4 text-slate-400" />
                                        Display Currency
                                    </Label>
                                    <select
                                        value={preferredCurrency}
                                        onChange={(e) => setPreferredCurrency(e.target.value)}
                                        className="w-full h-10 rounded-xl border border-slate-300 bg-white dark:bg-slate-800 px-3 text-sm focus:ring-2 focus:ring-brand-primary"
                                    >
                                        <option value="ETB">ETB — Ethiopian Birr (Local)</option>
                                        <option value="USD">USD — US Dollar (International)</option>
                                        <option value="EUR">EUR — Euro</option>
                                        <option value="GBP">GBP — British Pound</option>
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                        <Globe className="w-4 h-4 text-slate-400" />
                                        Preferred Language
                                    </Label>
                                    <select
                                        value={preferredLanguage}
                                        onChange={(e) => setPreferredLanguage(e.target.value)}
                                        className="w-full h-10 rounded-xl border border-slate-300 bg-white dark:bg-slate-800 px-3 text-sm focus:ring-2 focus:ring-brand-primary"
                                    >
                                        <option value="en">English (English)</option>
                                        <option value="am">አማርኛ (Amharic)</option>
                                    </select>
                                </div>

                                <div className="space-y-2 sm:col-span-2">
                                    <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                        Default Special Requests (Autofilled at Checkout)
                                    </Label>
                                    <Input
                                        value={travelNotes}
                                        onChange={(e) => setTravelNotes(e.target.value)}
                                        placeholder="e.g. Non-smoking room, high floor, late arrival notice, airport shuttle..."
                                        className="text-sm"
                                    />
                                </div>

                                <div className="sm:col-span-2 flex justify-end">
                                    <Button type="submit" variant="outline" size="sm" className="text-xs">
                                        Save Guest Preferences
                                    </Button>
                                </div>
                            </form>
                        </div>

                        {/* Clean Invitation to List Property for Guests */}
                        {!isPartner && (
                            <div className="rounded-2xl border border-teal-200 bg-teal-50/50 p-5 dark:border-teal-900 dark:bg-teal-950/20">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div className="space-y-1">
                                        <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-teal-800 dark:text-teal-300">
                                            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                                            Own a hotel or guest house in Ethiopia?
                                        </span>
                                        <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                                            List your property on BookAddis
                                        </h3>
                                        <p className="text-xs text-slate-600 dark:text-slate-400 max-w-xl">
                                            Reach domestic and international travelers, take CBE Birr and card payments,
                                            and manage availability effortlessly with 0% commission for your first 30 days.
                                        </p>
                                    </div>
                                    <Button
                                        type="button"
                                        onClick={() => setActiveTab("partner")}
                                        className="shrink-0 bg-brand-primary hover:bg-brand-secondary text-white gap-2 text-xs"
                                    >
                                        List Your Property
                                        <ArrowRight className="w-3.5 h-3.5" />
                                    </Button>
                                </div>
                            </div>
                        )}

                        <div className="flex flex-col gap-3 border-t border-border pt-4 dark:border-slate-700 sm:flex-row sm:justify-between">
                            <Button variant="outline" asChild className="min-h-[44px] dark:border-slate-600 dark:hover:bg-slate-800">
                                <Link href="/settings">Account & Security Settings</Link>
                            </Button>
                        </div>
                    </div>
                )}

                {/* Tab 2: Hotel Partner / Property Management */}
                {activeTab === "partner" && (
                    <div className="space-y-6 p-6">
                        {/* Informational Scope Alert */}
                        <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-4 dark:border-blue-900 dark:bg-blue-950/30 text-xs text-blue-900 dark:text-blue-200 flex items-start gap-3">
                            <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                            <div>
                                <span className="font-bold">Business Partner Section: </span>
                                This section is dedicated to hoteliers, resort operators, and property managers.
                                <strong> Regular guests booking stays do NOT require a TIN number</strong> or commercial registration. Business documents are solely used for commercial verification and commission settlement.
                            </div>
                        </div>

                        {/* State A: Already Approved Hotel Partner */}
                        {isPartner ? (
                            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-6 space-y-4">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="h-12 w-12 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-800">
                                            <Hotel className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-slate-900">
                                                Verified Hotel Partner
                                            </h3>
                                            <p className="text-xs text-slate-600">
                                                Your property is active on BookAddis. Manage rates, calendar, shuttles, and guest reservations in the Extranet.
                                            </p>
                                        </div>
                                    </div>
                                    <span className="rounded-full bg-emerald-200 text-emerald-900 px-3 py-1 text-xs font-bold">
                                        Active
                                    </span>
                                </div>

                                <div className="pt-2 flex flex-wrap gap-3">
                                    <Button asChild className="bg-brand-primary text-white gap-2">
                                        <Link href="/admin/hotel">
                                            Open Hotel Extranet
                                            <ExternalLink className="w-4 h-4" />
                                        </Link>
                                    </Button>
                                    <Button variant="outline" asChild>
                                        <Link href="/partner/pending">
                                            View Digital Agreement
                                        </Link>
                                    </Button>
                                </div>
                            </div>
                        ) : partnerStatus === "pending" ? (
                            /* State B: Partner Application Pending Review */
                            <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-6 space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="h-12 w-12 rounded-xl bg-amber-100 flex items-center justify-center text-amber-800">
                                        <Building2 className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900">
                                            Partner Application Under Review
                                        </h3>
                                        <p className="text-xs text-slate-600">
                                            Your hotel property KYC and digital contract have been submitted to BookAddis Super Admin for verification.
                                        </p>
                                    </div>
                                </div>
                                <Button asChild variant="outline" className="border-amber-300 text-amber-900 bg-white">
                                    <Link href="/partner/pending">
                                        Check Application Status & Documents &rarr;
                                    </Link>
                                </Button>
                            </div>
                        ) : partnerStatus === "draft" ? (
                            /* State C: Draft Registration */
                            <div className="rounded-2xl border border-teal-200 bg-teal-50/50 p-6 space-y-4">
                                <div className="flex items-center gap-3">
                                    <Hotel className="w-6 h-6 text-teal-800" />
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900">
                                            Continue Hotel Partner Registration
                                        </h3>
                                        <p className="text-xs text-slate-600">
                                            You started a property application. Complete your property info and digital agreement to launch.
                                        </p>
                                    </div>
                                </div>
                                <Button asChild className="bg-teal-800 text-white">
                                    <Link href="/signup?type=hotel_partner">
                                        Continue Step-by-Step Registration &rarr;
                                    </Link>
                                </Button>
                            </div>
                        ) : (
                            /* State D: Standard Guest - Partner Program Overview + Application Trigger */
                            <div className="space-y-6">
                                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
                                    <div className="space-y-1">
                                        <span className="text-xs font-bold text-brand-primary uppercase tracking-wider">
                                            Grow Your Direct Bookings
                                        </span>
                                        <h2 className="text-xl font-extrabold text-brand-dark">
                                            Partner with BookAddis — Ethiopia&apos;s Leading Travel Network
                                        </h2>
                                        <p className="text-sm text-slate-600 max-w-2xl leading-relaxed">
                                            List your hotel, boutique lodge, or conference venue. Benefit from zero recurring SaaS fees, automated CBE Birr and foreign currency settlements, and direct integration with local rides and airport shuttles.
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                                        <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50">
                                            <div className="font-bold text-sm text-brand-dark">0% Intro Commission</div>
                                            <p className="text-xs text-slate-500 mt-1">Enjoy zero commission fees for your first 30 days of direct bookings.</p>
                                        </div>
                                        <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50">
                                            <div className="font-bold text-sm text-brand-dark">Local & Foreign Payouts</div>
                                            <p className="text-xs text-slate-500 mt-1">Direct CBE account settlements for local guests and MPGS card payouts for diaspora.</p>
                                        </div>
                                        <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50">
                                            <div className="font-bold text-sm text-brand-dark">Airport & City Shuttles</div>
                                            <p className="text-xs text-slate-500 mt-1">Offer integrated transfer add-ons directly through your hotel property extranet.</p>
                                        </div>
                                    </div>

                                    <div className="pt-2">
                                        {!showPartnerForm ? (
                                            <Button
                                                onClick={() => setShowPartnerForm(true)}
                                                className="bg-brand-primary hover:bg-brand-secondary text-white gap-2"
                                            >
                                                <Hotel className="w-4 h-4" />
                                                Start Property Registration (TIN Required for Partners)
                                            </Button>
                                        ) : (
                                            <Button
                                                variant="outline"
                                                onClick={() => setShowPartnerForm(false)}
                                                className="text-xs"
                                            >
                                                Collapse Registration Form
                                            </Button>
                                        )}
                                    </div>
                                </div>

                                {showPartnerForm && (
                                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                                        <HotelPartnerRequestForm />
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </AccountShell>
    );
}
