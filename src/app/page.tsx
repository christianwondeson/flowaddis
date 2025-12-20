"use client";

import React from 'react';
import { HeroSlider } from '@/components/home/heroSlider';
import { SearchWidget } from '@/components/home/searchWidget';
import { FeaturedHotels } from '@/components/home/featuredHotels';

export default function HomePage() {
  return (
    <div className="space-y-16 md:space-y-24 pb-20">
      {/* Hero Section with Slider */}
      <section className="relative h-[600px] md:h-[700px] flex items-center justify-center overflow-hidden -mt-20">
        <HeroSlider>
          <SearchWidget />
        </HeroSlider>
      </section>

      {/* Featured Hotels */}
      <FeaturedHotels />
    </div>
  );
}
