"use client";

import React, { useState } from 'react';
import {
    Users, CreditCard, Calendar, TrendingUp, Hotel, Plane,
    ArrowUpRight, ArrowDownRight, DollarSign, Activity,
    Clock, CheckCircle, XCircle, AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

import { AdminRequests } from '@/components/admin/admin-requests';

export default function AdminDashboard() {
    const [timeRange, setTimeRange] = useState('7days');

    // Enhanced Stats with trends
    const stats = [
        {
            label: 'Total Users',
            value: '1,234',
            icon: Users,
            change: '+12%',
            trend: 'up',
            color: 'blue',
            subtext: '+148 this month'
        },
        {
            label: 'Total Bookings',
            value: '856',
            icon: Calendar,
            change: '+25%',
            trend: 'up',
            color: 'green',
            subtext: '+214 this month'
        },
        {
            label: 'Total Revenue',
            value: 'ETB 4.2M',
            icon: DollarSign,
            change: '+8%',
            trend: 'up',
            color: 'purple',
            subtext: '+ETB 310K this month'
        },
        {
            label: 'Active Sessions',
            value: '342',
            icon: Activity,
            change: '-5%',
            trend: 'down',
            color: 'orange',
            subtext: 'Real-time'
        },
    ];

    // Booking breakdown
    const bookingStats = [
        { type: 'Hotels', count: 456, percentage: 53, color: 'bg-blue-500' },
        { type: 'Flights', count: 289, percentage: 34, color: 'bg-green-500' },
        { type: 'Conferences', count: 78, percentage: 9, color: 'bg-purple-500' },
        { type: 'Shuttles', count: 33, percentage: 4, color: 'bg-orange-500' },
    ];

    // Recent bookings
    const recentBookings = [
        { id: 'BK-1234', user: 'John Doe', type: 'Hotel', destination: 'Addis Ababa', amount: 'ETB 5,200', status: 'confirmed', date: '2 hours ago' },
        { id: 'BK-1235', user: 'Jane Smith', type: 'Flight', destination: 'Dubai', amount: 'ETB 12,500', status: 'pending', date: '4 hours ago' },
        { id: 'BK-1236', user: 'Mike Johnson', type: 'Conference', destination: 'Bahir Dar', amount: 'ETB 8,900', status: 'confirmed', date: '6 hours ago' },
        { id: 'BK-1237', user: 'Sarah Williams', type: 'Hotel', destination: 'Hawassa', amount: 'ETB 3,400', status: 'cancelled', date: '8 hours ago' },
        { id: 'BK-1238', user: 'David Brown', type: 'Flight', destination: 'Nairobi', amount: 'ETB 15,200', status: 'confirmed', date: '10 hours ago' },
    ];

    // Monthly data for chart
    const monthlyData = [
        { month: 'Jan', bookings: 420, revenue: 3.2 },
        { month: 'Feb', bookings: 650, revenue: 4.5 },
        { month: 'Mar', bookings: 450, revenue: 3.8 },
        { month: 'Apr', bookings: 800, revenue: 5.2 },
        { month: 'May', bookings: 550, revenue: 4.1 },
        { month: 'Jun', bookings: 900, revenue: 6.3 },
        { month: 'Jul', bookings: 700, revenue: 5.5 },
        { month: 'Aug', bookings: 850, revenue: 6.1 },
        { month: 'Sep', bookings: 600, revenue: 4.8 },
        { month: 'Oct', bookings: 750, revenue: 5.7 },
        { month: 'Nov', bookings: 500, revenue: 4.2 },
        { month: 'Dec', bookings: 950, revenue: 7.2 },
    ];

    const maxBookings = Math.max(...monthlyData.map(d => d.bookings));

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'confirmed': return <CheckCircle className="w-4 h-4 text-green-600" />;
            case 'pending': return <Clock className="w-4 h-4 text-orange-600" />;
            case 'cancelled': return <XCircle className="w-4 h-4 text-red-600" />;
            default: return <AlertCircle className="w-4 h-4 text-gray-600" />;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'confirmed': return 'bg-green-50 text-green-700 border-green-200';
            case 'pending': return 'bg-orange-50 text-orange-700 border-orange-200';
            case 'cancelled': return 'bg-red-50 text-red-700 border-red-200';
            default: return 'bg-gray-50 text-gray-700 border-gray-200';
        }
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Dashboard Overview</h1>
                    <p className="text-gray-500 mt-1">Welcome back! Here's what's happening today.</p>
                </div>
                <select
                    value={timeRange}
                    onChange={(e) => setTimeRange(e.target.value)}
                    className="bg-white border border-gray-200 text-sm font-medium text-gray-700 rounded-xl px-4 py-2.5 cursor-pointer hover:border-brand-primary transition-colors focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                >
                    <option value="7days">Last 7 Days</option>
                    <option value="30days">Last 30 Days</option>
                    <option value="90days">Last 90 Days</option>
                    <option value="year">This Year</option>
                </select>
            </div>

            {/* Admin Requests */}
            <AdminRequests />

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, idx) => (
                    <div key={idx} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-4">
                            <div className={`w-12 h-12 rounded-xl bg-${stat.color}-50 flex items-center justify-center`}>
                                <stat.icon className={`w-6 h-6 text-${stat.color}-600`} />
                            </div>
                            <div className={`flex items-center gap-1 text-sm font-bold px-2.5 py-1 rounded-lg ${stat.trend === 'up' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                                }`}>
                                {stat.trend === 'up' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                                {stat.change}
                            </div>
                        </div>
                        <h3 className="text-gray-500 text-sm font-medium">{stat.label}</h3>
                        <p className="text-3xl font-bold text-gray-900 mt-1">{stat.value}</p>
                        <p className="text-xs text-gray-400 mt-2">{stat.subtext}</p>
                    </div>
                ))}
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Bookings Chart */}
                <div className="lg:col-span-2 bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-lg font-bold text-gray-900">Booking Trends</h2>
                            <p className="text-sm text-gray-500 mt-1">Monthly booking volume</p>
                        </div>
                        <TrendingUp className="w-5 h-5 text-brand-primary" />
                    </div>

                    {/* Bar Chart */}
                    <div className="h-64 flex items-end justify-between gap-1 sm:gap-2">
                        {monthlyData.map((data, i) => (
                            <div key={i} className="flex-1 flex flex-col items-center group">
                                <div className="w-full h-full flex flex-col justify-end relative">
                                    {/* Tooltip */}
                                    <div className="absolute -top-16 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs font-medium px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 shadow-lg">
                                        <div className="font-bold">{data.bookings} bookings</div>
                                        <div className="text-gray-300">ETB {data.revenue}M</div>
                                    </div>
                                    {/* Bar */}
                                    <div
                                        className="w-full bg-gradient-to-t from-brand-primary to-brand-secondary rounded-t-lg transition-all duration-500 group-hover:from-brand-secondary group-hover:to-brand-primary"
                                        style={{ height: `${(data.bookings / maxBookings) * 100}%` }}
                                    />
                                </div>
                                {/* Month Label */}
                                <div className="text-[10px] sm:text-xs text-gray-400 text-center mt-2 font-medium">
                                    {data.month}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Booking Breakdown */}
                <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100">
                    <h2 className="text-lg font-bold text-gray-900 mb-6">Booking Breakdown</h2>
                    <div className="space-y-4">
                        {bookingStats.map((item, idx) => (
                            <div key={idx}>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium text-gray-700">{item.type}</span>
                                    <span className="text-sm font-bold text-gray-900">{item.count}</span>
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                                    <div
                                        className={`${item.color} h-full rounded-full transition-all duration-500`}
                                        style={{ width: `${item.percentage}%` }}
                                    />
                                </div>
                                <div className="text-xs text-gray-500 mt-1">{item.percentage}% of total</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Financial Overview Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Transaction Status */}
                <div className="lg:col-span-2 bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-lg font-bold text-gray-900">Financial Overview</h2>
                            <p className="text-sm text-gray-500 mt-1">Transaction status & health</p>
                        </div>
                        <DollarSign className="w-5 h-5 text-brand-primary" />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-green-100 rounded-lg">
                                    <CheckCircle className="w-5 h-5 text-green-600" />
                                </div>
                                <span className="text-sm font-bold text-green-800">Successful</span>
                            </div>
                            <div className="text-2xl font-bold text-gray-900">ETB 3.8M</div>
                            <div className="text-xs text-green-600 font-medium mt-1">92% of total volume</div>
                        </div>

                        <div className="bg-red-50 p-4 rounded-xl border border-red-100">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-red-100 rounded-lg">
                                    <XCircle className="w-5 h-5 text-red-600" />
                                </div>
                                <span className="text-sm font-bold text-red-800">Failed</span>
                            </div>
                            <div className="text-2xl font-bold text-gray-900">ETB 120K</div>
                            <div className="text-xs text-red-600 font-medium mt-1">3% failure rate</div>
                        </div>

                        <div className="bg-orange-50 p-4 rounded-xl border border-orange-100">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-orange-100 rounded-lg">
                                    <AlertCircle className="w-5 h-5 text-orange-600" />
                                </div>
                                <span className="text-sm font-bold text-orange-800">Disputes</span>
                            </div>
                            <div className="text-2xl font-bold text-gray-900">ETB 45K</div>
                            <div className="text-xs text-orange-600 font-medium mt-1">12 open cases</div>
                        </div>
                    </div>

                    {/* Recent Transactions List (Mini) */}
                    <div className="mt-6">
                        <h3 className="text-sm font-bold text-gray-700 mb-3">Recent Financial Activity</h3>
                        <div className="space-y-3">
                            {[
                                { id: 'TX-9821', method: 'Telebirr', amount: 'ETB 2,500', status: 'success', time: '10 mins ago' },
                                { id: 'TX-9822', method: 'Stripe (Visa)', amount: 'USD 150', status: 'success', time: '25 mins ago' },
                                { id: 'TX-9823', method: 'Revolut', amount: 'EUR 85', status: 'failed', time: '1 hour ago' },
                            ].map((tx, i) => (
                                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-2 h-2 rounded-full ${tx.status === 'success' ? 'bg-green-500' : 'bg-red-500'}`} />
                                        <div>
                                            <div className="text-sm font-bold text-gray-900">{tx.method}</div>
                                            <div className="text-xs text-gray-500">{tx.id} • {tx.time}</div>
                                        </div>
                                    </div>
                                    <div className="text-sm font-bold text-gray-900">{tx.amount}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Payment Methods */}
                <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100">
                    <h2 className="text-lg font-bold text-gray-900 mb-6">Payment Methods</h2>
                    <div className="space-y-6">
                        {[
                            { name: 'Telebirr', percent: 45, color: 'bg-green-500', icon: '📱' },
                            { name: 'Stripe (Cards)', percent: 30, color: 'bg-purple-500', icon: '💳' },
                            { name: 'Revolut', percent: 15, color: 'bg-blue-500', icon: 'R' },
                            { name: 'CBE Birr', percent: 10, color: 'bg-yellow-500', icon: '🏦' },
                        ].map((method, idx) => (
                            <div key={idx}>
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <span className="text-lg">{method.icon}</span>
                                        <span className="text-sm font-medium text-gray-700">{method.name}</span>
                                    </div>
                                    <span className="text-sm font-bold text-gray-900">{method.percent}%</span>
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                                    <div
                                        className={`${method.color} h-full rounded-full transition-all duration-500`}
                                        style={{ width: `${method.percent}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-8 p-4 bg-blue-50 rounded-xl border border-blue-100">
                        <h4 className="text-sm font-bold text-blue-800 mb-1">Payment Health</h4>
                        <p className="text-xs text-blue-600">All payment gateways are operational. Telebirr success rate is up 2% from last week.</p>
                    </div>
                </div>
            </div>

            {/* Recent Bookings Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-bold text-gray-900">Recent Bookings</h2>
                            <p className="text-sm text-gray-500 mt-1">Latest booking activity</p>
                        </div>
                        <Link href="/admin/hotels">
                            <Button variant="outline" size="sm">View All</Button>
                        </Link>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Booking ID</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">User</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Type</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Destination</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Amount</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Time</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {recentBookings.map((booking, idx) => (
                                <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="text-sm font-mono font-medium text-brand-primary">{booking.id}</span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="text-sm font-medium text-gray-900">{booking.user}</span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="text-sm text-gray-600">{booking.type}</span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="text-sm text-gray-600">{booking.destination}</span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="text-sm font-bold text-gray-900">{booking.amount}</span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(booking.status)}`}>
                                            {getStatusIcon(booking.status)}
                                            {booking.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="text-sm text-gray-500">{booking.date}</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Link href="/admin/hotels" className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-2xl text-white hover:shadow-lg transition-shadow group">
                    <Hotel className="w-8 h-8 mb-3 group-hover:scale-110 transition-transform" />
                    <h3 className="font-bold text-lg">Manage Hotels</h3>
                    <p className="text-blue-100 text-sm mt-1">View and edit hotel listings</p>
                </Link>
                <Link href="/admin/flights" className="bg-gradient-to-br from-green-500 to-green-600 p-6 rounded-2xl text-white hover:shadow-lg transition-shadow group">
                    <Plane className="w-8 h-8 mb-3 group-hover:scale-110 transition-transform" />
                    <h3 className="font-bold text-lg">Manage Flights</h3>
                    <p className="text-green-100 text-sm mt-1">View and edit flight listings</p>
                </Link>
                <Link href="/admin/conferences" className="bg-gradient-to-br from-purple-500 to-purple-600 p-6 rounded-2xl text-white hover:shadow-lg transition-shadow group">
                    <Calendar className="w-8 h-8 mb-3 group-hover:scale-110 transition-transform" />
                    <h3 className="font-bold text-lg">Conferences</h3>
                    <p className="text-purple-100 text-sm mt-1">Manage conference venues</p>
                </Link>
                <Link href="/admin/users" className="bg-gradient-to-br from-orange-500 to-orange-600 p-6 rounded-2xl text-white hover:shadow-lg transition-shadow group">
                    <Users className="w-8 h-8 mb-3 group-hover:scale-110 transition-transform" />
                    <h3 className="font-bold text-lg">User Management</h3>
                    <p className="text-orange-100 text-sm mt-1">View and manage users</p>
                </Link>
            </div>
        </div>
    );
}
