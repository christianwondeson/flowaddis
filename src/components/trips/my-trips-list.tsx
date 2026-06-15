"use client";

import React, { useMemo } from "react";
import type { UseMyTripsDataResult } from "@/hooks/use-my-trips-data";
import type { CustomerBookingSummary } from "@/types/customer-booking";
import type { Trip } from "@/store/trip-store";
import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/currency";
import {
    Plane,
    Hotel,
    Bus,
    Users,
    Calendar,
    CheckCircle,
    Loader2,
    CreditCard,
    AlertCircle,
    Clock,
    XCircle,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export type MyTripsListProps = {
    data: UseMyTripsDataResult;
    variant?: "full" | "summary";
    /** Used when variant is summary (default 3). */
    summaryLimit?: number;
};

function bookingStatusLabel(status: string): string {
    switch (status) {
        case "INITIATED":
            return "Awaiting payment";
        case "PAID":
        case "CONFIRMED":
            return "Confirmed";
        case "REFUNDED":
            return "Refunded";
        case "FAILED":
            return "Failed";
        case "EXPIRED":
            return "Payment expired";
        default:
            return status;
    }
}

function bookingStatusBadgeClass(status: string): string {
    switch (status) {
        case "INITIATED":
            return "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200";
        case "PAID":
        case "CONFIRMED":
            return "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-200";
        case "REFUNDED":
        case "FAILED":
            return "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-200";
        default:
            return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200";
    }
}

function StatusGlyph({ status }: { status: string }) {
    if (status === "INITIATED") return <Clock className="w-3 h-3" aria-hidden />;
    if (status === "REFUNDED" || status === "FAILED") return <XCircle className="w-3 h-3" aria-hidden />;
    return <CheckCircle className="w-3 h-3" aria-hidden />;
}

function BookingIcon({ bookingType }: { bookingType: string }) {
    const cls = "w-4 h-4 md:w-5 md:h-5";
    if (bookingType === "flight") return <Plane className={`${cls} text-teal-500`} />;
    if (bookingType === "hotel") return <Hotel className={`${cls} text-orange-500`} />;
    if (bookingType === "event") return <Users className={`${cls} text-purple-500`} />;
    if (bookingType === "car") return <Bus className={`${cls} text-green-500`} />;
    return <CreditCard className={`${cls} text-brand-primary`} />;
}

function BookingRowCard({ booking }: { booking: CustomerBookingSummary }) {
    return (
        <Card className="border-border/80 p-4 shadow-sm md:p-6 dark:border-slate-700 dark:bg-slate-900/40">
            <div className="mb-4 flex flex-col items-start justify-between gap-3 border-b border-border/60 pb-4 dark:border-slate-600 sm:flex-row">
                <div className="flex min-w-0 items-start gap-3">
                    <div className="shrink-0 rounded-full bg-muted/80 p-2 dark:bg-slate-800">
                        <BookingIcon bookingType={booking.booking_type} />
                    </div>
                    <div className="min-w-0">
                        <h3 className="truncate text-base font-bold text-brand-dark dark:text-foreground md:text-lg">
                            {booking.title}
                        </h3>
                        {booking.subtitle ? (
                            <p className="truncate text-sm text-muted-foreground">{booking.subtitle}</p>
                        ) : null}
                        <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                            <Calendar className="h-3.5 w-3.5 shrink-0" aria-hidden />
                            {new Date(booking.created_at).toLocaleString()}
                        </div>
                        <p className="mt-1 text-xs capitalize text-muted-foreground">
                            {booking.booking_type} · {booking.source}
                        </p>
                    </div>
                </div>
                <div className="w-full shrink-0 text-left sm:w-auto sm:text-right">
                    <div className="text-xl font-bold text-brand-primary">
                        {formatCurrency(booking.amount, booking.currency)}
                    </div>
                    <span
                        className={`mt-1 inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-bold ${bookingStatusBadgeClass(booking.status)}`}
                    >
                        <StatusGlyph status={booking.status} /> {bookingStatusLabel(booking.status)}
                    </span>
                </div>
            </div>
            <p className="break-all font-mono text-xs text-muted-foreground">
                Ref: {booking.payment_reference || booking.id}
            </p>
        </Card>
    );
}

function FirestoreTripCard({ trip }: { trip: Trip }) {
    return (
        <Card className="border-border/80 border-dashed p-4 shadow-sm md:p-6 dark:border-slate-700 dark:bg-slate-900/40">
            <div className="mb-4 flex flex-col items-start justify-between gap-3 border-b border-border/60 pb-4 dark:border-slate-600 sm:flex-row">
                <div>
                    <h3 className="text-base font-bold text-brand-dark dark:text-foreground md:text-lg">
                        Trip bundle #{trip.id.slice(0, 8)}
                    </h3>
                    <p className="text-xs text-muted-foreground">Saved bundle (legacy cart checkout)</p>
                    <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" aria-hidden />
                        {new Date(trip.date).toLocaleDateString()}
                    </div>
                </div>
                <div className="w-full text-left sm:w-auto sm:text-right">
                    <div className="text-xl font-bold text-brand-primary">{formatCurrency(trip.totalAmount)}</div>
                    <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-muted px-2 py-1 text-xs font-bold text-foreground dark:bg-slate-800">
                        {trip.status}
                    </span>
                </div>
            </div>

            <div className="space-y-3 md:space-y-4">
                {trip.items.map((item, idx) => (
                    <div
                        key={idx}
                        className="flex items-center gap-3 rounded-xl bg-muted/50 p-3 dark:bg-slate-800/80 md:gap-4"
                    >
                        <div className="shrink-0 rounded-full bg-card p-2 shadow-sm dark:bg-slate-700">
                            {item.type === "flight" && <Plane className="h-4 w-4 text-teal-500 md:h-5 md:w-5" />}
                            {item.type === "hotel" && <Hotel className="h-4 w-4 text-orange-500 md:h-5 md:w-5" />}
                            {item.type === "shuttle" && <Bus className="h-4 w-4 text-green-500 md:h-5 md:w-5" />}
                            {item.type === "conference" && <Users className="h-4 w-4 text-purple-500 md:h-5 md:w-5" />}
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-sm font-bold capitalize text-foreground md:text-base">{item.type}</p>
                            <p className="truncate text-xs text-muted-foreground md:text-sm">
                                {item.details?.name ||
                                    item.details?.airline ||
                                    item.details?.serviceName ||
                                    item.details?.type}
                            </p>
                        </div>
                        <div className="shrink-0 text-sm font-bold text-foreground md:text-base">
                            {formatCurrency(item.price)}
                        </div>
                    </div>
                ))}
            </div>
        </Card>
    );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
    return (
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">{children}</h2>
    );
}

export function MyTripsList({ data, variant = "full", summaryLimit = 3 }: MyTripsListProps) {
    const { bookings, firestoreTrips, loading, bookingsError } = data;

    const merged = useMemo(() => {
        type Row =
            | { kind: "booking"; sort: number; b: CustomerBookingSummary }
            | { kind: "firestore"; sort: number; t: Trip };
        const rows: Row[] = [
            ...bookings.map((b) => ({
                kind: "booking" as const,
                sort: new Date(b.created_at).getTime(),
                b,
            })),
            ...firestoreTrips.map((t) => ({
                kind: "firestore" as const,
                sort: new Date(t.date).getTime(),
                t,
            })),
        ];
        rows.sort((a, b) => b.sort - a.sort);
        return rows;
    }, [bookings, firestoreTrips]);

    const displayRows = useMemo(() => {
        if (variant !== "summary") return merged;
        return merged.slice(0, summaryLimit);
    }, [merged, variant, summaryLimit]);

    const hasMore = variant === "summary" && merged.length > displayRows.length;

    if (loading) {
        return (
            <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-brand-primary" aria-hidden />
            </div>
        );
    }

    return (
        <div className="space-y-6 md:space-y-8">
            {variant === "full" ? (
                <>
                    <SectionTitle>Timeline</SectionTitle>
                    <p className="-mt-4 mb-2 text-sm text-muted-foreground">
                        Card bookings first appear here after checkout; older trip bundles may show below.
                    </p>
                </>
            ) : (
                <SectionTitle>Recent activity</SectionTitle>
            )}

            {bookingsError ? (
                <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">
                    <AlertCircle className="h-4 w-4 shrink-0" aria-hidden />
                    {bookingsError}
                </div>
            ) : null}

            {displayRows.length === 0 ? (
                <Card className="border-dashed p-8 text-center dark:border-slate-600">
                    <p className="mx-auto max-w-md text-muted-foreground">
                        {variant === "summary"
                            ? "No recent bookings yet."
                            : "No bookings yet. Search flights or hotels and complete checkout to see them here."}
                    </p>
                    {variant === "full" ? (
                        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
                            <Button asChild variant="outline" className="min-h-[44px] rounded-xl">
                                <Link href="/flights">Search flights</Link>
                            </Button>
                            <Button asChild variant="outline" className="min-h-[44px] rounded-xl">
                                <Link href="/hotels">Browse hotels</Link>
                            </Button>
                        </div>
                    ) : (
                        <Button asChild className="mt-6 min-h-[44px] rounded-xl">
                            <Link href="/trips">View all trips</Link>
                        </Button>
                    )}
                </Card>
            ) : (
                <div className="space-y-4 md:space-y-6">
                    {displayRows.map((row) =>
                        row.kind === "booking" ? (
                            <BookingRowCard key={`b-${row.b.id}`} booking={row.b} />
                        ) : (
                            <FirestoreTripCard key={`t-${row.t.id}`} trip={row.t} />
                        ),
                    )}
                    {hasMore ? (
                        <div className="flex justify-center pt-2">
                            <Button asChild variant="outline" size="lg" className="min-h-[48px] rounded-xl px-8">
                                <Link href="/trips">View all trips and bookings</Link>
                            </Button>
                        </div>
                    ) : null}
                </div>
            )}
        </div>
    );
}
