"use client";

import React from 'react';
import { MapPin, Calendar as CalendarIcon, Users, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { LocationInput } from '@/components/search/location-input';
import { GuestSelector } from '@/components/search/guest-selector';
import { Calendar } from '@/components/ui/calendar';
import { Popover } from '@/components/ui/popover';
import { formatDateLocal, parseDateLocal } from '@/lib/date-utils';

interface HotelSearchFormProps {
    destination: string;
    checkIn: string;
    checkOut: string;
    isLoading: boolean;
    onDestinationChange: (value: string) => void;
    onCheckInChange: (value: string) => void;
    onCheckOutChange: (value: string) => void;
    onSearch: () => void;
}

export const HotelSearchForm: React.FC<HotelSearchFormProps> = ({
    destination,
    checkIn,
    checkOut,
    isLoading,
    onDestinationChange,
    onCheckInChange,
    onCheckOutChange,
    onSearch,
}) => {
    const [guests, setGuests] = React.useState({ adults: 2, children: 0, rooms: 1 });

    return (
        <Card className="p-4 md:p-6 shadow-xl mb-8 md:mb-12 bg-white rounded-2xl border-0 overflow-visible relative z-50">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-4 items-end">
                <div className="md:col-span-4">
                    <LocationInput
                        label="Destination"
                        placeholder="Where are you going?"
                        value={destination}
                        onChange={onDestinationChange}
                        api="hotels"
                    />
                </div>
                <div className="md:col-span-4">
                    <div className="grid grid-cols-2 gap-3">
                        <Popover
                            trigger={
                                <div className="w-full cursor-pointer">
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Check-in</label>
                                    <div className="flex items-center gap-3 w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl hover:bg-white hover:border-brand-primary/50 transition-all group">
                                        <CalendarIcon className="w-5 h-5 text-gray-400 group-hover:text-brand-primary transition-colors" />
                                        <span className="text-gray-900 font-medium text-sm truncate">{checkIn || 'Select Date'}</span>
                                    </div>
                                </div>
                            }
                            content={
                                <div className="w-full">
                                    <Calendar
                                        selected={checkIn ? parseDateLocal(checkIn) : undefined}
                                        onSelect={(date) => onCheckInChange(formatDateLocal(date))}
                                        minDate={new Date()}
                                    />
                                </div>
                            }
                        />
                        <Popover
                            trigger={
                                <div className="w-full cursor-pointer">
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Check-out</label>
                                    <div className="flex items-center gap-3 w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl hover:bg-white hover:border-brand-primary/50 transition-all group">
                                        <CalendarIcon className="w-5 h-5 text-gray-400 group-hover:text-brand-primary transition-colors" />
                                        <span className="text-gray-900 font-medium text-sm truncate">{checkOut || 'Select Date'}</span>
                                    </div>
                                </div>
                            }
                            content={
                                <div className="w-full">
                                    <Calendar
                                        selected={checkOut ? parseDateLocal(checkOut) : undefined}
                                        onSelect={(date) => onCheckOutChange(formatDateLocal(date))}
                                        minDate={checkIn ? parseDateLocal(checkIn) : new Date()}
                                    />
                                </div>
                            }
                        />
                    </div>
                </div>
                <div className="md:col-span-2">
                    <GuestSelector
                        adults={guests.adults}
                        children={guests.children}
                        rooms={guests.rooms}
                        onChange={(a, c, r) => setGuests({ adults: a, children: c, rooms: r })}
                    />
                </div>
                <div className="md:col-span-2">
                    <Button
                        onClick={onSearch}
                        disabled={isLoading}
                        className="w-full h-[52px] flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg rounded-xl shadow-lg shadow-blue-600/20 transition-all"
                    >
                        {isLoading ? 'Searching...' : <><Search className="w-5 h-5" /> Search</>}
                    </Button>
                </div>
            </div>
        </Card>
    );
};
