"use client";

import React, { useState, Suspense } from 'react';
import { Plane, Calendar as CalendarIcon, Users, Search, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { LocationInput } from '@/components/search/location-input';
// Travelers & Cabin selector
import { TravelerCabinSelector, TravelerState } from '@/components/search/traveler-cabin-selector';
import { Calendar } from '@/components/ui/calendar';
import { Popover } from '@/components/ui/popover';
import { BookingModal } from '@/components/booking/booking-modal';
import { formatCurrency } from '@/lib/currency';
import { useAuth } from '@/components/providers/auth-provider';
import { useRouter, useSearchParams } from 'next/navigation';
import { useFlights, useFlightDetail } from '@/hooks/use-flights';
import { toast } from 'sonner';
import { FlightRouteSelect } from '@/components/search/flight-route-select';
import { formatDateLocal, parseDateLocal, formatDateEnglishStr, formatDateEnglish } from '@/lib/date-utils';
import { Preloader } from '@/components/ui/preloader';
import { FlightCardSkeleton } from '@/components/flights/flight-card-skeleton';

function FlightsPageContent() {
    const [isBookingOpen, setIsBookingOpen] = useState(false);
    const [selectedFlight, setSelectedFlight] = useState<any>(null);

    // Initialize from URL for consistency
    const search = useSearchParams();
    const qpFrom = search.get('fromId') || search.get('fromCode') || 'ADD.AIRPORT';
    const qpTo = search.get('toId') || search.get('toCode') || 'JFK.AIRPORT';
    const qpDepart = search.get('departureDate') || search.get('departDate') || formatDateLocal(new Date(Date.now() + 86400000));
    const qpReturn = search.get('returnDate') || '';
    const qpFlightType = (search.get('flightType') as 'ROUNDTRIP' | 'ONEWAY') || (qpReturn ? 'ROUNDTRIP' : 'ONEWAY');
    const qpCabin = (search.get('cabinClass') as TravelerState['cabinClass']) || 'ECONOMY';
    const qpAdults = Number(search.get('adults') || '1') || 1;
    const qpChildren = Number(search.get('children') || '0') || 0;
    const qpOrderBy = search.get('orderBy') || 'BEST';

    // Search State (UI strings)
    const [fromCode, setFromCode] = useState(qpFrom);
    const [toCode, setToCode] = useState(qpTo);
    const [departDate, setDepartDate] = useState(qpDepart);
    const [trav, setTrav] = useState<TravelerState>({
        adults: qpAdults,
        children: qpChildren,
        cabinClass: qpCabin,
    });
    const [flightType, setFlightType] = useState<'ROUNDTRIP' | 'ONEWAY'>(qpFlightType);
    const [flightReturnDate, setFlightReturnDate] = useState<string>(qpReturn);
    const [hasSearched, setHasSearched] = useState<boolean>(Boolean(search?.toString()));

    // Query Params State (only update on search click)
    const [searchParams, setSearchParams] = useState({
        fromCode: qpFrom,
        toCode: qpTo,
        departDate: parseDateLocal(qpDepart),
        returnDate: qpReturn ? parseDateLocal(qpReturn) : undefined as Date | undefined,
        flightType: qpFlightType,
        cabinClass: qpCabin,
        adults: qpAdults,
        children: qpChildren,
        orderBy: qpOrderBy,
    });

    const { data: flightsData, isLoading, error } = useFlights({
        fromCode: searchParams.fromCode,
        toCode: searchParams.toCode,
        departDate: searchParams.departDate,
        returnDate: searchParams.returnDate,
        flightType: searchParams.flightType,
        cabinClass: searchParams.cabinClass,
        adults: searchParams.adults,
        children: searchParams.children,
    });
    const flights = flightsData?.flights || [];
    const searchPath = flightsData?.searchPath;

    // Flight detail state
    const [detailKey, setDetailKey] = useState<string | undefined>(undefined);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const { data: flightDetail, isLoading: isDetailLoading } = useFlightDetail(detailKey, searchPath);

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
            departDate: parseDateLocal(departDate),
            returnDate: flightReturnDate ? parseDateLocal(flightReturnDate) : undefined,
            flightType,
            cabinClass: trav.cabinClass,
            adults: trav.adults || 1,
            children: trav.children || 0,
            orderBy: qpOrderBy,
        });
        setHasSearched(true);
    };

    const handleBook = (flight: any) => {
        if (!user) {
            router.push('/signin?redirect=/flights');
            return;
        }
        setSelectedFlight(flight);
        setIsBookingOpen(true);
    };

    const handleViewDetails = (flight: any) => {
        if (!flight?.selectionKey || !searchPath) return;
        setDetailKey(flight.selectionKey);
        setIsDetailOpen(true);
    };

    // Helper to map API response to UI format (if needed)
    // Assuming API returns a list of flights, we might need to adapt it
    // For now, using the raw data or fallback
    const displayFlights = flights && flights.length > 0 ? flights : [];

    return (
        <div className="min-h-screen bg-gray-50 pb-20 pt-24 md:pt-28">
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
                <Card className="p-4 md:p-6 shadow-xl mb-8 md:mb-12 overflow-visible relative z-50">
                    {!hasSearched ? (
                        <div className="space-y-4">
                            <div className="flex items-center gap-4">
                                <div className="inline-flex rounded-xl bg-gray-100 p-1">
                                    <button
                                        type="button"
                                        onClick={() => setFlightType('ROUNDTRIP')}
                                        className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-colors ${flightType === 'ROUNDTRIP' ? 'bg-white text-brand-primary shadow-sm' : 'text-gray-700 hover:text-brand-primary'}`}
                                    >
                                        Round trip
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFlightType('ONEWAY')}
                                        className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-colors ${flightType === 'ONEWAY' ? 'bg-white text-brand-primary shadow-sm' : 'text-gray-700 hover:text-brand-primary'}`}
                                    >
                                        One way
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                                <div className="md:col-span-5">
                                    <FlightRouteSelect
                                        fromCode={fromCode}
                                        toCode={toCode}
                                        onChangeFrom={setFromCode}
                                        onChangeTo={setToCode}
                                    />
                                </div>
                                <div className="md:col-span-3">
                                    <div className="grid grid-cols-2 gap-2">
                                        <Popover
                                            trigger={
                                                <div className="w-full cursor-pointer">
                                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Departure</label>
                                                    <div className="flex items-center gap-2 w-full px-3 py-3 bg-gray-50 border border-gray-200 rounded-xl hover:bg-white hover:border-brand-primary/50 transition-all group">
                                                        <CalendarIcon className="w-4 h-4 text-gray-400 group-hover:text-brand-primary transition-colors" />
                                                        <span className="text-gray-900 font-medium text-xs truncate">{departDate ? formatDateEnglish(parseDateLocal(departDate)) : 'Select Date'}</span>
                                                    </div>
                                                </div>
                                            }
                                            content={
                                                <div className="w-full">
                                                    <Calendar
                                                        selected={departDate ? parseDateLocal(departDate) : undefined}
                                                        onSelect={(date) => setDepartDate(formatDateLocal(date))}
                                                        minDate={new Date()}
                                                    />
                                                </div>
                                            }
                                        />
                                        <Popover
                                            trigger={
                                                <div className={`w-full cursor-pointer ${flightType === 'ONEWAY' ? 'opacity-50 pointer-events-none' : ''}`}>
                                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Return</label>
                                                    <div className="flex items-center gap-2 w-full px-3 py-3 bg-gray-50 border border-gray-200 rounded-xl hover:bg-white hover:border-brand-primary/50 transition-all group">
                                                        <CalendarIcon className="w-4 h-4 text-gray-400 group-hover:text-brand-primary transition-colors" />
                                                        <span className="text-gray-900 font-medium text-xs truncate">{flightReturnDate ? formatDateEnglish(parseDateLocal(flightReturnDate)) : 'Select Date'}</span>
                                                    </div>
                                                </div>
                                            }
                                            content={
                                                <div className="w-full">
                                                    <Calendar
                                                        selected={flightReturnDate ? parseDateLocal(flightReturnDate) : undefined}
                                                        onSelect={(date) => setFlightReturnDate(formatDateLocal(date))}
                                                        minDate={departDate ? parseDateLocal(departDate) : new Date()}
                                                    />
                                                </div>
                                            }
                                        />
                                    </div>
                                </div>
                                <div className="md:col-span-2">
                                    <TravelerCabinSelector value={trav} onChange={setTrav} />
                                </div>
                                <div className="md:col-span-2">
                                    <Button
                                        className="w-full h-[52px] flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg rounded-xl shadow-lg shadow-blue-600/20 transition-all"
                                        onClick={handleSearch}
                                        disabled={isLoading}
                                    >
                                        {isLoading ? 'Searching...' : <><Search className="w-5 h-5" /> Search</>}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-4 text-sm">
                                <span className="inline-flex items-center px-3 py-2 bg-gray-50 border border-gray-200 rounded-full font-semibold text-gray-700">
                                    {flightType === 'ROUNDTRIP' ? 'Round trip' : 'One way'}
                                </span>
                                <span className="inline-flex items-center px-3 py-2 bg-gray-50 border border-gray-200 rounded-full font-semibold text-gray-700">
                                    {fromCode?.split('.')[0]} → {toCode?.split('.')[0]}
                                </span>
                                <span className="inline-flex items-center px-3 py-2 bg-gray-50 border border-gray-200 rounded-full font-semibold text-gray-700">
                                    {formatDateEnglishStr(departDate)}{flightType === 'ROUNDTRIP' && flightReturnDate ? ` — ${formatDateEnglishStr(flightReturnDate)}` : ''}
                                </span>
                                <span className="inline-flex items-center px-3 py-2 bg-gray-50 border border-gray-200 rounded-full font-semibold text-gray-700">
                                    {trav.adults} adult{trav.adults > 1 ? 's' : ''}{trav.children ? `, ${trav.children} child` : ''} • {trav.cabinClass?.toLowerCase().replace('_', ' ')}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button variant="outline" onClick={() => setHasSearched(false)} size="sm">Edit search</Button>
                            </div>
                        </div>
                    )}
                </Card>

                {/* Flight Results */}
                <div className="space-y-4 md:space-y-6">
                    <h2 className="text-xl md:text-2xl font-bold text-brand-dark mb-4 md:mb-6">
                        {isLoading ? 'Searching Flights...' : `Available Flights (${displayFlights.length})`}
                    </h2>

                    {isLoading && (
                        <div className="space-y-4">
                            {[1, 2, 3].map((i) => (
                                <FlightCardSkeleton key={i} />
                            ))}
                        </div>
                    )}

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
                                    <div className="flex items-center gap-2 w-auto md:w-full">
                                        <Button onClick={() => handleViewDetails(flight)} variant="outline" className="w-auto md:flex-1" size="sm">
                                            Details
                                        </Button>
                                        <Button onClick={() => handleBook(flight)} className="w-auto md:flex-1" size="sm">
                                            Select <ArrowRight className="w-4 h-4 ml-1 md:ml-2" />
                                        </Button>
                                    </div>
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

            {/* Flight Detail Modal - responsive */}
            {isDetailOpen && (
                <div className="fixed inset-0 z-[10000] flex items-end md:items-center justify-center p-0 md:p-6 bg-black/50">
                    <div className="w-full md:max-w-3xl bg-white rounded-t-2xl md:rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-4 md:p-6 border-b border-gray-100">
                            <h3 className="text-lg md:text-xl font-bold text-brand-dark">Flight details</h3>
                            <button onClick={() => setIsDetailOpen(false)} className="text-gray-500 hover:text-gray-700">✕</button>
                        </div>
                        <div className="p-4 md:p-6 space-y-4">
                            {isDetailLoading && (
                                <div className="text-center py-10 text-gray-500">Loading details…</div>
                            )}
                            {!isDetailLoading && !flightDetail && (
                                <div className="text-center py-10 text-red-500">Unable to fetch details. Please try again later.</div>
                            )}
                            {!isDetailLoading && flightDetail && (
                                <div className="space-y-4">
                                    {/* Try to render meaningful sections if present */}
                                    {Array.isArray(flightDetail?.itineraries) && (
                                        <div>
                                            <h4 className="font-bold mb-2">Itineraries</h4>
                                            <div className="space-y-3">
                                                {flightDetail.itineraries.map((it: any, idx: number) => (
                                                    <div key={idx} className="p-3 border border-gray-100 rounded-xl">
                                                        <div className="text-sm text-gray-600">Duration: {it?.duration || '-'}</div>
                                                        {Array.isArray(it?.segments) && it.segments.map((seg: any, sidx: number) => (
                                                            <div key={sidx} className="mt-2 text-sm">
                                                                <div className="font-medium">{seg?.carrierCode || ''} {seg?.flightNumber || ''}</div>
                                                                <div className="text-gray-600">{seg?.departure?.iataCode} {seg?.departure?.at} → {seg?.arrival?.iataCode} {seg?.arrival?.at}</div>
                                                                <div className="text-gray-500">{seg?.duration}</div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    {/* Fallback: pretty print JSON for debugging */}
                                    <div className="bg-gray-50 p-3 rounded-xl overflow-x-auto">
                                        <pre className="text-xs whitespace-pre-wrap break-words">{JSON.stringify(flightDetail, null, 2)}</pre>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function FlightsPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Preloader size="lg" /></div>}>
            <FlightsPageContent />
        </Suspense>
    );
}
