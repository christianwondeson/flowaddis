"use client";

import React, { useState } from "react";
import { Plus, Search, MoreVertical, MapPin, Clock, Bus, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { ShuttleForm } from "@/components/admin/forms/shuttle-form";
import { AdContainer } from "@/components/ads/ad-container";
import { AdConfig } from "@/lib/types/ads";
import { useCmsList } from "@/hooks/use-cms-list";

const SHUTTLE_ADS_LEFT: AdConfig[] = [
    {
        id: "flight-ad-1",
        imageUrl: "/ads/flight-ad-sample.png",
        altText: "Discover Ethiopia",
        linkUrl: "/flights",
        targetBlank: false,
    },
];

const SHUTTLE_ADS_RIGHT: AdConfig[] = [
    {
        id: "hotel-ad-1",
        imageUrl: "/ads/hotel-ad-sample.png",
        altText: "Luxury Stays in Addis Ababa",
        linkUrl: "/hotels",
        targetBlank: false,
    },
];

export default function AdminShuttlesPage() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { items, loading, error, refetch } = useCmsList("shuttles");

    return (
        <AdContainer leftAds={SHUTTLE_ADS_LEFT} rightAds={SHUTTLE_ADS_RIGHT}>
            <div className="space-y-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-extrabold text-brand-dark">Manage Shuttles</h1>
                        <p className="text-gray-500">Shuttle services stored in Strapi CMS.</p>
                    </div>
                    <Button
                        onClick={() => setIsModalOpen(true)}
                        className="bg-brand-primary hover:bg-brand-secondary text-white gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        Add New Shuttle
                    </Button>
                </div>

                {error ? (
                    <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                        <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                        <div>
                            <p className="font-semibold">Could not load CMS</p>
                            <p>{error}</p>
                        </div>
                    </div>
                ) : null}

                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input placeholder="Search…" className="pl-10 bg-gray-50 border-transparent" disabled />
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    {loading ? (
                        <div className="flex items-center justify-center py-16 text-gray-500 gap-2">
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Loading from CMS…
                        </div>
                    ) : (
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 border-b border-gray-100">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Service</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Route</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Schedule</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Capacity</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {items.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-10 text-center text-gray-500 text-sm">
                                            No shuttles yet. Add one to Strapi via the button above.
                                        </td>
                                    </tr>
                                ) : (
                                    items.map((row) => {
                                        const id = row.id as number;
                                        const name = String(row.name ?? "");
                                        const pickup = String(row.pickup_location ?? "");
                                        const drop = String(row.dropoff_location ?? "");
                                        const schedule = String(row.schedule ?? "");
                                        const cap = row.capacity != null ? Number(row.capacity) : "—";
                                        const status = String(row.status ?? "—");
                                        return (
                                            <tr key={id} className="hover:bg-gray-50 transition-colors group">
                                                <td className="px-6 py-4">
                                                    <div className="font-extrabold text-brand-dark">{name}</div>
                                                    <div className="text-xs text-gray-400">{String(row.vehicle_type ?? "")}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2 text-gray-600 text-sm">
                                                        <MapPin className="w-3.5 h-3.5 shrink-0" />
                                                        {pickup} → {drop}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-1 text-gray-600 text-sm">
                                                        <Clock className="w-3.5 h-3.5" />
                                                        {schedule}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-1 text-brand-dark font-semibold text-sm">
                                                        <Bus className="w-3.5 h-3.5 text-gray-400" />
                                                        {cap} seats
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span
                                                        className={`px-2 py-1 rounded-full text-xs font-bold ${
                                                            status === "Active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
                                                        }`}
                                                    >
                                                        {status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <button type="button" className="p-2 hover:bg-gray-100 rounded-lg text-gray-400" aria-label="Actions">
                                                        <MoreVertical className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    )}
                </div>

                <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add New Shuttle">
                    <ShuttleForm
                        onCancel={() => setIsModalOpen(false)}
                        onSuccess={() => {
                            void refetch();
                        }}
                    />
                </Modal>
            </div>
        </AdContainer>
    );
}
