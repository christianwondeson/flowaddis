"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { cmsCreate } from "@/lib/admin-cms-client";
import { Preloader } from "@/components/ui/preloader";
import { withRequestLoading } from "@/lib/request-loading";

interface ShuttleFormProps {
    onCancel: () => void;
    onSuccess?: () => void;
}

/**
 * Realistic airport / city shuttle product form (OTA-style).
 */
export const ShuttleForm: React.FC<ShuttleFormProps> = ({ onCancel, onSuccess }) => {
    const [name, setName] = useState("");
    const [routeType, setRouteType] = useState<"airport_transfer" | "city" | "hotel_link">(
        "airport_transfer",
    );
    const [vehicleType, setVehicleType] = useState("sedan");
    const [pickup, setPickup] = useState("Bole International Airport (ADD)");
    const [dropoff, setDropoff] = useState("");
    const [direction, setDirection] = useState<"one_way" | "round_trip">("one_way");
    const [schedule, setSchedule] = useState("On demand · 24/7 flight tracking");
    const [capacity, setCapacity] = useState("3");
    const [luggage, setLuggage] = useState("2");
    const [priceEtb, setPriceEtb] = useState("");
    const [priceUsd, setPriceUsd] = useState("");
    const [currency, setCurrency] = useState<"ETB" | "USD">("ETB");
    const [meetGreet, setMeetGreet] = useState(true);
    const [childSeat, setChildSeat] = useState(false);
    const [flightTracking, setFlightTracking] = useState(true);
    const [notes, setNotes] = useState("");
    const [status, setStatus] = useState<"Active" | "Inactive" | "Maintenance">("Active");
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const cap = parseInt(capacity, 10);
        const bags = parseInt(luggage, 10);
        const price = Number(currency === "ETB" ? priceEtb : priceUsd);
        if (
            !name.trim() ||
            !pickup.trim() ||
            !dropoff.trim() ||
            !schedule.trim() ||
            !Number.isFinite(cap) ||
            cap < 1 ||
            !Number.isFinite(price) ||
            price <= 0
        ) {
            toast.error("Fill required fields with a valid capacity and price.");
            return;
        }
        setSubmitting(true);
        try {
            await withRequestLoading(async () => {
                await cmsCreate("shuttles", {
                    name: name.trim(),
                    vehicle_type: vehicleType,
                    route_type: routeType,
                    pickup_location: pickup.trim(),
                    dropoff_location: dropoff.trim(),
                    direction,
                    schedule: schedule.trim(),
                    capacity: cap,
                    luggage_capacity: Number.isFinite(bags) ? bags : undefined,
                    price,
                    currency,
                    price_etb: priceEtb ? Number(priceEtb) : undefined,
                    price_usd: priceUsd ? Number(priceUsd) : undefined,
                    meet_and_greet: meetGreet,
                    child_seat: childSeat,
                    flight_tracking: flightTracking,
                    notes: notes.trim() || undefined,
                    status,
                });
            }, "Saving shuttle…");
            toast.success("Shuttle product saved.");
            onSuccess?.();
            onCancel();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Save failed");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <form
            onSubmit={(e) => void handleSubmit(e)}
            className="space-y-6 max-h-[70vh] overflow-y-auto pr-1"
        >
            {submitting ? (
                <div className="py-6">
                    <Preloader size="md" label="Saving shuttle…" />
                </div>
            ) : null}

            <p className="text-xs text-slate-500">
                Modelled on airport-transfer desks (fixed route, vehicle class, meet & greet,
                luggage). Guests pick this as an add-on at booking.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2">
                    <Label>Product name</Label>
                    <Input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="ADD Airport → City hotel private transfer"
                        required
                    />
                </div>
                <div className="space-y-2">
                    <Label>Route type</Label>
                    <select
                        className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                        value={routeType}
                        onChange={(e) => setRouteType(e.target.value as typeof routeType)}
                    >
                        <option value="airport_transfer">Airport transfer</option>
                        <option value="city">City shuttle</option>
                        <option value="hotel_link">Hotel ↔ hotel link</option>
                    </select>
                </div>
                <div className="space-y-2">
                    <Label>Vehicle class</Label>
                    <select
                        className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                        value={vehicleType}
                        onChange={(e) => setVehicleType(e.target.value)}
                    >
                        <option value="sedan">Sedan (1–3 guests)</option>
                        <option value="suv">SUV</option>
                        <option value="minivan">Minivan (4–6)</option>
                        <option value="minibus">Minibus (8–14)</option>
                        <option value="coach">Coach</option>
                    </select>
                </div>
                <div className="space-y-2">
                    <Label>Pickup</Label>
                    <Input
                        value={pickup}
                        onChange={(e) => setPickup(e.target.value)}
                        required
                    />
                </div>
                <div className="space-y-2">
                    <Label>Drop-off</Label>
                    <Input
                        value={dropoff}
                        onChange={(e) => setDropoff(e.target.value)}
                        placeholder="Hotel / city area"
                        required
                    />
                </div>
                <div className="space-y-2">
                    <Label>Direction</Label>
                    <select
                        className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                        value={direction}
                        onChange={(e) => setDirection(e.target.value as typeof direction)}
                    >
                        <option value="one_way">One way</option>
                        <option value="round_trip">Round trip</option>
                    </select>
                </div>
                <div className="space-y-2">
                    <Label>Schedule / operating window</Label>
                    <Input
                        value={schedule}
                        onChange={(e) => setSchedule(e.target.value)}
                        required
                    />
                </div>
                <div className="space-y-2">
                    <Label>Passenger seats</Label>
                    <Input
                        type="number"
                        min={1}
                        value={capacity}
                        onChange={(e) => setCapacity(e.target.value)}
                        required
                    />
                </div>
                <div className="space-y-2">
                    <Label>Luggage pieces (approx.)</Label>
                    <Input
                        type="number"
                        min={0}
                        value={luggage}
                        onChange={(e) => setLuggage(e.target.value)}
                    />
                </div>
                <div className="space-y-2">
                    <Label>Sell currency</Label>
                    <select
                        className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                        value={currency}
                        onChange={(e) =>
                            setCurrency(e.target.value === "USD" ? "USD" : "ETB")
                        }
                    >
                        <option value="ETB">ETB</option>
                        <option value="USD">USD</option>
                    </select>
                </div>
                <div className="space-y-2">
                    <Label>Price (ETB)</Label>
                    <Input
                        type="number"
                        min={0}
                        value={priceEtb}
                        onChange={(e) => setPriceEtb(e.target.value)}
                        placeholder="2500"
                    />
                </div>
                <div className="space-y-2">
                    <Label>Price (USD)</Label>
                    <Input
                        type="number"
                        min={0}
                        value={priceUsd}
                        onChange={(e) => setPriceUsd(e.target.value)}
                        placeholder="45"
                    />
                </div>
                <div className="space-y-2">
                    <Label>Status</Label>
                    <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value as typeof status)}
                        className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                    >
                        <option value="Active">Active (bookable)</option>
                        <option value="Inactive">Inactive</option>
                        <option value="Maintenance">Maintenance</option>
                    </select>
                </div>
            </div>

            <div className="flex flex-wrap gap-4 text-sm">
                <label className="inline-flex items-center gap-2">
                    <input
                        type="checkbox"
                        checked={meetGreet}
                        onChange={(e) => setMeetGreet(e.target.checked)}
                    />
                    Meet & greet at arrivals
                </label>
                <label className="inline-flex items-center gap-2">
                    <input
                        type="checkbox"
                        checked={flightTracking}
                        onChange={(e) => setFlightTracking(e.target.checked)}
                    />
                    Flight delay tracking
                </label>
                <label className="inline-flex items-center gap-2">
                    <input
                        type="checkbox"
                        checked={childSeat}
                        onChange={(e) => setChildSeat(e.target.checked)}
                    />
                    Child seat on request
                </label>
            </div>

            <div className="space-y-2">
                <Label>Driver / ops notes</Label>
                <textarea
                    className="w-full border rounded-xl px-3 py-2 text-sm min-h-[80px]"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Free waiting time, night surcharge, hotel desk phone…"
                />
            </div>

            <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
                    Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                    Save shuttle
                </Button>
            </div>
        </form>
    );
};
