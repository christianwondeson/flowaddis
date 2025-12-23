"use client";

import React from 'react';
import { MapPin, Star, Wifi, Coffee, Car, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { formatCurrency } from '@/lib/currency';
import { Hotel } from '@/types';

interface HotelCardProps {
    hotel: Hotel;
    onBook: (hotel: Hotel) => void;
    onHoverStart?: (id: string) => void;
    onHoverEnd?: (id: string) => void;
}

export const HotelCard: React.FC<HotelCardProps> = ({ hotel, onBook, onHoverStart, onHoverEnd }) => {
    const [showFullDescription, setShowFullDescription] = React.useState(false);

    return (
        <Card
            className="overflow-hidden hover:shadow-md transition-all duration-300 border border-gray-200 group bg-white max-w-4xl mx-auto cursor-pointer"
            onMouseEnter={() => onHoverStart?.(hotel.id)}
            onMouseLeave={() => onHoverEnd?.(hotel.id)}
            onClick={() => onBook(hotel)}
        >
            <div className="flex flex-col sm:flex-row h-full">
                {/* Column 1: Image */}
                <div className="w-full sm:w-[180px] md:w-[200px] lg:w-[220px] h-40 sm:h-auto relative overflow-hidden flex-shrink-0">
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

                {/* Column 2: Info (Center) */}
                <div className="flex-1 p-3 flex flex-col min-w-0 border-r border-gray-100">
                    <div className="flex items-start justify-between gap-2 mb-0.5">
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-0.5">
                                <h3 className="text-sm md:text-base font-bold text-blue-600 hover:underline cursor-pointer truncate">
                                    {hotel.name}
                                </h3>
                                <div className="flex items-center gap-0.5">
                                    {Array.from({ length: Math.floor(hotel.rating || 0) }).map((_, i) => (
                                        <Star key={i} className="w-2.5 h-2.5 text-yellow-500 fill-yellow-500" />
                                    ))}
                                </div>
                            </div>
                            <div className="flex items-center gap-1 text-gray-600 text-[10px] mb-1.5">
                                <MapPin className="w-2.5 h-2.5 text-gray-400 flex-shrink-0" />
                                <span className="truncate underline cursor-pointer">{hotel.location}</span>
                                {hotel.distance && <span className="text-gray-400 whitespace-nowrap">• {hotel.distance}</span>}
                            </div>
                        </div>
                    </div>

                    <div className="flex-1">
                        {hotel.description && (
                            <div className="text-[10px] text-gray-700 leading-normal mb-2">
                                <p className={showFullDescription ? "" : "line-clamp-2"}>
                                    {hotel.description}
                                </p>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setShowFullDescription(!showFullDescription);
                                    }}
                                    className="text-blue-600 font-bold hover:underline mt-0.5"
                                >
                                    {showFullDescription ? "Show less" : "Show more"}
                                </button>
                            </div>
                        )}

                        {/* Amenities/Badges */}
                        <div className="flex flex-wrap gap-1">
                            {hotel.badges?.slice(0, 2).map((badge, idx) => (
                                <span key={idx} className="px-1 py-0.5 bg-green-50 text-green-700 text-[8px] rounded-sm font-bold border border-green-100">
                                    {badge}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Column 3: Review & Price (Right) */}
                <div className="w-full sm:w-[140px] md:w-[160px] lg:w-[180px] p-3 flex flex-col justify-between items-end bg-gray-50/20 flex-shrink-0">
                    <div className="flex items-center gap-2 text-right">
                        <div>
                            <div className="text-[11px] font-bold text-gray-900 leading-tight">{hotel.reviewWord || 'Exceptional'}</div>
                            <div className="text-[9px] text-gray-500">{hotel.reviews || 0} reviews</div>
                        </div>
                        <div className="w-6 h-6 bg-brand-dark text-white rounded-t-md rounded-br-md flex items-center justify-center font-bold text-[10px]">
                            {hotel.rating}
                        </div>
                    </div>

                    <div className="text-right w-full mt-2">
                        <div className="text-[9px] text-gray-500 mb-0.5">Price from</div>
                        <div className="flex flex-col items-end">
                            {hotel.originalPrice && hotel.originalPrice > hotel.price && (
                                <span className="text-[9px] text-red-600 line-through leading-none mb-0.5">
                                    {formatCurrency(hotel.originalPrice)}
                                </span>
                            )}
                            <div className="text-base font-bold text-gray-900 leading-none">
                                {formatCurrency(hotel.price)}
                            </div>
                            <div className="text-[8px] text-gray-500 mt-0.5">1 night, 2 adults</div>
                        </div>
                        <Button
                            onClick={() => onBook(hotel)}
                            className="w-full mt-2 h-7 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-[10px] font-bold transition-all"
                        >
                            Check availability
                        </Button>
                    </div>
                </div>
            </div>
        </Card>
    );
};
