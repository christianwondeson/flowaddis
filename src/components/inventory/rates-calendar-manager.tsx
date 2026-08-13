'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { hotelAdminFetch } from '@/lib/hotel-admin-api';
import { adminInventoryFetch } from '@/lib/admin-inventory-api';
import {
    formatMoney,
    normalizeCurrency,
    type PricingCurrency,
} from '@/lib/hotel-pricing';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { ChevronLeft, ChevronRight, Save } from 'lucide-react';
import { BookAddisLiveNote } from '@/components/hotel-portal/bookaddis-live-note';
import { BulkCalendarEdit } from '@/components/inventory/bulk-calendar-edit';
import { AdminLoader } from '@/components/ui/admin-loader';
import { formatAdminDate, formatAdminMonth } from '@/lib/admin-date-format';

async function invFetch<T>(
    mode: 'portal' | 'admin',
    path: string,
    init?: RequestInit,
): Promise<T> {
    if (mode === 'admin') return adminInventoryFetch<T>(path, init);
    return hotelAdminFetch<T>(path, init);
}

type RoomType = {
    id: string;
    name: string;
    rate_plans?: Array<{
        id: string;
        name: string;
        currency: string;
        base_price?: number | null;
    }>;
};

type CalendarDay = {
    date: string;
    price?: number | null;
    allotment?: number | null;
    is_closed?: boolean;
    currency?: string;
};

function monthRange(ym: string) {
    const [y, m] = ym.split('-').map(Number);
    const from = `${ym}-01`;
    const last = new Date(y, m, 0).getDate();
    const to = `${ym}-${String(last).padStart(2, '0')}`;
    return { from, to, daysInMonth: last, year: y, month: m };
}

function shiftMonth(ym: string, delta: number) {
    const [y, m] = ym.split('-').map(Number);
    const d = new Date(y, m - 1 + delta, 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function weekday(date: string) {
    return new Date(`${date}T12:00:00`).toLocaleDateString('en-US', {
        weekday: 'short',
    });
}

/**
 * Daily prices & allotment  hotel sets the nightly price; BookAddis stores it as-is.
 */
export function RatesCalendarManager({
    mode = 'portal',
}: {
    mode?: 'portal' | 'admin';
}) {
    const params = useParams();
    const searchParams = useSearchParams();
    const hotelId = String(params.hotelId || '');
    const roomFromQuery = searchParams.get('room') || '';

    const [rooms, setRooms] = useState<RoomType[]>([]);
    const [roomId, setRoomId] = useState(roomFromQuery);
    const [ratePlanId, setRatePlanId] = useState('');
    const [month, setMonth] = useState(() => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    });
    const [days, setDays] = useState<Record<string, CalendarDay>>({});
    const [bulkPrice, setBulkPrice] = useState('');
    const [bulkAllotment, setBulkAllotment] = useState('');
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [savingCurrency, setSavingCurrency] = useState(false);
    const [hotelMedia, setHotelMedia] = useState<Record<string, unknown>>({});
    const [currency, setCurrency] = useState<PricingCurrency>('ETB');

    const selectedRoom = rooms.find((r) => r.id === roomId);
    const plans = selectedRoom?.rate_plans || [];
    const range = useMemo(() => monthRange(month), [month]);

    useEffect(() => {
        if (!hotelId) return;
        void (async () => {
            try {
                const [roomData, hotel] = await Promise.all([
                    invFetch<RoomType[]>(mode, `hotels/${hotelId}/room-types`),
                    invFetch<{
                        media?: Record<string, unknown> | null;
                        default_currency?: string | null;
                    }>(mode, `hotels/${hotelId}`),
                ]);
                const list = Array.isArray(roomData) ? roomData : [];
                setRooms(list);
                const media = (hotel.media || {}) as Record<string, unknown>;
                setHotelMedia(media);
                const fromMedia = (media.pricing as { currency?: string } | undefined)
                    ?.currency;
                setCurrency(
                    normalizeCurrency(
                        fromMedia || hotel.default_currency || 'ETB',
                    ),
                );

                const preferred =
                    roomFromQuery && list.some((r) => r.id === roomFromQuery)
                        ? roomFromQuery
                        : list[0]?.id || '';
                setRoomId(preferred);
                const plan =
                    list.find((r) => r.id === preferred)?.rate_plans?.[0]?.id ||
                    '';
                setRatePlanId(plan);
            } catch (e) {
                toast.error((e as Error).message);
            }
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [hotelId, mode]);

    useEffect(() => {
        const plan =
            rooms.find((r) => r.id === roomId)?.rate_plans?.[0]?.id || '';
        setRatePlanId(plan);
    }, [roomId, rooms]);

    useEffect(() => {
        if (!roomId || !ratePlanId) return;
        let cancelled = false;
        (async () => {
            setLoading(true);
            try {
                const data = await invFetch<{ days?: CalendarDay[] }>(
                    mode,
                    `room-types/${roomId}/calendar?from=${range.from}&to=${range.to}&rate_plan_id=${ratePlanId}`,
                );
                if (cancelled) return;
                const map: Record<string, CalendarDay> = {};
                for (const d of data.days || []) {
                    map[d.date] = d;
                }
                for (let i = 1; i <= range.daysInMonth; i++) {
                    const date = `${month}-${String(i).padStart(2, '0')}`;
                    if (!map[date]) map[date] = { date, currency };
                }
                setDays(map);
            } catch (e) {
                toast.error((e as Error).message);
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [
        roomId,
        ratePlanId,
        month,
        range.from,
        range.to,
        range.daysInMonth,
        currency,
        mode,
    ]);

    const dayKeys = useMemo(() => Object.keys(days).sort(), [days]);

    const monthStats = useMemo(() => {
        let open = 0;
        let closed = 0;
        let sumPrice = 0;
        let priced = 0;
        for (const date of dayKeys) {
            const d = days[date];
            if (d.is_closed) closed += 1;
            else open += 1;
            if (
                d.price != null &&
                Number.isFinite(Number(d.price)) &&
                !d.is_closed
            ) {
                sumPrice += Number(d.price);
                priced += 1;
            }
        }
        return {
            open,
            closed,
            avgPrice: priced ? Math.round((sumPrice / priced) * 100) / 100 : 0,
        };
    }, [dayKeys, days]);

    const applyBulk = () => {
        const price = bulkPrice === '' ? undefined : Number(bulkPrice);
        const allotment =
            bulkAllotment === '' ? undefined : Number(bulkAllotment);
        setDays((prev) => {
            const next = { ...prev };
            for (let i = 1; i <= range.daysInMonth; i++) {
                const date = `${month}-${String(i).padStart(2, '0')}`;
                next[date] = {
                    ...next[date],
                    date,
                    currency,
                    ...(price !== undefined && !Number.isNaN(price)
                        ? { price }
                        : {}),
                    ...(allotment !== undefined && !Number.isNaN(allotment)
                        ? { allotment }
                        : {}),
                };
            }
            return next;
        });
        toast.message('Bulk values applied  click Save calendar to persist');
    };

    const saveCurrency = async () => {
        setSavingCurrency(true);
        try {
            const prevPricing =
                hotelMedia.pricing && typeof hotelMedia.pricing === 'object'
                    ? (hotelMedia.pricing as Record<string, unknown>)
                    : {};
            const nextMedia = {
                ...hotelMedia,
                pricing: { ...prevPricing, currency },
            };
            await invFetch(mode, `hotels/${hotelId}`, {
                method: 'PUT',
                body: JSON.stringify({
                    media: nextMedia,
                    default_currency: currency,
                }),
            });
            setHotelMedia(nextMedia);
            toast.success(`Currency saved (${currency})`);
        } catch (e) {
            toast.error((e as Error).message);
        } finally {
            setSavingCurrency(false);
        }
    };

    const save = async () => {
        if (!roomId || !ratePlanId) {
            toast.error('Select a room type with a rate plan');
            return;
        }
        setSaving(true);
        try {
            const payloadDays = Object.values(days).map((d) => ({
                date: d.date,
                price: d.price ?? undefined,
                allotment: d.allotment ?? undefined,
                is_closed: d.is_closed ?? false,
                currency: d.currency || currency,
            }));
            await invFetch(mode, `room-types/${roomId}/calendar`, {
                method: 'PUT',
                body: JSON.stringify({
                    rate_plan_id: ratePlanId,
                    days: payloadDays,
                }),
            });
            toast.success('Calendar saved');
        } catch (e) {
            toast.error((e as Error).message);
        } finally {
            setSaving(false);
        }
    };

    const applyBulkRange = async (
        patchDays: Array<{
            date: string;
            price?: number;
            allotment?: number;
            is_closed?: boolean;
            currency?: string;
        }>,
    ) => {
        if (!roomId || !ratePlanId) {
            throw new Error('Select a room type with a rate plan');
        }
        await invFetch(mode, `room-types/${roomId}/calendar`, {
            method: 'PUT',
            body: JSON.stringify({
                rate_plan_id: ratePlanId,
                days: patchDays,
            }),
        });
        const data = await invFetch<{ days?: CalendarDay[] }>(
            mode,
            `room-types/${roomId}/calendar?from=${range.from}&to=${range.to}&rate_plan_id=${ratePlanId}`,
        );
        const map: Record<string, CalendarDay> = {};
        for (const d of data.days || []) {
            map[d.date] = d;
        }
        for (let i = 1; i <= range.daysInMonth; i++) {
            const date = `${month}-${String(i).padStart(2, '0')}`;
            if (!map[date]) map[date] = { date, currency };
        }
        setDays(map);
    };

    const monthLabel = useMemo(() => formatAdminMonth(month), [month]);

    return (
        <div className="space-y-5 max-w-[1200px]">
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-extrabold text-brand-dark tracking-tight">
                        Rates & availability
                    </h1>
                    <p className="text-sm text-slate-600 mt-1">
                        Set the nightly price and rooms to sell. That price is
                        what BookAddis stores and guests see  tax and other
                        charges are handled by your hotel, not calculated here.
                    </p>
                </div>
                <Button
                    onClick={() => void save()}
                    disabled={saving || !ratePlanId}
                    className="w-full sm:w-auto"
                >
                    <Save className="w-4 h-4 mr-1.5" />
                    {saving ? 'Saving…' : 'Save calendar'}
                </Button>
            </div>

            {mode === 'portal' ? <BookAddisLiveNote /> : null}

            <BulkCalendarEdit
                currency={currency}
                disabled={!ratePlanId}
                onApply={applyBulkRange}
            />

            <section className="rounded-2xl border border-slate-200 bg-white shadow-sm p-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-1.5">
                    <Label>Currency</Label>
                    <div className="flex gap-2">
                        <select
                            className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                            value={currency}
                            onChange={(e) =>
                                setCurrency(
                                    e.target.value === 'USD' ? 'USD' : 'ETB',
                                )
                            }
                        >
                            <option value="ETB">ETB (Birr)</option>
                            <option value="USD">USD (Dollar)</option>
                        </select>
                        <Button
                            type="button"
                            variant="outline"
                            disabled={savingCurrency}
                            onClick={() => void saveCurrency()}
                            className="shrink-0"
                        >
                            {savingCurrency ? '…' : 'Save'}
                        </Button>
                    </div>
                </div>
                <div className="space-y-1.5">
                    <Label>Room type</Label>
                    <select
                        className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                        value={roomId}
                        onChange={(e) => setRoomId(e.target.value)}
                    >
                        <option value="">Select…</option>
                        {rooms.map((r) => (
                            <option key={r.id} value={r.id}>
                                {r.name}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="space-y-1.5">
                    <Label>Rate plan</Label>
                    <select
                        className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                        value={ratePlanId}
                        onChange={(e) => setRatePlanId(e.target.value)}
                    >
                        <option value="">Select…</option>
                        {plans.map((p) => (
                            <option key={p.id} value={p.id}>
                                {p.name}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="space-y-1.5">
                    <Label>Month</Label>
                    <div className="flex items-center gap-2">
                        <Button
                            type="button"
                            size="icon"
                            variant="outline"
                            onClick={() => setMonth((m) => shiftMonth(m, -1))}
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <div className="flex-1 text-center font-bold text-brand-dark text-sm">
                            {monthLabel}
                        </div>
                        <Button
                            type="button"
                            size="icon"
                            variant="outline"
                            onClick={() => setMonth((m) => shiftMonth(m, 1))}
                        >
                            <ChevronRight className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white shadow-sm p-4 flex flex-col lg:flex-row gap-4 lg:items-end lg:justify-between">
                <div className="flex flex-wrap gap-3 items-end">
                    <div className="space-y-1.5">
                        <Label>Bulk price ({currency})</Label>
                        <Input
                            type="number"
                            min={0}
                            value={bulkPrice}
                            onChange={(e) => setBulkPrice(e.target.value)}
                            className="w-36"
                            placeholder="4500"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label>Bulk rooms to sell</Label>
                        <Input
                            type="number"
                            min={0}
                            value={bulkAllotment}
                            onChange={(e) => setBulkAllotment(e.target.value)}
                            className="w-36"
                        />
                    </div>
                    <Button type="button" variant="outline" onClick={applyBulk}>
                        Apply to month
                    </Button>
                </div>
                <div className="flex flex-wrap gap-4 text-sm">
                    <div>
                        <span className="text-slate-500">Open </span>
                        <span className="font-bold text-brand-dark">
                            {monthStats.open}
                        </span>
                    </div>
                    <div>
                        <span className="text-slate-500">Closed </span>
                        <span className="font-bold text-brand-dark">
                            {monthStats.closed}
                        </span>
                    </div>
                    <div>
                        <span className="text-slate-500">Avg / night </span>
                        <span className="font-bold text-brand-primary">
                            {formatMoney(monthStats.avgPrice, currency)}
                        </span>
                    </div>
                </div>
            </section>

            {loading ? (
                <AdminLoader label="Loading calendar…" />
            ) : !ratePlanId ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-12 text-center text-sm text-slate-500">
                    Create a room type with a rate plan first (Rooms page).
                </div>
            ) : (
                <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                    <div className="overflow-x-auto max-h-[min(70vh,720px)] overflow-y-auto">
                        <table className="w-full text-sm min-w-[640px] border-collapse">
                            <thead className="sticky top-0 z-10 bg-slate-50 shadow-[0_1px_0_0_rgba(15,23,42,0.08)]">
                                <tr className="text-left text-[11px] uppercase tracking-wide text-slate-500">
                                    <th className="sticky left-0 z-20 bg-slate-50 px-3 py-3 font-bold min-w-[148px]">
                                        Date
                                    </th>
                                    <th className="px-2 py-3 font-bold">
                                        Price ({currency})
                                    </th>
                                    <th className="px-2 py-3 font-bold">
                                        Rooms
                                    </th>
                                    <th className="px-2 py-3 font-bold">
                                        Status
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {dayKeys.map((date) => {
                                    const d = days[date];
                                    const closed = !!d.is_closed;
                                    const isWeekend = [0, 6].includes(
                                        new Date(`${date}T12:00:00`).getDay(),
                                    );
                                    return (
                                        <tr
                                            key={date}
                                            className={
                                                closed
                                                    ? 'bg-red-50/40'
                                                    : isWeekend
                                                      ? 'bg-amber-50/30'
                                                      : 'bg-white'
                                            }
                                        >
                                            <td className="sticky left-0 z-[1] bg-inherit px-3 py-2 font-semibold text-brand-dark border-t border-slate-100 whitespace-nowrap">
                                                <div className="leading-tight">
                                                    {formatAdminDate(date)}
                                                </div>
                                                <div className="text-[11px] font-normal text-slate-400 mt-0.5">
                                                    {weekday(date)}
                                                </div>
                                            </td>
                                            <td className="px-2 py-1.5 border-t border-slate-100">
                                                <Input
                                                    type="number"
                                                    min={0}
                                                    className="h-9 w-[120px] font-semibold"
                                                    disabled={closed}
                                                    value={d.price ?? ''}
                                                    onChange={(e) =>
                                                        setDays((prev) => ({
                                                            ...prev,
                                                            [date]: {
                                                                ...prev[date],
                                                                date,
                                                                currency,
                                                                price:
                                                                    e.target
                                                                        .value ===
                                                                    ''
                                                                        ? undefined
                                                                        : Number(
                                                                              e
                                                                                  .target
                                                                                  .value,
                                                                          ),
                                                            },
                                                        }))
                                                    }
                                                />
                                            </td>
                                            <td className="px-2 py-1.5 border-t border-slate-100">
                                                <Input
                                                    type="number"
                                                    min={0}
                                                    className="h-9 w-[84px]"
                                                    disabled={closed}
                                                    value={d.allotment ?? ''}
                                                    onChange={(e) =>
                                                        setDays((prev) => ({
                                                            ...prev,
                                                            [date]: {
                                                                ...prev[date],
                                                                date,
                                                                allotment:
                                                                    e.target
                                                                        .value ===
                                                                    ''
                                                                        ? undefined
                                                                        : Number(
                                                                              e
                                                                                  .target
                                                                                  .value,
                                                                          ),
                                                            },
                                                        }))
                                                    }
                                                />
                                            </td>
                                            <td className="px-2 py-2 border-t border-slate-100">
                                                <label className="inline-flex items-center gap-2 text-xs font-semibold cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={closed}
                                                        onChange={(e) =>
                                                            setDays(
                                                                (prev) => ({
                                                                    ...prev,
                                                                    [date]: {
                                                                        ...prev[
                                                                            date
                                                                        ],
                                                                        date,
                                                                        is_closed:
                                                                            e
                                                                                .target
                                                                                .checked,
                                                                    },
                                                                }),
                                                            )
                                                        }
                                                    />
                                                    <span
                                                        className={
                                                            closed
                                                                ? 'text-red-600'
                                                                : 'text-emerald-700'
                                                        }
                                                    >
                                                        {closed
                                                            ? 'Closed'
                                                            : 'Open'}
                                                    </span>
                                                </label>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    <div className="border-t border-slate-100 px-4 py-3 text-xs text-slate-500 bg-slate-50/80 flex flex-col sm:flex-row sm:justify-between gap-1">
                        <span>
                            Sticky date column · weekends highlighted · closed
                            days in red
                        </span>
                        <span>
                            Remember to <strong>Save calendar</strong> after
                            edits
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}
