"use client";

import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Users, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { formatCurrency } from '@/lib/currency';
import { parseDateLocal, formatDateLocal } from '@/lib/date-utils';

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

function formatShortDate(dateStr: string): string {
    if (!dateStr) return 'Select date';
    const d = parseDateLocal(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
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

    const price = hotel?.price ?? 150;
    const total = price; // 1 night
    const guestLabel = `${adults} guest${adults !== 1 ? 's' : ''}`;

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
        <div className="bg-white rounded-2xl border border-gray-100 shadow-lg overflow-hidden">
            {/* Best Price Guarantee - mockup header */}
            <div className="px-6 py-4 border-b border-gray-100">
                <span className="text-xs font-bold text-teal-600 uppercase tracking-wider">Best Price Guarantee</span>
            </div>

            <div className="p-6 space-y-4">
                {/* Check-in - mockup: date field with calendar */}
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Check In</label>
                    <Popover
                        isOpen={isCheckInOpen}
                        onOpenChange={setIsCheckInOpen}
                        trigger={
                            <div className="flex items-center gap-3 w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl hover:bg-white hover:border-teal-600/40 transition-all cursor-pointer">
                                <CalendarIcon className="w-5 h-5 text-teal-600 shrink-0" />
                                <span className="text-gray-900 font-medium">
                                    {checkIn ? formatShortDate(checkIn) : 'Select date'}
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

                {/* Check-out - mockup: date field with calendar */}
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Check Out</label>
                    <Popover
                        isOpen={isCheckOutOpen}
                        onOpenChange={setIsCheckOutOpen}
                        trigger={
                            <div className="flex items-center gap-3 w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl hover:bg-white hover:border-teal-600/40 transition-all cursor-pointer">
                                <CalendarIcon className="w-5 h-5 text-teal-600 shrink-0" />
                                <span className="text-gray-900 font-medium">
                                    {checkOut ? formatShortDate(checkOut) : 'Select date'}
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

                {/* Guest selector - mockup */}
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Guests</label>
                    <Popover
                        isOpen={isGuestOpen}
                        onOpenChange={setIsGuestOpen}
                        trigger={
                            <div className="flex items-center gap-3 w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl hover:bg-white hover:border-teal-600/40 transition-all cursor-pointer">
                                <Users className="w-5 h-5 text-teal-600 shrink-0" />
                                <span className="text-gray-900 font-medium flex-1">{guestLabel}</span>
                                <ChevronDown className="w-4 h-4 text-gray-500" />
                            </div>
                        }
                        content={
                            <div className="p-4 w-64 space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium">Adults</span>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setTempAdults(Math.max(1, tempAdults - 1))}
                                            className="w-8 h-8 rounded-lg border border-gray-200 hover:bg-gray-50 font-bold"
                                        >
                                            −
                                        </button>
                                        <span className="w-8 text-center font-medium">{tempAdults}</span>
                                        <button
                                            onClick={() => setTempAdults(tempAdults + 1)}
                                            className="w-8 h-8 rounded-lg border border-gray-200 hover:bg-gray-50 font-bold"
                                        >
                                            +
                                        </button>
                                    </div>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium">Children</span>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setTempChildren(Math.max(0, tempChildren - 1))}
                                            className="w-8 h-8 rounded-lg border border-gray-200 hover:bg-gray-50 font-bold"
                                        >
                                            −
                                        </button>
                                        <span className="w-8 text-center font-medium">{tempChildren}</span>
                                        <button
                                            onClick={() => setTempChildren(tempChildren + 1)}
                                            className="w-8 h-8 rounded-lg border border-gray-200 hover:bg-gray-50 font-bold"
                                        >
                                            +
                                        </button>
                                    </div>
                                </div>
                                <Button onClick={handleGuestsApply} className="w-full bg-teal-600 hover:bg-teal-700 text-white">
                                    Apply
                                </Button>
                            </div>
                        }
                    />
                </div>

                {/* Price breakdown - mockup */}
                <div className="pt-4 border-t border-gray-100 space-y-2">
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Price for 1 room, 1 night</span>
                        <span className="font-bold text-gray-900">{formatCurrency(price)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Taxes & fees</span>
                        <span className="text-gray-500">Included</span>
                    </div>
                    <div className="flex justify-between text-base font-bold pt-2">
                        <span>Total</span>
                        <span className="text-teal-600">{formatCurrency(total)}</span>
                    </div>
                </div>

                {/* Check Availability button - mockup */}
                <Button
                    onClick={onCheckAvailability}
                    className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 rounded-xl min-h-[48px]"
                >
                    Check Availability
                </Button>
            </div>
        </div>
    );
};
