"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { cmsCreate } from "@/lib/admin-cms-client";
import { Preloader } from "@/components/ui/preloader";
import { withRequestLoading } from "@/lib/request-loading";
import { Bus, Sparkles, MapPin, Clock, DollarSign, ShieldCheck, Car } from "lucide-react";

interface ShuttleFormProps {
    onCancel: () => void;
    onSuccess?: () => void;
}

interface ShuttlePreset {
    label: string;
    name: string;
    vehicleType: string;
    pickup: string;
    dropoff: string;
    schedule: string;
    capacity: number;
    priceEtb: number;
    priceUsd: number;
    plateNumber: string;
    notes: string;
}

const REALISTIC_SHUTTLE_PRESETS: ShuttlePreset[] = [
    {
        label: "Bole T2 (Int'l) → Hotel (HiAce Van)",
        name: "Bole Int'l Airport (T2) ⇄ Hotel Private Transfer",
        vehicleType: "Toyota HiAce Minivan (6–9 seats)",
        pickup: "Bole International Airport (ADD) - Terminal 2 International Arrivals",
        dropoff: "Hotel Lobby / Central Addis Ababa (Bole & Kazanchis)",
        schedule: "24/7 On Demand · Flight Delay Tracking Included",
        capacity: 6,
        priceEtb: 2500,
        priceUsd: 20,
        plateNumber: "ET-3-A12345",
        notes: "Meet & Greet with personalized name sign at Gate 2. 60 mins free waiting time for immigration & baggage clearance.",
    },
    {
        label: "Bole T1 (Domestic) → Hotel (Sedan)",
        name: "Bole Domestic Terminal (T1) ⇄ Hotel Executive Sedan",
        vehicleType: "Toyota Corolla / Executive Sedan (1–3 seats)",
        pickup: "Bole International Airport (ADD) - Terminal 1 Domestic Arrivals",
        dropoff: "Hotel Lobby / City Area",
        schedule: "06:00 - 22:00 Daily · Coordinated with domestic arrivals",
        capacity: 3,
        priceEtb: 1800,
        priceUsd: 15,
        plateNumber: "ET-3-B54321",
        notes: "Direct transfer for domestic passengers. Luggage assist included.",
    },
    {
        label: "Hotel ⇄ AU Headquarters (Coaster)",
        name: "Hotel ⇄ African Union (AU) Headquarters Executive Shuttle",
        vehicleType: "Toyota Coaster Minibus (14–22 seats)",
        pickup: "Hotel Main Entrance & Concierge Desk",
        dropoff: "African Union Headquarters (Roosevelt St, Addis Ababa)",
        schedule: "Every 45 mins during conference hours (07:30 - 19:30)",
        capacity: 18,
        priceEtb: 1200,
        priceUsd: 10,
        plateNumber: "ET-3-C98765",
        notes: "Dedicated conference delegate shuttle. Fast drop-off at AU Gate 1 security pavilion.",
    },
    {
        label: "Hotel ⇄ UNECA Conference Link",
        name: "Hotel ⇄ UNECA Conference Centre Group Link",
        vehicleType: "Toyota Coaster Minibus (14–22 seats)",
        pickup: "Hotel Main Gate",
        dropoff: "UNECA Conference Centre (Menelik II Ave)",
        schedule: "Scheduled morning (08:00, 08:30) & evening (17:30, 18:30)",
        capacity: 20,
        priceEtb: 1000,
        priceUsd: 8,
        plateNumber: "ET-3-C45678",
        notes: "UN delegate credential check assisted. Wi-Fi equipped vehicle.",
    },
    {
        label: "Hotel ⇄ Entoto Park (Prado 4x4)",
        name: "Addis Ababa Hotels ⇄ Entoto Natural Park Day Tour",
        vehicleType: "Toyota RAV4 / Prado 4x4 (Executive SUV)",
        pickup: "Hotel Concierge / Guest Pick-up",
        dropoff: "Entoto Natural Park & Viewpoint",
        schedule: "Departures at 09:00 & 14:00 (Round Trip with 3hr stay)",
        capacity: 4,
        priceEtb: 4500,
        priceUsd: 35,
        plateNumber: "ET-3-D11223",
        notes: "Private scenic tour. Certified mountain driver, includes chilled water.",
    },
    {
        label: "Addis ⇄ Bishoftu Resorts (Coaster)",
        name: "Addis Ababa ⇄ Bishoftu (Debre Zeyit) Crater Lakes Shuttle",
        vehicleType: "Toyota Coaster Minibus (14–22 seats)",
        pickup: "Bole Airport / Meskel Square Hub",
        dropoff: "Bishoftu Resort Strip (Kuriftu / Babogaya Resorts)",
        schedule: "Friday 16:30 & Saturday 09:00 (Returns Sunday 17:00)",
        capacity: 18,
        priceEtb: 3500,
        priceUsd: 28,
        plateNumber: "ET-3-C77889",
        notes: "Weekend expressway express transfer. Direct resort drop-off.",
    },
];

const VEHICLE_OPTIONS = [
    "Toyota HiAce Minivan (6–9 seats)",
    "Toyota Coaster Minibus (14–22 seats)",
    "Toyota RAV4 / Prado 4x4 (Executive SUV)",
    "Toyota Corolla / Executive Sedan (1–3 seats)",
    "Luxury VIP Van (Executive Leather · 5–7 seats)",
    "Large Tour Coach (30–45 seats)",
];

const POPULAR_PICKUPS = [
    "Bole International Airport (ADD) - Terminal 2 International Arrivals",
    "Bole International Airport (ADD) - Terminal 1 Domestic Arrivals",
    "Bole International Airport (ADD) - VIP Lounge / Protocol Gate",
    "Hotel Lobby / Main Entrance",
    "African Union (AU) Headquarters (Roosevelt St)",
    "UNECA Conference Centre (Menelik II Ave)",
    "Meskel Square Hub / Stadium Area",
];

const POPULAR_DROPOFFS = [
    "Hotel Lobby / Central Addis Ababa (Bole & Kazanchis)",
    "Bole International Airport (ADD) - All Terminals",
    "African Union (AU) Headquarters (Roosevelt St, Addis Ababa)",
    "UNECA Conference Centre (Menelik II Ave)",
    "Entoto Natural Park & Viewpoint",
    "Bishoftu Resort Strip (Kuriftu / Babogaya)",
    "Addis Ababa Science Museum & Friendship Park",
];

export const ShuttleForm: React.FC<ShuttleFormProps> = ({ onCancel, onSuccess }) => {
    const defaultPreset = REALISTIC_SHUTTLE_PRESETS[0];

    const [name, setName] = useState(defaultPreset.name);
    const [vehicleType, setVehicleType] = useState(defaultPreset.vehicleType);
    const [pickup, setPickup] = useState(defaultPreset.pickup);
    const [dropoff, setDropoff] = useState(defaultPreset.dropoff);
    const [schedule, setSchedule] = useState(defaultPreset.schedule);
    const [capacity, setCapacity] = useState(String(defaultPreset.capacity));
    const [priceEtb, setPriceEtb] = useState(String(defaultPreset.priceEtb));
    const [priceUsd, setPriceUsd] = useState(String(defaultPreset.priceUsd));
    const [plateNumber, setPlateNumber] = useState(defaultPreset.plateNumber);
    const [driverName, setDriverName] = useState("");
    const [driverPhone, setDriverPhone] = useState("+251 9");
    const [meetGreet, setMeetGreet] = useState(true);
    const [flightTracking, setFlightTracking] = useState(true);
    const [childSeat, setChildSeat] = useState(false);
    const [notes, setNotes] = useState(defaultPreset.notes);
    const [status, setStatus] = useState<"Active" | "Inactive" | "Maintenance">("Active");
    const [submitting, setSubmitting] = useState(false);

    const applyPreset = (preset: ShuttlePreset) => {
        setName(preset.name);
        setVehicleType(preset.vehicleType);
        setPickup(preset.pickup);
        setDropoff(preset.dropoff);
        setSchedule(preset.schedule);
        setCapacity(String(preset.capacity));
        setPriceEtb(String(preset.priceEtb));
        setPriceUsd(String(preset.priceUsd));
        setPlateNumber(preset.plateNumber);
        setNotes(preset.notes);
        toast.info(`Applied template: ${preset.label}`);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const cap = parseInt(capacity, 10);
        if (
            !name.trim() ||
            !pickup.trim() ||
            !dropoff.trim() ||
            !schedule.trim() ||
            !Number.isFinite(cap) ||
            cap < 1
        ) {
            toast.error("Please fill all required route, vehicle and capacity fields.");
            return;
        }

        // Build comprehensive operational notes combining pricing, plate, driver, and perks
        const notesParts: string[] = [];
        if (priceEtb || priceUsd) {
            notesParts.push(`Fare: ${priceEtb ? `${Number(priceEtb).toLocaleString()} ETB` : ''}${priceEtb && priceUsd ? ' / ' : ''}${priceUsd ? `$${priceUsd} USD` : ''}`);
        }
        if (plateNumber.trim()) {
            notesParts.push(`Plate: ${plateNumber.trim().toUpperCase()}`);
        }
        if (driverName.trim()) {
            notesParts.push(`Driver: ${driverName.trim()}${driverPhone.trim() ? ` (${driverPhone.trim()})` : ''}`);
        }
        const perks: string[] = [];
        if (meetGreet) perks.push("Meet & Greet");
        if (flightTracking) perks.push("Flight Delay Tracking");
        if (childSeat) perks.push("Child Seat on Request");
        if (perks.length > 0) {
            notesParts.push(`Features: ${perks.join(', ')}`);
        }
        if (notes.trim()) {
            notesParts.push(notes.trim());
        }

        const combinedNotes = notesParts.join(" | ");

        setSubmitting(true);
        try {
            await withRequestLoading(async () => {
                await cmsCreate("shuttles", {
                    name: name.trim(),
                    vehicle_type: vehicleType.trim(),
                    pickup_location: pickup.trim(),
                    dropoff_location: dropoff.trim(),
                    schedule: schedule.trim(),
                    capacity: cap,
                    notes: combinedNotes,
                    status,
                });
            }, "Saving shuttle to CMS…");
            toast.success("Shuttle product saved to CMS.");
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
            className="space-y-6 max-h-[75vh] overflow-y-auto pr-1"
        >
            {submitting ? (
                <div className="py-6">
                    <Preloader size="md" label="Saving shuttle to CMS…" />
                </div>
            ) : null}

            {/* Quick Real-World Presets */}
            <div className="space-y-2 bg-slate-50 border border-slate-200 p-3.5 rounded-xl">
                <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5 uppercase tracking-wider">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        Realistic Ethiopian Shuttle & Transfer Presets
                    </span>
                    <span className="text-[11px] text-slate-500">1-click autofill</span>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                    {REALISTIC_SHUTTLE_PRESETS.map((p) => {
                        const isCurrent = name === p.name;
                        return (
                            <button
                                key={p.label}
                                type="button"
                                onClick={() => applyPreset(p)}
                                className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition-all ${
                                    isCurrent
                                        ? "bg-brand-primary text-white border-brand-primary shadow-sm"
                                        : "bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-100"
                                }`}
                            >
                                {p.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Product Name */}
                <div className="space-y-2 md:col-span-2">
                    <Label className="text-sm font-semibold text-slate-700">Shuttle Service Title</Label>
                    <Input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Bole Int'l Airport (T2) ⇄ Hotel Private Transfer"
                        required
                        className="text-sm font-medium"
                    />
                </div>

                {/* Vehicle Class */}
                <div className="space-y-2">
                    <Label className="text-sm font-semibold text-slate-700 flex items-center gap-1">
                        <Car className="w-3.5 h-3.5 text-slate-400" />
                        Vehicle Class
                    </Label>
                    <select
                        className="w-full h-10 rounded-xl border border-slate-300 bg-white px-3 text-sm focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
                        value={vehicleType}
                        onChange={(e) => setVehicleType(e.target.value)}
                    >
                        {VEHICLE_OPTIONS.map((v) => (
                            <option key={v} value={v}>
                                {v}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Capacity */}
                <div className="space-y-2">
                    <Label className="text-sm font-semibold text-slate-700">Passenger Capacity (Seats)</Label>
                    <Input
                        type="number"
                        min={1}
                        max={60}
                        value={capacity}
                        onChange={(e) => setCapacity(e.target.value)}
                        required
                        className="text-sm"
                    />
                </div>

                {/* Pickup Location */}
                <div className="space-y-2">
                    <Label className="text-sm font-semibold text-slate-700 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        Pickup Location
                    </Label>
                    <Input
                        value={pickup}
                        onChange={(e) => setPickup(e.target.value)}
                        placeholder="e.g. Bole Airport Terminal 2"
                        list="pickup-suggestions"
                        required
                        className="text-sm"
                    />
                    <datalist id="pickup-suggestions">
                        {POPULAR_PICKUPS.map((loc) => (
                            <option key={loc} value={loc} />
                        ))}
                    </datalist>
                </div>

                {/* Dropoff Location */}
                <div className="space-y-2">
                    <Label className="text-sm font-semibold text-slate-700 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        Drop-off Location
                    </Label>
                    <Input
                        value={dropoff}
                        onChange={(e) => setDropoff(e.target.value)}
                        placeholder="e.g. Hotel Lobby / Bole Area"
                        list="dropoff-suggestions"
                        required
                        className="text-sm"
                    />
                    <datalist id="dropoff-suggestions">
                        {POPULAR_DROPOFFS.map((loc) => (
                            <option key={loc} value={loc} />
                        ))}
                    </datalist>
                </div>

                {/* Schedule / Frequency */}
                <div className="space-y-2 md:col-span-2">
                    <Label className="text-sm font-semibold text-slate-700 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        Operating Schedule & Flight Tracking
                    </Label>
                    <Input
                        value={schedule}
                        onChange={(e) => setSchedule(e.target.value)}
                        placeholder="e.g. 24/7 On Demand · Flight Delay Tracking Included"
                        required
                        className="text-sm"
                    />
                </div>

                {/* Price (ETB) */}
                <div className="space-y-2">
                    <Label className="text-sm font-semibold text-slate-700 flex items-center gap-1">
                        <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                        Fare (ETB)
                    </Label>
                    <Input
                        type="number"
                        min={0}
                        step="50"
                        value={priceEtb}
                        onChange={(e) => setPriceEtb(e.target.value)}
                        placeholder="2500"
                        className="text-sm"
                    />
                </div>

                {/* Price (USD Equivalent) */}
                <div className="space-y-2">
                    <Label className="text-sm font-semibold text-slate-700 flex items-center gap-1">
                        <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                        Fare (USD Equivalent)
                    </Label>
                    <Input
                        type="number"
                        min={0}
                        step="1"
                        value={priceUsd}
                        onChange={(e) => setPriceUsd(e.target.value)}
                        placeholder="20"
                        className="text-sm"
                    />
                </div>

                {/* Ethiopian Plate Number */}
                <div className="space-y-2">
                    <Label className="text-sm font-semibold text-slate-700">Vehicle Plate Number (Ethiopia)</Label>
                    <Input
                        value={plateNumber}
                        onChange={(e) => setPlateNumber(e.target.value)}
                        placeholder="e.g. ET-3-A12345 (Code 3)"
                        className="font-mono text-sm uppercase"
                    />
                </div>

                {/* Status */}
                <div className="space-y-2">
                    <Label className="text-sm font-semibold text-slate-700">Status</Label>
                    <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value as typeof status)}
                        className="w-full h-10 rounded-xl border border-slate-300 bg-white px-3 text-sm focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
                    >
                        <option value="Active">Active (Bookable)</option>
                        <option value="Inactive">Inactive</option>
                        <option value="Maintenance">Maintenance</option>
                    </select>
                </div>

                {/* Driver Name & Phone */}
                <div className="space-y-2">
                    <Label className="text-sm font-semibold text-slate-700">Assigned Driver Name (Optional)</Label>
                    <Input
                        value={driverName}
                        onChange={(e) => setDriverName(e.target.value)}
                        placeholder="e.g. Dawit Kebede"
                        className="text-sm"
                    />
                </div>
                <div className="space-y-2">
                    <Label className="text-sm font-semibold text-slate-700">Driver Phone (Ethiopia)</Label>
                    <Input
                        value={driverPhone}
                        onChange={(e) => setDriverPhone(e.target.value)}
                        placeholder="+251 911 234 567"
                        className="text-sm"
                    />
                </div>
            </div>

            {/* Checkbox Perks */}
            <div className="flex flex-wrap gap-5 text-sm pt-1">
                <label className="inline-flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                    <input
                        type="checkbox"
                        checked={meetGreet}
                        onChange={(e) => setMeetGreet(e.target.checked)}
                        className="rounded text-brand-primary focus:ring-brand-primary"
                    />
                    Meet & Greet at arrivals gate
                </label>
                <label className="inline-flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                    <input
                        type="checkbox"
                        checked={flightTracking}
                        onChange={(e) => setFlightTracking(e.target.checked)}
                        className="rounded text-brand-primary focus:ring-brand-primary"
                    />
                    Live flight delay tracking
                </label>
                <label className="inline-flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                    <input
                        type="checkbox"
                        checked={childSeat}
                        onChange={(e) => setChildSeat(e.target.checked)}
                        className="rounded text-brand-primary focus:ring-brand-primary"
                    />
                    Child safety seat on request
                </label>
            </div>

            {/* Additional Ops Notes */}
            <div className="space-y-2">
                <Label className="text-sm font-semibold text-slate-700">Operations & Guest Instructions</Label>
                <textarea
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm min-h-[70px] focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Free waiting time, terminal meeting point, hotel dispatch contact..."
                />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t">
                <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
                    Cancel
                </Button>
                <Button type="submit" className="bg-brand-primary hover:bg-brand-secondary text-white gap-2" disabled={submitting}>
                    <Bus className="w-4 h-4" />
                    Save Shuttle to CMS
                </Button>
            </div>
        </form>
    );
};
