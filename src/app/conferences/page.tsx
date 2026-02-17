"use client";

import React, { useState } from 'react';
import { Briefcase } from 'lucide-react';
import { ServicePageWrapper } from '@/components/layout/service-page-wrapper';
import { VenueCard } from '@/components/conferences/venue-card';
import { toast } from 'sonner';

// Real hotel venue data for conferences (Pricing in USD)
const mockConferences = [
    {
        id: 16,
        name: 'Sheraton Addis (Luxury Collection)',
        location: 'Taitu Street, Addis Ababa',
        capacity: 1000,
        price: 2581,
        rating: 4.9,
        features: ['Premium AV Setup', 'Stage & Podium', 'VIP Lounge', 'Full Catering', 'Luxury Amenities']
    },
    {
        id: 17,
        name: 'Radisson Blu Addis Ababa',
        location: 'Kazanchis, Addis Ababa',
        capacity: 450,
        price: 1419,
        rating: 4.8,
        features: ['High-Speed WiFi', 'AV Equipment', 'Catering Services', 'Parking Available']
    },
    {
        id: 18,
        name: 'Hilton Addis Ababa',
        location: 'Meskel Square, Addis Ababa',
        capacity: 500,
        price: 1613,
        rating: 4.7,
        features: ['Projector & Screen', 'Sound System', 'Breakout Rooms', 'Coffee Service', 'Business Center']
    },
    {
        id: 19,
        name: 'Hyatt Regency Addis Ababa',
        location: 'Meskel Square, Addis Ababa',
        capacity: 650,
        price: 1935,
        rating: 4.9,
        features: ['State-of-the-art AV', 'Executive Lounge', 'Premium Catering', 'Valet Parking']
    },
    {
        id: 20,
        name: 'Marriott Executive Apartments Addis',
        location: 'Bole, Addis Ababa',
        capacity: 300,
        price: 1161,
        rating: 4.8,
        features: ['Modern Facilities', 'WiFi', 'Catering Options', 'Parking']
    },
    {
        id: 21,
        name: 'Elilly International Hotel',
        location: 'Bole, Addis Ababa',
        capacity: 300,
        price: 1032,
        rating: 4.6,
        features: ['Conference Facilities', 'AV Equipment', 'Catering', 'Free Parking']
    },
    {
        id: 22,
        name: 'Getfam Hotel',
        location: 'Bole, Addis Ababa',
        capacity: 220,
        price: 774,
        rating: 4.5,
        features: ['Meeting Rooms', 'WiFi', 'Basic AV', 'Refreshments']
    },
    {
        id: 23,
        name: 'Friendship Hotel',
        location: 'Bole, Addis Ababa',
        capacity: 180,
        price: 645,
        rating: 4.4,
        features: ['Conference Hall', 'Projector', 'Sound System', 'Parking']
    },
    {
        id: 24,
        name: 'Intercontinental Hotel Addis Ababa',
        location: 'Bole, Addis Ababa',
        capacity: 450,
        price: 1419,
        rating: 4.7,
        features: ['International Standard', 'Full AV Suite', 'Catering', 'Business Services']
    },
    {
        id: 25,
        name: 'Skylight Hotel',
        location: 'Bole, Addis Ababa',
        capacity: 2000,
        price: 3500,
        rating: 5.0,
        features: ['Largest Ballroom', 'World-class AV', 'Luxury Catering', 'VIP Suites']
    }
];

export default function ConferencesPage() {
    const handleBook = (venue: any) => {
        toast.success(`Starting booking for ${venue.name}`);
    };

    return (
        <ServicePageWrapper
            icon={Briefcase}
            title="Conference & Event Venues"
            description="Host your next event in world-class facilities with state-of-the-art technology and premium services."
            accentColor="primary"
        >
            {/* Venues Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                {mockConferences.map((venue, index) => (
                    <VenueCard
                        key={venue.id}
                        venue={venue}
                        index={index}
                        onBook={handleBook}
                    />
                ))}
            </div>
        </ServicePageWrapper>
    );
}
