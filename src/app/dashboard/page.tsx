"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/components/providers/auth-provider';
import { Trip } from '@/store/trip-store';
import { Card } from '@/components/ui/card';
import { formatCurrency } from '@/lib/currency';
import { Plane, Hotel, Bus, Users, Calendar, CheckCircle } from 'lucide-react';

export default function CustomerDashboard() {
    const { user } = useAuth();
    const [trips, setTrips] = useState<Trip[]>([]);

    useEffect(() => {
        if (user && typeof window !== 'undefined') {
            // Load trips from localStorage (Mock persistence)
            const allTrips = JSON.parse(localStorage.getItem('flowaddis_trips') || '[]');
            setTrips(allTrips);
        }
    }, [user]);

    return (
        <div className="container mx-auto px-4 py-8 md:py-12">
            <h1 className="text-2xl md:text-3xl font-bold text-brand-dark mb-2">My Trips</h1>
            <p className="text-gray-500 mb-6 md:mb-8">Manage your bookings and digital tickets.</p>

            <div className="space-y-4 md:space-y-6">
                {trips.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-xl">
                        <p className="text-gray-500">No trips found. Start booking!</p>
                    </div>
                ) : (
                    trips.map((trip) => (
                        <Card key={trip.id} className="p-4 md:p-6 border border-gray-100">
                            <div className="flex flex-col sm:flex-row justify-between items-start mb-4 border-b border-gray-100 pb-4 gap-3">
                                <div>
                                    <h3 className="font-bold text-base md:text-lg text-brand-dark">
                                        Trip #{trip.id.slice(0, 8)}
                                    </h3>
                                    <div className="flex items-center gap-2 text-sm text-gray-500">
                                        <Calendar className="w-4 h-4" />
                                        {new Date(trip.date).toLocaleDateString()}
                                    </div>
                                </div>
                                <div className="text-left sm:text-right w-full sm:w-auto">
                                    <div className="font-bold text-xl text-brand-primary">
                                        {formatCurrency(trip.totalAmount)}
                                    </div>
                                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-bold">
                                        <CheckCircle className="w-3 h-3" /> {trip.status}
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-3 md:space-y-4">
                                {trip.items.map((item, idx) => (
                                    <div key={idx} className="flex items-center gap-3 md:gap-4 p-3 bg-gray-50 rounded-lg">
                                        <div className="p-2 bg-white rounded-full shadow-sm flex-shrink-0">
                                            {item.type === 'flight' && <Plane className="w-4 h-4 md:w-5 md:h-5 text-blue-500" />}
                                            {item.type === 'hotel' && <Hotel className="w-4 h-4 md:w-5 md:h-5 text-orange-500" />}
                                            {item.type === 'shuttle' && <Bus className="w-4 h-4 md:w-5 md:h-5 text-green-500" />}
                                            {item.type === 'conference' && <Users className="w-4 h-4 md:w-5 md:h-5 text-purple-500" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-brand-dark capitalize text-sm md:text-base">
                                                {item.type} Booking
                                            </p>
                                            <p className="text-xs md:text-sm text-gray-500 truncate">
                                                {item.details.name || item.details.airline || item.details.type}
                                            </p>
                                        </div>
                                        <div className="font-bold text-gray-700 text-sm md:text-base flex-shrink-0">
                                            {formatCurrency(item.price)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
