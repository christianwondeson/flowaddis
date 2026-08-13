'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { hotelAdminFetch } from '@/lib/hotel-admin-api';
import { HotelSectionShell } from '@/components/hotel-portal/hotel-section-shell';
import {
    HotelImageUploader,
    type HotelMediaPhoto,
} from '@/components/hotel-portal/hotel-image-uploader';
import { toast } from 'sonner';
import { ImagePlus, Trash2 } from 'lucide-react';
import { HOTEL_AMENITY_LABELS } from '@/lib/hotel-amenity-labels';
import { AdminLoader } from '@/components/ui/admin-loader';

const CATEGORIES = [
    { id: 'exterior', label: 'Exterior', hint: 'Building & entrance' },
    { id: 'rooms', label: 'Rooms', hint: 'Link to a room type' },
    { id: 'bathroom', label: 'Bathroom', hint: 'Showers & amenities' },
    { id: 'dining', label: 'Dining', hint: 'Restaurant & breakfast' },
    { id: 'facilities', label: 'Facilities', hint: 'Link to a facility' },
    { id: 'other', label: 'Other', hint: 'Lobby, views, extras' },
] as const;

type Photo = HotelMediaPhoto;
type RoomType = { id: string; name: string };

function PhotosInner() {
    const params = useParams();
    const searchParams = useSearchParams();
    const hotelId = String(params.hotelId || '');
    const section = searchParams.get('section') || 'exterior';

    const [photos, setPhotos] = useState<Photo[]>([]);
    const [mediaRest, setMediaRest] = useState<Record<string, unknown>>({});
    const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
    const [amenityKeys, setAmenityKeys] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [linkRoomTypeId, setLinkRoomTypeId] = useState('');
    const [linkAmenityKey, setLinkAmenityKey] = useState('');

    const base = `/admin/hotel/${hotelId}/photos`;
    const nav = CATEGORIES.map((c) => ({
        id: c.id,
        label: c.label,
        hint: c.hint,
        href: `${base}?section=${c.id}`,
    }));

    const load = async () => {
        setLoading(true);
        try {
            const [hotel, rooms] = await Promise.all([
                hotelAdminFetch<{
                    media?: (Record<string, unknown> & { photos?: Photo[] }) | null;
                    amenities?: Record<string, unknown> | null;
                }>(`hotels/${hotelId}`),
                hotelAdminFetch<RoomType[]>(`hotels/${hotelId}/room-types`),
            ]);
            const media = (hotel.media || {}) as Record<string, unknown> & {
                photos?: Photo[];
            };
            const { photos: existing, ...rest } = media;
            setMediaRest(rest);
            const list = Array.isArray(existing) ? existing : [];
            setPhotos(
                list.map((p, i) => ({
                    ...p,
                    sort: p.sort ?? i,
                    category: p.category || 'other',
                    room_type_id: p.room_type_id ?? null,
                    amenity_key: p.amenity_key ?? null,
                })),
            );
            setRoomTypes(Array.isArray(rooms) ? rooms : []);
            const amenities = hotel.amenities || {};
            setAmenityKeys(
                Object.keys(amenities).filter(
                    (k) =>
                        k !== 'brand' &&
                        k !== 'brand_name' &&
                        amenities[k] === true,
                ),
            );
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

    const filtered = useMemo(
        () => photos.filter((p) => (p.category || 'other') === section),
        [photos, section],
    );

    const persist = async (next: Photo[]) => {
        setSaving(true);
        try {
            await hotelAdminFetch(`hotels/${hotelId}`, {
                method: 'PUT',
                body: JSON.stringify({
                    media: {
                        ...mediaRest,
                        photos: next.map((p, i) => ({
                            url: p.url,
                            caption: p.caption,
                            category: p.category || 'other',
                            sort: i,
                            strapi_id: p.strapi_id ?? null,
                            room_type_id: p.room_type_id ?? null,
                            amenity_key: p.amenity_key ?? null,
                        })),
                    },
                }),
            });

            // Sync room-linked gallery photos into each room type's own media.
            const byRoom = new Map<string, Photo[]>();
            for (const p of next) {
                if (p.category === 'rooms' && p.room_type_id) {
                    const list = byRoom.get(p.room_type_id) || [];
                    list.push(p);
                    byRoom.set(p.room_type_id, list);
                }
            }
            if (byRoom.size) {
                const roomsFull = await hotelAdminFetch<
                    Array<{ id: string; media?: { photos?: Photo[] } | null }>
                >(`hotels/${hotelId}/room-types`);
                await Promise.all(
                    Array.from(byRoom.entries()).map(async ([roomId, linked]) => {
                        const existing =
                            roomsFull.find((r) => r.id === roomId)?.media?.photos || [];
                        const linkedUrls = new Set(linked.map((x) => x.url));
                        const kept = existing.filter((x) => !linkedUrls.has(x.url));
                        const merged = [
                            ...kept,
                            ...linked.map((x, i) => ({
                                url: x.url,
                                caption: x.caption,
                                sort: kept.length + i,
                                strapi_id: x.strapi_id ?? null,
                            })),
                        ];
                        await hotelAdminFetch(`room-types/${roomId}`, {
                            method: 'PUT',
                            body: JSON.stringify({ media: { photos: merged } }),
                        });
                    }),
                );
            }

            setPhotos(next);
            toast.success(
                byRoom.size
                    ? 'Gallery saved  linked room photos synced to Rooms & rates'
                    : 'Gallery saved on hotel record',
            );
        } catch (e) {
            toast.error((e as Error).message);
        } finally {
            setSaving(false);
        }
    };

    const catLabel =
        CATEGORIES.find((c) => c.id === section)?.label || 'Photos';

    const roomName = (id?: string | null) =>
        roomTypes.find((r) => r.id === id)?.name || null;
    const amenityLabel = (key?: string | null) =>
        (key && HOTEL_AMENITY_LABELS[key]) || key || null;

    return (
        <HotelSectionShell
            title="Photos"
            description="Upload via Strapi  then link room photos to a room type and facility photos to an amenity so guest detail can group them correctly."
            items={nav}
        >
            <div className="space-y-4">
                <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm space-y-3">
                    <div className="flex items-center gap-2 text-brand-dark font-bold">
                        <ImagePlus className="w-5 h-5 text-brand-primary" />
                        Upload to {catLabel}
                    </div>
                    {section === 'rooms' && (
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-600">
                                Link new uploads to room type
                            </label>
                            <select
                                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                                value={linkRoomTypeId}
                                onChange={(e) => setLinkRoomTypeId(e.target.value)}
                            >
                                <option value="">General rooms gallery</option>
                                {roomTypes.map((r) => (
                                    <option key={r.id} value={r.id}>
                                        {r.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                    {section === 'facilities' && (
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-600">
                                Link new uploads to facility
                            </label>
                            <select
                                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                                value={linkAmenityKey}
                                onChange={(e) => setLinkAmenityKey(e.target.value)}
                            >
                                <option value="">General facilities gallery</option>
                                {amenityKeys.map((k) => (
                                    <option key={k} value={k}>
                                        {HOTEL_AMENITY_LABELS[k] || k}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                    <HotelImageUploader
                        hotelId={hotelId}
                        category={section}
                        label={`Upload ${catLabel.toLowerCase()} photos`}
                        disabled={saving || loading}
                        onUploaded={async (uploaded) => {
                            const next = [
                                ...photos,
                                ...uploaded.map((p, i) => ({
                                    ...p,
                                    sort: photos.length + i,
                                    category: section,
                                    room_type_id:
                                        section === 'rooms' ? linkRoomTypeId || null : null,
                                    amenity_key:
                                        section === 'facilities'
                                            ? linkAmenityKey || null
                                            : null,
                                })),
                            ];
                            await persist(next);
                        }}
                    />
                </div>

                {loading ? (
                    <AdminLoader label="Loading gallery…" />
                ) : (
                    <ul className="grid gap-3 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
                        {filtered.map((p, idx) => {
                            const globalIndex = photos.findIndex(
                                (x) => x.url === p.url && x.caption === p.caption,
                            );
                            return (
                                <li
                                    key={`${p.url}-${idx}`}
                                    className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm"
                                >
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={p.url}
                                        alt={p.caption || catLabel}
                                        className="h-44 w-full object-cover bg-slate-100"
                                    />
                                    <div className="p-3 space-y-2">
                                        <div className="flex items-center justify-between gap-2">
                                            <p className="text-xs text-slate-600 truncate">
                                                {p.caption || 'No caption'}
                                            </p>
                                            <button
                                                type="button"
                                                className="text-red-500 hover:text-red-600 shrink-0"
                                                aria-label="Remove"
                                                onClick={() =>
                                                    void persist(
                                                        photos.filter((_, i) => i !== globalIndex),
                                                    )
                                                }
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                        {section === 'rooms' && (
                                            <select
                                                className="w-full h-9 rounded-md border border-input bg-background px-2 text-xs"
                                                value={p.room_type_id || ''}
                                                disabled={saving}
                                                onChange={(e) => {
                                                    const next = photos.map((x, i) =>
                                                        i === globalIndex
                                                            ? {
                                                                  ...x,
                                                                  room_type_id:
                                                                      e.target.value || null,
                                                              }
                                                            : x,
                                                    );
                                                    void persist(next);
                                                }}
                                            >
                                                <option value="">Not linked to room type</option>
                                                {roomTypes.map((r) => (
                                                    <option key={r.id} value={r.id}>
                                                        {r.name}
                                                    </option>
                                                ))}
                                            </select>
                                        )}
                                        {section === 'facilities' && (
                                            <select
                                                className="w-full h-9 rounded-md border border-input bg-background px-2 text-xs"
                                                value={p.amenity_key || ''}
                                                disabled={saving}
                                                onChange={(e) => {
                                                    const next = photos.map((x, i) =>
                                                        i === globalIndex
                                                            ? {
                                                                  ...x,
                                                                  amenity_key:
                                                                      e.target.value || null,
                                                              }
                                                            : x,
                                                    );
                                                    void persist(next);
                                                }}
                                            >
                                                <option value="">Not linked to facility</option>
                                                {amenityKeys.map((k) => (
                                                    <option key={k} value={k}>
                                                        {HOTEL_AMENITY_LABELS[k] || k}
                                                    </option>
                                                ))}
                                            </select>
                                        )}
                                        {(roomName(p.room_type_id) ||
                                            amenityLabel(p.amenity_key)) && (
                                            <p className="text-[11px] font-semibold text-brand-primary">
                                                Linked:{' '}
                                                {roomName(p.room_type_id) ||
                                                    amenityLabel(p.amenity_key)}
                                            </p>
                                        )}
                                    </div>
                                </li>
                            );
                        })}
                        {filtered.length === 0 && (
                            <li className="sm:col-span-2 xl:col-span-3 rounded-xl border border-dashed border-slate-300 bg-white px-5 py-12 text-center text-sm text-slate-500">
                                No {catLabel.toLowerCase()} photos yet.
                            </li>
                        )}
                    </ul>
                )}
            </div>
        </HotelSectionShell>
    );
}

export default function HotelPhotosPage() {
    return (
        <Suspense fallback={<AdminLoader label="Loading photos…" />}>
            <PhotosInner />
        </Suspense>
    );
}
