"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const slides = [
  {
    image: '/assets/images/addis-ababa-night.jpg',
    title: 'Experience Addis at Night',
    subtitle: 'Discover the vibrant nightlife and culture.'
  },
  {
    image: '/assets/images/addis-view.jpg',
    title: 'Modern Cityscapes',
    subtitle: 'Stay in the heart of the developing metropolis.'
  },
  {
    image: '/assets/images/wnchi-lake-crater.png',
    title: 'Breathtaking Landscapes',
    subtitle: 'Explore the natural beauty of Wenchi Crater Lake.'
  },
  {
    image: '/assets/images/sofomar-cave.png',
    title: 'Natural Wonders',
    subtitle: 'Visit the spectacular Sof Omar Caves.'
  },
  {
    image: '/assets/images/addis-ababa-2.png',
    title: 'Urban Elegance',
    subtitle: 'Navigate the city with ease and comfort.'
  },
  {
    image: '/assets/images/benuna.jpg',
    title: 'Discover Ethiopia',
    subtitle: 'Unforgettable journeys await you.'
  }
];

interface HeroSliderProps {
  children?: React.ReactNode;
}

export function HeroSlider({ children }: HeroSliderProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <>
      <AnimatePresence>
        <motion.div
          key={currentSlide}
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.5 }}
          className="absolute inset-0 z-0 overflow-hidden transform-gpu"
          style={{ willChange: 'transform, opacity' }}
        >
          <img
            src={slides[currentSlide].image}
            alt={slides[currentSlide].title}
            className="w-full h-full object-cover transform-gpu"
            style={{ willChange: 'transform, opacity' }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/25 to-black/75" />
        </motion.div>
      </AnimatePresence>

      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 pt-20 md:pt-24 lg:pt-28 flex flex-col items-center">
        <div className="text-center mb-10 md:mb-12 pointer-events-none w-full">
          <motion.div
            key={`text-${currentSlide}`}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-extrabold text-white mb-3 md:mb-5 tracking-tight leading-tight px-2 md:px-4 drop-shadow-lg">
              {slides[currentSlide].title}
            </h1>
            <p className="text-base md:text-lg lg:text-xl text-gray-200 max-w-2xl mx-auto font-medium px-2 md:px-4 drop-shadow-md opacity-90">
              {slides[currentSlide].subtitle}
            </p>
          </motion.div>
        </div>
        {children}
      </div>


    </>
  );
}
