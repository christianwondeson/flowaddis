"use client";

import React from 'react';
import { Home, Maximize, Wind, ParkingCircle, Wifi, Waves, Users, Languages, Ban, Check, Info } from 'lucide-react';

interface HotelDetailAboutProps {
    hotel: any;
    facilities?: any[];
    loading?: boolean;
}

export const HotelDetailAbout: React.FC<HotelDetailAboutProps> = ({ hotel, facilities = [], loading = false }) => {
    const highlights = [
        { icon: <Home className="w-5 h-5" />, label: 'The entire place is yours' },
        { icon: <Maximize className="w-5 h-5" />, label: 'Spacious rooms' },
        { icon: <Wind className="w-5 h-5" />, label: 'Air conditioning' },
        { icon: <ParkingCircle className="w-5 h-5" />, label: 'Free on-site parking' },
        { icon: <Wifi className="w-5 h-5" />, label: 'Free WiFi' },
        { icon: <Waves className="w-5 h-5" />, label: 'Swimming pool' },
        { icon: <Users className="w-5 h-5" />, label: 'Family rooms' },
        { icon: <Languages className="w-5 h-5" />, label: 'Multilingual staff' },
        { icon: <Check className="w-5 h-5" />, label: 'Private bathroom' },
        { icon: <Ban className="w-5 h-5" />, label: 'Non-smoking rooms' },
    ];

    const amenitiesFromHotel: string[] = Array.isArray(hotel?.amenities) ? hotel.amenities : [];

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
                <h3 className="text-lg font-bold text-brand-dark pt-1">About this property</h3>
                {hotel?.description ? (
                    <div className="space-y-2 text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                        {hotel.description}
                    </div>
                ) : (
                    <div className="space-y-3 text-sm text-gray-600 leading-relaxed">
                        <p>
                            Enjoy a comfortable stay at <span className="font-bold text-brand-dark">{hotel.name}</span> in {hotel.location}. Popular amenities include Free WiFi, Parking, and Family rooms.
                        </p>
                        <p>
                            This property offers friendly service and convenient access to nearby attractions.
                        </p>
                    </div>
                )}
            </div>

            {/* Most Popular Facilities */}
            <div className="pt-6 border-t border-gray-100">
                <h3 className="text-base font-bold text-brand-dark mb-6">Property facilities</h3>

                {loading ? (
                    <div className="flex items-center gap-2 text-brand-primary animate-pulse">
                        <Info className="w-4 h-4" />
                        <span className="text-sm">Loading facilities...</span>
                    </div>
                ) : facilities.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {facilities.slice(0, 6).map((group: any, idx: number) => (
                            <div key={idx} className="space-y-3">
                                <h4 className="text-sm font-bold text-brand-dark flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 bg-brand-primary rounded-full" />
                                    {group.facility_type_name}
                                </h4>
                                <div className="space-y-2 pl-3.5">
                                    {group.facilities.slice(0, 5).map((facility: any, fIdx: number) => (
                                        <div key={fIdx} className="flex items-center gap-2 text-xs text-gray-600">
                                            <Check className="w-3.5 h-3.5 text-brand-primary/60" />
                                            <span>{facility.facility_name}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-wrap gap-x-6 gap-y-3">
                        {(amenitiesFromHotel.length > 0 ? amenitiesFromHotel.slice(0, 12) : ['Free WiFi', 'Parking', 'Family rooms', 'Air conditioning']).map((label: string, idx: number) => (
                            <div key={idx} className="flex items-center gap-2 text-xs font-medium text-brand-dark">
                                <Check className="w-4 h-4 text-brand-primary" />
                                <span>{label}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
