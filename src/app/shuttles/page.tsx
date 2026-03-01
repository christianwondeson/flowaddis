"use client";

import React, { useState } from 'react';
import { MapPin, Calendar as CalendarIcon, Users, Search, ArrowRight, Clock, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { LocationInput } from '@/components/search/location-input';
import { GuestSelector } from '@/components/search/guest-selector';
import { Calendar } from '@/components/ui/calendar';
import { Popover } from '@/components/ui/popover';
import { formatCurrency } from '@/lib/currency';
import { AdContainer } from '@/components/ads/ad-container';
import { AdConfig } from '@/lib/types/ads';

// One advertisement on the right per mockup (matches hotels page pattern)
const SHUTTLE_ADS_RIGHT: AdConfig[] = [
    {
        id: 'shuttle-promo-1',
        imageUrl: '/ads/partnership-ad.png',
        altText: 'Airport & City Shuttles - Advertise Your Service',
        linkUrl: '/contact',
        targetBlank: false
    },
    {
        id: 'hotel-shuttle',
        imageUrl: '/ads/hotel-ad-sample.png',
        altText: 'Luxury Stays in Addis Ababa',
        linkUrl: '/hotels',
        targetBlank: false
    }
];

// Mock data
const mockShuttles = [
    {
        id: 1,
        type: 'Airport Transfer',
        vehicle: 'Luxury Sedan',
        capacity: 4,
        price: 50,
        image: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800&auto=format&fit=crop',
        features: ['Professional Driver', 'Meet & Greet', 'Free WiFi', 'Bottled Water']
    },
    {
        id: 2,
        type: 'Group Shuttle',
        vehicle: 'Mini Van',
        capacity: 12,
        price: 120,
        image: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&auto=format&fit=crop',
        features: ['Air Conditioned', 'Luggage Space', 'USB Charging', 'Tour Guide']
    },
    {
        id: 3,
        type: 'Executive Transfer',
        vehicle: 'Mercedes S-Class',
        capacity: 3,
        price: 100,
        image: 'https://images.unsplash.com/photo-1563720360172-67b8f3dce741?w=800&auto=format&fit=crop',
        features: ['Premium Comfort', 'Privacy Glass', 'Refreshments', 'Business Amenities']
    }
];

export default function ShuttlesPage() {
    const [selectedShuttle, setSelectedShuttle] = useState<any>(null);

    const handleBook = (shuttle: any) => {
        setSelectedShuttle(shuttle);
        alert(`Booking ${shuttle.type}`);
    };

    return (
        <AdContainer leftAds={[]} rightAds={SHUTTLE_ADS_RIGHT}>
        <div className="min-h-screen bg-brand-gray/30 pb-24 pt-0">
            {/* Header Section */}
            <div className="bg-teal-600 text-white py-12 md:py-16">
                <div className="container mx-auto px-4">
                    <h1 className="text-3xl md:text-4xl font-bold mb-3 md:mb-4">Airport & City Shuttles</h1>
                    <p className="text-teal-100 text-base md:text-lg max-w-2xl">
                        Reliable, comfortable transportation for your journey in Addis Ababa.
                    </p>
                </div>
            </div>

            <div className="container mx-auto px-4 -mt-8 md:-mt-10">
                {/* Search Widget */}
                <Card className="p-4 md:p-6 shadow-lg rounded-2xl border border-gray-100 mb-8 md:mb-12 overflow-visible">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                        <div className="md:col-span-4">
                            <LocationInput
                                label="Pickup Location"
                                placeholder="Enter address"
                                value={""}
                                onChange={() => { }}
                            />
                        </div>
                        <div className="md:col-span-3">
                            <Popover
                                trigger={
                                    <div className="w-full cursor-pointer">
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Pickup Date</label>
                                        <div className="flex items-center gap-3 w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl hover:bg-white hover:border-brand-primary/50 transition-all group">
                                            <CalendarIcon className="w-5 h-5 text-gray-400 group-hover:text-brand-primary transition-colors" />
                                            <span className="text-gray-900 font-medium">Select Date</span>
                                        </div>
                                    </div>
                                }
                                content={
                                    <Calendar
                                        selected={undefined}
                                        onSelect={() => { }}
                                        minDate={new Date()}
                                    />
                                }
                            />
                        </div>
                        <div className="md:col-span-3">
                            <GuestSelector
                                adults={1}
                                children={0}
                                rooms={1}
                                onChange={() => { }}
                            />
                        </div>
                        <div className="md:col-span-2">
                            <Button className="w-full h-[52px] min-h-[48px] flex items-center justify-center gap-2 text-white font-bold text-lg rounded-2xl shadow-lg shadow-brand-primary/30 hover:shadow-brand-primary/50 transition-all duration-300">
                                <Search className="w-5 h-5" /> Search
                            </Button>
                        </div>
                    </div>
                </Card>

                {/* Shuttle Results */}
                <div className="space-y-6 md:space-y-8">
                    <h2 className="text-xl md:text-2xl font-bold text-brand-dark mb-4 md:mb-6">Available Shuttles</h2>

                    {mockShuttles.map((shuttle) => (
                        <Card key={shuttle.id} className="overflow-hidden hover:shadow-lg transition-all duration-300 border border-gray-100 rounded-2xl">
                            <div className="flex flex-col md:flex-row">
                                {/* Image */}
                                <div className="w-full md:w-2/5 h-48 md:h-auto relative">
                                    <img src={shuttle.image} alt={shuttle.type} className="w-full h-full object-cover" />
                                    <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur px-3 py-1 rounded-lg text-white text-sm font-medium flex items-center gap-2">
                                        <Users className="w-4 h-4" />
                                        Up to {shuttle.capacity} passengers
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="w-full md:w-3/5 p-4 md:p-6 lg:p-8 flex flex-col justify-between">
                                    <div>
                                        <div className="flex flex-col sm:flex-row justify-between items-start mb-4 gap-3">
                                            <div className="flex-1">
                                                <h3 className="text-xl md:text-2xl font-bold text-brand-dark mb-1">{shuttle.type}</h3>
                                                <div className="flex items-center gap-2 text-gray-500 text-sm">
                                                    <Shield className="w-4 h-4 text-brand-secondary" />
                                                    {shuttle.vehicle}
                                                </div>
                                            </div>
                                            <div className="text-left sm:text-right">
                                                <div className="text-sm text-gray-400 mb-1">Starting from</div>
                                                <div className="text-2xl md:text-3xl font-bold text-brand-primary">
                                                    {formatCurrency(shuttle.price)}
                                                </div>
                                                <div className="text-xs text-gray-400">per trip</div>
                                            </div>
                                        </div>

                                        {/* Features */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 md:gap-3 mb-4 md:mb-6">
                                            {shuttle.features.map((feature: string, idx: number) => (
                                                <div key={idx} className="flex items-center gap-2 text-gray-600 text-sm">
                                                    <Clock className="w-4 h-4 text-brand-secondary flex-shrink-0" />
                                                    <span>{feature}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="flex justify-end pt-4 border-t border-gray-100">
                                        <Button onClick={() => handleBook(shuttle)} className="w-full md:w-auto rounded-2xl min-h-[48px]">
                                            Book Now <ArrowRight className="w-4 h-4 ml-2" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
        </AdContainer>
    );
}
