"use client";

import React, { useMemo } from 'react';
import { Star, MapPin, Share2, Heart, ChevronRight, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useTripStore } from '@/store/trip-store';
import { Popover } from '@/components/ui/popover';
import Link from 'next/link';

interface HotelDetailHeaderProps {
    hotel: any;
    activeTab: string;
    onTabChange: (tab: string) => void;
    onBook?: (price?: number) => void;
}

export const HotelDetailHeader: React.FC<HotelDetailHeaderProps> = ({ hotel, activeTab, onTabChange, onBook }) => {
    const router = useRouter();
    const { addToTrip, currentTrip, removeFromTrip } = useTripStore();
    const [savedHotelId, setSavedHotelId] = React.useState<string | null>(null);

    const inTrip = useMemo(() => currentTrip.some((i) => i.type === 'hotel' && (i.details?.id === hotel?.id || i.details?.serviceName === hotel?.name)), [currentTrip, hotel?.id, hotel?.name]);

    const handleHeartClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (inTrip) {
            const tripItem = currentTrip.find(item => item.type === 'hotel' && (item.details?.id === hotel.id || item.details?.serviceName === hotel.name));
            if (tripItem) removeFromTrip(tripItem.id);
            setSavedHotelId(null);
        } else {
            addToTrip({
                type: 'hotel',
                price: hotel.price || 0,
                details: hotel,
            });
            setSavedHotelId(hotel.id || 'current');
            setTimeout(() => setSavedHotelId(null), 3000);
        }
    };

    const tabs = [
        { id: 'overview', label: 'Overview' },
        { id: 'pricing', label: 'Pricing' },
        { id: 'facilities', label: 'Facilities' },
        { id: 'rules', label: 'House rules' },
        { id: 'reviews', label: 'Guest reviews' },
    ];

    return (
        <div className="bg-white border-b border-gray-200">
            <div className="container mx-auto px-4">
                {/* Top Bar with Back Button */}
                <div className="flex items-center py-2 border-b border-gray-50">
                    <button
                        onClick={() => {
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                            router.back();
                        }}
                        className="flex items-center gap-1 text-xs font-bold text-gray-500 hover:text-brand-primary transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back
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
                                <button
                                    onClick={() => {
                                        const params = new URLSearchParams();
                                        if (hotel.location) params.set('query', hotel.location);
                                        if (hotel.name) params.set('hotelName', hotel.name);
                                        router.push(`/hotels/map?${params.toString()}`);
                                    }}
                                    className="text-brand-primary font-bold hover:underline"
                                >
                                    Excellent location – show map
                                </button>
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
                            <Popover
                                isOpen={!!savedHotelId}
                                onOpenChange={(open) => !open && setSavedHotelId(null)}
                                trigger={
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={handleHeartClick}
                                        className={`rounded-full ${inTrip ? 'text-red-500 hover:bg-red-50' : 'text-brand-primary hover:bg-brand-primary/10'}`}
                                        aria-label={inTrip ? 'Remove from Trip' : 'Add to Trip'}
                                        title={inTrip ? 'Remove from Trip' : 'Add to Trip'}
                                    >
                                        <Heart className={`w-5 h-5 ${inTrip ? 'fill-current' : ''}`} />
                                    </Button>
                                }
                                content={<SavedToTripPopover hotel={hotel} isOpen={!!savedHotelId} onClose={() => setSavedHotelId(null)} />}
                                placement="bottom"
                                align="right"
                            />
                            <Button variant="ghost" size="icon" className="text-brand-primary hover:bg-brand-primary/10 rounded-full">
                                <Share2 className="w-5 h-5" />
                            </Button>
                            <Button onClick={() => onBook?.()} className="bg-brand-primary hover:bg-brand-primary/90 text-white font-bold px-8 rounded-full shadow-lg shadow-brand-primary/20 transition-all hover:scale-105 active:scale-95">
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

function SavedToTripPopover({ hotel, isOpen, onClose }: { hotel: any, isOpen: boolean, onClose: () => void }) {
    return (
        <div className="p-4 bg-white rounded-xl shadow-2xl border border-gray-100 min-w-[240px] animate-in fade-in zoom-in duration-200 relative z-[10010]">
            <div className="flex flex-col gap-4">
                <div>
                    <p className="text-sm text-gray-600 mb-1 flex items-center gap-1">
                        Saved to:
                        <Link href="/trips" className="text-brand-primary font-bold hover:underline">
                            My next trip
                        </Link>
                    </p>
                </div>
                <div className="h-px bg-gray-100" />
                <label className="flex items-center gap-3 cursor-pointer group">
                    <div className="w-5 h-5 rounded-full border-2 border-brand-primary flex items-center justify-center">
                        <div className="w-2.5 h-2.5 rounded-full bg-brand-primary" />
                    </div>
                    <span className="text-sm font-medium text-gray-900">My next trip</span>
                </label>
            </div>
        </div>
    );
}
