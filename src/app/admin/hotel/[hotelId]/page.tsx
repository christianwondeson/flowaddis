'use client';

import React, { useEffect, useMemo, useState } from 'react';
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
    DollarSign,
    Percent,
    Users,
    Clock,
    CheckCircle,
    XCircle,
    AlertCircle,
    ArrowUpRight,
    LogIn,
    LogOut,
    Home,
    Sparkles,
} from 'lucide-react';
import {
    AnalyticsFilterBar,
    type TimeRangeValue,
} from '@/components/admin/analytics/analytics-filter-bar';
import { KpiMetricCard } from '@/components/admin/analytics/kpi-metric-card';
import { TrendBarChart } from '@/components/admin/analytics/trend-bar-chart';
import {
    CategoryProgressList,
    type CategoryItem,
} from '@/components/admin/analytics/category-progress-list';
import {
    HotelReservationDetailSheet,
    type HotelReservationDetail,
} from '@/components/admin/hotel-reservation-detail-sheet';
import { formatFriendlyFailureReason } from '@/components/admin/booking-com-reservation-cols';
import { Button } from '@/components/ui/button';

/** Empty duplicate created before Momona inventory lived on the Wire Test hotel. */
const ARCHIVED_MOMONA_ID = 'c4dc1b1e-f78a-45c4-9592-d733ef13fbe2';
const LIVE_MOMONA_ID = '63acf293-7df4-4567-8c82-0660d7bf6a0b';

type DashboardData = {
    hotel_id: string;
    room_types_count: number;
    total_inventory: number;
    bookings_total: number;
    bookings_active: number;
    bookings_upcoming: number;
    revenue_confirmed: number;
    currency: string;
    commission_percent?: number;
    estimated_commission?: number;
    net_payout?: number;
    recent_bookings: Array<HotelReservationDetail>;
    all_bookings?: Array<HotelReservationDetail>;
    monthly_trend?: Array<{
        month: string;
        ym: string;
        bookings: number;
        revenue: number;
    }>;
    room_type_performance?: Array<{
        name: string;
        bookings: number;
        revenue: number;
    }>;
    status_breakdown?: {
        confirmed: number;
        pending: number;
        cancelled: number;
        stayed: number;
    };
    operations_radar?: {
        checkins_today: number;
        checkouts_today: number;
        in_house_today: number;
        upcoming_total: number;
    };
    hospitality_kpis?: {
        adr: number;
        revpar: number;
        occupancy_rate_pct: number;
        total_booked_nights: number;
    };
    timeline?: TimelineItem[];
};

type TimelineItem = {
    id: string;
    at: string;
    title: string;
    detail: string;
    status: string;
};

function formatMoney(amount: number, currency = 'ETB') {
    try {
        return new Intl.NumberFormat('en-ET', {
            style: 'currency',
            currency: currency || 'ETB',
            maximumFractionDigits: amount >= 1000 ? 0 : 2,
        }).format(amount || 0);
    } catch {
        return `${currency} ${Number(amount || 0).toLocaleString()}`;
    }
}

function calculateNights(checkIn?: string | null, checkOut?: string | null): number {
    if (!checkIn || !checkOut) return 1;
    const diff = new Date(checkOut).getTime() - new Date(checkIn).getTime();
    return Math.max(1, Math.round(diff / (1000 * 60 * 60 * 24)));
}

export default function HotelDashboardPage() {
    const params = useParams();
    const router = useRouter();
    const hotelId = String(params.hotelId || '');
    const { hotels } = useHotelPortal();
    const hotel = hotels.find((h) => h.id === hotelId);
    const brand = getHotelBrandLabel(hotel);

    const [data, setData] = useState<DashboardData | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    // Comprehensive filtering states
    const [timeRange, setTimeRange] = useState<TimeRangeValue>('30days');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [paymentFilter, setPaymentFilter] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState<string>('');

    // Detail drawer state
    const [selectedBooking, setSelectedBooking] = useState<HotelReservationDetail | null>(null);

    const handleResetFilters = () => {
        setTimeRange('30days');
        setStatusFilter('all');
        setPaymentFilter('all');
        setSearchQuery('');
    };

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
                const dash = await hotelAdminFetch<DashboardData>(
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

    const bookingsSource = useMemo(() => {
        return data?.all_bookings && data.all_bookings.length > 0
            ? data.all_bookings
            : data?.recent_bookings || [];
    }, [data?.all_bookings, data?.recent_bookings]);

    // Apply client-side filters for instant interactivity
    const filteredBookings = useMemo(() => {
        return bookingsSource.filter((b) => {
            // Time filter
            if (timeRange !== 'all' && b.created_at) {
                const created = new Date(b.created_at).getTime();
                const now = Date.now();
                const days =
                    timeRange === 'today'
                        ? 1
                        : timeRange === '7days'
                          ? 7
                          : timeRange === '30days'
                            ? 30
                            : timeRange === '90days'
                              ? 90
                              : 365;
                if (now - created > days * 24 * 60 * 60 * 1000) {
                    return false;
                }
            }

            // Status filter
            if (statusFilter !== 'all') {
                const s = (b.status || '').toLowerCase();
                if (statusFilter === 'confirmed' && !['confirmed', 'paid', 'stayed'].includes(s))
                    return false;
                if (statusFilter === 'pending' && !['pending', 'initiated'].includes(s))
                    return false;
                if (statusFilter === 'cancelled' && !['cancelled', 'failed', 'no_show'].includes(s))
                    return false;
            }

            // Payment method filter
            if (paymentFilter !== 'all') {
                const model = (b.settlement_model || '').toLowerCase();
                const pref = (b.payment_pref || '').toLowerCase();
                const timing = (b.payment_timing || '').toLowerCase();
                const isPrepaid =
                    model === 'prepaid' || timing === 'prepay' || pref === 'online';
                const isProperty =
                    model === 'pay_at_property' ||
                    timing === 'pay_at_property' ||
                    pref === 'pay_at_property';

                if (paymentFilter === 'prepaid' && !isPrepaid) return false;
                if (paymentFilter === 'cash' && !isProperty) return false;
            }

            // Text search
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase().trim();
                const g = (b.guest_name || '').toLowerCase();
                const id = (b.id || '').toLowerCase();
                const room = (b.room_name || '').toLowerCase();
                const ref = (b.payment_reference || '').toLowerCase();
                if (!g.includes(q) && !id.includes(q) && !room.includes(q) && !ref.includes(q)) {
                    return false;
                }
            }

            return true;
        });
    }, [bookingsSource, timeRange, statusFilter, paymentFilter, searchQuery]);

    // Room type performance breakdown items
    const roomCategoryItems: CategoryItem[] = useMemo(() => {
        const perf = data?.room_type_performance || [];
        if (perf.length === 0) {
            return [
                {
                    label: 'Standard King / Twin',
                    count: 0,
                    percentage: 0,
                    icon: BedDouble,
                    colorClass: 'bg-teal-500',
                },
                {
                    label: 'Deluxe Suite',
                    count: 0,
                    percentage: 0,
                    icon: BedDouble,
                    colorClass: 'bg-emerald-500',
                },
                {
                    label: 'Executive Suite',
                    count: 0,
                    percentage: 0,
                    icon: BedDouble,
                    colorClass: 'bg-purple-500',
                },
            ];
        }
        const totalB = perf.reduce((s, p) => s + p.bookings, 0) || 1;
        return perf.map((p, idx) => ({
            label: p.name,
            count: p.bookings,
            percentage: Math.round((p.bookings / totalB) * 100),
            amount: p.revenue,
            currency: data?.currency || 'ETB',
            icon: BedDouble,
            colorClass: [
                'bg-teal-500',
                'bg-emerald-500',
                'bg-purple-500',
                'bg-amber-500',
                'bg-sky-500',
            ][idx % 5],
        }));
    }, [data?.room_type_performance, data?.currency]);

    if (loading) {
        return <AdminLoader label="Aggregating property extranet metrics…" />;
    }
    if (error) {
        return (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-800 space-y-3">
                <p className="font-bold">Failed to load property dashboard</p>
                <p className="text-xs">{error}</p>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.location.reload()}
                >
                    Retry
                </Button>
            </div>
        );
    }
    if (!data) return null;

    const timeline = data.timeline || [];
    const kpis = data.hospitality_kpis;
    const ops = data.operations_radar;
    const monthlyTrend = data.monthly_trend || [];

    const confirmedRev = data.revenue_confirmed || 0;
    const netPayout = data.net_payout ?? Math.round(confirmedRev * 0.88);
    const commPct = data.commission_percent ?? 12;
    const adr = kpis?.adr || 0;
    const revpar = kpis?.revpar || 0;
    const occPct = kpis?.occupancy_rate_pct || 0;

    const getStatusIcon = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'confirmed':
            case 'paid':
            case 'stayed':
                return <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />;
            case 'pending':
            case 'initiated':
                return <Clock className="w-3.5 h-3.5 text-amber-600" />;
            case 'cancelled':
            case 'failed':
            case 'no_show':
                return <XCircle className="w-3.5 h-3.5 text-rose-600" />;
            default:
                return <AlertCircle className="w-3.5 h-3.5 text-gray-500" />;
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'confirmed':
            case 'paid':
            case 'stayed':
                return 'bg-emerald-50 text-emerald-700 border-emerald-200';
            case 'pending':
            case 'initiated':
                return 'bg-amber-50 text-amber-700 border-amber-200';
            case 'cancelled':
            case 'failed':
            case 'no_show':
                return 'bg-rose-50 text-rose-700 border-rose-200';
            default:
                return 'bg-gray-50 text-gray-700 border-gray-200';
        }
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            {/* Header with Extranet Branding and Quick Action Buttons */}
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-brand-primary bg-brand-primary/10 px-2.5 py-0.5 rounded-md">
                            {[brand || 'BookAddis Partner Extranet', hotel?.city].filter(Boolean).join(' · ')}
                        </span>
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    </div>
                    <h1 className="text-3xl font-extrabold text-brand-dark tracking-tight mt-1.5">
                        {hotel?.name || 'Property Operations Dashboard'}
                    </h1>
                    <p className="text-xs text-slate-500 mt-1">
                        Daily hospitality management: rates, guest arrivals, inventory utilization, and payouts.
                    </p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Link
                        href={`/admin/hotel/${hotelId}/rooms`}
                        className="rounded-xl bg-brand-primary px-3.5 py-2 text-xs font-bold text-white hover:opacity-95 shadow-xs transition-opacity flex items-center gap-1.5"
                    >
                        <BedDouble className="w-3.5 h-3.5" />
                        Manage Rooms
                    </Link>
                    <Link
                        href={`/admin/hotel/${hotelId}/calendar`}
                        className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-brand-dark hover:border-brand-primary/40 shadow-2xs transition-colors flex items-center gap-1.5"
                    >
                        <CalendarDays className="w-3.5 h-3.5 text-teal-700" />
                        Rates & Availability
                    </Link>
                    <Link
                        href={`/admin/hotel/${hotelId}/billing`}
                        className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-brand-dark hover:border-brand-primary/40 shadow-2xs transition-colors flex items-center gap-1.5"
                    >
                        <DollarSign className="w-3.5 h-3.5 text-emerald-700" />
                        Invoices & Payouts
                    </Link>
                </div>
            </div>

            {/* Filter Toolbar */}
            <AnalyticsFilterBar
                timeRange={timeRange}
                onTimeRangeChange={setTimeRange}
                status={statusFilter}
                onStatusChange={setStatusFilter}
                paymentMethod={paymentFilter}
                onPaymentMethodChange={setPaymentFilter}
                paymentOptions={[
                    { label: 'All Payment Timing', value: 'all' },
                    { label: 'BookAddis Prepaid', value: 'prepaid' },
                    { label: 'Pay at Property', value: 'cash' },
                ]}
                searchQuery={searchQuery}
                onSearchQueryChange={setSearchQuery}
                searchPlaceholder="Search guest name, room, or booking id…"
                onReset={handleResetFilters}
            />

            {/* 5 Industry Standard Hospitality KPI Cards */}
            <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-5">
                <KpiMetricCard
                    title="Confirmed Revenue"
                    value={formatMoney(confirmedRev, data.currency)}
                    subtitle={`Net payout: ${formatMoney(netPayout, data.currency)} (${commPct}% comm)`}
                    icon={DollarSign}
                    highlight
                    iconBgClass="bg-emerald-50 text-emerald-600"
                />
                <KpiMetricCard
                    title="Occupancy Rate"
                    value={`${occPct}%`}
                    subtitle={`${kpis?.total_booked_nights ?? 0} booked room nights / month`}
                    icon={Percent}
                    iconBgClass="bg-teal-50 text-teal-600"
                />
                <KpiMetricCard
                    title="Average Daily Rate (ADR)"
                    value={formatMoney(adr, data.currency)}
                    subtitle="Average room revenue per occupied night"
                    icon={TrendingUp}
                    iconBgClass="bg-purple-50 text-purple-600"
                />
                <KpiMetricCard
                    title="RevPAR"
                    value={formatMoney(revpar, data.currency)}
                    subtitle="Revenue per available sellable room"
                    icon={BedDouble}
                    iconBgClass="bg-sky-50 text-sky-600"
                />
                <KpiMetricCard
                    title="Active Reservations"
                    value={String(data.bookings_active)}
                    subtitle={`${data.bookings_upcoming} upcoming stays on schedule`}
                    icon={BookOpen}
                    iconBgClass="bg-amber-50 text-amber-600"
                />
            </div>

            {/* Front Desk Operations Radar Card */}
            <div className="bg-gradient-to-r from-teal-900 via-brand-dark to-slate-900 rounded-2xl p-5 md:p-6 text-white shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 border-b border-white/10 pb-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-teal-400" />
                            <h2 className="text-base font-extrabold tracking-tight">
                                Front-Desk Daily Operations Radar
                            </h2>
                        </div>
                        <p className="text-xs text-white/70 mt-0.5">
                            Real-time arrivals, departures, and in-house guests for property operations
                        </p>
                    </div>
                    <span className="text-xs font-semibold px-3 py-1 rounded-full bg-white/10 text-white border border-white/15 self-start sm:self-auto">
                        Today: {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="bg-white/10 backdrop-blur-xs rounded-xl p-4 border border-white/10">
                        <div className="flex items-center gap-2 text-teal-300 text-xs font-bold mb-1">
                            <LogIn className="w-4 h-4" />
                            <span>Arrivals Today</span>
                        </div>
                        <p className="text-3xl font-black">{ops?.checkins_today ?? 0}</p>
                        <p className="text-[11px] text-white/60 mt-1">Guests checking in</p>
                    </div>

                    <div className="bg-white/10 backdrop-blur-xs rounded-xl p-4 border border-white/10">
                        <div className="flex items-center gap-2 text-rose-300 text-xs font-bold mb-1">
                            <LogOut className="w-4 h-4" />
                            <span>Departures Today</span>
                        </div>
                        <p className="text-3xl font-black">{ops?.checkouts_today ?? 0}</p>
                        <p className="text-[11px] text-white/60 mt-1">Guests checking out</p>
                    </div>

                    <div className="bg-white/10 backdrop-blur-xs rounded-xl p-4 border border-white/10">
                        <div className="flex items-center gap-2 text-amber-300 text-xs font-bold mb-1">
                            <Home className="w-4 h-4" />
                            <span>In-House Stays</span>
                        </div>
                        <p className="text-3xl font-black">{ops?.in_house_today ?? 0}</p>
                        <p className="text-[11px] text-white/60 mt-1">Occupied units tonight</p>
                    </div>

                    <div className="bg-white/10 backdrop-blur-xs rounded-xl p-4 border border-white/10">
                        <div className="flex items-center gap-2 text-sky-300 text-xs font-bold mb-1">
                            <CalendarDays className="w-4 h-4" />
                            <span>Upcoming Stays</span>
                        </div>
                        <p className="text-3xl font-black">{ops?.upcoming_total ?? data.bookings_upcoming}</p>
                        <p className="text-[11px] text-white/60 mt-1">Confirmed future bookings</p>
                    </div>
                </div>
            </div>

            {/* Main Graphs: Monthly Revenue Trajectory & Room Performance */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <TrendBarChart
                        title="Property Revenue & Bookings Velocity"
                        subtitle="Monthly reservation volume and confirmed revenue stream"
                        data={monthlyTrend}
                        currency={data.currency}
                        primaryLabel="Confirmed Revenue"
                        secondaryLabel="Reservations"
                    />
                </div>

                <div>
                    <CategoryProgressList
                        title="Room Type Performance"
                        subtitle="Share of reservations & volume by room category"
                        badgeText={`${data.total_inventory} Units`}
                        items={roomCategoryItems}
                        showAmounts
                        emptyText="No room type sales logged yet."
                    />
                </div>
            </div>

            {/* Filtered Recent Reservations Table & Activity Timeline */}
            <div className="grid gap-6 lg:grid-cols-5">
                <section className="lg:col-span-3 rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                        <div>
                            <h2 className="font-extrabold text-brand-dark tracking-tight">
                                Reservations Roster
                            </h2>
                            <p className="text-xs text-slate-500 mt-0.5">
                                Showing {filteredBookings.length} matching reservations
                                {(statusFilter !== 'all' || paymentFilter !== 'all' || searchQuery) && (
                                    <span className="ml-1 text-brand-primary font-bold">(filtered)</span>
                                )}
                            </p>
                        </div>
                        <Link
                            href={`/admin/hotel/${hotelId}/reservations`}
                            className="text-xs font-bold text-brand-primary hover:underline"
                        >
                            View all reservations →
                        </Link>
                    </div>

                    <div className="divide-y divide-slate-100">
                        {filteredBookings.length === 0 ? (
                            <div className="px-4 py-12 text-center text-sm text-slate-400">
                                <p>No reservations match your filter criteria.</p>
                                <button
                                    type="button"
                                    onClick={handleResetFilters}
                                    className="mt-2 text-xs font-bold text-brand-primary hover:underline"
                                >
                                    Reset filters
                                </button>
                            </div>
                        ) : (
                            filteredBookings.slice(0, 10).map((b) => {
                                const nights = calculateNights(b.check_in, b.check_out);
                                return (
                                    <div
                                        key={b.id}
                                        onClick={() => setSelectedBooking(b)}
                                        className="px-5 py-3.5 flex items-center justify-between gap-4 hover:bg-slate-50/80 transition-colors cursor-pointer group"
                                    >
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2">
                                                <p className="text-sm font-bold text-brand-dark group-hover:text-brand-primary transition-colors truncate">
                                                    {b.guest_name || 'Guest User'}
                                                </p>
                                                <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.2 rounded-md">
                                                    {b.room_name || 'Standard Room'}
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                                                <span>
                                                    {[b.check_in, b.check_out].filter(Boolean).join(' → ') ||
                                                        new Date(b.created_at || '').toLocaleDateString()}
                                                </span>
                                                <span className="text-slate-300">·</span>
                                                <span className="font-semibold text-slate-600">
                                                    {nights} night{nights === 1 ? '' : 's'}
                                                </span>
                                            </p>
                                        </div>

                                        <div className="text-right shrink-0">
                                            <p className="text-sm font-black text-brand-dark">
                                                {b.currency || data.currency}{' '}
                                                {Number(b.amount).toLocaleString()}
                                            </p>
                                            <span
                                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border mt-0.5 ${getStatusBadge(
                                                    b.stay_outcome === 'stayed' ? 'stayed' : b.status,
                                                )}`}
                                            >
                                                {getStatusIcon(b.stay_outcome === 'stayed' ? 'stayed' : b.status)}
                                                {b.stay_outcome === 'stayed' ? 'Stayed & Paid' : b.status}
                                            </span>
                                            {formatFriendlyFailureReason(b.failure_reason, b.status) && (
                                                <p
                                                    className="text-[10px] text-rose-600 font-medium mt-0.5 max-w-[150px] truncate ml-auto"
                                                    title={formatFriendlyFailureReason(b.failure_reason, b.status)!}
                                                >
                                                    {formatFriendlyFailureReason(b.failure_reason, b.status)}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs text-slate-500">
                        <span>Click any reservation to view guest details and POS actions</span>
                        <span className="font-bold text-slate-700">
                            {filteredBookings.length} total displayed
                        </span>
                    </div>
                </section>

                {/* Activity Timeline */}
                <section className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden flex flex-col justify-between">
                    <div>
                        <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
                            <CreditCard className="w-4 h-4 text-brand-primary" />
                            <h2 className="font-extrabold text-brand-dark tracking-tight">
                                Extranet Activity Timeline
                            </h2>
                        </div>
                        <ul className="divide-y divide-slate-100 max-h-[460px] overflow-y-auto scrollbar-hide text-xs">
                            {timeline.length === 0 ? (
                                <li className="px-4 py-12 text-sm text-slate-400 text-center">
                                    No activity recorded yet for this property.
                                </li>
                            ) : (
                                timeline.map((ev) => (
                                    <li key={ev.id} className="px-5 py-3 hover:bg-slate-50/60 transition-colors">
                                        <p className="font-bold text-brand-dark">{ev.title}</p>
                                        <p className="text-slate-500 mt-0.5">{ev.detail}</p>
                                        <p className="text-[10px] text-slate-400 font-medium mt-1">
                                            {formatAdminDateTime(ev.at)}
                                        </p>
                                    </li>
                                ))
                            )}
                        </ul>
                    </div>

                    <div className="p-4 border-t border-slate-100 bg-slate-50/60 text-center text-xs text-slate-500">
                        Direct webhook sync with BookAddis reservations ledger
                    </div>
                </section>
            </div>

            {/* Hotel Reservation Detail Sheet / Drawer */}
            <HotelReservationDetailSheet
                open={!!selectedBooking}
                onOpenChange={(open) => !open && setSelectedBooking(null)}
                hotelId={hotelId}
                booking={selectedBooking}
            />
        </div>
    );
}
