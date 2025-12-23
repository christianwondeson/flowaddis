"use client";

import React from 'react';
import { Star, MapPin, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { formatCurrency } from '@/lib/currency';
import { FEATURED_HOTELS } from '@/data/featured-hotels';
import Link from 'next/link';
import { useAuth } from '@/components/providers/auth-provider';
import { useRouter } from 'next/navigation';

import { useHotels } from '@/hooks/use-hotels';
import { Heart } from 'lucide-react';

export function FeaturedHotels() {
  const { user } = useAuth();
  const router = useRouter();

  const { data, isLoading } = useHotels({
    query: 'Addis Ababa',
    filters: { sortOrder: 'popularity' }
  });

  const featuredHotels = data?.hotels.slice(0, 4) || [];

  const defaultParams = new URLSearchParams({
    checkIn: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    checkOut: new Date(Date.now() + 172800000).toISOString().split('T')[0],
    adults: '2',
    rooms: '1'
  });

  const handleBook = (hotelId: string) => {
    router.push(`/hotels/${hotelId}?${defaultParams.toString()}`);
  };

  if (isLoading) {
    return (
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="h-8 w-64 bg-gray-100 animate-pulse rounded mb-8" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-[400px] bg-gray-50 animate-pulse rounded-xl" />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="container mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h2 className="text-2xl md:text-3xl font-bold text-brand-dark mb-1">
          Featured Luxury Hotels
        </h2>
        <p className="text-gray-500 text-sm md:text-base">
          Experience world-class hospitality in the heart of Addis Ababa.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {featuredHotels.map((hotel) => (
          <div key={hotel.id} className="group cursor-pointer flex flex-col h-full bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden" onClick={() => handleBook(hotel.id)}>
            <div className="relative aspect-[4/3] overflow-hidden">
              <img
                src={hotel.image}
                alt={hotel.name}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <button className="absolute top-3 right-3 p-2 bg-white/80 backdrop-blur-sm rounded-full text-gray-600 hover:text-red-500 transition-colors">
                <Heart className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 flex flex-col flex-1">
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="font-bold text-brand-dark line-clamp-2 group-hover:text-brand-primary transition-colors">
                  {hotel.name}
                </h3>
              </div>

              <div className="flex items-center gap-2 mb-3">
                <div className="bg-brand-primary text-white text-xs font-bold px-1.5 py-1 rounded">
                  {hotel.rating.toFixed(1)}
                </div>
                <div className="text-xs">
                  <span className="font-bold text-gray-900">{hotel.reviewWord || 'Excellent'}</span>
                  <span className="text-gray-500 ml-1">· {hotel.reviews} reviews</span>
                </div>
              </div>

              <div className="mt-auto pt-4 flex flex-col items-end">
                <span className="text-xs text-gray-500">Starting from</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-xs font-bold text-gray-900">US$</span>
                  <span className="text-xl font-bold text-gray-900">{Math.round(hotel.price)}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
