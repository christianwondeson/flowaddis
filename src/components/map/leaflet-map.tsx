"use client";

import React, { useEffect } from 'react';
import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

const MapContainer = dynamic(() => import('react-leaflet').then(m => m.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(m => m.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(m => m.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then(m => m.Popup), { ssr: false });
const UseMap = dynamic(() => import('react-leaflet').then(m => ({ useMap: m.useMap } as any)), { ssr: false });

if (typeof window !== 'undefined') {
  // Fix default icon paths in Next.js
  // @ts-ignore
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
    iconUrl: require('leaflet/dist/images/marker-icon.png'),
    shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
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

// Helper to fit bounds after markers render
const FitBounds: React.FC<{ markers: PriceMarker[] }> = ({ markers }) => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { useMap } = require('react-leaflet');
  const map = useMap();
  useEffect(() => {
    if (!map || !markers.length) return;
    const bounds = L.latLngBounds(markers.map(m => [m.lat, m.lng] as [number, number]));
    map.fitBounds(bounds, { padding: [30, 30] });
  }, [map, markers]);
  return null;
};

export const LeafletMap: React.FC<LeafletMapProps> = ({ center, zoom = 12, markers = [], className = '', height = '300px', fitToMarkers = false, scrollWheelZoom = false, highlightedId }) => {
  useEffect(() => {
    // no-op, ensures client-side
  }, []);

  const createPriceIcon = (price: number, highlighted: boolean) =>
    L.divIcon({
      className: 'price-marker',
      html: `
        <div style="position:relative;display:inline-flex;align-items:center;justify-content:center;background:${highlighted ? '#0A4FC4' : '#0B63E5'};color:#fff;border-radius:18px;padding:4px 8px;font-weight:800;font-size:12px;box-shadow:0 6px 16px rgba(11,99,229,0.45);white-space:nowrap;border:2px solid #fff;transform:${highlighted ? 'scale(1.1)' : 'scale(1)'};">
          US$${Math.round(price)}
        </div>
        <div style="position:relative;left:12px;width:0;height:0;border-left:6px solid transparent;border-right:6px solid transparent;border-top:8px solid ${highlighted ? '#0A4FC4' : '#0B63E5'};filter:drop-shadow(0 2px 4px rgba(11,99,229,0.35));"></div>
      `,
      iconSize: [1, 1],
      iconAnchor: [0, 0],
      popupAnchor: [0, -12],
    });

  return (
    <div className={className} style={{ height }}>
      <MapContainer center={center} zoom={zoom} style={{ height: '100%', width: '100%', borderRadius: '12px' }} scrollWheelZoom={scrollWheelZoom}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {fitToMarkers && <FitBounds markers={markers} />}
        {markers.map((m) => (
          <Marker position={[m.lat, m.lng]} key={m.id} icon={createPriceIcon(m.price, m.id === highlightedId)}>
            <Popup>
              <div className="flex items-start gap-3">
                {m.image && <img src={m.image} alt={m.name} className="w-16 h-16 object-cover rounded" />}
                <div>
                  <div className="font-bold text-sm">{m.name}</div>
                  <div className="text-brand-primary font-extrabold">${m.price.toFixed(0)}</div>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};
