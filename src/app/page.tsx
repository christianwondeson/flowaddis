"use client";

import React from 'react';
import { HeroSlider } from '@/components/home/heroSlider';
import { SearchWidget } from '@/components/home/searchWidget';
import { FeaturedHotels } from '@/components/home/featuredHotels';

export default function HomePage() {
  return (
    <div className="space-y-12 md:space-y-16 lg:space-y-24 pb-16 md:pb-20">
      {/* Hero Section with Slider */}
      <section className="relative h-[420px] md:h-[560px] lg:h-[640px] xl:h-[700px] flex items-center justify-center md:-mt-12 lg:-mt-16 xl:-mt-20 -mt-6">
        <HeroSlider>
          <SearchWidget />
        </HeroSlider>
      </section>

      {/* Featured Hotels */}
      <div className="px-4 md:px-6 lg:px-8">
        <FeaturedHotels />
      </div>
    </div>
  );
}
