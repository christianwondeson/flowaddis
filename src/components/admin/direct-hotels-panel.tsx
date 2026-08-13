'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { auth } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Building2, ExternalLink, Plus, RefreshCw } from 'lucide-react';
import { HotelRegistrationWizard } from '@/components/admin/hotel-registration-wizard';
import { AdminLoader } from '@/components/ui/admin-loader';
import {
    getHotelVerification,
    hotelVerificationReady,
} from '@/lib/hotel-verification';

export type DirectHotelRow = {
    id: string;
    name: string;
    city?: string | null;
    status?: string;
    inventory_source?: string;
    default_currency?: string;
    amenities?: Record<string, unknown> | null;
    media?: Record<string, unknown> | null;
};

async function authHeaders(): Promise<HeadersInit> {
    const token = await auth?.currentUser?.getIdToken();
    if (!token) throw new Error('Not signed in');
    return {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
    };
}

function statusBadge(status?: string) {
    switch (status) {
        case 'published':
            return {
                label: 'Live on BookAddis',
                className:
                    'text-xs font-semibold text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-md',
            };
        case 'pending_review':
            return {
                label: 'Pending review',
                className:
                    'text-xs font-semibold text-orange-800 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-md',
            };
        case 'suspended':
            return {
                label: 'Suspended',
                className:
                    'text-xs font-semibold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-md',
            };
        default:
            return {
                label: 'Draft  hidden from guests',
                className:
                    'text-xs font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md',
            };
    }
}

/**
 * Super Admin: Nest Direct hotels  register via OTA-style wizard, then
 * publish only when business verification docs are on file.
 */
export function DirectHotelsPanel() {
    const [hotels, setHotels] = useState<DirectHotelRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [q, setQ] = useState('');
    const [busyId, setBusyId] = useState<string | null>(null);
    const [wizardOpen, setWizardOpen] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const headers = await authHeaders();
            const res = await fetch(
                '/api/admin/hotels?limit=100&inventory_source=bookaddis_direct',
                { headers },
            );
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                throw new Error(
                    (data as { error?: string }).error || 'Failed to load hotels',
                );
            }
            const items = Array.isArray(
                (data as { items?: DirectHotelRow[] }).items,
            )
                ? (data as { items: DirectHotelRow[] }).items
                : [];
            setHotels(items);
        } catch (e) {
            toast.error((e as Error).message || 'Failed to load Direct hotels');
            setHotels([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void load();
    }, [load]);

    const filtered = useMemo(() => {
        const needle = q.trim().toLowerCase();
        if (!needle) return hotels;
        return hotels.filter((h) => {
            const brand = String(
                h.amenities?.brand || h.amenities?.brand_name || '',
            );
            return (
                h.name.toLowerCase().includes(needle) ||
                (h.city || '').toLowerCase().includes(needle) ||
                brand.toLowerCase().includes(needle)
            );
        });
    }, [hotels, q]);

    const setStatus = async (
        hotelId: string,
        status: 'published' | 'draft' | 'pending_review',
    ) => {
        setBusyId(hotelId);
        try {
            const headers = await authHeaders();
            const res = await fetch(`/api/admin/hotels/${hotelId}`, {
                method: 'PUT',
                headers,
                body: JSON.stringify({ status }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                throw new Error(
                    (data as { error?: string; message?: string }).error ||
                        (data as { message?: string }).message ||
                        'Update failed',
                );
            }
            toast.success(
                status === 'published'
                    ? 'Published  guests can find this hotel when rooms & rates exist'
                    : status === 'pending_review'
                      ? 'Marked pending review'
                      : 'Unpublished  hidden from guest search',
            );
            await load();
        } catch (e) {
            toast.error((e as Error).message || 'Could not update status');
        } finally {
            setBusyId(null);
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 bg-slate-50/60">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-start gap-3">
                        <div className="p-2 bg-brand-primary/10 rounded-lg">
                            <Building2 className="w-5 h-5 text-brand-primary" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-900">
                                Direct hotels (BookAddis inventory)
                            </h2>
                            <p className="text-sm text-gray-500 mt-0.5 max-w-2xl">
                                Register with property details + business license
                                (OTA-style). Publish only after verification docs are
                                complete; hotel admins then set rooms and daily prices.
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => void load()}
                            disabled={loading}
                        >
                            <RefreshCw className="w-4 h-4 mr-1" />
                            Refresh
                        </Button>
                        <Button
                            type="button"
                            size="sm"
                            onClick={() => setWizardOpen(true)}
                        >
                            <Plus className="w-4 h-4 mr-1" />
                            Register hotel
                        </Button>
                    </div>
                </div>
            </div>

            <div className="px-6 py-3 border-b border-gray-100">
                <Input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Search by name, city, brand…"
                />
            </div>

            {loading ? (
                <AdminLoader label="Loading Direct hotels…" />
            ) : filtered.length === 0 ? (
                <p className="p-6 text-sm text-gray-500">
                    No Direct hotels yet. Use Register hotel, or approve a partner
                    request (create / link with KYC docs).
                </p>
            ) : (
                <ul className="divide-y divide-gray-100">
                    {filtered.map((h) => {
                        const brand = String(
                            h.amenities?.brand || h.amenities?.brand_name || '',
                        );
                        const badge = statusBadge(h.status);
                        const v = getHotelVerification(h.media);
                        const gate = hotelVerificationReady(v);
                        const published = h.status === 'published';
                        return (
                            <li
                                key={h.id}
                                className="flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between"
                            >
                                <div className="min-w-0">
                                    <div className="font-semibold text-brand-dark truncate">
                                        {h.name}
                                    </div>
                                    <div className="text-sm text-gray-600 mt-0.5">
                                        {[brand || null, h.city, h.inventory_source]
                                            .filter(Boolean)
                                            .join(' · ')}
                                    </div>
                                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                                        <span className={badge.className}>
                                            {badge.label}
                                        </span>
                                        <span
                                            className={
                                                gate.ok
                                                    ? 'text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md'
                                                    : 'text-xs font-semibold text-slate-600 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-md'
                                            }
                                        >
                                            {gate.ok
                                                ? 'Verification complete'
                                                : `Docs missing (${gate.missing.length})`}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-2 shrink-0">
                                    {published ? (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            disabled={busyId === h.id}
                                            onClick={() =>
                                                void setStatus(h.id, 'draft')
                                            }
                                        >
                                            Unpublish
                                        </Button>
                                    ) : (
                                        <Button
                                            size="sm"
                                            disabled={busyId === h.id}
                                            title={
                                                gate.ok
                                                    ? 'Publish to guest search'
                                                    : `Need: ${gate.missing.join(', ')}`
                                            }
                                            onClick={() =>
                                                void setStatus(h.id, 'published')
                                            }
                                        >
                                            Publish to BookAddis
                                        </Button>
                                    )}
                                    <Button size="sm" variant="outline" asChild>
                                        <Link href={`/admin/inventory/${h.id}`}>
                                            Manage hotel
                                            <ExternalLink className="w-3.5 h-3.5 ml-1" />
                                        </Link>
                                    </Button>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            )}

            <HotelRegistrationWizard
                open={wizardOpen}
                onClose={() => setWizardOpen(false)}
                onCreated={() => void load()}
            />
        </div>
    );
}
