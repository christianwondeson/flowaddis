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
  const [activeTab, setActiveTab] = React.useState('hotels');

  return (
    <div className="space-y-12 md:space-y-16 lg:space-y-20 pb-16 md:pb-20 overflow-x-hidden">
      {/* Hero Section with Slider */}
      <section className="relative min-h-[500px] md:h-[540px] lg:h-[600px] xl:h-[640px] flex items-center justify-center pt-20 md:pt-24 lg:pt-28 no-scrollbar">
        <HeroSlider>
          <div className="w-full">
            <SearchWidget onTabChange={(tab) => setActiveTab(tab)} />
          </div>
        </HeroSlider>
      </section>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 space-y-16 md:space-y-24">
        {/* Offers Section - COMMENTED OUT (Mock Data) */}
        {/* <section>
          <OffersSection />
        </section> */}

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

            {/* Browse by property type - COMMENTED OUT (Mock Data) */}
            {/* <section>
              <PropertyTypeSection />
            </section> */}

            {/* Looking for the perfect stay? - COMMENTED OUT (Mock Data) */}
            {/* <section>
              <PerfectStaySection />
            </section> */}

            {/* Homes guests love - COMMENTED OUT (Mock Data) */}
            {/* <section>
              <HomesGuestsLoveSection />
            </section> */}

            {/* Featured Hotels */}
            <section>
              <FeaturedHotels />
            </section>

            {/* Popular with travelers from Ethiopia */}
            <section className="pb-12">
              <SectionHeading
                title="Popular with travelers from Ethiopia"
                subtitle="Top picks for your next trip"
              />
              <PopularDestinationsTabs />
            </section>
          </>
        )}
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
            className={`rounded-full px-4 sm:px-6 py-2.5 transition-all text-sm sm:text-base ${activeTab === tab.id
              ? 'border-brand-primary text-brand-primary bg-brand-primary/5'
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
              className="group block rounded-xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 bg-white"
            >
              <div className="aspect-[4/3] sm:aspect-[3/2] relative overflow-hidden bg-gray-100">
                <img
                  src={image}
                  alt={item.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  onError={(e) => e.currentTarget.src = FALLBACK_IMAGE}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <span className="text-white font-bold text-sm sm:text-base drop-shadow-md">
                    {item.name.replace(' hotels', '')}
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
