'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { hotelAdminFetch } from '@/lib/hotel-admin-api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { AdminLoader } from '@/components/ui/admin-loader';
import { toast } from 'sonner';
import {
    Calendar as CalendarIcon,
    Percent,
    Tag,
    X,
    BedDouble,
    Building2,
    Plane,
    Users,
    CheckCircle2,
} from 'lucide-react';
import {
    normalizePromotions,
    PROMOTION_TYPE_LABELS,
    type HotelPromotion,
    type HotelPromotionType,
} from '@/lib/hotel-promotions';
import { formatAdminDate } from '@/lib/admin-date-format';
import { formatDateLocal, parseDateLocal } from '@/lib/date-utils';
import { cn } from '@/lib/utils';

function AdminDateField({
    label,
    value,
    onChange,
    minDate,
}: {
    label: string;
    value: string | null | undefined;
    onChange: (iso: string | null) => void;
    minDate?: Date;
}) {
    return (
        <div className="space-y-1.5">
            <Label>{label}</Label>
            <div className="flex gap-2">
                <Popover
                    trigger={
                        <button
                            type="button"
                            className="flex h-10 w-full items-center gap-2 rounded-md border border-input bg-background px-3 text-sm text-left hover:border-brand-primary/40"
                        >
                            <CalendarIcon className="w-4 h-4 text-slate-400 shrink-0" />
                            <span
                                className={
                                    value
                                        ? 'text-brand-dark font-medium'
                                        : 'text-slate-400'
                                }
                            >
                                {value ? formatAdminDate(value) : 'Select date'}
                            </span>
                        </button>
                    }
                    content={
                        <div className="p-2">
                            <Calendar
                                selected={
                                    value ? parseDateLocal(value) : undefined
                                }
                                minDate={minDate}
                                onSelect={(d) => onChange(formatDateLocal(d))}
                            />
                        </div>
                    }
                />
                {value ? (
                    <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="shrink-0"
                        aria-label="Clear date"
                        onClick={() => onChange(null)}
                    >
                        <X className="w-4 h-4" />
                    </Button>
                ) : null}
            </div>
        </div>
    );
}

type RoomOption = {
    id: string;
    name: string;
};

const empty = (): Omit<HotelPromotion, 'id'> => ({
    type: 'early_bird',
    name: '',
    discount_percent: 10,
    active: true,
    code: '',
    book_window_days: 14,
    min_nights: 3,
    valid_from: null,
    valid_to: null,
    description: '',
    applicable_room_ids: ['all'],
    applicable_room_names: ['All room types'],
    facility_scope: ['hotel_room'],
});

export default function HotelPromotionsPage() {
    const params = useParams();
    const hotelId = String(params.hotelId || '');
    const [items, setItems] = useState<HotelPromotion[]>([]);
    const [rooms, setRooms] = useState<RoomOption[]>([]);
    const [mediaRest, setMediaRest] = useState<Record<string, unknown>>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState(empty);
    const [roomScopeMode, setRoomScopeMode] = useState<'all' | 'specific'>('all');

    const load = async () => {
        setLoading(true);
        try {
            const [hotel, roomList] = await Promise.all([
                hotelAdminFetch<{
                    media?: (Record<string, unknown> & { promotions?: unknown }) | null;
                }>(`hotels/${hotelId}`),
                hotelAdminFetch<RoomOption[]>(`hotels/${hotelId}/room-types`).catch(() => []),
            ]);

            const media = (hotel.media || {}) as Record<string, unknown> & {
                promotions?: unknown;
            };
            const { promotions, ...rest } = media;
            setMediaRest(rest);
            setItems(normalizePromotions(promotions));
            setRooms(Array.isArray(roomList) ? roomList : []);
        } catch (e) {
            toast.error((e as Error).message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (hotelId) void load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [hotelId]);

    const persist = async (next: HotelPromotion[]) => {
        setSaving(true);
        try {
            await hotelAdminFetch(`hotels/${hotelId}`, {
                method: 'PUT',
                body: JSON.stringify({
                    media: { ...mediaRest, promotions: next },
                }),
            });
            setItems(next);
            toast.success('Promotions saved');
        } catch (e) {
            toast.error((e as Error).message);
        } finally {
            setSaving(false);
        }
    };

    const toggleRoom = (roomId: string, roomName: string) => {
        const current = form.applicable_room_ids || [];
        const isSelected = current.includes(roomId);
        let nextIds: string[];
        let nextNames: string[];

        if (isSelected) {
            nextIds = current.filter((id) => id !== roomId && id !== 'all');
            nextNames = (form.applicable_room_names || []).filter((n) => n !== roomName);
            if (nextIds.length === 0) {
                nextIds = ['all'];
                nextNames = ['All room types'];
            }
        } else {
            nextIds = [...current.filter((id) => id !== 'all'), roomId];
            nextNames = [...(form.applicable_room_names || []).filter((n) => n !== 'All room types'), roomName];
        }

        setForm((f) => ({
            ...f,
            applicable_room_ids: nextIds,
            applicable_room_names: nextNames,
        }));
    };

    const toggleFacility = (facility: 'hotel_room' | 'airport_shuttle' | 'conference') => {
        const current = form.facility_scope || ['hotel_room'];
        const isSelected = current.includes(facility);
        let next: Array<'hotel_room' | 'airport_shuttle' | 'conference'>;
        if (isSelected) {
            next = current.filter((f) => f !== facility);
            if (next.length === 0) next = ['hotel_room'];
        } else {
            next = [...current, facility];
        }
        setForm((f) => ({ ...f, facility_scope: next }));
    };

    const add = (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name.trim()) {
            toast.error('Promotion name is required');
            return;
        }
        if (form.type === 'promo_code' && !form.code?.trim()) {
            toast.error('Promo code is required');
            return;
        }

        const resolvedRoomIds =
            roomScopeMode === 'all'
                ? ['all']
                : form.applicable_room_ids && form.applicable_room_ids.length > 0
                  ? form.applicable_room_ids
                  : ['all'];

        const resolvedRoomNames =
            roomScopeMode === 'all'
                ? ['All room types']
                : rooms
                      .filter((r) => resolvedRoomIds.includes(r.id))
                      .map((r) => r.name);

        const row: HotelPromotion = {
            id: crypto.randomUUID(),
            ...form,
            name: form.name.trim(),
            applicable_room_ids: resolvedRoomIds,
            applicable_room_names: resolvedRoomNames.length > 0 ? resolvedRoomNames : ['All room types'],
            code:
                form.type === 'promo_code'
                    ? form.code?.trim().toUpperCase()
                    : undefined,
        };
        void persist([...items, row]).then(() => {
            setForm(empty());
            setRoomScopeMode('all');
        });
    };

    if (loading) return <AdminLoader label="Loading promotions…" />;

    return (
        <div className="space-y-6 max-w-4xl">
            <div>
                <h1 className="text-2xl font-extrabold text-brand-dark">Promotions & Deals</h1>
                <p className="text-sm text-slate-600 mt-1">
                    Industry-standard promotional levers aligned with Booking.com. Choose targeted room types,
                    facilities, and dates to boost occupancy while protecting rate integrity.
                </p>
            </div>

            {/* Create Promotion Form */}
            <form
                onSubmit={add}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-5"
            >
                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5 sm:col-span-2">
                        <Label className="font-bold">Promotion / Campaign Name *</Label>
                        <Input
                            value={form.name}
                            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                            placeholder="e.g. Early Bird Summer Deal — 15% off"
                            required
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label className="font-bold">Promotion Type</Label>
                        <select
                            className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                            value={form.type}
                            onChange={(e) =>
                                setForm((f) => ({
                                    ...f,
                                    type: e.target.value as HotelPromotionType,
                                }))
                            }
                        >
                            {(Object.keys(PROMOTION_TYPE_LABELS) as HotelPromotionType[]).map(
                                (k) => (
                                    <option key={k} value={k}>
                                        {PROMOTION_TYPE_LABELS[k]}
                                    </option>
                                ),
                            )}
                        </select>
                    </div>
                    <div className="space-y-1.5">
                        <Label className="font-bold">Discount Percentage (%) *</Label>
                        <div className="relative">
                            <Input
                                type="number"
                                min={1}
                                max={90}
                                value={form.discount_percent}
                                onChange={(e) =>
                                    setForm((f) => ({
                                        ...f,
                                        discount_percent: Number(e.target.value) || 1,
                                    }))
                                }
                                required
                            />
                            <Percent className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                        </div>
                    </div>

                    {form.type === 'promo_code' && (
                        <div className="space-y-1.5 sm:col-span-2">
                            <Label className="font-bold">Promo Code (Uppercase)</Label>
                            <Input
                                value={form.code || ''}
                                onChange={(e) =>
                                    setForm((f) => ({
                                        ...f,
                                        code: e.target.value.toUpperCase(),
                                    }))
                                }
                                placeholder="SUMMER15"
                                className="font-mono uppercase font-bold"
                            />
                        </div>
                    )}

                    {(form.type === 'early_bird' || form.type === 'last_minute') && (
                        <div className="space-y-1.5 sm:col-span-2">
                            <Label className="font-bold">
                                {form.type === 'early_bird'
                                    ? 'Book at least N days before check-in'
                                    : 'Book within N days of check-in'}
                            </Label>
                            <Input
                                type="number"
                                min={1}
                                value={form.book_window_days ?? 14}
                                onChange={(e) =>
                                    setForm((f) => ({
                                        ...f,
                                        book_window_days: Number(e.target.value) || 1,
                                    }))
                                }
                            />
                        </div>
                    )}

                    {form.type === 'long_stay' && (
                        <div className="space-y-1.5 sm:col-span-2">
                            <Label className="font-bold">Minimum nights required</Label>
                            <Input
                                type="number"
                                min={2}
                                value={form.min_nights ?? 3}
                                onChange={(e) =>
                                    setForm((f) => ({
                                        ...f,
                                        min_nights: Number(e.target.value) || 2,
                                    }))
                                }
                            />
                        </div>
                    )}

                    <AdminDateField
                        label="Valid from (optional)"
                        value={form.valid_from}
                        onChange={(iso) =>
                            setForm((f) => ({
                                ...f,
                                valid_from: iso,
                                valid_to:
                                    iso && f.valid_to && f.valid_to < iso
                                        ? null
                                        : f.valid_to,
                            }))
                        }
                    />
                    <AdminDateField
                        label="Valid to (optional)"
                        value={form.valid_to}
                        minDate={
                            form.valid_from
                                ? parseDateLocal(form.valid_from)
                                : undefined
                        }
                        onChange={(iso) =>
                            setForm((f) => ({
                                ...f,
                                valid_to: iso,
                            }))
                        }
                    />
                </div>

                {/* Booking.com Aligned: Targeted Room Selection */}
                <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                        <div>
                            <Label className="font-bold text-slate-900 flex items-center gap-1.5">
                                <BedDouble className="w-4 h-4 text-brand-primary" />
                                <span>Applicable Room Types</span>
                            </Label>
                            <p className="text-xs text-slate-500 mt-0.5">
                                Specify whether this promotion applies to all rooms or only select inventory types.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 text-xs font-semibold text-slate-800">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="radio"
                                name="roomScope"
                                value="all"
                                checked={roomScopeMode === 'all'}
                                onChange={() => {
                                    setRoomScopeMode('all');
                                    setForm((f) => ({
                                        ...f,
                                        applicable_room_ids: ['all'],
                                        applicable_room_names: ['All room types'],
                                    }));
                                }}
                                className="h-4 w-4 accent-brand-primary"
                            />
                            <span>All room types (Property-wide)</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="radio"
                                name="roomScope"
                                value="specific"
                                checked={roomScopeMode === 'specific'}
                                onChange={() => setRoomScopeMode('specific')}
                                className="h-4 w-4 accent-brand-primary"
                            />
                            <span>Specific room types only</span>
                        </label>
                    </div>

                    {roomScopeMode === 'specific' && (
                        <div className="pt-2 border-t border-slate-200/60">
                            {rooms.length === 0 ? (
                                <p className="text-xs text-slate-500 italic">
                                    No room types loaded. Create room types first in Inventory &gt; Rooms.
                                </p>
                            ) : (
                                <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
                                    {rooms.map((room) => {
                                        const isSelected =
                                            Boolean(form.applicable_room_ids?.includes(room.id)) &&
                                            !form.applicable_room_ids?.includes('all');
                                        return (
                                            <label
                                                key={room.id}
                                                className={cn(
                                                    'flex items-center gap-2.5 p-2 rounded-lg border text-xs cursor-pointer transition-all',
                                                    isSelected
                                                        ? 'border-brand-primary bg-brand-primary/5 font-semibold text-brand-dark'
                                                        : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700',
                                                )}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() => toggleRoom(room.id, room.name)}
                                                    className="h-4 w-4 rounded accent-brand-primary"
                                                />
                                                <span className="truncate">{room.name}</span>
                                            </label>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Facility Scope */}
                <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-4 space-y-2.5">
                    <Label className="font-bold text-slate-900 flex items-center gap-1.5">
                        <Building2 className="w-4 h-4 text-brand-primary" />
                        <span>Facility &amp; Services Scope</span>
                    </Label>
                    <div className="flex flex-wrap gap-3 text-xs font-semibold text-slate-800">
                        <label className="flex items-center gap-2 cursor-pointer bg-white px-3 py-1.5 rounded-lg border border-slate-200">
                            <input
                                type="checkbox"
                                checked={form.facility_scope?.includes('hotel_room') ?? true}
                                onChange={() => toggleFacility('hotel_room')}
                                className="h-4 w-4 rounded accent-brand-primary"
                            />
                            <BedDouble className="w-3.5 h-3.5 text-slate-500" />
                            <span>Hotel Stays / Rooms</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer bg-white px-3 py-1.5 rounded-lg border border-slate-200">
                            <input
                                type="checkbox"
                                checked={form.facility_scope?.includes('airport_shuttle') ?? false}
                                onChange={() => toggleFacility('airport_shuttle')}
                                className="h-4 w-4 rounded accent-brand-primary"
                            />
                            <Plane className="w-3.5 h-3.5 text-slate-500" />
                            <span>Airport Shuttle</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer bg-white px-3 py-1.5 rounded-lg border border-slate-200">
                            <input
                                type="checkbox"
                                checked={form.facility_scope?.includes('conference') ?? false}
                                onChange={() => toggleFacility('conference')}
                                className="h-4 w-4 rounded accent-brand-primary"
                            />
                            <Users className="w-3.5 h-3.5 text-slate-500" />
                            <span>Conference &amp; Meetings</span>
                        </label>
                    </div>
                </div>

                <div>
                    <Button type="submit" disabled={saving} className="bg-brand-primary text-white hover:bg-teal-700 font-bold">
                        {saving ? 'Saving…' : 'Add Promotion'}
                    </Button>
                </div>
            </form>

            {/* Active Promotions List */}
            <div className="space-y-3">
                <h2 className="text-lg font-extrabold text-brand-dark">Active Promotions ({items.length})</h2>
                <ul className="space-y-2.5">
                    {items.map((p) => {
                        const isAllRooms =
                            !p.applicable_room_ids ||
                            p.applicable_room_ids.length === 0 ||
                            p.applicable_room_ids.includes('all');
                        return (
                            <li
                                key={p.id}
                                className="rounded-xl border border-slate-200 bg-white p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm"
                            >
                                <div className="flex items-start gap-3.5 min-w-0">
                                    <div className="h-11 w-11 rounded-xl bg-brand-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                                        {p.type === 'promo_code' ? (
                                            <Tag className="w-5 h-5 text-brand-primary" />
                                        ) : (
                                            <Percent className="w-5 h-5 text-brand-primary" />
                                        )}
                                    </div>
                                    <div className="min-w-0 space-y-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <p className="font-extrabold text-brand-dark text-base">{p.name}</p>
                                            <span className="rounded bg-emerald-100 px-2 py-0.5 text-xs font-extrabold text-emerald-800">
                                                {p.discount_percent}% OFF
                                            </span>
                                            {p.code && (
                                                <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-mono font-bold text-amber-900">
                                                    CODE: {p.code}
                                                </span>
                                            )}
                                        </div>

                                        <p className="text-xs text-slate-500">
                                            {PROMOTION_TYPE_LABELS[p.type]}
                                            {p.book_window_days ? ` · ${p.book_window_days}d advance window` : ''}
                                            {p.min_nights ? ` · min ${p.min_nights} nights` : ''}
                                        </p>

                                        {/* Scope Badges */}
                                        <div className="flex flex-wrap gap-1.5 pt-1 text-[11px]">
                                            <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 font-semibold text-slate-700">
                                                <BedDouble className="w-3 h-3 text-slate-500" />
                                                {isAllRooms
                                                    ? 'All Room Types'
                                                    : `Rooms: ${p.applicable_room_names?.join(', ') || p.applicable_room_ids?.join(', ')}`}
                                            </span>
                                            {p.facility_scope && p.facility_scope.length > 0 && (
                                                <span className="inline-flex items-center gap-1 rounded-md bg-teal-50 px-2 py-0.5 font-semibold text-teal-800">
                                                    <Building2 className="w-3 h-3 text-teal-600" />
                                                    {p.facility_scope.map((f) => f.replace('_', ' ')).join(' · ')}
                                                </span>
                                            )}
                                        </div>

                                        {(p.valid_from || p.valid_to) && (
                                            <p className="text-[11px] text-slate-400">
                                                Valid: {p.valid_from ? formatAdminDate(p.valid_from) : 'Anytime'}{' '}
                                                → {p.valid_to ? formatAdminDate(p.valid_to) : 'Open-ended'}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                                    <button
                                        type="button"
                                        className={cn(
                                            'px-3 py-1.5 text-xs font-bold rounded-lg transition-colors border',
                                            p.active
                                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                                                : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200',
                                        )}
                                        onClick={() =>
                                            void persist(
                                                items.map((x) =>
                                                    x.id === p.id
                                                        ? { ...x, active: !x.active }
                                                        : x,
                                                ),
                                            )
                                        }
                                    >
                                        {p.active ? 'Active' : 'Paused'}
                                    </button>
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        className="text-red-600 border-red-200 hover:bg-red-50"
                                        onClick={() =>
                                            void persist(items.filter((x) => x.id !== p.id))
                                        }
                                    >
                                        Remove
                                    </Button>
                                </div>
                            </li>
                        );
                    })}
                    {items.length === 0 && (
                        <li className="rounded-xl border border-dashed border-slate-300 bg-white px-5 py-10 text-center text-sm text-slate-500">
                            No promotions yet. Add early bird, last-minute, or promo codes to boost bookings.
                        </li>
                    )}
                </ul>
            </div>
        </div>
    );
}
