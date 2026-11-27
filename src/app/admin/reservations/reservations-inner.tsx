'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { adminInventoryFetch } from '@/lib/admin-inventory-api';
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
    type CommissionReservationRow,
} from '@/components/admin/booking-com-reservation-cols';
import { AdminPeriodRangeFilter } from '@/components/admin/admin-period-range-filter';
import { presetToRange } from '@/lib/admin-period-utils';

type PortfolioResponse = {
    items: CommissionReservationRow[];
    total: number;
    commission_total: number;
    currency: string;
};

function toDetail(row: CommissionReservationRow): HotelReservationDetail {
    return {
        id: row.id,
        status: row.status || 'confirmed',
        reservation_status: row.reservation_status,
        settlement_model: row.settlement_model as
            | 'pay_at_property'
            | 'prepaid'
            | null
            | undefined,
        payment_timing: row.payment_timing,
        amount: row.amount,
        confirmed_gross_amount: row.confirmed_gross_amount,
        commission_amount: row.commission_amount,
        commission_percent: row.commission_percent,
        commission_estimated: row.commission_estimated,
        currency: row.currency,
        payment_reference: row.payment_reference,
        check_in: row.check_in,
        check_out: row.check_out,
        guest_name: row.guest_name,
        room_name: row.room_name,
        adults: row.adults,
        children: row.children,
        created_at: row.created_at
            ? String(row.created_at)
            : row.booked_on
              ? String(row.booked_on)
              : undefined,
        payment_pref: row.payment_pref,
        arrival_time: row.arrival_time,
        need_crib: row.need_crib,
        need_extra_bed: row.need_extra_bed,
        is_booking_for_someone_else: row.is_booking_for_someone_else,
        recipient_name: row.recipient_name,
        is_work_trip: row.is_work_trip,
        special_requests: row.special_requests,
        add_ons: row.add_ons,
        failure_reason: row.failure_reason,
    };
}

export default function AdminReservationsInner() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const defaultPeriod = useMemo(() => presetToRange('last_3_months'), []);
    const [items, setItems] = useState<CommissionReservationRow[]>([]);
    const [commissionTotal, setCommissionTotal] = useState(0);
    const [currency, setCurrency] = useState('ETB');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [from, setFrom] = useState(defaultPeriod.from);
    const [to, setTo] = useState(defaultPeriod.to);
    const [selected, setSelected] = useState<CommissionReservationRow | null>(
        null,
    );

    const openDetail = useCallback(
        (row: CommissionReservationRow) => {
            setSelected(row);
            const qs = new URLSearchParams(searchParams.toString());
            qs.set('bookingId', row.id);
            router.replace(`/admin/reservations?${qs.toString()}`, {
                scroll: false,
            });
        },
        [router, searchParams],
    );

    const closeDetail = useCallback(() => {
        setSelected(null);
        const qs = new URLSearchParams(searchParams.toString());
        qs.delete('bookingId');
        const q = qs.toString();
        router.replace(`/admin/reservations${q ? `?${q}` : ''}`, {
            scroll: false,
        });
    }, [router, searchParams]);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const qs = new URLSearchParams({ limit: '200' });
            if (from) qs.set('from', new Date(`${from}T00:00:00`).toISOString());
            if (to) qs.set('to', new Date(`${to}T23:59:59`).toISOString());
            const data = await adminInventoryFetch<PortfolioResponse>(
                `billing/commission/reservations?${qs.toString()}`,
                undefined,
                'Loading reservations…',
            );
            setItems(data.items || []);
            setCommissionTotal(Number(data.commission_total || 0));
            setCurrency(data.currency || 'ETB');
            setPage(1);
        } catch (e) {
            setError((e as Error).message);
        } finally {
            setLoading(false);
        }
    }, [from, to]);

    useEffect(() => {
        void load();
    }, [load]);

    useEffect(() => {
        const bookingId = searchParams.get('bookingId');
        if (!bookingId || items.length === 0) return;
        const match = items.find((b) => b.id === bookingId);
        if (match) setSelected(match);
    }, [searchParams, items]);

    const columns: AdminColumn<CommissionReservationRow>[] = [
        {
            id: 'hotel',
            header: 'Hotel',
            alwaysVisible: true,
            cell: (b) => (
                <span className="font-semibold text-brand-dark">
                    {b.hotel_name || 'Hotel'}
                </span>
            ),
        },
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
            id: 'checkin',
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
            cell: (b) => dateCell(b.booked_on || b.created_at),
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
            id: 'price',
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

    return (
        <div className="space-y-6 w-full">
            <div>
                <h1 className="text-2xl font-extrabold text-brand-dark">
                    Reservations
                </h1>
                <p className="text-sm text-slate-600 mt-1">
                    All hotels — use the chevron to expand a row, Columns to
                    show/hide fields, or click Open detail for the full panel.
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
            >
                <Link
                    href="/admin/statement"
                    className="h-10 inline-flex items-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                    Reservations statement
                </Link>
            </AdminPeriodRangeFilter>

            {error ? (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                    {error}
                </div>
            ) : null}

            <AdminDataTable
                columns={columns}
                rows={items}
                rowKey={(b) => b.id}
                loading={loading}
                loadingLabel="Loading reservations…"
                emptyLabel="No reservations in this range."
                page={page}
                pageSize={ADMIN_PAGE_SIZE}
                total={items.length}
                onPageChange={setPage}
                columnPrefsKey="super-admin-reservations"
                minTableWidth={1200}
                renderExpanded={(row) =>
                    reservationExpandPanel(row, {
                        onOpenDetail: () => openDetail(row),
                        statementHref: row.hotel_id
                            ? `/admin/statement?hotelId=${row.hotel_id}`
                            : '/admin/statement',
                        invoicesHref: row.hotel_id
                            ? `/admin/finance?hotelId=${row.hotel_id}`
                            : '/admin/finance',
                    })
                }
            />

            {items.length > 0 ? (
                <p className="text-sm text-right font-extrabold text-brand-dark">
                    Commission: {currency} {commissionTotal.toLocaleString()}
                </p>
            ) : null}

            <HotelReservationDetailSheet
                open={Boolean(selected)}
                onOpenChange={(open) => {
                    if (!open) closeDetail();
                }}
                hotelId={selected?.hotel_id || undefined}
                readOnly
                adminPortfolio
                booking={selected ? toDetail(selected) : null}
            />
        </div>
    );
}
