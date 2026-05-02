"use client";

import React, { useState } from "react";
import { Upload, Plus, X, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { uploadCmsFiles, cmsCreate } from "@/lib/admin-cms-client";
import { slugifyName } from "@/lib/slugify";

interface HotelFormProps {
    onCancel: () => void;
    onSuccess?: () => void;
}

type GalleryItem = { file: File; preview: string; isPrimary: boolean };

const commonFacilities = [
    { id: "wifi", label: "Free Wi-Fi" },
    { id: "restaurant", label: "Restaurant" },
    { id: "bar", label: "Bar/Lounge" },
    { id: "gym", label: "Fitness Gym" },
    { id: "pool", label: "Pool" },
    { id: "spa", label: "Spa" },
    { id: "sauna", label: "Sauna/Steam" },
    { id: "shuttle", label: "Airport Shuttle" },
    { id: "conference", label: "Conference/Meeting Rooms" },
];

export const HotelForm: React.FC<HotelFormProps> = ({ onCancel, onSuccess }) => {
    const [name, setName] = useState("");
    const [location, setLocation] = useState("");
    const [description, setDescription] = useState("");
    const [starRating, setStarRating] = useState("4");
    const [status, setStatus] = useState<"Active" | "Maintenance" | "Draft">("Draft");
    const [selectedFacilities, setSelectedFacilities] = useState<string[]>([]);
    const [customFacilities, setCustomFacilities] = useState<string[]>([]);
    const [newFacility, setNewFacility] = useState("");
    const [images, setImages] = useState<GalleryItem[]>([]);
    const [pricing, setPricing] = useState({
        original: "",
        discounted: "",
        currency: "USD",
        category: "Mid-range" as "Budget" | "Mid-range" | "Luxury" | "Premium",
    });
    const [submitting, setSubmitting] = useState(false);

    const toggleFacility = (id: string) => {
        setSelectedFacilities((prev) => (prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]));
    };

    const handleAddCustomFacility = () => {
        const t = newFacility.trim();
        if (t && !customFacilities.includes(t)) {
            setCustomFacilities([...customFacilities, t]);
            setNewFacility("");
        }
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return;
        const newFiles = Array.from(e.target.files);
        setImages((prev) => {
            const startPrimary = prev.length === 0;
            const next = newFiles.map((file, index) => ({
                file,
                preview: URL.createObjectURL(file),
                isPrimary: startPrimary && index === 0 ? true : false,
            }));
            return [...prev, ...next];
        });
    };

    const setPrimaryImage = (index: number) => {
        setImages((imgs) => imgs.map((img, i) => ({ ...img, isPrimary: i === index })));
    };

    const removeImage = (index: number) => {
        setImages((imgs) => {
            const removed = imgs[index];
            URL.revokeObjectURL(removed.preview);
            const next = imgs.filter((_, i) => i !== index);
            if (removed.isPrimary && next.length > 0) {
                next[0] = { ...next[0], isPrimary: true };
            }
            return next;
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedName = name.trim();
        const trimmedLoc = location.trim();
        if (!trimmedName || !trimmedLoc) {
            toast.error("Name and location are required.");
            return;
        }
        const orig = parseFloat(pricing.original);
        const disc = parseFloat(pricing.discounted);
        const priceNum = Number.isFinite(disc) && disc > 0 ? disc : orig;
        if (!Number.isFinite(priceNum) || priceNum <= 0) {
            toast.error("Enter a valid nightly price.");
            return;
        }

        setSubmitting(true);
        try {
            const facilityLabels = [
                ...selectedFacilities.map((id) => commonFacilities.find((f) => f.id === id)?.label).filter(Boolean),
                ...customFacilities,
            ];

            let primary_image: number | undefined;
            let gallery: number[] | undefined;
            if (images.length > 0) {
                const ordered = [...images].sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary));
                const files = ordered.map((i) => i.file);
                const ids = await uploadCmsFiles(files);
                if (ids.length > 0) {
                    primary_image = ids[0];
                    const rest = ids.slice(1);
                    if (rest.length > 0) gallery = rest;
                }
            }

            const slug = slugifyName(trimmedName);
            const ratingNum = Math.min(5, Math.max(0, parseFloat(starRating) || 0));

            await cmsCreate("hotels", {
                name: trimmedName,
                slug,
                location: trimmedLoc,
                description: description.trim() || undefined,
                rating: ratingNum,
                price_per_night: priceNum,
                currency: (pricing.currency || "USD").toUpperCase().slice(0, 3),
                price_category: pricing.category,
                status,
                facilities: facilityLabels,
                ...(primary_image != null ? { primary_image } : {}),
                ...(gallery && gallery.length > 0 ? { gallery } : {}),
            });

            toast.success("Hotel saved to CMS.");
            onSuccess?.();
            onCancel();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Save failed");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-8 no-scrollbar max-h-[70vh] overflow-y-auto pr-1">
            <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                    <h3 className="text-sm font-bold text-brand-dark uppercase tracking-wider">Basic Information</h3>
                    <span className="text-[10px] font-bold text-brand-primary bg-brand-primary/5 px-2 py-0.5 rounded-full">Step 1 of 3</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase">Hotel Name</label>
                        <Input
                            placeholder="e.g. Skylight Hotel"
                            className="rounded-xl border-gray-100 focus:border-brand-primary"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase">Location</label>
                        <Input
                            placeholder="e.g. Bole, Addis Ababa"
                            className="rounded-xl border-gray-100 focus:border-brand-primary"
                            required
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                        />
                    </div>
                </div>
                <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase">Description</label>
                    <textarea
                        className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-primary transition-colors h-24 resize-none"
                        placeholder="Describe the hotel..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase">Status</label>
                        <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value as typeof status)}
                            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-semibold"
                        >
                            <option value="Draft">Draft</option>
                            <option value="Active">Active</option>
                            <option value="Maintenance">Maintenance</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase">Star rating</label>
                        <select
                            value={starRating}
                            onChange={(e) => setStarRating(e.target.value)}
                            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-semibold"
                        >
                            {["5", "4", "3", "2", "1"].map((n) => (
                                <option key={n} value={n}>
                                    {n} stars
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                    <h3 className="text-sm font-bold text-brand-dark uppercase tracking-wider">Pricing & Category</h3>
                    <span className="text-[10px] font-bold text-brand-primary bg-brand-primary/5 px-2 py-0.5 rounded-full">Step 2 of 3</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase">Original price / night</label>
                        <Input
                            type="number"
                            min={0}
                            step="0.01"
                            value={pricing.original}
                            onChange={(e) => setPricing({ ...pricing, original: e.target.value })}
                            className="rounded-xl border-gray-100"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase">Discounted (optional)</label>
                        <Input
                            type="number"
                            min={0}
                            step="0.01"
                            value={pricing.discounted}
                            onChange={(e) => setPricing({ ...pricing, discounted: e.target.value })}
                            className="rounded-xl border-gray-100"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase">Currency</label>
                        <select
                            value={pricing.currency}
                            onChange={(e) => setPricing({ ...pricing, currency: e.target.value })}
                            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-semibold"
                        >
                            <option value="USD">USD</option>
                            <option value="ETB">ETB</option>
                            <option value="EUR">EUR</option>
                        </select>
                    </div>
                </div>
                <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase">Price category</label>
                    <select
                        value={pricing.category}
                        onChange={(e) => setPricing({ ...pricing, category: e.target.value as typeof pricing.category })}
                        className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-semibold"
                    >
                        <option value="Budget">Budget</option>
                        <option value="Mid-range">Mid-range</option>
                        <option value="Luxury">Luxury</option>
                        <option value="Premium">Premium</option>
                    </select>
                </div>
            </div>

            <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                    <h3 className="text-sm font-bold text-brand-dark uppercase tracking-wider">Facilities</h3>
                    <span className="text-[10px] font-bold text-brand-primary bg-brand-primary/5 px-2 py-0.5 rounded-full">Step 3 of 3</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {commonFacilities.map((facility) => (
                        <button
                            key={facility.id}
                            type="button"
                            onClick={() => toggleFacility(facility.id)}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-left ${
                                selectedFacilities.includes(facility.id)
                                    ? "bg-brand-primary/10 border-brand-primary text-brand-primary"
                                    : "bg-white border-gray-100 text-gray-600 hover:border-brand-primary/30"
                            }`}
                        >
                            <span
                                className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                                    selectedFacilities.includes(facility.id) ? "bg-brand-primary border-brand-primary" : "border-gray-300"
                                }`}
                            >
                                {selectedFacilities.includes(facility.id) ? <Check className="w-3 h-3 text-white" /> : null}
                            </span>
                            <span className="text-xs font-bold">{facility.label}</span>
                        </button>
                    ))}
                </div>
                <div className="flex gap-2">
                    <Input
                        placeholder="Custom facility"
                        value={newFacility}
                        onChange={(e) => setNewFacility(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                e.preventDefault();
                                handleAddCustomFacility();
                            }
                        }}
                        className="rounded-xl"
                    />
                    <Button type="button" variant="outline" onClick={handleAddCustomFacility}>
                        <Plus className="w-4 h-4" />
                    </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                    {customFacilities.map((facility, idx) => (
                        <div
                            key={idx}
                            className="bg-brand-dark text-white px-3 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-2"
                        >
                            {facility}
                            <button type="button" onClick={() => setCustomFacilities(customFacilities.filter((_, i) => i !== idx))}>
                                <X className="w-3 h-3" />
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            <div className="space-y-4">
                <h3 className="text-sm font-bold text-brand-dark uppercase tracking-wider">Gallery</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {images.map((img, idx) => (
                        <div
                            key={idx}
                            className={`relative aspect-4/3 rounded-2xl overflow-hidden border-2 ${
                                img.isPrimary ? "border-brand-primary ring-2 ring-brand-primary/20" : "border-transparent"
                            }`}
                        >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={img.preview} alt="" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                                {!img.isPrimary ? (
                                    <button type="button" onClick={() => setPrimaryImage(idx)} className="text-[10px] font-bold bg-white px-2 py-1 rounded-full">
                                        Set primary
                                    </button>
                                ) : null}
                                <button type="button" onClick={() => removeImage(idx)} className="bg-red-500 text-white p-1.5 rounded-full">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                            {img.isPrimary ? (
                                <span className="absolute top-2 left-2 bg-brand-primary text-white text-[8px] font-extrabold px-2 py-0.5 rounded-full uppercase">
                                    Primary
                                </span>
                            ) : null}
                        </div>
                    ))}
                    <label className="aspect-4/3 rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center cursor-pointer hover:border-brand-primary">
                        <Upload className="w-6 h-6 text-gray-400 mb-1" />
                        <span className="text-[10px] font-bold text-gray-500">Add photos</span>
                        <input type="file" className="hidden" accept="image/*" multiple onChange={handleImageUpload} />
                    </label>
                </div>
            </div>

            <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
                <Button type="button" variant="ghost" onClick={onCancel} disabled={submitting}>
                    Cancel
                </Button>
                <Button type="submit" className="bg-brand-primary text-white" disabled={submitting}>
                    {submitting ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            Saving…
                        </>
                    ) : (
                        "Save to CMS"
                    )}
                </Button>
            </div>
        </form>
    );
};
