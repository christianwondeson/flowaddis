"use client";

import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Users, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { parseDateLocal, formatDateLocal } from '@/lib/date-utils';
import { useTranslations, useLocaleContext } from '@/components/providers/locale-provider';
import type { AppLocale } from '@/lib/i18n/config';

interface HotelDetailBookingSidebarProps {
    hotel: any;
    checkIn: string;
    checkOut: string;
    adults: number;
    children: number;
    rooms: number;
    onDateChange: (checkIn: string, checkOut: string) => void;
    onGuestsChange: (adults: number, children: number, rooms: number) => void;
    onCheckAvailability: () => void;
}

function formatShortDate(dateStr: string, locale: AppLocale): string {
    if (!dateStr) return '';
    const d = parseDateLocal(dateStr);
    return d.toLocaleDateString(locale === 'am' ? 'am-ET' : 'en-US', { month: 'short', day: 'numeric' });
}

export const HotelDetailBookingSidebar: React.FC<HotelDetailBookingSidebarProps> = ({
    hotel,
    checkIn,
    checkOut,
    adults,
    children,
    rooms,
    onDateChange,
    onGuestsChange,
    onCheckAvailability,
}) => {
    const { t } = useTranslations();
    const { locale } = useLocaleContext();
    const [tempAdults, setTempAdults] = useState(adults);
    const [tempChildren, setTempChildren] = useState(children);
    const [tempRooms, setTempRooms] = useState(rooms);
    const [isGuestOpen, setIsGuestOpen] = useState(false);
    const [isCheckInOpen, setIsCheckInOpen] = useState(false);
    const [isCheckOutOpen, setIsCheckOutOpen] = useState(false);

    useEffect(() => {
        if (isGuestOpen) {
            setTempAdults(adults);
            setTempChildren(children);
            setTempRooms(rooms);
        }
    }, [isGuestOpen, adults, children, rooms]);

    const guestLabel =
        adults === 1 ? t('hotelDetail.booking.guestOne') : t('hotelDetail.booking.guestsMany', { count: adults });

    const handleCheckInSelect = (date: Date) => {
        const ci = formatDateLocal(date);
        if (checkOut && parseDateLocal(checkOut) <= date) {
            const co = formatDateLocal(new Date(date.getTime() + 86400000));
            onDateChange(ci, co);
        } else {
            onDateChange(ci, checkOut);
        }
        setIsCheckInOpen(false);
    };

    const handleCheckOutSelect = (date: Date) => {
        const co = formatDateLocal(date);
        onDateChange(checkIn, co);
        setIsCheckOutOpen(false);
    };

    const handleGuestsApply = () => {
        onGuestsChange(tempAdults, tempChildren, tempRooms);
        setIsGuestOpen(false);
    };

    return (
        <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-border bg-muted/30">
                <p className="text-sm font-bold text-foreground">Your stay</p>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">
                    {hotel?.name || 'Select dates to see rooms'}
                </p>
            </div>

            <div className="p-5 space-y-4">
                <div>
                    <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wide mb-1.5">
                        {t('hotelDetail.booking.checkInLabel')}
                    </label>
                    <Popover
                        isOpen={isCheckInOpen}
                        onOpenChange={setIsCheckInOpen}
                        trigger={
                            <div className="flex items-center gap-3 w-full px-3.5 py-2.5 bg-background border border-border rounded-xl hover:border-brand-primary/40 transition-all cursor-pointer">
                                <CalendarIcon className="w-4 h-4 text-brand-primary shrink-0" />
                                <span className="text-foreground font-medium text-sm">
                                    {checkIn ? formatShortDate(checkIn, locale) : t('hotelDetail.booking.selectDate')}
                                </span>
                            </div>
                        }
                        content={
                            <div className="p-3">
                                <Calendar
                                    selected={checkIn ? parseDateLocal(checkIn) : undefined}
                                    onSelect={handleCheckInSelect}
                                    minDate={new Date()}
                                />
                            </div>
                        }
                    />
                </div>

                <div>
                    <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wide mb-1.5">
                        {t('hotelDetail.booking.checkOutLabel')}
                    </label>
                    <Popover
                        isOpen={isCheckOutOpen}
                        onOpenChange={setIsCheckOutOpen}
                        trigger={
                            <div className="flex items-center gap-3 w-full px-3.5 py-2.5 bg-background border border-border rounded-xl hover:border-brand-primary/40 transition-all cursor-pointer">
                                <CalendarIcon className="w-4 h-4 text-brand-primary shrink-0" />
                                <span className="text-foreground font-medium text-sm">
                                    {checkOut ? formatShortDate(checkOut, locale) : t('hotelDetail.booking.selectDate')}
                                </span>
                            </div>
                        }
                        content={
                            <div className="p-3">
                                <Calendar
                                    selected={checkOut ? parseDateLocal(checkOut) : undefined}
                                    onSelect={handleCheckOutSelect}
                                    minDate={checkIn ? new Date(parseDateLocal(checkIn).getTime() + 86400000) : new Date()}
                                />
                            </div>
                        }
                    />
                </div>

                <div>
                    <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wide mb-1.5">
                        {t('hotelDetail.booking.guestsHeading')}
                    </label>
                    <Popover
                        isOpen={isGuestOpen}
                        onOpenChange={setIsGuestOpen}
                        trigger={
                            <div className="flex items-center gap-3 w-full px-3.5 py-2.5 bg-background border border-border rounded-xl hover:border-brand-primary/40 transition-all cursor-pointer">
                                <Users className="w-4 h-4 text-brand-primary shrink-0" />
                                <span className="text-foreground font-medium text-sm flex-1">{guestLabel}</span>
                                <ChevronDown className="w-4 h-4 text-muted-foreground" />
                            </div>
                        }
                        content={
                            <div className="p-4 w-64 space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium text-foreground">{t('hotelDetail.booking.adults')}</span>
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setTempAdults(Math.max(1, tempAdults - 1))}
                                            className="w-8 h-8 rounded-lg border border-border hover:bg-muted font-bold text-foreground"
                                        >
                                            −
                                        </button>
                                        <span className="w-8 text-center font-medium">{tempAdults}</span>
                                        <button
                                            type="button"
                                            onClick={() => setTempAdults(tempAdults + 1)}
                                            className="w-8 h-8 rounded-lg border border-border hover:bg-muted font-bold text-foreground"
                                        >
                                            +
                                        </button>
                                    </div>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium text-foreground">{t('hotelDetail.booking.children')}</span>
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setTempChildren(Math.max(0, tempChildren - 1))}
                                            className="w-8 h-8 rounded-lg border border-border hover:bg-muted font-bold text-foreground"
                                        >
                                            −
                                        </button>
                                        <span className="w-8 text-center font-medium">{tempChildren}</span>
                                        <button
                                            type="button"
                                            onClick={() => setTempChildren(tempChildren + 1)}
                                            className="w-8 h-8 rounded-lg border border-border hover:bg-muted font-bold text-foreground"
                                        >
                                            +
                                        </button>
                                    </div>
                                </div>
                                <Button onClick={handleGuestsApply} className="w-full bg-brand-primary hover:bg-brand-primary/90 text-white">
                                    {t('hotelDetail.booking.apply')}
                                </Button>
                            </div>
                        }
                    />
                </div>

                <p className="text-xs text-muted-foreground leading-relaxed pt-1">
                    Room totals come from the hotel calendar in{' '}
                    <span className="font-semibold text-foreground">Available rooms</span>
                     BookAddis does not add a separate price list.
                </p>

                <Button
                    onClick={onCheckAvailability}
                    className="w-full bg-brand-primary hover:bg-brand-primary/90 text-white font-bold py-3 rounded-xl min-h-[48px]"
                >
                    {t('hotelDetail.booking.checkAvailability')}
                </Button>
            </div>
        </div>
    );
};
