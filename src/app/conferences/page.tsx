"use client";

import React, { useState } from 'react';
import { MapPin, Calendar as CalendarIcon, Users, Search, ArrowRight, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { LocationInput } from '@/components/search/location-input';
import { GuestSelector } from '@/components/search/guest-selector';
import { Calendar } from '@/components/ui/calendar';
import { Popover } from '@/components/ui/popover';
import { formatCurrency } from '@/lib/currency';

// Mock data
const mockConferences = [
    {
        id: 1,
        name: 'Skylight Hotel Grand Ballroom',
        location: 'Bole, Addis Ababa',
        capacity: 500,
        price: 5000,
        image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop',
        features: ['High-Speed WiFi', 'AV Equipment', 'Catering Services', 'Parking Available']
    },
    {
        id: 2,
        name: 'Hilton Conference Center',
        location: 'Meskel Square, Addis Ababa',
        capacity: 300,
        price: 4000,
        image: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&auto=format&fit=crop',
        features: ['Projector & Screen', 'Sound System', 'Breakout Rooms', 'Coffee Service']
    },
    {
        id: 3,
        name: 'Sheraton Grand Hall',
        location: 'Taitu Street, Addis Ababa',
        capacity: 800,
        price: 8000,
        image: 'https://images.unsplash.com/photo-1519167758481-83f29da8c2b0?w=800&auto=format&fit=crop',
        features: ['Premium AV Setup', 'Stage & Podium', 'VIP Lounge', 'Full Catering']
    }
];

export default function ConferencesPage() {
    const [selectedVenue, setSelectedVenue] = useState<any>(null);

    const handleBook = (venue: any) => {
        setSelectedVenue(venue);
        // TODO: Open booking modal
        alert(`Booking ${venue.name}`);
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-20 pt-10 md:pt-15">
            {/* Header Section */}
            <div className="bg-brand-primary text-white py-12 md:py-16">
                <div className="container mx-auto px-4">
                    <h1 className="text-3xl md:text-4xl font-bold mb-3 md:mb-4">Conference & Event Venues</h1>
                    <p className="text-blue-100 text-base md:text-lg max-w-2xl">
                        Host your next event in world-class facilities with state-of-the-art technology.
                    </p>
                </div>
            </div>

            <div className="container mx-auto px-4 -mt-8 md:-mt-10">
                {/* Search Widget */}
                <Card className="p-4 md:p-6 shadow-xl mb-8 md:mb-12 overflow-visible">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                        <div className="md:col-span-4">
                            <LocationInput
                                label="Event Location"
                                placeholder="Preferred Area"
                                value={""}
                                onChange={() => { }}
                            />
                        </div>
                        <div className="md:col-span-3">
                            <Popover
                                trigger={
                                    <div className="w-full cursor-pointer">
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Event Date</label>
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
                                adults={100}
                                children={0}
                                rooms={1}
                                onChange={() => { }}
                            />
                        </div>
                        <div className="md:col-span-2">
                            <Button className="w-full h-[50px] flex items-center justify-center gap-2 text-white font-bold text-lg shadow-lg shadow-brand-primary/30 hover:shadow-brand-primary/50 transition-all">
                                <Search className="w-5 h-5" /> Search
                            </Button>
                        </div>
                    </div>
                </Card>

                {/* Venue Results */}
                <div className="space-y-6 md:space-y-8">
                    <h2 className="text-xl md:text-2xl font-bold text-brand-dark mb-4 md:mb-6">Top Venues</h2>

                    {mockConferences.map((venue) => (
                        <Card key={venue.id} className="overflow-hidden hover:shadow-xl transition-all duration-300 border border-gray-100">
                            <div className="flex flex-col md:flex-row">
                                {/* Image */}
                                <div className="w-full md:w-2/5 h-48 md:h-auto relative">
                                    <img src={venue.image} alt={venue.name} className="w-full h-full object-cover" />
                                    <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur px-3 py-1 rounded-lg text-white text-sm font-medium flex items-center gap-2">
                                        <Users className="w-4 h-4" />
                                        Capacity: {venue.capacity}
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="w-full md:w-3/5 p-4 md:p-6 lg:p-8 flex flex-col justify-between">
                                    <div>
                                        <div className="flex flex-col sm:flex-row justify-between items-start mb-4 gap-3">
                                            <div className="flex-1">
                                                <h3 className="text-xl md:text-2xl font-bold text-brand-dark mb-1">{venue.name}</h3>
                                                <div className="flex items-center gap-2 text-gray-500 text-sm">
                                                    <MapPin className="w-4 h-4 text-brand-secondary" />
                                                    {venue.location}
                                                </div>
                                            </div>
                                            <div className="text-left sm:text-right">
                                                <div className="text-sm text-gray-400 mb-1">Packages from</div>
                                                <div className="text-2xl md:text-3xl font-bold text-brand-primary">
                                                    {formatCurrency(venue.price)}
                                                </div>
                                                <div className="text-xs text-gray-400">per day</div>
                                            </div>
                                        </div>

                                        {/* Features */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 md:gap-3 mb-4 md:mb-6">
                                            {venue.features.map((feature: string, idx: number) => (
                                                <div key={idx} className="flex items-center gap-2 text-gray-600 text-sm">
                                                    <CheckCircle className="w-4 h-4 text-brand-secondary flex-shrink-0" />
                                                    <span>{feature}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="flex justify-end pt-4 border-t border-gray-100">
                                        <Button onClick={() => handleBook(venue)} className="w-full md:w-auto">
                                            Request Quote & Book <ArrowRight className="w-4 h-4 ml-2" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    );
}
