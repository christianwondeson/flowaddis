'use client';

import React, { useEffect, useMemo, useState } from 'react';
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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/components/providers/auth-provider';
import { auth } from '@/lib/firebase';
import { EmptyValue } from '@/components/ui/admin-loader';
import {
    AdminDataTable,
    ADMIN_PAGE_SIZE,
    type AdminColumn,
} from '@/components/ui/admin-data-table';
import { withRequestLoading } from '@/lib/request-loading';

interface Transaction {
    id: string;
    amount: number;
    currency: string;
    status: 'succeeded' | 'failed' | 'pending';
    provider: string;
    transaction_id: string;
    created_at: string;
    channel?: string | null;
    payment_reference?: string | null;
    failure_reason?: string | null;
    confirmed_at?: string | null;
    cbe_transaction_id?: string | null;
    stripe_payment_intent_id?: string | null;
    audit?: {
        guest_name?: string | null;
        guest_email?: string | null;
        guest_phone?: string | null;
        firebase_uid?: string | null;
        payment_reference?: string | null;
    } | null;
    booking: {
        id: string;
        booking_type: string;
        payment_reference?: string | null;
        status?: string | null;
    } | null;
    firebase_uid?: string;
    user_name?: string;
    user_email?: string;
}

export default function TransactionsPage() {
    const { user } = useAuth();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [apiTotal, setApiTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<
        'all' | 'succeeded' | 'failed' | 'pending'
    >('all');
    const [page, setPage] = useState(1);

    useEffect(() => {
        const fetchTransactions = async () => {
            setLoading(true);
            try {
                await withRequestLoading(async () => {
                    const token = await auth?.currentUser?.getIdToken();
                    const all: Transaction[] = [];
                    let offset = 0;
                    const pageSize = 500;
                    let total = 0;

                    // Page through Nest until every payment row is loaded.
                    for (;;) {
                        const url = new URL(
                            '/api/admin/payments',
                            window.location.origin,
                        );
                        if (statusFilter !== 'all') {
                            url.searchParams.append('status', statusFilter);
                        }
                        url.searchParams.set('limit', String(pageSize));
                        url.searchParams.set('offset', String(offset));

                        const response = await fetch(url.toString(), {
                            headers: {
                                Authorization: `Bearer ${token}`,
                            },
                        });
                        if (!response.ok) break;
                        const data = await response.json();
                        const batch: Transaction[] = data.items || [];
                        total = Number(data.total ?? batch.length);
                        all.push(...batch);
                        offset += batch.length;
                        if (batch.length === 0 || all.length >= total) break;
                    }

                    setTransactions(all);
                    setApiTotal(total);
                    setPage(1);
                }, 'Loading transactions…');
            } catch (error) {
                console.error('Error fetching transactions:', error);
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            void fetchTransactions();
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

    const filteredTransactions = useMemo(() => {
        const q = searchTerm.toLowerCase().trim();
        if (!q) return transactions;
        return transactions.filter((tx) => {
            const hay = [
                tx.transaction_id,
                tx.payment_reference,
                tx.cbe_transaction_id,
                tx.stripe_payment_intent_id,
                tx.booking?.id,
                tx.booking?.payment_reference,
                tx.audit?.guest_name,
                tx.audit?.guest_email,
                tx.audit?.guest_phone,
                tx.user_name,
                tx.user_email,
                tx.firebase_uid,
                tx.provider,
                tx.channel,
            ]
                .filter(Boolean)
                .join(' ')
                .toLowerCase();
            return hay.includes(q);
        });
    }, [transactions, searchTerm]);

    useEffect(() => {
        setPage(1);
    }, [searchTerm]);

    const columns: AdminColumn<Transaction>[] = [
        {
            id: 'info',
            header: 'Transaction',
            cell: (tx) => (
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-brand-gray flex items-center justify-center text-brand-dark">
                        <CreditCard className="w-4 h-4" />
                    </div>
                    <div>
                        <div className="text-sm font-bold text-gray-900">
                            {tx.payment_reference || tx.transaction_id.substring(0, 18)}
                        </div>
                        <div className="text-[10px] text-gray-400 font-medium uppercase tracking-tight">
                            {tx.provider}
                            {tx.channel ? ` · ${tx.channel}` : ''}
                            {tx.booking?.id
                                ? ` · Booking ${tx.booking.id.slice(0, 8)}`
                                : ''}
                        </div>
                        <div className="text-[10px] text-gray-400 font-mono mt-0.5 break-all">
                            {tx.transaction_id}
                        </div>
                        {tx.failure_reason ? (
                            <div className="text-[10px] text-red-600 mt-0.5">{tx.failure_reason}</div>
                        ) : null}
                    </div>
                </div>
            ),
        },
        {
            id: 'customer',
            header: 'Customer',
            cell: (tx) => (
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary">
                        <UserIcon className="w-3 h-3" />
                    </div>
                    <div>
                        <div className="text-sm text-gray-700 font-medium">
                            {tx.audit?.guest_name || tx.user_name || (
                                <EmptyValue>Guest unknown</EmptyValue>
                            )}
                        </div>
                        <div className="text-[10px] text-gray-400">
                            {tx.audit?.guest_email ||
                                tx.user_email ||
                                (tx.firebase_uid
                                    ? `uid ${tx.firebase_uid.slice(0, 10)}`
                                    : 'No user id')}
                        </div>
                    </div>
                </div>
            ),
        },
        {
            id: 'service',
            header: 'Service',
            cell: (tx) => (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-600">
                    {tx.booking?.booking_type || ' '}
                </span>
            ),
        },
        {
            id: 'amount',
            header: 'Amount',
            cell: (tx) => (
                <div className="text-sm font-bold text-gray-900">
                    {tx.currency} {Number(tx.amount).toLocaleString()}
                </div>
            ),
        },
        {
            id: 'status',
            header: 'Status',
            cell: (tx) => getStatusBadge(tx.status),
        },
        {
            id: 'date',
            header: 'Date',
            cell: (tx) => (
                <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
                    <Calendar className="w-3 h-3" />
                    {new Date(tx.created_at).toLocaleDateString()}
                </div>
            ),
        },
    ];

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-brand-dark">Transactions</h1>
                    <p className="text-gray-500">
                        Full payment ledger from Nest  every captured charge, failure, and
                        pending attempt ({apiTotal || transactions.length} records loaded).
                    </p>
                </div>
                <Button
                    type="button"
                    className="bg-brand-dark hover:bg-black text-white gap-2 rounded-xl"
                    onClick={() => {
                        const header = [
                            'id',
                            'status',
                            'amount',
                            'currency',
                            'provider',
                            'channel',
                            'payment_reference',
                            'transaction_id',
                            'booking_id',
                            'guest_name',
                            'guest_email',
                            'created_at',
                            'confirmed_at',
                            'failure_reason',
                        ];
                        const lines = [
                            header.join(','),
                            ...filteredTransactions.map((tx) =>
                                [
                                    tx.id,
                                    tx.status,
                                    tx.amount,
                                    tx.currency,
                                    tx.provider,
                                    tx.channel || '',
                                    tx.payment_reference || '',
                                    tx.transaction_id,
                                    tx.booking?.id || '',
                                    tx.audit?.guest_name || tx.user_name || '',
                                    tx.audit?.guest_email || tx.user_email || '',
                                    tx.created_at,
                                    tx.confirmed_at || '',
                                    tx.failure_reason || '',
                                ]
                                    .map((v) =>
                                        `"${String(v ?? '').replace(/"/g, '""')}"`,
                                    )
                                    .join(','),
                            ),
                        ];
                        const blob = new Blob([lines.join('\n')], {
                            type: 'text/csv;charset=utf-8',
                        });
                        const a = document.createElement('a');
                        a.href = URL.createObjectURL(blob);
                        a.download = `bookaddis-transactions-${new Date()
                            .toISOString()
                            .slice(0, 10)}.csv`;
                        a.click();
                        URL.revokeObjectURL(a.href);
                    }}
                >
                    <Download className="w-4 h-4" />
                    Export CSV
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-500 uppercase tracking-wider">
                            Total Volume
                        </span>
                        <div className="w-8 h-8 rounded-lg bg-brand-primary/10 flex items-center justify-center text-brand-primary">
                            <ArrowUpRight className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="text-2xl font-extrabold text-brand-dark">
                        {transactions
                            .reduce(
                                (acc, curr) =>
                                    acc + (curr.status === 'succeeded' ? Number(curr.amount) : 0),
                                0,
                            )
                            .toLocaleString()}
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-500 uppercase tracking-wider">
                            Success Rate
                        </span>
                        <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center text-green-600">
                            <CheckCircle2 className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="text-2xl font-extrabold text-brand-dark">
                        {transactions.length > 0
                            ? (
                                  (transactions.filter((t) => t.status === 'succeeded').length /
                                      transactions.length) *
                                  100
                              ).toFixed(1)
                            : 0}
                        %
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-500 uppercase tracking-wider">
                            Failed Attempts
                        </span>
                        <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center text-red-600">
                            <XCircle className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="text-2xl font-extrabold text-brand-dark">
                        {transactions.filter((t) => t.status === 'failed').length}
                    </div>
                </div>
            </div>

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
                                {statusFilter === 'all'
                                    ? 'All Status'
                                    : statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-xl">
                            <DropdownMenuItem onClick={() => setStatusFilter('all')}>
                                All Status
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setStatusFilter('succeeded')}>
                                Succeeded
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setStatusFilter('failed')}>
                                Failed
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setStatusFilter('pending')}>
                                Pending
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            <AdminDataTable
                columns={columns}
                rows={filteredTransactions}
                rowKey={(tx) => tx.id}
                loading={loading}
                loadingLabel="Loading transactions…"
                emptyLabel="No transactions found matching your search."
                page={page}
                pageSize={ADMIN_PAGE_SIZE}
                total={filteredTransactions.length}
                onPageChange={setPage}
            />
        </div>
    );
}
