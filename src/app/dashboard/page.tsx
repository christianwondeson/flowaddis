"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useRequireSignedIn } from "@/hooks/use-require-signed-in";
import { AccountShell } from "@/components/account/account-shell";
import { AccountOverviewStats } from "@/components/account/account-overview-stats";
import { MyTripsList } from "@/components/trips/my-trips-list";
import { useMyTripsData } from "@/hooks/use-my-trips-data";
import { canAccessSuperAdmin, isHotelPortalRole } from "@/lib/auth-helpers";
import { Skeleton } from "@/components/ui/skeleton";

export default function CustomerDashboard() {
    const { user, loading } = useRequireSignedIn();
    const router = useRouter();
    const tripsData = useMyTripsData(user?.id, { enabled: !!user?.id && !canAccessSuperAdmin(user) && !isHotelPortalRole(user) });

    // Redirect admins and hotel operators to their dedicated management consoles immediately
    const isAdmin = Boolean(user && canAccessSuperAdmin(user));
    const isHotelStaff = Boolean(user && isHotelPortalRole(user));

    useEffect(() => {
        if (isAdmin) {
            router.replace('/admin');
        } else if (isHotelStaff) {
            router.replace('/admin/hotel');
        }
    }, [isAdmin, isHotelStaff, router]);

    // If user is admin or hotel partner, do not render customer dashboard or conflicting loaders
    if (isAdmin || isHotelStaff) {
        return null;
    }

    if (loading) {
        return (
            <AccountShell
                title="Overview"
                description="Track bookings from secure checkout and any trip bundles on your account."
            >
                <div className="space-y-6 animate-pulse">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <Skeleton className="h-28 rounded-2xl" />
                        <Skeleton className="h-28 rounded-2xl" />
                        <Skeleton className="h-28 rounded-2xl" />
                    </div>
                    <Skeleton className="h-64 rounded-2xl" />
                </div>
            </AccountShell>
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
