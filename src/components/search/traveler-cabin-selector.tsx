"use client";

import React, { useMemo } from 'react';
import { Users } from 'lucide-react';
import { Popover } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';

export type CabinClass = 'ECONOMY' | 'PREMIUM_ECONOMY' | 'BUSINESS' | 'FIRST';

export interface TravelerState {
  adults: number;
  children: number;
  cabinClass: CabinClass;
}

interface TravelerCabinSelectorProps {
  value: TravelerState;
  onChange: (next: TravelerState) => void;
}

const Row: React.FC<{ label: string; sub?: string; value: number; onChange: (v: number) => void }>
  = ({ label, sub, value, onChange }) => (
    <div className="flex items-center justify-between py-2">
      <div>
        <div className="font-medium text-sm text-gray-800">{label}</div>
        {sub && <div className="text-xs text-gray-400">{sub}</div>}
      </div>
      <div className="flex items-center gap-2">
        <button onClick={() => onChange(Math.max(0, value - 1))} className="w-7 h-7 flex items-center justify-center rounded-full border text-gray-700">-</button>
        <div className="w-6 text-center text-sm font-semibold">{value}</div>
        <button onClick={() => onChange(value + 1)} className="w-7 h-7 flex items-center justify-center rounded-full border text-gray-700">+</button>
      </div>
    </div>
  );

export const TravelerCabinSelector: React.FC<TravelerCabinSelectorProps> = ({ value, onChange }) => {
  const summary = useMemo(() => {
    const parts: string[] = [];
    if (value.adults) parts.push(`${value.adults} Adult${value.adults > 1 ? 's' : ''}`);
    if (value.children) parts.push(`${value.children} Child${value.children > 1 ? 'ren' : ''}`);
    const paxStr = parts.length ? parts.join(', ') : '1 Adult';
    const cabinLabel = value.cabinClass.split('_').map(word => word.charAt(0) + word.slice(1).toLowerCase()).join(' ');
    return `${paxStr}, ${cabinLabel}`;
  }, [value]);

  const setField = (k: keyof TravelerState, v: number | CabinClass) => {
    onChange({ ...value, [k]: v } as TravelerState);
  };

  return (
    <Popover
      trigger={
        <div className="w-full cursor-pointer">
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Travelers & Cabin</label>
          <div className="flex items-center gap-3 w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl hover:bg-white hover:border-brand-primary/50 transition-all group">
            <Users className="w-5 h-5 text-gray-400 group-hover:text-brand-primary transition-colors" />
            <span className="text-gray-900 font-medium truncate">{summary}</span>
          </div>
        </div>
      }
      content={
        <div className="w-[340px] md:w-[420px]">
          <div className="space-y-2">
            <Row label="Adults" value={value.adults} onChange={(v) => setField('adults', v)} />
            <Row label="Children" sub="0-17" value={value.children} onChange={(v) => setField('children', v)} />
          </div>

          <div className="mt-3 pt-3 border-t">
            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Cabin Class</div>
            <div className="flex flex-wrap gap-2">
              {(['ECONOMY', 'PREMIUM_ECONOMY', 'BUSINESS', 'FIRST'] as CabinClass[]).map((c) => (
                <Button key={c} variant={value.cabinClass === c ? 'default' : 'outline'} size="sm" className="rounded-full"
                  onClick={() => setField('cabinClass', c)}>
                  {c.split('_').map(word => word.charAt(0) + word.slice(1).toLowerCase()).join(' ')}
                </Button>
              ))}
            </div>
          </div>
        </div>
      }
    />
  );
};
