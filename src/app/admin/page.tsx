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
    BarChart3,
    Car,
    Copy,
    Check,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { AdminLoader } from '@/components/ui/admin-loader';
import { auth } from '@/lib/firebase';
import { AdminRequests } from '@/components/admin/admin-requests';
import { HotelPartnerRequests } from '@/components/admin/hotel-partner-requests';
import { adminInventoryFetch } from '@/lib/admin-inventory-api';

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
    const [graphMetric, setGraphMetric] = useState<'both' | 'bookings' | 'revenue'>('both');
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [data, setData] = useState<DashboardData | null>(null);
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
        void adminInventoryFetch<{
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
    const maxBookings = Math.max(1, ...monthlyData.map((d) => d.bookings));
    const maxRevenue = Math.max(1, ...monthlyData.map((d) => d.revenue));
    const totalGraphBookings = monthlyData.reduce((acc, d) => acc + (d.bookings || 0), 0);
    const totalGraphRevenue = monthlyData.reduce((acc, d) => acc + (d.revenue || 0), 0);
    const avgGraphTicket = totalGraphBookings > 0 ? Math.round(totalGraphRevenue / totalGraphBookings) : 0;
    const peakMonth = monthlyData.reduce(
        (max, d) => ((d.bookings || 0) > (max?.bookings || 0) ? d : max),
        monthlyData[0],
    );

    const bookingStats = (data?.booking_breakdown && data.booking_breakdown.length > 0)
        ? data.booking_breakdown
        : [
            { type: 'Hotels', count: 0, percentage: 0 },
            { type: 'Flights', count: 0, percentage: 0 },
            { type: 'Conferences', count: 0, percentage: 0 },
            { type: 'Shuttles', count: 0, percentage: 0 },
          ];
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

            {commissionAlert ? (
                <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-amber-700" />
                    <div className="flex-1">
                        <p className="font-semibold">
                            Unpaid commission invoices across{' '}
                            {commissionAlert.hotels_with_unpaid} hotel
                            {commissionAlert.hotels_with_unpaid === 1 ? '' : 's'}
                        </p>
                        <p className="text-amber-900/90 mt-0.5">
                            {commissionAlert.currency}{' '}
                            {Number(commissionAlert.outstanding_total).toLocaleString()}{' '}
                            · {commissionAlert.unpaid_invoice_count} invoice
                            {commissionAlert.unpaid_invoice_count === 1 ? '' : 's'}
                        </p>
                    </div>
                    <Link
                        href="/admin/finance"
                        className="font-semibold text-teal-800 hover:underline shrink-0"
                    >
                        Open Finance →
                    </Link>
                </div>
            ) : null}

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
                        <div className="lg:col-span-2 bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
                            <div>
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h2 className="text-lg font-extrabold text-brand-dark">
                                                Booking & Revenue Analytics
                                            </h2>
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-brand-primary/10 text-brand-primary">
                                                <BarChart3 className="w-3.5 h-3.5" />
                                                Live Ledger
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-500 mt-0.5">
                                            Monthly booking counts & confirmed revenue volume
                                        </p>
                                    </div>

                                    {/* Metric switcher tabs */}
                                    <div className="flex items-center bg-gray-100/90 p-1 rounded-xl text-xs font-semibold self-start sm:self-auto">
                                        <button
                                            type="button"
                                            onClick={() => setGraphMetric('both')}
                                            className={`px-3 py-1.5 rounded-lg transition-all ${
                                                graphMetric === 'both'
                                                    ? 'bg-white text-brand-dark shadow-xs font-bold'
                                                    : 'text-gray-600 hover:text-gray-900'
                                            }`}
                                        >
                                            Dual View
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setGraphMetric('bookings')}
                                            className={`px-3 py-1.5 rounded-lg transition-all ${
                                                graphMetric === 'bookings'
                                                    ? 'bg-white text-teal-800 shadow-xs font-bold'
                                                    : 'text-gray-600 hover:text-gray-900'
                                            }`}
                                        >
                                            Bookings
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setGraphMetric('revenue')}
                                            className={`px-3 py-1.5 rounded-lg transition-all ${
                                                graphMetric === 'revenue'
                                                    ? 'bg-white text-emerald-800 shadow-xs font-bold'
                                                    : 'text-gray-600 hover:text-gray-900'
                                            }`}
                                        >
                                            Revenue
                                        </button>
                                    </div>
                                </div>

                                {/* KPI summary ribbon */}
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6 p-3 bg-gray-50/80 rounded-xl border border-gray-100 text-xs">
                                    <div>
                                        <span className="text-gray-400 block font-medium">Total Bookings</span>
                                        <span className="font-bold text-sm text-teal-900">{totalGraphBookings} completed</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-400 block font-medium">Paid Volume</span>
                                        <span className="font-bold text-sm text-emerald-900">{formatMoney(totalGraphRevenue, cards?.currency || 'ETB')}</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-400 block font-medium">Avg Order Value</span>
                                        <span className="font-bold text-sm text-gray-800">{formatMoney(avgGraphTicket, cards?.currency || 'ETB')}</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-400 block font-medium">Peak Month</span>
                                        <span className="font-bold text-sm text-purple-900">
                                            {peakMonth?.month || '—'} ({peakMonth?.bookings || 0} bkgs)
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Chart Canvas with Y-axis guidelines */}
                            <div className="relative h-64 pt-6 pb-2">
                                {/* Horizontal gridlines */}
                                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none text-[10px] text-gray-300">
                                    <div className="border-b border-dashed border-gray-100 w-full flex justify-between pr-2">
                                        <span>{graphMetric === 'bookings' ? `${maxBookings} bkgs` : graphMetric === 'revenue' ? formatCompact(maxRevenue) : '100%'}</span>
                                    </div>
                                    <div className="border-b border-dashed border-gray-100 w-full flex justify-between pr-2">
                                        <span>{graphMetric === 'bookings' ? `${Math.round(maxBookings * 0.75)} bkgs` : graphMetric === 'revenue' ? formatCompact(maxRevenue * 0.75) : '75%'}</span>
                                    </div>
                                    <div className="border-b border-dashed border-gray-100 w-full flex justify-between pr-2">
                                        <span>{graphMetric === 'bookings' ? `${Math.round(maxBookings * 0.5)} bkgs` : graphMetric === 'revenue' ? formatCompact(maxRevenue * 0.5) : '50%'}</span>
                                    </div>
                                    <div className="border-b border-dashed border-gray-100 w-full flex justify-between pr-2">
                                        <span>{graphMetric === 'bookings' ? `${Math.round(maxBookings * 0.25)} bkgs` : graphMetric === 'revenue' ? formatCompact(maxRevenue * 0.25) : '25%'}</span>
                                    </div>
                                    <div className="border-b border-gray-200 w-full flex justify-between pr-2">
                                        <span>0</span>
                                    </div>
                                </div>

                                {/* Bars container */}
                                <div className="h-full flex items-end justify-between gap-2 sm:gap-4 relative z-10 pl-6">
                                    {monthlyData.map((row) => {
                                        const hBook = maxBookings > 0 ? (row.bookings / maxBookings) * 100 : 0;
                                        const hRev = maxRevenue > 0 ? (row.revenue / maxRevenue) * 100 : 0;
                                        const bookBarH = row.bookings > 0 ? Math.max(hBook, 12) : 4;
                                        const revBarH = row.revenue > 0 ? Math.max(hRev, 12) : 4;

                                        return (
                                            <div
                                                key={row.ym}
                                                className="flex-1 flex flex-col items-center h-full justify-end group relative"
                                            >
                                                {/* Floating Tooltip */}
                                                <div className="absolute -top-18 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs font-medium px-3 py-2 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-30 shadow-xl pointer-events-none">
                                                    <div className="font-bold text-gray-200 mb-0.5">
                                                        {row.month} ({row.ym})
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-teal-300">
                                                        <span className="w-2 h-2 rounded-full bg-teal-400 inline-block" />
                                                        <strong>{row.bookings}</strong> bookings
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-emerald-300">
                                                        <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                                                        <strong>{formatMoney(row.revenue, cards?.currency || 'ETB')}</strong> paid
                                                    </div>
                                                    {row.bookings > 0 ? (
                                                        <div className="text-[10px] text-gray-400 mt-1 border-t border-gray-700 pt-0.5">
                                                            Avg: {formatMoney(Math.round(row.revenue / row.bookings), cards?.currency || 'ETB')}
                                                        </div>
                                                    ) : null}
                                                </div>

                                                {/* Bars depending on graphMetric */}
                                                <div className="w-full flex items-end justify-center gap-1.5 h-full relative">
                                                    {(graphMetric === 'both' || graphMetric === 'bookings') ? (
                                                        <div className="flex-1 max-w-[28px] flex flex-col items-center justify-end h-full">
                                                            {/* Exact Booking Number above bar */}
                                                            <span className={`text-[10px] font-bold mb-1 transition-opacity ${
                                                                row.bookings > 0 ? 'text-teal-800' : 'text-gray-300 opacity-60'
                                                            }`}>
                                                                {row.bookings}
                                                            </span>
                                                            <div
                                                                className={`w-full rounded-t-md transition-all duration-500 shadow-xs ${
                                                                    row.bookings > 0
                                                                        ? 'bg-gradient-to-t from-teal-600 to-teal-400 group-hover:from-teal-500 group-hover:to-teal-300'
                                                                        : 'bg-gray-100 group-hover:bg-gray-200'
                                                                }`}
                                                                style={{ height: `${bookBarH}%` }}
                                                            />
                                                        </div>
                                                    ) : null}

                                                    {(graphMetric === 'both' || graphMetric === 'revenue') ? (
                                                        <div className="flex-1 max-w-[28px] flex flex-col items-center justify-end h-full">
                                                            {/* Revenue compact label above bar in single-view */}
                                                            {graphMetric === 'revenue' ? (
                                                                <span className={`text-[10px] font-bold mb-1 transition-opacity ${
                                                                    row.revenue > 0 ? 'text-emerald-800' : 'text-gray-300 opacity-60'
                                                                }`}>
                                                                    {row.revenue > 0 ? formatCompact(row.revenue) : '0'}
                                                                </span>
                                                            ) : null}
                                                            <div
                                                                className={`w-full rounded-t-md transition-all duration-500 shadow-xs ${
                                                                    row.revenue > 0
                                                                        ? 'bg-gradient-to-t from-emerald-600 to-emerald-400 group-hover:from-emerald-500 group-hover:to-emerald-300'
                                                                        : 'bg-gray-100 group-hover:bg-gray-200'
                                                                }`}
                                                                style={{ height: `${revBarH}%` }}
                                                            />
                                                        </div>
                                                    ) : null}
                                                </div>

                                                {/* X-axis Month Label */}
                                                <div className="text-[11px] text-gray-500 text-center mt-2.5 font-bold group-hover:text-brand-dark transition-colors">
                                                    {row.month}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Legend */}
                            <div className="flex items-center justify-between border-t border-gray-100 pt-4 mt-2 text-xs">
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-1.5">
                                        <span className="w-3 h-3 rounded-sm bg-gradient-to-r from-teal-600 to-teal-400" />
                                        <span className="font-semibold text-gray-700">Bookings (Number of reservations)</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <span className="w-3 h-3 rounded-sm bg-gradient-to-r from-emerald-600 to-emerald-400" />
                                        <span className="font-semibold text-gray-700">Paid Revenue ({cards?.currency || 'ETB'})</span>
                                    </div>
                                </div>
                                <span className="text-gray-400 text-[11px] font-medium hidden sm:inline">
                                    {monthlyData.length} months rolling window
                                </span>
                            </div>
                        </div>

                        {/* Booking Breakdown */}
                        <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-lg font-extrabold text-brand-dark">
                                        Booking Breakdown
                                    </h2>
                                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                                        By Service
                                    </span>
                                </div>
                                <p className="text-sm text-gray-500 mb-6">
                                    Distribution of completed reservations by hospitality & travel category
                                </p>

                                {bookingStats.length === 0 ? (
                                    <div className="py-12 text-center text-sm text-gray-400">
                                        No bookings recorded in this time range.
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {bookingStats.map((item, idx) => {
                                            const getCategoryIcon = (type: string) => {
                                                const t = type.toLowerCase();
                                                if (t.includes('hotel')) return <Building2 className="w-4 h-4 text-teal-600" />;
                                                if (t.includes('flight')) return <Plane className="w-4 h-4 text-sky-600" />;
                                                if (t.includes('conference') || t.includes('event')) return <Users className="w-4 h-4 text-purple-600" />;
                                                if (t.includes('shuttle') || t.includes('car')) return <Car className="w-4 h-4 text-amber-600" />;
                                                return <BarChart3 className="w-4 h-4 text-gray-600" />;
                                            };

                                            return (
                                                <div key={item.type} className="p-3 bg-gray-50/70 rounded-xl border border-gray-100">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <div className="flex items-center gap-2">
                                                            {getCategoryIcon(item.type)}
                                                            <span className="text-sm font-bold text-gray-800">
                                                                {item.type}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-white border border-gray-200 text-gray-900 shadow-2xs">
                                                                {item.count} {item.count === 1 ? 'booking' : 'bookings'}
                                                            </span>
                                                            <span className="text-xs font-extrabold text-teal-700 min-w-9 text-right">
                                                                {item.percentage}%
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="w-full bg-gray-200/80 rounded-full h-2 overflow-hidden">
                                                        <div
                                                            className={`${BREAKDOWN_COLORS[idx % BREAKDOWN_COLORS.length]} h-full rounded-full transition-all duration-500`}
                                                            style={{ width: `${Math.max(item.percentage, item.count > 0 ? 4 : 0)}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                                <span>Platform wide totals</span>
                                <span className="font-bold text-gray-700">
                                    {bookingStats.reduce((sum, b) => sum + (b.count || 0), 0)} total reservations
                                </span>
                            </div>
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
                                                className="hover:bg-gray-50/80 transition-colors"
                                            >
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="text-sm font-mono font-bold text-teal-900">
                                                            {booking.payment_reference ||
                                                                booking.id.slice(0, 8)}
                                                        </span>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleCopy(booking.id, booking.payment_reference || booking.id)}
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
                                                            {(booking.user || 'G').charAt(0).toUpperCase()}
                                                        </div>
                                                        <span className="text-sm font-semibold text-gray-900">
                                                            {booking.user}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-gray-100 text-gray-700">
                                                        {booking.type}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="text-sm font-medium text-gray-700">
                                                        {booking.destination || 'Addis Ababa Stay'}
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
                                                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${getStatusColor(booking.status)}`}
                                                    >
                                                        {getStatusIcon(booking.status)}
                                                        {booking.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="text-xs text-gray-500 font-medium">
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
