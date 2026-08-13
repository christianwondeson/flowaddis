'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { hotelAdminFetch } from '@/lib/hotel-admin-api';
import {
    AdminDataTable,
    ADMIN_PAGE_SIZE,
    type AdminColumn,
} from '@/components/ui/admin-data-table';
import { EmptyValue } from '@/components/ui/admin-loader';
import { formatAdminDateTime } from '@/lib/admin-date-format';

type Tx = {
    id: string;
    amount: number;
    currency: string;
    status: string;
    provider: string;
    channel?: string | null;
    transaction_id: string;
    payment_reference?: string | null;
    bank_transaction_id?: string | null;
    cbe_transaction_id?: string | null;
    stripe_payment_intent_id?: string | null;
    confirmed_at?: string | null;
    created_at: string;
    booking_id?: string;
    booking_status?: string;
    guest_name?: string | null;
    guest_email?: string | null;
    failure_reason?: string | null;
};

export default function HotelTransactionsPage() {
    const params = useParams();
    const hotelId = String(params.hotelId || '');
    const [items, setItems] = useState<Tx[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);

    useEffect(() => {
        if (!hotelId) return;
        let cancelled = false;
        (async () => {
            setLoading(true);
            setError(null);
            try {
                const data = await hotelAdminFetch<{ items: Tx[] }>(
                    `hotels/${hotelId}/transactions?limit=200`,
                );
                if (!cancelled) {
                    setItems(data.items || []);
                    setPage(1);
                }
            } catch (e) {
                if (!cancelled) setError((e as Error).message);
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [hotelId]);

    const columns: AdminColumn<Tx>[] = [
        {
            id: 'when',
            header: 'When',
            cell: (tx) => (
                <span className="whitespace-nowrap text-sm">
                    {formatAdminDateTime(tx.confirmed_at || tx.created_at)}
                </span>
            ),
        },
        {
            id: 'guest',
            header: 'Guest',
            cell: (tx) => (
                <div>
                    <div className="font-semibold text-brand-dark text-sm">
                        {tx.guest_name || 'Guest'}
                    </div>
                    <div className="text-[11px] text-slate-500">
                        {tx.guest_email || <EmptyValue />}
                    </div>
                </div>
            ),
        },
        {
            id: 'rail',
            header: 'Rail',
            cell: (tx) => (
                <div>
                    <div className="font-medium text-brand-dark text-sm">{tx.provider}</div>
                    <div className="text-[11px] text-slate-500 uppercase tracking-wide">
                        {tx.channel || ' '}
                    </div>
                </div>
            ),
        },
        {
            id: 'status',
            header: 'Status',
            cell: (tx) => (
                <div>
                    <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-700">
                        {tx.status}
                    </span>
                    {tx.booking_status ? (
                        <div className="text-[11px] text-slate-500 mt-1">
                            Booking {tx.booking_status}
                        </div>
                    ) : null}
                </div>
            ),
        },
        {
            id: 'amount',
            header: 'Amount',
            align: 'right',
            cell: (tx) => (
                <span className="font-semibold text-brand-dark whitespace-nowrap">
                    {tx.currency} {Number(tx.amount).toLocaleString()}
                </span>
            ),
        },
        {
            id: 'paynar',
            header: 'BookAddis ref',
            cell: (tx) => (
                <span className="text-xs font-mono text-slate-700" title="PayNar">
                    {tx.payment_reference || <EmptyValue />}
                </span>
            ),
        },
        {
            id: 'bank',
            header: 'Bank / gateway id',
            cell: (tx) => (
                <span
                    className="text-xs font-mono text-slate-500 break-all"
                    title="MPGS receipt / CBE id / Stripe PI"
                >
                    {tx.bank_transaction_id ||
                        tx.cbe_transaction_id ||
                        tx.stripe_payment_intent_id ||
                        tx.transaction_id || <EmptyValue />}
                </span>
            ),
        },
    ];

    return (
        <div className="space-y-6 max-w-7xl">
            <div>
                <h1 className="text-2xl font-extrabold text-brand-dark">Transactions</h1>
                <p className="text-sm text-slate-600 mt-1">
                    Traceable payment ledger: BookAddis PayNar plus bank/gateway transaction id
                    for each settled reservation.
                </p>
            </div>

            {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                    {error}
                </div>
            )}

            <AdminDataTable
                columns={columns}
                rows={items}
                rowKey={(tx) => tx.id}
                loading={loading}
                loadingLabel="Loading transactions…"
                emptyLabel="No payments recorded for this property yet."
                page={page}
                pageSize={ADMIN_PAGE_SIZE}
                total={items.length}
                onPageChange={setPage}
            />
        </div>
    );
}
