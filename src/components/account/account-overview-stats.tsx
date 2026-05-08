"use client";

import Link from "next/link";
import { Plane, Hotel } from "lucide-react";
import type { UseMyTripsDataResult } from "@/hooks/use-my-trips-data";
import { Card } from "@/components/ui/card";

type Props = {
    data: UseMyTripsDataResult;
    userFirstName?: string;
};

export function AccountOverviewStats({ data, userFirstName }: Props) {
    const { bookings, firestoreTrips, loading } = data;

    if (loading) {
        return (
            <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Card className="h-24 animate-pulse bg-muted/50 dark:bg-slate-800/50" />
                <Card className="h-24 animate-pulse bg-muted/50 dark:bg-slate-800/50" />
            </div>
        );
    }

    const greeting = userFirstName?.trim()
        ? `Welcome back, ${userFirstName.trim()}`
        : "Welcome back";

    return (
        <div className="mb-8 space-y-4">
            <p className="text-lg font-semibold text-foreground">{greeting}</p>
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <Card className="border-border/80 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/50">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Bookings</p>
                    <p className="mt-1 text-2xl font-bold text-brand-primary tabular-nums">{bookings.length}</p>
                    <p className="mt-1 text-xs text-muted-foreground">Stripe and verified prices</p>
                </Card>
                <Card className="border-border/80 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/50">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Trip bundles</p>
                    <p className="mt-1 text-2xl font-bold text-brand-primary tabular-nums">{firestoreTrips.length}</p>
                    <p className="mt-1 text-xs text-muted-foreground">Saved bundles</p>
                </Card>
            </div>
            <div className="flex flex-wrap gap-3">
                <Link
                    href="/flights"
                    className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground shadow-sm transition-colors hover:bg-muted dark:border-slate-600 dark:hover:bg-slate-800"
                >
                    <Plane className="h-4 w-4 text-teal-600" aria-hidden />
                    Flights
                </Link>
                <Link
                    href="/hotels"
                    className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground shadow-sm transition-colors hover:bg-muted dark:border-slate-600 dark:hover:bg-slate-800"
                >
                    <Hotel className="h-4 w-4 text-orange-500" aria-hidden />
                    Hotels
                </Link>
            </div>
        </div>
    );
}
