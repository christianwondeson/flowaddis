"use client";

import React, { useState } from "react";
import { Plus, Search, MoreVertical, MapPin, Star, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { HotelForm } from "@/components/admin/forms/hotel-form";
import { useCmsList } from "@/hooks/use-cms-list";
import { getStrapiSingleMediaUrl } from "@/lib/admin-cms-client";

export default function AdminHotelsPage() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { items, loading, error, refetch } = useCmsList("hotels");

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-extrabold text-brand-dark">Manage Hotels</h1>
                    <p className="text-gray-500">Listings from Strapi CMS (create new entries below).</p>
                </div>
                <Button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-brand-primary hover:bg-brand-secondary text-white gap-2"
                >
                    <Plus className="w-4 h-4" />
                    Add New Hotel
                </Button>
            </div>

            {error ? (
                <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                    <div>
                        <p className="font-semibold">Could not load CMS</p>
                        <p className="text-amber-800/90">{error}</p>
                        <p className="mt-2 text-xs text-amber-800/80">
                            Ensure Strapi is running, <code className="rounded bg-white/80 px-1">STRAPI_URL</code> and{" "}
                            <code className="rounded bg-white/80 px-1">STRAPI_API_TOKEN</code> are set on the Next server, and{" "}
                            <code className="rounded bg-white/80 px-1">NEXT_PUBLIC_STRAPI_URL</code> is set for image URLs.
                        </p>
                    </div>
                </div>
            ) : null}

            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input placeholder="Search hotels… (client filter)" className="pl-10 bg-gray-50 border-transparent focus:bg-white" disabled />
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
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Hotel</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Location</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Rating</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Price / night</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {items.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-10 text-center text-gray-500 text-sm">
                                        No hotels yet. Click &quot;Add New Hotel&quot; to create one in Strapi.
                                    </td>
                                </tr>
                            ) : (
                                items.map((hotel) => {
                                    const id = hotel.id as number;
                                    const name = String(hotel.name ?? "");
                                    const location = String(hotel.location ?? "");
                                    const rating = hotel.rating != null ? Number(hotel.rating) : null;
                                    const price = hotel.price_per_night != null ? Number(hotel.price_per_night) : null;
                                    const currency = String(hotel.currency ?? "USD");
                                    const status = String(hotel.status ?? "—");
                                    const thumb = getStrapiSingleMediaUrl(hotel.primary_image);
                                    return (
                                        <tr key={id} className="hover:bg-gray-50 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-12 w-16 rounded-lg bg-gray-100 overflow-hidden shrink-0 border border-gray-100">
                                                        {thumb ? (
                                                            // eslint-disable-next-line @next/next/no-img-element
                                                            <img src={thumb} alt="" className="h-full w-full object-cover" />
                                                        ) : null}
                                                    </div>
                                                    <div>
                                                        <div className="font-extrabold text-brand-dark">{name}</div>
                                                        <div className="text-xs text-gray-400">ID: {id}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 text-gray-600 text-sm">
                                                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                                                    {location}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-1 text-brand-dark font-extrabold text-sm">
                                                    <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                                                    {rating != null && Number.isFinite(rating) ? rating.toFixed(1) : "—"}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-brand-dark font-semibold text-sm">
                                                    {price != null && Number.isFinite(price)
                                                        ? new Intl.NumberFormat(undefined, { style: "currency", currency }).format(price)
                                                        : "—"}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span
                                                    className={`px-2 py-1 rounded-full text-xs font-bold ${
                                                        status === "Active"
                                                            ? "bg-green-100 text-green-700"
                                                            : status === "Maintenance"
                                                              ? "bg-orange-100 text-orange-700"
                                                              : "bg-gray-100 text-gray-700"
                                                    }`}
                                                >
                                                    {status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    type="button"
                                                    className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors"
                                                    aria-label="Row actions"
                                                >
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

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add New Hotel">
                <HotelForm
                    onCancel={() => setIsModalOpen(false)}
                    onSuccess={() => {
                        void refetch();
                    }}
                />
            </Modal>
        </div>
    );
}
