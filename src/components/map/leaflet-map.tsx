"use client";

import React, { useEffect, useRef } from 'react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

if (typeof window !== 'undefined') {
  // @ts-expect-error leaflet default icon
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  });
}

import { PriceMarker } from '@/types';

export interface LeafletMapProps {
  center: [number, number];
  zoom?: number;
  markers?: PriceMarker[];
  className?: string;
  height?: string;
  /** Fit all markers (ignored when routeSelectedId is set — we fly to that hotel instead) */
  fitToMarkers?: boolean;
  scrollWheelZoom?: boolean;
  /** List hover */
  hoveredId?: string;
  /** Deep-linked hotel from detail page — zoom + bounce */
  routeSelectedId?: string | null;
}

const ChangeView: React.FC<{ center: [number, number]; zoom: number; enabled: boolean }> = ({
  center,
  zoom,
  enabled,
}) => {
  const map = useMap();
  useEffect(() => {
    if (!enabled) return;
    map.setView(center, zoom);
  }, [center, zoom, map, enabled]);
  return null;
};

const FitAllMarkers: React.FC<{ markers: PriceMarker[] }> = ({ markers }) => {
  const map = useMap();
  useEffect(() => {
    if (!map || markers.length === 0) return;
    if (markers.length === 1) {
      const m = markers[0];
      map.setView([m.lat, m.lng], 14, { animate: true });
      return;
    }
    const bounds = L.latLngBounds(markers.map((m) => [m.lat, m.lng] as [number, number]));
    map.fitBounds(bounds, { padding: [48, 48], maxZoom: 15, animate: true });
  }, [map, markers]);
  return null;
};

/** Zoom map to the hotel the user opened from the detail page */
const FlyToRouteSelected: React.FC<{ markers: PriceMarker[]; routeSelectedId: string | null | undefined }> = ({
  markers,
  routeSelectedId,
}) => {
  const map = useMap();
  const flownForIdRef = useRef<string | null>(null);

  useEffect(() => {
    flownForIdRef.current = null;
  }, [routeSelectedId]);

  useEffect(() => {
    if (!routeSelectedId) return;
    const m = markers.find((x) => x.id === routeSelectedId);
    if (!m) return;
    if (flownForIdRef.current === routeSelectedId) return;
    flownForIdRef.current = routeSelectedId;
    map.flyTo([m.lat, m.lng], 16, { duration: 0.85, easeLinearity: 0.25 });
  }, [map, markers, routeSelectedId]);

  return null;
};

function createPriceIcon(m: PriceMarker): L.DivIcon {
  const hovered = Boolean(m.isHovered);
  const route = Boolean(m.isRouteSelected);
  const bg = route ? '#0f766e' : hovered ? '#0f766e' : '#0D9488';
  const arrow = route ? '#0f766e' : hovered ? '#0f766e' : '#0D9488';
  const bounceStyle = route
    ? 'animation: map-marker-bounce 0.85s ease-in-out infinite;'
    : '';
  const pulseStyle = route
    ? 'animation: map-marker-pulse-ring 2s ease-out infinite;'
    : '';
  const scale = route ? 'scale(1.08)' : hovered ? 'scale(1.05)' : 'scale(1)';
  const zIndex = route ? 2000 : hovered ? 1500 : 1;

  return L.divIcon({
    className: 'price-marker',
    html: `
      <div class="price-marker-wrap" style="display:flex;flex-direction:column;align-items:center;transform:translate(-50%,-100%);z-index:${zIndex};${bounceStyle}">
        <div class="price-marker-tag" style="
          background:${bg};
          color:#fff;
          border-radius:10px;
          padding:7px 12px;
          font-weight:800;
          font-size:13px;
          white-space:nowrap;
          border:3px solid #fff;
          box-shadow:0 3px 14px rgba(0,0,0,0.35);
          cursor:pointer;
          transform:${scale};
          transition:transform 0.2s ease;
          ${pulseStyle}
        ">
          US$${Math.round(m.price)}
        </div>
        <div style="
          width:0;height:0;
          border-left:8px solid transparent;
          border-right:8px solid transparent;
          border-top:8px solid ${arrow};
          margin-top:-2px;
        "></div>
      </div>
    `,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
    popupAnchor: [0, -32],
  });
}

export const LeafletMap: React.FC<LeafletMapProps> = ({
  center,
  zoom = 12,
  markers = [],
  className = '',
  height = '300px',
  fitToMarkers = false,
  scrollWheelZoom = false,
  hoveredId,
  routeSelectedId,
}) => {
  const router = useRouter();
  const showFitAll = fitToMarkers && markers.length > 0 && !routeSelectedId;
  const useProgrammaticCenter = !routeSelectedId && !showFitAll;

  if (typeof window === 'undefined') return null;

  return (
    <div className={className} style={{ height }}>
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%', borderRadius: '12px', zIndex: 10 }}
        scrollWheelZoom={scrollWheelZoom}
      >
        <ChangeView center={center} zoom={zoom} enabled={useProgrammaticCenter} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {showFitAll && <FitAllMarkers markers={markers} />}
        {routeSelectedId && <FlyToRouteSelected markers={markers} routeSelectedId={routeSelectedId} />}
        {markers.map((m) => (
          <Marker
            position={[m.lat, m.lng]}
            key={m.id}
            icon={createPriceIcon({
              ...m,
              isHovered: hoveredId === m.id,
              isRouteSelected: routeSelectedId === m.id,
            })}
            zIndexOffset={routeSelectedId === m.id ? 1000 : hoveredId === m.id ? 500 : 0}
          >
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
