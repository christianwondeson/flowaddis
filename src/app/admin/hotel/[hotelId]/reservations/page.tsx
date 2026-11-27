'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { hotelAdminFetch } from '@/lib/hotel-admin-api';
import {
    AdminDataTable,
    ADMIN_PAGE_SIZE,
    type AdminColumn,
} from '@/components/ui/admin-data-table';
import { EmptyValue } from '@/components/ui/admin-loader';
import {
    HotelReservationDetailSheet,
    type HotelReservationDetail,
} from '@/components/admin/hotel-reservation-detail-sheet';
import {
    commissionCell,
    dateCell,
    occupancyLine,
    paymentTypeLabel,
    priceCell,
    reservationExpandPanel,
    reservationStatusBadge,
} from '@/components/admin/booking-com-reservation-cols';
import { AdminPeriodRangeFilter } from '@/components/admin/admin-period-range-filter';
import { presetToRange } from '@/lib/admin-period-utils';

type BookingRow = HotelReservationDetail;

export default function HotelReservationsPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const router = useRouter();
    const hotelId = String(params.hotelId || '');
    const defaultPeriod = useMemo(() => presetToRange('last_3_months'), []);
    const [items, setItems] = useState<BookingRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [selected, setSelected] = useState<BookingRow | null>(null);
    const [from, setFrom] = useState(defaultPeriod.from);
    const [to, setTo] = useState(defaultPeriod.to);

    const openDetail = useCallback(
        (row: BookingRow) => {
            setSelected(row);
            const qs = new URLSearchParams(searchParams.toString());
            qs.set('bookingId', row.id);
            router.replace(
                `/admin/hotel/${hotelId}/reservations?${qs.toString()}`,
                { scroll: false },
            );
        },
        [hotelId, router, searchParams],
    );

    const closeDetail = useCallback(() => {
        setSelected(null);
        const qs = new URLSearchParams(searchParams.toString());
        qs.delete('bookingId');
        const q = qs.toString();
        router.replace(
            `/admin/hotel/${hotelId}/reservations${q ? `?${q}` : ''}`,
            { scroll: false },
        );
    }, [hotelId, router, searchParams]);

    const load = useCallback(async () => {
        if (!hotelId) return;
        setLoading(true);
        setError(null);
        try {
            const data = await hotelAdminFetch<{ items: BookingRow[] }>(
                `hotels/${hotelId}/bookings?limit=200`,
                undefined,
                'Loading reservations…',
            );
            let rows = data.items || [];
            if (from) {
                const fromMs = new Date(`${from}T00:00:00`).getTime();
                rows = rows.filter((b) => {
                    const t = b.created_at
                        ? new Date(b.created_at).getTime()
                        : 0;
                    return t >= fromMs;
                });
            }
            if (to) {
                const toMs = new Date(`${to}T23:59:59`).getTime();
                rows = rows.filter((b) => {
                    const t = b.created_at
                        ? new Date(b.created_at).getTime()
                        : 0;
                    return t <= toMs;
                });
            }
            setItems(rows);
            setPage(1);
        } catch (e) {
            setError((e as Error).message);
        } finally {
            setLoading(false);
        }
    }, [hotelId, from, to]);

    useEffect(() => {
        void load();
    }, [load]);

    useEffect(() => {
        const bookingId = searchParams.get('bookingId');
        if (!bookingId || items.length === 0) return;
        const match = items.find((b) => b.id === bookingId);
        if (match) setSelected(match);
    }, [searchParams, items]);

    const columns: AdminColumn<BookingRow>[] = [
        {
            id: 'guest',
            header: 'Guest',
            alwaysVisible: true,
            cell: (b) => (
                <div>
                    <div className="font-semibold text-brand-dark">
                        {b.guest_name || 'Guest'}
                    </div>
                    <div className="text-xs text-slate-500">
                        {occupancyLine(b) || <EmptyValue />}
                    </div>
                </div>
            ),
        },
        {
            id: 'stay',
            header: 'Check-in',
            cell: (b) => dateCell(b.check_in),
        },
        {
            id: 'checkout',
            header: 'Check-out',
            cell: (b) => dateCell(b.check_out),
        },
        {
            id: 'room',
            header: 'Room type',
            defaultHidden: true,
            cell: (b) => (
                <span className="text-sm truncate max-w-[180px] block">
                    {b.room_name || <EmptyValue />}
                </span>
            ),
        },
        {
            id: 'booked',
            header: 'Booked on',
            cell: (b) => dateCell(b.created_at),
        },
        {
            id: 'payment',
            header: 'Payment',
            defaultHidden: true,
            cell: (b) => (
                <span className="text-xs font-semibold text-slate-700">
                    {paymentTypeLabel(b)}
                </span>
            ),
        },
        {
            id: 'status',
            header: 'Status',
            cell: (b) => reservationStatusBadge(b.reservation_status, b.failure_reason),
        },
        {
            id: 'amount',
            header: 'Price',
            align: 'right',
            cell: (b) => priceCell(b),
        },
        {
            id: 'commission',
            header: 'Commission',
            align: 'right',
            cell: (b) => commissionCell(b),
        },
        {
            id: 'ref',
            header: 'Reservation',
            alwaysVisible: true,
            cell: (b) => (
                <button
                    type="button"
                    className="text-xs font-mono text-teal-700 font-bold hover:underline"
                    onClick={(e) => {
                        e.stopPropagation();
                        openDetail(b);
                    }}
                >
                    {b.payment_reference || b.id.slice(0, 8)}
                </button>
            ),
        },
    ];

    const commissionTotal = items.reduce(
        (sum, b) => sum + Number(b.commission_amount ?? 0),
        0,
    );

    return (
        <div className="space-y-6 w-full">
            <div>
                <h1 className="text-2xl font-extrabold text-brand-dark">
                    Reservations
                </h1>
                <p className="text-sm text-slate-600 mt-1">
                    Use the chevron to expand a row, Columns to show/hide fields,
                    or Open detail to confirm stayed and link to billing.
                </p>
            </div>

            <AdminPeriodRangeFilter
                from={from}
                to={to}
                onChange={(nextFrom, nextTo) => {
                    setFrom(nextFrom);
                    setTo(nextTo);
                }}
                onApply={() => void load()}
                applyLabel="Apply dates"
            />

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
                columnPrefsKey={`hotel-reservations-${hotelId}`}
                minTableWidth={1100}
                renderExpanded={(row) =>
                    reservationExpandPanel(row, {
                        onOpenDetail: () => openDetail(row),
                        statementHref: `/admin/hotel/${hotelId}/statement`,
                        invoicesHref: `/admin/hotel/${hotelId}/billing`,
                    })
                }
            />

            {items.length > 0 ? (
                <div className="fixed bottom-4 right-6 z-30 flex items-center gap-2 rounded-xl border border-slate-200 bg-white/95 px-4 py-2.5 shadow-lg backdrop-blur-xs text-xs font-semibold text-slate-700">
                    <span className="text-slate-500">Total Expected:</span>
                    <strong className="text-sm font-extrabold text-teal-800">
                        Commission: {items[0]?.currency || 'ETB'}{' '}
                        {commissionTotal.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                        })}
                    </strong>
                </div>
            ) : null}

            <HotelReservationDetailSheet
                open={Boolean(selected)}
                onOpenChange={(open) => {
                    if (!open) closeDetail();
                }}
                hotelId={hotelId}
                booking={selected}
                onUpdated={(updated) => {
                    setItems((prev) =>
                        prev.map((b) =>
                            b.id === updated.id ? { ...b, ...updated } : b,
                        ),
                    );
                    setSelected((cur) =>
                        cur?.id === updated.id ? { ...cur, ...updated } : cur,
                    );
                }}
            />
        </div>
    );
}
