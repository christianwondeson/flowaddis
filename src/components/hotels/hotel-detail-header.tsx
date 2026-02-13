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
    onBook?: (price?: number, name?: string, id?: string) => void;
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
        { id: 'overview', label: 'Overview', icon: 'home' },
        { id: 'pricing', label: 'Pricing', icon: 'dollar' },
        { id: 'facilities', label: 'Facilities', icon: 'grid' },
        { id: 'rules', label: 'House rules', icon: 'book' },
        { id: 'reviews', label: 'Guest reviews', icon: 'star' },
    ];

    const getTabIcon = (iconName: string) => {
        switch (iconName) {
            case 'home':
                return <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>;
            case 'dollar':
                return <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
            case 'grid':
                return <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>;
            case 'book':
                return <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>;
            case 'star':
                return <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>;
            default:
                return null;
        }
    };

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

                                        // Pass coordinates for map centering
                                        if (hotel.coordinates?.lat) params.set('lat', hotel.coordinates.lat.toString());
                                        if (hotel.coordinates?.lng) params.set('lng', hotel.coordinates.lng.toString());
                                        if (hotel.id) params.set('highlightId', hotel.id);

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
                <div className="relative">
                    {/* Left fade indicator - hidden on large screens */}
                    <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none lg:hidden" />

                    <div className="flex overflow-x-auto scrollbar-hide snap-x snap-mandatory gap-1 lg:gap-0">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => onTabChange(tab.id)}
                                className={`
                                    snap-start flex-shrink-0 px-4 sm:px-6 py-3 sm:py-4
                                    text-xs sm:text-sm font-bold whitespace-nowrap
                                    border-b-3 transition-all duration-200
                                    min-w-[110px] sm:min-w-[120px] lg:min-w-0
                                    ${activeTab === tab.id
                                        ? 'border-brand-primary text-brand-primary bg-brand-primary/5'
                                        : 'border-transparent text-gray-500 hover:text-brand-primary hover:bg-gray-50'
                                    }
                                `}
                            >
                                <div className="flex items-center gap-2 justify-center">
                                    <span className="hidden sm:inline">{getTabIcon(tab.icon)}</span>
                                    <span>{tab.label}</span>
                                </div>
                            </button>
                        ))}
                    </div>

                    {/* Right fade indicator - hidden on large screens */}
                    <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none lg:hidden" />
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
