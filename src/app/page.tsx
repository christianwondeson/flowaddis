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

export default function HomePage() {
  const [activeTab, setActiveTab] = React.useState('flights');

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ backgroundColor: '#F1F5F9' }}>
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
        <section className="pb-16 md:pb-20">
          <SectionHeading
            title="Popular with travelers"
            subtitle="Top picks for your next trip"
          />
          <PopularDestinationsTabs />
        </section>
      </div>
    </div>
  );
}

// Use project's local Ethiopian images + correct Unsplash for international cities
const DESTINATION_IMAGES: Record<string, string> = {
  // Ethiopian cities - local assets (Addis, Wenchi Crater/Bishoftu, Sof Omar, Gonder area)
  'Addis Ababa': '/assets/images/addis-ababa-night.jpg',
  'Bishoftu': '/assets/images/wnchi-lake-crater.png',
  'Hawassa': '/assets/images/wnchi-lake-crater.png',
  'Bahir Dar': '/assets/images/wnchi-lake-crater.png',
  'Gonder': '/assets/images/benuna.jpg',
  'Lalibela': '/assets/images/benuna.jpg',
  'Adama': '/assets/images/addis-view.jpg',
  'Mekele': '/assets/images/benuna.jpg',
  // International cities - city-specific Unsplash images
  'Dubai': 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&q=80&w=400',
  'Nairobi': 'https://images.unsplash.com/photo-1585464231875-d9ef1f5ad396?auto=format&fit=crop&q=80&w=400',
  'Johannesburg': 'https://images.unsplash.com/photo-1549944850-84e00be4203b?auto=format&fit=crop&q=80&w=400',
  'Istanbul': 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?auto=format&fit=crop&q=80&w=400',
  'London': 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&q=80&w=400',
  'Paris': 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&q=80&w=400',
  // Ethiopian regions
  'Oromia': '/assets/images/wnchi-lake-crater.png',
  'Amhara': '/assets/images/benuna.jpg',
  'Tigray': '/assets/images/benuna.jpg',
  'Southern Nations': '/assets/images/sofomar-cave.png',
};

const FALLBACK_IMAGE = '/assets/images/addis-view.jpg';

function PopularDestinationsTabs() {
  const [activeTab, setActiveTab] = React.useState('adventure');

  const defaultParams = new URLSearchParams({
    checkIn: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    checkOut: new Date(Date.now() + 172800000).toISOString().split('T')[0],
    adults: '2',
    rooms: '1'
  });

  const tabs = [
    { id: 'adventure', label: 'Adventure' },
    { id: 'culture', label: 'Culture' },
    { id: 'relaxation', label: 'Relaxation' },
  ];

  const content: Record<string, { name: string; query: string }[]> = {
    adventure: [
      { name: 'Sof Omar Caves', query: 'Southern Nations' },
      { name: 'Wenchi Crater', query: 'Bishoftu' },
      { name: 'Simien Mountains', query: 'Gonder' },
      { name: 'Omo Valley', query: 'Southern Nations' },
      { name: 'Bale Mountains', query: 'Oromia' },
      { name: 'Danakil Depression', query: 'Tigray' },
    ],
    culture: [
      { name: 'Lalibela', query: 'Lalibela' },
      { name: 'Axum', query: 'Mekele' },
      { name: 'Gondar', query: 'Gonder' },
      { name: 'Harar', query: 'Addis Ababa' },
      { name: 'Bahir Dar', query: 'Bahir Dar' },
      { name: 'Addis Ababa', query: 'Addis Ababa' },
    ],
    relaxation: [
      { name: 'Hawassa Lake', query: 'Hawassa' },
      { name: 'Bishoftu Lakes', query: 'Bishoftu' },
      { name: 'Langano', query: 'Oromia' },
      { name: 'Debre Zeyt', query: 'Adama' },
      { name: 'Arba Minch', query: 'Southern Nations' },
      { name: 'Lake Tana', query: 'Bahir Dar' },
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
              : 'text-gray-600 hover:bg-gray-50'
              }`}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4 sm:gap-6">
        {content[activeTab].map((item, idx) => {
          const query = item.query;
          const image = DESTINATION_IMAGES[query] || FALLBACK_IMAGE;
          return (
            <Link
              key={idx}
              href={`/hotels?query=${query}&${defaultParams.toString()}`}
              className="group block rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 bg-white"
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
