"use client";

import React, { useState, useEffect, useMemo } from 'react';
import {
    Users,
    Check,
    Info,
    Ban,
    Loader2,
    UtensilsCrossed,
    Sparkles,
    BedDouble,
    CreditCard,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { formatCurrency, formatHotelPrice } from '@/lib/currency';
import { formatAdminDate } from '@/lib/admin-date-format';
import { formatDateLocal, parseDateLocal } from '@/lib/date-utils';
import { Hotel, RoomBlock, RoomDetails } from '@/types/api';
import axios from 'axios';
import { useTranslations } from '@/components/providers/locale-provider';
import { isBookaddisBookableHotel } from '@/components/hotels/hotel-inventory-badge';
import type { Hotel as ListHotel } from '@/types';
import { resolveStrapiFileUrl } from '@/lib/admin-cms-client';
import { APP_CONSTANTS } from '@/lib/constants';
import { useEtbUsdRate } from '@/hooks/use-etb-usd-rate';

/** Returns a display-safe room name; never returns 0 or "0". */
function safeRoomName(val: unknown): string | null {
    if (val == null || val === '' || val === 0 || val === '0') return null;
    const s = String(val).trim();
    return s || null;
}

export type HotelBookSelection = {
    price?: number;
    serviceName?: string;
    roomBlockId?: string;
    roomQuantity?: number;
    roomTypeId?: string;
    ratePlanId?: string;
};

type DirectOffer = {
    room_type_id: string;
    rate_plan_id: string;
    room_name: string;
    rate_plan_name: string;
    max_occupancy: number;
    bed_configuration: string | null;
    payment_timings: string[];
    cancellation_policy: Record<string, unknown>;
    currency: string;
    total_price: number;
    rooms_available: number;
    available: boolean;
    photos?: string[];
    description?: string | null;
    max_adults?: number | null;
    max_children?: number | null;
};

interface HotelDetailAvailabilityProps {
    hotel: Hotel;
    checkInDate?: string;
    checkOutDate?: string;
    adults?: number;
    childrenCount?: number;
    roomsCount?: number;
    onDateChange?: (checkIn: string, checkOut: string) => void;
    onGuestsChange?: (adults: number, children: number, rooms: number) => void;
    onBook?: (selection: HotelBookSelection) => void;
}

function paymentLabel(timings: string[]): string {
    const set = new Set((timings || []).map((t) => String(t).toLowerCase()));
    if (set.has('pay_at_property') && (set.has('pay_now') || set.has('prepaid'))) {
        return 'Reserve now, pay at hotel or pay now';
    }
    if (set.has('pay_at_property')) return 'Reserve now, pay at hotel';
    if (set.has('pay_now') || set.has('prepaid')) return 'Pay now';
    return timings.join(' · ') || 'See rate terms';
}

/** Infer bed count from free-text bed_configuration for filter matching. */
function inferBedCount(config: string | null | undefined): number | null {
    const s = String(config || '').toLowerCase().trim();
    if (!s) return null;
    if (/\btwin\b|2\s*beds?|two beds|double twin/.test(s)) return 2;
    const numbered = s.match(/(\d+)\s*beds?\b/);
    if (numbered) return Number(numbered[1]);
    if (/\b(king|queen|double|single|1\s*bed|one bed|sofa bed)\b/.test(s)) {
        return 1;
    }
    return null;
}

function offerFitsTravelers(
    offer: DirectOffer,
    adults: number,
    children: number,
    roomsNeeded: number,
): boolean {
    if (offer.rooms_available < Math.max(1, roomsNeeded)) return false;
    const guests = adults + children;
    if (guests > offer.max_occupancy) return false;
    const maxAdults = offer.max_adults ?? offer.max_occupancy;
    if (maxAdults != null && adults > maxAdults) return false;
    if (children > 0) {
        const maxChildren =
            offer.max_children != null
                ? offer.max_children
                : Math.max(0, offer.max_occupancy - 1);
        if (children > maxChildren) return false;
    }
    return true;
}

export const HotelDetailAvailability: React.FC<HotelDetailAvailabilityProps> = ({
    hotel,
    checkInDate,
    checkOutDate,
    adults = 2,
    childrenCount = 0,
    roomsCount = 1,
    onDateChange,
    onGuestsChange,
    onBook,
}) => {
    const { t } = useTranslations();
    const { etbPerUsd } = useEtbUsdRate();
    const [rooms, setRooms] = useState<RoomBlock[]>([]);
    const [roomDetails, setRoomDetails] = useState<Record<string, RoomDetails>>({});
    const [directOffers, setDirectOffers] = useState<DirectOffer[]>([]);
    const [selectedRooms, setSelectedRooms] = useState<Record<string, number>>({});
    const [bedFilter, setBedFilter] = useState<'all' | '1' | '2'>('all');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const canReserve = isBookaddisBookableHotel(hotel as unknown as ListHotel);
    const placeholder =
        APP_CONSTANTS.ASSETS?.HOTEL_PLACEHOLDER ||
        'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80';

    useEffect(() => {
        const fetchRooms = async () => {
            try {
                setIsLoading(true);
                setError(null);
                const hotelId = hotel.id;
                if (!hotelId || !checkInDate || !checkOutDate) return;

                if (canReserve) {
                    const params = new URLSearchParams({
                        checkIn: checkInDate,
                        checkOut: checkOutDate,
                    });
                    const response = await axios.get(
                        `/api/hotels/direct-availability/${encodeURIComponent(hotelId)}?${params}`,
                    );
                    setDirectOffers(Array.isArray(response.data?.offers) ? response.data.offers : []);
                    setRooms([]);
                    setRoomDetails({});
                    setSelectedRooms({});
                    return;
                }

                const params = new URLSearchParams({
                    hotelId,
                    checkin_date: checkInDate,
                    checkout_date: checkOutDate,
                    adults_number: adults.toString(),
                    children_number: childrenCount.toString(),
                    room_number: roomsCount.toString(),
                    locale: 'en-gb',
                    currency: 'USD',
                    units: 'metric',
                });

                const response = await axios.get(`/api/hotels/room-list?${params.toString()}`);
                const data = response.data;

                const hotelData =
                    Array.isArray(data) && data.length > 0
                        ? data[0]
                        : data && typeof data === 'object' && !Array.isArray(data)
                          ? data
                          : null;
                if (hotelData) {
                    setRooms(hotelData.block || []);
                    const roomsMap = hotelData.rooms || {};
                    setRoomDetails(typeof roomsMap === 'object' ? roomsMap : {});
                    setSelectedRooms({});
                }
                setDirectOffers([]);
            } catch (err: unknown) {
                console.error('Error fetching rooms:', err);
                setError(t('hotelDetail.availability.loadFailed'));
            } finally {
                setIsLoading(false);
            }
        };

        void fetchRooms();
    }, [hotel.id, checkInDate, checkOutDate, adults, childrenCount, roomsCount, t, canReserve]);

    const filteredOffers = useMemo(() => {
        return directOffers.filter((o) => {
            if (!offerFitsTravelers(o, adults, childrenCount, roomsCount)) {
                return false;
            }
            if (bedFilter === 'all') return true;
            const beds = inferBedCount(o.bed_configuration);
            if (beds == null) return false;
            if (bedFilter === '1') return beds === 1;
            return beds >= 2;
        });
    }, [directOffers, bedFilter, adults, childrenCount, roomsCount]);

    const travelerLabel = `${adults + childrenCount} traveler${adults + childrenCount === 1 ? '' : 's'}, ${roomsCount} room${roomsCount === 1 ? '' : 's'}`;

    const FiltersBar = (
        <div className="rounded-2xl border border-border bg-card p-3 sm:p-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1">
                <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                    Start date
                </p>
                <Popover
                    trigger={
                        <button
                            type="button"
                            className="h-10 w-full rounded-lg border border-input px-3 text-left text-sm font-semibold text-foreground hover:border-brand-primary/40"
                        >
                            {checkInDate ? formatAdminDate(checkInDate) : 'Select'}
                        </button>
                    }
                    content={
                        <div className="p-2">
                            <Calendar
                                selected={checkInDate ? parseDateLocal(checkInDate) : undefined}
                                minDate={new Date()}
                                onSelect={(d) => {
                                    const next = formatDateLocal(d);
                                    const co =
                                        checkOutDate && checkOutDate > next
                                            ? checkOutDate
                                            : formatDateLocal(
                                                  new Date(d.getTime() + 86400000),
                                              );
                                    onDateChange?.(next, co);
                                }}
                            />
                        </div>
                    }
                />
            </div>
            <div className="space-y-1">
                <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                    End date
                </p>
                <Popover
                    trigger={
                        <button
                            type="button"
                            className="h-10 w-full rounded-lg border border-input px-3 text-left text-sm font-semibold text-foreground hover:border-brand-primary/40"
                        >
                            {checkOutDate ? formatAdminDate(checkOutDate) : 'Select'}
                        </button>
                    }
                    content={
                        <div className="p-2">
                            <Calendar
                                selected={checkOutDate ? parseDateLocal(checkOutDate) : undefined}
                                minDate={
                                    checkInDate
                                        ? parseDateLocal(checkInDate)
                                        : new Date()
                                }
                                onSelect={(d) => {
                                    if (!checkInDate) return;
                                    onDateChange?.(checkInDate, formatDateLocal(d));
                                }}
                            />
                        </div>
                    }
                />
            </div>
            <div className="space-y-1">
                <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                    Travelers
                </p>
                <Select
                    value={`${adults}-${childrenCount}-${roomsCount}`}
                    onValueChange={(v) => {
                        const [a, c, r] = v.split('-').map(Number);
                        onGuestsChange?.(a || 1, c || 0, r || 1);
                    }}
                >
                    <SelectTrigger className="h-10 text-sm rounded-lg">
                        <SelectValue placeholder={travelerLabel} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="1-0-1">1 traveler, 1 room</SelectItem>
                        <SelectItem value="2-0-1">2 travelers, 1 room</SelectItem>
                        <SelectItem value="2-1-1">2 adults + 1 child</SelectItem>
                        <SelectItem value="2-0-2">2 travelers, 2 rooms</SelectItem>
                        <SelectItem value="3-0-1">3 travelers, 1 room</SelectItem>
                        <SelectItem value="4-0-2">4 travelers, 2 rooms</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-1">
                <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                    Beds
                </p>
                <Select
                    value={bedFilter}
                    onValueChange={(v) => setBedFilter(v as 'all' | '1' | '2')}
                >
                    <SelectTrigger className="h-10 text-sm rounded-lg">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All rooms</SelectItem>
                        <SelectItem value="1">1 bed</SelectItem>
                        <SelectItem value="2">2 beds</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>
    );

    if (canReserve) {
        return (
            <div id="rooms" className="space-y-5 scroll-mt-28">
                <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
                    <div>
                        <h2 className="text-2xl font-bold text-foreground tracking-tight">
                            Available rooms
                        </h2>
                        <p className="text-sm text-muted-foreground mt-1">
                            {isLoading
                                ? 'Checking live rates…'
                                : `Showing ${filteredOffers.length} of ${directOffers.length} rooms`}
                            {checkInDate && checkOutDate
                                ? ` · ${formatAdminDate(checkInDate)} → ${formatAdminDate(checkOutDate)}`
                                : ''}
                        </p>
                    </div>
                </div>

                {FiltersBar}

                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-16 space-y-3">
                        <Loader2 className="w-8 h-8 text-brand-primary animate-spin" />
                        <p className="text-muted-foreground font-medium text-sm">
                            {t('hotelDetail.availability.checking')}
                        </p>
                    </div>
                ) : error ? (
                    <div className="bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/50 rounded-xl p-8 text-center">
                        <p className="text-red-600 dark:text-red-400 font-medium">{error}</p>
                        <Button
                            variant="outline"
                            className="mt-4 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40"
                            onClick={() => window.location.reload()}
                        >
                            {t('common.tryAgain')}
                        </Button>
                    </div>
                ) : filteredOffers.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground border border-border rounded-xl">
                        No rooms match these dates, travelers, or bed filter. Try adjusting
                        filters or ask the hotel to open rates.
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredOffers.map((offer) => {
                            const key = `${offer.room_type_id}:${offer.rate_plan_id}`;
                            const maxQty = Math.min(Math.max(1, offer.rooms_available), 10);
                            const qty = selectedRooms[key] ?? 1;
                            /** Stay total from API for 1 room; multiply only by selected room count. */
                            const total = Number(offer.total_price) * qty;
                            const refundable = Boolean(offer.cancellation_policy?.refundable);
                            const photo =
                                resolveStrapiFileUrl(offer.photos?.[0] || '') ||
                                placeholder;
                            const adultsCap = offer.max_adults ?? offer.max_occupancy;
                            const childrenCap = offer.max_children ?? 0;
                            return (
                                <article
                                    key={key}
                                    className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm"
                                >
                                    <div className="flex flex-col md:flex-row">
                                        <div className="md:w-56 lg:w-64 shrink-0 h-44 md:h-auto relative bg-muted">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img
                                                src={photo}
                                                alt={offer.room_name}
                                                className="absolute inset-0 w-full h-full object-cover"
                                                onError={(e) => {
                                                    e.currentTarget.src = placeholder;
                                                }}
                                            />
                                        </div>
                                        <div className="flex-1 p-4 sm:p-5 flex flex-col sm:flex-row gap-4">
                                            <div className="flex-1 min-w-0 space-y-2">
                                                <h3 className="text-lg font-extrabold text-foreground">
                                                    {offer.room_name}
                                                </h3>
                                                <p className="text-sm font-medium text-brand-primary">
                                                    {offer.rate_plan_name}
                                                </p>
                                                {offer.description ? (
                                                    <p className="text-sm text-muted-foreground line-clamp-2">
                                                        {offer.description}
                                                    </p>
                                                ) : null}
                                                <div className="flex flex-wrap gap-2 text-xs">
                                                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-1 font-semibold text-slate-700 dark:text-slate-200">
                                                        <Users className="w-3.5 h-3.5" />
                                                        Sleeps {offer.max_occupancy}
                                                        {adultsCap
                                                            ? ` (${adultsCap} adults${
                                                                  childrenCap
                                                                      ? `, ${childrenCap} children`
                                                                      : ''
                                                              })`
                                                            : ''}
                                                    </span>
                                                    {offer.bed_configuration ? (
                                                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-1 font-semibold">
                                                            <BedDouble className="w-3.5 h-3.5" />
                                                            {offer.bed_configuration}
                                                        </span>
                                                    ) : null}
                                                    <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-1 font-semibold">
                                                        {offer.rooms_available} left
                                                    </span>
                                                    {refundable ? (
                                                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-800 px-2.5 py-1 font-semibold">
                                                            <Check className="w-3.5 h-3.5" />
                                                            Fully refundable
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 rounded-full bg-red-50 text-red-700 px-2.5 py-1 font-semibold">
                                                            <Ban className="w-3.5 h-3.5" />
                                                            Non-refundable
                                                        </span>
                                                    )}
                                                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 text-amber-900 px-2.5 py-1 font-semibold">
                                                        <CreditCard className="w-3.5 h-3.5" />
                                                        {paymentLabel(offer.payment_timings)}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="sm:w-48 shrink-0 flex flex-col items-stretch sm:items-end gap-2 border-t sm:border-t-0 sm:border-l border-border pt-3 sm:pt-0 sm:pl-4">
                                                <Select
                                                    value={String(qty)}
                                                    onValueChange={(v) => {
                                                        const n = Math.max(
                                                            1,
                                                            Math.min(maxQty, Number(v) || 1),
                                                        );
                                                        setSelectedRooms((prev) => ({
                                                            ...prev,
                                                            [key]: n,
                                                        }));
                                                    }}
                                                >
                                                    <SelectTrigger className="h-10 text-sm w-full sm:w-[110px]">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {Array.from(
                                                            { length: maxQty },
                                                            (_, i) => i + 1,
                                                        ).map((n) => (
                                                            <SelectItem key={n} value={String(n)}>
                                                                {n} room{n > 1 ? 's' : ''}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <div className="text-right">
                                                    <div className="text-xl font-extrabold text-foreground">
                                                        {formatCurrency(total, offer.currency)}
                                                    </div>
                                                    <div className="text-[11px] text-muted-foreground">
                                                        {qty > 1
                                                            ? `${formatCurrency(offer.total_price, offer.currency)} × ${qty} rooms`
                                                            : 'Hotel rate for stay'}
                                                    </div>
                                                </div>
                                                <Button
                                                    onClick={() =>
                                                        onBook?.({
                                                            price: total,
                                                            serviceName: `${offer.room_name}  ${offer.rate_plan_name}`,
                                                            roomQuantity: qty,
                                                            roomTypeId: offer.room_type_id,
                                                            ratePlanId: offer.rate_plan_id,
                                                        })
                                                    }
                                                    className="h-11 w-full bg-brand-primary hover:bg-brand-primary/90 text-white font-bold rounded-xl"
                                                >
                                                    Reserve
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                )}
            </div>
        );
    }

    if (isLoading) {
        return (
            <div id="rooms" className="space-y-5 scroll-mt-28">
                <h2 className="text-2xl font-bold text-foreground tracking-tight">
                    {t('hotelDetail.availability.title')}
                </h2>
                {FiltersBar}
                <div className="flex flex-col items-center justify-center py-16 space-y-3">
                <Loader2 className="w-8 h-8 text-brand-primary animate-spin" />
                    <p className="text-muted-foreground font-medium text-sm">
                        {t('hotelDetail.availability.checking')}
                    </p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div id="rooms" className="space-y-5 scroll-mt-28">
                <h2 className="text-2xl font-bold text-foreground tracking-tight">
                    {t('hotelDetail.availability.title')}
                </h2>
                {FiltersBar}
            <div className="bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/50 rounded-xl p-8 text-center">
                <p className="text-red-600 dark:text-red-400 font-medium">{error}</p>
                <Button
                    variant="outline"
                    className="mt-4 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40"
                    onClick={() => window.location.reload()}
                >
                    {t('common.tryAgain')}
                </Button>
                </div>
            </div>
        );
    }

    return (
        <div id="rooms" className="space-y-5 scroll-mt-28">
            <div className="flex items-center justify-between gap-3">
                <h2 className="text-2xl font-bold text-foreground tracking-tight">
                    {t('hotelDetail.availability.title')}
                </h2>
            </div>
            <div className="text-xs text-muted-foreground">
                Partner listing  amounts shown as provided by the source. BookAddis does
                not add tax or invent a guest total.
                {etbPerUsd > 0 ? (
                    <span>
                        {' '}
                        FX reference {etbPerUsd.toFixed(2)} ETB/USD (CBE).
                    </span>
                ) : null}
                <Info className="w-3 h-3 inline ml-1" />
            </div>

            {FiltersBar}

            <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 px-4 py-3 text-sm text-slate-700 dark:text-slate-200">
                Partner listing  prices shown for reference. BookAddis does not take a
                reservation for this property yet.
            </div>

            <div className="space-y-3 md:hidden">
                {rooms.length === 0 ? (
                    <div className="p-6 text-center text-muted-foreground border border-border rounded-xl">
                        {t('hotelDetail.availability.noRooms')}
                    </div>
                ) : (
                    rooms.map((block, index) => {
                        const details = roomDetails[String(block.room_id)] || {};
                        const roomName =
                            safeRoomName((block as any).room_name) ||
                            safeRoomName((block as any).name_without_policy) ||
                            safeRoomName(details?.room_name) ||
                            t('hotelDetail.availability.standardRoom');
                        const price =
                            block.price_breakdown?.all_inclusive_price ??
                            block.min_price?.price ??
                            (typeof block.product_price_breakdown?.gross_amount === 'object'
                                ? block.product_price_breakdown?.gross_amount?.value
                                : block.product_price_breakdown?.gross_amount);
                        const selectionKey = String(block.block_id || block.room_id || index);
                        const selectedCount = selectedRooms[selectionKey] ?? 1;
                        const totalPrice = (Number(price) || 0) * selectedCount;
                        const rateLabel = (block as any).rate_label;
                        const mealplan =
                            (block as any).mealplan || (block as any).detail_mealplan;
                        return (
                            <div
                                key={block.block_id || index}
                                className="bg-card border border-border rounded-2xl p-4 shadow-sm"
                            >
                                <div className="font-bold text-brand-primary">{roomName}</div>
                                        {(rateLabel || mealplan) && (
                                    <div className="mt-1 text-[11px] text-muted-foreground flex flex-wrap gap-2">
                                        {rateLabel && <span>{rateLabel}</span>}
                                        {mealplan && (
                                            <span className="flex items-center gap-1">
                                                <UtensilsCrossed className="w-3 h-3" />
                                                {mealplan}
                                            </span>
                                        )}
                                        </div>
                                    )}
                                <div className="mt-3 text-lg font-bold">
                                    {formatHotelPrice(totalPrice, 'USD', etbPerUsd)}
                                </div>
                                <Button
                                    disabled
                                    className="w-full mt-3 h-11 opacity-60 cursor-not-allowed"
                                >
                                    Check availability
                                    </Button>
                            </div>
                        );
                    })
                )}
            </div>

            <div className="hidden md:block overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50/50 dark:bg-slate-800/50 border-b border-border">
                            <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                                {t('hotelDetail.availability.tableAccommodation')}
                            </th>
                            <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                                {t('hotelDetail.availability.tablePrice')}
                            </th>
                            <th className="px-6 py-4 bg-brand-primary/5"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {rooms.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={3}
                                    className="px-6 py-12 text-center text-muted-foreground font-medium"
                                >
                                    {t('hotelDetail.availability.noRooms')}
                                </td>
                            </tr>
                        ) : (
                            rooms.map((block, index) => {
                                const details = roomDetails[String(block.room_id)] || {};
                                const roomName =
                                    safeRoomName((block as any).room_name) ||
                                    safeRoomName(details?.room_name) ||
                                    t('hotelDetail.availability.standardRoom');
                                const price =
                                    block.price_breakdown?.all_inclusive_price ??
                                    block.min_price?.price ??
                                    (typeof block.product_price_breakdown?.gross_amount ===
                                    'object'
                                        ? block.product_price_breakdown?.gross_amount?.value
                                        : block.product_price_breakdown?.gross_amount);
                                return (
                                    <tr key={block.block_id || index}>
                                        <td className="px-6 py-6 align-top">
                                            <div className="font-bold text-brand-primary">
                                                {roomName}
                                                </div>
                                            {(block as any).bundle_extras?.highlighted_text && (
                                                <div className="mt-1 flex items-center gap-1 text-[11px] text-green-700">
                                                    <Sparkles className="w-3 h-3" />
                                                    {(block as any).bundle_extras.highlighted_text}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-6 font-bold">
                                            {formatHotelPrice(
                                                Number(price) || 0,
                                                'USD',
                                                etbPerUsd,
                                            )}
                                        </td>
                                        <td className="px-6 py-6">
                                            <Button
                                                disabled
                                                className="w-full opacity-60 cursor-not-allowed"
                                            >
                                                Check availability
                                                </Button>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
