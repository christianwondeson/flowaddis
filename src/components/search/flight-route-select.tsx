"use client";

import React from 'react';
import { ArrowLeftRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LocationInput } from '@/components/search/location-input';

interface FlightRouteSelectProps {
  fromCode: string;
  toCode: string;
  onChangeFrom: (code: string) => void;
  onChangeTo: (code: string) => void;
  onSelectFrom?: (location: any) => void;
  onSelectTo?: (location: any) => void;
  className?: string;
}

const PRESETS = [
  { label: 'ADD ⇄ DXB', from: 'ADD.AIRPORT', to: 'DXB.AIRPORT' },
  { label: 'ADD ⇄ LHR', from: 'ADD.AIRPORT', to: 'LHR.AIRPORT' },
  { label: 'ADD ⇄ FRA', from: 'ADD.AIRPORT', to: 'FRA.AIRPORT' },
  { label: 'ADD ⇄ IST', from: 'ADD.AIRPORT', to: 'IST.AIRPORT' },
  { label: 'ADD ⇄ JFK', from: 'ADD.AIRPORT', to: 'JFK.AIRPORT' },
  { label: 'ADD ⇄ YYZ', from: 'ADD.AIRPORT', to: 'YYZ.AIRPORT' },
  { label: 'ADD ⇄ DOH', from: 'ADD.AIRPORT', to: 'DOH.AIRPORT' },
  { label: 'ADD ⇄ CDG', from: 'ADD.AIRPORT', to: 'CDG.AIRPORT' },
];

export function FlightRouteSelect({ fromCode, toCode, onChangeFrom, onChangeTo, onSelectFrom, onSelectTo, className }: FlightRouteSelectProps) {
  const swap = () => {
    onChangeFrom(toCode);
    onChangeTo(fromCode);
    // Note: We can't easily swap IDs here without tracking them internally or passing them in.
    // Ideally the parent handles the swap if it tracks IDs.
    // For now, this just swaps the text which is the historical behavior.
  };

  return (
    <div className={className}>
      <div className="grid grid-cols-1 md:grid-cols-7 gap-3 items-end">
        <div className="md:col-span-3">
          <LocationInput
            label="From"
            placeholder="e.g. Addis Ababa (ADD)"
            value={fromCode}
            onChange={onChangeFrom}
            onSelectLocation={onSelectFrom}
            dropdownAlign="left"
          />
        </div>
        <div className="flex md:col-span-1 items-center justify-center md:justify-start">
          <Button type="button" variant="outline" className="w-full md:w-10" onClick={swap} title="Swap">
            <ArrowLeftRight className="w-4 h-4" />
          </Button>
        </div>
        <div className="md:col-span-3">
          <LocationInput
            label="To"
            placeholder="e.g. New York (JFK)"
            value={toCode}
            onChange={onChangeTo}
            onSelectLocation={onSelectTo}
            dropdownAlign="right"
          />
        </div>
      </div>

    </div>
  );
}

export default FlightRouteSelect;
