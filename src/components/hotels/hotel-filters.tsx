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
}

export const HotelFilters: React.FC<HotelFiltersProps> = ({ filters, onFilterChange, hotels, showMapPreview = true, linkParams }) => {
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
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-8">
            {/* Map Preview (hidden on full map page) */}
            {showMapPreview && <HotelMapPreview hotels={hotels} linkParams={linkParams} />}
            
            <div>
                <h3 className="font-bold text-gray-900 mb-3">Hotel Name</h3>
                <Input
                    type="text"
                    placeholder="Search by name..."
                    value={filters.hotelName || ''}
                    onChange={(e) => onFilterChange({ ...filters, hotelName: e.target.value })}
                    className="w-full"
                />
            </div>

            <div>
                <h3 className="font-bold text-gray-900 mb-3">Sort By</h3>
                <div className="relative">
                    <select
                        value={filters.sortOrder || 'popularity'}
                        onChange={handleSortChange}
                        className="w-full p-3 pr-10 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-primary focus:border-transparent bg-gray-50 appearance-none cursor-pointer text-gray-700 font-medium transition-all hover:border-brand-primary/50"
                    >
                        <option value="popularity">Popularity</option>
                        <option value="price">Price: Low to High</option>
                        <option value="class_descending">Star Rating: High to Low</option>
                        <option value="class_ascending">Star Rating: Low to High</option>
                        <option value="review_score">Guest Rating</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
                </div>
            </div>

            <div>
                <h3 className="font-bold text-gray-900 mb-3">Price Range</h3>
                <div className="flex gap-3">
                    <Input
                        type="number"
                        placeholder="Min"
                        value={filters.minPrice || ''}
                        onChange={(e) => handlePriceChange('min', e.target.value)}
                        className="w-full"
                    />
                    <Input
                        type="number"
                        placeholder="Max"
                        value={filters.maxPrice || ''}
                        onChange={(e) => handlePriceChange('max', e.target.value)}
                        className="w-full"
                    />
                </div>
            </div>

            <div>
                <h3 className="font-bold text-gray-900 mb-3">Star Rating</h3>
                <div className="space-y-2.5">
                    {[5, 4, 3].map((star) => (
                        <label key={star} className="flex items-center gap-3 cursor-pointer group">
                            <input
                                type="checkbox"
                                checked={filters.stars?.includes(star) || false}
                                onChange={() => handleStarChange(star)}
                                className="w-5 h-5 rounded border-gray-300 text-brand-primary focus:ring-brand-primary transition-colors"
                            />
                            <span className="text-gray-700 group-hover:text-brand-dark transition-colors">{star} Stars</span>
                        </label>
                    ))}
                </div>
            </div>

            <div>
                <h3 className="font-bold text-gray-900 mb-3">Guest Rating</h3>
                <label className="flex items-center gap-3 cursor-pointer group">
                    <input
                        type="checkbox"
                        checked={filters.minRating === 80}
                        onChange={() => onFilterChange({ ...filters, minRating: filters.minRating === 80 ? undefined : 80 })}
                        className="w-5 h-5 rounded border-gray-300 text-brand-primary focus:ring-brand-primary transition-colors"
                    />
                    <span className="text-gray-700 group-hover:text-brand-dark transition-colors">Very Good: 8+</span>
                </label>
            </div>

            <div>
                <h3 className="font-bold text-gray-900 mb-3">Popular Filters</h3>
                <div className="space-y-2.5">
                    <label className="flex items-center gap-3 cursor-pointer group">
                        <input
                            type="checkbox"
                            checked={filters.amenities?.includes('breakfast') || false}
                            onChange={() => handleAmenityChange('breakfast')}
                            className="w-5 h-5 rounded border-gray-300 text-brand-primary focus:ring-brand-primary transition-colors"
                        />
                        <span className="text-gray-700 group-hover:text-brand-dark transition-colors">Breakfast Included</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer group">
                        <input
                            type="checkbox"
                            checked={filters.amenities?.includes('cancellation') || false}
                            onChange={() => handleAmenityChange('cancellation')}
                            className="w-5 h-5 rounded border-gray-300 text-brand-primary focus:ring-brand-primary transition-colors"
                        />
                        <span className="text-gray-700 group-hover:text-brand-dark transition-colors">Free Cancellation</span>
                    </label>
                </div>
            </div>
        </div>
    );
};
