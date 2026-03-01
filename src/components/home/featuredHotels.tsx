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
import { useTripStore } from '@/store/trip-store';
import { Popover } from '@/components/ui/popover';
import { SectionHeading } from '@/components/home/section-heading';

export function FeaturedHotels() {
  const { user } = useAuth();
  const router = useRouter();
  const { addToTrip, currentTrip, removeFromTrip } = useTripStore();
  const [savedHotelId, setSavedHotelId] = React.useState<string | null>(null);

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

  const handleHeartClick = (e: React.MouseEvent, hotel: any) => {
    e.stopPropagation();
    const isSaved = currentTrip.some(item => item.details?.id === hotel.id);

    if (isSaved) {
      const tripItem = currentTrip.find(item => item.details?.id === hotel.id);
      if (tripItem) removeFromTrip(tripItem.id);
      setSavedHotelId(null);
    } else {
      addToTrip({
        type: 'hotel',
        details: hotel,
        price: hotel.price
      });
      setSavedHotelId(hotel.id);
      setTimeout(() => setSavedHotelId(null), 3000);
    }
  };

  if (isLoading) {
    return (
      <section>
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
    <section>
      <SectionHeading
        title="Featured Luxury Hotels"
        subtitle="Experience world-class hospitality in the heart of Addis Ababa."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {featuredHotels.map((hotel) => {
          const isSaved = currentTrip.some(item => item.details?.id === hotel.id);
          return (
            <div key={hotel.id} className="group cursor-pointer flex flex-col h-full bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden" onClick={() => handleBook(hotel.id)}>
              <div className="relative aspect-[4/3] overflow-hidden">
                <img
                  src={hotel.image}
                  alt={hotel.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute top-3 right-3">
                  <Popover
                    isOpen={savedHotelId === hotel.id}
                    onOpenChange={(open) => !open && setSavedHotelId(null)}
                    trigger={
                      <button
                        onClick={(e) => handleHeartClick(e, hotel)}
                        className={`p-2 backdrop-blur-sm rounded-full transition-all ${isSaved ? 'bg-red-50 text-red-500' : 'bg-white/80 text-gray-600 hover:text-red-500'
                          }`}
                      >
                        <Heart className={`w-5 h-5 ${isSaved ? 'fill-current' : ''}`} />
                      </button>
                    }
                    content={<SavedToTripPopover hotel={hotel} isOpen={savedHotelId === hotel.id} onClose={() => setSavedHotelId(null)} />}
                    placement="bottom"
                    align="right"
                  />
                </div>
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
          );
        })}
      </div>
    </section>
  );
}

function SavedToTripPopover({ hotel, isOpen, onClose }: { hotel: any, isOpen: boolean, onClose: () => void }) {
  return (
    <div className="p-4 bg-white rounded-xl shadow-2xl border border-gray-100 min-w-[240px] animate-in fade-in zoom-in duration-200 relative z-[10010]">
      <div className="flex flex-col gap-4">
        <div>
          <p className="text-sm text-gray-600 mb-1 flex items-center gap-1">
            Saved to:
            <Link href="/trips" className="text-brand-primary font-bold hover:underline">
              My next trip
            </Link>
          </p>
        </div>
        <div className="h-px bg-gray-100" />
        <label className="flex items-center gap-3 cursor-pointer group">
          <div className="w-5 h-5 rounded-full border-2 border-brand-primary flex items-center justify-center">
            <div className="w-2.5 h-2.5 rounded-full bg-brand-primary" />
          </div>
          <span className="text-sm font-medium text-gray-900">My next trip</span>
        </label>
      </div>
    </div>
  );
}
