"use client";

import React, { useState } from 'react';
import { useFlightSeatMap } from '@/hooks/use-flights';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/currency';
import { Plane, Info, CheckCircle2, XCircle } from 'lucide-react';

interface SeatMapProps {
    offerToken: string;
    currencyCode?: string;
    onSelectSeat?: (seat: any) => void;
}

export function SeatMap({ offerToken, currencyCode = 'USD', onSelectSeat }: SeatMapProps) {
    const { data: seatMapData, isLoading, error } = useFlightSeatMap(offerToken, currencyCode);
    const [selectedSeat, setSelectedSeat] = useState<any>(null);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <div className="w-10 h-10 border-4 border-brand-primary/20 border-t-brand-primary rounded-full animate-spin"></div>
                <p className="text-sm text-gray-500 font-medium">Loading seat map...</p>
            </div>
        );
    }

    if (error || !seatMapData?.status) {
        return (
            <div className="text-center py-12 bg-red-50 rounded-3xl border border-red-100">
                <XCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
                <h4 className="text-lg font-bold text-gray-900 mb-1">Seat map unavailable</h4>
                <p className="text-sm text-gray-500 max-w-xs mx-auto">
                    We couldn't load the seat map for this flight. You can still proceed with the booking.
                </p>
            </div>
        );
    }

    const seatMap = seatMapData?.data;
    const options = seatMap?.seatMapOption || [];

    // For simplicity, we'll show the first option (usually the only one)
    const currentOption = options[0];
    const cabins = currentOption?.cabins || [];

    const handleSeatClick = (seat: any) => {
        if (seat.priceBreakdown) {
            setSelectedSeat(seat);
            onSelectSeat?.(seat);
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h4 className="text-lg font-black text-gray-900">Select Your Seat</h4>
                    <p className="text-xs text-gray-500 font-medium uppercase tracking-widest mt-0.5">Choose your preferred spot</p>
                </div>
                {selectedSeat && (
                    <div className="flex items-center gap-3 bg-brand-primary/5 px-4 py-2 rounded-2xl border border-brand-primary/10 animate-in fade-in slide-in-from-right-4">
                        <div className="text-right">
                            <div className="text-[10px] font-bold text-brand-primary uppercase tracking-wider">Selected</div>
                            <div className="text-sm font-black text-gray-900">Seat {selectedSeat.colId}{selectedSeat.rowId}</div>
                        </div>
                        <div className="w-10 h-10 bg-brand-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-brand-primary/20">
                            <CheckCircle2 className="w-5 h-5" />
                        </div>
                    </div>
                )}
            </div>

            <div className="bg-gray-50 rounded-3xl p-6 md:p-8 border border-gray-100 overflow-x-auto custom-scrollbar">
                <div className="min-w-[600px] flex flex-col items-center">
                    {/* Plane Nose */}
                    <div className="w-48 h-24 bg-white border-2 border-gray-200 rounded-t-[100px] mb-8 relative flex items-center justify-center">
                        <Plane className="w-8 h-8 text-gray-200 rotate-180" />
                        <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-full h-4 bg-white border-x-2 border-gray-200"></div>
                    </div>

                    {cabins.map((cabin: any, cidx: number) => (
                        <div key={cidx} className="w-full space-y-10">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="h-[1px] flex-1 bg-gray-200"></div>
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{cabin.class} CLASS</span>
                                <div className="h-[1px] flex-1 bg-gray-200"></div>
                            </div>

                            <div className="space-y-2">
                                {/* Column Headers */}
                                <div className="flex justify-center gap-2 mb-4">
                                    <div className="w-10"></div> {/* Row number spacer */}
                                    {cabin.columns.map((col: any) => (
                                        <div key={col.id} className="w-10 text-center text-[10px] font-bold text-gray-400 uppercase">
                                            {col.id}
                                        </div>
                                    ))}
                                </div>

                                {cabin.rows.map((row: any) => (
                                    <div key={row.id} className="flex justify-center gap-2 group">
                                        <div className="w-10 flex items-center justify-center text-[10px] font-bold text-gray-400">
                                            {row.id}
                                        </div>
                                        {cabin.columns.map((col: any) => {
                                            const seat = row.seats.find((s: any) => s.colId === col.id);
                                            const isAvailable = !!seat?.priceBreakdown;
                                            const isSelected = selectedSeat?.colId === col.id && selectedSeat?.rowId === row.id;

                                            return (
                                                <div
                                                    key={col.id}
                                                    onClick={() => isAvailable && handleSeatClick({ ...seat, rowId: row.id })}
                                                    className={`
                                                        w-10 h-10 rounded-lg border-2 transition-all cursor-pointer flex items-center justify-center relative group/seat
                                                        ${isSelected
                                                            ? 'bg-brand-primary border-brand-primary text-white shadow-lg shadow-brand-primary/20 scale-110 z-10'
                                                            : isAvailable
                                                                ? 'bg-white border-gray-200 hover:border-brand-primary hover:shadow-md'
                                                                : 'bg-gray-100 border-gray-100 cursor-not-allowed opacity-40'}
                                                    `}
                                                >
                                                    {isAvailable && !isSelected && (
                                                        <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-brand-dark text-white text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover/seat:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20">
                                                            {formatCurrency(seat.priceBreakdown.total.units)}
                                                        </div>
                                                    )}
                                                    <div className={`w-6 h-7 rounded-t-md border-t-2 ${isSelected ? 'border-white/40' : 'border-gray-100'}`}></div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}

                    {/* Plane Tail */}
                    <div className="w-48 h-12 bg-white border-2 border-t-0 border-gray-200 rounded-b-xl mt-12"></div>
                </div>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center justify-center gap-6 pt-4">
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-white border-2 border-gray-200"></div>
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Available</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-brand-primary border-2 border-brand-primary"></div>
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Selected</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-gray-100 border-2 border-gray-100 opacity-40"></div>
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Occupied</span>
                </div>
            </div>
        </div>
    );
}
