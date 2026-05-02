"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { cmsCreate } from "@/lib/admin-cms-client";
import { Loader2 } from "lucide-react";

interface ShuttleFormProps {
    onCancel: () => void;
    onSuccess?: () => void;
}

export const ShuttleForm: React.FC<ShuttleFormProps> = ({ onCancel, onSuccess }) => {
    const [name, setName] = useState("");
    const [vehicleType, setVehicleType] = useState("");
    const [pickup, setPickup] = useState("");
    const [dropoff, setDropoff] = useState("");
    const [schedule, setSchedule] = useState("");
    const [capacity, setCapacity] = useState("");
    const [notes, setNotes] = useState("");
    const [status, setStatus] = useState<"Active" | "Inactive" | "Maintenance">("Active");
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const cap = parseInt(capacity, 10);
        if (!name.trim() || !vehicleType.trim() || !pickup.trim() || !dropoff.trim() || !schedule.trim() || !Number.isFinite(cap) || cap < 1) {
            toast.error("Fill all required fields with valid capacity.");
            return;
        }
        setSubmitting(true);
        try {
            await cmsCreate("shuttles", {
                name: name.trim(),
                vehicle_type: vehicleType.trim(),
                pickup_location: pickup.trim(),
                dropoff_location: dropoff.trim(),
                schedule: schedule.trim(),
                capacity: cap,
                notes: notes.trim() || undefined,
                status,
            });
            toast.success("Shuttle saved to CMS.");
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
                    <label className="text-sm font-medium text-gray-700">Service name</label>
                    <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Airport Express" required />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Vehicle type</label>
                    <Input value={vehicleType} onChange={(e) => setVehicleType(e.target.value)} placeholder="Minibus" required />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Pickup</label>
                    <Input value={pickup} onChange={(e) => setPickup(e.target.value)} required />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Dropoff</label>
                    <Input value={dropoff} onChange={(e) => setDropoff(e.target.value)} required />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Schedule</label>
                    <Input value={schedule} onChange={(e) => setSchedule(e.target.value)} required />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Capacity (seats)</label>
                    <Input type="number" min={1} value={capacity} onChange={(e) => setCapacity(e.target.value)} required />
                </div>
                <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium text-gray-700">Status</label>
                    <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value as typeof status)}
                        className="w-full border rounded-xl px-3 py-2 text-sm"
                    >
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                        <option value="Maintenance">Maintenance</option>
                    </select>
                </div>
            </div>
            <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Notes</label>
                <textarea
                    className="w-full border rounded-xl px-3 py-2 text-sm min-h-[80px]"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                />
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
