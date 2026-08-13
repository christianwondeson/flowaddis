'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    HotelImageUploader,
    type HotelMediaPhoto,
} from '@/components/hotel-portal/hotel-image-uploader';
import {
    AdvancedRoomFormState,
    BED_TYPE_LABELS,
    BedType,
    ROOM_AMENITY_OPTIONS,
    ROOM_CATEGORY_LABELS,
    RoomCategory,
    formatBedConfiguration,
    sleepingSpots,
} from '@/lib/room-type-form';
import { formatMoney, type PricingSettings } from '@/lib/hotel-pricing';
import { Plus, Trash2 } from 'lucide-react';

type Props = {
    hotelId: string;
    form: AdvancedRoomFormState;
    setForm: React.Dispatch<React.SetStateAction<AdvancedRoomFormState>>;
    photos: HotelMediaPhoto[];
    setPhotos: React.Dispatch<React.SetStateAction<HotelMediaPhoto[]>>;
    pricing: PricingSettings;
    saving: boolean;
    onSubmit: (e: React.FormEvent) => void;
    onCancel: () => void;
    title?: string;
};

/**
 * Booking.com Extranet–style room details: beds, occupancy (adults/children/infants),
 * amenities, inventory, and rate plan defaults.
 */
export function AdvancedRoomForm({
    hotelId,
    form,
    setForm,
    photos,
    setPhotos,
    pricing: _pricing,
    saving,
    onSubmit,
    onCancel,
    title = 'Add room type',
}: Props) {
    const spots = sleepingSpots(form.beds);

    const syncOccupancyFromTotal = (total: string) => {
        const n = Math.max(1, Number(total) || 1);
        setForm((f) => ({
            ...f,
            max_occupancy: String(n),
            max_adults: String(n),
            max_children: String(Math.max(0, n - 1)),
            max_infants: String(Math.max(0, n - 1)),
        }));
    };

    return (
        <form
            onSubmit={onSubmit}
            className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden"
        >
            <div className="bg-slate-50 border-b border-slate-100 px-5 py-3">
                <h2 className="font-bold text-brand-dark">{title}</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                    Modeled on Booking.com Room details  occupancy, bed options, and rate
                    so guests see the right room in search.
                </p>
            </div>

            <div className="p-5 space-y-8">
                {/* Basics */}
                <section className="space-y-4">
                    <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500">
                        Room basics
                    </h3>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2 sm:col-span-2">
                            <Label>Room name</Label>
                            <Input
                                required
                                value={form.name}
                                onChange={(e) =>
                                    setForm((f) => ({ ...f, name: e.target.value }))
                                }
                                placeholder="Deluxe Twin Room"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Room category</Label>
                            <select
                                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                value={form.category}
                                onChange={(e) =>
                                    setForm((f) => ({
                                        ...f,
                                        category: e.target.value as RoomCategory,
                                    }))
                                }
                            >
                                {Object.entries(ROOM_CATEGORY_LABELS).map(([k, label]) => (
                                    <option key={k} value={k}>
                                        {label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <Label>Smoking policy</Label>
                            <select
                                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                value={form.smoking}
                                onChange={(e) =>
                                    setForm((f) => ({
                                        ...f,
                                        smoking: e.target.value as AdvancedRoomFormState['smoking'],
                                    }))
                                }
                            >
                                <option value="non_smoking">Non-smoking</option>
                                <option value="smoking">Smoking</option>
                                <option value="both">Both options</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <Label>Room size (m²)</Label>
                            <Input
                                type="number"
                                min={0}
                                step="0.1"
                                value={form.size_sqm}
                                onChange={(e) =>
                                    setForm((f) => ({ ...f, size_sqm: e.target.value }))
                                }
                                placeholder="28"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Number of rooms to sell</Label>
                            <Input
                                type="number"
                                min={0}
                                required
                                value={form.total_inventory}
                                onChange={(e) =>
                                    setForm((f) => ({
                                        ...f,
                                        total_inventory: e.target.value,
                                    }))
                                }
                            />
                            <p className="text-xs text-slate-500">
                                How many physical units of this type (Booking.com “rooms to
                                sell”).
                            </p>
                        </div>
                        <div className="space-y-2 sm:col-span-2">
                            <Label>Description (guest-facing)</Label>
                            <textarea
                                className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                                value={form.description}
                                onChange={(e) =>
                                    setForm((f) => ({
                                        ...f,
                                        description: e.target.value,
                                    }))
                                }
                                placeholder="Bright twin room with city view, desk, and en-suite shower…"
                            />
                        </div>
                    </div>
                </section>

                {/* Beds */}
                <section className="space-y-4">
                    <div className="flex items-center justify-between gap-2">
                        <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500">
                            Bed options
                        </h3>
                        <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() =>
                                setForm((f) => ({
                                    ...f,
                                    beds: [...f.beds, { type: 'single', count: 1 }],
                                }))
                            }
                        >
                            <Plus className="w-3.5 h-3.5 mr-1" />
                            Add bed type
                        </Button>
                    </div>
                    <p className="text-xs text-slate-500">
                        Sleeping spots from beds: <strong>{spots}</strong>
                        {form.beds.length
                            ? ` · ${formatBedConfiguration(form.beds)}`
                            : ''}
                        . Align max guests with real bed capacity.
                    </p>
                    <ul className="space-y-2">
                        {form.beds.map((bed, idx) => (
                            <li
                                key={idx}
                                className="grid grid-cols-[1fr_100px_40px] gap-2 items-end"
                            >
                                <div className="space-y-1">
                                    <Label className="text-xs">Bed type</Label>
                                    <select
                                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                        value={bed.type}
                                        onChange={(e) => {
                                            const type = e.target.value as BedType;
                                            setForm((f) => {
                                                const beds = [...f.beds];
                                                beds[idx] = { ...beds[idx], type };
                                                return { ...f, beds };
                                            });
                                        }}
                                    >
                                        {Object.entries(BED_TYPE_LABELS).map(([k, label]) => (
                                            <option key={k} value={k}>
                                                {label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs">Count</Label>
                                    <Input
                                        type="number"
                                        min={1}
                                        max={10}
                                        value={bed.count}
                                        onChange={(e) => {
                                            const count = Math.max(
                                                1,
                                                Number(e.target.value) || 1,
                                            );
                                            setForm((f) => {
                                                const beds = [...f.beds];
                                                beds[idx] = { ...beds[idx], count };
                                                return { ...f, beds };
                                            });
                                        }}
                                    />
                                </div>
                                <Button
                                    type="button"
                                    size="icon"
                                    variant="ghost"
                                    className="text-red-600"
                                    disabled={form.beds.length <= 1}
                                    onClick={() =>
                                        setForm((f) => ({
                                            ...f,
                                            beds: f.beds.filter((_, i) => i !== idx),
                                        }))
                                    }
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </li>
                        ))}
                    </ul>
                </section>

                {/* Occupancy  Booking.com family settings */}
                <section className="space-y-4">
                    <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500">
                        Occupancy (families)
                    </h3>
                    <p className="text-xs text-slate-500">
                        Booking.com tip: set max adults = total guests; max children / infants =
                        total − 1 so at least one adult is required.
                    </p>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <div className="space-y-2">
                            <Label>Max total guests</Label>
                            <Input
                                type="number"
                                min={1}
                                max={20}
                                required
                                value={form.max_occupancy}
                                onChange={(e) => syncOccupancyFromTotal(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Max adults (18+)</Label>
                            <Input
                                type="number"
                                min={1}
                                max={20}
                                value={form.max_adults}
                                onChange={(e) =>
                                    setForm((f) => ({ ...f, max_adults: e.target.value }))
                                }
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Max children (3–17)</Label>
                            <Input
                                type="number"
                                min={0}
                                max={20}
                                value={form.max_children}
                                onChange={(e) =>
                                    setForm((f) => ({
                                        ...f,
                                        max_children: e.target.value,
                                    }))
                                }
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Max infants (0–2)</Label>
                            <Input
                                type="number"
                                min={0}
                                max={20}
                                value={form.max_infants}
                                onChange={(e) =>
                                    setForm((f) => ({
                                        ...f,
                                        max_infants: e.target.value,
                                    }))
                                }
                            />
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm">
                        <label className="inline-flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={form.exclude_infants}
                                onChange={(e) =>
                                    setForm((f) => ({
                                        ...f,
                                        exclude_infants: e.target.checked,
                                    }))
                                }
                            />
                            Exclude infants from total guests
                        </label>
                        <label className="inline-flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={form.extra_bed}
                                onChange={(e) =>
                                    setForm((f) => ({ ...f, extra_bed: e.target.checked }))
                                }
                            />
                            Extra bed available
                        </label>
                        <label className="inline-flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={form.crib}
                                onChange={(e) =>
                                    setForm((f) => ({ ...f, crib: e.target.checked }))
                                }
                            />
                            Crib / cot available
                        </label>
                    </div>
                </section>

                {/* Amenities */}
                <section className="space-y-3">
                    <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500">
                        Room facilities
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                        {ROOM_AMENITY_OPTIONS.map((a) => (
                            <label
                                key={a.key}
                                className="inline-flex items-center gap-2 text-sm rounded-lg border border-slate-100 px-2 py-1.5 hover:bg-slate-50"
                            >
                                <input
                                    type="checkbox"
                                    checked={Boolean(form.amenityFlags[a.key])}
                                    onChange={(e) =>
                                        setForm((f) => ({
                                            ...f,
                                            amenityFlags: {
                                                ...f.amenityFlags,
                                                [a.key]: e.target.checked,
                                            },
                                        }))
                                    }
                                />
                                {a.label}
                            </label>
                        ))}
                    </div>
                </section>

                {/* Rate plan */}
                <section className="space-y-4">
                    <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500">
                        Default rate plan
                    </h3>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label>Rate plan name</Label>
                            <Input
                                value={form.rate_plan_name}
                                onChange={(e) =>
                                    setForm((f) => ({
                                        ...f,
                                        rate_plan_name: e.target.value,
                                    }))
                                }
                                placeholder="Standard rate"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Currency</Label>
                            <Input
                                value={form.currency}
                                onChange={(e) =>
                                    setForm((f) => ({
                                        ...f,
                                        currency: e.target.value.toUpperCase(),
                                    }))
                                }
                                maxLength={3}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Base nightly rate</Label>
                            <Input
                                type="number"
                                min={0}
                                value={form.base_price}
                                onChange={(e) =>
                                    setForm((f) => ({
                                        ...f,
                                        base_price: e.target.value,
                                    }))
                                }
                                placeholder="4500"
                            />
                            {form.base_price !== '' &&
                            Number.isFinite(Number(form.base_price)) ? (
                                <p className="text-xs text-slate-600">
                                    Nightly price:{' '}
                                    <strong>
                                        {formatMoney(
                                            Number(form.base_price),
                                            form.currency || 'ETB',
                                        )}
                                    </strong>{' '}
                                    (stored as entered)
                                </p>
                            ) : null}
                        </div>
                        <div className="space-y-2">
                            <Label>Free cancellation (hours before check-in)</Label>
                            <Input
                                type="number"
                                min={0}
                                value={form.free_cancellation_hours}
                                onChange={(e) =>
                                    setForm((f) => ({
                                        ...f,
                                        free_cancellation_hours: e.target.value,
                                    }))
                                }
                            />
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm">
                        <label className="inline-flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={form.refundable}
                                onChange={(e) =>
                                    setForm((f) => ({
                                        ...f,
                                        refundable: e.target.checked,
                                    }))
                                }
                            />
                            Refundable
                        </label>
                        <label className="inline-flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={form.prepay}
                                onChange={(e) =>
                                    setForm((f) => ({ ...f, prepay: e.target.checked }))
                                }
                            />
                            Pay now (prepay)
                        </label>
                        <label className="inline-flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={form.pay_at_property}
                                onChange={(e) =>
                                    setForm((f) => ({
                                        ...f,
                                        pay_at_property: e.target.checked,
                                    }))
                                }
                            />
                            Pay at property
                        </label>
                    </div>
                </section>

                {/* Photos */}
                <section className="space-y-3">
                    <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500">
                        Room photos
                    </h3>
                    <HotelImageUploader
                        hotelId={hotelId}
                        label="Upload room photos"
                        onUploaded={(uploaded) => {
                            setPhotos((prev) => [
                                ...prev,
                                ...uploaded.map((p, i) => ({
                                    ...p,
                                    sort: prev.length + i,
                                })),
                            ]);
                        }}
                    />
                    {photos.length > 0 && (
                        <ul className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                            {photos.map((p, idx) => (
                                <li
                                    key={`${p.url}-${idx}`}
                                    className="relative aspect-[4/3] rounded-lg overflow-hidden border border-slate-200"
                                >
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={p.url}
                                        alt=""
                                        className="h-full w-full object-cover"
                                    />
                                    <button
                                        type="button"
                                        className="absolute top-1 right-1 rounded bg-black/60 text-white text-xs px-1.5 py-0.5"
                                        onClick={() =>
                                            setPhotos((prev) =>
                                                prev.filter((_, i) => i !== idx),
                                            )
                                        }
                                    >
                                        Remove
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>

                <div className="flex flex-wrap justify-end gap-2 pt-2 border-t border-slate-100">
                    <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={saving}>
                        {saving ? 'Saving…' : 'Create room type'}
                    </Button>
                </div>
            </div>
        </form>
    );
}
