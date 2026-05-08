"use client";

import React from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { AccountShell } from "@/components/account/account-shell";
import { MyTripsList } from "@/components/trips/my-trips-list";
import { useMyTripsData } from "@/hooks/use-my-trips-data";
import { Loader2 } from "lucide-react";

export default function TripsPage() {
    const { user, loading } = useAuth();
    const tripsData = useMyTripsData(user?.id, { enabled: !!user?.id });

    if (loading) {
        return (
            <div className="flex min-h-[50vh] flex-col items-center justify-center bg-brand-gray/30 pt-24 dark:bg-background">
                <Loader2 className="h-9 w-9 animate-spin text-brand-primary" aria-hidden />
                <p className="mt-3 text-sm text-muted-foreground">Loading trips…</p>
            </div>
        );
    }

    if (!user) {
        return null;
    }

    return (
        <AccountShell
            title="Trips and bookings"
            description="Full timeline of Nest bookings (flight, hotel) and legacy Firestore trip bundles."
        >
            <MyTripsList data={tripsData} variant="full" />
        </AccountShell>
    );
}
