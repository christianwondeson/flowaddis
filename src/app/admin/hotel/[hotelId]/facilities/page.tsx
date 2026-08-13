'use client';

import { Suspense, useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { hotelAdminFetch } from '@/lib/hotel-admin-api';
import { HotelSectionShell } from '@/components/hotel-portal/hotel-section-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AdminLoader } from '@/components/ui/admin-loader';
import { toast } from 'sonner';
import { Plus, X } from 'lucide-react';
import {
    FACILITY_GROUP_META,
    customFacilitiesFromRecord,
    labelAmenityKey,
    mergeFacilityAmenities,
} from '@/lib/hotel-amenity-labels';

function FacilitiesInner() {
    const params = useParams();
    const searchParams = useSearchParams();
    const hotelId = String(params.hotelId || '');
    const section = searchParams.get('section') || 'essentials';
    const [existingAmenities, setExistingAmenities] = useState<
        Record<string, unknown>
    >({});
    const [selected, setSelected] = useState<Record<string, boolean>>({});
    const [customFacilities, setCustomFacilities] = useState<string[]>([]);
    const [customDraft, setCustomDraft] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const base = `/admin/hotel/${hotelId}/facilities`;
    const nav = [
        ...FACILITY_GROUP_META.map((g) => ({
            id: g.id,
            label: g.facility_type_name,
            hint: g.hint,
            href: `${base}?section=${g.id}`,
        })),
        {
            id: 'custom',
            label: 'Custom',
            hint: 'Your own facilities',
            href: `${base}?section=custom`,
        },
    ];

    const group =
        FACILITY_GROUP_META.find((g) => g.id === section) ||
        (section === 'custom' ? null : FACILITY_GROUP_META[0]);
    const isCustom = section === 'custom';

    useEffect(() => {
        if (!hotelId) return;
        void (async () => {
            setLoading(true);
            try {
                const hotel = await hotelAdminFetch<{
                    amenities?: Record<string, unknown> | null;
                }>(`hotels/${hotelId}`);
                const am = hotel.amenities || {};
                setExistingAmenities(am);
                setCustomFacilities(customFacilitiesFromRecord(am));
                const next: Record<string, boolean> = {};
                for (const g of FACILITY_GROUP_META) {
                    for (const key of g.keys) {
                        next[key] =
                            am[key] === true ||
                            am[key] === 1 ||
                            am[key] === 'true';
                    }
                }
                setSelected(next);
            } catch (e) {
                toast.error((e as Error).message);
            } finally {
                setLoading(false);
            }
        })();
    }, [hotelId]);

    const save = async () => {
        setSaving(true);
        try {
            const amenities = mergeFacilityAmenities(
                existingAmenities,
                selected,
                customFacilities,
            );
            await hotelAdminFetch(`hotels/${hotelId}`, {
                method: 'PUT',
                body: JSON.stringify({ amenities }),
            });
            setExistingAmenities(amenities);
            toast.success(
                'Facilities updated  guests see these on the hotel page',
            );
        } catch (e) {
            toast.error((e as Error).message);
        } finally {
            setSaving(false);
        }
    };

    const addCustom = () => {
        const name = customDraft.trim();
        if (!name) return;
        if (
            customFacilities.some(
                (c) => c.toLowerCase() === name.toLowerCase(),
            )
        ) {
            toast.error('That facility is already listed');
            return;
        }
        if (customFacilities.length >= 40) {
            toast.error('Maximum 40 custom facilities');
            return;
        }
        setCustomFacilities((prev) => [...prev, name]);
        setCustomDraft('');
    };

    return (
        <HotelSectionShell
            title="Facilities"
            description="What guests see under Facilities on your hotel detail page. Save once  it syncs to BookAddis Direct."
            items={nav}
        >
            <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                        <h2 className="font-bold text-brand-dark">
                            {isCustom
                                ? 'Custom facilities'
                                : group?.facility_type_name}
                        </h2>
                        <p className="text-xs text-slate-500">
                            {isCustom
                                ? 'Add anything not in the catalog  shown under Other for guests'
                                : group?.hint}
                        </p>
                    </div>
                    <Button
                        onClick={() => void save()}
                        disabled={saving || loading}
                        className="w-full sm:w-auto"
                    >
                        {saving ? 'Saving…' : 'Save facilities'}
                    </Button>
                </div>

                {loading ? (
                    <AdminLoader label="Loading facilities…" />
                ) : isCustom ? (
                    <div className="space-y-4">
                        <div className="flex flex-col sm:flex-row gap-2">
                            <Input
                                value={customDraft}
                                onChange={(e) => setCustomDraft(e.target.value)}
                                placeholder="e.g. Prayer room, Rooftop terrace"
                                maxLength={80}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        addCustom();
                                    }
                                }}
                            />
                            <Button
                                type="button"
                                variant="outline"
                                onClick={addCustom}
                                className="shrink-0"
                            >
                                <Plus className="w-4 h-4 mr-1" />
                                Add
                            </Button>
                        </div>
                        {customFacilities.length === 0 ? (
                            <p className="text-sm text-slate-500">
                                No custom facilities yet.
                            </p>
                        ) : (
                            <ul className="flex flex-wrap gap-2">
                                {customFacilities.map((name) => (
                                    <li
                                        key={name}
                                        className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-medium text-brand-dark"
                                    >
                                        {name}
                                        <button
                                            type="button"
                                            aria-label={`Remove ${name}`}
                                            className="rounded-full p-0.5 text-slate-400 hover:bg-white hover:text-red-600"
                                            onClick={() =>
                                                setCustomFacilities((prev) =>
                                                    prev.filter((c) => c !== name),
                                                )
                                            }
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                        <p className="text-xs text-slate-500">
                            Remember to click Save facilities after adding or
                            removing items.
                        </p>
                    </div>
                ) : (
                    <ul className="grid gap-2 sm:grid-cols-2">
                        {(group?.keys || []).map((key) => (
                            <li key={key}>
                                <label className="flex items-center gap-3 rounded-lg border border-slate-100 px-3 py-3 hover:bg-slate-50 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="h-4 w-4 accent-brand-primary"
                                        checked={!!selected[key]}
                                        onChange={(e) =>
                                            setSelected((s) => ({
                                                ...s,
                                                [key]: e.target.checked,
                                            }))
                                        }
                                    />
                                    <span className="text-sm font-medium text-brand-dark">
                                        {labelAmenityKey(key)}
                                    </span>
                                </label>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </HotelSectionShell>
    );
}

export default function HotelFacilitiesPage() {
    return (
        <Suspense fallback={<AdminLoader label="Loading facilities…" />}>
            <FacilitiesInner />
        </Suspense>
    );
}
