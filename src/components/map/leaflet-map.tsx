"use client";

import React, { useEffect } from 'react';
import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

if (typeof window !== 'undefined') {
  // Fix default icon paths in Next.js
  // @ts-ignore
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  });
}

import { PriceMarker } from '@/types';

interface LeafletMapProps {
  center: [number, number];
  zoom?: number;
  markers?: PriceMarker[];
  className?: string;
  height?: string;
  fitToMarkers?: boolean;
  scrollWheelZoom?: boolean;
  highlightedId?: string;
}

// Helper to update map view when center changes
const ChangeView: React.FC<{ center: [number, number]; zoom: number }> = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
};

// Helper to fit bounds after markers render
const FitBounds: React.FC<{ markers: PriceMarker[] }> = ({ markers }) => {
  const map = useMap();
  useEffect(() => {
    if (!map || !markers.length) return;
    const bounds = L.latLngBounds(markers.map(m => [m.lat, m.lng] as [number, number]));
    map.fitBounds(bounds, { padding: [30, 30], maxZoom: 15 });
  }, [map, markers]);
  return null;
};

export const LeafletMap: React.FC<LeafletMapProps> = ({ center, zoom = 12, markers = [], className = '', height = '300px', fitToMarkers = false, scrollWheelZoom = false, highlightedId }) => {
  const router = useRouter();

  useEffect(() => {
    // no-op, ensures client-side
  }, []);

  const createPriceIcon = (price: number, highlighted: boolean) =>
    L.divIcon({
      className: 'price-marker',
      html: `
        <style>
          .price-marker-tag {
            background: ${highlighted ? '#e63946' : '#003580'};
            color: #fff;
            border-radius: 6px;
            padding: 6px 10px;
            font-weight: 700;
            font-size: 13px;
            white-space: nowrap;
            border: 2px solid #fff;
            box-shadow: 0 2px 6px rgba(0,0,0,0.25);
            cursor: pointer;
            transition: all 0.2s ease-in-out;
            user-select: none;
          }
          .price-marker-tag:hover {
            transform: scale(1.15) translateY(-2px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.35);
            background: ${highlighted ? '#d62839' : '#0056b3'};
            z-index: 1000 !important;
          }
          .price-marker-arrow {
            width: 0;
            height: 0;
            border-left: 7px solid transparent;
            border-right: 7px solid transparent;
            border-top: 7px solid ${highlighted ? '#e63946' : '#003580'};
            margin-top: -2px;
            transition: border-top-color 0.2s ease-in-out;
          }
          .price-marker-container:hover .price-marker-arrow {
            border-top-color: ${highlighted ? '#d62839' : '#0056b3'};
          }
        </style>
        <div class="price-marker-container" style="display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -100%);">
          <div class="price-marker-tag">
            US$${Math.round(price)}
          </div>
          <div class="price-marker-arrow"></div>
        </div>
      `,
      iconSize: [0, 0],
      iconAnchor: [0, 0],
      popupAnchor: [0, -30],
    });

  if (typeof window === 'undefined') return null;

  return (
    <div className={className} style={{ height }}>
      <MapContainer center={center} zoom={zoom} style={{ height: '100%', width: '100%', borderRadius: '12px', zIndex: 10 }} scrollWheelZoom={scrollWheelZoom}>
        <ChangeView center={center} zoom={zoom} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {fitToMarkers && <FitBounds markers={markers} />}
        {markers.map((m) => (
          <Marker position={[m.lat, m.lng]} key={m.id} icon={createPriceIcon(m.price, m.id === highlightedId)}>
            <Popup>
              <div className="flex flex-col gap-3 min-w-[200px]">
                <div className="flex items-start gap-3">
                  {m.image && <img src={m.image} alt={m.name} className="w-16 h-16 object-cover rounded" />}
                  <div>
                    <div className="font-bold text-sm line-clamp-2">{m.name}</div>
                    <div className="text-brand-primary font-extrabold">${m.price.toFixed(0)}</div>
                  </div>
                </div>
                <Button
                  size="sm"
                  className="w-full rounded-full text-xs h-8"
                  onClick={() => router.push(`/hotels/${m.id}`)}
                >
                  View Details
                </Button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};
