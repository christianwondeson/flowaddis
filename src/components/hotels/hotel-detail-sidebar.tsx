"use client";

import React from 'react';
import { Info, MapPin, Maximize, ParkingCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

interface HotelDetailSidebarProps {
    hotel: any;
    reviews?: any[];
    loading?: boolean;
    onBook?: () => void;
}

export const HotelDetailSidebar: React.FC<HotelDetailSidebarProps> = ({ hotel, reviews = [], loading = false, onBook }) => {
    const router = useRouter();

    return (
        <div className="space-y-4">
            {/* Review Score Card */}
            <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
                {loading ? (
                    <div className="animate-pulse space-y-4">
                        <div className="flex justify-between items-center">
                            <div className="h-4 bg-gray-200 rounded w-24"></div>
                            <div className="h-10 w-10 bg-gray-200 rounded-t-xl rounded-br-xl"></div>
                        </div>
                        <div className="h-12 bg-gray-100 rounded w-full"></div>
                    </div>
                ) : reviews.length > 0 ? (
                    <>
                        <div className="flex items-center justify-between mb-4">
                            <div className="text-right">
                                <div className="font-bold text-brand-dark">
                                    {hotel.rating >= 4 ? 'Exceptional' : hotel.rating >= 3.5 ? 'Excellent' : 'Good'}
                                </div>
                                <div className="text-[10px] text-gray-400">{hotel.reviews} reviews</div>
                            </div>
                            <div className="w-10 h-10 bg-brand-primary text-white rounded-t-xl rounded-br-xl flex items-center justify-center font-bold text-lg shadow-sm shadow-brand-primary/20">
                                {Number(hotel.rating).toFixed(1)}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="text-[11px] text-gray-500 italic leading-relaxed border-l-2 border-brand-primary/20 pl-3 line-clamp-3">
                                "{reviews[0].pros || reviews[0].title || 'No comment provided.'}"
                            </div>

                            <div className="flex items-center gap-2">
                                {reviews[0].author?.avatar ? (
                                    <img src={reviews[0].author.avatar} alt={reviews[0].author.name} className="w-6 h-6 rounded-full object-cover" />
                                ) : (
                                    <div className="w-6 h-6 bg-brand-primary/10 text-brand-primary rounded-full flex items-center justify-center text-[10px] font-bold">
                                        {reviews[0].author?.name?.charAt(0) || 'G'}
                                    </div>
                                )}
                                <div className="text-[10px]">
                                    <span className="font-bold text-gray-900">{reviews[0].author?.name || 'Guest'}</span>
                                    <span className="text-gray-500 ml-1">
                                        {reviews[0].author?.countrycode?.toUpperCase()}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="text-center py-4">
                        <div className="text-sm font-bold text-brand-dark mb-1">No reviews yet</div>
                        <div className="text-[10px] text-gray-400">Be the first to review!</div>
                    </div>
                )}

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
                    <Button
                        onClick={() => {
                            const params = new URLSearchParams();
                            if (hotel.location) params.set('query', hotel.location);
                            if (hotel.name) params.set('hotelName', hotel.name);
                            router.push(`/hotels/map?${params.toString()}`);
                        }}
                        className="bg-brand-primary hover:bg-brand-primary/90 text-white font-bold text-xs px-4 py-2 rounded-full shadow-lg shadow-brand-primary/20 transition-all hover:scale-105 active:scale-95"
                    >
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

                <Button onClick={onBook} className="w-full bg-brand-primary hover:bg-brand-primary/90 text-white font-bold text-xs py-2 rounded-lg shadow-md shadow-brand-primary/10 transition-all active:scale-95">
                    Book now
                </Button>
                <div className="text-center text-[10px] text-gray-400">You won't be charged yet</div>
            </div>
        </div>
    );
};
