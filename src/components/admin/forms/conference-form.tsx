"use client";

import React, { useState } from "react";
import { Upload, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { uploadCmsFiles, cmsCreate } from "@/lib/admin-cms-client";

interface ConferenceFormProps {
    onCancel: () => void;
    onSuccess?: () => void;
}

export const ConferenceForm: React.FC<ConferenceFormProps> = ({ onCancel, onSuccess }) => {
    const [name, setName] = useState("");
    const [venue, setVenue] = useState("");
    const [startAt, setStartAt] = useState("");
    const [endAt, setEndAt] = useState("");
    const [capacity, setCapacity] = useState("");
    const [organizer, setOrganizer] = useState("");
    const [description, setDescription] = useState("");
    const [status, setStatus] = useState<"Upcoming" | "Active" | "Past" | "Draft">("Draft");
    const [bannerFile, setBannerFile] = useState<File | null>(null);
    const [bannerPreview, setBannerPreview] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const onBanner = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        if (!f) return;
        setBannerFile(f);
        setBannerPreview(URL.createObjectURL(f));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const cap = parseInt(capacity, 10);
        if (!name.trim() || !venue.trim() || !startAt || !endAt || !Number.isFinite(cap) || cap < 1) {
            toast.error("Fill required fields including dates and capacity.");
            return;
        }
        if (new Date(endAt) <= new Date(startAt)) {
            toast.error("End must be after start.");
            return;
        }
        setSubmitting(true);
        try {
            let banner: number | undefined;
            if (bannerFile) {
                const ids = await uploadCmsFiles([bannerFile]);
                banner = ids[0];
            }
            await cmsCreate("conferences", {
                name: name.trim(),
                venue: venue.trim(),
                start_at: new Date(startAt).toISOString(),
                end_at: new Date(endAt).toISOString(),
                capacity: cap,
                organizer: organizer.trim() || undefined,
                description: description.trim() || undefined,
                status,
                ...(banner != null ? { banner } : {}),
            });
            toast.success("Event saved to CMS.");
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
                    <label className="text-sm font-medium">Event name</label>
                    <Input value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium">Venue</label>
                    <Input value={venue} onChange={(e) => setVenue(e.target.value)} required />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium">Start</label>
                    <Input type="datetime-local" value={startAt} onChange={(e) => setStartAt(e.target.value)} required />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium">End</label>
                    <Input type="datetime-local" value={endAt} onChange={(e) => setEndAt(e.target.value)} required />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium">Capacity</label>
                    <Input type="number" min={1} value={capacity} onChange={(e) => setCapacity(e.target.value)} required />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium">Organizer</label>
                    <Input value={organizer} onChange={(e) => setOrganizer(e.target.value)} />
                </div>
                <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium">Status</label>
                    <select value={status} onChange={(e) => setStatus(e.target.value as typeof status)} className="w-full border rounded-xl px-3 py-2 text-sm">
                        <option value="Draft">Draft</option>
                        <option value="Upcoming">Upcoming</option>
                        <option value="Active">Active</option>
                        <option value="Past">Past</option>
                    </select>
                </div>
            </div>
            <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <textarea className="w-full border rounded-xl px-3 py-2 text-sm min-h-[80px]" value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <div className="space-y-2">
                <label className="text-sm font-medium">Banner image</label>
                <label className="aspect-video rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 relative overflow-hidden">
                    {bannerPreview ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={bannerPreview} alt="" className="absolute inset-0 w-full h-full object-cover" />
                    ) : (
                        <>
                            <Upload className="w-8 h-8 text-gray-400 mb-2" />
                            <span className="text-xs text-gray-500">Upload banner</span>
                        </>
                    )}
                    <input type="file" className="hidden" accept="image/*" onChange={onBanner} />
                </label>
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
