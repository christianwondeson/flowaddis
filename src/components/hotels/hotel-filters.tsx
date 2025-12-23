"use client";

import React from 'react';
import { ChevronDown } from 'lucide-react';
import { HotelFilters as FilterType } from '@/types';
import { Input } from '@/components/ui/input';
import { Hotel } from '@/types';
import { HotelMapPreview } from './hotel-map-preview';

interface HotelFiltersProps {
    filters: FilterType;
    onFilterChange: (filters: FilterType) => void;
    hotels?: Hotel[];
    showMapPreview?: boolean;
    linkParams?: Record<string, string | number | undefined | null>;
    checkIn?: string;
    checkOut?: string;
    destId?: string;
}

export const HotelFilters: React.FC<HotelFiltersProps> = ({ filters, onFilterChange, hotels, showMapPreview = true, linkParams, checkIn, checkOut, destId }) => {
    const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        onFilterChange({ ...filters, sortOrder: e.target.value });
    };

    const handleStarChange = (star: number) => {
        const currentStars = filters.stars || [];
        const newStars = currentStars.includes(star)
            ? currentStars.filter((s) => s !== star)
            : [...currentStars, star];
        onFilterChange({ ...filters, stars: newStars });
    };

    const handlePriceChange = (type: 'min' | 'max', value: string) => {
        const numValue = value ? parseInt(value) : undefined;
        onFilterChange({
            ...filters,
            [type === 'min' ? 'minPrice' : 'maxPrice']: numValue,
        });
    };

    const handleAmenityChange = (amenity: string) => {
        const currentAmenities = filters.amenities || [];
        const newAmenities = currentAmenities.includes(amenity)
            ? currentAmenities.filter((a) => a !== amenity)
            : [...currentAmenities, amenity];
        onFilterChange({ ...filters, amenities: newAmenities });
    };

    return (
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 space-y-6">
            {/* Map Preview */}
            {showMapPreview && <HotelMapPreview hotels={hotels} linkParams={linkParams} />}

            <div className="space-y-6">
                <h2 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2">Filter by:</h2>

                {/* Star Rating */}
                <div>
                    <h3 className="text-xs font-bold text-gray-900 mb-3">Star Rating</h3>
                    <div className="flex flex-col gap-2">
                        {[5, 4, 3, 2, 1].map((star) => {
                            const isSelected = filters.stars?.includes(star);
                            return (
                                <button
                                    key={star}
                                    onClick={() => handleStarChange(star)}
                                    className={`w-full text-left px-3 py-1.5 rounded-full border text-xs transition-all ${isSelected
                                            ? "border-blue-600 bg-blue-50 text-blue-600 font-bold"
                                            : "border-gray-200 text-gray-700 hover:border-gray-300"
                                        }`}
                                >
                                    {star} stars
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Review Score */}
                <div>
                    <h3 className="text-xs font-bold text-gray-900 mb-3">Review score</h3>
                    <div className="flex flex-col gap-2">
                        {[
                            { label: 'Wonderful: 9+', value: 90 },
                            { label: 'Very Good: 8+', value: 80 },
                            { label: 'Good: 7+', value: 70 },
                            { label: 'Pleasant: 6+', value: 60 },
                        ].map((score) => {
                            const isSelected = filters.minRating === score.value;
                            return (
                                <button
                                    key={score.value}
                                    onClick={() => onFilterChange({ ...filters, minRating: isSelected ? undefined : score.value })}
                                    className={`w-full text-left px-3 py-1.5 rounded-full border text-xs transition-all ${isSelected
                                            ? "border-blue-600 bg-blue-50 text-blue-600 font-bold"
                                            : "border-gray-200 text-gray-700 hover:border-gray-300"
                                        }`}
                                >
                                    {score.label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Price Range */}
                <div>
                    <h3 className="text-xs font-bold text-gray-900 mb-3">Price Range</h3>
                    <div className="flex gap-2">
                        <Input
                            type="number"
                            placeholder="Min"
                            value={filters.minPrice || ''}
                            onChange={(e) => handlePriceChange('min', e.target.value)}
                            className="h-8 text-xs"
                        />
                        <Input
                            type="number"
                            placeholder="Max"
                            value={filters.maxPrice || ''}
                            onChange={(e) => handlePriceChange('max', e.target.value)}
                            className="h-8 text-xs"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};
