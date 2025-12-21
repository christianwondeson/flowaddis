"use client";

import React, { useMemo } from 'react';
import { Users } from 'lucide-react';
import { Popover } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';

export type CabinClass = 'Economy' | 'Premium Economy' | 'Business' | 'First';

export interface TravelerState {
  adults: number; // 18-64
  students: number; // over 18
  seniors: number; // over 65
  youths: number; // 12-17
  children: number; // 2-11
  toddlers: number; // <2 own seat
  infants: number; // <2 on lap
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
    if (value.students) parts.push(`${value.students} Student${value.students > 1 ? 's' : ''}`);
    if (value.seniors) parts.push(`${value.seniors} Senior${value.seniors > 1 ? 's' : ''}`);
    if (value.youths) parts.push(`${value.youths} Youth${value.youths > 1 ? 's' : ''}`);
    if (value.children) parts.push(`${value.children} Child${value.children > 1 ? 'ren' : ''}`);
    if (value.toddlers) parts.push(`${value.toddlers} Toddler${value.toddlers > 1 ? 's' : ''}`);
    if (value.infants) parts.push(`${value.infants} Infant${value.infants > 1 ? 's' : ''}`);
    const paxStr = parts.length ? parts.join(', ') : '1 Adult';
    return `${paxStr}, ${value.cabinClass}`;
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
            <Row label="Adults" sub="18–64" value={value.adults} onChange={(v) => setField('adults', v)} />
            <Row label="Students" sub="over 18" value={value.students} onChange={(v) => setField('students', v)} />
            <Row label="Seniors" sub="over 65" value={value.seniors} onChange={(v) => setField('seniors', v)} />
            <Row label="Youths" sub="12–17" value={value.youths} onChange={(v) => setField('youths', v)} />
            <Row label="Children" sub="2–11" value={value.children} onChange={(v) => setField('children', v)} />
            <Row label="Toddlers in own seat" sub="under 2" value={value.toddlers} onChange={(v) => setField('toddlers', v)} />
            <Row label="Infants on lap" sub="under 2" value={value.infants} onChange={(v) => setField('infants', v)} />
          </div>

          <div className="mt-3 pt-3 border-t">
            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Cabin Class</div>
            <div className="flex flex-wrap gap-2">
              {(['Economy','Premium Economy','Business','First'] as CabinClass[]).map((c) => (
                <Button key={c} variant={value.cabinClass === c ? 'default' : 'outline'} size="sm" className="rounded-full"
                  onClick={() => setField('cabinClass', c)}>
                  {c}
                </Button>
              ))}
            </div>
          </div>
        </div>
      }
    />
  );
};
