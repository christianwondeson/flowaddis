"use client";

import React, { Suspense, useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { PriceMarker } from '@/types';
const LeafletMap = dynamic(() => import('@/components/map/leaflet-map').then(m => m.LeafletMap), { ssr: false });
import { HotelList } from '@/components/hotels/hotel-list';
import { HotelFilters } from '@/components/hotels/hotel-filters';
import { useHotels } from '@/hooks/use-hotels';

function HotelsMapContent() {
  const router = useRouter();
  const params = useSearchParams();

  // Pull initial params if present
  const initialQuery = params.get('query') || 'Addis Ababa';
  const initialCheckIn = params.get('checkIn') || '';
  const initialCheckOut = params.get('checkOut') || '';
  const initialSort = params.get('sortOrder') || 'popularity';
  const initialMinPrice = params.get('minPrice');
  const initialMaxPrice = params.get('maxPrice');
  const initialMinRating = params.get('minRating');
  const initialStars = params.get('stars');
  const initialAmenities = params.get('amenities');
  const initialHotelName = params.get('hotelName') || '';

  const [query, setQuery] = useState(initialQuery);
  const [checkIn, setCheckIn] = useState<string | undefined>(initialCheckIn || undefined);
  const [checkOut, setCheckOut] = useState<string | undefined>(initialCheckOut || undefined);
  const [page, setPage] = useState(0);
  const [filters, setFilters] = useState<any>({
    sortOrder: initialSort,
    minPrice: initialMinPrice ? Number(initialMinPrice) : undefined,
    maxPrice: initialMaxPrice ? Number(initialMaxPrice) : undefined,
    minRating: initialMinRating ? Number(initialMinRating) : undefined,
    stars: initialStars ? initialStars.split(',').filter(Boolean).map((s) => Number(s)) : [],
    amenities: initialAmenities ? initialAmenities.split(',').filter(Boolean) : [],
    hotelName: initialHotelName || '',
  });

  const { data, isLoading, error, isPlaceholderData } = useHotels({
    query,
    checkIn: checkIn ? new Date(checkIn) : undefined,
    checkOut: checkOut ? new Date(checkOut) : undefined,
    page,
    filters,
  });

  const hotels = data?.hotels || [];
  const [hoveredId, setHoveredId] = useState<string | undefined>(undefined);

  const center: [number, number] = [9.0108, 38.7613];
  const markers: PriceMarker[] = hotels
    .filter((h) => h.coordinates)
    .map((h) => ({
      id: h.id,
      name: h.name,
      price: h.price,
      lat: h.coordinates!.lat,
      lng: h.coordinates!.lng,
      image: h.image,
    }));

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-4 lg:py-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-brand-dark">Hotels on Map</h1>
          <Button onClick={() => router.push('/hotels')} className="rounded-full">Close map</Button>
        </div>

        {/* Three-column layout: Filters | List | Map */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">
          {/* Filters */}
          <aside className="lg:col-span-3">
            <div className="sticky top-24">
              <HotelFilters showMapPreview={false} hotels={hotels} filters={filters} onFilterChange={(f) => { setPage(0); setFilters(f); }} />
            </div>
          </aside>

          {/* Hotel List */}
          <section className="lg:col-span-5">
            <div className="bg-white rounded-xl p-4 md:p-6 border border-gray-100 shadow-sm">
              <HotelList
                hotels={hotels}
                isLoading={isLoading && page === 0}
                error={error}
                onBook={() => { }}
                onHoverStart={(id) => setHoveredId(id)}
                onHoverEnd={() => setHoveredId(undefined)}
              />
              {data?.hasNextPage && !isPlaceholderData && (
                <div className="flex justify-center mt-4">
                  <Button variant="outline" onClick={() => setPage((p) => p + 1)}>Load more</Button>
                </div>
              )}
            </div>
          </section>

          {/* Map */}
          <section className="lg:col-span-4">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-2 sticky top-24">
              <LeafletMap center={center} markers={markers} highlightedId={hoveredId} fitToMarkers scrollWheelZoom height="calc(100vh - 140px)" className="rounded-xl" />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export default function HotelsMapPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading…</div>}>
      <HotelsMapContent />
    </Suspense>
  );
}
