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

type TabType = 'flights' | 'hotels' | 'conferences' | 'shuttles';

export function SearchWidget({ onTabChange }: { onTabChange?: (tab: TabType) => void }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('hotels');

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    if (onTabChange) onTabChange(tab);
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

  const handleSearch = () => {
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
    }
  };

  const renderSearchFields = () => {
    switch (activeTab) {
      case 'flights':
        return (
          <div className="col-span-full space-y-4">
            <div className="flex items-center gap-4 mb-4">
              <div className="inline-flex rounded-xl bg-gray-100 p-1">
                {['ROUNDTRIP', 'ONEWAY', 'MULTISTOP'].map((type) => (
                  <button
                    key={type}
                    onClick={() => setFlightType(type as any)}
                    className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-bold rounded-lg transition-all ${flightType === type
                      ? 'bg-white text-brand-primary shadow-sm'
                      : 'text-gray-500 hover:text-brand-primary'
                      }`}
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
                              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Date</label>
                              <div className="flex items-center gap-2 w-full px-3 py-3 bg-white border border-gray-200 rounded-xl hover:border-brand-primary/50 transition-all group-hover:border-gray-300">
                                <CalendarIcon className="w-4 h-4 text-gray-400 group-hover:text-brand-primary transition-colors" />
                                <span className="text-gray-900 font-medium text-xs truncate">{segment.date ? formatDateEnglishStr(segment.date) : 'Select Date'}</span>
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
                          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Departure</label>
                          <div className="flex items-center gap-2 w-full px-3 py-3 bg-gray-50 border border-gray-200 rounded-xl hover:bg-white hover:border-brand-primary/50 transition-all group">
                            <CalendarIcon className="w-4 h-4 text-gray-400 group-hover:text-brand-primary transition-colors" />
                            <span className="text-gray-900 font-medium text-xs truncate">{flightDate ? formatDateEnglishStr(flightDate) : 'Select Date'}</span>
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
                        <div className={`w-full cursor-pointer ${flightType === 'ONEWAY' ? 'opacity-50 pointer-events-none' : ''}`}>
                          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Return</label>
                          <div className="flex items-center gap-2 w-full px-3 py-3 bg-gray-50 border border-gray-200 rounded-xl hover:bg-white hover:border-brand-primary/50 transition-all group">
                            <CalendarIcon className="w-4 h-4 text-gray-400 group-hover:text-brand-primary transition-colors" />
                            <span className="text-gray-900 font-medium text-xs truncate">{flightReturnDate ? formatDateEnglishStr(flightReturnDate) : 'Select Date'}</span>
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
                  <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-[0.1em] mb-2 ml-1">Travelers & Class</label>
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
                className="[&_label]:text-[11px] [&_label]:font-bold [&_label]:text-gray-500 [&_label]:uppercase [&_label]:tracking-[0.1em] [&_label]:mb-2 [&_label]:ml-1"
              />
            </div>
            <div className="sm:col-span-2 md:col-span-4">
              <div className="grid grid-cols-2 gap-3">
                <Popover
                  align="center"
                  trigger={
                    <div className="w-full cursor-pointer">
                      <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-[0.1em] mb-2 ml-1">Check-in</label>
                      <div className="flex items-center gap-3 w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl hover:bg-white hover:border-brand-primary/50 transition-all group">
                        <CalendarIcon className="w-5 h-5 text-gray-400 group-hover:text-brand-primary transition-colors" />
                        <span className="text-gray-900 font-semibold text-sm truncate">{hotelCheckIn ? formatDateEnglishStr(hotelCheckIn) : 'Select Date'}</span>
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
                      <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-[0.1em] mb-2 ml-1">Check-out</label>
                      <div className="flex items-center gap-3 w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl hover:bg-white hover:border-brand-primary/50 transition-all group">
                        <CalendarIcon className="w-5 h-5 text-gray-400 group-hover:text-brand-primary transition-colors" />
                        <span className="text-gray-900 font-semibold text-sm truncate">{hotelCheckOut ? formatDateEnglishStr(hotelCheckOut) : 'Select Date'}</span>
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
              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-[0.1em] mb-2 ml-1">Guests</label>
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
              <Input label="Location" placeholder="Preferred Area" icon={<MapPin className="w-4 h-4" />} className="bg-gray-50 border-transparent focus:bg-white" />
            </div>
            <div className="sm:col-span-1 md:col-span-3">
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
            <div className="sm:col-span-1 md:col-span-3">
              <Input label="Attendees" placeholder="Number of Guests" icon={<Users className="w-4 h-4" />} className="bg-gray-50 border-transparent focus:bg-white" />
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
      className="bg-white/80 md:bg-white rounded-2xl md:rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.15)] p-0.5 md:p-1.5 max-w-4xl mx-auto relative z-[100] border border-white/50 backdrop-blur-md md:backdrop-blur-sm mb-8 md:mb-12"
    >
      <div className="bg-white/90 md:bg-white rounded-xl md:rounded-[1.75rem] p-5 md:p-6">
        {/* Tabs */}
        <div className="flex items-center gap-6 md:gap-7 mb-1 md:mb-6 border-b border-gray-100 px-4 md:px-0 overflow-x-auto no-scrollbar">
          {[
            { id: 'flights', icon: Plane, label: 'Flights' },
            { id: 'hotels', icon: Hotel, label: 'Booking' },
            { id: 'conferences', icon: Users, label: 'Conferences' },
            { id: 'shuttles', icon: Bus, label: 'Shuttles' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id as TabType)}
              className={`flex items-center gap-2 pb-2.5 md:pb-3 text-xs md:text-sm font-bold transition-all duration-300 relative whitespace-nowrap ${activeTab === tab.id
                ? 'text-brand-primary'
                : 'text-gray-500 hover:text-brand-primary/70'
                }`}
            >
              <tab.icon className={`w-3.5 h-3.5 md:w-4 md:h-4 ${activeTab === tab.id ? 'text-brand-primary' : 'text-gray-400'}`} />
              <span>{tab.label}</span>
              {activeTab === tab.id && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-primary rounded-full"
                  initial={false}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
            </button>
          ))}
        </div>

        {/* Search Form Content */}
        <div className="flex flex-col md:grid md:grid-cols-12 gap-3 md:gap-4 items-stretch md:items-end pt-2 md:pt-0">
          <div className="flex-1 md:col-span-10">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-10 gap-3 md:gap-3 items-end">
              {renderSearchFields()}
            </div>
          </div>
          <div className="md:col-span-2 mt-2 md:mt-0">
            <Button
              className="w-full h-11 md:h-12 flex items-center justify-center gap-2 text-sm md:text-base font-bold bg-brand-primary hover:bg-brand-dark text-white rounded-xl md:rounded-xl shadow-[0_10px_25px_rgba(0,102,255,0.2)] transition-all hover:scale-[1.01] active:scale-[0.99]"
              onClick={handleSearch}
            >
              <Search className="w-4 h-4" />
              Search
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
