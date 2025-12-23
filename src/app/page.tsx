"use client";

import React from 'react';
import { HeroSlider } from '@/components/home/heroSlider';
import { SearchWidget } from '@/components/home/searchWidget';
import { FeaturedHotels } from '@/components/home/featuredHotels';
import {
  SignInPromo,
  OffersSection,
  TrendingDestinations,
  ExploreEthiopia,
  PropertyTypeSection,
  PerfectStaySection,
  HomesGuestsLoveSection
} from '@/components/home/promo-sections';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function HomePage() {
  const [activeTab, setActiveTab] = React.useState('hotels');

  return (
    <div className="space-y-12 md:space-y-16 lg:space-y-24 pb-16 md:pb-20">
      {/* Hero Section with Slider */}
      <section className="relative min-h-[550px] md:h-[560px] lg:h-[640px] xl:h-[700px] flex items-center justify-center -mt-6 md:-mt-12 lg:-mt-16 xl:-mt-20">
        <HeroSlider>
          <div className="w-full py-12 md:py-0">
            <SearchWidget onTabChange={(tab) => setActiveTab(tab)} />
          </div>
        </HeroSlider>
      </section>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 space-y-16 md:space-y-24">
        {/* Offers Section */}
        <section>
          <OffersSection />
        </section>

        {activeTab !== 'flights' && (
          <>
            {/* Trending Destinations */}
            <section>
              <TrendingDestinations />
            </section>

            {/* Explore Ethiopia */}
            <section>
              <ExploreEthiopia />
            </section>

            {/* Browse by property type */}
            <section>
              <PropertyTypeSection />
            </section>

            {/* Looking for the perfect stay? */}
            <section>
              <PerfectStaySection />
            </section>

            {/* Homes guests love */}
            <section>
              <HomesGuestsLoveSection />
            </section>

            {/* Featured Hotels */}
            <section>
              <FeaturedHotels />
            </section>

            {/* Popular with travelers from Ethiopia */}
            <section className="pb-12">
              <h2 className="text-2xl md:text-3xl font-bold text-brand-dark mb-6">Popular with travelers from Ethiopia</h2>
              <PopularDestinationsTabs />
            </section>
          </>
        )}
      </div>
    </div>
  );
}

function PopularDestinationsTabs() {
  const [activeTab, setActiveTab] = React.useState('domestic');

  const defaultParams = new URLSearchParams({
    checkIn: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    checkOut: new Date(Date.now() + 172800000).toISOString().split('T')[0],
    adults: '2',
    rooms: '1'
  });

  const tabs = [
    { id: 'domestic', label: 'Domestic cities' },
    { id: 'international', label: 'International cities' },
    { id: 'regions', label: 'Regions' },
  ];

  const content: Record<string, { name: string; query: string }[]> = {
    domestic: [
      { name: 'Addis Ababa hotels', query: 'Addis Ababa' },
      { name: 'Bishoftu hotels', query: 'Bishoftu' },
      { name: 'Hawassa hotels', query: 'Hawassa' },
      { name: 'Bahir Dar hotels', query: 'Bahir Dar' },
      { name: 'Gonder hotels', query: 'Gonder' },
      { name: 'Lalibela hotels', query: 'Lalibela' },
      { name: 'Adama hotels', query: 'Adama' },
      { name: 'Mekele hotels', query: 'Mekele' },
    ],
    international: [
      { name: 'Dubai hotels', query: 'Dubai' },
      { name: 'Nairobi hotels', query: 'Nairobi' },
      { name: 'Johannesburg hotels', query: 'Johannesburg' },
      { name: 'Istanbul hotels', query: 'Istanbul' },
      { name: 'London hotels', query: 'London' },
      { name: 'Paris hotels', query: 'Paris' },
    ],
    regions: [
      { name: 'Oromia hotels', query: 'Oromia' },
      { name: 'Amhara hotels', query: 'Amhara' },
      { name: 'Tigray hotels', query: 'Tigray' },
      { name: 'Southern Nations hotels', query: 'Southern Nations' },
    ],
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <Button
            key={tab.id}
            variant={activeTab === tab.id ? 'outline' : 'ghost'}
            onClick={() => setActiveTab(tab.id)}
            className={`rounded-full px-6 transition-all ${activeTab === tab.id
              ? 'border-brand-primary text-brand-primary bg-brand-primary/5'
              : 'text-gray-600 hover:bg-gray-50'
              }`}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-4">
        {content[activeTab].map((item, idx) => (
          <Link
            key={idx}
            href={`/hotels?query=${item.query}&${defaultParams.toString()}`}
            className="text-sm text-gray-600 hover:text-brand-primary transition-colors"
          >
            {item.name}
          </Link>
        ))}
      </div>
    </div>
  );
}
