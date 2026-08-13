"use client";

import React from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { PriceMarker, Hotel } from '@/types';
import { Button } from '@/components/ui/button';

const LeafletMap = dynamic(() => import('@/components/map/leaflet-map').then(m => m.LeafletMap), { ssr: false });

interface HotelMapPreviewProps {
  hotels?: Hotel[];
  linkParams?: Record<string, string | number | undefined | null>;
}

export const HotelMapPreview: React.FC<HotelMapPreviewProps> = ({ hotels = [], linkParams = {} }) => {
  const defaultCenter: [number, number] = [9.0108, 38.7613]; // Addis Ababa
  const center = hotels.length > 0 && hotels[0].coordinates
    ? [hotels[0].coordinates.lat, hotels[0].coordinates.lng] as [number, number]
    : defaultCenter;

  const markers: PriceMarker[] = (hotels || [])
    .filter(h => h.coordinates)
    .slice(0, 30)
    .map(h => ({
      id: h.id,
      name: h.name,
      price: h.price,
      lat: h.coordinates!.lat,
      lng: h.coordinates!.lng,
      image: h.image,
    }));

  const params = new URLSearchParams();
  Object.entries(linkParams).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') params.set(k, String(v));
  });

  return (
    <div className="relative overflow-hidden rounded-xl h-[140px] bg-slate-100 dark:bg-slate-800">
      <LeafletMap center={center} markers={markers} height="140px" className="rounded-xl overflow-hidden pointer-events-none" />
      <Link
        href={`/hotels/map${params.toString() ? `?${params.toString()}` : ''}`}
        className="absolute inset-0 flex items-center justify-center z-[20] bg-slate-900/10 hover:bg-slate-900/20 transition-colors"
      >
        <Button className="bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-full px-4 py-2 text-sm shadow-lg shadow-teal-600/25">
          Show on map
        </Button>
      </Link>
    </div>
  );
};
