'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { adminInventoryFetch } from '@/lib/admin-inventory-api';
import { HotelSubscriptionAdminCard } from '@/components/admin/hotel-subscription-admin-card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { BedDouble, CalendarDays, Globe2 } from 'lucide-react';

type Hotel = {
    id: string;
    name: string;
    city?: string | null;
    status?: string;
    inventory_source?: string;
    amenities?: Record<string, unknown> | null;
    room_types?: Array<{ id: string; name: string; total_inventory: number }>;
};

export default function InventoryHotelOverviewPage() {
    const params = useParams();
    const hotelId = String(params.hotelId || '');
    const [hotel, setHotel] = useState<Hotel | null>(null);
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);

    const load = async () => {
        setLoading(true);
        try {
            const h = await adminInventoryFetch<Hotel>(`hotels/${hotelId}`);
            setHotel(h);
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

    const setStatus = async (status: 'published' | 'draft') => {
        setBusy(true);
        try {
            await adminInventoryFetch(`hotels/${hotelId}`, {
                method: 'PUT',
                body: JSON.stringify({ status }),
            });
            toast.success(
                status === 'published'
                    ? 'Published on BookAddis'
                    : 'Unpublished (hidden from guests)',
            );
            await load();
        } catch (e) {
            toast.error((e as Error).message);
        } finally {
            setBusy(false);
        }
    };

    if (loading) {
        return <p className="text-sm text-slate-500">Loading hotel…</p>;
    }
    if (!hotel) return null;

    const published = hotel.status === 'published';
    const brand = String(hotel.amenities?.brand || hotel.amenities?.brand_name || '');
    const rooms = hotel.room_types || [];

    return (
        <div className="space-y-6">
            <div
                className={
                    published
                        ? 'rounded-xl border border-green-200 bg-green-50/80 px-4 py-3 text-sm text-green-950'
                        : 'rounded-xl border border-amber-200 bg-amber-50/80 px-4 py-3 text-sm text-amber-950'
                }
            >
                {published ? (
                    <>
                        <strong>Live on BookAddis.</strong> Rooms, beds, and calendar prices
                        you set here are what guests book.
                    </>
                ) : (
                    <>
                        <strong>Draft.</strong> Configure rooms and rates, then publish so
                        guests can find this hotel.
                    </>
                )}
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <p className="text-xs font-semibold uppercase text-slate-500">Status</p>
                    <p className="mt-1 font-bold text-brand-dark">
                        {hotel.status || 'Not set'}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                        {[brand, hotel.city, hotel.inventory_source]
                            .filter(Boolean)
                            .join(' · ')}
                    </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <p className="text-xs font-semibold uppercase text-slate-500">
                        Room types
                    </p>
                    <p className="mt-1 text-2xl font-extrabold text-brand-dark">
                        {rooms.length}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                        {rooms.reduce((s, r) => s + (r.total_inventory || 0), 0)} sellable
                        units
                    </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm flex flex-col gap-2">
                    {published ? (
                        <Button
                            variant="outline"
                            disabled={busy}
                            onClick={() => void setStatus('draft')}
                        >
                            Unpublish
                        </Button>
                    ) : (
                        <Button disabled={busy} onClick={() => void setStatus('published')}>
                            <Globe2 className="w-4 h-4 mr-1.5" />
                            Publish to BookAddis
                        </Button>
                    )}
                </div>
            </div>

            <HotelSubscriptionAdminCard hotelId={hotelId} />

            <div className="flex flex-wrap gap-2">
                <Button asChild>
                    <Link href={`/admin/inventory/${hotelId}/rooms`}>
                        <BedDouble className="w-4 h-4 mr-1.5" />
                        Manage rooms
                    </Link>
                </Button>
                <Button asChild variant="outline">
                    <Link href={`/admin/inventory/${hotelId}/calendar`}>
                        <CalendarDays className="w-4 h-4 mr-1.5" />
                        Rates & calendar
                    </Link>
                </Button>
            </div>

            {rooms.length > 0 && (
                <ul className="rounded-xl border border-slate-200 bg-white divide-y divide-slate-100">
                    {rooms.map((r) => (
                        <li
                            key={r.id}
                            className="px-4 py-3 flex justify-between text-sm"
                        >
                            <span className="font-semibold text-brand-dark">{r.name}</span>
                            <span className="text-slate-500">
                                {r.total_inventory} units
                            </span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
