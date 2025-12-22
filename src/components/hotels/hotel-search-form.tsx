"use client";

import React from 'react';
import { MapPin, Calendar as CalendarIcon, Users, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { LocationInput } from '@/components/search/location-input';
import { GuestSelector } from '@/components/search/guest-selector';
import { Calendar } from '@/components/ui/calendar';
import { Popover } from '@/components/ui/popover';

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

    const handleDateSelect = (date: Date, type: 'checkIn' | 'checkOut') => {
        const isoDate = date.toISOString().split('T')[0];
        if (type === 'checkIn') onCheckInChange(isoDate);
        else onCheckOutChange(isoDate);
    };

    return (
        <Card className="p-6 shadow-xl mb-12 bg-white rounded-2xl border-0 overflow-visible">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                <div className="md:col-span-4">
                    <LocationInput
                        value={destination}
                        onChange={onDestinationChange}
                        api="hotels"
                    />
                </div>
                <div className="md:col-span-2">
                    <Popover
                        trigger={
                            <div className="w-full cursor-pointer">
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Check-in</label>
                                <div className="flex items-center gap-3 w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl hover:bg-white hover:border-brand-primary/50 transition-all group">
                                    <CalendarIcon className="w-5 h-5 text-gray-400 group-hover:text-brand-primary transition-colors" />
                                    <span className="text-gray-900 font-medium">{checkIn || 'Select Date'}</span>
                                </div>
                            </div>
                        }
                        content={
                            <Calendar
                                selected={checkIn ? new Date(checkIn) : undefined}
                                onSelect={(date) => handleDateSelect(date, 'checkIn')}
                                minDate={new Date()}
                            />
                        }
                    />
                </div>
                <div className="md:col-span-2">
                    <Popover
                        trigger={
                            <div className="w-full cursor-pointer">
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Check-out</label>
                                <div className="flex items-center gap-3 w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl hover:bg-white hover:border-brand-primary/50 transition-all group">
                                    <CalendarIcon className="w-5 h-5 text-gray-400 group-hover:text-brand-primary transition-colors" />
                                    <span className="text-gray-900 font-medium">{checkOut || 'Select Date'}</span>
                                </div>
                            </div>
                        }
                        content={
                            <Calendar
                                selected={checkOut ? new Date(checkOut) : undefined}
                                onSelect={(date) => handleDateSelect(date, 'checkOut')}
                                minDate={checkIn ? new Date(checkIn) : new Date()}
                            />
                        }
                    />
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
                        className="w-full h-[50px] flex items-center justify-center gap-2 text-white font-bold text-lg shadow-lg shadow-brand-primary/30 hover:shadow-brand-primary/50 transition-all"
                    >
                        {isLoading ? 'Searching...' : <><Search className="w-5 h-5" /> Search</>}
                    </Button>
                </div>
            </div>
        </Card>
    );
};
