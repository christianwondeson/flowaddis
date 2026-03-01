"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plane, Hotel, Users, Bus, Search, MapPin, Calendar as CalendarIcon, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LocationInput } from '@/components/search/location-input';
import dynamic from 'next/dynamic';
const GuestSelector = dynamic(() => import('@/components/search/guest-selector').then(m => m.GuestSelector), { ssr: false });
const TravelerCabinSelector = dynamic(() => import('@/components/search/traveler-cabin-selector').then(m => m.TravelerCabinSelector), { ssr: false });
import { CabinClass } from '@/components/search/traveler-cabin-selector';
import { useRouter } from 'next/navigation';
import { Popover } from '@/components/ui/popover';
const Calendar = dynamic(() => import('@/components/ui/calendar').then(m => m.Calendar), { ssr: false });
const FlightRouteSelect = dynamic(() => import('@/components/search/flight-route-select').then(m => m.FlightRouteSelect), { ssr: false });
import { formatDateLocal, parseDateLocal, formatDateEnglishStr } from '@/lib/date-utils';
import { cn } from '@/lib/utils';

type TabType = 'flights' | 'hotels' | 'conferences' | 'shuttles';

const TABS: { id: TabType; icon: typeof Plane; label: string; available: boolean }[] = [
  { id: 'flights', icon: Plane, label: 'Flights', available: true },
  { id: 'hotels', icon: Hotel, label: 'Hotels', available: true },
  { id: 'conferences', icon: Users, label: 'Conferences', available: true },
  { id: 'shuttles', icon: Bus, label: 'Shuttles', available: false },
];

export function SearchWidget({ onTabChange }: { onTabChange?: (tab: TabType) => void }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('hotels');
  const [isSearching, setIsSearching] = useState(false);

  const handleTabChange = (tab: TabType) => {
    const tabConfig = TABS.find((t) => t.id === tab);
    if (tabConfig?.available) {
      setActiveTab(tab);
      if (onTabChange) onTabChange(tab);
    }
  };

  // Flight State
  const [flightFromCode, setFlightFromCode] = useState('ADD.AIRPORT');
  const [flightToCode, setFlightToCode] = useState('JFK.AIRPORT');
  const [flightFromId, setFlightFromId] = useState('ADD.AIRPORT');
  const [flightToId, setFlightToId] = useState('JFK.AIRPORT');
  const [flightDate, setFlightDate] = useState<string>(formatDateLocal(new Date(Date.now() + 86400000)));
  const [flightReturnDate, setFlightReturnDate] = useState<string>(formatDateLocal(new Date(Date.now() + 172800000)));
  const [trav, setTrav] = useState({
    adults: 1,
    children: 0,
    cabinClass: 'ECONOMY' as CabinClass
  });
  const [flightType, setFlightType] = useState<'ROUNDTRIP' | 'ONEWAY' | 'MULTISTOP'>('ROUNDTRIP');
  const [segments, setSegments] = useState<{ from: string; to: string; date: string }[]>([
    { from: 'ADD.AIRPORT', to: 'JFK.AIRPORT', date: formatDateLocal(new Date(Date.now() + 86400000)) },
    { from: 'JFK.AIRPORT', to: '', date: formatDateLocal(new Date(Date.now() + 172800000)) }
  ]);
  const [orderBy, setOrderBy] = useState<'BEST' | 'CHEAPEST' | 'FASTEST'>('BEST');

  // Hotel State
  const [hotelDestination, setHotelDestination] = useState('Addis Ababa');
  const [hotelLocation, setHotelLocation] = useState<{ dest_id?: string; dest_type?: string }>({ dest_id: '-553173', dest_type: 'city' });
  const [hotelCheckIn, setHotelCheckIn] = useState<string>(formatDateLocal(new Date(Date.now() + 86400000)));
  const [hotelCheckOut, setHotelCheckOut] = useState<string>(formatDateLocal(new Date(Date.now() + 172800000)));
  const [hotelGuests, setHotelGuests] = useState({ adults: 2, children: 0, rooms: 1 });

  // Conference State
  const [confLocation, setConfLocation] = useState('Addis Ababa');
  const [confDate, setConfDate] = useState<string>(formatDateLocal(new Date(Date.now() + 86400000)));
  const [confAttendees, setConfAttendees] = useState(50);

  const handleSearch = () => {
    if (activeTab !== 'flights' && activeTab !== 'hotels' && activeTab !== 'conferences') return;
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
        if (flightReturnDate) params.append('returnDate', flightReturnDate);
      }
      params.append('flightType', flightType);
      params.append('cabinClass', trav.cabinClass);
      params.append('orderBy', orderBy);
      params.append('adults', String(trav.adults || 1));
      params.append('children', String(trav.children || 0));
      router.push(`/flights?${params.toString()}`);
    } else if (activeTab === 'hotels') {
      const params = new URLSearchParams();
      if (hotelDestination) params.append('query', hotelDestination);
      if (hotelLocation.dest_id) params.append('destId', hotelLocation.dest_id);
      if (hotelLocation.dest_type) params.append('destType', hotelLocation.dest_type);
      if (hotelCheckIn) params.append('checkIn', hotelCheckIn);
      if (hotelCheckOut) params.append('checkOut', hotelCheckOut);
      params.append('adults', hotelGuests.adults.toString());
      params.append('children', hotelGuests.children.toString());
      params.append('rooms', hotelGuests.rooms.toString());
      params.append('sortOrder', 'popularity');
      router.push(`/hotels?${params.toString()}`);
    } else if (activeTab === 'conferences') {
      const params = new URLSearchParams();
      if (confLocation) params.append('location', confLocation);
      if (confDate) params.append('date', confDate);
      params.append('attendees', confAttendees.toString());
      router.push(`/conferences?${params.toString()}`);
    }
    setTimeout(() => setIsSearching(false), 800);
  };

  const renderSearchFields = () => {
    switch (activeTab) {
      case 'flights':
        return (
          <div className="col-span-full space-y-4">
            <div className="flex items-center gap-4 mb-4">
              <div className="inline-flex rounded-xl bg-gray-100 p-1" role="group" aria-label="Trip type">
                {(['ROUNDTRIP', 'ONEWAY', 'MULTISTOP'] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setFlightType(type)}
                    aria-pressed={flightType === type}
                    className={cn(
                      'px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2',
                      flightType === type
                        ? 'bg-white text-brand-primary shadow-sm'
                        : 'text-gray-600 hover:text-brand-primary',
                    )}
                  >
                    {type === 'ROUNDTRIP' ? 'Round trip' : type === 'ONEWAY' ? 'One way' : 'Multi-city'}
                  </button>
                ))}
              </div>
            </div>

            {flightType === 'MULTISTOP' ? (
              <div className="space-y-4 max-h-[300px] overflow-y-auto no-scrollbar pr-1">
                <div className="grid grid-cols-1 gap-3">
                  {segments.map((segment, index) => (
                    <div key={index} className="flex flex-col md:flex-row items-end gap-3 p-3 bg-gray-50/50 rounded-xl border border-gray-100 relative group transition-all hover:border-brand-primary/20">
                      <div className="flex-1 w-full">
                        <FlightRouteSelect
                          fromCode={segment.from}
                          toCode={segment.to}
                          onChangeFrom={(val) => {
                            const newSegments = [...segments];
                            newSegments[index].from = val;
                            setSegments(newSegments);
                          }}
                          onChangeTo={(val) => {
                            const newSegments = [...segments];
                            newSegments[index].to = val;
                            setSegments(newSegments);
                          }}
                        />
                      </div>
                      <div className="w-full md:w-48">
                        <Popover
                          trigger={
                            <div className="w-full cursor-pointer">
                              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">Date</label>
                              <div className="flex items-center gap-2 w-full px-3 py-3 bg-white border border-gray-200 rounded-xl hover:border-brand-primary/40 hover:bg-gray-50/50 transition-all focus-within:ring-2 focus-within:ring-brand-primary/20 focus-within:border-brand-primary">
                                <CalendarIcon className="w-4 h-4 text-gray-400 shrink-0" aria-hidden />
                                <span className="text-gray-900 font-medium text-sm truncate">{segment.date ? formatDateEnglishStr(segment.date) : 'Select date'}</span>
                              </div>
                            </div>
                          }
                          content={
                            <div className="w-full">
                              <Calendar
                                selected={segment.date ? parseDateLocal(segment.date) : undefined}
                                onSelect={(date) => {
                                  const newSegments = [...segments];
                                  newSegments[index].date = formatDateLocal(date);
                                  setSegments(newSegments);
                                }}
                                minDate={index > 0 && segments[index - 1].date ? parseDateLocal(segments[index - 1].date) : new Date()}
                              />
                            </div>
                          }
                        />
                      </div>
                      {segments.length > 2 && (
                        <button
                          type="button"
                          className="h-11 w-11 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl mb-1 transition-colors"
                          onClick={() => setSegments(segments.filter((_, i) => i !== index))}
                        >
                          <span className="text-xl">×</span>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (segments.length < 5) {
                        setSegments([...segments, {
                          from: segments[segments.length - 1].to,
                          to: '',
                          date: formatDateLocal(new Date(parseDateLocal(segments[segments.length - 1].date).getTime() + 86400000))
                        }]);
                      }
                    }}
                    className="w-full sm:w-auto rounded-xl border-dashed border-2 hover:border-brand-primary hover:text-brand-primary h-11 px-6 text-xs"
                    disabled={segments.length >= 5}
                  >
                    + Add flight
                  </Button>
                  <div className="w-full sm:w-72">
                    <TravelerCabinSelector value={trav as any} onChange={setTrav as any} />
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end bg-white rounded-xl relative z-50">
                <div className="md:col-span-5">
                  <FlightRouteSelect
                    fromCode={flightFromCode}
                    toCode={flightToCode}
                    onChangeFrom={setFlightFromCode}
                    onChangeTo={setFlightToCode}
                    onSelectFrom={(loc) => setFlightFromId(loc.id || loc.code || loc.iata_code)}
                    onSelectTo={(loc) => setFlightToId(loc.id || loc.code || loc.iata_code)}
                  />
                </div>
                <div className="md:col-span-3">
                  <div className="grid grid-cols-2 gap-2">
                    <Popover
                      align="center"
                      trigger={
                        <div className="w-full cursor-pointer">
                          <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">Departure</label>
                          <div className="flex items-center gap-2 w-full px-3 py-3 bg-gray-50 border border-gray-200 rounded-xl hover:bg-white hover:border-brand-primary/40 transition-all">
                            <CalendarIcon className="w-4 h-4 text-gray-400 shrink-0" aria-hidden />
                            <span className="text-gray-900 font-medium text-sm truncate">{flightDate ? formatDateEnglishStr(flightDate) : 'Select date'}</span>
                          </div>
                        </div>
                      }
                      content={
                        <div className="w-full">
                          <Calendar
                            selected={flightDate ? parseDateLocal(flightDate) : undefined}
                            onSelect={(date) => setFlightDate(formatDateLocal(date))}
                            minDate={new Date()}
                          />
                        </div>
                      }
                    />
                    <Popover
                      trigger={
                        <div className={cn('w-full cursor-pointer', flightType === 'ONEWAY' && 'opacity-50 pointer-events-none')}>
                          <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">Return</label>
                          <div className="flex items-center gap-2 w-full px-3 py-3 bg-gray-50 border border-gray-200 rounded-xl hover:bg-white hover:border-brand-primary/40 transition-all">
                            <CalendarIcon className="w-4 h-4 text-gray-400 shrink-0" aria-hidden />
                            <span className="text-gray-900 font-medium text-sm truncate">{flightReturnDate ? formatDateEnglishStr(flightReturnDate) : 'Select date'}</span>
                          </div>
                        </div>
                      }
                      content={
                        <div className="w-full">
                          <Calendar
                            selected={flightReturnDate ? parseDateLocal(flightReturnDate) : undefined}
                            onSelect={(date) => setFlightReturnDate(formatDateLocal(date))}
                            minDate={flightDate ? parseDateLocal(flightDate) : new Date()}
                          />
                        </div>
                      }
                    />
                  </div>
                </div>
                <div className="md:col-span-4">
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">Travelers & Class</label>
                  <TravelerCabinSelector value={trav as any} onChange={setTrav as any} />
                </div>
              </div>
            )}
          </div>
        );
      case 'hotels':
        return (
          <>
            <div className="sm:col-span-2 md:col-span-4">
              <LocationInput
                label="Destination"
                placeholder="Where are you going?"
                value={hotelDestination}
                onChange={(val) => {
                  setHotelDestination(val);
                  setHotelLocation({});
                }}
                onSelectLocation={(loc) => setHotelLocation({ dest_id: loc.dest_id, dest_type: loc.dest_type })}
                api="hotels"
                className="[&_label]:text-xs [&_label]:font-semibold [&_label]:text-gray-600 [&_label]:uppercase [&_label]:tracking-wider [&_label]:mb-1.5"
              />
            </div>
            <div className="sm:col-span-2 md:col-span-4">
              <div className="grid grid-cols-2 gap-3">
                <Popover
                  align="center"
                  trigger={
                    <div className="w-full cursor-pointer">
                      <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">Check-in</label>
                      <div className="flex items-center gap-3 w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl hover:bg-white hover:border-brand-primary/40 transition-all">
                        <CalendarIcon className="w-5 h-5 text-gray-400 shrink-0" aria-hidden />
                        <span className="text-gray-900 font-medium text-sm truncate">{hotelCheckIn ? formatDateEnglishStr(hotelCheckIn) : 'Select date'}</span>
                      </div>
                    </div>
                  }
                  content={
                    <div className="w-full">
                      <Calendar
                        selected={hotelCheckIn ? parseDateLocal(hotelCheckIn) : undefined}
                        onSelect={(date) => setHotelCheckIn(formatDateLocal(date))}
                        minDate={new Date()}
                      />
                    </div>
                  }
                />
                <Popover
                  trigger={
                    <div className="w-full cursor-pointer">
                      <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">Check-out</label>
                      <div className="flex items-center gap-3 w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl hover:bg-white hover:border-brand-primary/40 transition-all">
                        <CalendarIcon className="w-5 h-5 text-gray-400 shrink-0" aria-hidden />
                        <span className="text-gray-900 font-medium text-sm truncate">{hotelCheckOut ? formatDateEnglishStr(hotelCheckOut) : 'Select date'}</span>
                      </div>
                    </div>
                  }
                  content={
                    <div className="w-full">
                      <Calendar
                        selected={hotelCheckOut ? parseDateLocal(hotelCheckOut) : undefined}
                        onSelect={(date) => setHotelCheckOut(formatDateLocal(date))}
                        minDate={hotelCheckIn ? parseDateLocal(hotelCheckIn) : new Date()}
                      />
                    </div>
                  }
                />
              </div>
            </div>
            <div className="sm:col-span-2 md:col-span-2">
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">Guests</label>
              <GuestSelector
                adults={hotelGuests.adults}
                children={hotelGuests.children}
                rooms={hotelGuests.rooms}
                onChange={(adults, children, rooms) => setHotelGuests({ adults, children, rooms })}
              />
            </div>
          </>
        );
      case 'conferences':
        return (
          <>
            <div className="sm:col-span-2 md:col-span-4">
              <LocationInput
                label="Location"
                placeholder="City or preferred area"
                value={confLocation}
                onChange={setConfLocation}
                api="hotels"
                className="[&_label]:text-xs [&_label]:font-semibold [&_label]:text-gray-600 [&_label]:uppercase [&_label]:tracking-wider [&_label]:mb-1.5"
              />
            </div>
            <div className="sm:col-span-2 md:col-span-4">
              <Popover
                align="center"
                trigger={
                  <div className="w-full cursor-pointer">
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">Event date</label>
                    <div className="flex items-center gap-3 w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl hover:bg-white hover:border-brand-primary/40 transition-all">
                      <CalendarIcon className="w-5 h-5 text-gray-400 shrink-0" aria-hidden />
                      <span className="text-gray-900 font-medium text-sm truncate">{confDate ? formatDateEnglishStr(confDate) : 'Select date'}</span>
                    </div>
                  </div>
                }
                content={
                  <div className="w-full">
                    <Calendar
                      selected={confDate ? parseDateLocal(confDate) : undefined}
                      onSelect={(date) => setConfDate(formatDateLocal(date))}
                      minDate={new Date()}
                    />
                  </div>
                }
              />
            </div>
            <div className="sm:col-span-2 md:col-span-2">
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">Attendees</label>
              <div className="flex items-center gap-3 w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl hover:bg-white hover:border-brand-primary/40 transition-all">
                <Users className="w-5 h-5 text-gray-400 shrink-0" aria-hidden />
                <input
                  type="number"
                  min={10}
                  max={5000}
                  value={confAttendees}
                  onChange={(e) => setConfAttendees(Math.min(5000, Math.max(10, parseInt(e.target.value) || 10)))}
                  className="flex-1 min-w-0 bg-transparent text-gray-900 font-medium text-sm outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  aria-label="Number of attendees"
                />
                <span className="text-gray-500 text-sm shrink-0">guests</span>
              </div>
            </div>
          </>
        );
      case 'shuttles':
        return (
          <>
            <div className="sm:col-span-1 md:col-span-3">
              <Input label="Pick-up" placeholder="Location" icon={<MapPin className="w-4 h-4" />} className="bg-gray-50 border-transparent focus:bg-white" />
            </div>
            <div className="sm:col-span-1 md:col-span-3">
              <Input label="Drop-off" placeholder="Destination" icon={<MapPin className="w-4 h-4" />} className="bg-gray-50 border-transparent focus:bg-white" />
            </div>
            <div className="sm:col-span-1 md:col-span-2">
              <Popover
                trigger={
                  <div className="w-full cursor-pointer">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Date</label>
                    <div className="flex items-center gap-3 w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl hover:bg-white hover:border-brand-primary/50 transition-all group">
                      <CalendarIcon className="w-5 h-5 text-gray-400 group-hover:text-brand-primary transition-colors" />
                      <span className="text-gray-900 font-medium">Select Date</span>
                    </div>
                  </div>
                }
                content={<Calendar selected={undefined} onSelect={() => { }} minDate={new Date()} />}
              />
            </div>
            <div className="sm:col-span-1 md:col-span-2">
              <Input label="Time" type="time" icon={<Clock className="w-4 h-4" />} className="bg-gray-50 border-transparent focus:bg-white" />
            </div>
          </>
        );
      default:
        return null;
    }
  };

  const canSearch = activeTab === 'flights' || activeTab === 'hotels' || activeTab === 'conferences';

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
      className="w-full max-w-4xl mx-auto relative z-50 mb-8 md:mb-12 px-3 sm:px-4"
    >
      <div
        role="search"
        aria-label="Search for flights and hotels"
        className="bg-white/95 backdrop-blur-xl rounded-2xl md:rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.12),0_2px_8px_rgba(0,0,0,0.04)] border border-gray-100/80 overflow-hidden"
      >
        {/* Tabs */}
        <div className="flex items-center gap-1 md:gap-2 px-4 md:px-6 pt-4 md:pt-5 overflow-x-auto no-scrollbar border-b border-gray-100">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleTabChange(tab.id)}
              disabled={!tab.available}
              aria-pressed={activeTab === tab.id}
              aria-disabled={!tab.available}
              className={cn(
                'flex items-center gap-2 px-3 py-2.5 md:px-4 md:py-3 text-xs md:text-sm font-semibold transition-all duration-200 relative whitespace-nowrap rounded-t-lg -mb-px',
                activeTab === tab.id
                  ? 'text-brand-primary bg-brand-primary/5'
                  : tab.available
                    ? 'text-gray-600 hover:text-brand-primary hover:bg-gray-50/80'
                    : 'text-gray-400 cursor-not-allowed',
              )}
            >
              <tab.icon className={cn('w-4 h-4 shrink-0', activeTab === tab.id ? 'text-brand-primary' : tab.available ? 'text-gray-500' : 'text-gray-400')} />
              <span>{tab.label}</span>
              {!tab.available && (
                <span className="hidden sm:inline text-[10px] font-medium text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                  Soon
                </span>
              )}
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

        {/* Search Form Content */}
        <div className="flex flex-col md:grid md:grid-cols-12 gap-4 md:gap-5 items-stretch md:items-end p-4 sm:p-5 md:p-6">
          <div className="flex-1 md:col-span-10 min-w-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-10 gap-3 md:gap-4 items-end">
              {renderSearchFields()}
            </div>
          </div>
          <div className="md:col-span-2 mt-2 md:mt-0 w-full">
            <Button
              type="button"
              disabled={!canSearch || isSearching}
              aria-busy={isSearching}
              className="w-full h-12 md:h-[52px] flex items-center justify-center gap-2 text-sm md:text-base font-semibold bg-brand-primary hover:bg-[#0055a8] text-white rounded-xl shadow-[0_4px_14px_rgba(0,102,255,0.25)] transition-all hover:shadow-[0_6px_20px_rgba(0,102,255,0.3)] hover:scale-[1.01] active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100"
              onClick={handleSearch}
            >
              {isSearching ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Searching…
                </>
              ) : (
                <>
                  <Search className="w-4 h-4 shrink-0" aria-hidden />
                  Search
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
