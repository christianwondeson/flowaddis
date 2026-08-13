"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Plane,
  Hotel,
  Users,
  Bus,
  Search,
  MapPin,
  Calendar as CalendarIcon,
  Clock,
  User,
  ArrowLeftRight,
  Minus,
  Plus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LocationInput } from '@/components/search/location-input';
import dynamic from 'next/dynamic';
import { CabinClass } from '@/components/search/traveler-cabin-selector';
import { useRouter } from 'next/navigation';
import { Popover } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { formatDateLocal, parseDateLocal, formatDateEnglishStr, formatDateRangeShort } from '@/lib/date-utils';
import { cn } from '@/lib/utils';
import { Counter } from '@/components/shared/counter';

const GuestSelector = dynamic(() => import('@/components/search/guest-selector').then((m) => m.GuestSelector), {
  ssr: false,
});
const TravelerCabinSelector = dynamic(
  () => import('@/components/search/traveler-cabin-selector').then((m) => m.TravelerCabinSelector),
  { ssr: false },
);
const FlightRouteSelect = dynamic(
  () => import('@/components/search/flight-route-select').then((m) => m.FlightRouteSelect),
  { ssr: false },
);

type TabType = 'flights' | 'hotels' | 'conferences' | 'shuttles';

const TABS: { id: TabType; icon: typeof Plane; label: string; available: boolean }[] = [
  { id: 'flights', icon: Plane, label: 'Flights', available: true },
  { id: 'hotels', icon: Hotel, label: 'Hotels', available: true },
  { id: 'conferences', icon: Users, label: 'Conferences', available: true },
  { id: 'shuttles', icon: Bus, label: 'Shuttles', available: true },
];

const FIELD_LABEL =
  'block text-xs font-semibold text-gray-600 dark:text-slate-400 uppercase tracking-wider mb-1.5';
const FIELD_TRIGGER =
  'flex items-center gap-2.5 w-full min-h-[52px] px-3.5 py-3 bg-gray-50 dark:bg-slate-800/90 border border-gray-200 dark:border-slate-600 rounded-xl hover:bg-white dark:hover:bg-slate-800 hover:border-brand-primary/40 focus-within:border-brand-primary focus-within:ring-2 focus-within:ring-brand-primary/15 transition-all group';
const FIELD_ICON =
  'w-5 h-5 text-gray-400 dark:text-slate-500 shrink-0 group-hover:text-brand-primary transition-colors';
const FIELD_VALUE = 'text-gray-900 dark:text-slate-100 font-medium text-sm truncate min-w-0';
const LOCATION_FIELD =
  '[&_label]:text-xs [&_label]:font-semibold [&_label]:text-gray-600 [&_label]:dark:text-slate-400 [&_label]:uppercase [&_label]:tracking-wider [&_label]:mb-1.5 [&_input]:h-[52px] [&_input]:rounded-xl [&_input]:bg-gray-50 [&_input]:dark:bg-slate-800/90 [&_input]:border-gray-200 [&_input]:dark:border-slate-600 [&_input]:hover:border-brand-primary/40';

function formatTimeDisplay(time: string) {
  const [h, m] = time.split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return time;
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

export function SearchWidget({ onTabChange }: { onTabChange?: (tab: TabType) => void }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('hotels');
  const [isSearching, setIsSearching] = useState(false);

  const handleTabChange = (tab: TabType) => {
    const tabConfig = TABS.find((t) => t.id === tab);
    if (tabConfig?.available) {
      setActiveTab(tab);
      onTabChange?.(tab);
    }
  };

  // Flight State
  const [flightFromCode, setFlightFromCode] = useState('ADD.AIRPORT');
  const [flightToCode, setFlightToCode] = useState('JFK.AIRPORT');
  const [flightFromId, setFlightFromId] = useState('ADD.AIRPORT');
  const [flightToId, setFlightToId] = useState('JFK.AIRPORT');
  const [flightDate, setFlightDate] = useState<string>(formatDateLocal(new Date(Date.now() + 86400000)));
  const [flightReturnDate, setFlightReturnDate] = useState<string>(
    formatDateLocal(new Date(Date.now() + 172800000)),
  );
  const [trav, setTrav] = useState({
    adults: 1,
    children: 0,
    cabinClass: 'ECONOMY' as CabinClass,
  });
  const [flightType, setFlightType] = useState<'ROUNDTRIP' | 'ONEWAY' | 'MULTISTOP'>('ROUNDTRIP');
  const [segments, setSegments] = useState<{ from: string; to: string; date: string }[]>([
    { from: 'ADD.AIRPORT', to: 'JFK.AIRPORT', date: formatDateLocal(new Date(Date.now() + 86400000)) },
    { from: 'JFK.AIRPORT', to: '', date: formatDateLocal(new Date(Date.now() + 172800000)) },
  ]);
  const [orderBy] = useState<'BEST' | 'CHEAPEST' | 'FASTEST'>('BEST');
  const [flightDatesOpen, setFlightDatesOpen] = useState(false);

  // Hotel State
  const [hotelDestination, setHotelDestination] = useState('Addis Ababa, Ethiopia');
  const [hotelLocation, setHotelLocation] = useState<{ dest_id?: string; dest_type?: string }>({
    dest_id: '-603097',
    dest_type: 'city',
  });
  const [hotelCheckIn, setHotelCheckIn] = useState<string>(formatDateLocal(new Date(Date.now() + 86400000)));
  const [hotelCheckOut, setHotelCheckOut] = useState<string>(
    formatDateLocal(new Date(Date.now() + 172800000)),
  );
  const [hotelGuests, setHotelGuests] = useState({ adults: 2, children: 0, rooms: 1 });
  const [hotelDatesOpen, setHotelDatesOpen] = useState(false);

  // Conference State
  const [confLocation, setConfLocation] = useState('Addis Ababa');
  const [confDate, setConfDate] = useState<string>(formatDateLocal(new Date(Date.now() + 86400000)));
  const [confAttendees, setConfAttendees] = useState(50);
  const [confDateOpen, setConfDateOpen] = useState(false);

  // Shuttle State
  const [shuttlePickup, setShuttlePickup] = useState('Bole International Airport');
  const [shuttleDropoff, setShuttleDropoff] = useState('Addis Ababa');
  const [shuttleDate, setShuttleDate] = useState<string>(formatDateLocal(new Date(Date.now() + 86400000)));
  const [shuttleTime, setShuttleTime] = useState('09:00');
  const [shuttleDateOpen, setShuttleDateOpen] = useState(false);

  const swapFlightAirports = () => {
    setFlightFromCode(flightToCode);
    setFlightToCode(flightFromCode);
    setFlightFromId(flightToId);
    setFlightToId(flightFromId);
  };

  const handleSearch = () => {
    if (
      activeTab !== 'flights' &&
      activeTab !== 'hotels' &&
      activeTab !== 'conferences' &&
      activeTab !== 'shuttles'
    )
      return;
    setIsSearching(true);
    if (activeTab === 'flights') {
      const params = new URLSearchParams();
      if (flightType === 'MULTISTOP') {
        params.append('segments', JSON.stringify(segments));
      } else {
        if (flightFromId) params.append('fromId', flightFromId);
        if (flightToId) params.append('toId', flightToId);
        if (flightFromCode) params.append('fromCode', flightFromCode);
        if (flightToCode) params.append('toCode', flightToCode);
        if (flightDate) params.append('departDate', flightDate);
        if (flightType === 'ROUNDTRIP' && flightReturnDate) params.append('returnDate', flightReturnDate);
      }
      params.append('flightType', flightType);
      params.append('cabinClass', trav.cabinClass);
      params.append('orderBy', orderBy);
      params.append('adults', String(trav.adults || 1));
      params.append('children', String(trav.children || 0));
      router.push(`/flights?${params.toString()}`);
    } else if (activeTab === 'hotels') {
      const params = new URLSearchParams();
      const rawQuery = hotelDestination.trim();
      const queryForApi = rawQuery === 'Addis Ababa, Ethiopia' ? 'Addis Ababa' : rawQuery;
      if (queryForApi) params.append('query', queryForApi);
      const destId =
        hotelLocation.dest_id ?? (queryForApi.toLowerCase() === 'addis ababa' ? '-603097' : undefined);
      const destType =
        hotelLocation.dest_type ?? (queryForApi.toLowerCase() === 'addis ababa' ? 'city' : undefined);
      if (destId) params.append('destId', destId);
      if (destType) params.append('destType', destType);
      if (hotelCheckIn) params.append('checkIn', hotelCheckIn);
      if (hotelCheckOut) params.append('checkOut', hotelCheckOut);
      params.append('adults', hotelGuests.adults.toString());
      params.append('children', hotelGuests.children.toString());
      params.append('rooms', hotelGuests.rooms.toString());
      params.append('sortOrder', 'class_descending');
      router.push(`/hotels?${params.toString()}`);
    } else if (activeTab === 'conferences') {
      const params = new URLSearchParams();
      if (confLocation) params.append('location', confLocation);
      if (confDate) params.append('date', confDate);
      params.append('attendees', confAttendees.toString());
      router.push(`/conferences?${params.toString()}`);
    } else if (activeTab === 'shuttles') {
      const params = new URLSearchParams();
      if (shuttlePickup.trim()) params.append('pickup', shuttlePickup.trim());
      if (shuttleDropoff.trim()) {
        params.append('dropoff', shuttleDropoff.trim());
        params.append('city', shuttleDropoff.trim());
      } else if (shuttlePickup.trim()) {
        params.append('city', shuttlePickup.trim());
      }
      if (shuttleDate) params.append('date', shuttleDate);
      if (shuttleTime) params.append('time', shuttleTime);
      router.push(`/shuttles?${params.toString()}`);
    }
    setTimeout(() => setIsSearching(false), 800);
  };

  const searchButton = (
    <Button
      type="button"
      disabled={isSearching}
      aria-busy={isSearching}
      className="w-full lg:w-[132px] shrink-0 h-[52px] flex items-center justify-center gap-2 text-sm font-semibold bg-brand-primary hover:bg-teal-700 text-white rounded-xl shadow-md transition-colors disabled:opacity-70"
      onClick={handleSearch}
    >
      {isSearching ? (
        <>
          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          …
        </>
      ) : (
        <>
          <Search className="w-4 h-4 shrink-0" aria-hidden />
          Search
        </>
      )}
    </Button>
  );

  const dualDatePopover = (
    checkIn: string,
    checkOut: string,
    onCheckIn: (d: Date) => void,
    onCheckOut: (d: Date) => void,
    open: boolean,
    setOpen: (v: boolean) => void,
    labels: [string, string] = ['Check-in', 'Check-out'],
  ) => (
    <Popover
      align="center"
      isOpen={open}
      onOpenChange={setOpen}
      trigger={
        <div className="w-full">
          <label className={FIELD_LABEL}>Dates</label>
          <div className={FIELD_TRIGGER}>
            <CalendarIcon className={FIELD_ICON} aria-hidden />
            <span className={FIELD_VALUE}>{formatDateRangeShort(checkIn, checkOut)}</span>
          </div>
        </div>
      }
      content={
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-1 sm:p-2 min-w-[280px] sm:min-w-[520px]">
          <div>
            <label className={cn(FIELD_LABEL, 'mb-2')}>{labels[0]}</label>
            <Calendar
              selected={checkIn ? parseDateLocal(checkIn) : undefined}
              onSelect={(date) => {
                onCheckIn(date);
                if (checkOut && parseDateLocal(checkOut) <= date) {
                  onCheckOut(new Date(date.getTime() + 86400000));
                }
              }}
              minDate={new Date()}
            />
          </div>
          <div>
            <label className={cn(FIELD_LABEL, 'mb-2')}>{labels[1]}</label>
            <Calendar
              selected={checkOut ? parseDateLocal(checkOut) : undefined}
              onSelect={onCheckOut}
              minDate={checkIn ? parseDateLocal(checkIn) : new Date()}
            />
          </div>
        </div>
      }
    />
  );

  const singleDatePopover = (
    label: string,
    value: string,
    onSelect: (d: Date) => void,
    open: boolean,
    setOpen: (v: boolean) => void,
    minDate?: Date,
  ) => (
    <Popover
      align="center"
      isOpen={open}
      onOpenChange={setOpen}
      trigger={
        <div className="w-full">
          <label className={FIELD_LABEL}>{label}</label>
          <div className={FIELD_TRIGGER}>
            <CalendarIcon className={FIELD_ICON} aria-hidden />
            <span className={FIELD_VALUE}>{value ? formatDateEnglishStr(value) : 'Select date'}</span>
          </div>
        </div>
      }
      content={
        <div className="p-1">
          <Calendar
            selected={value ? parseDateLocal(value) : undefined}
            onSelect={(date) => {
              onSelect(date);
              setOpen(false);
            }}
            minDate={minDate ?? new Date()}
          />
        </div>
      }
    />
  );

  const renderSearchFields = () => {
    switch (activeTab) {
      case 'flights':
        return (
          <div className="space-y-4 w-full">
            <div
              className="inline-flex rounded-xl bg-gray-100 dark:bg-slate-800 p-1"
              role="group"
              aria-label="Trip type"
            >
              {(['ROUNDTRIP', 'ONEWAY', 'MULTISTOP'] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setFlightType(type)}
                  aria-pressed={flightType === type}
                  className={cn(
                    'px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary',
                    flightType === type
                      ? 'bg-white dark:bg-slate-900 text-brand-primary shadow-sm'
                      : 'text-gray-600 dark:text-slate-300 hover:text-brand-primary',
                  )}
                >
                  {type === 'ROUNDTRIP' ? 'Round trip' : type === 'ONEWAY' ? 'One way' : 'Multi-city'}
                </button>
              ))}
            </div>

            {flightType === 'MULTISTOP' ? (
              <div className="space-y-3">
                {segments.map((segment, index) => (
                  <div
                    key={index}
                    className="flex flex-col md:flex-row items-stretch md:items-end gap-3 p-3 rounded-xl border border-gray-100 dark:border-slate-700 bg-gray-50/40 dark:bg-slate-800/30"
                  >
                    <div className="flex-1 min-w-0">
                      <FlightRouteSelect
                        fromCode={segment.from}
                        toCode={segment.to}
                        onChangeFrom={(val) => {
                          const next = [...segments];
                          next[index].from = val;
                          setSegments(next);
                        }}
                        onChangeTo={(val) => {
                          const next = [...segments];
                          next[index].to = val;
                          setSegments(next);
                        }}
                      />
                    </div>
                    <div className="w-full md:w-48 shrink-0">
                      <Popover
                        align="center"
                        trigger={
                          <div className="w-full">
                            <label className={FIELD_LABEL}>Date</label>
                            <div className={FIELD_TRIGGER}>
                              <CalendarIcon className={FIELD_ICON} aria-hidden />
                              <span className={FIELD_VALUE}>
                                {segment.date ? formatDateEnglishStr(segment.date) : 'Select date'}
                              </span>
                            </div>
                          </div>
                        }
                        content={
                          <div className="p-1">
                            <Calendar
                              selected={segment.date ? parseDateLocal(segment.date) : undefined}
                              onSelect={(date) => {
                                const next = [...segments];
                                next[index].date = formatDateLocal(date);
                                setSegments(next);
                              }}
                              minDate={
                                index > 0 && segments[index - 1].date
                                  ? parseDateLocal(segments[index - 1].date)
                                  : new Date()
                              }
                            />
                          </div>
                        }
                      />
                    </div>
                    {segments.length > 2 && (
                      <button
                        type="button"
                        className="h-[52px] w-11 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl transition-colors shrink-0"
                        onClick={() => setSegments(segments.filter((_, i) => i !== index))}
                        aria-label="Remove flight"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-end justify-between gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      if (segments.length < 5) {
                        setSegments([
                          ...segments,
                          {
                            from: segments[segments.length - 1].to,
                            to: '',
                            date: formatDateLocal(
                              new Date(parseDateLocal(segments[segments.length - 1].date).getTime() + 86400000),
                            ),
                          },
                        ]);
                      }
                    }}
                    className="rounded-xl border-dashed border-2 h-[52px] px-6 text-xs"
                    disabled={segments.length >= 5}
                  >
                    + Add flight
                  </Button>
                  <div className="flex flex-col sm:flex-row gap-3 sm:items-end flex-1 sm:justify-end">
                    <div className="w-full sm:w-64">
                      <label className={FIELD_LABEL}>Travelers & class</label>
                      <TravelerCabinSelector value={trav} onChange={setTrav} />
                    </div>
                    {searchButton}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col lg:flex-row gap-3 lg:items-end">
                <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-end">
                  <div className="sm:col-span-1 lg:col-span-3 relative">
                    <LocationInput
                      label="From"
                      placeholder="City or airport"
                      value={flightFromCode}
                      onChange={setFlightFromCode}
                      onSelectLocation={(loc) => setFlightFromId(loc.id || loc.code || loc.iata_code)}
                      api="flights"
                      className={LOCATION_FIELD}
                    />
                    <button
                      type="button"
                      onClick={swapFlightAirports}
                      className="hidden sm:flex absolute z-10 right-[-14px] top-[34px] w-8 h-8 items-center justify-center rounded-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-600 shadow-sm text-gray-500 hover:text-brand-primary hover:border-brand-primary/40"
                      aria-label="Swap airports"
                    >
                      <ArrowLeftRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="sm:col-span-1 lg:col-span-3">
                    <LocationInput
                      label="To"
                      placeholder="City or airport"
                      value={flightToCode}
                      onChange={setFlightToCode}
                      onSelectLocation={(loc) => setFlightToId(loc.id || loc.code || loc.iata_code)}
                      api="flights"
                      dropdownAlign="right"
                      className={LOCATION_FIELD}
                    />
                  </div>
                  <div className="sm:col-span-2 lg:col-span-3">
                    {flightType === 'ROUNDTRIP'
                      ? dualDatePopover(
                          flightDate,
                          flightReturnDate,
                          (date) => setFlightDate(formatDateLocal(date)),
                          (date) => setFlightReturnDate(formatDateLocal(date)),
                          flightDatesOpen,
                          setFlightDatesOpen,
                          ['Departure', 'Return'],
                        )
                      : singleDatePopover(
                          'Departure',
                          flightDate,
                          (date) => setFlightDate(formatDateLocal(date)),
                          flightDatesOpen,
                          setFlightDatesOpen,
                        )}
                  </div>
                  <div className="sm:col-span-2 lg:col-span-3">
                    <label className={FIELD_LABEL}>Travelers & class</label>
                    <TravelerCabinSelector value={trav} onChange={setTrav} />
                  </div>
                </div>
                {searchButton}
              </div>
            )}
          </div>
        );

      case 'hotels':
        return (
          <div className="flex flex-col lg:flex-row gap-3 lg:items-end w-full">
            <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-9 gap-3 items-end">
              <div className="sm:col-span-2 lg:col-span-4">
                <LocationInput
                  label="Destination"
                  placeholder="e.g. Addis Ababa, Ethiopia"
                  value={hotelDestination}
                  onChange={(val) => {
                    setHotelDestination(val);
                    setHotelLocation({});
                  }}
                  onSelectLocation={(loc) => {
                    setHotelLocation({ dest_id: loc.dest_id, dest_type: loc.dest_type });
                    setHotelDestination(loc.name ?? loc.label ?? hotelDestination);
                    if (loc.dest_id != null && loc.dest_type != null) {
                      const params = new URLSearchParams();
                      params.set('query', (loc.name ?? loc.label ?? hotelDestination).trim() || 'Addis Ababa');
                      params.set('destId', String(loc.dest_id));
                      params.set('destType', String(loc.dest_type));
                      params.set('checkIn', hotelCheckIn);
                      params.set('checkOut', hotelCheckOut);
                      params.append('adults', String(hotelGuests.adults));
                      params.append('children', String(hotelGuests.children));
                      params.append('rooms', String(hotelGuests.rooms));
                      params.append('sortOrder', 'class_descending');
                      setIsSearching(true);
                      router.push(`/hotels?${params.toString()}`);
                      setTimeout(() => setIsSearching(false), 800);
                    }
                  }}
                  api="hotels"
                  icon={<MapPin className="w-4 h-4 text-gray-400 dark:text-slate-500 shrink-0" />}
                  className={LOCATION_FIELD}
                />
              </div>
              <div className="sm:col-span-1 lg:col-span-3">
                {dualDatePopover(
                  hotelCheckIn,
                  hotelCheckOut,
                  (date) => setHotelCheckIn(formatDateLocal(date)),
                  (date) => setHotelCheckOut(formatDateLocal(date)),
                  hotelDatesOpen,
                  setHotelDatesOpen,
                )}
              </div>
              <div className="sm:col-span-1 lg:col-span-2">
                <label className={FIELD_LABEL}>Guests</label>
                <Popover
                  trigger={
                    <div className={cn(FIELD_TRIGGER, 'cursor-pointer')}>
                      <User className={FIELD_ICON} aria-hidden />
                      <span className={FIELD_VALUE}>
                        {hotelGuests.rooms} Room{hotelGuests.rooms !== 1 ? 's' : ''},{' '}
                        {hotelGuests.adults + hotelGuests.children} Guest
                        {hotelGuests.adults + hotelGuests.children !== 1 ? 's' : ''}
                      </span>
                    </div>
                  }
                  content={
                    <div className="p-2 min-w-[260px]">
                      <GuestSelector
                        adults={hotelGuests.adults}
                        children={hotelGuests.children}
                        rooms={hotelGuests.rooms}
                        onChange={(adults, children, rooms) => setHotelGuests({ adults, children, rooms })}
                        contentOnly
                      />
                    </div>
                  }
                />
              </div>
            </div>
            {searchButton}
          </div>
        );

      case 'conferences':
        return (
          <div className="flex flex-col lg:flex-row gap-3 lg:items-end w-full">
            <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-end">
              <div className="sm:col-span-2 lg:col-span-5">
                <LocationInput
                  label="Location"
                  placeholder="City or venue area"
                  value={confLocation}
                  onChange={setConfLocation}
                  api="hotels"
                  icon={<MapPin className="w-4 h-4 text-gray-400 dark:text-slate-500 shrink-0" />}
                  className={LOCATION_FIELD}
                />
              </div>
              <div className="sm:col-span-1 lg:col-span-4">
                {singleDatePopover(
                  'Event date',
                  confDate,
                  (date) => setConfDate(formatDateLocal(date)),
                  confDateOpen,
                  setConfDateOpen,
                )}
              </div>
              <div className="sm:col-span-1 lg:col-span-3">
                <label className={FIELD_LABEL}>Attendees</label>
                <Popover
                  trigger={
                    <div className={cn(FIELD_TRIGGER, 'cursor-pointer')}>
                      <Users className={FIELD_ICON} aria-hidden />
                      <span className={FIELD_VALUE}>
                        {confAttendees} guest{confAttendees !== 1 ? 's' : ''}
                      </span>
                    </div>
                  }
                  content={
                    <div className="p-3 min-w-[260px] space-y-3">
                      <Counter
                        label="Attendees"
                        subLabel="Min. 10 · Max. 5,000"
                        value={confAttendees}
                        min={10}
                        max={5000}
                        onChange={setConfAttendees}
                      />
                      <div className="flex items-center gap-2 pt-1 border-t border-gray-100">
                        <button
                          type="button"
                          className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50"
                          onClick={() => setConfAttendees((n) => Math.max(10, n - 10))}
                          aria-label="Decrease by 10"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="flex-1 text-center text-sm font-semibold text-gray-900 tabular-nums">
                          {confAttendees}
                        </span>
                        <button
                          type="button"
                          className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50"
                          onClick={() => setConfAttendees((n) => Math.min(5000, n + 10))}
                          aria-label="Increase by 10"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  }
                />
              </div>
            </div>
            {searchButton}
          </div>
        );

      case 'shuttles':
        return (
          <div className="flex flex-col lg:flex-row gap-3 lg:items-end w-full">
            <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-end">
              <div className="lg:col-span-3">
                <label className={FIELD_LABEL} htmlFor="shuttle-pickup">
                  Pick-up
                </label>
                <div className={FIELD_TRIGGER}>
                  <MapPin className={FIELD_ICON} aria-hidden />
                  <input
                    id="shuttle-pickup"
                    type="text"
                    value={shuttlePickup}
                    onChange={(e) => setShuttlePickup(e.target.value)}
                    placeholder="Airport or hotel"
                    className="flex-1 min-w-0 bg-transparent text-gray-900 dark:text-slate-100 font-medium text-sm outline-none placeholder:text-gray-400"
                  />
                </div>
              </div>
              <div className="lg:col-span-3">
                <label className={FIELD_LABEL} htmlFor="shuttle-dropoff">
                  Drop-off
                </label>
                <div className={FIELD_TRIGGER}>
                  <MapPin className={FIELD_ICON} aria-hidden />
                  <input
                    id="shuttle-dropoff"
                    type="text"
                    value={shuttleDropoff}
                    onChange={(e) => setShuttleDropoff(e.target.value)}
                    placeholder="Destination"
                    className="flex-1 min-w-0 bg-transparent text-gray-900 dark:text-slate-100 font-medium text-sm outline-none placeholder:text-gray-400"
                  />
                </div>
              </div>
              <div className="lg:col-span-3">
                {singleDatePopover(
                  'Date',
                  shuttleDate,
                  (date) => setShuttleDate(formatDateLocal(date)),
                  shuttleDateOpen,
                  setShuttleDateOpen,
                )}
              </div>
              <div className="lg:col-span-3">
                <label className={FIELD_LABEL} htmlFor="shuttle-time">
                  Time
                </label>
                <div className={cn(FIELD_TRIGGER, 'relative')}>
                  <Clock className={FIELD_ICON} aria-hidden />
                  <span className={cn(FIELD_VALUE, 'pointer-events-none')}>
                    {formatTimeDisplay(shuttleTime)}
                  </span>
                  <input
                    id="shuttle-time"
                    type="time"
                    value={shuttleTime}
                    onChange={(e) => setShuttleTime(e.target.value)}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    aria-label="Pick-up time"
                  />
                </div>
              </div>
            </div>
            {searchButton}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35, duration: 0.4 }}
      className="w-full max-w-5xl mx-auto relative z-50 mb-8 md:mb-12 px-3 sm:px-4"
    >
      <div
        role="search"
        aria-label="Search flights, hotels, conferences, and shuttles"
        className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-2xl md:rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.12),0_2px_8px_rgba(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.4)] border border-gray-100/80 dark:border-slate-700 overflow-visible"
      >
        <div className="flex items-center gap-1 md:gap-2 px-4 md:px-6 pt-4 md:pt-5 overflow-x-auto no-scrollbar border-b border-gray-100 dark:border-slate-700 rounded-t-2xl md:rounded-t-3xl">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleTabChange(tab.id)}
              disabled={!tab.available}
              aria-pressed={activeTab === tab.id}
              aria-disabled={!tab.available}
              className={cn(
                'flex items-center gap-2 px-3 py-2.5 md:px-4 md:py-3 text-xs md:text-sm font-semibold transition-colors duration-200 relative whitespace-nowrap rounded-t-lg -mb-px',
                activeTab === tab.id
                  ? 'text-white bg-brand-primary'
                  : tab.available
                    ? 'text-gray-600 dark:text-slate-300 hover:text-brand-primary hover:bg-gray-50/80 dark:hover:bg-slate-800'
                    : 'text-gray-400 dark:text-slate-500 cursor-not-allowed',
              )}
            >
              <tab.icon
                className={cn(
                  'w-4 h-4 shrink-0',
                  activeTab === tab.id
                    ? 'text-white'
                    : tab.available
                      ? 'text-gray-500 dark:text-slate-400'
                      : 'text-gray-400 dark:text-slate-500',
                )}
              />
              <span>{tab.label}</span>
              {activeTab === tab.id && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-primary rounded-t-full"
                  initial={false}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
            </button>
          ))}
        </div>

        <div className="p-4 sm:p-5 md:p-6">{renderSearchFields()}</div>
      </div>
    </motion.div>
  );
}
