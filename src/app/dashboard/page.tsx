"use client";

import React from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { AccountShell } from "@/components/account/account-shell";
import { AccountOverviewStats } from "@/components/account/account-overview-stats";
import { MyTripsList } from "@/components/trips/my-trips-list";
import { useMyTripsData } from "@/hooks/use-my-trips-data";
import { Loader2 } from "lucide-react";

export default function CustomerDashboard() {
    const { user, loading } = useAuth();
    const tripsData = useMyTripsData(user?.id, { enabled: !!user?.id });

    if (loading) {
        return (
            <div className="flex min-h-[50vh] flex-col items-center justify-center bg-brand-gray/30 pt-24 dark:bg-background">
                <Loader2 className="h-9 w-9 animate-spin text-brand-primary" aria-hidden />
                <p className="mt-3 text-sm text-muted-foreground">Loading your account…</p>
            </div>
        );
    }

    if (!user) {
        return null;
    }

    const firstName = user.name?.trim()?.split(/\s+/)[0];

    return (
        <AccountShell
            title="Overview"
            description="Track bookings from secure checkout and any trip bundles on your account."
        >
            <AccountOverviewStats data={tripsData} userFirstName={firstName} />
            <MyTripsList data={tripsData} variant="summary" summaryLimit={3} />
        </AccountShell>
    );
}
