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
      <AnimatePresence mode="wait">
        <motion.div
          key={currentSlide}
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.5 }}
          className="absolute inset-0 z-0"
        >
          <img
            src={slides[currentSlide].image}
            alt={slides[currentSlide].title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-brand-dark/70 via-brand-dark/40 to-brand-gray" />
        </motion.div>
      </AnimatePresence>

      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 pt-12 md:pt-20">
        <div className="text-center mb-8 md:mb-12 pointer-events-none">
          <motion.div
            key={`text-${currentSlide}`}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <h1 className="text-4xl md:text-5xl lg:text-7xl font-extrabold text-white mb-4 md:mb-6 tracking-tight leading-tight px-4 drop-shadow-lg">
              {slides[currentSlide].title}
            </h1>
            <p className="text-lg md:text-xl lg:text-2xl text-gray-200 max-w-2xl mx-auto font-medium px-4 drop-shadow-md">
              {slides[currentSlide].subtitle}
            </p>
          </motion.div>
        </div>
        {children}
      </div>

      {/* Slider Indicators */}
      <div className="absolute bottom-6 md:bottom-10 left-1/2 transform -translate-x-1/2 flex gap-2 md:gap-3 z-20">
        {slides.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentSlide(idx)}
            className={`w-2 h-2 md:w-3 md:h-3 rounded-full transition-all duration-300 ${
              currentSlide === idx ? 'bg-white w-6 md:w-8' : 'bg-white/40 hover:bg-white/60'
            }`}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>
    </>
  );
}
