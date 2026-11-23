"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { cmsCreate } from "@/lib/admin-cms-client";
import { Loader2, Plane, Sparkles, Clock, DollarSign, Info } from "lucide-react";

interface FlightFormProps {
    onCancel: () => void;
    onSuccess?: () => void;
}

interface AirlineOption {
    code: string;
    name: string;
    prefix: string;
}

const POPULAR_AIRLINES: AirlineOption[] = [
    { code: "ET", name: "Ethiopian Airlines", prefix: "ET" },
    { code: "EK", name: "Emirates", prefix: "EK" },
    { code: "QR", name: "Qatar Airways", prefix: "QR" },
    { code: "KQ", name: "Kenya Airways", prefix: "KQ" },
    { code: "FZ", name: "Flydubai", prefix: "FZ" },
    { code: "TK", name: "Turkish Airlines", prefix: "TK" },
    { code: "LH", name: "Lufthansa", prefix: "LH" },
    { code: "MS", name: "EgyptAir", prefix: "MS" },
    { code: "SV", name: "Saudia", prefix: "SV" },
];

interface AirportOption {
    code: string;
    city: string;
    name: string;
    country: string;
    domestic: boolean;
}

const REALISTIC_AIRPORTS: AirportOption[] = [
    // Domestic Ethiopia
    { code: "ADD", city: "Addis Ababa", name: "Bole International Airport", country: "Ethiopia", domestic: true },
    { code: "DIR", city: "Dire Dawa", name: "Aba Tenna Dejazmach Yilma Int.", country: "Ethiopia", domestic: true },
    { code: "BJR", city: "Bahir Dar", name: "Ginbot 20 Airport", country: "Ethiopia", domestic: true },
    { code: "GDQ", city: "Gondar", name: "Atse Tewodros Airport", country: "Ethiopia", domestic: true },
    { code: "LLI", city: "Lalibela", name: "Lalibela Airport", country: "Ethiopia", domestic: true },
    { code: "MQX", city: "Mekele", name: "Alula Aba Nega Airport", country: "Ethiopia", domestic: true },
    { code: "AXU", city: "Axum", name: "Emperor Yohannes IV Airport", country: "Ethiopia", domestic: true },
    { code: "AWA", city: "Hawassa", name: "Hawassa Airport", country: "Ethiopia", domestic: true },
    { code: "JIM", city: "Jimma", name: "Aba Segud Airport", country: "Ethiopia", domestic: true },
    { code: "AMH", city: "Arba Minch", name: "Arba Minch Airport", country: "Ethiopia", domestic: true },
    { code: "SZE", city: "Semera", name: "Semera Airport", country: "Ethiopia", domestic: true },
    { code: "GDE", city: "Gode", name: "Gode Airport", country: "Ethiopia", domestic: true },
    { code: "ASO", city: "Asosa", name: "Asosa Airport", country: "Ethiopia", domestic: true },
    // International Connectors
    { code: "DXB", city: "Dubai", name: "Dubai International Airport", country: "UAE", domestic: false },
    { code: "NBO", city: "Nairobi", name: "Jomo Kenyatta International", country: "Kenya", domestic: false },
    { code: "JED", city: "Jeddah", name: "King Abdulaziz International", country: "Saudi Arabia", domestic: false },
    { code: "LHR", city: "London", name: "Heathrow Airport", country: "United Kingdom", domestic: false },
    { code: "IST", city: "Istanbul", name: "Istanbul Airport", country: "Turkey", domestic: false },
    { code: "IAD", city: "Washington D.C.", name: "Dulles International", country: "United States", domestic: false },
    { code: "DOH", city: "Doha", name: "Hamad International", country: "Qatar", domestic: false },
    { code: "FRA", city: "Frankfurt", name: "Frankfurt am Main Airport", country: "Germany", domestic: false },
    { code: "CDG", city: "Paris", name: "Charles de Gaulle Airport", country: "France", domestic: false },
    { code: "JNB", city: "Johannesburg", name: "O.R. Tambo International", country: "South Africa", domestic: false },
    { code: "CAI", city: "Cairo", name: "Cairo International Airport", country: "Egypt", domestic: false },
    { code: "BOM", city: "Mumbai", name: "Chhatrapati Shivaji Maharaj", country: "India", domestic: false },
    { code: "PEK", city: "Beijing", name: "Beijing Capital International", country: "China", domestic: false },
    { code: "YYZ", city: "Toronto", name: "Toronto Pearson International", country: "Canada", domestic: false },
];

interface FlightPreset {
    label: string;
    airline: string;
    flightNumber: string;
    origin: string;
    destination: string;
    durationMinutes: number;
    priceUsd: number;
    cabinClass: "Economy" | "Business" | "First";
    aircraft: string;
}

const REALISTIC_PRESETS: FlightPreset[] = [
    {
        label: "ADD → DIR (Dire Dawa)",
        airline: "Ethiopian Airlines",
        flightNumber: "ET 204",
        origin: "ADD",
        destination: "DIR",
        durationMinutes: 50,
        priceUsd: 55,
        cabinClass: "Economy",
        aircraft: "De Havilland Dash 8-Q400",
    },
    {
        label: "ADD → BJR (Bahir Dar)",
        airline: "Ethiopian Airlines",
        flightNumber: "ET 126",
        origin: "ADD",
        destination: "BJR",
        durationMinutes: 60,
        priceUsd: 62,
        cabinClass: "Economy",
        aircraft: "De Havilland Dash 8-Q400",
    },
    {
        label: "ADD → GDQ (Gondar)",
        airline: "Ethiopian Airlines",
        flightNumber: "ET 122",
        origin: "ADD",
        destination: "GDQ",
        durationMinutes: 65,
        priceUsd: 68,
        cabinClass: "Economy",
        aircraft: "De Havilland Dash 8-Q400",
    },
    {
        label: "ADD → LLI (Lalibela)",
        airline: "Ethiopian Airlines",
        flightNumber: "ET 120",
        origin: "ADD",
        destination: "LLI",
        durationMinutes: 70,
        priceUsd: 75,
        cabinClass: "Economy",
        aircraft: "De Havilland Dash 8-Q400",
    },
    {
        label: "ADD → MQX (Mekele)",
        airline: "Ethiopian Airlines",
        flightNumber: "ET 104",
        origin: "ADD",
        destination: "MQX",
        durationMinutes: 75,
        priceUsd: 80,
        cabinClass: "Economy",
        aircraft: "Boeing 737-800",
    },
    {
        label: "ADD → DXB (Dubai)",
        airline: "Ethiopian Airlines",
        flightNumber: "ET 600",
        origin: "ADD",
        destination: "DXB",
        durationMinutes: 255,
        priceUsd: 380,
        cabinClass: "Economy",
        aircraft: "Boeing 787-9 Dreamliner",
    },
    {
        label: "ADD → NBO (Nairobi)",
        airline: "Ethiopian Airlines",
        flightNumber: "ET 302",
        origin: "ADD",
        destination: "NBO",
        durationMinutes: 125,
        priceUsd: 240,
        cabinClass: "Economy",
        aircraft: "Boeing 737 MAX 8",
    },
    {
        label: "ADD → JED (Jeddah)",
        airline: "Ethiopian Airlines",
        flightNumber: "ET 402",
        origin: "ADD",
        destination: "JED",
        durationMinutes: 190,
        priceUsd: 290,
        cabinClass: "Economy",
        aircraft: "Boeing 777-200LR",
    },
    {
        label: "ADD → LHR (London)",
        airline: "Ethiopian Airlines",
        flightNumber: "ET 700",
        origin: "ADD",
        destination: "LHR",
        durationMinutes: 465,
        priceUsd: 690,
        cabinClass: "Economy",
        aircraft: "Airbus A350-900",
    },
    {
        label: "ADD → IAD (Washington)",
        airline: "Ethiopian Airlines",
        flightNumber: "ET 500",
        origin: "ADD",
        destination: "IAD",
        durationMinutes: 870,
        priceUsd: 950,
        cabinClass: "Economy",
        aircraft: "Airbus A350-900",
    },
    {
        label: "ADD → IST (Istanbul)",
        airline: "Ethiopian Airlines",
        flightNumber: "ET 720",
        origin: "ADD",
        destination: "IST",
        durationMinutes: 325,
        priceUsd: 510,
        cabinClass: "Economy",
        aircraft: "Boeing 787-9 Dreamliner",
    },
    {
        label: "ADD → DOH (Doha)",
        airline: "Qatar Airways",
        flightNumber: "QR 1428",
        origin: "ADD",
        destination: "DOH",
        durationMinutes: 270,
        priceUsd: 460,
        cabinClass: "Economy",
        aircraft: "Boeing 787-8",
    },
];

const ETB_RATE = 130; // Approx ETB per USD for guidance

function formatDateTimeLocal(date: Date): string {
    const pad = (n: number) => String(n).padStart(2, "0");
    const y = date.getFullYear();
    const m = pad(date.getMonth() + 1);
    const d = pad(date.getDate());
    const h = pad(date.getHours());
    const min = pad(date.getMinutes());
    return `${y}-${m}-${d}T${h}:${min}`;
}

export const FlightForm: React.FC<FlightFormProps> = ({ onCancel, onSuccess }) => {
    // Tomorrow at 08:30 AM default departure
    const defaultDeparture = new Date();
    defaultDeparture.setDate(defaultDeparture.getDate() + 1);
    defaultDeparture.setHours(8, 30, 0, 0);

    const defaultArrival = new Date(defaultDeparture);
    defaultArrival.setHours(defaultArrival.getHours() + 1);

    const [airline, setAirline] = useState("Ethiopian Airlines");
    const [flightNumber, setFlightNumber] = useState("ET 204");
    const [origin, setOrigin] = useState("ADD");
    const [destination, setDestination] = useState("DIR");
    const [departureAt, setDepartureAt] = useState(formatDateTimeLocal(defaultDeparture));
    const [arrivalAt, setArrivalAt] = useState(formatDateTimeLocal(defaultArrival));
    const [priceUsd, setPriceUsd] = useState("55");
    const [cabinClass, setCabinClass] = useState<"Economy" | "Business" | "First">("Economy");
    const [status, setStatus] = useState<"Scheduled" | "Delayed" | "Cancelled">("Scheduled");
    const [aircraftModel, setAircraftModel] = useState("De Havilland Dash 8-Q400");
    const [submitting, setSubmitting] = useState(false);

    const applyPreset = (preset: FlightPreset) => {
        setAirline(preset.airline);
        setFlightNumber(preset.flightNumber);
        setOrigin(preset.origin);
        setDestination(preset.destination);
        setPriceUsd(String(preset.priceUsd));
        setCabinClass(preset.cabinClass);
        setAircraftModel(preset.aircraft);

        // Adjust arrival time based on duration
        const dep = departureAt ? new Date(departureAt) : new Date(defaultDeparture);
        if (!Number.isNaN(dep.getTime())) {
            const arr = new Date(dep.getTime() + preset.durationMinutes * 60 * 1000);
            setArrivalAt(formatDateTimeLocal(arr));
        }

        toast.info(`Applied template: ${preset.label}`);
    };

    const handleAirlineChange = (selectedName: string) => {
        setAirline(selectedName);
        const matched = POPULAR_AIRLINES.find((a) => a.name === selectedName);
        if (matched) {
            // Suggest flight number prefix if changed
            const currentNumOnly = flightNumber.replace(/^[A-Z0-9]{2,3}\s*/i, "");
            setFlightNumber(`${matched.prefix} ${currentNumOnly || "101"}`);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const price = parseFloat(priceUsd);
        if (
            !airline.trim() ||
            !flightNumber.trim() ||
            !origin.trim() ||
            !destination.trim() ||
            !departureAt ||
            !arrivalAt ||
            !Number.isFinite(price) ||
            price < 0
        ) {
            toast.error("Please fill all required flight schedule and pricing fields.");
            return;
        }
        if (origin.trim().toUpperCase() === destination.trim().toUpperCase()) {
            toast.error("Origin and destination airport codes cannot be the same.");
            return;
        }
        if (new Date(arrivalAt) <= new Date(departureAt)) {
            toast.error("Flight arrival time must be after departure time.");
            return;
        }

        setSubmitting(true);
        try {
            await cmsCreate("flights", {
                airline_name: airline.trim(),
                flight_number: flightNumber.trim().toUpperCase(),
                origin_code: origin.trim().toUpperCase().slice(0, 8),
                destination_code: destination.trim().toUpperCase().slice(0, 8),
                departure_at: new Date(departureAt).toISOString(),
                arrival_at: new Date(arrivalAt).toISOString(),
                price_usd: price,
                cabin_class: cabinClass,
                status,
            });
            toast.success(`Flight ${flightNumber.trim().toUpperCase()} successfully saved to CMS.`);
            onSuccess?.();
            onCancel();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Save failed");
        } finally {
            setSubmitting(false);
        }
    };

    const approxEtb = Number(priceUsd) > 0 ? (Number(priceUsd) * ETB_RATE).toLocaleString() : null;

    return (
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-6 max-h-[75vh] overflow-y-auto pr-1">
            {/* Quick Presets Carousel / Pills */}
            <div className="space-y-2 bg-slate-50 border border-slate-200 p-3.5 rounded-xl">
                <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5 uppercase tracking-wider">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        Quick Real-World Ethiopian Routes & Schedules
                    </span>
                    <span className="text-[11px] text-slate-500">Click to autofill route & fares</span>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                    {REALISTIC_PRESETS.map((p) => {
                        const isCurrent = origin === p.origin && destination === p.destination;
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
                {/* Airline Selection */}
                <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Airline</label>
                    <div className="relative">
                        <select
                            value={airline}
                            onChange={(e) => handleAirlineChange(e.target.value)}
                            className="w-full h-10 border border-slate-300 rounded-xl px-3 bg-white text-sm focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
                        >
                            {POPULAR_AIRLINES.map((a) => (
                                <option key={a.code} value={a.name}>
                                    {a.name} ({a.prefix})
                                </option>
                            ))}
                            <option value="Other">Other Airline...</option>
                        </select>
                    </div>
                    {airline === "Other" && (
                        <Input
                            placeholder="Enter Airline Name"
                            onChange={(e) => setAirline(e.target.value)}
                            className="mt-2 text-sm"
                            required
                        />
                    )}
                </div>

                {/* Flight Number */}
                <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Flight Number (IATA)</label>
                    <Input
                        value={flightNumber}
                        onChange={(e) => setFlightNumber(e.target.value)}
                        placeholder="e.g. ET 204 or ET 700"
                        className="font-mono uppercase tracking-wider text-sm"
                        required
                    />
                </div>

                {/* Origin Airport */}
                <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Origin Airport (IATA)</label>
                    <select
                        value={origin}
                        onChange={(e) => setOrigin(e.target.value)}
                        className="w-full h-10 border border-slate-300 rounded-xl px-3 bg-white text-sm font-mono focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
                    >
                        <optgroup label="Domestic (Ethiopia)">
                            {REALISTIC_AIRPORTS.filter((a) => a.domestic).map((a) => (
                                <option key={`orig-${a.code}`} value={a.code}>
                                    {a.code} — {a.city} ({a.name})
                                </option>
                            ))}
                        </optgroup>
                        <optgroup label="International Hubs">
                            {REALISTIC_AIRPORTS.filter((a) => !a.domestic).map((a) => (
                                <option key={`orig-${a.code}`} value={a.code}>
                                    {a.code} — {a.city}, {a.country}
                                </option>
                            ))}
                        </optgroup>
                    </select>
                </div>

                {/* Destination Airport */}
                <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Destination Airport (IATA)</label>
                    <select
                        value={destination}
                        onChange={(e) => setDestination(e.target.value)}
                        className="w-full h-10 border border-slate-300 rounded-xl px-3 bg-white text-sm font-mono focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
                    >
                        <optgroup label="Domestic (Ethiopia)">
                            {REALISTIC_AIRPORTS.filter((a) => a.domestic).map((a) => (
                                <option key={`dest-${a.code}`} value={a.code}>
                                    {a.code} — {a.city} ({a.name})
                                </option>
                            ))}
                        </optgroup>
                        <optgroup label="International Hubs">
                            {REALISTIC_AIRPORTS.filter((a) => !a.domestic).map((a) => (
                                <option key={`dest-${a.code}`} value={a.code}>
                                    {a.code} — {a.city}, {a.country}
                                </option>
                            ))}
                        </optgroup>
                    </select>
                </div>

                {/* Departure Time */}
                <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        Departure Date & Time
                    </label>
                    <Input
                        type="datetime-local"
                        value={departureAt}
                        onChange={(e) => setDepartureAt(e.target.value)}
                        className="text-sm"
                        required
                    />
                </div>

                {/* Arrival Time */}
                <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        Arrival Date & Time
                    </label>
                    <Input
                        type="datetime-local"
                        value={arrivalAt}
                        onChange={(e) => setArrivalAt(e.target.value)}
                        className="text-sm"
                        required
                    />
                </div>

                {/* Price in USD with ETB guidance */}
                <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 flex items-center justify-between">
                        <span className="flex items-center gap-1">
                            <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                            Base Fare (USD)
                        </span>
                        {approxEtb && (
                            <span className="text-xs text-brand-primary font-bold">
                                ≈ {approxEtb} ETB
                            </span>
                        )}
                    </label>
                    <Input
                        type="number"
                        min={0}
                        step="1"
                        value={priceUsd}
                        onChange={(e) => setPriceUsd(e.target.value)}
                        placeholder="e.g. 55"
                        className="text-sm"
                        required
                    />
                    <p className="text-[11px] text-slate-500">
                        CMS standard currency is USD. Guests will be shown ETB conversion at checkout.
                    </p>
                </div>

                {/* Cabin Class */}
                <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Cabin Class</label>
                    <select
                        value={cabinClass}
                        onChange={(e) => setCabinClass(e.target.value as typeof cabinClass)}
                        className="w-full h-10 border border-slate-300 rounded-xl px-3 bg-white text-sm"
                    >
                        <option value="Economy">Economy (Standard)</option>
                        <option value="Business">Business (Cloud Nine)</option>
                        <option value="First">First Class</option>
                    </select>
                </div>

                {/* Aircraft Type Guidance (Metadata helper) */}
                <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 flex items-center gap-1">
                        <Plane className="w-3.5 h-3.5 text-slate-400" />
                        Aircraft Model
                    </label>
                    <select
                        value={aircraftModel}
                        onChange={(e) => setAircraftModel(e.target.value)}
                        className="w-full h-10 border border-slate-300 rounded-xl px-3 bg-white text-sm"
                    >
                        <option value="De Havilland Dash 8-Q400">De Havilland Dash 8-Q400 (Domestic Turboprop)</option>
                        <option value="Boeing 737-800">Boeing 737-800 (Narrow-body Jet)</option>
                        <option value="Boeing 737 MAX 8">Boeing 737 MAX 8</option>
                        <option value="Boeing 787-9 Dreamliner">Boeing 787-9 Dreamliner (Wide-body)</option>
                        <option value="Boeing 777-200LR">Boeing 777-200LR (Long Range)</option>
                        <option value="Airbus A350-900">Airbus A350-900 (Extra Wide Body)</option>
                        <option value="Boeing 767-300ER">Boeing 767-300ER</option>
                    </select>
                </div>

                {/* Status */}
                <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Flight Status</label>
                    <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value as typeof status)}
                        className="w-full h-10 border border-slate-300 rounded-xl px-3 bg-white text-sm"
                    >
                        <option value="Scheduled">Scheduled (On Time)</option>
                        <option value="Delayed">Delayed</option>
                        <option value="Cancelled">Cancelled</option>
                    </select>
                </div>
            </div>

            {/* Operational Summary Pill */}
            <div className="bg-blue-50/70 border border-blue-200/60 rounded-xl p-3 flex items-start gap-2.5 text-xs text-blue-900">
                <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div>
                    <span className="font-semibold">Flight Schedule Summary: </span>
                    {airline} ({flightNumber}) flying {origin} → {destination} with {aircraftModel}. Cabin: {cabinClass}. Baggage allowance: {cabinClass === "Business" ? "3 x 23kg + 2 carry-ons" : "2 x 23kg + 1 carry-on"}.
                </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t">
                <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
                    Cancel
                </Button>
                <Button type="submit" className="bg-brand-primary hover:bg-brand-secondary text-white gap-2" disabled={submitting}>
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plane className="w-4 h-4" />}
                    Save Flight to CMS
                </Button>
            </div>
        </form>
    );
};
