"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plane, Hotel, Users, Bus, Search, MapPin, Calendar as CalendarIcon, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AirportInput } from '@/components/search/airport-input';
import { LocationInput } from '@/components/search/location-input';
import dynamic from 'next/dynamic';
const GuestSelector = dynamic(() => import('@/components/search/guest-selector').then(m => m.GuestSelector), { ssr: false });
import { useRouter } from 'next/navigation';
import { Popover } from '@/components/ui/popover';
const Calendar = dynamic(() => import('@/components/ui/calendar').then(m => m.Calendar), { ssr: false });
const FlightRouteSelect = dynamic(() => import('@/components/search/flight-route-select').then(m => m.FlightRouteSelect), { ssr: false });

type TabType = 'flights' | 'hotels' | 'conferences' | 'shuttles';

export function SearchWidget() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('flights');

  // Flight State
  const [flightFromCode, setFlightFromCode] = useState('ADD.AIRPORT');
  const [flightToCode, setFlightToCode] = useState('JFK.AIRPORT');
  const [flightDate, setFlightDate] = useState<string>('');
  const [flightPassengers, setFlightPassengers] = useState({ adults: 1, children: 0, rooms: 1 });

  // Hotel State
  const [hotelDestination, setHotelDestination] = useState('Addis Ababa');
  const [hotelCheckIn, setHotelCheckIn] = useState<string>('');
  const [hotelCheckOut, setHotelCheckOut] = useState<string>('');
  const [hotelGuests, setHotelGuests] = useState({ adults: 2, children: 0, rooms: 1 });

  const handleSearch = () => {
    if (activeTab === 'flights') {
      const params = new URLSearchParams();
      if (flightFromCode) params.append('fromCode', flightFromCode);
      if (flightToCode) params.append('toCode', flightToCode);
      if (flightDate) params.append('departDate', flightDate);
      params.append('adults', flightPassengers.adults.toString());
      params.append('children', flightPassengers.children.toString());
      router.push(`/flights?${params.toString()}`);
    } else if (activeTab === 'hotels') {
      const params = new URLSearchParams();
      if (hotelDestination) params.append('query', hotelDestination);
      if (hotelCheckIn) params.append('checkIn', hotelCheckIn);
      if (hotelCheckOut) params.append('checkOut', hotelCheckOut);
      params.append('adults', hotelGuests.adults.toString());
      params.append('children', hotelGuests.children.toString());
      params.append('rooms', hotelGuests.rooms.toString());
      router.push(`/hotels?${params.toString()}`);
    }
  };

  const renderSearchFields = () => {
    switch (activeTab) {
      case 'flights':
        return (
          <>
            <div className="md:col-span-6">
              <FlightRouteSelect
                fromCode={flightFromCode}
                toCode={flightToCode}
                onChangeFrom={setFlightFromCode}
                onChangeTo={setFlightToCode}
              />
            </div>
            <div className="md:col-span-2">
              <Popover
                className="min-w-[260px] md:min-w-[320px] lg:min-w-[360px]"
                trigger={
                  <div className="w-full cursor-pointer">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Departure</label>
                    <div className="flex items-center gap-3 w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl hover:bg-white hover:border-brand-primary/50 transition-all group">
                      <CalendarIcon className="w-5 h-5 text-gray-400 group-hover:text-brand-primary transition-colors" />
                      <span className="text-gray-900 font-medium">{flightDate || 'Select Date'}</span>
                    </div>
                  </div>
                }
                content={
                  <div className="w-full">
                    <Calendar
                      selected={flightDate ? new Date(flightDate) : undefined}
                      onSelect={(date) => setFlightDate(date.toISOString().split('T')[0])}
                      minDate={new Date()}
                    />
                  </div>
                }
              />
            </div>
            <div className="md:col-span-2">
              <GuestSelector
                adults={flightPassengers.adults}
                children={flightPassengers.children}
                rooms={flightPassengers.rooms}
                onChange={(adults, children, rooms) => setFlightPassengers({ adults, children, rooms })}
              />
            </div>
          </>
        );
      case 'hotels':
        return (
          <>
            <div className="md:col-span-4">
              <LocationInput
                label="Destination"
                placeholder="Where are you going?"
                value={hotelDestination}
                onChange={setHotelDestination}
                api="hotels"
              />
            </div>
            <div className="md:col-span-3">
              <div className="grid grid-cols-2 gap-2">
                <Popover
                  className="min-w-[260px] md:min-w-[320px] lg:min-w-[360px]"
                  trigger={
                    <div className="w-full cursor-pointer">
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Check-in</label>
                      <div className="flex items-center gap-3 w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl hover:bg-white hover:border-brand-primary/50 transition-all group">
                        <CalendarIcon className="w-5 h-5 text-gray-400 group-hover:text-brand-primary transition-colors" />
                        <span className="text-gray-900 font-medium">{hotelCheckIn || 'Select Date'}</span>
                      </div>
                    </div>
                  }
                  content={
                    <div className="w-full">
                      <Calendar
                        selected={hotelCheckIn ? new Date(hotelCheckIn) : undefined}
                        onSelect={(date) => setHotelCheckIn(date.toISOString().split('T')[0])}
                        minDate={new Date()}
                      />
                    </div>
                  }
                />
                <Popover
                  className="min-w-[260px] md:min-w-[320px] lg:min-w-[360px]"
                  trigger={
                    <div className="w-full cursor-pointer">
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Check-out</label>
                      <div className="flex items-center gap-3 w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl hover:bg-white hover:border-brand-primary/50 transition-all group">
                        <CalendarIcon className="w-5 h-5 text-gray-400 group-hover:text-brand-primary transition-colors" />
                        <span className="text-gray-900 font-medium">{hotelCheckOut || 'Select Date'}</span>
                      </div>
                    </div>
                  }
                  content={
                    <div className="w-full">
                      <Calendar
                        selected={hotelCheckOut ? new Date(hotelCheckOut) : undefined}
                        onSelect={(date) => setHotelCheckOut(date.toISOString().split('T')[0])}
                        minDate={hotelCheckIn ? new Date(hotelCheckIn) : new Date()}
                      />
                    </div>
                  }
                />
              </div>
            </div>
            <div className="md:col-span-3">
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
            <div className="md:col-span-4">
              <Input label="Location" placeholder="Preferred Area" icon={<MapPin className="w-4 h-4" />} className="bg-gray-50 border-transparent focus:bg-white" />
            </div>
            <div className="md:col-span-3">
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
                content={<Calendar selected={undefined} onSelect={() => {}} minDate={new Date()} />}
              />
            </div>
            <div className="md:col-span-3">
              <Input label="Attendees" placeholder="Number of Guests" icon={<Users className="w-4 h-4" />} className="bg-gray-50 border-transparent focus:bg-white" />
            </div>
          </>
        );
      case 'shuttles':
        return (
          <>
            <div className="md:col-span-3">
              <Input label="Pick-up" placeholder="Location" icon={<MapPin className="w-4 h-4" />} className="bg-gray-50 border-transparent focus:bg-white" />
            </div>
            <div className="md:col-span-3">
              <Input label="Drop-off" placeholder="Destination" icon={<MapPin className="w-4 h-4" />} className="bg-gray-50 border-transparent focus:bg-white" />
            </div>
            <div className="md:col-span-2">
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
                content={<Calendar selected={undefined} onSelect={() => {}} minDate={new Date()} />}
              />
            </div>
            <div className="md:col-span-2">
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
      className="bg-white/95 backdrop-blur-xl rounded-2xl md:rounded-3xl shadow-2xl p-4 md:p-8 max-w-5xl mx-auto border border-white/20 relative z-20"
    >
      {/* Tabs */}
      <div className="flex flex-wrap gap-2 md:gap-3 mb-6 md:mb-8 border-b border-gray-200 pb-4 md:pb-6">
        {[
          { id: 'flights', icon: Plane, label: 'Flights' },
          { id: 'hotels', icon: Hotel, label: 'Hotels' },
          { id: 'conferences', icon: Users, label: 'Conferences' },
          { id: 'shuttles', icon: Bus, label: 'Shuttles' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabType)}
            className={`flex items-center gap-2 px-4 md:px-6 py-2 md:py-3 rounded-full text-xs md:text-sm font-bold transition-all duration-300 ${
              activeTab === tab.id
                ? 'bg-brand-primary text-white shadow-lg shadow-blue-500/30 scale-105'
                : 'text-gray-500 hover:bg-gray-100 hover:text-brand-dark'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Search Form Content */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6 items-end">
        {renderSearchFields()}
        <div className="md:col-span-2">
          <Button 
            className="w-full h-[42px] md:h-[50px] flex items-center justify-center gap-2 text-base md:text-lg shadow-xl shadow-blue-600/20"
            onClick={handleSearch}
          >
            <Search className="w-4 md:w-5 h-4 md:h-5" />
            Search
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
