"use client";

import React from 'react';
import { HeroSlider } from '@/components/home/heroSlider';
import { SearchWidget } from '@/components/home/searchWidget';
import { FeaturedHotels } from '@/components/home/featuredHotels';
import { SectionHeading } from '@/components/home/section-heading';
import {
  TrendingDestinations,
  ExploreEthiopia,
} from '@/components/home/promo-sections';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { hotelsDestinationPickUrl } from '@/lib/hotel-promo-links';

export default function HomePage() {
  const [activeTab, setActiveTab] = React.useState('flights');

  return (
    <div className="min-h-screen overflow-x-hidden page-muted">
      {/* Hero Section with Slider */}
      <section className="relative min-h-[500px] md:h-[540px] lg:h-[600px] xl:h-[640px] flex items-center justify-center pt-20 md:pt-24 lg:pt-28 no-scrollbar">
        <HeroSlider>
          <div className="w-full">
            <SearchWidget onTabChange={(tab) => setActiveTab(tab)} />
          </div>
        </HeroSlider>
      </section>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 space-y-16 md:space-y-24 py-12 md:py-16">
        {/* Offers Section - COMMENTED OUT (Mock Data) */}
        {/* <section>
          <OffersSection />
        </section> */}

        {/* Trending Destinations */}
        <section>
          <TrendingDestinations />
        </section>

        {/* Explore Ethiopia */}
        <section>
          <ExploreEthiopia />
        </section>

        {/* Featured Hotels */}
        <section>
          <FeaturedHotels />
        </section>

        {/* Popular with travelers */}
        <section className="pb-8 md:pb-20">
          <SectionHeading
            title="Popular with travelers"
            subtitle="Pick your destination from the list (same as hotels), then search"
          />
          <PopularDestinationsTabs />
        </section>
      </div>
    </div>
  );
}

// Unique Unsplash images per destination – no duplicates, location-specific
const DESTINATION_IMAGES: Record<string, string> = {
  // Ethiopian destinations – each has a distinct image
  'Sof Omar Caves': 'https://images.unsplash.com/photo-1518079562269-53db1e4433b8?auto=format&fit=crop&w=600&q=80',
  'Wenchi Crater': 'https://images.unsplash.com/photo-1662186567737-b2ddea11e547?auto=format&fit=crop&w=600&q=80',
  'Simien Mountains': 'https://images.unsplash.com/photo-1615963644057-838b0829d95b?auto=format&fit=crop&w=600&q=80',
  'Omo Valley': 'https://images.unsplash.com/photo-1658823235938-c424fa0875d6?auto=format&fit=crop&w=600&q=80',
  'Bale Mountains': 'https://images.unsplash.com/photo-1580320209809-a0c51e645872?auto=format&fit=crop&w=600&q=80',
  'Danakil Depression': 'https://images.unsplash.com/photo-1483671174579-bab2a5293389?auto=format&fit=crop&w=600&q=80',
  'Lalibela': 'https://images.unsplash.com/photo-1580320209809-a0c51e645872?auto=format&fit=crop&w=600&q=80',
  'Axum': 'https://images.unsplash.com/photo-1662894312546-667d7698a1f7?auto=format&fit=crop&w=600&q=80',
  'Gondar': 'https://images.unsplash.com/photo-1573403092240-26095e118918?auto=format&fit=crop&w=600&q=80',
  'Harar': 'https://images.unsplash.com/photo-1597709324959-38e0ac50bd4b?auto=format&fit=crop&w=600&q=80',
  'Bahir Dar': 'https://images.unsplash.com/photo-1668939581252-470c103ac7da?auto=format&fit=crop&w=600&q=80',
  'Addis Ababa': 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=600&q=80',
  'Hawassa Lake': 'https://images.unsplash.com/photo-1768383206344-dfeb4a00b18d?auto=format&fit=crop&w=600&q=80',
  'Bishoftu Lakes': 'https://images.unsplash.com/photo-1625141569599-fa40fc7301b6?auto=format&fit=crop&w=600&q=80',
  'Lake Tana': 'https://images.unsplash.com/photo-1612937373987-b1b7db233867?auto=format&fit=crop&w=600&q=80',
  'Langano': 'https://images.unsplash.com/photo-1612937373987-b1b7db233867?auto=format&fit=crop&w=600&q=80',
  'Arba Minch': 'https://images.unsplash.com/photo-1629294563728-9f3f5d98e601?auto=format&fit=crop&w=600&q=80',
  'Debre Zeyt': 'https://images.unsplash.com/photo-1624781789730-f752a7355510?auto=format&fit=crop&w=600&q=80',
  // International
  'Dubai': 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&q=80&w=600',
  'Nairobi': 'https://images.unsplash.com/photo-1585464231875-d9ef1f5ad396?auto=format&fit=crop&q=80&w=600',
  'Johannesburg': 'https://images.unsplash.com/photo-1549944850-84e00be4203b?auto=format&fit=crop&q=80&w=600',
  'Istanbul': 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?auto=format&fit=crop&q=80&w=600',
  'London': 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&q=80&w=600',
  'Paris': 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&q=80&w=600',
};

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=600&q=80';

function PopularDestinationsTabs() {
  const [activeTab, setActiveTab] = React.useState('adventure');

  const defaultParams = new URLSearchParams({
    checkIn: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    checkOut: new Date(Date.now() + 172800000).toISOString().split('T')[0],
    adults: '2',
    children: '0',
    rooms: '1'
  });

  const tabs = [
    { id: 'adventure', label: 'Adventure' },
    { id: 'culture', label: 'Culture' },
    { id: 'relaxation', label: 'Relaxation' },
  ];

  const content: Record<string, { name: string; hint: string }[]> = {
    adventure: [
      { name: 'Sof Omar Caves', hint: 'Sof Omar' },
      { name: 'Wenchi Crater', hint: 'Wenchi' },
      { name: 'Simien Mountains', hint: 'Gondar' },
      { name: 'Omo Valley', hint: 'Omo' },
      { name: 'Bale Mountains', hint: 'Bale' },
      { name: 'Danakil Depression', hint: 'Danakil' },
    ],
    culture: [
      { name: 'Lalibela', hint: 'Lalibela' },
      { name: 'Axum', hint: 'Axum' },
      { name: 'Gondar', hint: 'Gondar' },
      { name: 'Harar', hint: 'Harar' },
      { name: 'Bahir Dar', hint: 'Bahir Dar' },
      { name: 'Addis Ababa', hint: 'Addis Ababa' },
    ],
    relaxation: [
      { name: 'Hawassa Lake', hint: 'Hawassa' },
      { name: 'Bishoftu Lakes', hint: 'Bishoftu' },
      { name: 'Langano', hint: 'Langano' },
      { name: 'Debre Zeyt', hint: 'Debre Zeit' },
      { name: 'Arba Minch', hint: 'Arba Minch' },
      { name: 'Lake Tana', hint: 'Bahir Dar' },
    ],
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <Button
            key={tab.id}
            variant={activeTab === tab.id ? 'default' : 'ghost'}
            onClick={() => setActiveTab(tab.id)}
            className={`rounded-full px-4 sm:px-6 py-2.5 transition-all text-sm sm:text-base ${activeTab === tab.id
              ? 'bg-teal-600 text-white hover:bg-teal-700 border-0'
              : 'text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800'
              }`}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4 sm:gap-6">
        {content[activeTab].map((item, idx) => {
          const image = DESTINATION_IMAGES[item.name] || DESTINATION_IMAGES[item.hint] || FALLBACK_IMAGE;
          const href = hotelsDestinationPickUrl(item.hint, defaultParams);
          return (
            <Link
              key={idx}
              href={href}
              className="group block rounded-2xl overflow-hidden border border-gray-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-all duration-300 bg-white dark:bg-slate-900"
            >
              <div className="aspect-[4/3] sm:aspect-[3/2] relative overflow-hidden bg-gray-100">
                <img
                  src={image}
                  alt={item.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  onError={(e) => e.currentTarget.src = FALLBACK_IMAGE}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 flex flex-col gap-0.5">
                  <span className="text-white font-bold text-sm sm:text-base drop-shadow-md">
                    {item.name.replace(' hotels', '')}
                  </span>
                  <span className="text-teal-200 text-xs font-medium drop-shadow-md">
                    Starting ${[85, 120, 95, 75, 110][idx % 5]}
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
