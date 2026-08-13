'use client';

import { useParams } from 'next/navigation';
import { Bus, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { hotelAdminFetch } from '@/lib/hotel-admin-api';
import {
    HotelImageUploader,
    type HotelMediaPhoto,
} from '@/components/hotel-portal/hotel-image-uploader';
import { AdminLoader } from '@/components/ui/admin-loader';

export type HotelShuttle = {
    id: string;
    name: string;
    from: string;
    to: string;
    price: string;
    currency: 'ETB' | 'USD';
    vehicle_type: string;
    plate_number: string;
    capacity: string;
    driver_name: string;
    driver_phone: string;
    image_url?: string | null;
    insurance_ref?: string;
    permit_ref?: string;
    gps_tracked: boolean;
    meet_and_greet: boolean;
    child_seat: boolean;
    notes?: string;
    status: 'active' | 'inactive' | 'maintenance';
};

const emptyForm = (): Omit<HotelShuttle, 'id'> => ({
    name: '',
    from: '',
    to: '',
    price: '',
    currency: 'ETB',
    vehicle_type: 'Van',
    plate_number: '',
    capacity: '4',
    driver_name: '',
    driver_phone: '',
    image_url: null,
    insurance_ref: '',
    permit_ref: '',
    gps_tracked: true,
    meet_and_greet: true,
    child_seat: false,
    notes: '',
    status: 'active',
});

/**
 * Hotel-owned shuttle fleet  persisted on hotel.media.shuttles (Nest),
 * with plate / insurance / photo for guest trust & ops security.
 */
export default function HotelShuttlesPage() {
    const params = useParams();
    const hotelId = String(params.hotelId || '');

    const [routes, setRoutes] = useState<HotelShuttle[]>([]);
    const [mediaRest, setMediaRest] = useState<Record<string, unknown>>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState(emptyForm);

    const load = async () => {
        setLoading(true);
        try {
            const hotel = await hotelAdminFetch<{
                media?: (Record<string, unknown> & { shuttles?: HotelShuttle[] }) | null;
            }>(`hotels/${hotelId}`);
            const media = (hotel.media || {}) as Record<string, unknown> & {
                shuttles?: HotelShuttle[];
            };
            const { shuttles, ...rest } = media;
            setMediaRest(rest);
            setRoutes(Array.isArray(shuttles) ? shuttles : []);
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

    const persist = async (next: HotelShuttle[]) => {
        setSaving(true);
        try {
            await hotelAdminFetch(`hotels/${hotelId}`, {
                method: 'PUT',
                body: JSON.stringify({
                    media: {
                        ...mediaRest,
                        shuttles: next,
                    },
                }),
            });
            setRoutes(next);
            toast.success('Shuttle fleet saved to hotel record');
        } catch (e) {
            toast.error((e as Error).message);
        } finally {
            setSaving(false);
        }
    };

    const addRoute = (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name.trim() || !form.from.trim() || !form.to.trim()) {
            toast.error('Name, from, and to are required');
            return;
        }
        if (form.plate_number.replace(/\s/g, '').length < 3) {
            toast.error('Plate number is required for vehicle identification');
            return;
        }
        const next: HotelShuttle[] = [
            ...routes,
            {
                id: crypto.randomUUID(),
                ...form,
                name: form.name.trim(),
                from: form.from.trim(),
                to: form.to.trim(),
                plate_number: form.plate_number.trim().toUpperCase(),
                price: form.price.trim() || '0',
            },
        ];
        void persist(next).then(() => setForm(emptyForm()));
    };

    const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
        setForm((f) => ({ ...f, [key]: value }));

    if (loading) return <AdminLoader label="Loading shuttles…" />;

    return (
        <div className="space-y-6 max-w-4xl">
            <div>
                <h1 className="text-2xl font-extrabold text-brand-dark">Shuttles</h1>
                <p className="text-sm text-slate-600 mt-1">
                    Airport and city transfers with vehicle ID, driver contact, and safety
                    protocols  stored on this property (same Nest hotel record as photos).
                </p>
            </div>

            <form
                onSubmit={addRoute}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm grid gap-4 sm:grid-cols-2"
            >
                <div className="space-y-2 sm:col-span-2">
                    <Label>Route name</Label>
                    <Input
                        value={form.name}
                        onChange={(e) => set('name', e.target.value)}
                        placeholder="ADD Airport → Hotel"
                        required
                    />
                </div>
                <div className="space-y-2">
                    <Label>From</Label>
                    <Input
                        value={form.from}
                        onChange={(e) => set('from', e.target.value)}
                        placeholder="ADD Airport"
                        required
                    />
                </div>
                <div className="space-y-2">
                    <Label>To</Label>
                    <Input
                        value={form.to}
                        onChange={(e) => set('to', e.target.value)}
                        placeholder="Hotel lobby"
                        required
                    />
                </div>
                <div className="space-y-2">
                    <Label>Vehicle type</Label>
                    <select
                        className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                        value={form.vehicle_type}
                        onChange={(e) => set('vehicle_type', e.target.value)}
                    >
                        <option>Sedan</option>
                        <option>Van</option>
                        <option>Minibus</option>
                        <option>SUV</option>
                        <option>Bus</option>
                    </select>
                </div>
                <div className="space-y-2">
                    <Label>Plate number</Label>
                    <Input
                        value={form.plate_number}
                        onChange={(e) => set('plate_number', e.target.value)}
                        placeholder="AA-3-12345"
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
                    <Label>Price</Label>
                    <div className="flex gap-2">
                        <Input
                            type="number"
                            min={0}
                            value={form.price}
                            onChange={(e) => set('price', e.target.value)}
                            placeholder="800"
                        />
                        <select
                            className="h-10 rounded-md border border-input bg-background px-2 text-sm"
                            value={form.currency}
                            onChange={(e) =>
                                set('currency', e.target.value === 'USD' ? 'USD' : 'ETB')
                            }
                        >
                            <option value="ETB">ETB</option>
                            <option value="USD">USD</option>
                        </select>
                    </div>
                </div>
                <div className="space-y-2">
                    <Label>Driver name</Label>
                    <Input
                        value={form.driver_name}
                        onChange={(e) => set('driver_name', e.target.value)}
                        placeholder="Optional"
                    />
                </div>
                <div className="space-y-2">
                    <Label>Driver phone</Label>
                    <Input
                        value={form.driver_phone}
                        onChange={(e) => set('driver_phone', e.target.value)}
                        placeholder="09…"
                    />
                </div>
                <div className="space-y-2">
                    <Label>Insurance ref</Label>
                    <Input
                        value={form.insurance_ref}
                        onChange={(e) => set('insurance_ref', e.target.value)}
                        placeholder="Policy / certificate #"
                    />
                </div>
                <div className="space-y-2">
                    <Label>Transport permit</Label>
                    <Input
                        value={form.permit_ref}
                        onChange={(e) => set('permit_ref', e.target.value)}
                        placeholder="City / airport permit #"
                    />
                </div>
                <div className="sm:col-span-2 flex flex-wrap gap-4 text-sm">
                    <label className="inline-flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={form.gps_tracked}
                            onChange={(e) => set('gps_tracked', e.target.checked)}
                        />
                        GPS tracked
                    </label>
                    <label className="inline-flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={form.meet_and_greet}
                            onChange={(e) => set('meet_and_greet', e.target.checked)}
                        />
                        Meet & greet
                    </label>
                    <label className="inline-flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={form.child_seat}
                            onChange={(e) => set('child_seat', e.target.checked)}
                        />
                        Child seat available
                    </label>
                </div>
                <div className="space-y-2 sm:col-span-2">
                    <Label>Vehicle photo</Label>
                    <HotelImageUploader
                        hotelId={hotelId}
                        category="shuttle"
                        label="Upload vehicle photo"
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
                <div className="space-y-2 sm:col-span-2">
                    <Label>Ops notes</Label>
                    <Input
                        value={form.notes}
                        onChange={(e) => set('notes', e.target.value)}
                        placeholder="Pickup sign text, luggage limit, night surcharge…"
                    />
                </div>
                <div className="sm:col-span-2">
                    <Button type="submit" disabled={saving}>
                        {saving ? 'Saving…' : 'Add shuttle'}
                    </Button>
                </div>
            </form>

            <ul className="space-y-3">
                {routes.map((r) => (
                    <li
                        key={r.id}
                        className="rounded-xl border border-slate-200 bg-white p-4 flex flex-col sm:flex-row gap-4 shadow-sm"
                    >
                        {r.image_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                src={r.image_url}
                                alt={r.name}
                                className="h-28 w-40 rounded-lg object-cover bg-slate-100 shrink-0"
                            />
                        ) : (
                            <div className="h-28 w-40 rounded-lg bg-brand-primary/10 flex items-center justify-center shrink-0">
                                <Bus className="w-8 h-8 text-brand-primary" />
                            </div>
                        )}
                        <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-2">
                                <div>
                                    <p className="font-semibold text-brand-dark">{r.name}</p>
                                    <p className="text-xs text-slate-500">
                                        {r.from} → {r.to}
                                    </p>
                                </div>
                                <span className="text-sm font-bold text-brand-dark shrink-0">
                                    {r.currency || 'ETB'} {Number(r.price).toLocaleString()}
                                </span>
                            </div>
                            <p className="text-xs text-slate-600 mt-2 font-mono">
                                {r.vehicle_type} · Plate {r.plate_number} · Cap {r.capacity}
                            </p>
                            {(r.driver_name || r.driver_phone) && (
                                <p className="text-xs text-slate-500 mt-1">
                                    Driver: {[r.driver_name, r.driver_phone].filter(Boolean).join(' · ')}
                                </p>
                            )}
                            <div className="flex flex-wrap gap-2 mt-2 text-[11px] font-semibold text-slate-600">
                                {r.gps_tracked ? (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-800 px-2 py-0.5">
                                        <ShieldCheck className="w-3 h-3" /> GPS
                                    </span>
                                ) : null}
                                {r.meet_and_greet ? (
                                    <span className="rounded-full bg-slate-100 px-2 py-0.5">
                                        Meet & greet
                                    </span>
                                ) : null}
                                {r.child_seat ? (
                                    <span className="rounded-full bg-slate-100 px-2 py-0.5">
                                        Child seat
                                    </span>
                                ) : null}
                                {r.insurance_ref ? (
                                    <span className="rounded-full bg-slate-100 px-2 py-0.5">
                                        Ins {r.insurance_ref}
                                    </span>
                                ) : null}
                                {r.permit_ref ? (
                                    <span className="rounded-full bg-slate-100 px-2 py-0.5">
                                        Permit {r.permit_ref}
                                    </span>
                                ) : null}
                            </div>
                        </div>
                        <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="text-red-600 shrink-0"
                            disabled={saving}
                            onClick={() => {
                                void persist(routes.filter((x) => x.id !== r.id));
                            }}
                        >
                            Remove
                        </Button>
                    </li>
                ))}
                {routes.length === 0 && (
                    <li className="rounded-xl border border-dashed border-slate-300 bg-white px-5 py-10 text-center text-sm text-slate-500">
                        No shuttles yet. Add a vehicle with plate number and safety details.
                    </li>
                )}
            </ul>
        </div>
    );
}
