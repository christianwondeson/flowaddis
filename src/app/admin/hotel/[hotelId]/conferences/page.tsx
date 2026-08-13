'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { hotelAdminFetch } from '@/lib/hotel-admin-api';
import {
    HotelImageUploader,
    type HotelMediaPhoto,
} from '@/components/hotel-portal/hotel-image-uploader';
import { AdminLoader } from '@/components/ui/admin-loader';

export type HotelConferenceHall = {
    id: string;
    name: string;
    capacity: string;
    price: string;
    currency: 'ETB' | 'USD';
    image_url?: string | null;
    features: string;
    description?: string;
    status: 'active' | 'inactive';
};

const emptyForm = (): Omit<HotelConferenceHall, 'id'> => ({
    name: '',
    capacity: '50',
    price: '',
    currency: 'ETB',
    image_url: null,
    features: 'WiFi, Projector, Sound system',
    description: '',
    status: 'active',
});

/**
 * Hotel-owned conference halls  stored on hotel.media.conference_halls.
 * Guests book via /conferences with real PaymentForm checkout.
 */
export default function HotelConferencesPage() {
    const params = useParams();
    const hotelId = String(params.hotelId || '');
    const [halls, setHalls] = useState<HotelConferenceHall[]>([]);
    const [mediaRest, setMediaRest] = useState<Record<string, unknown>>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState(emptyForm);

    const load = async () => {
        setLoading(true);
        try {
            const hotel = await hotelAdminFetch<{
                media?: Record<string, unknown> | null;
            }>(`hotels/${hotelId}`);
            const media = (hotel.media || {}) as Record<string, unknown>;
            const {
                conference_halls: raw,
                conferenceHalls: raw2,
                ...rest
            } = media as Record<string, unknown> & {
                conference_halls?: HotelConferenceHall[];
                conferenceHalls?: HotelConferenceHall[];
            };
            setMediaRest(rest);
            const list = Array.isArray(raw)
                ? raw
                : Array.isArray(raw2)
                  ? raw2
                  : [];
            setHalls(list);
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

    const persist = async (next: HotelConferenceHall[]) => {
        setSaving(true);
        try {
            await hotelAdminFetch(`hotels/${hotelId}`, {
                method: 'PUT',
                body: JSON.stringify({
                    media: { ...mediaRest, conference_halls: next },
                }),
            });
            setHalls(next);
            toast.success('Conference halls saved');
        } catch (e) {
            toast.error((e as Error).message);
        } finally {
            setSaving(false);
        }
    };

    const addHall = (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name.trim()) {
            toast.error('Hall name is required');
            return;
        }
        if (!form.price.trim() || Number(form.price) < 0) {
            toast.error('Enter a valid price');
            return;
        }
        const next: HotelConferenceHall[] = [
            ...halls,
            {
                id: crypto.randomUUID(),
                ...form,
                name: form.name.trim(),
                capacity: String(Math.max(1, Number(form.capacity) || 1)),
                price: form.price.trim(),
                features: form.features.trim(),
                description: form.description?.trim() || '',
            },
        ];
        void persist(next).then(() => setForm(emptyForm()));
    };

    const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
        setForm((f) => ({ ...f, [key]: value }));

    if (loading) return <AdminLoader label="Loading conference halls…" />;

    return (
        <div className="space-y-6 max-w-4xl">
            <div>
                <h1 className="text-2xl font-extrabold text-brand-dark">
                    Conference halls
                </h1>
                <p className="text-sm text-slate-600 mt-1">
                    Publish bookable meeting rooms with capacity, daily hire price,
                    photo, and amenities. Guests book on BookAddis Conferences with
                    the same payment checkout as hotels.
                </p>
            </div>

            <form
                onSubmit={addHall}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm grid gap-4 sm:grid-cols-2"
            >
                <div className="space-y-2 sm:col-span-2">
                    <Label>Hall name</Label>
                    <Input
                        value={form.name}
                        onChange={(e) => set('name', e.target.value)}
                        placeholder="Grand Ballroom"
                        required
                    />
                </div>
                <div className="space-y-2">
                    <Label>Capacity (guests)</Label>
                    <Input
                        type="number"
                        min={1}
                        value={form.capacity}
                        onChange={(e) => set('capacity', e.target.value)}
                    />
                </div>
                <div className="space-y-2">
                    <Label>Price (per day / session)</Label>
                    <div className="flex gap-2">
                        <Input
                            type="number"
                            min={0}
                            value={form.price}
                            onChange={(e) => set('price', e.target.value)}
                            placeholder="15000"
                            required
                        />
                        <select
                            className="h-10 rounded-md border border-input bg-background px-2 text-sm"
                            value={form.currency}
                            onChange={(e) =>
                                set('currency', e.target.value as 'ETB' | 'USD')
                            }
                        >
                            <option value="ETB">ETB</option>
                            <option value="USD">USD</option>
                        </select>
                    </div>
                </div>
                <div className="space-y-2 sm:col-span-2">
                    <Label>Features (comma-separated)</Label>
                    <Input
                        value={form.features}
                        onChange={(e) => set('features', e.target.value)}
                        placeholder="WiFi, Projector, Catering"
                    />
                </div>
                <div className="space-y-2 sm:col-span-2">
                    <Label>Description</Label>
                    <Input
                        value={form.description || ''}
                        onChange={(e) => set('description', e.target.value)}
                        placeholder="Ideal for board meetings and workshops"
                    />
                </div>
                <div className="space-y-2 sm:col-span-2">
                    <Label>Hall photo</Label>
                    <HotelImageUploader
                        hotelId={hotelId}
                        category="conference"
                        label="Upload hall photo"
                        disabled={saving}
                        onUploaded={async (photos: HotelMediaPhoto[]) => {
                            if (photos[0]?.url) set('image_url', photos[0].url);
                        }}
                    />
                    {form.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={form.image_url}
                            alt=""
                            className="mt-2 h-28 w-44 rounded-lg object-cover border border-slate-200"
                        />
                    ) : null}
                </div>
                <div className="sm:col-span-2">
                    <Button type="submit" disabled={saving}>
                        {saving ? 'Saving…' : 'Add conference hall'}
                    </Button>
                </div>
            </form>

            <div className="space-y-3">
                {halls.length === 0 ? (
                    <p className="text-sm text-slate-500">
                        No conference halls yet. Add a hall with price and photo to
                        appear on the guest Conferences page.
                    </p>
                ) : (
                    halls.map((h) => (
                        <div
                            key={h.id}
                            className="rounded-xl border border-slate-200 bg-white p-4 flex flex-col sm:flex-row gap-4"
                        >
                            {h.image_url ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    src={h.image_url}
                                    alt={h.name}
                                    className="w-full sm:w-36 h-28 object-cover rounded-lg"
                                />
                            ) : (
                                <div className="w-full sm:w-36 h-28 rounded-lg bg-slate-100" />
                            )}
                            <div className="flex-1 min-w-0">
                                <p className="font-bold text-brand-dark">{h.name}</p>
                                <p className="text-sm text-slate-600 mt-0.5">
                                    {h.capacity} guests · {h.currency}{' '}
                                    {Number(h.price).toLocaleString()} · {h.status}
                                </p>
                                {h.features ? (
                                    <p className="text-xs text-slate-500 mt-1">
                                        {h.features}
                                    </p>
                                ) : null}
                            </div>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={saving}
                                onClick={() =>
                                    void persist(halls.filter((x) => x.id !== h.id))
                                }
                            >
                                Remove
                            </Button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
