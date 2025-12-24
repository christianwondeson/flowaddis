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
      {/* Top row buttons */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setIsSortOpen(true)}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-white text-gray-700 border border-gray-200 rounded-full text-sm font-bold shadow-sm"
        >
          <SlidersHorizontal className="w-4 h-4" /> Sort
        </button>
        <button
          onClick={() => setIsFilterOpen(true)}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-white text-gray-700 border border-gray-200 rounded-full text-sm font-bold shadow-sm"
        >
          <Filter className="w-4 h-4" /> Filter
        </button>
        <Link
          href="/hotels/map"
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-white text-gray-700 border border-gray-200 rounded-full text-sm font-bold shadow-sm"
        >
          <MapIcon className="w-4 h-4" /> Map
        </Link>
      </div>

      {/* Sort Modal */}
      {isSortOpen && (
        <div className="fixed inset-0 z-[10000] bg-black/50 backdrop-blur-sm flex items-end">
          <div className="bg-white w-full rounded-t-2xl p-4 shadow-2xl">
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
                    className={`w-full text-left px-4 py-3 rounded-xl border text-sm font-bold transition-all ${
                      active
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

      {/* Filter Modal */}
      {isFilterOpen && (
        <div className="fixed inset-0 z-[10000] bg-black/50 backdrop-blur-sm flex items-end">
          <div className="bg-white w-full max-h-[85vh] overflow-y-auto rounded-t-2xl p-4 shadow-2xl">
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
