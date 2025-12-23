"use client";

import React from 'react';

interface HotelDetailGalleryProps {
    images: string[];
}

export const HotelDetailGallery: React.FC<HotelDetailGalleryProps> = ({ images }) => {
    // Ensure we have enough images for the grid
    const mainImage = images[0] || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80';
    const sideImages = images.slice(1, 3);
    const bottomImages = images.slice(3, 8);

    return (
        <div className="space-y-2">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 h-[300px] md:h-[450px]">
                {/* Main Large Image */}
                <div className="md:col-span-2 relative overflow-hidden rounded-xl">
                    <img
                        src={mainImage}
                        alt="Hotel main"
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-700 cursor-pointer"
                    />
                </div>

                {/* Side Images */}
                <div className="hidden md:flex flex-col gap-2">
                    {sideImages.map((img, idx) => (
                        <div key={idx} className="flex-1 relative overflow-hidden rounded-xl">
                            <img
                                src={img}
                                alt={`Hotel side ${idx}`}
                                className="w-full h-full object-cover hover:scale-105 transition-transform duration-700 cursor-pointer"
                            />
                        </div>
                    ))}
                </div>
            </div>

            {/* Bottom Row */}
            <div className="grid grid-cols-3 md:grid-cols-5 gap-2 h-20 md:h-32">
                {bottomImages.map((img, idx) => (
                    <div key={idx} className="relative overflow-hidden rounded-xl">
                        <img
                            src={img}
                            alt={`Hotel thumb ${idx}`}
                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-700 cursor-pointer"
                        />
                        {idx === 4 && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white font-bold text-sm cursor-pointer">
                                +20 photos
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};
