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
import { formatAdminDate } from '@/lib/admin-date-format';
import {
    HotelReservationDetailSheet,
    type HotelReservationDetail,
} from '@/components/admin/hotel-reservation-detail-sheet';
import { normalizeMealPlan } from '@/lib/hotel-industry-codes';

type BookingRow = HotelReservationDetail;

export default function HotelReservationsPage() {
    const params = useParams();
    const hotelId = String(params.hotelId || '');
    const [items, setItems] = useState<BookingRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [selected, setSelected] = useState<BookingRow | null>(null);

    useEffect(() => {
        if (!hotelId) return;
        let cancelled = false;
        (async () => {
            setLoading(true);
            setError(null);
            try {
                const data = await hotelAdminFetch<{ items: BookingRow[] }>(
                    `hotels/${hotelId}/bookings?limit=200`,
                    undefined,
                    'Loading reservations…',
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

    const columns: AdminColumn<BookingRow>[] = [
        {
            id: 'guest',
            header: 'Guest',
            cell: (b) => (
                <div>
                    <div className="font-semibold text-brand-dark">
                        {b.guest_name || 'Guest'}
                    </div>
                    <div className="text-xs text-slate-500">
                        {b.guest_email || <EmptyValue />}
                    </div>
                </div>
            ),
        },
        {
            id: 'stay',
            header: 'Stay',
            cell: (b) =>
                b.check_in && b.check_out ? (
                    <span className="whitespace-nowrap text-sm">
                        {formatAdminDate(b.check_in)} → {formatAdminDate(b.check_out)}
                    </span>
                ) : (
                    <EmptyValue />
                ),
        },
        {
            id: 'codes',
            header: 'Type / plan',
            cell: (b) => {
                const kind = String(
                    b.booking_type || b.product_kind || 'hotel',
                ).toLowerCase();
                if (kind === 'shuttle' || kind === 'conference' || kind === 'car' || kind === 'event') {
                    return (
                        <div className="text-xs space-y-0.5">
                            <span className="inline-flex rounded-md bg-sky-50 px-1.5 py-0.5 font-bold text-sky-800 capitalize">
                                {kind === 'car' ? 'shuttle' : kind === 'event' ? 'conference' : kind}
                            </span>
                            <div className="text-slate-500 truncate max-w-[140px]">
                                {b.room_name || ' '}
                            </div>
                        </div>
                    );
                }
                return (
                    <div className="text-xs space-y-0.5">
                        <span className="inline-flex rounded-md bg-slate-100 px-1.5 py-0.5 font-bold text-slate-700">
                            {normalizeMealPlan(b.meal_plan)}
                        </span>
                        <div className="text-slate-500">
                            {b.rate_segment || 'RACK'} · {b.flexibility || 'FLEX'}
                        </div>
                    </div>
                );
            },
        },
        {
            id: 'status',
            header: 'Status',
            cell: (b) => (
                <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-700">
                    {b.status}
                </span>
            ),
        },
        {
            id: 'amount',
            header: 'Amount',
            align: 'right',
            cell: (b) => (
                <span className="font-semibold text-brand-dark">
                    {b.currency} {Number(b.amount).toLocaleString()}
                </span>
            ),
        },
        {
            id: 'ref',
            header: 'Ref',
            cell: (b) => (
                <span className="text-xs font-mono text-slate-500">
                    {b.payment_reference || b.id.slice(0, 8)}
                </span>
            ),
        },
    ];

    return (
        <div className="space-y-6 max-w-6xl">
            <div>
                <h1 className="text-2xl font-extrabold text-brand-dark">
                    Reservations
                </h1>
                <p className="text-sm text-slate-600 mt-1">
                    Click a row for meal plan, stay codes, rate segment, and
                    flexibility details.
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
                rowKey={(b) => b.id}
                loading={loading}
                loadingLabel="Loading reservations…"
                emptyLabel="No reservations for this property yet."
                page={page}
                pageSize={ADMIN_PAGE_SIZE}
                total={items.length}
                onPageChange={setPage}
                onRowClick={(row) => setSelected(row)}
            />

            <HotelReservationDetailSheet
                open={Boolean(selected)}
                onOpenChange={(open) => {
                    if (!open) setSelected(null);
                }}
                booking={selected}
            />
        </div>
    );
}
