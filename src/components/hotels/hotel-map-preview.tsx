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
  const center: [number, number] = [9.0108, 38.7613]; // Addis Ababa default

  const markers: PriceMarker[] = (hotels || [])
    .filter(h => h.coordinates)
    .slice(0, 20)
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
    <div className="relative">
      <LeafletMap center={center} markers={markers} height="180px" className="rounded-xl overflow-hidden" />
      <Link href={`/hotels/map${params.toString() ? `?${params.toString()}` : ''}`} className="absolute inset-0 flex items-center justify-center">
        <Button className="bg-brand-primary text-white font-bold rounded-full px-4 py-2 shadow-lg shadow-brand-primary/30">
          Show on map
        </Button>
      </Link>
    </div>
  );
};
