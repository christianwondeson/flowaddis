"use client";

import React from 'react';
import { Info, MapPin, Maximize, ParkingCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HotelDetailSidebarProps {
    hotel: any;
}

export const HotelDetailSidebar: React.FC<HotelDetailSidebarProps> = ({ hotel }) => {
    return (
        <div className="space-y-4">
            {/* Review Score Card */}
            <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <div className="text-right">
                        <div className="font-bold text-brand-dark">Excellent</div>
                        <div className="text-[10px] text-gray-400">5 reviews</div>
                    </div>
                    <div className="w-10 h-10 bg-brand-primary text-white rounded-t-xl rounded-br-xl flex items-center justify-center font-bold text-lg shadow-sm shadow-brand-primary/20">
                        8.6
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="text-[11px] text-gray-500 italic leading-relaxed border-l-2 border-brand-primary/20 pl-3">
                        "I stayed overnight in {hotel.location.split(',')[0]} and it was simply amazing. The location couldn't have been better – right in the heart of the city! From the balcony we..."
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-yellow-500 text-white rounded-full flex items-center justify-center text-[10px] font-bold">
                            O
                        </div>
                        <div className="text-[10px]">
                            <span className="font-bold text-gray-900">Ozkan</span>
                            <span className="text-gray-500 ml-1">🇩🇪 Germany</span>
                        </div>
                    </div>
                </div>

                <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-xs font-bold text-brand-dark">Staff</span>
                    <span className="text-xs font-bold text-brand-primary border border-brand-primary/10 bg-brand-primary/5 px-1.5 py-0.5 rounded-md">9.0</span>
                </div>
            </div>

            {/* Map Card */}
            <div className="relative h-48 rounded-xl overflow-hidden border border-gray-100 group cursor-pointer shadow-sm">
                <img
                    src="https://images.unsplash.com/photo-1526772662000-3f88f10405ff?auto=format&fit=crop&w=800&q=80"
                    alt="Map preview"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
                    <Button className="bg-brand-primary hover:bg-brand-primary/90 text-white font-bold text-xs px-4 py-2 rounded-full shadow-lg shadow-brand-primary/20 transition-all hover:scale-105 active:scale-95">
                        Show on map
                    </Button>
                </div>
                <div className="absolute bottom-2 right-2 bg-white/90 px-1.5 py-0.5 rounded-md text-[8px] text-gray-400">
                    Map data ©2025
                </div>
            </div>

            {/* Property Highlights */}
            <div className="bg-brand-primary/5 border border-brand-primary/10 rounded-xl p-4 space-y-4">
                <h4 className="font-bold text-brand-dark text-sm">Property highlights</h4>
                <div className="space-y-3">
                    <div className="flex gap-2">
                        <Info className="w-4 h-4 text-brand-primary shrink-0" />
                        <div>
                            <div className="text-[11px] font-bold text-brand-dark">Perfect for a 3-night stay!</div>
                            <div className="text-[10px] text-gray-500 flex items-center gap-1 mt-0.5">
                                <MapPin className="w-3 h-3 text-brand-primary" />
                                Top Location: Highly rated by recent guests (9.0)
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Maximize className="w-4 h-4 text-brand-primary shrink-0" />
                        <div>
                            <div className="text-[11px] font-bold text-brand-dark">Apartments with:</div>
                            <div className="text-[10px] text-gray-500 mt-0.5">Landmark view</div>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <ParkingCircle className="w-4 h-4 text-brand-primary shrink-0" />
                        <div className="text-[10px] text-gray-500">Free Private Parking Available On Site</div>
                    </div>
                </div>

                <Button className="w-full bg-brand-primary hover:bg-brand-primary/90 text-white font-bold text-xs py-2 rounded-lg shadow-md shadow-brand-primary/10 transition-all active:scale-95">
                    Book now
                </Button>
                <div className="text-center text-[10px] text-gray-400">You won't be charged yet</div>
            </div>
        </div>
    );
};
