"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { cmsCreate } from "@/lib/admin-cms-client";
import { Loader2 } from "lucide-react";

interface FlightFormProps {
    onCancel: () => void;
    onSuccess?: () => void;
}

export const FlightForm: React.FC<FlightFormProps> = ({ onCancel, onSuccess }) => {
    const [airline, setAirline] = useState("");
    const [flightNumber, setFlightNumber] = useState("");
    const [origin, setOrigin] = useState("");
    const [destination, setDestination] = useState("");
    const [departureAt, setDepartureAt] = useState("");
    const [arrivalAt, setArrivalAt] = useState("");
    const [priceUsd, setPriceUsd] = useState("");
    const [cabinClass, setCabinClass] = useState<"Economy" | "Business" | "First">("Economy");
    const [status, setStatus] = useState<"Scheduled" | "Delayed" | "Cancelled">("Scheduled");
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const price = parseFloat(priceUsd);
        if (!airline.trim() || !flightNumber.trim() || !origin.trim() || !destination.trim() || !departureAt || !arrivalAt || !Number.isFinite(price) || price < 0) {
            toast.error("Fill all required fields.");
            return;
        }
        if (new Date(arrivalAt) < new Date(departureAt)) {
            toast.error("Arrival must be after departure.");
            return;
        }
        setSubmitting(true);
        try {
            await cmsCreate("flights", {
                airline_name: airline.trim(),
                flight_number: flightNumber.trim(),
                origin_code: origin.trim().toUpperCase().slice(0, 8),
                destination_code: destination.trim().toUpperCase().slice(0, 8),
                departure_at: new Date(departureAt).toISOString(),
                arrival_at: new Date(arrivalAt).toISOString(),
                price_usd: price,
                cabin_class: cabinClass,
                status,
            });
            toast.success("Flight saved to CMS.");
            onSuccess?.();
            onCancel();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Save failed");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-6 max-h-[70vh] overflow-y-auto pr-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium">Airline</label>
                    <Input value={airline} onChange={(e) => setAirline(e.target.value)} required />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium">Flight number</label>
                    <Input value={flightNumber} onChange={(e) => setFlightNumber(e.target.value)} required />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium">Origin (IATA)</label>
                    <Input value={origin} onChange={(e) => setOrigin(e.target.value)} required maxLength={8} />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium">Destination (IATA)</label>
                    <Input value={destination} onChange={(e) => setDestination(e.target.value)} required maxLength={8} />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium">Departure</label>
                    <Input type="datetime-local" value={departureAt} onChange={(e) => setDepartureAt(e.target.value)} required />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium">Arrival</label>
                    <Input type="datetime-local" value={arrivalAt} onChange={(e) => setArrivalAt(e.target.value)} required />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium">Price (USD)</label>
                    <Input type="number" min={0} step="0.01" value={priceUsd} onChange={(e) => setPriceUsd(e.target.value)} required />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium">Cabin</label>
                    <select
                        value={cabinClass}
                        onChange={(e) => setCabinClass(e.target.value as typeof cabinClass)}
                        className="w-full border rounded-xl px-3 py-2 text-sm"
                    >
                        <option value="Economy">Economy</option>
                        <option value="Business">Business</option>
                        <option value="First">First</option>
                    </select>
                </div>
                <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium">Status</label>
                    <select value={status} onChange={(e) => setStatus(e.target.value as typeof status)} className="w-full border rounded-xl px-3 py-2 text-sm">
                        <option value="Scheduled">Scheduled</option>
                        <option value="Delayed">Delayed</option>
                        <option value="Cancelled">Cancelled</option>
                    </select>
                </div>
            </div>
            <div className="flex justify-end gap-3 pt-2 border-t">
                <Button type="button" variant="ghost" onClick={onCancel} disabled={submitting}>
                    Cancel
                </Button>
                <Button type="submit" className="bg-brand-primary text-white" disabled={submitting}>
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save to CMS"}
                </Button>
            </div>
        </form>
    );
};
