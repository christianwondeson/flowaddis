'use client';

import React from 'react';
import Image from 'next/image';
import { Heart } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useHotels } from '@/hooks/use-hotels';
import { useTripStore } from '@/store/trip-store';
import { Popover } from '@/components/ui/popover';
import { SectionHeading } from '@/components/home/section-heading';
import { formatHotelPrice } from '@/lib/currency';
import { useEtbUsdRate } from '@/hooks/use-etb-usd-rate';

export function FeaturedHotels() {
  const router = useRouter();
  const { addToTrip, currentTrip, removeFromTrip } = useTripStore();
  const [savedHotelId, setSavedHotelId] = React.useState<string | null>(null);
  const { etbPerUsd } = useEtbUsdRate();

  const { data, isLoading } = useHotels({
    query: 'Addis Ababa',
    filters: { sortOrder: 'popularity' },
  });

  const featuredHotels = data?.hotels.slice(0, 4) || [];

  const defaultParams = new URLSearchParams({
    checkIn: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    checkOut: new Date(Date.now() + 172800000).toISOString().split('T')[0],
    adults: '2',
    rooms: '1',
  });

  const handleBook = (hotelId: string) => {
    router.push(`/hotels/${hotelId}?${defaultParams.toString()}`);
  };

  const handleHeartClick = (e: React.MouseEvent, hotel: { id: string; price?: number }) => {
    e.stopPropagation();
    const isSaved = currentTrip.some((item) => item.details?.id === hotel.id);

    if (isSaved) {
      const tripItem = currentTrip.find((item) => item.details?.id === hotel.id);
      if (tripItem) removeFromTrip(tripItem.id);
      setSavedHotelId(null);
    } else {
      addToTrip({
        type: 'hotel',
        details: hotel,
        price: hotel.price,
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

  if (featuredHotels.length === 0) {
    return null;
  }

  return (
    <section>
      <SectionHeading
        title="Featured hotels"
        subtitle="Experience world-class hospitality in the heart of Addis Ababa."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {featuredHotels.map((hotel, index) => {
          const isSaved = currentTrip.some((item) => item.details?.id === hotel.id);
          const currency = String(
            (hotel as { currency?: string }).currency || 'USD',
          ).toUpperCase();
          const priceLabel = formatHotelPrice(
            Number(hotel.price) || 0,
            currency,
            etbPerUsd,
          );
          const imgSrc =
            typeof hotel.image === 'string' && hotel.image.trim()
              ? hotel.image
              : '/assets/images/addis-view.jpg';

          return (
            <div
              key={hotel.id}
              className="group cursor-pointer flex flex-col h-full bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden"
              onClick={() => handleBook(hotel.id)}
            >
              <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
                <Image
                  src={imgSrc}
                  alt={hotel.name}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  quality={70}
                  priority={index === 0}
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  unoptimized={
                    imgSrc.startsWith('http://127.0.0.1') ||
                    imgSrc.startsWith('http://localhost')
                  }
                />
                <div className="absolute top-3 right-3">
                  <Popover
                    isOpen={savedHotelId === hotel.id}
                    onOpenChange={(open) => !open && setSavedHotelId(null)}
                    trigger={
                      <button
                        type="button"
                        onClick={(e) => handleHeartClick(e, hotel)}
                        className={`p-2 backdrop-blur-sm rounded-full transition-all ${
                          isSaved
                            ? 'bg-red-50 text-red-500'
                            : 'bg-white/80 text-gray-600 hover:text-red-500'
                        }`}
                      >
                        <Heart className={`w-5 h-5 ${isSaved ? 'fill-current' : ''}`} />
                      </button>
                    }
                    content={
                      <SavedToTripPopover
                        isOpen={savedHotelId === hotel.id}
                      />
                    }
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
                    {Number(hotel.rating || 0).toFixed(1)}
                  </div>
                  <div className="text-xs">
                    <span className="font-bold text-gray-900">
                      {hotel.reviewWord || 'Excellent'}
                    </span>
                    <span className="text-gray-500 ml-1">
                      · {hotel.reviews} reviews
                    </span>
                  </div>
                </div>

                <div className="mt-auto pt-4 flex flex-col items-end">
                  <span className="text-xs text-gray-500">Starting from</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl font-bold text-brand-primary tabular-nums">
                      {priceLabel}
                    </span>
                  </div>
                  {currency === 'USD' ? (
                    <span className="text-[10px] text-slate-400 mt-0.5">
                      Shown in ETB (CBE FX)
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function SavedToTripPopover({ isOpen }: { isOpen: boolean }) {
  if (!isOpen) return null;
  return (
    <div className="p-4 bg-white rounded-xl shadow-2xl border border-gray-100 min-w-[240px] animate-in fade-in zoom-in duration-200 relative z-[10010]">
      <p className="text-sm text-gray-600 mb-1 flex items-center gap-1">
        Saved to:
        <Link href="/trips" className="text-brand-primary font-bold hover:underline">
          My next trip
        </Link>
      </p>
    </div>
  );
}
