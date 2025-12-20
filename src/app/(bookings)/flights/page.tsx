"use client";

import React, { useState } from 'react';
import { Plane, Calendar as CalendarIcon, Users, Search, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { LocationInput } from '@/components/search/location-input';
import { GuestSelector } from '@/components/search/guest-selector';
import { Calendar } from '@/components/ui/calendar';
import { Popover } from '@/components/ui/popover';
import { BookingModal } from '@/components/booking/booking-modal';
import { formatCurrency } from '@/lib/currency';
import { useAuth } from '@/components/providers/auth-provider';
import { useRouter } from 'next/navigation';
import { useFlights } from '@/hooks/use-flights';
import { toast } from 'sonner';

export default function FlightsPage() {
    const [isBookingOpen, setIsBookingOpen] = useState(false);
    const [selectedFlight, setSelectedFlight] = useState<any>(null);

    // Search State
    const [fromCode, setFromCode] = useState('LHR');
    const [toCode, setToCode] = useState('JFK');
    const [departDate, setDepartDate] = useState(new Date(Date.now() + 86400000).toISOString().split('T')[0]);
    const [passengers, setPassengers] = useState('1');

    // Query Params State (only update on search click)
    const [searchParams, setSearchParams] = useState({
        fromCode: 'LHR',
        toCode: 'JFK',
        departDate: new Date(Date.now() + 86400000),
        adults: 1
    });

    const { data: flights, isLoading, error } = useFlights({
        fromCode: searchParams.fromCode,
        toCode: searchParams.toCode,
        departDate: searchParams.departDate,
        adults: searchParams.adults
    });

    const { user } = useAuth();
    const router = useRouter();

    const handleSearch = () => {
        if (!fromCode || !toCode || !departDate) {
            toast.error('Please fill in all search fields');
            return;
        }
        setSearchParams({
            fromCode,
            toCode,
            departDate: new Date(departDate),
            adults: parseInt(passengers) || 1
        });
    };

    const handleBook = (flight: any) => {
        if (!user) {
            router.push('/signin?redirect=/flights');
            return;
        }
        setSelectedFlight(flight);
        setIsBookingOpen(true);
    };

    // Helper to map API response to UI format (if needed)
    // Assuming API returns a list of flights, we might need to adapt it
    // For now, using the raw data or fallback
    const displayFlights = flights && flights.length > 0 ? flights : [];

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header Section */}
            <div className="bg-brand-primary text-white py-12 md:py-16">
                <div className="container mx-auto px-4">
                    <h1 className="text-3xl md:text-4xl font-bold mb-3 md:mb-4">Find Your Perfect Flight</h1>
                    <p className="text-blue-100 text-base md:text-lg max-w-2xl">
                        Search and book international and domestic flights with the best airlines.
                    </p>
                </div>
            </div>

            <div className="container mx-auto px-4 -mt-8 md:-mt-10">
                {/* Search Widget */}
                <Card className="p-4 md:p-6 shadow-xl mb-8 md:mb-12 overflow-visible">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                        <div className="md:col-span-3">
                            <LocationInput
                                label="From"
                                placeholder="e.g. London"
                                value={fromCode}
                                onChange={setFromCode}
                            />
                        </div>
                        <div className="md:col-span-3">
                            <LocationInput
                                label="To"
                                placeholder="e.g. New York"
                                value={toCode}
                                onChange={setToCode}
                            />
                        </div>
                        <div className="md:col-span-2">
                            <Popover
                                trigger={
                                    <div className="w-full cursor-pointer">
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Departure</label>
                                        <div className="flex items-center gap-3 w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl hover:bg-white hover:border-brand-primary/50 transition-all group">
                                            <CalendarIcon className="w-5 h-5 text-gray-400 group-hover:text-brand-primary transition-colors" />
                                            <span className="text-gray-900 font-medium">{departDate || 'Select Date'}</span>
                                        </div>
                                    </div>
                                }
                                content={
                                    <Calendar
                                        selected={departDate ? new Date(departDate) : undefined}
                                        onSelect={(date) => setDepartDate(date.toISOString().split('T')[0])}
                                        minDate={new Date()}
                                    />
                                }
                            />
                        </div>
                        <div className="md:col-span-2">
                            <GuestSelector
                                adults={parseInt(passengers)}
                                children={0}
                                rooms={1}
                                onChange={(a) => setPassengers(a.toString())}
                            />
                        </div>
                        <div className="md:col-span-2">
                            <Button
                                className="w-full h-[50px] flex items-center justify-center gap-2 text-white font-bold text-lg shadow-lg shadow-brand-primary/30 hover:shadow-brand-primary/50 transition-all"
                                onClick={handleSearch}
                                disabled={isLoading}
                            >
                                {isLoading ? 'Searching...' : <><Search className="w-5 h-5" /> Search</>}
                            </Button>
                        </div>
                    </div>
                </Card>

                {/* Flight Results */}
                <div className="space-y-4 md:space-y-6">
                    <h2 className="text-xl md:text-2xl font-bold text-brand-dark mb-4 md:mb-6">
                        {isLoading ? 'Searching Flights...' : `Available Flights (${displayFlights.length})`}
                    </h2>

                    {error && (
                        <div className="p-4 bg-red-50 text-red-600 rounded-lg">
                            Failed to fetch flights. Please try again later.
                        </div>
                    )}

                    {!isLoading && displayFlights.length === 0 && !error && (
                        <div className="p-8 text-center text-gray-500 bg-white rounded-lg border border-gray-100">
                            No flights found for this route. Try changing your search parameters.
                        </div>
                    )}

                    {displayFlights.map((flight: any) => (
                        <Card key={flight.id || Math.random()} className="p-4 md:p-6 hover:shadow-lg transition-shadow border border-gray-100">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-6">
                                {/* Airline Info */}
                                <div className="flex items-center gap-3 md:gap-4 w-full md:w-1/4">
                                    {flight.airlineLogo && (
                                        <img src={flight.airlineLogo} alt={flight.airline} className="w-12 h-12 md:w-16 md:h-16 object-contain rounded-lg" />
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-brand-dark text-sm md:text-base truncate">{flight.airline || 'Airline'}</h3>
                                        <p className="text-xs md:text-sm text-gray-500">{flight.flightNumber || 'Flight'}</p>
                                        <span className="inline-block px-2 py-0.5 md:py-1 bg-blue-50 text-brand-primary text-xs rounded-full mt-1 font-medium">
                                            {flight.cabinClass || 'Economy'}
                                        </span>
                                    </div>
                                </div>

                                {/* Flight Route */}
                                <div className="flex items-center gap-4 md:gap-8 w-full md:w-2/4 justify-between md:justify-center">
                                    <div className="text-center flex-1">
                                        <div className="text-xl md:text-2xl font-bold text-brand-dark">{flight.departureTime || '00:00'}</div>
                                        <div className="text-xs md:text-sm text-gray-500">{fromCode}</div>
                                    </div>

                                    <div className="flex flex-col items-center w-full max-w-[100px] md:max-w-[150px] flex-shrink-0">
                                        <div className="text-xs text-gray-400 mb-1">{flight.duration || 'Direct'}</div>
                                        <div className="w-full h-[2px] bg-gray-200 relative">
                                            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gray-50 px-1 md:px-2">
                                                <Plane className="w-3 h-3 md:w-4 md:h-4 text-gray-400 rotate-90" />
                                            </div>
                                        </div>
                                        <div className="text-xs text-brand-secondary mt-1">{flight.stops || 'Non-stop'}</div>
                                    </div>

                                    <div className="text-center flex-1">
                                        <div className="text-xl md:text-2xl font-bold text-brand-dark">{flight.arrivalTime || '00:00'}</div>
                                        <div className="text-xs md:text-sm text-gray-500">{toCode}</div>
                                    </div>
                                </div>

                                {/* Price & Action */}
                                <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-start gap-3 md:gap-2 w-full md:w-1/4 md:border-l border-gray-100 md:pl-6 pt-4 md:pt-0 border-t md:border-t-0">
                                    <div className="text-left md:text-right">
                                        <div className="text-2xl md:text-3xl font-bold text-brand-primary">{formatCurrency(flight.price?.amount || 0)}</div>
                                        <p className="text-xs md:text-sm text-gray-400">per passenger</p>
                                    </div>
                                    <Button onClick={() => handleBook(flight)} className="w-auto md:w-full" size="sm">
                                        Select <ArrowRight className="w-4 h-4 ml-1 md:ml-2" />
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            </div>

            <BookingModal
                isOpen={isBookingOpen}
                onClose={() => setIsBookingOpen(false)}
                serviceName={selectedFlight ? `${selectedFlight.airline || 'Flight'} - ${fromCode} to ${toCode}` : 'Flight Booking'}
                price={selectedFlight?.price?.amount || 0}
                type="flight"
            />
        </div>
    );
}
