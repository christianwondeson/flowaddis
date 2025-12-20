"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plane, Hotel, Users, Bus, Search, MapPin, Calendar, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type TabType = 'flights' | 'hotels' | 'conferences' | 'shuttles';

export function SearchWidget() {
  const [activeTab, setActiveTab] = useState<TabType>('flights');

  const renderSearchFields = () => {
    switch (activeTab) {
      case 'flights':
        return (
          <>
            <div className="md:col-span-3">
              <Input label="From" placeholder="City or Airport" icon={<Plane className="w-4 h-4" />} className="bg-gray-50 border-transparent focus:bg-white" />
            </div>
            <div className="md:col-span-3">
              <Input label="To" placeholder="City or Airport" icon={<Plane className="w-4 h-4" />} className="bg-gray-50 border-transparent focus:bg-white" />
            </div>
            <div className="md:col-span-2">
              <Input label="Departure" type="date" icon={<Calendar className="w-4 h-4" />} className="bg-gray-50 border-transparent focus:bg-white" />
            </div>
            <div className="md:col-span-2">
              <Input label="Passengers" placeholder="1 Adult" icon={<Users className="w-4 h-4" />} className="bg-gray-50 border-transparent focus:bg-white" />
            </div>
          </>
        );
      case 'hotels':
        return (
          <>
            <div className="md:col-span-4">
              <Input label="Destination" placeholder="Where are you going?" icon={<MapPin className="w-4 h-4" />} className="bg-gray-50 border-transparent focus:bg-white" />
            </div>
            <div className="md:col-span-3">
              <Input label="Check-in - Check-out" type="date" icon={<Calendar className="w-4 h-4" />} className="bg-gray-50 border-transparent focus:bg-white" />
            </div>
            <div className="md:col-span-3">
              <Input label="Guests" placeholder="2 Adults, 1 Room" icon={<Users className="w-4 h-4" />} className="bg-gray-50 border-transparent focus:bg-white" />
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
              <Input label="Date" type="date" icon={<Calendar className="w-4 h-4" />} className="bg-gray-50 border-transparent focus:bg-white" />
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
              <Input label="Date" type="date" icon={<Calendar className="w-4 h-4" />} className="bg-gray-50 border-transparent focus:bg-white" />
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
          <Button className="w-full h-[42px] md:h-[50px] flex items-center justify-center gap-2 text-base md:text-lg shadow-xl shadow-blue-600/20">
            <Search className="w-4 md:w-5 h-4 md:h-5" />
            Search
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
