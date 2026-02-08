import React, { useState, useEffect } from 'react';
import { Calendar, Users, ChevronDown, Check, Info, Tag, Ban, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { formatCurrency } from '@/lib/currency';
import { formatDateEnglishStr } from '@/lib/date-utils';
import { sanitizeHtml } from '@/lib/utils/sanitize';
import { Hotel, RoomBlock, RoomDetails } from '@/types/api';
import axios from 'axios';

interface HotelDetailAvailabilityProps {
    hotel: Hotel;
    checkInDate?: string;
    checkOutDate?: string;
    adults?: number;
    childrenCount?: number;
    roomsCount?: number;
    onDateChange?: (checkIn: string, checkOut: string) => void;
    onGuestsChange?: (adults: number, children: number, rooms: number) => void;
    onBook?: (price?: number, serviceName?: string, externalItemId?: string) => void;
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
    onBook
}) => {
    const [rooms, setRooms] = useState<RoomBlock[]>([]);
    const [roomDetails, setRoomDetails] = useState<Record<string, RoomDetails>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Local state for interactive search
    const [tempCheckIn, setTempCheckIn] = useState<string>(checkInDate || '');
    const [tempCheckOut, setTempCheckOut] = useState<string>(checkOutDate || '');
    const [tempAdults, setTempAdults] = useState<number>(adults);
    const [tempChildren, setTempChildren] = useState<number>(childrenCount);
    const [tempRooms, setTempRooms] = useState<number>(roomsCount);
    const [isGuestSelectOpen, setIsGuestSelectOpen] = useState(false);

    useEffect(() => {
        if (checkInDate) setTempCheckIn(checkInDate);
        if (checkOutDate) setTempCheckOut(checkOutDate);
    }, [checkInDate, checkOutDate]);

    useEffect(() => {
        setTempAdults(adults);
        setTempChildren(childrenCount);
        setTempRooms(roomsCount);
    }, [adults, childrenCount, roomsCount]);

    useEffect(() => {
        const fetchRooms = async () => {
            try {
                setIsLoading(true);
                setError(null);
                const hotelId = hotel.id;
                if (!hotelId || !checkInDate || !checkOutDate) return;

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

                if (Array.isArray(data) && data.length > 0) {
                    const hotelData = data[0];
                    setRooms(hotelData.block || []);
                    setRoomDetails(hotelData.rooms || {});
                }
            } catch (err: any) {
                console.error('Error fetching rooms:', err);
                setError('Failed to load room availability. Please try again later.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchRooms();
    }, [hotel.id, checkInDate, checkOutDate, adults, childrenCount, roomsCount]);

    const handleSearchUpdate = () => {
        if (onDateChange) onDateChange(tempCheckIn, tempCheckOut);
        if (onGuestsChange) onGuestsChange(tempAdults, tempChildren, tempRooms);
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <Loader2 className="w-8 h-8 text-brand-primary animate-spin" />
                <p className="text-gray-500 font-medium">Checking availability...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-100 rounded-xl p-8 text-center">
                <p className="text-red-600 font-medium">{error}</p>
                <Button
                    variant="outline"
                    className="mt-4 border-red-200 text-red-600 hover:bg-red-50"
                    onClick={() => window.location.reload()}
                >
                    Retry
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6 pt-12 border-t border-gray-100">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-brand-dark">Availability</h2>
                <button className="text-brand-primary text-xs font-bold flex items-center gap-1 hover:underline">
                    <Tag className="w-3 h-3" />
                    We Price Match
                </button>
            </div>
            <div className="text-xs text-gray-500">Prices converted to {rooms[0]?.price_breakdown?.currency || 'USD'} <Info className="w-3 h-3 inline" /></div>

            {/* Search Bar */}
            <div className="flex flex-col md:grid md:grid-cols-4 gap-3 md:gap-1 p-3 md:p-1 bg-brand-primary/5 border border-brand-primary/10 rounded-2xl shadow-sm mb-6">
                <div className="md:col-span-1 bg-white p-3 md:p-2 rounded-xl md:rounded-lg flex items-center gap-2 border border-transparent hover:border-brand-primary/20 transition-all shadow-sm md:shadow-none">
                    <Popover
                        trigger={
                            <div className="flex items-center gap-3 md:gap-2 cursor-pointer w-full">
                                <Calendar className="w-5 h-5 md:w-4 md:h-4 text-brand-primary" />
                                <div className="flex flex-col md:block">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase md:hidden">Dates</span>
                                    <span className="text-xs md:text-[10px] font-bold text-brand-dark truncate">
                                        {formatDateEnglishStr(tempCheckIn)} — {formatDateEnglishStr(tempCheckOut)}
                                    </span>
                                </div>
                            </div>
                        }
                        content={
                            <div className="p-3 sm:p-4 bg-transparent rounded-2xl">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-[min(92vw,680px)]">
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2">Check-in</label>
                                        <CalendarComponent
                                            selected={tempCheckIn ? new Date(tempCheckIn) : undefined}
                                            onSelect={(date) => setTempCheckIn(date.toISOString().split('T')[0])}
                                            minDate={new Date()}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2">Check-out</label>
                                        <CalendarComponent
                                            selected={tempCheckOut ? new Date(tempCheckOut) : undefined}
                                            onSelect={(date) => setTempCheckOut(date.toISOString().split('T')[0])}
                                            minDate={tempCheckIn ? new Date(new Date(tempCheckIn).getTime() + 86400000) : new Date()}
                                        />
                                    </div>
                                </div>
                            </div>
                        }
                    />
                </div>
                <div className="md:col-span-2 bg-white p-3 md:p-2 rounded-xl md:rounded-lg flex items-center gap-2 border border-transparent hover:border-brand-primary/20 transition-all shadow-sm md:shadow-none">
                    <Popover
                        isOpen={isGuestSelectOpen}
                        onOpenChange={setIsGuestSelectOpen}
                        trigger={
                            <div className="flex items-center gap-3 md:gap-2 cursor-pointer w-full">
                                <Users className="w-5 h-5 md:w-4 md:h-4 text-brand-primary" />
                                <div className="flex flex-col md:block">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase md:hidden">Guests & Rooms</span>
                                    <span className="text-xs md:text-[10px] font-bold text-brand-dark">
                                        {tempAdults} adults • {tempChildren} children • {tempRooms} room
                                    </span>
                                </div>
                                <ChevronDown className="w-4 h-4 text-brand-primary ml-auto" />
                            </div>
                        }
                        content={
                            <div className="space-y-4 w-[min(92vw,320px)]">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium">Adults</span>
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setTempAdults(Math.max(1, tempAdults - 1)); }}
                                            className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors active:scale-95"
                                        >-</button>
                                        <span className="text-sm font-bold w-4 text-center">{tempAdults}</span>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setTempAdults(tempAdults + 1); }}
                                            className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors active:scale-95"
                                        >+</button>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium">Children</span>
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setTempChildren(Math.max(0, tempChildren - 1)); }}
                                            className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors active:scale-95"
                                        >-</button>
                                        <span className="text-sm font-bold w-4 text-center">{tempChildren}</span>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setTempChildren(tempChildren + 1); }}
                                            className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors active:scale-95"
                                        >+</button>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium">Rooms</span>
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setTempRooms(Math.max(1, tempRooms - 1)); }}
                                            className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors active:scale-95"
                                        >-</button>
                                        <span className="text-sm font-bold w-4 text-center">{tempRooms}</span>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setTempRooms(tempRooms + 1); }}
                                            className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors active:scale-95"
                                        >+</button>
                                    </div>
                                </div>
                                <Button
                                    className="w-full bg-brand-primary text-white text-xs h-11 rounded-xl"
                                    onClick={() => setIsGuestSelectOpen(false)}
                                >
                                    Done
                                </Button>
                            </div>
                        }
                    />
                </div>
                <Button
                    onClick={handleSearchUpdate}
                    className="bg-brand-primary hover:bg-brand-primary/90 text-white font-bold text-sm h-12 md:h-full rounded-xl md:rounded-lg transition-all active:scale-95 shadow-md shadow-brand-primary/20"
                >
                    Change search
                </Button>
            </div>

            {/* Mobile Cards (md:hidden) */}
            <div className="space-y-3 md:hidden">
                {rooms.length === 0 ? (
                    <div className="p-6 text-center text-gray-500 border border-gray-100 rounded-xl">No rooms available for the selected dates.</div>
                ) : (
                    rooms.map((block, index) => {
                        const details = roomDetails[block.room_id] || {};
                        return (
                            <div key={index} className="bg-white border border-gray-100 rounded-xl shadow-sm p-4">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <h3 className="text-base font-bold text-brand-dark leading-tight">
                                            {details.room_name || block.name_without_policy || 'Standard Room'}
                                        </h3>
                                        <div className="mt-1 text-[11px] text-gray-600">
                                            {details.bed_configurations?.[0]?.bed_types?.map((bed: any, i: number) => (
                                                <span key={i} className="mr-2 font-medium">{bed.name_with_count}</span>
                                            ))}
                                        </div>
                                        {details.highlights && details.highlights.length > 0 && (
                                            <div className="flex flex-wrap gap-1 mt-2">
                                                {details.highlights?.slice(0, 3).map((highlight: any, i: number) => (
                                                    <span key={i} className="px-2 py-0.5 bg-brand-primary/5 text-brand-primary border border-brand-primary/10 rounded-full text-[10px] font-bold">
                                                        {highlight.translated_name}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xl font-extrabold text-brand-dark">
                                            {formatCurrency(block.price_breakdown?.all_inclusive_price || 0, block.price_breakdown?.currency)}
                                        </div>
                                        <div className="text-[10px] text-gray-400 mt-0.5">
                                            {block.price_breakdown?.charges_details?.translated_copy || 'Includes taxes and charges'}
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-3 flex items-center justify-between">
                                    <div className="flex items-center gap-1">
                                        {Array.from({ length: block.nr_adults || 2 }).map((_, i) => (
                                            <Users key={i} className="w-4 h-4 text-brand-dark" />
                                        ))}
                                        {(block.nr_children ?? 0) > 0 && Array.from({ length: block.nr_children ?? 0 }).map((_, i) => (
                                            <Users key={i} className="w-3.5 h-3.5 text-gray-400" />
                                        ))}
                                        {block.extrabed_available && (
                                            <span className="ml-2 inline-flex items-center gap-1 text-[11px] text-green-600 font-semibold">
                                                <Check className="w-3 h-3" /> Extra bed
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="mt-3 space-y-2">
                                    {block.transactional_policy_objects?.slice(0, 2).map((policy: any, i: number) => (
                                        <div key={i} className="flex items-start gap-1 text-[12px] text-green-700 font-semibold">
                                            <Check className="w-3 h-3 mt-0.5" />
                                            <span dangerouslySetInnerHTML={{ __html: sanitizeHtml(policy.text) }} />
                                        </div>
                                    ))}
                                    {block.refundable === 0 && (
                                        <div className="flex items-start gap-1 text-[12px] text-red-500 font-medium">
                                            <Ban className="w-3 h-3 mt-0.5" />
                                            <span>Non-refundable</span>
                                        </div>
                                    )}
                                </div>

                                <div className="mt-4 flex items-center gap-3">
                                    <Select defaultValue="0">
                                        <SelectTrigger className="h-10 text-sm border-gray-200 rounded-lg w-[90px]">
                                            <SelectValue placeholder="Rooms" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="0">0</SelectItem>
                                            <SelectItem value="1">1</SelectItem>
                                            <SelectItem value="2">2</SelectItem>
                                        </SelectContent>
                                    </Select>

                                    <Button onClick={() => onBook?.(block.price_breakdown?.all_inclusive_price, details.room_name || block.name_without_policy || 'Standard Room')} className="flex-1 h-11 bg-brand-primary hover:bg-brand-primary/90 text-white font-bold text-sm rounded-xl shadow-md shadow-brand-primary/10 active:scale-95">
                                        Book now
                                    </Button>
                                </div>
                                <div className="text-center text-[11px] text-gray-400 mt-2">• You won't be charged yet</div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Table */}
            <div className="hidden md:block border border-brand-primary/20 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-brand-primary/10 text-brand-primary text-[12px] font-extrabold">
                            <th className="p-3 border-r border-brand-primary/10">Room Type</th>
                            <th className="p-3 border-r border-brand-primary/10">Guests</th>
                            <th className="p-3 border-r border-brand-primary/10">Price</th>
                            <th className="p-3 border-r border-brand-primary/10">Your choices</th>
                            <th className="p-3 border-r border-brand-primary/10">Select Rooms</th>
                            <th className="p-3"></th>
                        </tr>
                    </thead>
                    <tbody className="text-xs">
                        {rooms.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="p-8 text-center text-gray-500">
                                    No rooms available for the selected dates.
                                </td>
                            </tr>
                        ) : (
                            rooms.map((block, index) => {
                                const details = roomDetails[block.room_id] || {};
                                return (
                                    <tr key={index} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                                        <td className="p-3 border-r border-gray-100 align-top w-1/4">
                                            <button className="text-brand-primary font-bold hover:underline block mb-2 text-left">
                                                {details.room_name || block.name_without_policy || 'Standard Room'}
                                            </button>

                                            {block.extrabed_available && (
                                                <div className="text-green-600 font-bold flex items-center gap-1 mb-2 text-[10px]">
                                                    <Check className="w-3 h-3" />
                                                    Extra bed available
                                                </div>
                                            )}

                                            <div className="space-y-1 text-[10px] text-gray-600">
                                                {details.bed_configurations?.[0]?.bed_types?.map((bed: any, i: number) => (
                                                    <div key={i} className="flex items-center gap-1">
                                                        <span className="font-bold">{bed.name_with_count}</span>
                                                    </div>
                                                ))}
                                            </div>

                                            <div className="flex flex-wrap gap-1 mt-4">
                                                {details.highlights?.slice(0, 4).map((highlight: any, i: number) => (
                                                    <span key={i} className="px-1.5 py-0.5 bg-brand-primary/5 text-brand-primary border border-brand-primary/10 rounded-md text-[9px] font-bold">
                                                        {highlight.translated_name}
                                                    </span>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="p-3 border-r border-gray-100 align-top">
                                            <div className="flex gap-0.5">
                                                {Array.from({ length: block.nr_adults || 2 }).map((_, i) => (
                                                    <Users key={i} className="w-3 h-3 text-brand-dark" />
                                                ))}
                                                {(block.nr_children ?? 0) > 0 && Array.from({ length: block.nr_children ?? 0 }).map((_, i) => (
                                                    <Users key={i} className="w-2.5 h-2.5 text-gray-400" />
                                                ))}
                                            </div>
                                        </td>
                                        <td className="p-3 border-r border-gray-100 align-top">
                                            <div className="text-lg font-bold text-brand-dark">
                                                {formatCurrency(block.price_breakdown?.all_inclusive_price || 0, block.price_breakdown?.currency)}
                                            </div>
                                            <div className="text-[10px] text-gray-400">
                                                {block.price_breakdown?.charges_details?.translated_copy || 'Includes taxes and charges'}
                                            </div>
                                        </td>
                                        <td className="p-3 border-r border-gray-100 align-top space-y-2">
                                            {block.transactional_policy_objects?.map((policy: any, i: number) => (
                                                <div key={i} className="flex items-start gap-1 text-green-600 font-bold">
                                                    <Check className="w-3 h-3 mt-0.5" />
                                                    <span dangerouslySetInnerHTML={{ __html: sanitizeHtml(policy.text) }} />
                                                </div>
                                            ))}
                                            {block.refundable === 0 && (
                                                <div className="flex items-start gap-1 text-red-500">
                                                    <Ban className="w-3 h-3 mt-0.5" />
                                                    <span>Non-refundable</span>
                                                </div>
                                            )}
                                        </td>
                                        <td className="p-3 border-r border-gray-100 align-top">
                                            <Select defaultValue="0">
                                                <SelectTrigger className="w-16 h-8 text-xs border-gray-100 rounded-lg">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="0">0</SelectItem>
                                                    <SelectItem value="1">1</SelectItem>
                                                    <SelectItem value="2">2</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </td>
                                        <td className="p-3 align-middle bg-brand-primary/5">
                                            <Button onClick={() => onBook?.(block.price_breakdown?.all_inclusive_price, details.room_name || block.name_without_policy || 'Standard Room', block.block_id || block.room_id)} className="w-full bg-brand-primary hover:bg-brand-primary/90 text-white font-bold text-sm py-2 rounded-lg shadow-md shadow-brand-primary/10 transition-all active:scale-95">
                                                Book now
                                            </Button>
                                            <div className="text-center text-[10px] text-gray-400 mt-2">• You won't be charged yet</div>
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

