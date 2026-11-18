'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

/** Pre-compressed WebP hero slides (see public/assets/images/*.webp). */
const slides = [
  {
    image: '/assets/images/addis-ababa-night.webp',
    title: 'Experience Addis at Night',
    subtitle: 'Discover the vibrant nightlife and culture.',
  },
  {
    image: '/assets/images/addis-view.webp',
    title: 'Modern Cityscapes',
    subtitle: 'Stay in the heart of the developing metropolis.',
  },
  {
    image: '/assets/images/wnchi-lake-crater.webp',
    title: 'Breathtaking Landscapes',
    subtitle: 'Explore the natural beauty of Wenchi Crater Lake.',
  },
  {
    image: '/assets/images/sofomar-cave.webp',
    title: 'Natural Wonders',
    subtitle: 'Visit the spectacular Sof Omar Caves.',
  },
  {
    image: '/assets/images/addis-ababa-2.webp',
    title: 'Urban Elegance',
    subtitle: 'Navigate the city with ease and comfort.',
  },
  {
    image: '/assets/images/benuna.webp',
    title: 'Discover Ethiopia',
    subtitle: 'Unforgettable journeys await you.',
  },
];

interface HeroSliderProps {
  children?: React.ReactNode;
}

export function HeroSlider({ children }: HeroSliderProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [readySlides, setReadySlides] = useState<Set<number>>(() => new Set([0]));

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  // Warm the next slide so transitions do not hitch on decode.
  useEffect(() => {
    const next = (currentSlide + 1) % slides.length;
    setReadySlides((prev) => {
      if (prev.has(currentSlide) && prev.has(next)) return prev;
      const copy = new Set(prev);
      copy.add(currentSlide);
      copy.add(next);
      return copy;
    });
  }, [currentSlide]);

  return (
    <>
      <div className="absolute inset-0 z-0 overflow-hidden bg-slate-900">
        {slides.map((slide, index) => {
          const active = index === currentSlide;
          const shouldLoad = readySlides.has(index);
          if (!shouldLoad) return null;
          return (
            <div
              key={slide.image}
              className="absolute inset-0 transition-opacity duration-700 ease-out"
              style={{ opacity: active ? 1 : 0 }}
              aria-hidden={!active}
            >
              <Image
                src={slide.image}
                alt={slide.title}
                fill
                priority={index === 0}
                loading={index === 0 ? 'eager' : 'lazy'}
                sizes="100vw"
                quality={70}
                className="object-cover"
              />
            </div>
          );
        })}
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/25 to-black/75" />
      </div>

      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 pt-20 md:pt-24 lg:pt-28 flex flex-col items-center">
        <div className="text-center mb-10 md:mb-12 pointer-events-none w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={`text-${currentSlide}`}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35 }}
            >
              <h1 className="text-3xl md:text-5xl lg:text-6xl font-extrabold text-white mb-3 md:mb-5 tracking-tight leading-tight px-2 md:px-4 drop-shadow-lg">
                {slides[currentSlide].title}
              </h1>
              <p className="text-base md:text-lg lg:text-xl text-gray-200 max-w-2xl mx-auto font-medium px-2 md:px-4 drop-shadow-md opacity-90">
                {slides[currentSlide].subtitle}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>
        {children}
      </div>
    </>
  );
}
