"use client";

import React, { useMemo } from 'react';
import { Star, MapPin, Share2, Heart, ChevronRight, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useTripStore } from '@/store/trip-store';

interface HotelDetailHeaderProps {
    hotel: any;
    activeTab: string;
    onTabChange: (tab: string) => void;
    onBook?: () => void;
}

export const HotelDetailHeader: React.FC<HotelDetailHeaderProps> = ({ hotel, activeTab, onTabChange, onBook }) => {
    const router = useRouter();
    const { addToTrip, currentTrip } = useTripStore();
    const inTrip = useMemo(() => currentTrip.some((i) => i.type === 'hotel' && i.details?.serviceName === hotel?.name), [currentTrip, hotel?.name]);
    const tabs = [
        { id: 'overview', label: 'Overview' },
        { id: 'pricing', label: 'Pricing' },
        { id: 'facilities', label: 'Facilities' },
        { id: 'rules', label: 'House rules' },
        { id: 'reviews', label: 'Guest reviews' },
    ];

    return (
        <div className="bg-white border-b border-gray-200 sticky top-0 z-30">
            <div className="container mx-auto px-4">
                {/* Top Bar with Back Button */}
                <div className="flex items-center py-2 border-b border-gray-50">
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-1 text-xs font-bold text-gray-500 hover:text-brand-primary transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to results
                    </button>
                </div>

                {/* Header Info */}
                <div className="py-4 md:py-6">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="flex items-center gap-0.5">
                                    {Array.from({ length: 4 }).map((_, i) => (
                                        <Star key={i} className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                                    ))}
                                </div>
                                <span className="bg-green-50 text-green-700 text-[10px] font-bold px-1.5 py-0.5 rounded-sm border border-green-100 flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 bg-green-600 rounded-full"></span>
                                    Free taxi available
                                </span>
                            </div>
                            <h1 className="text-xl md:text-2xl font-bold text-brand-dark mb-1 leading-tight">
                                {hotel.name}
                            </h1>
                            <div className="flex items-center gap-1 text-sm text-gray-500">
                                <MapPin className="w-4 h-4 text-brand-primary" />
                                <span>{hotel.location}</span>
                                <span className="text-gray-300 mx-1">–</span>
                                <button className="text-brand-primary font-bold hover:underline">Excellent location – show map</button>
                            </div>
                            {(hotel.rating || hotel.reviews) && (
                                <div className="mt-2 flex items-center gap-2">
                                    <div className="w-7 h-7 bg-brand-dark text-white rounded-md flex items-center justify-center text-xs font-bold">
                                        {Math.round(hotel.rating || 0)}
                                    </div>
                                    <div className="text-sm">
                                        <span className="font-bold text-brand-dark">{hotel.reviewWord || 'Very Good'}</span>
                                        {hotel.reviews ? <span className="text-gray-500"> · {hotel.reviews} reviews</span> : null}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex items-center gap-3">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                    if (!inTrip) {
                                        addToTrip({
                                            type: 'hotel',
                                            price: hotel.price || 0,
                                            details: { serviceName: hotel.name, location: hotel.location },
                                        });
                                    }
                                }}
                                className={`rounded-full ${inTrip ? 'text-red-500 hover:bg-red-50' : 'text-brand-primary hover:bg-brand-primary/10'}`}
                                aria-label={inTrip ? 'Added to Trip' : 'Add to Trip'}
                                title={inTrip ? 'Added to Trip' : 'Add to Trip'}
                            >
                                <Heart className={`w-5 h-5 ${inTrip ? 'fill-current' : ''}`} />
                            </Button>
                            <Button variant="ghost" size="icon" className="text-brand-primary hover:bg-brand-primary/10 rounded-full">
                                <Share2 className="w-5 h-5" />
                            </Button>
                            <Button onClick={onBook} className="bg-brand-primary hover:bg-brand-primary/90 text-white font-bold px-8 rounded-full shadow-lg shadow-brand-primary/20 transition-all hover:scale-105 active:scale-95">
                                Book now
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex overflow-x-auto no-scrollbar">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => onTabChange(tab.id)}
                            className={`px-6 py-4 text-xs font-bold whitespace-nowrap border-b-2 transition-all duration-200 ${activeTab === tab.id
                                ? 'border-brand-primary text-brand-primary'
                                : 'border-transparent text-gray-500 hover:text-brand-primary hover:bg-gray-50'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};
