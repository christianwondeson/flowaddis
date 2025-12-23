"use client";

import React from 'react';
import { Star, MapPin } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { formatCurrency } from '@/lib/currency';
import { Hotel } from '@/types';

interface HotelCollectionCardProps {
    hotel: Hotel;
    onBook: (hotel: Hotel) => void;
}

export const HotelCollectionCard: React.FC<HotelCollectionCardProps> = ({ hotel, onBook }) => {
    return (
        <Card
            className="flex-shrink-0 w-[240px] md:w-[280px] overflow-hidden hover:shadow-md transition-all duration-300 border border-gray-200 bg-white cursor-pointer group"
            onClick={() => onBook(hotel)}
        >
            <div className="h-40 md:h-48 overflow-hidden relative">
                <img
                    src={hotel.image}
                    alt={hotel.name}
                    className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                />
                {hotel.discountPercentage && (
                    <div className="absolute top-2 left-2 bg-red-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-sm shadow-sm">
                        -{hotel.discountPercentage}%
                    </div>
                )}
            </div>
            <div className="p-3 flex flex-col h-[180px]">
                <div className="flex items-center gap-0.5 mb-1">
                    {Array.from({ length: Math.floor(hotel.rating || 0) }).map((_, i) => (
                        <Star key={i} className="w-2.5 h-2.5 text-yellow-500 fill-yellow-500" />
                    ))}
                </div>
                <h3 className="text-sm font-bold text-gray-900 line-clamp-2 mb-1 group-hover:text-blue-600 transition-colors">
                    {hotel.name}
                </h3>
                <div className="text-[10px] text-gray-500 mb-2 flex items-center gap-1">
                    <MapPin className="w-2.5 h-2.5" />
                    <span className="truncate">{hotel.location}</span>
                </div>

                <div className="mt-auto">
                    {hotel.badges && hotel.badges.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                            {hotel.badges.slice(0, 1).map((badge, idx) => (
                                <span key={idx} className="px-1.5 py-0.5 bg-green-50 text-green-700 text-[9px] rounded-sm font-bold border border-green-100">
                                    {badge}
                                </span>
                            ))}
                        </div>
                    )}

                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-6 h-6 bg-brand-dark text-white rounded-t-md rounded-br-md flex items-center justify-center font-bold text-[10px]">
                            {hotel.rating}
                        </div>
                        <div className="text-[10px]">
                            <span className="font-bold text-gray-900">{hotel.reviewWord || 'Exceptional'}</span>
                            <span className="text-gray-500 ml-1">• {hotel.reviews} reviews</span>
                        </div>
                    </div>

                    <div className="text-right">
                        <div className="text-[9px] text-gray-500">From</div>
                        <div className="text-sm font-bold text-gray-900">
                            {formatCurrency(hotel.price)} <span className="text-[9px] font-normal text-gray-500">per night</span>
                        </div>
                    </div>
                </div>
            </div>
        </Card>
    );
};
