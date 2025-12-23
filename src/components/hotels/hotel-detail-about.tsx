"use client";

import React from 'react';
import { Home, Maximize, Wind, ParkingCircle, Wifi, Waves, Users, Languages, Ban, Check, Info } from 'lucide-react';

interface HotelDetailAboutProps {
    hotel: any;
}

export const HotelDetailAbout: React.FC<HotelDetailAboutProps> = ({ hotel }) => {
    const highlights = [
        { icon: <Home className="w-5 h-5" />, label: 'The entire place is yours' },
        { icon: <Maximize className="w-5 h-5" />, label: '112 m² size' },
        { icon: <Wind className="w-5 h-5" />, label: 'Air conditioning' },
        { icon: <ParkingCircle className="w-5 h-5" />, label: 'Free on-site parking' },
        { icon: <Wifi className="w-5 h-5" />, label: 'Free WiFi' },
        { icon: <Waves className="w-5 h-5" />, label: 'Outdoor swimming pool' },
        { icon: <Users className="w-5 h-5" />, label: 'Family rooms' },
        { icon: <Languages className="w-5 h-5" />, label: 'Balcony' },
        { icon: <Check className="w-5 h-5" />, label: 'Private bathroom' },
        { icon: <Ban className="w-5 h-5" />, label: 'Non-smoking rooms' },
    ];

    const popularFacilities = [
        { icon: <Waves className="w-4 h-4 text-brand-primary" />, label: 'Outdoor swimming pool' },
        { icon: <Ban className="w-4 h-4 text-brand-primary" />, label: 'Non-smoking rooms' },
        { icon: <Maximize className="w-4 h-4 text-brand-primary" />, label: 'Fitness center' },
        { icon: <ParkingCircle className="w-4 h-4 text-brand-primary" />, label: 'Free parking' },
        { icon: <Wifi className="w-4 h-4 text-brand-primary" />, label: 'Free WiFi' },
        { icon: <Users className="w-4 h-4 text-brand-primary" />, label: 'Family rooms' },
        { icon: <Maximize className="w-4 h-4 text-brand-primary" />, label: 'Elevator' },
        { icon: <Wind className="w-4 h-4 text-brand-primary" />, label: 'Air conditioning' },
    ];

    return (
        <div className="space-y-8">
            {/* Highlights Grid */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {highlights.map((item, idx) => (
                    <div key={idx} className="flex flex-col items-center justify-center p-4 border border-gray-100 rounded-xl text-center gap-2 hover:bg-white hover:border-brand-primary/20 hover:shadow-sm transition-all duration-300">
                        <div className="text-brand-primary">{item.icon}</div>
                        <span className="text-[10px] font-bold text-brand-dark">{item.label}</span>
                    </div>
                ))}
            </div>

            {/* Availability Alert */}
            <div className="bg-brand-primary/5 border border-brand-primary/10 rounded-xl p-4 flex gap-4">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm flex-shrink-0">
                    <Maximize className="w-6 h-6 text-brand-primary" />
                </div>
                <div>
                    <h4 className="font-bold text-brand-dark text-sm mb-1">Not usually available – you're in luck!</h4>
                    <p className="text-xs text-gray-500 leading-relaxed">
                        {hotel.name} isn't usually available on our site. Reserve soon before it sells out!
                    </p>
                </div>
            </div>

            {/* Description */}
            <div className="space-y-4">
                <p className="text-sm text-gray-500 leading-relaxed">
                    You might be eligible for a Genius discount at {hotel.name}. <button className="text-brand-primary font-bold hover:underline">Sign in</button> to check if a Genius discount is available for your selected dates.
                </p>
                <p className="text-sm text-gray-600 leading-relaxed">
                    Genius discounts at this property are subject to booking dates, stay dates, and other available deals.
                </p>

                <h3 className="text-lg font-bold text-brand-dark pt-4">About this property</h3>
                <div className="space-y-4 text-sm text-gray-500 leading-relaxed">
                    <p>
                        <span className="font-bold text-brand-dark">Spacious Accommodations:</span> {hotel.name} offers spacious 4-star apartments in {hotel.location}. Each unit features two bedrooms and two bathrooms, ensuring comfort for all guests.
                    </p>
                    <p>
                        <span className="font-bold text-brand-dark">Exceptional Facilities:</span> Guests can enjoy a fitness center, year-round outdoor swimming pool, and free WiFi. Additional amenities include an elevator, outdoor seating area, family rooms, and full-day security.
                    </p>
                    <p>
                        <span className="font-bold text-brand-dark">Prime Location:</span> Located near major landmarks and transport hubs. Nearby attractions include shopping malls, fountains, and cultural centers.
                    </p>
                </div>
            </div>

            {/* Most Popular Facilities */}
            <div className="pt-6 border-t border-gray-100">
                <h3 className="text-base font-bold text-brand-dark mb-4">Most popular facilities</h3>
                <div className="flex flex-wrap gap-x-6 gap-y-3">
                    {popularFacilities.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-xs font-medium text-brand-dark">
                            {item.icon}
                            <span>{item.label}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
