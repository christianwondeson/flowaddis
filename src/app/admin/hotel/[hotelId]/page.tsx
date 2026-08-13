'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { hotelAdminFetch } from '@/lib/hotel-admin-api';
import { useHotelPortal } from '@/components/hotel-portal/hotel-portal-context';
import { getHotelBrandLabel } from '@/lib/hotel-brand';
import { AdminLoader } from '@/components/ui/admin-loader';
import { formatAdminDate, formatAdminDateTime } from '@/lib/admin-date-format';
import {
    BedDouble,
    BookOpen,
    CalendarDays,
    CreditCard,
    TrendingUp,
} from 'lucide-react';

/** Empty duplicate created before Momona inventory lived on the Wire Test hotel. */
const ARCHIVED_MOMONA_ID = 'c4dc1b1e-f78a-45c4-9592-d733ef13fbe2';
const LIVE_MOMONA_ID = '63acf293-7df4-4567-8c82-0660d7bf6a0b';

type Dashboard = {
    room_types_count: number;
    total_inventory: number;
    bookings_total: number;
    bookings_active: number;
    bookings_upcoming: number;
    revenue_confirmed: number;
    currency: string;
    recent_bookings: Array<{
        id: string;
        status: string;
        amount: number;
        currency: string;
        guest_name?: string | null;
        check_in?: string | null;
        check_out?: string | null;
        created_at: string;
    }>;
    timeline?: TimelineItem[];
};

type TimelineItem = {
    id: string;
    at: string;
    title: string;
    detail: string;
    status: string;
};

export default function HotelDashboardPage() {
    const params = useParams();
    const router = useRouter();
    const hotelId = String(params.hotelId || '');
    const { hotels } = useHotelPortal();
    const hotel = hotels.find((h) => h.id === hotelId);
    const brand = getHotelBrandLabel(hotel);
    const [data, setData] = useState<Dashboard | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!hotelId) return;
        if (hotelId === ARCHIVED_MOMONA_ID) {
            router.replace(`/admin/hotel/${LIVE_MOMONA_ID}`);
            return;
        }

        let cancelled = false;
        (async () => {
            setLoading(true);
            setError(null);
            try {
                // One request  timeline is embedded (was a second full Nest round-trip).
                const dash = await hotelAdminFetch<Dashboard>(
                    `hotels/${hotelId}/dashboard`,
                );
                if (cancelled) return;
                setData(dash);
            } catch (e) {
                if (!cancelled) setError((e as Error).message);
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [hotelId, router]);

    if (loading) {
        return <AdminLoader label="Loading dashboard…" />;
    }
    if (error) {
        return (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                {error}
            </div>
        );
    }
    if (!data) return null;

    const timeline = data.timeline || [];

    const cards = [
        {
            label: 'Active reservations',
            value: String(data.bookings_active),
            hint: `${data.bookings_upcoming} upcoming`,
            icon: BookOpen,
            href: `/admin/hotel/${hotelId}/reservations`,
        },
        {
            label: 'Room types',
            value: String(data.room_types_count),
            hint: `${data.total_inventory} sellable units`,
            icon: BedDouble,
            href: `/admin/hotel/${hotelId}/rooms`,
        },
        {
            label: 'Confirmed revenue',
            value: `${data.currency} ${Number(data.revenue_confirmed).toLocaleString()}`,
            hint: 'Paid + confirmed',
            icon: TrendingUp,
            href: `/admin/hotel/${hotelId}/transactions`,
        },
        {
            label: 'Rates & availability',
            value: 'Open calendar',
            hint: 'Price by date',
            icon: CalendarDays,
            href: `/admin/hotel/${hotelId}/calendar`,
        },
    ];

    return (
        <div className="space-y-6 max-w-6xl">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        {[brand || 'BookAddis Partner', hotel?.city].filter(Boolean).join(' · ')}
                    </p>
                    <h1 className="text-2xl font-extrabold text-brand-dark tracking-tight mt-1">
                        {hotel?.name || 'Property dashboard'}
                    </h1>
                    <p className="text-sm text-slate-600 mt-1">
                        Reservations, inventory, and performance at a glance.
                    </p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Link
                        href={`/admin/hotel/${hotelId}/rooms`}
                        className="rounded-lg bg-brand-primary px-3 py-2 text-sm font-semibold text-white hover:opacity-95"
                    >
                        Add room
                    </Link>
                    <Link
                        href={`/admin/hotel/${hotelId}/calendar`}
                        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-brand-dark hover:border-brand-primary/40"
                    >
                        Edit rates
                    </Link>
                </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {cards.map((c) => (
                    <Link
                        key={c.label}
                        href={c.href}
                        className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:border-brand-primary/35 transition-colors"
                    >
                        <div className="flex items-start justify-between">
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                {c.label}
                            </p>
                            <c.icon className="w-4 h-4 text-brand-primary" />
                        </div>
                        <p className="mt-3 text-xl font-extrabold text-brand-dark">{c.value}</p>
                        <p className="text-xs text-slate-500 mt-1">{c.hint}</p>
                    </Link>
                ))}
            </div>

            <div className="grid gap-4 lg:grid-cols-5">
                <section className="lg:col-span-3 rounded-xl border border-slate-200 bg-white shadow-sm">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                        <h2 className="font-bold text-brand-dark">Recent reservations</h2>
                        <Link
                            href={`/admin/hotel/${hotelId}/reservations`}
                            className="text-xs font-semibold text-brand-primary hover:underline"
                        >
                            View all
                        </Link>
                    </div>
                    <div className="divide-y divide-slate-100">
                        {data.recent_bookings.length === 0 && (
                            <p className="px-4 py-8 text-sm text-slate-500 text-center">
                                No reservations yet for this property.
                            </p>
                        )}
                        {data.recent_bookings.map((b) => (
                            <div
                                key={b.id}
                                className="px-4 py-3 flex items-center justify-between gap-3"
                            >
                                <div>
                                    <p className="text-sm font-semibold text-brand-dark">
                                        {b.guest_name || 'Guest'}
                                    </p>
                                    <p className="text-xs text-slate-500">
                                        {[b.check_in, b.check_out].filter(Boolean).join(' → ') ||
                                            new Date(b.created_at).toLocaleString()}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-bold text-brand-dark">
                                        {b.currency} {Number(b.amount).toLocaleString()}
                                    </p>
                                    <p className="text-[11px] font-semibold text-slate-500">
                                        {b.status}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="lg:col-span-2 rounded-xl border border-slate-200 bg-white shadow-sm">
                    <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-brand-primary" />
                        <h2 className="font-bold text-brand-dark">Activity timeline</h2>
                    </div>
                    <ul className="divide-y divide-slate-100 max-h-[420px] overflow-y-auto scrollbar-hide">
                        {timeline.length === 0 && (
                            <li className="px-4 py-8 text-sm text-slate-500 text-center">
                                No activity yet.
                            </li>
                        )}
                        {timeline.map((ev) => (
                            <li key={ev.id} className="px-4 py-3">
                                <p className="text-sm font-semibold text-brand-dark">{ev.title}</p>
                                <p className="text-xs text-slate-500 mt-0.5">{ev.detail}</p>
                                <p className="text-[11px] text-slate-400 mt-1">
                                    {formatAdminDateTime(ev.at)}
                                </p>
                            </li>
                        ))}
                    </ul>
                </section>
            </div>
        </div>
    );
}
