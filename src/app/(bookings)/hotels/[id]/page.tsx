"use client";

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { HotelDetailHeader } from '@/components/hotels/hotel-detail-header';
import { HotelDetailGallery } from '@/components/hotels/hotel-detail-gallery';
import { HotelDetailAbout } from '@/components/hotels/hotel-detail-about';
import { HotelDetailAvailability } from '@/components/hotels/hotel-detail-availability';
import { HotelDetailSidebar } from '@/components/hotels/hotel-detail-sidebar';
import { useHotels } from '@/hooks/use-hotels';

export default function HotelDetailPage() {
    const { id } = useParams();
    const [activeTab, setActiveTab] = useState('overview');
    const [hotel, setHotel] = useState<any>({
        id,
        name: 'SML Vacation Homes at Vida Dubai Mall - Apartments with Burj Khalifa Views & access to the Dubai Mall',
        location: 'Vida Dubai Mall, Dubai, United Arab Emirates',
        rating: 8.6,
        reviews: 5,
        reviewWord: 'Excellent',
        price: 1494,
        image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80',
        images: [
            'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80',
            'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80',
            'https://images.unsplash.com/photo-1540518614846-7eded433c457?auto=format&fit=crop&w=1200&q=80',
            'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=1200&q=80',
            'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=1200&q=80',
            'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80',
            'https://images.unsplash.com/photo-1595576508898-0ad5c879a061?auto=format&fit=crop&w=1200&q=80',
            'https://images.unsplash.com/photo-1591088398332-8a77d399e80c?auto=format&fit=crop&w=1200&q=80',
        ]
    });

    // In a real app, we would fetch by ID. 
    // For now, we'll find it from the search results or use mock data.
    const { data, isLoading } = useHotels({ query: 'Ethiopia' });

    useEffect(() => {
        if (data?.hotels) {
            const found = data.hotels.find((h: any) => h.id === id);
            if (found) {
                setHotel(found);
            }
        }
    }, [id, data]);

    if (isLoading && !hotel.name) {
        return (
            <div className="min-h-screen bg-brand-gray flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-brand-gray pb-20">
            <HotelDetailHeader
                hotel={hotel}
                activeTab={activeTab}
                onTabChange={setActiveTab}
            />

            <div className="container mx-auto px-4 py-8">
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Main Content */}
                    <div className="w-full lg:w-3/4 space-y-12">
                        {activeTab === 'overview' && (
                            <>
                                <HotelDetailGallery images={hotel.images || [hotel.image]} />
                                <HotelDetailAbout hotel={hotel} />
                            </>
                        )}

                        {activeTab === 'pricing' && (
                            <HotelDetailAvailability hotel={hotel} />
                        )}

                        {activeTab === 'facilities' && (
                            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                                <h2 className="text-2xl font-bold text-brand-dark mb-6">Facilities & Amenities</h2>
                                <HotelDetailAbout hotel={hotel} />
                            </div>
                        )}

                        {activeTab === 'rules' && (
                            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                                <h2 className="text-2xl font-bold text-brand-dark mb-6">House Rules</h2>
                                <div className="space-y-6">
                                    <div className="flex gap-4 p-4 bg-brand-gray rounded-xl">
                                        <div className="font-bold w-32">Check-in</div>
                                        <div>From 15:00 to 00:00</div>
                                    </div>
                                    <div className="flex gap-4 p-4 bg-brand-gray rounded-xl">
                                        <div className="font-bold w-32">Check-out</div>
                                        <div>Until 11:00</div>
                                    </div>
                                    <div className="flex gap-4 p-4 bg-brand-gray rounded-xl">
                                        <div className="font-bold w-32">Cancellation</div>
                                        <div>Cancellation and prepayment policies vary according to accommodation type.</div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'reviews' && (
                            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                                <h2 className="text-2xl font-bold text-brand-dark mb-6">Guest Reviews</h2>
                                <HotelDetailSidebar hotel={hotel} />
                            </div>
                        )}
                    </div>

                    {/* Sidebar - Only show on overview or pricing maybe? Or always? */}
                    {activeTab === 'overview' && (
                        <div className="w-full lg:w-1/4">
                            <HotelDetailSidebar hotel={hotel} />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
