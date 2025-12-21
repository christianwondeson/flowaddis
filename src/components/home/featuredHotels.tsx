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

export function FeaturedHotels() {
  const { user } = useAuth();
  const router = useRouter();
  const featuredHotels = FEATURED_HOTELS.slice(0, 3);

  const handleBook = (hotel: typeof featuredHotels[0]) => {
    if (!user) {
      router.push('/signin?redirect=/');
      return;
    }
    router.push('/hotels');
  };

  return (
    <section className="container mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 md:mb-12 gap-4">
        <div>
          <h2 className="text-3xl md:text-4xl font-extrabold text-brand-dark mb-2 md:mb-3 tracking-tight">
            Featured Luxury Hotels
          </h2>
          <p className="text-gray-500 text-base md:text-lg">
            Experience world-class hospitality in the heart of Addis Ababa.
          </p>
        </div>
        <Link href="/hotels">
          <Button variant="ghost" className="flex items-center gap-2 text-brand-primary hover:bg-blue-50">
            View All <ArrowRight className="w-5 h-5" />
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-10">
        {featuredHotels.map((hotel) => (
          <Card key={hotel.id} hover className="group cursor-pointer border-0 shadow-lg hover:shadow-2xl rounded-2xl md:rounded-3xl">
            <div className="relative h-56 md:h-72 overflow-hidden rounded-t-2xl md:rounded-t-3xl">
              <img
                src={hotel.image}
                alt={hotel.name}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-1 text-sm font-bold text-brand-dark shadow-sm">
                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                {hotel.rating}
              </div>
            </div>
            <div className="p-6 md:p-8">
              <h3 className="text-xl md:text-2xl font-bold text-brand-dark mb-2 group-hover:text-brand-primary transition-colors">
                {hotel.name}
              </h3>
              <div className="flex items-center gap-2 text-gray-500 text-sm mb-4 md:mb-6">
                <MapPin className="w-4 h-4 text-brand-secondary" />
                {hotel.location}
              </div>
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-2xl md:text-3xl font-extrabold text-brand-primary">
                    {formatCurrency(hotel.price)}
                  </span>
                  <span className="text-gray-400 text-sm font-medium"> / night</span>
                </div>
                <Button
                  onClick={() => handleBook(hotel)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-full shadow-lg shadow-brand-primary/20 hover:shadow-brand-primary/30"
                >
                  Book Now <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}
