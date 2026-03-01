"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { SlidersHorizontal, Filter, Map as MapIcon, X } from 'lucide-react';
import { HotelFilters as FilterType, Hotel } from '@/types';
import { HotelFilters } from '@/components/hotels/hotel-filters';

interface HotelFilterBarProps {
  filters: FilterType;
  onFilterChange: (filters: FilterType) => void;
  hotels?: Hotel[];
  linkParams?: Record<string, string | number | undefined | null>;
  checkIn?: string;
  checkOut?: string;
  destId?: string;
}

export const HotelFilterBar: React.FC<HotelFilterBarProps> = ({
  filters,
  onFilterChange,
  hotels,
  linkParams,
  checkIn,
  checkOut,
  destId,
}) => {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);

  return (
    <div className="md:hidden">
      {/* Top row buttons - touch-friendly min 44px */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setIsSortOpen(true)}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 min-h-[44px] bg-white text-gray-700 border border-gray-200 rounded-xl text-sm font-semibold shadow-sm active:bg-gray-50 transition-colors"
        >
          <SlidersHorizontal className="w-4 h-4" /> Sort
        </button>
        <button
          onClick={() => setIsFilterOpen(true)}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 min-h-[44px] bg-white text-gray-700 border border-gray-200 rounded-xl text-sm font-semibold shadow-sm active:bg-gray-50 transition-colors"
        >
          <Filter className="w-4 h-4" /> Filter
        </button>
        <Link
          href={{
            pathname: '/hotels/map',
            query: {
              ...linkParams,
              sortOrder: filters.sortOrder,
              minPrice: filters.minPrice,
              maxPrice: filters.maxPrice,
              minRating: filters.minRating,
              stars: filters.stars?.join(','),
              amenities: filters.amenities?.join(','),
              hotelName: filters.hotelName,
            }
          }}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 min-h-[44px] bg-white text-gray-700 border border-gray-200 rounded-xl text-sm font-semibold shadow-sm active:bg-gray-50 transition-colors"
        >
          <MapIcon className="w-4 h-4" /> Map
        </Link>
      </div>

      {/* Sort Modal - bottom sheet style */}
      {isSortOpen && (
        <div className="fixed inset-0 z-[10000] bg-black/50 backdrop-blur-sm flex items-end" onClick={() => setIsSortOpen(false)}>
          <div className="bg-white w-full rounded-t-2xl p-4 shadow-2xl animate-in slide-in-from-bottom duration-300" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-base font-bold text-gray-900">Sort by</h3>
              <button
                className="p-2 rounded-full hover:bg-gray-100"
                onClick={() => setIsSortOpen(false)}
                aria-label="Close sort"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="grid gap-2">
              {[
                { label: 'Lowest Price First', value: 'price' },
                { label: 'Star rating and price', value: 'class_descending' },
                { label: 'Popularity', value: 'popularity' },
              ].map((opt) => {
                const active = filters.sortOrder === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => {
                      onFilterChange({ ...filters, sortOrder: opt.value });
                      setIsSortOpen(false);
                    }}
                    className={`w-full text-left px-4 py-3 rounded-xl border text-sm font-bold transition-all ${active
                      ? 'border-blue-600 bg-blue-50 text-blue-600'
                      : 'border-gray-200 text-gray-700 hover:border-gray-300'
                      }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Filter Modal - bottom sheet style */}
      {isFilterOpen && (
        <div className="fixed inset-0 z-[10000] bg-black/50 backdrop-blur-sm flex items-end" onClick={() => setIsFilterOpen(false)}>
          <div className="bg-white w-full max-h-[85vh] overflow-y-auto rounded-t-2xl p-4 shadow-2xl animate-in slide-in-from-bottom duration-300" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold text-gray-900">Filters</h3>
              <button
                className="p-2 rounded-full hover:bg-gray-100"
                onClick={() => setIsFilterOpen(false)}
                aria-label="Close filters"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <HotelFilters
              hotels={hotels}
              filters={filters}
              onFilterChange={onFilterChange}
              showMapPreview={false}
              linkParams={linkParams}
              checkIn={checkIn}
              checkOut={checkOut}
              destId={destId}
            />
          </div>
        </div>
      )}
    </div>
  );
};
