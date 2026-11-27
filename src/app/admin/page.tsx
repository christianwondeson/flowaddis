'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    Users,
    CreditCard,
    Calendar,
    TrendingUp,
    Hotel,
    Plane,
    ArrowUpRight,
    ArrowDownRight,
    DollarSign,
    Building2,
    Clock,
    CheckCircle,
    XCircle,
    AlertCircle,
    BarChart3,
    Car,
    Copy,
    Check,
    Percent,
    ShieldCheck,
    Compass,
    Sparkles,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { AdminLoader } from '@/components/ui/admin-loader';
import { auth } from '@/lib/firebase';
import { AdminRequests } from '@/components/admin/admin-requests';
import { HotelPartnerRequests } from '@/components/admin/hotel-partner-requests';
import { adminInventoryFetch } from '@/lib/admin-inventory-api';
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
import { formatFriendlyFailureReason } from '@/components/admin/booking-com-reservation-cols';

type RangeKey = TimeRangeValue;

type DashboardData = {
    range: RangeKey;
    cards: {
        users_total: number;
        bookings_total: number;
        bookings_in_range: number;
        bookings_change_pct: number;
        revenue_in_range: number;
        revenue_change_pct: number;
        gross_booking_value?: number;
        platform_commission?: number;
        avg_booking_value?: number;
        cancellation_rate_pct?: number;
        currency: string;
        paid_transactions_in_range: number;
        hotels_direct: number;
        hotels_published: number;
        hotels_pending_review: number;
        memberships_active: number;
    };
    booking_breakdown: { type: string; count: number; percentage: number }[];
    monthly_trend: { month: string; ym: string; bookings: number; revenue: number }[];
    commission_summary?: {
        take_rate_pct: number;
        gross_booking_value: number;
        platform_commission: number;
        net_hotel_payouts: number;
    };
    status_breakdown?: {
        status: string;
        label: string;
        count: number;
        percentage: number;
    }[];
    top_hotels?: {
        name: string;
        bookings: number;
        revenue: number;
    }[];
    city_breakdown?: {
        city: string;
        bookings: number;
        revenue: number;
    }[];
    payment_health: {
        succeeded: number;
        failed: number;
        pending: number;
        succeededAmount: number;
        failedAmount: number;
        pendingAmount: number;
        success_rate_pct: number;
    };
    payment_methods: { name: string; count: number; percent: number }[];
    recent_bookings: {
        id: string;
        payment_reference: string | null;
        user: string;
        type: string;
        destination: string;
        amount: number;
        currency: string;
        status: string;
        failure_reason?: string | null;
        created_at: string;
    }[];
    recent_payments: {
        id: string;
        provider: string;
        channel: string | null;
        amount: number;
        currency: string;
        status: string;
        payment_reference: string | null;
        guest_name: string | null;
        created_at: string;
    }[];
};

const METHOD_COLORS = [
    'bg-emerald-500',
    'bg-sky-500',
    'bg-amber-500',
    'bg-rose-500',
    'bg-slate-500',
];

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

function formatCompact(n: number) {
    return new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(
        n || 0,
    );
}

function relativeTime(iso: string) {
    const t = new Date(iso).getTime();
    if (Number.isNaN(t)) return ' ';
    const diff = Date.now() - t;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins} min ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 14) return `${days}d ago`;
    return new Date(iso).toLocaleDateString();
}

function changeLabel(pct: number) {
    const sign = pct > 0 ? '+' : '';
    return `${sign}${pct}%`;
}

export default function AdminDashboard() {
    const [timeRange, setTimeRange] = useState<RangeKey>('all');
    const [selectedHotelId, setSelectedHotelId] = useState<string>('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState<string>('');

    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [data, setData] = useState<DashboardData | null>(null);
    const [hotelsList, setHotelsList] = useState<Array<{ id: string; name: string }>>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [commissionAlert, setCommissionAlert] = useState<{
        outstanding_total: number;
        unpaid_invoice_count: number;
        hotels_with_unpaid: number;
        currency: string;
    } | null>(null);

    const handleCopy = (id: string, text: string) => {
        try {
            navigator.clipboard.writeText(text);
            setCopiedId(id);
            setTimeout(() => setCopiedId(null), 2000);
        } catch {}
    };

    const handleResetFilters = () => {
        setTimeRange('all');
        setSelectedHotelId('');
        setStatusFilter('all');
        setPaymentMethodFilter('all');
        setSearchQuery('');
    };

    const load = useCallback(async (range: RangeKey) => {
        setLoading(true);
        setError(null);
        try {
            const token = await auth?.currentUser?.getIdToken();
            if (!token) {
                setError('Sign in required');
                setData(null);
                return;
            }
            const url = new URL('/api/admin/dashboard', window.location.origin);
            url.searchParams.set('range', range);
            const res = await fetch(url.toString(), {
                headers: { Authorization: `Bearer ${token}` },
                cache: 'no-store',
            });
            const json = await res.json().catch(() => ({}));
            if (!res.ok) {
                throw new Error(
                    (json as { error?: string }).error || 'Failed to load dashboard',
                );
            }
            setData(json as DashboardData);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to load dashboard');
            setData(null);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void load(timeRange);
    }, [timeRange, load]);

    useEffect(() => {
        // Load direct hotels for the filter dropdown
        adminInventoryFetch<Array<{ id: string; name: string }>>('hotels')
            .then((list) => {
                if (Array.isArray(list)) {
                    setHotelsList(
                        list.map((h) => ({ id: h.id, name: h.name || 'Untitled Hotel' })),
                    );
                }
            })
            .catch(() => {});

        // Commission check
        adminInventoryFetch<{
            outstanding_total: number;
            unpaid_invoice_count: number;
            hotels_with_unpaid: number;
            currency: string;
        }>('billing/commission/overview')
            .then((ov) => {
                if (ov.unpaid_invoice_count > 0) setCommissionAlert(ov);
            })
            .catch(() => setCommissionAlert(null));
    }, []);

    const cards = data?.cards;
    const monthlyData = data?.monthly_trend ?? [];
    const health = data?.payment_health;
    const methods = data?.payment_methods ?? [];
    const recentBookings = data?.recent_bookings ?? [];
    const recentPayments = data?.recent_payments ?? [];
    const statusBreakdown = data?.status_breakdown ?? [];
    const topHotels = data?.top_hotels ?? [];

    // Filter recent bookings client-side with comprehensive criteria
    const filteredRecentBookings = useMemo(() => {
        return recentBookings.filter((b) => {
            if (selectedHotelId) {
                const targetHotel = hotelsList.find((h) => h.id === selectedHotelId);
                const hotelName = targetHotel ? targetHotel.name.toLowerCase() : '';
                const dest = (b.destination || '').toLowerCase();
                if (hotelName && !dest.includes(hotelName)) {
                    return false;
                }
            }
            if (statusFilter !== 'all') {
                const s = (b.status || '').toLowerCase();
                if (statusFilter === 'confirmed' && !['confirmed', 'paid'].includes(s))
                    return false;
                if (
                    statusFilter === 'pending' &&
                    !['pending', 'initiated', 'in_review'].includes(s)
                )
                    return false;
                if (
                    statusFilter === 'cancelled' &&
                    !['cancelled', 'failed', 'refunded', 'expired'].includes(s)
                )
                    return false;
            }
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase().trim();
                const u = (b.user || '').toLowerCase();
                const ref = (b.payment_reference || '').toLowerCase();
                const id = (b.id || '').toLowerCase();
                const dest = (b.destination || '').toLowerCase();
                if (
                    !u.includes(q) &&
                    !ref.includes(q) &&
                    !id.includes(q) &&
                    !dest.includes(q)
                ) {
                    return false;
                }
            }
            return true;
        });
    }, [recentBookings, selectedHotelId, hotelsList, statusFilter, searchQuery]);

    // Service categories formatted for progress list
    const serviceCategoryItems: CategoryItem[] = useMemo(() => {
        const breakdown = data?.booking_breakdown || [];
        if (breakdown.length === 0) {
            return [
                {
                    label: 'Hotels & Resorts',
                    count: 0,
                    percentage: 0,
                    icon: Building2,
                    colorClass: 'bg-teal-500',
                },
                {
                    label: 'Flight Bookings',
                    count: 0,
                    percentage: 0,
                    icon: Plane,
                    colorClass: 'bg-sky-500',
                },
                {
                    label: 'Conferences & Events',
                    count: 0,
                    percentage: 0,
                    icon: Users,
                    colorClass: 'bg-purple-500',
                },
                {
                    label: 'Airport Shuttles',
                    count: 0,
                    percentage: 0,
                    icon: Car,
                    colorClass: 'bg-amber-500',
                },
            ];
        }
        return breakdown.map((item) => {
            const t = item.type.toLowerCase();
            let icon = Building2;
            let color = 'bg-teal-500';
            if (t.includes('flight')) {
                icon = Plane;
                color = 'bg-sky-500';
            } else if (t.includes('conference') || t.includes('event')) {
                icon = Users;
                color = 'bg-purple-500';
            } else if (t.includes('shuttle') || t.includes('car')) {
                icon = Car;
                color = 'bg-amber-500';
            }
            return {
                label: item.type,
                count: item.count,
                percentage: item.percentage,
                icon,
                colorClass: color,
            };
        });
    }, [data?.booking_breakdown]);

    // Status breakdown formatted for progress list
    const statusCategoryItems: CategoryItem[] = useMemo(() => {
        if (!statusBreakdown || statusBreakdown.length === 0) {
            return [
                {
                    label: 'Confirmed / Paid',
                    count: 0,
                    percentage: 0,
                    icon: CheckCircle,
                    colorClass: 'bg-emerald-500',
                },
                {
                    label: 'Pending / Processing',
                    count: 0,
                    percentage: 0,
                    icon: Clock,
                    colorClass: 'bg-amber-500',
                },
                {
                    label: 'Cancelled / Failed',
                    count: 0,
                    percentage: 0,
                    icon: XCircle,
                    colorClass: 'bg-rose-500',
                },
            ];
        }
        return statusBreakdown.map((s) => ({
            label: s.label,
            count: s.count,
            percentage: s.percentage,
            icon:
                s.status === 'confirmed'
                    ? CheckCircle
                    : s.status === 'pending'
                      ? Clock
                      : XCircle,
            colorClass:
                s.status === 'confirmed'
                    ? 'bg-emerald-500'
                    : s.status === 'pending'
                      ? 'bg-amber-500'
                      : 'bg-rose-500',
        }));
    }, [statusBreakdown]);

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'confirmed':
                return <CheckCircle className="w-4 h-4 text-emerald-600" />;
            case 'pending':
                return <Clock className="w-4 h-4 text-amber-600" />;
            case 'cancelled':
                return <XCircle className="w-4 h-4 text-rose-600" />;
            default:
                return <AlertCircle className="w-4 h-4 text-gray-500" />;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'confirmed':
                return 'bg-emerald-50 text-emerald-700 border-emerald-200';
            case 'pending':
                return 'bg-amber-50 text-amber-700 border-amber-200';
            case 'cancelled':
                return 'bg-rose-50 text-rose-700 border-rose-200';
            default:
                return 'bg-gray-50 text-gray-700 border-gray-200';
        }
    };

    const grossRev = cards?.gross_booking_value ?? cards?.revenue_in_range ?? 0;
    const platformComm =
        cards?.platform_commission ??
        data?.commission_summary?.platform_commission ??
        Math.round(grossRev * 0.12);
    const avgOrderVal =
        cards?.avg_booking_value ??
        (cards?.bookings_in_range && cards.bookings_in_range > 0
            ? Math.round(grossRev / cards.bookings_in_range)
            : 0);

    return (
        <div className="space-y-8">
            {/* Header with Title and Quick Status */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <div className="flex items-center gap-2">
                        <h1 className="text-3xl font-extrabold text-brand-dark tracking-tight">
                            Super Admin Overview
                        </h1>
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Live Metrics
                        </span>
                    </div>
                    <p className="text-gray-500 text-sm mt-1">
                        Comprehensive ledger analytics across bookings, platform commissions,
                        and partner properties.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => void load(timeRange)}
                        className="text-xs font-semibold"
                    >
                        Refresh Data
                    </Button>
                    <Button asChild size="sm" className="text-xs font-semibold">
                        <Link href="/admin/finance">Finance & Settlements</Link>
                    </Button>
                </div>
            </div>

            {/* Filter Bar */}
            <AnalyticsFilterBar
                timeRange={timeRange}
                onTimeRangeChange={setTimeRange}
                hotels={hotelsList}
                selectedHotelId={selectedHotelId}
                onHotelChange={setSelectedHotelId}
                status={statusFilter}
                onStatusChange={setStatusFilter}
                paymentMethod={paymentMethodFilter}
                onPaymentMethodChange={setPaymentMethodFilter}
                searchQuery={searchQuery}
                onSearchQueryChange={setSearchQuery}
                onReset={handleResetFilters}
            />

            {/* Outstanding Commission Alerts if any */}
            {commissionAlert && (
                <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50/90 px-4 py-3.5 text-sm text-amber-950 shadow-xs">
                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-amber-700" />
                    <div className="flex-1">
                        <p className="font-bold">
                            Unpaid commission invoices across{' '}
                            {commissionAlert.hotels_with_unpaid} partner hotel
                            {commissionAlert.hotels_with_unpaid === 1 ? '' : 's'}
                        </p>
                        <p className="text-amber-900/90 text-xs mt-0.5">
                            {commissionAlert.currency}{' '}
                            {Number(commissionAlert.outstanding_total).toLocaleString()}{' '}
                            · {commissionAlert.unpaid_invoice_count} pending invoice
                            {commissionAlert.unpaid_invoice_count === 1 ? '' : 's'}
                        </p>
                    </div>
                    <Link
                        href="/admin/finance"
                        className="font-bold text-xs text-teal-800 bg-white/80 hover:bg-white border border-amber-300 rounded-lg px-3 py-1.5 shrink-0 transition-colors"
                    >
                        Open Invoices →
                    </Link>
                </div>
            )}

            {/* Direct Hotel Workspace Shortcut */}
            <div className="rounded-2xl border border-sky-200 bg-sky-50/80 px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-xs">
                <div>
                    <h2 className="font-extrabold text-brand-dark text-sm">
                        Partner Hotel Workspace
                    </h2>
                    <p className="text-xs text-slate-600 mt-0.5">
                        Partner KYC, register Direct hotels, assign staff memberships, and publish
                        rooms directly on BookAddis.
                    </p>
                </div>
                <Button asChild size="sm" className="shrink-0 font-semibold text-xs">
                    <Link href="/admin/partners">Manage Hotels</Link>
                </Button>
            </div>

            <AdminRequests />
            <HotelPartnerRequests />

            {loading && !data ? (
                <AdminLoader label="Aggregating platform ledger analytics…" />
            ) : error && !data ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-800 space-y-3">
                    <p className="font-bold">Failed to load platform dashboard</p>
                    <p className="text-xs">{error}</p>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => void load(timeRange)}
                    >
                        Try Again
                    </Button>
                </div>
            ) : (
                <>
                    {/* 6 High-Impact KPI Cards Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                        <KpiMetricCard
                            title="Gross Booking (GBV)"
                            value={formatMoney(grossRev, cards?.currency || 'ETB')}
                            subtitle={`${cards?.paid_transactions_in_range ?? 0} settled transactions`}
                            icon={DollarSign}
                            change={cards?.revenue_change_pct ? changeLabel(cards.revenue_change_pct) : null}
                            trend={
                                (cards?.revenue_change_pct ?? 0) >= 0 ? 'up' : 'down'
                            }
                            highlight
                        />
                        <KpiMetricCard
                            title="Net Platform Commission"
                            value={formatMoney(platformComm, cards?.currency || 'ETB')}
                            subtitle="~12% average take-rate"
                            icon={Percent}
                            iconBgClass="bg-emerald-50 text-emerald-600"
                        />
                        <KpiMetricCard
                            title="Total Reservations"
                            value={formatCompact(cards?.bookings_in_range ?? 0)}
                            subtitle={`${formatCompact(cards?.bookings_total ?? 0)} all-time records`}
                            icon={Calendar}
                            change={cards?.bookings_change_pct ? changeLabel(cards.bookings_change_pct) : null}
                            trend={
                                (cards?.bookings_change_pct ?? 0) >= 0 ? 'up' : 'down'
                            }
                            iconBgClass="bg-teal-50 text-teal-600"
                        />
                        <KpiMetricCard
                            title="Average Order (AOV)"
                            value={formatMoney(avgOrderVal, cards?.currency || 'ETB')}
                            subtitle="Per confirmed reservation"
                            icon={TrendingUp}
                            iconBgClass="bg-purple-50 text-purple-600"
                        />
                        <KpiMetricCard
                            title="Payment Health"
                            value={`${health?.success_rate_pct ?? 0}%`}
                            subtitle={`${health?.failed ?? 0} failed / ${health?.pending ?? 0} in-flight`}
                            icon={ShieldCheck}
                            iconBgClass="bg-sky-50 text-sky-600"
                        />
                        <KpiMetricCard
                            title="Direct Hotels"
                            value={String(cards?.hotels_direct ?? 0)}
                            subtitle={`${cards?.hotels_published ?? 0} published · ${cards?.memberships_active ?? 0} staff`}
                            icon={Building2}
                            iconBgClass="bg-slate-100 text-slate-700"
                        />
                    </div>

                    {/* Main Charts: Trend Timeline + Category Mix */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2">
                            <TrendBarChart
                                title="Platform Revenue & Bookings Trajectory"
                                subtitle="Monthly confirmed reservation counts and gross financial volume"
                                data={monthlyData}
                                currency={cards?.currency || 'ETB'}
                                primaryLabel="Paid Volume"
                                secondaryLabel="Bookings"
                            />
                        </div>

                        <div>
                            <CategoryProgressList
                                title="Booking Service Mix"
                                subtitle="Distribution of bookings by category"
                                badgeText="By Service"
                                items={serviceCategoryItems}
                                emptyText="No category breakdown recorded."
                            />
                        </div>
                    </div>

                    {/* Secondary Analytics: Status Breakdown + Top Properties */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div>
                            <CategoryProgressList
                                title="Booking Status & Velocity"
                                subtitle="Completion vs cancellation rates"
                                badgeText="Health Index"
                                items={statusCategoryItems}
                                emptyText="No status data in this range."
                            />
                        </div>

                        {/* Top Performing Hotels Leaderboard */}
                        <div className="lg:col-span-2 bg-white p-6 md:p-8 rounded-2xl shadow-xs border border-gray-100 flex flex-col justify-between">
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <h2 className="text-lg font-extrabold text-brand-dark tracking-tight">
                                            Top Partner Hotels Leaderboard
                                        </h2>
                                        <p className="text-xs text-gray-500 mt-0.5">
                                            Leading properties by reservation volume & revenue
                                        </p>
                                    </div>
                                    <Link
                                        href="/admin/partners?tab=hotels"
                                        className="text-xs font-bold text-brand-primary hover:underline"
                                    >
                                        View all properties →
                                    </Link>
                                </div>

                                {topHotels.length === 0 ? (
                                    <div className="py-12 text-center text-sm text-gray-400">
                                        No hotel performance recorded for this range.
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {topHotels.map((h, idx) => (
                                            <div
                                                key={h.name || idx}
                                                className="flex items-center justify-between p-3.5 bg-gray-50/70 hover:bg-gray-50 rounded-xl border border-gray-100 transition-colors"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <span className="w-6 h-6 rounded-full bg-brand-primary/10 text-brand-primary text-xs font-black flex items-center justify-center shrink-0">
                                                        #{idx + 1}
                                                    </span>
                                                    <div>
                                                        <h4 className="text-sm font-extrabold text-gray-900">
                                                            {h.name}
                                                        </h4>
                                                        <p className="text-xs text-gray-500">
                                                            {h.bookings} reservation
                                                            {h.bookings === 1 ? '' : 's'}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-sm font-black text-brand-dark">
                                                        {formatMoney(
                                                            h.revenue,
                                                            cards?.currency || 'ETB',
                                                        )}
                                                    </span>
                                                    <span className="text-[11px] text-emerald-600 block font-semibold">
                                                        Est. comm: {formatMoney(Math.round(h.revenue * 0.12), cards?.currency || 'ETB')}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="border-t border-gray-100 pt-4 mt-4 flex items-center justify-between text-xs text-gray-500">
                                <span>Platform commission rate</span>
                                <span className="font-bold text-brand-dark">Standard 10% - 15%</span>
                            </div>
                        </div>
                    </div>

                    {/* Financial Overview & Payment Channel Breakdown */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 bg-white p-6 md:p-8 rounded-2xl shadow-xs border border-gray-100">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h2 className="text-lg font-extrabold text-brand-dark tracking-tight">
                                        Settlement & Payment Gateway Health
                                    </h2>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Breakdown of payment attempts across CBE Birr, Telebirr & MPGS
                                    </p>
                                </div>
                                <DollarSign className="w-5 h-5 text-brand-primary" />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="bg-emerald-50/70 p-4 rounded-xl border border-emerald-100">
                                    <div className="flex items-center gap-2.5 mb-2">
                                        <div className="p-1.5 bg-emerald-100 rounded-lg text-emerald-700">
                                            <CheckCircle className="w-4 h-4" />
                                        </div>
                                        <span className="text-xs font-bold text-emerald-800">
                                            Settled & Succeeded
                                        </span>
                                    </div>
                                    <div className="text-xl font-extrabold text-gray-900">
                                        {formatMoney(health?.succeededAmount || 0, cards?.currency || 'ETB')}
                                    </div>
                                    <div className="text-xs text-emerald-700 font-medium mt-1">
                                        {health?.succeeded || 0} payments · {health?.success_rate_pct ?? 0}% rate
                                    </div>
                                </div>

                                <div className="bg-rose-50/70 p-4 rounded-xl border border-rose-100">
                                    <div className="flex items-center gap-2.5 mb-2">
                                        <div className="p-1.5 bg-rose-100 rounded-lg text-rose-700">
                                            <XCircle className="w-4 h-4" />
                                        </div>
                                        <span className="text-xs font-bold text-rose-800">
                                            Failed Attempts
                                        </span>
                                    </div>
                                    <div className="text-xl font-extrabold text-gray-900">
                                        {formatMoney(health?.failedAmount || 0, cards?.currency || 'ETB')}
                                    </div>
                                    <div className="text-xs text-rose-600 font-medium mt-1">
                                        {health?.failed || 0} declined or timed out
                                    </div>
                                </div>

                                <div className="bg-amber-50/70 p-4 rounded-xl border border-amber-100">
                                    <div className="flex items-center gap-2.5 mb-2">
                                        <div className="p-1.5 bg-amber-100 rounded-lg text-amber-700">
                                            <Clock className="w-4 h-4" />
                                        </div>
                                        <span className="text-xs font-bold text-amber-800">
                                            Pending / In-Flight
                                        </span>
                                    </div>
                                    <div className="text-xl font-extrabold text-gray-900">
                                        {formatMoney(health?.pendingAmount || 0, cards?.currency || 'ETB')}
                                    </div>
                                    <div className="text-xs text-amber-700 font-medium mt-1">
                                        {health?.pending || 0} awaiting gateway confirmation
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6">
                                <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-3">
                                    Recent Payment Events
                                </h3>
                                {recentPayments.length === 0 ? (
                                    <p className="text-sm text-gray-500">No payment events logged.</p>
                                ) : (
                                    <div className="space-y-2.5">
                                        {recentPayments.map((tx) => (
                                            <div
                                                key={tx.id}
                                                className="flex items-center justify-between p-3 bg-gray-50/70 rounded-xl hover:bg-gray-100/80 transition-colors text-xs"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div
                                                        className={`w-2 h-2 rounded-full shrink-0 ${
                                                            tx.status === 'succeeded'
                                                                ? 'bg-emerald-500'
                                                                : tx.status === 'failed'
                                                                  ? 'bg-rose-500'
                                                                  : 'bg-amber-400'
                                                        }`}
                                                    />
                                                    <div>
                                                        <div className="font-bold text-gray-900">
                                                            {tx.channel || tx.provider || 'Gateway Payment'}
                                                            {tx.guest_name ? ` · ${tx.guest_name}` : ''}
                                                        </div>
                                                        <div className="text-gray-500 text-[11px]">
                                                            {tx.payment_reference || tx.id.slice(0, 8)} ·{' '}
                                                            {relativeTime(tx.created_at)}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right font-black text-gray-900">
                                                    {formatMoney(tx.amount, tx.currency)}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Payment Methods Distribution */}
                        <div className="bg-white p-6 md:p-8 rounded-2xl shadow-xs border border-gray-100 flex flex-col justify-between">
                            <div>
                                <h2 className="text-lg font-extrabold text-brand-dark mb-4">
                                    Payment Method Mix
                                </h2>
                                <p className="text-xs text-gray-500 mb-6">
                                    Channel volume share for settled reservations
                                </p>

                                {methods.length === 0 ? (
                                    <p className="text-sm text-gray-400 py-8 text-center">
                                        No settled payments in this window.
                                    </p>
                                ) : (
                                    <div className="space-y-5">
                                        {methods.map((method, idx) => (
                                            <div key={`${method.name}-${idx}`} className="space-y-1.5">
                                                <div className="flex items-center justify-between text-xs">
                                                    <span className="font-bold text-gray-800 capitalize">
                                                        {method.name}
                                                    </span>
                                                    <span className="font-extrabold text-brand-dark">
                                                        {method.percent}%{' '}
                                                        <span className="text-gray-400 font-normal">
                                                            ({method.count})
                                                        </span>
                                                    </span>
                                                </div>
                                                <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                                                    <div
                                                        className={`${METHOD_COLORS[idx % METHOD_COLORS.length]} h-full rounded-full transition-all duration-500`}
                                                        style={{ width: `${Math.max(2, method.percent)}%` }}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="mt-8 p-4 bg-teal-50/80 rounded-xl border border-teal-200/60">
                                <h4 className="text-xs font-extrabold text-teal-900 mb-1 flex items-center gap-1.5">
                                    <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                                    Payment Integration
                                </h4>
                                <p className="text-[11px] text-teal-800">
                                    Supports Telebirr SuperApp, CBE Birr direct integration, and MPGS
                                    Mastercard/Visa processing.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Filtered Recent Bookings Table */}
                    <div className="bg-white rounded-2xl shadow-xs border border-gray-100 overflow-hidden">
                        <div className="p-5 md:p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div>
                                <h2 className="text-lg font-extrabold text-brand-dark tracking-tight">
                                    Filtered Reservation Records
                                </h2>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    Showing {filteredRecentBookings.length} matching reservations
                                    {(selectedHotelId || statusFilter !== 'all' || searchQuery) && (
                                        <span className="ml-1 text-brand-primary font-semibold">
                                            (filtered)
                                        </span>
                                    )}
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                {(selectedHotelId || statusFilter !== 'all' || searchQuery) && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleResetFilters}
                                        className="text-xs text-gray-500"
                                    >
                                        Clear filters
                                    </Button>
                                )}
                                <Button asChild variant="outline" size="sm" className="text-xs font-semibold">
                                    <Link href="/admin/reservations">Open Full Reservations</Link>
                                </Button>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50/80 border-b border-gray-100 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                                    <tr>
                                        <th className="px-6 py-3.5">Reference</th>
                                        <th className="px-6 py-3.5">Guest / User</th>
                                        <th className="px-6 py-3.5">Service Type</th>
                                        <th className="px-6 py-3.5">Destination / Hotel</th>
                                        <th className="px-6 py-3.5">Amount</th>
                                        <th className="px-6 py-3.5">Status</th>
                                        <th className="px-6 py-3.5">Date</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 text-xs">
                                    {filteredRecentBookings.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={7}
                                                className="px-6 py-12 text-center text-sm text-gray-400"
                                            >
                                                No reservations match the selected filter criteria.
                                                <button
                                                    type="button"
                                                    onClick={handleResetFilters}
                                                    className="block mx-auto mt-2 text-xs text-brand-primary hover:underline font-semibold"
                                                >
                                                    Reset all filters
                                                </button>
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredRecentBookings.map((booking) => (
                                            <tr
                                                key={booking.id}
                                                className="hover:bg-gray-50/80 transition-colors"
                                            >
                                                <td className="px-6 py-4 whitespace-nowrap font-mono font-bold text-teal-900">
                                                    <div className="flex items-center gap-1.5">
                                                        <span>
                                                            {booking.payment_reference ||
                                                                booking.id.slice(0, 8)}
                                                        </span>
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                handleCopy(
                                                                    booking.id,
                                                                    booking.payment_reference ||
                                                                        booking.id,
                                                                )
                                                            }
                                                            className="p-1 rounded-md text-gray-400 hover:text-teal-700 hover:bg-teal-50 transition-colors"
                                                            title="Copy reference"
                                                        >
                                                            {copiedId === booking.id ? (
                                                                <Check className="w-3.5 h-3.5 text-teal-600" />
                                                            ) : (
                                                                <Copy className="w-3.5 h-3.5" />
                                                            )}
                                                        </button>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="w-7 h-7 rounded-full bg-teal-50 border border-teal-200 flex items-center justify-center text-xs font-bold text-teal-800 shrink-0">
                                                            {(booking.user || 'G')
                                                                .charAt(0)
                                                                .toUpperCase()}
                                                        </div>
                                                        <span className="font-bold text-gray-900">
                                                            {booking.user}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-gray-100 text-gray-700">
                                                        {booking.type}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-700">
                                                    {booking.destination || 'Addis Ababa Stay'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap font-extrabold text-gray-900">
                                                    {formatMoney(booking.amount, booking.currency)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex flex-col">
                                                        <span
                                                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${getStatusColor(
                                                                booking.status,
                                                            )}`}
                                                        >
                                                            {getStatusIcon(booking.status)}
                                                            {booking.status}
                                                        </span>
                                                        {formatFriendlyFailureReason(
                                                            booking.failure_reason,
                                                            booking.status,
                                                        ) && (
                                                            <span
                                                                className="text-[10px] text-rose-600 font-medium mt-0.5 max-w-[170px] truncate"
                                                                title={formatFriendlyFailureReason(
                                                                    booking.failure_reason,
                                                                    booking.status,
                                                                )!}
                                                            >
                                                                {formatFriendlyFailureReason(
                                                                    booking.failure_reason,
                                                                    booking.status,
                                                                )}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-gray-500 font-medium">
                                                    {relativeTime(booking.created_at)}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}

            {/* Quick Navigation Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Link
                    href="/admin/partners?tab=hotels"
                    className="bg-gradient-to-br from-brand-primary to-brand-secondary p-6 rounded-2xl text-white hover:shadow-lg transition-all group"
                >
                    <Hotel className="w-8 h-8 mb-3 group-hover:scale-110 transition-transform" />
                    <h3 className="font-bold text-lg">Hotels Workspace</h3>
                    <p className="text-white/80 text-xs mt-1">
                        Partners, Direct inventory & publishing
                    </p>
                </Link>
                <Link
                    href="/admin/flights"
                    className="bg-gradient-to-br from-brand-secondary to-brand-primary p-6 rounded-2xl text-white hover:shadow-lg transition-all group"
                >
                    <Plane className="w-8 h-8 mb-3 group-hover:scale-110 transition-transform" />
                    <h3 className="font-bold text-lg">Manage Flights</h3>
                    <p className="text-white/80 text-xs mt-1">Amadeus API and route management</p>
                </Link>
                <Link
                    href="/admin/transactions"
                    className="bg-gradient-to-br from-brand-dark to-brand-primary p-6 rounded-2xl text-white hover:shadow-lg transition-all group"
                >
                    <CreditCard className="w-8 h-8 mb-3 group-hover:scale-110 transition-transform" />
                    <h3 className="font-bold text-lg">Transactions Ledger</h3>
                    <p className="text-white/80 text-xs mt-1">Reconciliation and payment exports</p>
                </Link>
                <Link
                    href="/admin/support"
                    className="bg-gradient-to-br from-gray-700 to-brand-dark p-6 rounded-2xl text-white hover:shadow-lg transition-all group"
                >
                    <Calendar className="w-8 h-8 mb-3 group-hover:scale-110 transition-transform" />
                    <h3 className="font-bold text-lg">Support & Inquiries</h3>
                    <p className="text-white/80 text-xs mt-1">Disputes, customer cases & tickets</p>
                </Link>
            </div>
        </div>
    );
}
