import React, { useState, useEffect } from 'react';
import { Users, Check, Info, Tag, Ban, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatCurrency } from '@/lib/currency';
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
    onBook
}) => {
    const [rooms, setRooms] = useState<RoomBlock[]>([]);
    const [roomDetails, setRoomDetails] = useState<Record<string, RoomDetails>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

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
            <div className="text-xs text-gray-500 mb-6">Prices converted to {rooms[0]?.price_breakdown?.currency || 'USD'} <Info className="w-3 h-3 inline" /></div>

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

                                    <Button onClick={() => onBook?.(block.price_breakdown?.all_inclusive_price, details.room_name || block.name_without_policy || 'Standard Room', block.block_id || block.room_id)} className="flex-1 h-11 bg-brand-primary hover:bg-brand-primary/90 text-white font-bold text-sm rounded-xl shadow-md shadow-brand-primary/10 active:scale-95">
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
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm ring-1 ring-gray-900/5">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50/50 border-b border-gray-100">
                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Accommodation Type</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Guests</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Today's Price</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Your Choices</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Select Rooms</th>
                            <th className="px-6 py-4 bg-brand-primary/5"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {rooms.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center text-gray-400 font-medium">
                                    No rooms available for the selected dates.
                                </td>
                            </tr>
                        ) : (
                            rooms.map((block, index) => {
                                const details = roomDetails[block.room_id] || {};
                                return (
                                    <tr key={index} className="group hover:bg-gray-50/50 transition-all duration-200">
                                        {/* Room Type */}
                                        <td className="px-6 py-6 align-top max-w-[300px]">
                                            <button className="text-brand-primary font-bold hover:text-brand-primary/80 transition-colors block mb-1.5 text-base text-left leading-tight decoration-brand-primary/30 decoration-2 underline-offset-4 hover:underline">
                                                {details.room_name || block.name_without_policy || 'Standard Room'}
                                            </button>

                                            {block.extrabed_available && (
                                                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-green-50 text-green-700 font-bold text-[10px] mb-3">
                                                    <Check className="w-3 h-3" />
                                                    Extra bed available
                                                </div>
                                            )}

                                            <div className="flex flex-col gap-1.5 mt-2">
                                                {details.bed_configurations?.[0]?.bed_types?.map((bed: any, i: number) => (
                                                    <div key={i} className="flex items-center gap-2 text-[11px] text-gray-500">
                                                        <div className="w-4 h-4 rounded-full bg-gray-100 flex items-center justify-center">
                                                            <Check className="w-2.5 h-2.5 text-gray-400" />
                                                        </div>
                                                        <span className="font-medium">{bed.name_with_count}</span>
                                                    </div>
                                                ))}
                                            </div>

                                            <div className="flex flex-wrap gap-1.5 mt-5">
                                                {details.highlights?.slice(0, 4).map((highlight: any, i: number) => (
                                                    <span key={i} className="px-2 py-0.5 bg-gray-50 text-gray-500 border border-gray-200 rounded-md text-[9px] font-bold group-hover:border-brand-primary/20 group-hover:text-brand-primary group-hover:bg-brand-primary/5 transition-all">
                                                        {highlight.translated_name}
                                                    </span>
                                                ))}
                                            </div>
                                        </td>

                                        {/* Guests */}
                                        <td className="px-6 py-6 align-top">
                                            <div className="flex items-center justify-center gap-1">
                                                {Array.from({ length: block.nr_adults || 2 }).map((_, i) => (
                                                    <Users key={i} className="w-4 h-4 text-brand-dark opacity-70" />
                                                ))}
                                                {(block.nr_children ?? 0) > 0 && Array.from({ length: block.nr_children ?? 0 }).map((_, i) => (
                                                    <Users key={i} className="w-3.5 h-3.5 text-gray-300" />
                                                ))}
                                            </div>
                                        </td>

                                        {/* Price */}
                                        <td className="px-6 py-6 align-top min-w-[150px]">
                                            <div className="text-xl font-extrabold text-brand-dark tracking-tight">
                                                {formatCurrency(block.price_breakdown?.all_inclusive_price || 0, block.price_breakdown?.currency)}
                                            </div>
                                            <div className="text-[10px] font-medium text-gray-400 mt-0.5 leading-tight">
                                                {block.price_breakdown?.charges_details?.translated_copy || 'Includes taxes and charges'}
                                            </div>
                                        </td>

                                        {/* Your Choices */}
                                        <td className="px-6 py-6 align-top space-y-3">
                                            {block.transactional_policy_objects?.map((policy: any, i: number) => (
                                                <div key={i} className="flex items-start gap-2 text-[12px] text-green-700 font-bold leading-snug">
                                                    <div className="mt-0.5 shrink-0">
                                                        <Check className="w-3.5 h-3.5 text-green-600" />
                                                    </div>
                                                    <span dangerouslySetInnerHTML={{ __html: sanitizeHtml(policy.text) }} />
                                                </div>
                                            ))}
                                            {block.refundable === 0 && (
                                                <div className="flex items-start gap-2 text-[12px] text-red-500 font-bold leading-snug">
                                                    <div className="mt-0.5 shrink-0">
                                                        <Ban className="w-3.5 h-3.5" />
                                                    </div>
                                                    <span>Non-refundable</span>
                                                </div>
                                            )}
                                        </td>

                                        {/* Select Rooms */}
                                        <td className="px-6 py-6 align-top">
                                            <Select defaultValue="0">
                                                <SelectTrigger className="w-20 h-10 text-sm font-bold border-gray-200 rounded-xl focus:ring-brand-primary/20">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-xl border-gray-100 shadow-xl">
                                                    <SelectItem value="0" className="text-sm font-medium">0</SelectItem>
                                                    <SelectItem value="1" className="text-sm font-medium font-bold text-brand-primary">1</SelectItem>
                                                    <SelectItem value="2" className="text-sm font-medium">2</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </td>

                                        {/* Action */}
                                        <td className="px-6 py-6 align-middle bg-brand-primary/[0.02] group-hover:bg-brand-primary/[0.04] transition-colors">
                                            <div className="flex flex-col gap-2">
                                                <Button
                                                    onClick={() => onBook?.(block.price_breakdown?.all_inclusive_price, details.room_name || block.name_without_policy || 'Standard Room', block.block_id || block.room_id)}
                                                    className="w-full bg-brand-primary hover:bg-brand-primary/90 text-white font-bold text-sm py-3 rounded-xl shadow-lg shadow-brand-primary/10 transition-all active:scale-[0.98] group-hover:translate-y-[-1px]"
                                                >
                                                    Book now
                                                </Button>
                                                <div className="text-center text-[10px] font-bold text-gray-400">
                                                    <span className="text-green-600 mr-1">●</span>
                                                    Free cancellation
                                                </div>
                                            </div>
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

