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

// Real hotel venue pricing data for conferences in Addis Ababa (Prices in USD)
const mockConferences = [
    {
        id: 16,
        name: 'Sheraton Addis (Luxury Collection)',
        location: 'Taitu Street, Addis Ababa',
        capacity: 1000,
        miniHall: { min: 323, max: 645, capacity: '10–30 pax' },
        mediumHall: { min: 968, max: 1935, capacity: '30–150 pax' },
        largeHall: { min: 2581, max: 6452, capacity: '150+ pax' },
        price: 2581,
        image: 'https://images.unsplash.com/photo-1519167758481-83f29da8c2b0?w=800&auto=format&fit=crop',
        features: ['Premium AV Setup', 'Stage & Podium', 'VIP Lounge', 'Full Catering', 'Luxury Amenities']
    },
    {
        id: 17,
        name: 'Radisson Blu Addis Ababa',
        location: 'Kazanchis, Addis Ababa',
        capacity: 450,
        miniHall: { min: 194, max: 387, capacity: '10–30 pax' },
        mediumHall: { min: 645, max: 1290, capacity: '30–150 pax' },
        largeHall: { min: 1419, max: 2903, capacity: '150+ pax' },
        price: 1419,
        image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop',
        features: ['High-Speed WiFi', 'AV Equipment', 'Catering Services', 'Parking Available']
    },
    {
        id: 18,
        name: 'Hilton Addis Ababa',
        location: 'Meskel Square, Addis Ababa',
        capacity: 500,
        miniHall: { min: 226, max: 452, capacity: '10–30 pax' },
        mediumHall: { min: 710, max: 1419, capacity: '30–150 pax' },
        largeHall: { min: 1613, max: 3226, capacity: '150+ pax' },
        price: 1613,
        image: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&auto=format&fit=crop',
        features: ['Projector & Screen', 'Sound System', 'Breakout Rooms', 'Coffee Service', 'Business Center']
    },
    {
        id: 19,
        name: 'Hyatt Regency Addis Ababa',
        location: 'Meskel Square, Addis Ababa',
        capacity: 650,
        miniHall: { min: 258, max: 516, capacity: '10–30 pax' },
        mediumHall: { min: 839, max: 1677, capacity: '30–150 pax' },
        largeHall: { min: 1935, max: 4194, capacity: '150+ pax' },
        price: 1935,
        image: 'https://images.unsplash.com/photo-1505236858219-8359eb29e329?w=800&auto=format&fit=crop',
        features: ['State-of-the-art AV', 'Executive Lounge', 'Premium Catering', 'Valet Parking']
    },
    {
        id: 20,
        name: 'Marriott Executive Apartments Addis',
        location: 'Bole, Addis Ababa',
        capacity: 300,
        miniHall: { min: 161, max: 290, capacity: '10–30 pax' },
        mediumHall: { min: 516, max: 968, capacity: '30–150 pax' },
        largeHall: { min: 1161, max: 1935, capacity: '150+ pax' },
        price: 1161,
        image: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=800&auto=format&fit=crop',
        features: ['Modern Facilities', 'WiFi', 'Catering Options', 'Parking']
    },
    {
        id: 21,
        name: 'Elilly International Hotel',
        location: 'Bole, Addis Ababa',
        capacity: 300,
        miniHall: { min: 129, max: 258, capacity: '10–30 pax' },
        mediumHall: { min: 452, max: 903, capacity: '30–150 pax' },
        largeHall: { min: 1032, max: 1935, capacity: '150+ pax' },
        price: 1032,
        image: 'https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?w=800&auto=format&fit=crop',
        features: ['Conference Facilities', 'AV Equipment', 'Catering', 'Free Parking']
    },
    {
        id: 22,
        name: 'Getfam Hotel',
        location: 'Bole, Addis Ababa',
        capacity: 220,
        miniHall: { min: 97, max: 194, capacity: '10–30 pax' },
        mediumHall: { min: 323, max: 645, capacity: '30–150 pax' },
        largeHall: { min: 774, max: 1419, capacity: '150+ pax' },
        price: 774,
        image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&auto=format&fit=crop',
        features: ['Meeting Rooms', 'WiFi', 'Basic AV', 'Refreshments']
    },
    {
        id: 23,
        name: 'Friendship Hotel',
        location: 'Bole, Addis Ababa',
        capacity: 180,
        miniHall: { min: 97, max: 194, capacity: '10–30 pax' },
        mediumHall: { min: 290, max: 581, capacity: '30–150 pax' },
        largeHall: { min: 645, max: 1161, capacity: '150+ pax' },
        price: 645,
        image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&auto=format&fit=crop',
        features: ['Conference Hall', 'Projector', 'Sound System', 'Parking']
    },
    {
        id: 24,
        name: 'Intercontinental Hotel Addis Ababa',
        location: 'Bole, Addis Ababa',
        capacity: 450,
        miniHall: { min: 194, max: 387, capacity: '10–30 pax' },
        mediumHall: { min: 645, max: 1290, capacity: '30–150 pax' },
        largeHall: { min: 1419, max: 2903, capacity: '150+ pax' },
        price: 1419,
        image: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800&auto=format&fit=crop',
        features: ['International Standard', 'Full AV Suite', 'Catering', 'Business Services']
    },
    {
        id: 25,
        name: 'Best Western Plus Pearl Addis',
        location: 'Bole, Addis Ababa',
        capacity: 280,
        miniHall: { min: 129, max: 258, capacity: '10–30 pax' },
        mediumHall: { min: 452, max: 903, capacity: '30–150 pax' },
        largeHall: { min: 1032, max: 1806, capacity: '150+ pax' },
        price: 1032,
        image: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&auto=format&fit=crop',
        features: ['Modern Facilities', 'WiFi', 'AV Equipment', 'Catering']
    },
    {
        id: 26,
        name: 'Best Western Plus Premier Dynasty',
        location: 'Bole, Addis Ababa',
        capacity: 320,
        miniHall: { min: 161, max: 290, capacity: '10–30 pax' },
        mediumHall: { min: 516, max: 1032, capacity: '30–150 pax' },
        largeHall: { min: 1161, max: 2065, capacity: '150+ pax' },
        price: 1161,
        image: 'https://images.unsplash.com/photo-1519690889869-c5e6e9e8e1e4?w=800&auto=format&fit=crop',
        features: ['Conference Rooms', 'High-Speed Internet', 'AV Support', 'Refreshments']
    },
    {
        id: 27,
        name: 'Ramada Addis Ababa',
        location: 'Bole, Addis Ababa',
        capacity: 350,
        miniHall: { min: 161, max: 323, capacity: '10–30 pax' },
        mediumHall: { min: 581, max: 1097, capacity: '30–150 pax' },
        largeHall: { min: 1290, max: 2258, capacity: '150+ pax' },
        price: 1290,
        image: 'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800&auto=format&fit=crop',
        features: ['Meeting Facilities', 'WiFi', 'Presentation Equipment', 'Catering Services']
    },
    {
        id: 28,
        name: 'Triple-E Hotel & Spa',
        location: 'Bole, Addis Ababa',
        capacity: 200,
        miniHall: { min: 97, max: 194, capacity: '10–30 pax' },
        mediumHall: { min: 323, max: 645, capacity: '30–150 pax' },
        largeHall: { min: 774, max: 1290, capacity: '150+ pax' },
        price: 774,
        image: 'https://images.unsplash.com/photo-1573052905904-34ad8c27f0cc?w=800&auto=format&fit=crop',
        features: ['Spa Facilities', 'Conference Hall', 'WiFi', 'Catering']
    },
    {
        id: 29,
        name: 'Aphrodite International Hotel',
        location: 'Bole, Addis Ababa',
        capacity: 280,
        miniHall: { min: 129, max: 258, capacity: '10–30 pax' },
        mediumHall: { min: 452, max: 839, capacity: '30–150 pax' },
        largeHall: { min: 968, max: 1806, capacity: '150+ pax' },
        price: 968,
        image: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800&auto=format&fit=crop',
        features: ['Event Spaces', 'AV Equipment', 'Catering', 'Parking']
    },
    {
        id: 30,
        name: 'Haile Grand Addis Ababa',
        location: 'Bole, Addis Ababa',
        capacity: 450,
        miniHall: { min: 194, max: 387, capacity: '10–30 pax' },
        mediumHall: { min: 645, max: 1290, capacity: '30–150 pax' },
        largeHall: { min: 1613, max: 2903, capacity: '150+ pax' },
        price: 1613,
        image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop',
        features: ['Grand Ballroom', 'Premium AV', 'Full Catering', 'VIP Services']
    },
    {
        id: 31,
        name: 'El Sol Hotel (Elsol Addis)',
        location: 'Bole, Addis Ababa',
        capacity: 140,
        miniHall: { min: 65, max: 129, capacity: '10–30 pax' },
        mediumHall: { min: 226, max: 452, capacity: '30–150 pax' },
        largeHall: { min: 516, max: 903, capacity: '150+ pax' },
        price: 516,
        image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&auto=format&fit=crop',
        features: ['Budget-Friendly', 'Basic AV', 'WiFi', 'Refreshments']
    },
    {
        id: 32,
        name: 'Debre Damo Hotel',
        location: 'Addis Ababa',
        capacity: 160,
        miniHall: { min: 77, max: 161, capacity: '10–30 pax' },
        mediumHall: { min: 258, max: 516, capacity: '30–150 pax' },
        largeHall: { min: 645, max: 1032, capacity: '150+ pax' },
        price: 645,
        image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&auto=format&fit=crop',
        features: ['Meeting Rooms', 'Projector', 'WiFi', 'Parking']
    },
    {
        id: 33,
        name: 'Boyue International Hotel (Bole)',
        location: 'Bole, Addis Ababa',
        capacity: 200,
        miniHall: { min: 97, max: 194, capacity: '10–30 pax' },
        mediumHall: { min: 323, max: 645, capacity: '30–150 pax' },
        largeHall: { min: 774, max: 1290, capacity: '150+ pax' },
        price: 774,
        image: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=800&auto=format&fit=crop',
        features: ['International Standard', 'Conference Facilities', 'WiFi', 'Catering']
    },
    {
        id: 34,
        name: 'Ghion Hotel (Stadium)',
        location: 'Stadium Area, Addis Ababa',
        capacity: 350,
        miniHall: { min: 129, max: 258, capacity: '10–30 pax' },
        mediumHall: { min: 452, max: 968, capacity: '30–150 pax' },
        largeHall: { min: 1161, max: 2258, capacity: '150+ pax' },
        price: 1161,
        image: 'https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?w=800&auto=format&fit=crop',
        features: ['Historic Venue', 'Large Grounds', 'AV Equipment', 'Catering']
    },
    {
        id: 35,
        name: 'Melka International Hotel',
        location: 'Addis Ababa',
        capacity: 140,
        miniHall: { min: 65, max: 129, capacity: '10–30 pax' },
        mediumHall: { min: 226, max: 452, capacity: '30–150 pax' },
        largeHall: { min: 516, max: 903, capacity: '150+ pax' },
        price: 516,
        image: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&auto=format&fit=crop',
        features: ['Affordable Rates', 'Meeting Rooms', 'WiFi', 'Basic Catering']
    },
    {
        id: 36,
        name: 'Destiny Addis Hotel (Olompia)',
        location: 'Olompia, Addis Ababa',
        capacity: 160,
        miniHall: { min: 77, max: 161, capacity: '10–30 pax' },
        mediumHall: { min: 258, max: 516, capacity: '30–150 pax' },
        largeHall: { min: 645, max: 1032, capacity: '150+ pax' },
        price: 645,
        image: 'https://images.unsplash.com/photo-1519690889869-c5e6e9e8e1e4?w=800&auto=format&fit=crop',
        features: ['Conference Facilities', 'Projector & Screen', 'WiFi', 'Parking']
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
