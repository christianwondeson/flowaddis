'use client';

import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { hotelAdminFetch } from '@/lib/hotel-admin-api';
import { adminInventoryFetch } from '@/lib/admin-inventory-api';
import {
    formatMoney,
    normalizePricing,
    type PricingSettings,
} from '@/lib/hotel-pricing';
import { Button } from '@/components/ui/button';
import { AdminLoader } from '@/components/ui/admin-loader';
import { toast } from 'sonner';
import {
    HotelImageUploader,
    type HotelMediaPhoto,
} from '@/components/hotel-portal/hotel-image-uploader';
import { AdvancedRoomForm } from '@/components/inventory/advanced-room-form';
import { BookAddisLiveNote } from '@/components/hotel-portal/bookaddis-live-note';
import {
    buildCreateRoomBody,
    buildRatePlanBody,
    emptyAdvancedRoomForm,
    type AdvancedRoomFormState,
} from '@/lib/room-type-form';
import { BedDouble, CalendarDays, ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react';

type RoomType = {
    id: string;
    name: string;
    description?: string | null;
    max_occupancy: number;
    bed_configuration?: string | null;
    total_inventory: number;
    is_active: boolean;
    amenities?: Record<string, unknown> | null;
    media?: { photos?: HotelMediaPhoto[] } | null;
    rate_plans?: Array<{
        id: string;
        name: string;
        base_price?: number | null;
        currency: string;
    }>;
};

type Props = {
    hotelId: string;
    /** portal = hotel partner extranet; admin = Super Admin inventory */
    mode: 'portal' | 'admin';
    calendarHref: string;
    showLiveNote?: boolean;
};

async function invFetch<T>(
    mode: 'portal' | 'admin',
    path: string,
    init?: RequestInit,
): Promise<T> {
    if (mode === 'admin') return adminInventoryFetch<T>(path, init);
    return hotelAdminFetch<T>(path, init);
}

export function RoomsManager({
    hotelId,
    mode,
    calendarHref,
    showLiveNote = false,
}: Props) {
    const [rooms, setRooms] = useState<RoomType[]>([]);
    const [pricing, setPricing] = useState<PricingSettings>(normalizePricing());
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState<AdvancedRoomFormState>(emptyAdvancedRoomForm());
    const [draftPhotos, setDraftPhotos] = useState<HotelMediaPhoto[]>([]);
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const load = async () => {
        setLoading(true);
        setError(null);
        try {
            const [roomData, hotel] = await Promise.all([
                invFetch<RoomType[]>(mode, `hotels/${hotelId}/room-types`),
                invFetch<{ media?: { pricing?: Partial<PricingSettings> } | null }>(
                    mode,
                    `hotels/${hotelId}`,
                ),
            ]);
            setRooms(Array.isArray(roomData) ? roomData : []);
            setPricing(normalizePricing(hotel.media?.pricing as PricingSettings));
        } catch (e) {
            setError((e as Error).message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (hotelId) void load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [hotelId, mode]);

    const createRoom = async (e: FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const photos = draftPhotos.map((p, i) => ({
                url: p.url,
                sort: i,
                caption: p.caption,
                strapi_id: p.strapi_id ?? null,
            }));
            const room = await invFetch<RoomType>(mode, `hotels/${hotelId}/room-types`, {
                method: 'POST',
                body: JSON.stringify(buildCreateRoomBody(form, photos)),
            });

            if (form.base_price) {
                await invFetch(mode, `room-types/${room.id}/rate-plans`, {
                    method: 'POST',
                    body: JSON.stringify(buildRatePlanBody(form)),
                });
            }

            toast.success('Room type created');
            setShowForm(false);
            setForm(emptyAdvancedRoomForm());
            setDraftPhotos([]);
            await load();
        } catch (err) {
            toast.error((err as Error).message);
        } finally {
            setSaving(false);
        }
    };

    const saveRoomPhotos = async (room: RoomType, next: HotelMediaPhoto[]) => {
        try {
            await invFetch(mode, `room-types/${room.id}`, {
                method: 'PUT',
                body: JSON.stringify({
                    media: {
                        photos: next.map((p, i) => ({
                            url: p.url,
                            sort: i,
                            caption: p.caption,
                            strapi_id: p.strapi_id ?? null,
                        })),
                    },
                }),
            });
            toast.success('Room photos updated');
            await load();
        } catch (e) {
            toast.error((e as Error).message);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
                <div>
                    <h2 className="text-xl font-extrabold text-brand-dark tracking-tight">
                        Rooms & rates
                    </h2>
                    <p className="text-sm text-slate-600 mt-1">
                        Booking.com–style room details: beds, occupancy, facilities, and a
                        default rate plan.
                    </p>
                </div>
                <Button
                    onClick={() => setShowForm((v) => !v)}
                    className="w-full sm:w-auto"
                >
                    <Plus className="w-4 h-4 mr-1.5" />
                    {showForm ? 'Cancel' : 'Add room type'}
                </Button>
            </div>

            {showLiveNote ? <BookAddisLiveNote /> : null}

            <div className="rounded-xl border border-sky-100 bg-sky-50/80 px-4 py-3 text-sm text-sky-950">
                <span className="font-semibold">Daily prices: </span>
                Set the nightly amount your guests see  tax and other charges
                stay with the hotel.{' '}
                <Link
                    href={calendarHref}
                    className="font-semibold text-brand-primary underline-offset-2 hover:underline"
                >
                    Open Rates & calendar
                </Link>
            </div>

            {showForm && (
                <AdvancedRoomForm
                    hotelId={hotelId}
                    form={form}
                    setForm={setForm}
                    photos={draftPhotos}
                    setPhotos={setDraftPhotos}
                    pricing={pricing}
                    saving={saving}
                    onSubmit={createRoom}
                    onCancel={() => {
                        setShowForm(false);
                        setForm(emptyAdvancedRoomForm());
                        setDraftPhotos([]);
                    }}
                />
            )}

            {loading && <AdminLoader label="Loading rooms…" />}
            {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                    {error}
                </div>
            )}

            <ul className="space-y-3">
                {rooms.map((room) => {
                    const plan = room.rate_plans?.[0];
                    const photos = room.media?.photos || [];
                    const open = expandedId === room.id;
                    const occ = room.amenities?.occupancy as
                        | { max_adults?: number; max_children?: number }
                        | undefined;
                    return (
                        <li
                            key={room.id}
                            className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden"
                        >
                            <button
                                type="button"
                                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50/80"
                                onClick={() =>
                                    setExpandedId(open ? null : room.id)
                                }
                            >
                                <div className="h-14 w-14 shrink-0 rounded-lg overflow-hidden bg-brand-primary/10 border border-slate-100">
                                    {photos[0]?.url ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                            src={photos[0].url}
                                            alt=""
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        <div className="flex h-full w-full items-center justify-center">
                                            <BedDouble className="w-5 h-5 text-brand-primary" />
                                        </div>
                                    )}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="font-bold text-brand-dark truncate">
                                        {room.name}
                                    </div>
                                    <div className="text-xs text-slate-500 mt-0.5 truncate">
                                        {[
                                            room.bed_configuration,
                                            `${room.max_occupancy} guests`,
                                            occ?.max_adults != null
                                                ? `${occ.max_adults} adults`
                                                : null,
                                            `${room.total_inventory} to sell`,
                                        ]
                                            .filter(Boolean)
                                            .join(' · ')}
                                    </div>
                                </div>
                                <div className="text-right shrink-0">
                                    {plan?.base_price != null ? (
                                        <p className="text-sm font-bold text-brand-dark">
                                            {formatMoney(
                                                Number(plan.base_price),
                                                plan.currency || 'ETB',
                                            )}
                                        </p>
                                    ) : (
                                        <p className="text-xs text-amber-700">No rate</p>
                                    )}
                                    {open ? (
                                        <ChevronUp className="w-4 h-4 ml-auto text-slate-400" />
                                    ) : (
                                        <ChevronDown className="w-4 h-4 ml-auto text-slate-400" />
                                    )}
                                </div>
                            </button>
                            {open && (
                                <div className="border-t border-slate-100 px-4 py-4 space-y-3">
                                    {room.description ? (
                                        <p className="text-sm text-slate-600">
                                            {room.description}
                                        </p>
                                    ) : null}
                                    <div className="space-y-2">
                                        <p className="text-xs font-semibold text-slate-600">
                                            Room gallery (used on guest room cards  separate from
                                            hotel Photos section)
                                        </p>
                                        <HotelImageUploader
                                            hotelId={hotelId}
                                            category="rooms"
                                            label="Add room photos"
                                            hint="Upload multiple angles of this room type. These images sell this room specifically."
                                            onUploaded={(uploaded) => {
                                                void saveRoomPhotos(room, [
                                                    ...photos,
                                                    ...uploaded,
                                                ]);
                                            }}
                                        />
                                        {photos.length > 0 && (
                                            <ul className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                                                {photos.map((p, idx) => (
                                                    <li
                                                        key={`${p.url}-${idx}`}
                                                        className="relative group rounded-lg overflow-hidden border border-slate-200"
                                                    >
                                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                                        <img
                                                            src={p.url}
                                                            alt=""
                                                            className="h-20 w-full object-cover"
                                                        />
                                                        <button
                                                            type="button"
                                                            className="absolute top-1 right-1 rounded bg-white/90 p-1 text-red-600 opacity-0 group-hover:opacity-100 transition"
                                                            aria-label="Remove photo"
                                                            onClick={() =>
                                                                void saveRoomPhotos(
                                                                    room,
                                                                    photos.filter(
                                                                        (_, i) => i !== idx,
                                                                    ),
                                                                )
                                                            }
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                    <Link
                                        href={calendarHref}
                                        className="inline-flex items-center gap-1 text-sm font-semibold text-brand-primary hover:underline"
                                    >
                                        <CalendarDays className="w-4 h-4" />
                                        Set daily rates & availability
                                    </Link>
                                </div>
                            )}
                        </li>
                    );
                })}
            </ul>

            {!loading && !error && rooms.length === 0 && !showForm && (
                <p className="text-sm text-slate-500 text-center py-8">
                    No room types yet. Add one to sell on BookAddis.
                </p>
            )}
        </div>
    );
}
