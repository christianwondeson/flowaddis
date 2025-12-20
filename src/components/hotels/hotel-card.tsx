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
}

export const HotelCard: React.FC<HotelCardProps> = ({ hotel, onBook }) => {
    return (
        <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 border border-gray-100 group">
            <div className="flex flex-col md:flex-row">
                {/* Image */}
                <div className="w-full md:w-2/5 h-64 md:h-auto relative overflow-hidden">
                    <img
                        src={hotel.image}
                        alt={hotel.name}
                        className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full flex items-center gap-1 text-sm font-bold text-brand-dark shadow-sm">
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        {hotel.rating}
                        {hotel.reviews && hotel.reviews > 0 && (
                            <span className="text-xs font-normal text-gray-500 ml-1">({hotel.reviews} reviews)</span>
                        )}
                    </div>
                    {hotel.reviewWord && (
                        <div className="absolute bottom-4 left-4 bg-brand-primary text-white px-3 py-1 rounded-full text-xs font-bold shadow-sm">
                            {hotel.reviewWord}
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="w-full md:w-3/5 p-5 md:p-6 flex flex-col justify-between">
                    <div>
                        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4">
                            <div>
                                <h3 className="text-xl md:text-2xl font-bold text-brand-dark mb-2">{hotel.name}</h3>
                                <div className="flex items-center gap-2 text-gray-500 text-sm">
                                    <MapPin className="w-4 h-4 text-brand-secondary flex-shrink-0" />
                                    <span className="line-clamp-1">{hotel.location}</span>
                                    {hotel.distance && <span className="text-xs text-gray-400 whitespace-nowrap">• {hotel.distance}</span>}
                                </div>
                            </div>
                            <div className="text-left sm:text-right w-full sm:w-auto flex flex-row sm:flex-col justify-between sm:justify-start items-center sm:items-end gap-2 sm:gap-0">
                                <div className="text-sm text-gray-400 mb-0 sm:mb-1">Starting from</div>
                                <div className="flex flex-col items-end">
                                    {hotel.originalPrice && hotel.originalPrice > hotel.price && (
                                        <span className="text-sm text-gray-400 line-through">
                                            {formatCurrency(hotel.originalPrice)}
                                        </span>
                                    )}
                                    <div className="flex items-center gap-2">
                                        {hotel.discountPercentage && (
                                            <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-0.5 rounded">
                                                -{hotel.discountPercentage}%
                                            </span>
                                        )}
                                        <span className="text-2xl md:text-3xl font-bold text-brand-primary">
                                            {formatCurrency(hotel.price)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {hotel.description && (
                            <p className="text-gray-600 mb-4 line-clamp-2 text-sm">{hotel.description}</p>
                        )}

                        {/* Badges */}
                        {hotel.badges && hotel.badges.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-4">
                                {hotel.badges.map((badge, idx) => (
                                    <span key={idx} className="px-2 py-0.5 border border-brand-primary text-brand-primary text-xs rounded font-medium">
                                        {badge}
                                    </span>
                                ))}
                            </div>
                        )}

                        {/* Amenities */}
                        {hotel.amenities && hotel.amenities.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-6">
                                {hotel.amenities.slice(0, 6).map((amenity: string, idx: number) => (
                                    <span key={idx} className="px-2.5 py-1 bg-gray-50 text-gray-600 text-xs rounded-lg font-medium flex items-center gap-1.5 border border-gray-100">
                                        {amenity.toLowerCase().includes('wifi') && <Wifi className="w-3 h-3" />}
                                        {amenity.toLowerCase().includes('breakfast') && <Coffee className="w-3 h-3" />}
                                        {amenity.toLowerCase().includes('shuttle') && <Car className="w-3 h-3" />}
                                        {amenity}
                                    </span>
                                ))}
                                {hotel.amenities.length > 6 && (
                                    <span className="px-2.5 py-1 bg-gray-50 text-gray-400 text-xs rounded-lg font-medium border border-gray-100">
                                        +{hotel.amenities.length - 6} more
                                    </span>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end pt-4 border-t border-gray-100">
                        <Button
                            onClick={() => onBook(hotel)}
                            className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3 rounded-full shadow-lg shadow-brand-primary/20 hover:shadow-brand-primary/30 transition-all"
                        >
                            View Details & Book <ArrowRight className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </div>
        </Card>
    );
};
