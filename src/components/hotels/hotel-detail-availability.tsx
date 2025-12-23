"use client";

import React from 'react';
import { Calendar, Users, ChevronDown, Check, Info, Tag, Ban } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface HotelDetailAvailabilityProps {
    hotel: any;
}

export const HotelDetailAvailability: React.FC<HotelDetailAvailabilityProps> = ({ hotel }) => {
    return (
        <div className="space-y-6 pt-12 border-t border-gray-100">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-brand-dark">Availability</h2>
                <button className="text-brand-primary text-xs font-bold flex items-center gap-1 hover:underline">
                    <Tag className="w-3 h-3" />
                    We Price Match
                </button>
            </div>
            <div className="text-xs text-gray-500">Prices converted to USD <Info className="w-3 h-3 inline" /></div>

            {/* Search Bar */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-1 p-1 bg-brand-primary/5 border border-brand-primary/10 rounded-xl shadow-sm">
                <div className="md:col-span-1 bg-white p-2 rounded-lg flex items-center gap-2 cursor-pointer border border-transparent hover:border-brand-primary/20 transition-all">
                    <Calendar className="w-4 h-4 text-brand-primary" />
                    <span className="text-xs font-bold text-brand-dark">Sun, Jan 4 — Wed, Jan 7</span>
                </div>
                <div className="md:col-span-2 bg-white p-2 rounded-lg flex items-center gap-2 cursor-pointer border border-transparent hover:border-brand-primary/20 transition-all">
                    <Users className="w-4 h-4 text-brand-primary" />
                    <span className="text-xs font-bold text-brand-dark">2 adults • 0 children • 1 room</span>
                    <ChevronDown className="w-4 h-4 text-brand-primary ml-auto" />
                </div>
                <Button className="bg-brand-primary hover:bg-brand-primary/90 text-white font-bold text-sm h-full rounded-lg transition-all active:scale-95">
                    Change search
                </Button>
            </div>

            {/* Table */}
            <div className="border border-brand-primary/20 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-brand-primary/10 text-brand-primary text-[11px] font-bold">
                            <th className="p-3 border-r border-brand-primary/10">Apartment Type</th>
                            <th className="p-3 border-r border-brand-primary/10">Number of guests</th>
                            <th className="p-3 border-r border-brand-primary/10">Price for 3 nights</th>
                            <th className="p-3 border-r border-brand-primary/10">Your choices</th>
                            <th className="p-3 border-r border-brand-primary/10">Select an Apartment</th>
                            <th className="p-3"></th>
                        </tr>
                    </thead>
                    <tbody className="text-xs">
                        <tr className="border-b border-gray-100">
                            <td className="p-3 border-r border-gray-100 align-top w-1/4">
                                <button className="text-brand-primary font-bold hover:underline block mb-2">Two-Bedroom Apartment</button>
                                <div className="text-red-600 font-bold flex items-center gap-1 mb-3">
                                    <Info className="w-3 h-3" />
                                    We have 2 left
                                </div>
                                <div className="space-y-1 text-[10px] text-gray-600">
                                    <div className="flex items-center gap-1">
                                        <span className="font-bold">Bedroom 1:</span> 1 king bed
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <span className="font-bold">Bedroom 2:</span> 1 queen bed
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-1 mt-4">
                                    {['Entire apartment', '112 m²', 'Free WiFi', 'Balcony', 'Air conditioning'].map((tag, i) => (
                                        <span key={i} className="px-1.5 py-0.5 bg-brand-primary/5 text-brand-primary border border-brand-primary/10 rounded-md text-[9px] font-bold">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </td>
                            <td className="p-3 border-r border-gray-100 align-top">
                                <div className="flex gap-0.5">
                                    {Array.from({ length: 4 }).map((_, i) => (
                                        <Users key={i} className="w-3 h-3 text-brand-dark" />
                                    ))}
                                </div>
                            </td>
                            <td className="p-3 border-r border-gray-100 align-top">
                                <div className="text-red-500 line-through text-[10px]">US$3,736</div>
                                <div className="text-lg font-bold text-brand-dark">US$1,494 <Info className="w-3 h-3 inline text-gray-400" /></div>
                                <div className="text-[10px] text-gray-400">+US$75 taxes and fees</div>
                                <div className="mt-2 inline-block px-1.5 py-0.5 bg-green-600 text-white text-[10px] font-bold rounded-md">60% off</div>
                                <div className="mt-1 text-green-600 font-bold text-[10px]">Limited-time Deal</div>
                            </td>
                            <td className="p-3 border-r border-gray-100 align-top space-y-2">
                                <div className="flex items-start gap-1 text-green-600 font-bold">
                                    <Check className="w-3 h-3 mt-0.5" />
                                    <span>Includes parking + late check-in + high-speed internet</span>
                                    <Info className="w-3 h-3 mt-0.5 text-gray-400" />
                                </div>
                                <div className="flex items-start gap-1 text-green-600 font-bold">
                                    <Check className="w-3 h-3 mt-0.5" />
                                    <span>Flexible to reschedule <span className="text-gray-400 font-normal">if plans change</span></span>
                                </div>
                                <div className="flex items-start gap-1 text-red-500">
                                    <Ban className="w-3 h-3 mt-0.5" />
                                    <span>Non-refundable</span>
                                </div>
                                <div className="flex items-center gap-1 text-gray-500">
                                    <Check className="w-3 h-3" />
                                    <span>Pay online</span>
                                </div>
                                <div className="flex items-start gap-1 text-green-600">
                                    <Check className="w-3 h-3 mt-0.5" />
                                    <span>Free private taxi from the airport to this property <Info className="w-3 h-3 mt-0.5 text-gray-400" /></span>
                                </div>
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
                                <Button className="w-full bg-brand-primary hover:bg-brand-primary/90 text-white font-bold text-sm py-2 rounded-lg shadow-md shadow-brand-primary/10 transition-all active:scale-95">
                                    Book now
                                </Button>
                                <div className="text-center text-[10px] text-gray-400 mt-2">• You won't be charged yet</div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
};
