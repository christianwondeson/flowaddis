"use client";

import React, { useState, useEffect } from 'react';
import {
    Search,
    Filter,
    CreditCard,
    CheckCircle2,
    XCircle,
    Clock,
    Download,
    ArrowUpRight,
    User as UserIcon,
    Calendar,
    MoreHorizontal
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { useAuth } from '@/components/providers/auth-provider';
import { auth } from '@/lib/firebase';

interface Transaction {
    id: string;
    amount: number;
    currency: string;
    status: 'succeeded' | 'failed' | 'pending';
    provider: string;
    transaction_id: string;
    created_at: string;
    booking: {
        id: string;
        booking_type: string;
    };
    firebase_uid?: string;
    // We'll join user info if possible, or fetch separately
    user_name?: string;
    user_email?: string;
}

export default function TransactionsPage() {
    const { user } = useAuth();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'succeeded' | 'failed' | 'pending'>('all');

    useEffect(() => {
        const fetchTransactions = async () => {
            try {
                const token = await auth?.currentUser?.getIdToken();
                const url = new URL('/api/admin/payments', window.location.origin);
                if (statusFilter !== 'all') {
                    url.searchParams.append('status', statusFilter);
                }

                const response = await fetch(url.toString(), {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    setTransactions(data.items || []);
                }
            } catch (error) {
                console.error("Error fetching transactions:", error);
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            fetchTransactions();
        }
    }, [user, statusFilter]);

    const getStatusBadge = (status: Transaction['status']) => {
        switch (status) {
            case 'succeeded':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-green-50 text-green-700 border border-green-100">
                        <CheckCircle2 className="w-3 h-3" />
                        Success
                    </span>
                );
            case 'failed':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-100">
                        <XCircle className="w-3 h-3" />
                        Failed
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-orange-50 text-orange-700 border border-orange-100">
                        <Clock className="w-3 h-3" />
                        Pending
                    </span>
                );
        }
    };

    const filteredTransactions = transactions.filter(tx =>
        tx.transaction_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.booking.id.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Transactions</h1>
                    <p className="text-gray-500">Monitor all payments and track potential fraud activity.</p>
                </div>
                <Button className="bg-brand-dark hover:bg-black text-white gap-2 rounded-xl">
                    <Download className="w-4 h-4" />
                    Export CSV
                </Button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-500 uppercase tracking-wider">Total Volume</span>
                        <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center text-teal-600">
                            <ArrowUpRight className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="text-2xl font-bold text-gray-900">
                        ${transactions.reduce((acc, curr) => acc + (curr.status === 'succeeded' ? Number(curr.amount) : 0), 0).toLocaleString()}
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-500 uppercase tracking-wider">Success Rate</span>
                        <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center text-green-600">
                            <CheckCircle2 className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="text-2xl font-bold text-gray-900">
                        {transactions.length > 0 ? (transactions.filter(t => t.status === 'succeeded').length / transactions.length * 100).toFixed(1) : 0}%
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-500 uppercase tracking-wider">Failed Attempts</span>
                        <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center text-red-600">
                            <XCircle className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="text-2xl font-bold text-gray-900">
                        {transactions.filter(t => t.status === 'failed').length}
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                        placeholder="Search by Transaction ID or Booking ID..."
                        className="pl-10 rounded-xl bg-white border-gray-100"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex gap-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="rounded-xl border-gray-100 gap-2">
                                <Filter className="w-4 h-4" />
                                {statusFilter === 'all' ? 'All Status' : statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-xl">
                            <DropdownMenuItem onClick={() => setStatusFilter('all')}>All Status</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setStatusFilter('succeeded')}>Succeeded</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setStatusFilter('failed')}>Failed</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setStatusFilter('pending')}>Pending</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Transactions Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Transaction Info</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Customer</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Service</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Amount</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={7} className="px-6 py-4 border-b border-gray-50">
                                            <div className="h-10 bg-gray-50 rounded-lg w-full"></div>
                                        </td>
                                    </tr>
                                ))
                            ) : filteredTransactions.length > 0 ? (
                                filteredTransactions.map((tx) => (
                                    <tr key={tx.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-brand-gray flex items-center justify-center text-brand-dark">
                                                    <CreditCard className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <div className="text-sm font-bold text-gray-900 border-b border-dashed border-gray-100 pb-0.5 mb-0.5">
                                                        {tx.transaction_id.substring(0, 16)}...
                                                    </div>
                                                    <div className="text-[10px] text-gray-400 font-medium uppercase tracking-tight">Booking: {tx.booking.id}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-teal-100 flex items-center justify-center text-teal-600">
                                                    <UserIcon className="w-3 h-3" />
                                                </div>
                                                <div className="text-sm text-gray-600 font-medium">#{tx.firebase_uid?.substring(0, 8) || 'Unknown'}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-600">
                                                {tx.booking.booking_type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-bold text-gray-900">{tx.currency} {Number(tx.amount).toLocaleString()}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {getStatusBadge(tx.status)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
                                                <Calendar className="w-3 h-3" />
                                                {new Date(tx.created_at).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors">
                                                <MoreHorizontal className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-gray-400 font-medium">
                                        No transactions found matching your search.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
