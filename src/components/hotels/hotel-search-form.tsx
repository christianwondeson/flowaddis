"use client";

import React from 'react';
import { MapPin, Calendar as CalendarIcon, Users, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { LocationInput } from '@/components/search/location-input';
import { GuestSelector } from '@/components/search/guest-selector';
import { Calendar } from '@/components/ui/calendar';
import { Popover } from '@/components/ui/popover';
import { formatDateLocal, parseDateLocal, formatDateEnglishStr } from '@/lib/date-utils';

interface HotelSearchFormProps {
    destination: string;
    checkIn: string;
    checkOut: string;
    guests: { adults: number; children: number; rooms: number };
    isLoading: boolean;
    onDestinationChange: (value: string) => void;
    onCheckInChange: (value: string) => void;
    onCheckOutChange: (value: string) => void;
    onGuestsChange: (value: { adults: number; children: number; rooms: number }) => void;
    onSearch: () => void;
    /** When true on mobile, shows the detailed panel by default */
    initialOpen?: boolean;
    onLocationSelect?: (location: any) => void;
}

export const HotelSearchForm: React.FC<HotelSearchFormProps> = ({
    destination,
    checkIn,
    checkOut,
    guests,
    isLoading,
    onDestinationChange,
    onLocationSelect,
    onCheckInChange,
    onCheckOutChange,
    onGuestsChange,
    onSearch,
    initialOpen = false,
}) => {
    const [mobileOpen, setMobileOpen] = React.useState<boolean>(initialOpen);
    const [showCI, setShowCI] = React.useState(false);
    const [showCO, setShowCO] = React.useState(false);
    const ciRef = React.useRef<HTMLDivElement | null>(null);
    const coRef = React.useRef<HTMLDivElement | null>(null);
    const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);

    const datesSummary = React.useMemo(() => {
        if (checkIn && checkOut) return `${formatDateEnglishStr(checkIn)} - ${formatDateEnglishStr(checkOut)}`;
        if (checkIn) return `${formatDateEnglishStr(checkIn)} - Select`;
        if (checkOut) return `Select - ${formatDateEnglishStr(checkOut)}`;
        return 'Select dates';
    }, [checkIn, checkOut]);

    const guestsSummary = React.useMemo(() => `${guests.adults} adults`, [guests]);

    const handleSearchClick = () => {
        onSearch();
        // Collapse mobile panel after search
        setMobileOpen(false);
        setShowCI(false);
        setShowCO(false);
    };

    // Close inline calendars when clicking outside
    React.useEffect(() => {
        const onDocClick = (e: MouseEvent) => {
            const target = e.target as Node;
            if (showCI && ciRef.current && !ciRef.current.contains(target)) setShowCI(false);
            if (showCO && coRef.current && !coRef.current.contains(target)) setShowCO(false);
        };
        document.addEventListener('mousedown', onDocClick);
        return () => document.removeEventListener('mousedown', onDocClick);
    }, [showCI, showCO]);

    return (
        <Card className="p-4 md:p-6 shadow-xl mb-4 md:mb-6 bg-white rounded-2xl border-0 overflow-visible relative z-50">
            {/* Mobile compact bar */}
            <div className="md:hidden">
                {!mobileOpen && (
                    <button
                        type="button"
                        onClick={() => setMobileOpen(true)}
                        className="w-full text-left bg-white border-2 border-brand-primary rounded-2xl px-4 py-3 shadow-sm"
                        aria-label="Open hotel search"
                    >
                        <div className="flex items-start gap-3">
                            <div className="pt-0.5 text-gray-500">
                                <Search className="w-4 h-4" />
                            </div>
                            <div className="flex-1">
                                <div className="text-base font-extrabold text-gray-900">{destination || 'Addis Ababa'}</div>
                                <div className="text-[12px] text-gray-600 mt-0.5 flex items-center gap-2">
                                    <span>{datesSummary}</span>
                                    <span>·</span>
                                    <span>{guestsSummary}</span>
                                </div>
                            </div>
                        </div>
                    </button>
                )}

                {mobileOpen && (
                    <div className="mt-3 relative z-[80]">
                        <div className="w-full bg-white rounded-2xl p-2 border border-gray-200">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-2 py-2 flex-1 border border-gray-200">
                                    <Search className="w-4 h-4 text-gray-500" />
                                    <LocationInput
                                        label={undefined as any}
                                        placeholder="Destination"
                                        value={destination}
                                        onChange={onDestinationChange}
                                        onSelectLocation={onLocationSelect}
                                        api="hotels"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-1 mb-2">
                                <div className="w-full relative" ref={ciRef}>
                                    <button type="button" onClick={() => { setShowCI((s) => !s); setShowCO(false); }} className="w-full text-left">
                                        <div className="text-[11px] font-bold text-gray-800 mb-1">Check-in date</div>
                                        <div className="flex items-center gap-2 w-full px-2 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                                            <CalendarIcon className="w-4 h-4 text-gray-400" />
                                            <span className="text-gray-900 text-[13px] truncate">{checkIn ? formatDateEnglishStr(checkIn) : 'Select Date'}</span>
                                        </div>
                                    </button>
                                    {showCI && (
                                        <div className="absolute mt-1 z-[100] bg-white border border-gray-200 rounded-xl shadow-xl p-2 max-h-[60vh] overflow-auto 
                                                    left-1/2 -translate-x-1/2 transform w-[min(100vw-2rem,22rem)] sm:left-0 sm:translate-x-0 sm:w-auto">
                                            <Calendar
                                                selected={checkIn ? parseDateLocal(checkIn) : undefined}
                                                onSelect={(date) => {
                                                    if (!date) return;
                                                    onCheckInChange(formatDateLocal(date));
                                                    setShowCI(false);
                                                    setShowCO(true);
                                                }}
                                                minDate={new Date()}
                                            />
                                        </div>
                                    )}
                                </div>
                                <div className="w-full relative" ref={coRef}>
                                    <button type="button" onClick={() => { setShowCO((s) => !s); setShowCI(false); }} className="w-full text-left">
                                        <div className="text-[11px] font-bold text-gray-800 mb-1">Check-out date</div>
                                        <div className="flex items-center gap-2 w-full px-2 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                                            <CalendarIcon className="w-4 h-4 text-gray-400" />
                                            <span className="text-gray-900 text-[13px] truncate">{checkOut ? formatDateEnglishStr(checkOut) : 'Select Date'}</span>
                                        </div>
                                    </button>
                                    {showCO && (
                                        <div className="absolute mt-1 z-[100] bg-white border border-gray-200 rounded-xl shadow-xl p-2 max-h-[60vh] overflow-auto 
                                                    left-1/2 -translate-x-1/2 transform w-[min(100vw-2rem,22rem)] sm:left-0 sm:translate-x-0 sm:w-auto">
                                            <Calendar
                                                selected={checkOut ? parseDateLocal(checkOut) : undefined}
                                                onSelect={(date) => {
                                                    if (!date) return;
                                                    onCheckOutChange(formatDateLocal(date));
                                                    setShowCO(false);
                                                }}
                                                minDate={(checkIn ? addDays(parseDateLocal(checkIn), 1) : addDays(new Date(), 1))}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-1 mb-2">
                                <GuestSelector
                                    adults={guests.adults}
                                    children={guests.children}
                                    rooms={guests.rooms}
                                    onChange={(a, c, r) => onGuestsChange({ adults: a, children: c, rooms: r })}
                                />
                            </div>

                            <Button
                                onClick={handleSearchClick}
                                disabled={isLoading}
                                className="w-full h-[44px] flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[15px] rounded-xl shadow-lg shadow-blue-600/20"
                            >
                                {isLoading ? 'Searching...' : (<><Search className="w-5 h-5" /> Search</>)}
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            {/* Desktop form */}
            <div className="hidden md:grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-4 items-end">
                <div className="md:col-span-4">
                    <LocationInput
                        label="Destination"
                        placeholder="Where are you going?"
                        value={destination}
                        onChange={onDestinationChange}
                        onSelectLocation={onLocationSelect}
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
                                        <span className="text-gray-900 font-medium text-sm truncate">{checkIn ? formatDateEnglishStr(checkIn) : 'Select Date'}</span>
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
                                        <span className="text-gray-900 font-medium text-sm truncate">{checkOut ? formatDateEnglishStr(checkOut) : 'Select Date'}</span>
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
                        onChange={(a, c, r) => onGuestsChange({ adults: a, children: c, rooms: r })}
                    />
                </div>
                <div className="md:col-span-2">
                    <Button
                        onClick={handleSearchClick}
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
