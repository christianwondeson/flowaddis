'use client';

import React, { useCallback, useEffect, useState } from 'react';
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
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { AdminLoader } from '@/components/ui/admin-loader';
import { auth } from '@/lib/firebase';
import { AdminRequests } from '@/components/admin/admin-requests';
import { HotelPartnerRequests } from '@/components/admin/hotel-partner-requests';

type RangeKey = '7days' | '30days' | '90days' | 'year';

type DashboardData = {
    range: RangeKey;
    cards: {
        users_total: number;
        bookings_total: number;
        bookings_in_range: number;
        bookings_change_pct: number;
        revenue_in_range: number;
        revenue_change_pct: number;
        currency: string;
        paid_transactions_in_range: number;
        hotels_direct: number;
        hotels_published: number;
        hotels_pending_review: number;
        memberships_active: number;
    };
    booking_breakdown: { type: string; count: number; percentage: number }[];
    monthly_trend: { month: string; ym: string; bookings: number; revenue: number }[];
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

const BREAKDOWN_COLORS = [
    'bg-brand-primary',
    'bg-brand-secondary',
    'bg-brand-dark',
    'bg-gray-400',
    'bg-sky-500',
];

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
    const [timeRange, setTimeRange] = useState<RangeKey>('30days');
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

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

    const cards = data?.cards;
    const monthlyData = data?.monthly_trend ?? [];
    const maxBookings = Math.max(1, ...monthlyData.map((d) => d.bookings));
    const maxRevenue = Math.max(1, ...monthlyData.map((d) => d.revenue));
    const bookingStats = data?.booking_breakdown ?? [];
    const health = data?.payment_health;
    const methods = data?.payment_methods ?? [];
    const recentBookings = data?.recent_bookings ?? [];
    const recentPayments = data?.recent_payments ?? [];

    const stats = cards
        ? [
              {
                  label: 'Registered users',
                  value: formatCompact(cards.users_total),
                  icon: Users,
                  change: null as string | null,
                  trend: 'up' as const,
                  badgeClass: 'bg-brand-primary/10 text-brand-primary',
                  subtext: 'Postgres accounts',
              },
              {
                  label: 'Bookings (range)',
                  value: formatCompact(cards.bookings_in_range),
                  icon: Calendar,
                  change: changeLabel(cards.bookings_change_pct),
                  trend: (cards.bookings_change_pct >= 0 ? 'up' : 'down') as 'up' | 'down',
                  badgeClass: 'bg-brand-secondary/10 text-brand-secondary',
                  subtext: `${formatCompact(cards.bookings_total)} all-time`,
              },
              {
                  label: 'Revenue (paid)',
                  value: formatMoney(cards.revenue_in_range, cards.currency),
                  icon: DollarSign,
                  change: changeLabel(cards.revenue_change_pct),
                  trend: (cards.revenue_change_pct >= 0 ? 'up' : 'down') as 'up' | 'down',
                  badgeClass: 'bg-brand-dark/5 text-brand-dark',
                  subtext: `${cards.paid_transactions_in_range} succeeded payments`,
              },
              {
                  label: 'Direct hotels',
                  value: String(cards.hotels_direct),
                  icon: Building2,
                  change: null,
                  trend: 'up' as const,
                  badgeClass: 'bg-brand-gray text-gray-700',
                  subtext: `${cards.hotels_published} live · ${cards.hotels_pending_review} in review · ${cards.memberships_active} staff seats`,
              },
          ]
        : [];

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'confirmed':
                return <CheckCircle className="w-4 h-4 text-green-600" />;
            case 'pending':
                return <Clock className="w-4 h-4 text-orange-600" />;
            case 'cancelled':
                return <XCircle className="w-4 h-4 text-red-600" />;
            default:
                return <AlertCircle className="w-4 h-4 text-gray-600" />;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'confirmed':
                return 'bg-green-50 text-green-700 border-green-200';
            case 'pending':
                return 'bg-orange-50 text-orange-700 border-orange-200';
            case 'cancelled':
                return 'bg-red-50 text-red-700 border-red-200';
            default:
                return 'bg-gray-50 text-gray-700 border-gray-200';
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-brand-dark">Dashboard Overview</h1>
                    <p className="text-gray-500 mt-1">
                        Live platform metrics from bookings, payments, and Direct hotels.
                    </p>
                </div>
                <select
                    value={timeRange}
                    onChange={(e) => setTimeRange(e.target.value as RangeKey)}
                    className="bg-white border border-gray-200 text-sm font-semibold text-gray-700 rounded-xl px-4 py-2.5 cursor-pointer hover:border-brand-primary transition-colors focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                >
                    <option value="7days">Last 7 Days</option>
                    <option value="30days">Last 30 Days</option>
                    <option value="90days">Last 90 Days</option>
                    <option value="year">This Year</option>
                </select>
            </div>

            <div className="rounded-2xl border border-sky-200 bg-sky-50/80 px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                    <h2 className="font-bold text-brand-dark">Hotels workspace</h2>
                    <p className="text-sm text-slate-600 mt-0.5">
                        Partner KYC, register Direct hotels, assign staff, and publish inventory  
                        one place for Super Admin.
                    </p>
                </div>
                <Button asChild className="shrink-0">
                    <Link href="/admin/partners">Open Hotels</Link>
                </Button>
            </div>

            <AdminRequests />
            <HotelPartnerRequests />

            {loading && !data ? (
                <AdminLoader label="Loading dashboard…" />
            ) : error && !data ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-800">
                    {error}
                    <Button
                        variant="outline"
                        size="sm"
                        className="ml-3"
                        onClick={() => void load(timeRange)}
                    >
                        Retry
                    </Button>
                </div>
            ) : (
                <>
                    {error ? (
                        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                            Refresh issue: {error}
                        </p>
                    ) : null}

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {stats.map((stat) => (
                            <div
                                key={stat.label}
                                className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <div
                                        className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.badgeClass}`}
                                    >
                                        <stat.icon className="w-6 h-6" />
                                    </div>
                                    {stat.change ? (
                                        <div
                                            className={`flex items-center gap-1 text-sm font-bold px-2.5 py-1 rounded-lg ${
                                                stat.trend === 'up'
                                                    ? 'bg-green-50 text-green-700'
                                                    : 'bg-red-50 text-red-700'
                                            }`}
                                        >
                                            {stat.trend === 'up' ? (
                                                <ArrowUpRight className="w-4 h-4" />
                                            ) : (
                                                <ArrowDownRight className="w-4 h-4" />
                                            )}
                                            {stat.change}
                                        </div>
                                    ) : null}
                                </div>
                                <h3 className="text-gray-500 text-sm font-medium">{stat.label}</h3>
                                <p className="text-3xl font-extrabold text-brand-dark mt-1">
                                    {stat.value}
                                </p>
                                <p className="text-xs text-gray-400 mt-2">{stat.subtext}</p>
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h2 className="text-lg font-extrabold text-brand-dark">
                                        Booking Trends
                                    </h2>
                                    <p className="text-sm text-gray-500 mt-1">
                                        Monthly volume & paid revenue
                                    </p>
                                </div>
                                <TrendingUp className="w-5 h-5 text-brand-primary" />
                            </div>

                            <div className="h-64 flex items-end justify-between gap-1 sm:gap-2">
                                {monthlyData.map((row) => {
                                    const hBook = (row.bookings / maxBookings) * 100;
                                    const hRev = (row.revenue / maxRevenue) * 100;
                                    const barH = Math.max(hBook, hRev * 0.85, row.bookings ? 8 : 4);
                                    return (
                                        <div
                                            key={row.ym}
                                            className="flex-1 flex flex-col items-center group"
                                        >
                                            <div className="w-full h-full flex flex-col justify-end relative">
                                                <div className="absolute -top-16 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs font-medium px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 shadow-lg">
                                                    <div className="font-bold">
                                                        {row.bookings} bookings
                                                    </div>
                                                    <div className="text-gray-300">
                                                        {formatMoney(row.revenue)}
                                                    </div>
                                                </div>
                                                <div
                                                    className="w-full bg-linear-to-t from-brand-primary to-brand-secondary rounded-t-lg transition-all duration-500 group-hover:from-brand-secondary group-hover:to-brand-primary"
                                                    style={{ height: `${barH}%` }}
                                                />
                                            </div>
                                            <div className="text-[10px] sm:text-xs text-gray-400 text-center mt-2 font-medium">
                                                {row.month}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100">
                            <h2 className="text-lg font-extrabold text-brand-dark mb-6">
                                Booking Breakdown
                            </h2>
                            {bookingStats.length === 0 ? (
                                <p className="text-sm text-gray-500">No bookings in this range.</p>
                            ) : (
                                <div className="space-y-4">
                                    {bookingStats.map((item, idx) => (
                                        <div key={item.type}>
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-sm font-medium text-gray-700">
                                                    {item.type}
                                                </span>
                                                <span className="text-sm font-bold text-gray-900">
                                                    {item.count}
                                                </span>
                                            </div>
                                            <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                                                <div
                                                    className={`${BREAKDOWN_COLORS[idx % BREAKDOWN_COLORS.length]} h-full rounded-full transition-all duration-500`}
                                                    style={{ width: `${item.percentage}%` }}
                                                />
                                            </div>
                                            <div className="text-xs text-gray-500 mt-1">
                                                {item.percentage}% of total
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h2 className="text-lg font-extrabold text-brand-dark">
                                        Financial Overview
                                    </h2>
                                    <p className="text-sm text-gray-500 mt-1">
                                        Payment status in selected range
                                    </p>
                                </div>
                                <DollarSign className="w-5 h-5 text-brand-primary" />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="p-2 bg-green-100 rounded-lg">
                                            <CheckCircle className="w-5 h-5 text-green-600" />
                                        </div>
                                        <span className="text-sm font-bold text-green-800">
                                            Successful
                                        </span>
                                    </div>
                                    <div className="text-2xl font-bold text-gray-900">
                                        {formatMoney(health?.succeededAmount || 0)}
                                    </div>
                                    <div className="text-xs text-green-600 font-medium mt-1">
                                        {health?.succeeded || 0} payments ·{' '}
                                        {health?.success_rate_pct ?? 0}% success rate
                                    </div>
                                </div>

                                <div className="bg-red-50 p-4 rounded-xl border border-red-100">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="p-2 bg-red-100 rounded-lg">
                                            <XCircle className="w-5 h-5 text-red-600" />
                                        </div>
                                        <span className="text-sm font-bold text-red-800">
                                            Failed
                                        </span>
                                    </div>
                                    <div className="text-2xl font-bold text-gray-900">
                                        {formatMoney(health?.failedAmount || 0)}
                                    </div>
                                    <div className="text-xs text-red-600 font-medium mt-1">
                                        {health?.failed || 0} failed attempts
                                    </div>
                                </div>

                                <div className="bg-orange-50 p-4 rounded-xl border border-orange-100">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="p-2 bg-orange-100 rounded-lg">
                                            <AlertCircle className="w-5 h-5 text-orange-600" />
                                        </div>
                                        <span className="text-sm font-bold text-orange-800">
                                            Pending
                                        </span>
                                    </div>
                                    <div className="text-2xl font-bold text-gray-900">
                                        {formatMoney(health?.pendingAmount || 0)}
                                    </div>
                                    <div className="text-xs text-orange-600 font-medium mt-1">
                                        {health?.pending || 0} open / in-flight
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6">
                                <h3 className="text-sm font-bold text-gray-700 mb-3">
                                    Recent Financial Activity
                                </h3>
                                {recentPayments.length === 0 ? (
                                    <p className="text-sm text-gray-500">No payments yet.</p>
                                ) : (
                                    <div className="space-y-3">
                                        {recentPayments.map((tx) => (
                                            <div
                                                key={tx.id}
                                                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div
                                                        className={`w-2 h-2 rounded-full ${
                                                            tx.status === 'succeeded'
                                                                ? 'bg-green-500'
                                                                : tx.status === 'failed'
                                                                  ? 'bg-red-500'
                                                                  : 'bg-orange-400'
                                                        }`}
                                                    />
                                                    <div>
                                                        <div className="text-sm font-bold text-gray-900">
                                                            {tx.channel || tx.provider || 'Payment'}
                                                            {tx.guest_name
                                                                ? ` · ${tx.guest_name}`
                                                                : ''}
                                                        </div>
                                                        <div className="text-xs text-gray-500">
                                                            {tx.payment_reference ||
                                                                tx.id.slice(0, 8)}{' '}
                                                            · {relativeTime(tx.created_at)}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-sm font-bold text-gray-900">
                                                    {formatMoney(tx.amount, tx.currency)}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100">
                            <h2 className="text-lg font-extrabold text-brand-dark mb-6">
                                Payment Methods
                            </h2>
                            {methods.length === 0 ? (
                                <p className="text-sm text-gray-500">
                                    No succeeded payments in this range.
                                </p>
                            ) : (
                                <div className="space-y-6">
                                    {methods.map((method, idx) => (
                                        <div key={`${method.name}-${idx}`}>
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-sm font-medium text-gray-700 capitalize">
                                                    {method.name}
                                                </span>
                                                <span className="text-sm font-bold text-gray-900">
                                                    {method.percent}% ({method.count})
                                                </span>
                                            </div>
                                            <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                                                <div
                                                    className={`${METHOD_COLORS[idx % METHOD_COLORS.length]} h-full rounded-full transition-all duration-500`}
                                                    style={{ width: `${method.percent}%` }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="mt-8 p-4 bg-brand-primary/10 rounded-xl border border-brand-primary/20">
                                <h4 className="text-sm font-extrabold text-brand-dark mb-1">
                                    Payment Health
                                </h4>
                                <p className="text-xs text-gray-600">
                                    Success rate{' '}
                                    <strong>{health?.success_rate_pct ?? 0}%</strong> in this
                                    range. Full ledger under Transactions.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-6 border-b border-gray-100">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-lg font-extrabold text-brand-dark">
                                        Recent Bookings
                                    </h2>
                                    <p className="text-sm text-gray-500 mt-1">
                                        Latest booking activity
                                    </p>
                                </div>
                                <Link href="/admin/transactions">
                                    <Button variant="outline" size="sm">
                                        View All
                                    </Button>
                                </Link>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-100">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                                            Booking
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                                            User
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                                            Type
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                                            Destination
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                                            Amount
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                                            Time
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {recentBookings.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={7}
                                                className="px-6 py-10 text-center text-sm text-gray-500"
                                            >
                                                No bookings yet.
                                            </td>
                                        </tr>
                                    ) : (
                                        recentBookings.map((booking) => (
                                            <tr
                                                key={booking.id}
                                                className="hover:bg-gray-50 transition-colors"
                                            >
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="text-sm font-mono font-medium text-brand-primary">
                                                        {booking.payment_reference ||
                                                            booking.id.slice(0, 8)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="text-sm font-medium text-gray-900">
                                                        {booking.user}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="text-sm text-gray-600">
                                                        {booking.type}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="text-sm text-gray-600">
                                                        {booking.destination}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="text-sm font-bold text-gray-900">
                                                        {formatMoney(
                                                            booking.amount,
                                                            booking.currency,
                                                        )}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span
                                                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(booking.status)}`}
                                                    >
                                                        {getStatusIcon(booking.status)}
                                                        {booking.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="text-sm text-gray-500">
                                                        {relativeTime(booking.created_at)}
                                                    </span>
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

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Link
                    href="/admin/partners?tab=hotels"
                    className="bg-linear-to-br from-brand-primary to-brand-secondary p-6 rounded-2xl text-white hover:shadow-lg transition-shadow group"
                >
                    <Hotel className="w-8 h-8 mb-3 group-hover:scale-110 transition-transform" />
                    <h3 className="font-bold text-lg">Hotels</h3>
                    <p className="text-white/80 text-sm mt-1">
                        Partners, inventory & publish
                    </p>
                </Link>
                <Link
                    href="/admin/flights"
                    className="bg-linear-to-br from-brand-secondary to-brand-primary p-6 rounded-2xl text-white hover:shadow-lg transition-shadow group"
                >
                    <Plane className="w-8 h-8 mb-3 group-hover:scale-110 transition-transform" />
                    <h3 className="font-bold text-lg">Manage Flights</h3>
                    <p className="text-white/80 text-sm mt-1">View and edit flight listings</p>
                </Link>
                <Link
                    href="/admin/transactions"
                    className="bg-linear-to-br from-brand-dark to-brand-primary p-6 rounded-2xl text-white hover:shadow-lg transition-shadow group"
                >
                    <CreditCard className="w-8 h-8 mb-3 group-hover:scale-110 transition-transform" />
                    <h3 className="font-bold text-lg">Transactions</h3>
                    <p className="text-white/80 text-sm mt-1">Payments ledger & export</p>
                </Link>
                <Link
                    href="/admin/support"
                    className="bg-linear-to-br from-gray-700 to-brand-dark p-6 rounded-2xl text-white hover:shadow-lg transition-shadow group"
                >
                    <Calendar className="w-8 h-8 mb-3 group-hover:scale-110 transition-transform" />
                    <h3 className="font-bold text-lg">Support & Disputes</h3>
                    <p className="text-white/80 text-sm mt-1">Tickets & review disputes</p>
                </Link>
            </div>
        </div>
    );
}
