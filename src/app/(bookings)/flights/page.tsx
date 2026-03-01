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
import { FlightBookingModal } from '@/components/booking/flight-booking-modal';
import { formatCurrency } from '@/lib/currency';
import { useAuth } from '@/components/providers/auth-provider';
import { useRouter, useSearchParams } from 'next/navigation';
import { useFlights, useFlightDetail } from '@/hooks/use-flights';
import { toast } from 'sonner';
import { FlightRouteSelect } from '@/components/search/flight-route-select';
import { formatDateLocal, parseDateLocal, formatDateEnglishStr, formatDateEnglish } from '@/lib/date-utils';
import { Preloader } from '@/components/ui/preloader';
import { FlightCardSkeleton } from '@/components/flights/flight-card-skeleton';
import { SeatMap } from '@/components/flights/seat-map';
import { FlightDetails } from '@/components/flights/flight-details';
import { AdContainer } from '@/components/ads/ad-container';
import { AdConfig } from '@/lib/types/ads';

// One advertisement on the right per mockup (matches hotels page pattern)
const FLIGHT_ADS_RIGHT: AdConfig[] = [
    {
        id: 'ethiopian-airlines-1',
        imageUrl: '/ads/flight-ad-sample.png',
        altText: 'Discover Ethiopia with Ethiopian Airlines',
        linkUrl: 'https://www.ethiopianairlines.com',
        targetBlank: true
    },
    {
        id: 'partnership-opportunity-2',
        imageUrl: '/ads/partnership-ad.png',
        altText: 'Partnership Opportunities - Advertise Your Brand',
        linkUrl: '/contact',
        targetBlank: false
    }
];


const LOCATION_NAME_MAPPING: Record<string, string> = {
    'ADD.AIRPORT': 'Addis Ababa',
    'JFK.AIRPORT': 'New York',
    'DXB.AIRPORT': 'Dubai',
    'LHR.AIRPORT': 'London',
    'FRA.AIRPORT': 'Frankfurt',
    'IST.AIRPORT': 'Istanbul',
    'YYZ.AIRPORT': 'Toronto',
    'DOH.AIRPORT': 'Doha',
    'CDG.AIRPORT': 'Paris',
};

const getLocationName = (id: string) => {
    return LOCATION_NAME_MAPPING[id] || id.split('.')[0];
};

function FlightsPageContent() {
    const [isBookingOpen, setIsBookingOpen] = useState(false);
    const [selectedFlight, setSelectedFlight] = useState<any>(null);

    // Initialize from URL for consistency
    const search = useSearchParams();
    const qpFrom = search.get('fromId') || search.get('fromCode') || 'ADD.AIRPORT';
    const qpTo = search.get('toId') || search.get('toCode') || 'JFK.AIRPORT';
    const qpDepart = search.get('departureDate') || search.get('departDate') || formatDateLocal(new Date(Date.now() + 86400000));
    const qpReturn = search.get('returnDate') || '';
    const qpFlightType = (search.get('flightType') as 'ROUNDTRIP' | 'ONEWAY' | 'MULTISTOP') || (qpReturn ? 'ROUNDTRIP' : 'ONEWAY');
    const qpCabin = (search.get('cabinClass') as TravelerState['cabinClass']) || 'ECONOMY';
    const qpAdults = Number(search.get('adults') || '1') || 1;
    const qpChildren = Number(search.get('children') || '0') || 0;
    const qpOrderBy = search.get('orderBy') || 'BEST';
    const qpCurrency = search.get('currency') || 'USD';

    // Multi-stop segments state from URL
    const qpSegmentsRaw = search.get('segments');
    const getInitialSegments = () => {
        if (qpSegmentsRaw) {
            try {
                return JSON.parse(qpSegmentsRaw);
            } catch (e) {
                console.error('Failed to parse segments from URL', e);
            }
        }
        return [
            { from: qpFrom, to: qpTo, date: qpDepart },
            { from: qpTo, to: '', date: formatDateLocal(new Date(Date.now() + 172800000)) }
        ];
    };

    const [segments, setSegments] = useState<{ from: string; to: string; date: string }[]>(getInitialSegments());

    // Search State (UI strings)
    const [fromCode, setFromCode] = useState(getLocationName(qpFrom));
    const [toCode, setToCode] = useState(getLocationName(qpTo));
    // ID State (Actual identifiers for API)
    const [fromId, setFromId] = useState(qpFrom);
    const [toId, setToId] = useState(qpTo);
    const [departDate, setDepartDate] = useState(qpDepart);
    const [trav, setTrav] = useState<TravelerState>({
        adults: qpAdults,
        children: qpChildren,
        cabinClass: qpCabin,
    });

    const ethiopianAirports = ['ADD.AIRPORT', 'BJR.AIRPORT', 'DIR.AIRPORT', 'GDQ.AIRPORT', 'JIM.AIRPORT', 'MQX.AIRPORT'];
    const isLocal = ethiopianAirports.includes(fromId) && ethiopianAirports.includes(toId);
    const [flightType, setFlightType] = useState<'ROUNDTRIP' | 'ONEWAY' | 'MULTISTOP'>(qpFlightType);
    const [flightReturnDate, setFlightReturnDate] = useState<string>(qpReturn);
    const [hasSearched, setHasSearched] = useState<boolean>(true);

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
        segments: qpFlightType === 'MULTISTOP' ? segments : undefined,
        stops: undefined as string | undefined,
        priceRange: undefined as string | undefined,
        airlines: undefined as string | undefined,
        currency: qpCurrency,
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
        segments: searchParams.segments,
        numberOfStops: searchParams.stops as any,
        currency: searchParams.currency,
    });
    const flights = flightsData?.flights || [];

    // Flight detail state
    const [detailKey, setDetailKey] = useState<string | undefined>(undefined);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [showSeatMap, setShowSeatMap] = useState(false);
    const { data: flightDetail, isLoading: isDetailLoading } = useFlightDetail(detailKey);

    const { user } = useAuth();
    const router = useRouter();

    const handleSearch = () => {
        if (!fromCode || !toCode || !departDate) {
            toast.error('Please fill in all search fields');
            return;
        }
        setSearchParams({
            fromCode: fromId, // Use ID
            toCode: toId,     // Use ID
            departDate: parseDateLocal(departDate),
            returnDate: flightReturnDate ? parseDateLocal(flightReturnDate) : undefined,
            flightType,
            cabinClass: trav.cabinClass,
            adults: trav.adults || 1,
            children: trav.children || 0,
            orderBy: qpOrderBy,
            segments: flightType === 'MULTISTOP' ? segments : undefined,
            stops: undefined,
            priceRange: undefined,
            airlines: undefined,
            currency: qpCurrency,
        });
        setHasSearched(true);
    };

    const handleFilterChange = (key: string, value: any) => {
        setSearchParams(prev => ({ ...prev, [key]: value }));
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
        if (!flight?.selectionKey) {
            toast.error('Flight selection key missing');
            return;
        }
        setDetailKey(flight.selectionKey);
        setSelectedFlight(flight);
        setShowSeatMap(false);
        setIsDetailOpen(true);
    };

    // Helper to map API response to UI format (if needed)
    // Assuming API returns a list of flights, we might need to adapt it
    // For now, using the raw data or fallback
    const displayFlights = flights && flights.length > 0 ? flights : [];

    return (
        <AdContainer leftAds={[]} rightAds={FLIGHT_ADS_RIGHT}>
            <div className="min-h-screen pb-24 md:pb-20" style={{ backgroundColor: '#F1F5F9' }}>
                {/* Header Section - compact on mobile */}
                <div className="bg-teal-600 text-white py-6 sm:py-8 md:py-12 lg:py-16">
                    <div className="container mx-auto px-4 sm:px-6">
                        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 md:mb-4 tracking-tight">
                            Find Your Perfect Flight
                        </h1>
                        <p className="text-teal-100/90 text-sm sm:text-base md:text-lg max-w-2xl">
                            Search and book international and domestic flights with the best airlines.
                        </p>
                    </div>
                </div>

                <div className="container mx-auto px-4 sm:px-6 -mt-6 sm:-mt-8 md:-mt-12">
                    {/* Search Widget */}
                    <Card className="p-4 md:p-6 shadow-xl mb-4 md:mb-6 overflow-visible relative z-50">
                        {!hasSearched ? (
                            <div className="space-y-4">
                                <div className="flex items-center gap-4">
                                    <div className="inline-flex rounded-xl bg-gray-100 p-1">
                                        <button
                                            type="button"
                                            onClick={() => setFlightType('ROUNDTRIP')}
                                            className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-colors ${flightType === 'ROUNDTRIP' ? 'bg-white text-teal-600 shadow-sm' : 'text-gray-700 hover:text-teal-600'}`}
                                        >
                                            Round trip
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setFlightType('ONEWAY')}
                                            className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-colors ${flightType === 'ONEWAY' ? 'bg-white text-teal-600 shadow-sm' : 'text-gray-700 hover:text-teal-600'}`}
                                        >
                                            One way
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setFlightType('MULTISTOP')}
                                            className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-colors ${flightType === 'MULTISTOP' ? 'bg-white text-teal-600 shadow-sm' : 'text-gray-700 hover:text-teal-600'}`}
                                        >
                                            Multi-city
                                        </button>
                                    </div>
                                </div>

                                {flightType === 'MULTISTOP' ? (
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-1 gap-4">
                                            {segments.map((segment, index) => (
                                                <div key={index} className="flex flex-col md:flex-row items-end gap-3 p-4 bg-gray-50/50 rounded-2xl border border-gray-100 relative group transition-all hover:border-brand-primary/20">
                                                    <div className="flex-1 w-full">
                                                        <FlightRouteSelect
                                                            fromCode={segment.from}
                                                            toCode={segment.to}
                                                            onChangeFrom={(val) => {
                                                                const newSegments = [...segments];
                                                                newSegments[index].from = val;
                                                                setSegments(newSegments);
                                                            }}
                                                            onChangeTo={(val) => {
                                                                const newSegments = [...segments];
                                                                newSegments[index].to = val;
                                                                setSegments(newSegments);
                                                            }}
                                                        />
                                                    </div>
                                                    <div className="w-full md:w-48">
                                                        <Popover
                                                            trigger={
                                                                <div className="w-full cursor-pointer">
                                                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Date</label>
                                                                    <div className="flex items-center gap-2 w-full px-3 py-3 bg-white border border-gray-200 rounded-xl hover:border-brand-primary/50 transition-all group-hover:border-gray-300">
                                                                        <CalendarIcon className="w-4 h-4 text-gray-400 group-hover:text-brand-primary transition-colors" />
                                                                        <span className="text-gray-900 font-medium text-xs truncate">{segment.date ? formatDateEnglish(parseDateLocal(segment.date)) : 'Select Date'}</span>
                                                                    </div>
                                                                </div>
                                                            }
                                                            content={
                                                                <div className="w-full">
                                                                    <Calendar
                                                                        selected={segment.date ? parseDateLocal(segment.date) : undefined}
                                                                        onSelect={(date) => {
                                                                            const newSegments = [...segments];
                                                                            newSegments[index].date = formatDateLocal(date);
                                                                            setSegments(newSegments);
                                                                        }}
                                                                        minDate={index > 0 && segments[index - 1].date ? parseDateLocal(segments[index - 1].date) : new Date()}
                                                                    />
                                                                </div>
                                                            }
                                                        />
                                                    </div>
                                                    {segments.length > 2 && (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-[52px] w-[52px] text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl"
                                                            onClick={() => setSegments(segments.filter((_, i) => i !== index))}
                                                        >
                                                            <span className="text-xl">×</span>
                                                        </Button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-2">
                                            <Button
                                                variant="outline"
                                                onClick={() => setSegments([...segments, { from: segments[segments.length - 1].to, to: '', date: formatDateLocal(new Date(parseDateLocal(segments[segments.length - 1].date).getTime() + 86400000)) }])}
                                                className="w-full md:w-auto rounded-xl border-dashed border-2 hover:border-brand-primary hover:text-brand-primary h-[52px] px-6"
                                                disabled={segments.length >= 5}
                                            >
                                                + Add another flight
                                            </Button>
                                            <div className="flex items-center gap-3 w-full md:w-auto">
                                                <div className="flex-1 md:w-56">
                                                    <TravelerCabinSelector value={trav} onChange={setTrav} />
                                                </div>
                                                <Button
                                                    className="flex-1 md:w-48 h-[52px] flex items-center justify-center gap-2 bg-brand-primary hover:bg-brand-dark text-white font-bold rounded-xl shadow-lg shadow-brand-primary/10 transition-all"
                                                    onClick={handleSearch}
                                                    disabled={isLoading}
                                                >
                                                    {isLoading ? 'Searching...' : <><Search className="w-5 h-5" /> Search</>}
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                                        <div className="md:col-span-5">
                                            <FlightRouteSelect
                                                fromCode={fromCode}
                                                toCode={toCode}
                                                onChangeFrom={setFromCode}
                                                onChangeTo={setToCode}
                                                onSelectFrom={(loc) => setFromId(loc.id || loc.code || loc.iata_code)}
                                                onSelectTo={(loc) => setToId(loc.id || loc.code || loc.iata_code)}
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
                                                className="w-full h-[52px] flex items-center justify-center gap-2 bg-brand-primary hover:bg-teal-700 text-white font-bold text-lg rounded-xl shadow-lg shadow-brand-primary/20 transition-all"
                                                onClick={handleSearch}
                                                disabled={isLoading}
                                            >
                                                {isLoading ? 'Searching...' : <><Search className="w-5 h-5" /> Search</>}
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-4 text-sm">
                                    <span className="inline-flex items-center px-3 py-2 bg-gray-50 border border-gray-200 rounded-full font-semibold text-gray-700">
                                        {flightType === 'ROUNDTRIP' ? 'Round trip' : flightType === 'MULTISTOP' ? 'Multi-city' : 'One way'}
                                    </span>
                                    <span className="inline-flex items-center px-3 py-2 bg-gray-50 border border-gray-200 rounded-full font-semibold text-gray-700">
                                        {flightType === 'MULTISTOP' ? `${segments.length} flights` : `${fromCode} → ${toCode}`}
                                    </span>
                                    <span className="inline-flex items-center px-3 py-2 bg-gray-50 border border-gray-200 rounded-full font-semibold text-gray-700">
                                        {flightType === 'MULTISTOP' ? `${formatDateEnglishStr(segments[0].date)} — ${formatDateEnglishStr(segments[segments.length - 1].date)}` : `${formatDateEnglishStr(departDate)}${flightType === 'ROUNDTRIP' && flightReturnDate ? ` — ${formatDateEnglishStr(flightReturnDate)}` : ''}`}
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

                    {/* Flight Results Layout */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-8">
                        {/* Sidebar Filters */}
                        <aside className="lg:col-span-3 space-y-6">
                            <Card className="p-6 shadow-sm border-gray-100 sticky top-24">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="font-bold text-gray-900">Filters</h3>
                                    <button
                                        onClick={() => setSearchParams(prev => ({ ...prev, stops: undefined, airlines: undefined }))}
                                        className="text-xs text-brand-primary hover:underline"
                                    >
                                        Clear all
                                    </button>
                                </div>

                                {/* Stops Filter */}
                                <div className="space-y-4 mb-8">
                                    <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Stops</h4>
                                    <div className="space-y-2">
                                        {[
                                            { label: 'All', value: 'all' },
                                            { label: 'Non-stop', value: 'nonstop_flights' },
                                            { label: 'Max 1 stop', value: 'maximum_one_stop' },
                                        ].map((stop) => (
                                            <label key={stop.value} className="flex items-center gap-3 cursor-pointer group">
                                                <input
                                                    type="radio"
                                                    name="stops"
                                                    checked={searchParams.stops === stop.value || (!searchParams.stops && stop.value === 'all')}
                                                    onChange={() => handleFilterChange('stops', stop.value)}
                                                    className="w-4 h-4 text-brand-primary border-gray-300 focus:ring-brand-primary"
                                                />
                                                <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors">{stop.label}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {/* Cabin Class Filter (Quick Switch) */}
                                <div className="space-y-4 mb-8">
                                    <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Cabin Class</h4>
                                    <div className="space-y-2">
                                        {['ECONOMY', 'PREMIUM_ECONOMY', 'BUSINESS', 'FIRST'].map((cls) => (
                                            <label key={cls} className="flex items-center gap-3 cursor-pointer group">
                                                <input
                                                    type="radio"
                                                    name="cabin"
                                                    checked={searchParams.cabinClass === cls}
                                                    onChange={() => handleFilterChange('cabinClass', cls)}
                                                    className="w-4 h-4 text-brand-primary border-gray-300 focus:ring-brand-primary"
                                                />
                                                <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors">
                                                    {cls.toLowerCase().replace('_', ' ')}
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </Card>

                            {/* Airline Filter */}
                            {flightsData?.aggregation?.airlines && flightsData.aggregation.airlines.length > 0 && (
                                <Card className="p-6 shadow-sm border-gray-100">
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Airlines</h4>
                                            {searchParams.airlines && (
                                                <button
                                                    onClick={() => handleFilterChange('airlines', undefined)}
                                                    className="text-xs text-brand-primary hover:underline"
                                                >
                                                    Clear
                                                </button>
                                            )}
                                        </div>
                                        <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar pr-2">
                                            {flightsData.aggregation.airlines.map((airline: any) => (
                                                <label key={airline.name} className="flex items-center gap-3 cursor-pointer group">
                                                    <input
                                                        type="radio"
                                                        name="airlines"
                                                        checked={searchParams.airlines === airline.name}
                                                        onChange={() => handleFilterChange('airlines', airline.name === searchParams.airlines ? undefined : airline.name)}
                                                        className="w-4 h-4 text-brand-primary border-gray-300 focus:ring-brand-primary"
                                                    />
                                                    <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors flex-1 truncate">
                                                        {airline.name}
                                                    </span>
                                                    {airline.minPrice && (
                                                        <span className="text-xs text-gray-400 font-medium">
                                                            {formatCurrency(airline.minPrice.amount)}
                                                        </span>
                                                    )}
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                </Card>
                            )}
                        </aside>

                        {/* Main Content */}
                        <div className="lg:col-span-9 space-y-4">
                            <div className="flex items-center justify-between mb-2">
                                <h2 className="text-xl font-bold text-brand-dark">
                                    {isLoading ? 'Searching Flights...' : `Available Flights (${displayFlights.length})`}
                                </h2>
                                {!isLoading && displayFlights.length > 0 && (
                                    <div className="text-sm text-gray-500">
                                        Showing results for <span className="font-semibold text-gray-900">{fromCode} to {toCode}</span>
                                    </div>
                                )}
                            </div>

                            {isLoading && (
                                <div className="space-y-4">
                                    {[1, 2, 3].map((i) => (
                                        <FlightCardSkeleton key={i} />
                                    ))}
                                </div>
                            )}

                            {error && (
                                <Card className="p-8 text-center border-red-100 bg-red-50/50">
                                    <div className="text-red-600 font-medium mb-2">Failed to fetch flights</div>
                                    <p className="text-sm text-red-500/80 mb-4">There was an error connecting to the flight search service.</p>
                                    <Button variant="outline" size="sm" onClick={handleSearch} className="border-red-200 text-red-600 hover:bg-red-100">
                                        Try again
                                    </Button>
                                </Card>
                            )}

                            {!isLoading && displayFlights.length === 0 && !error && (
                                <Card className="p-12 text-center border-dashed border-2 border-gray-200 bg-gray-50/50">
                                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Plane className="w-8 h-8 text-gray-400" />
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-900 mb-2">No flights found</h3>
                                    <p className="text-gray-500 max-w-xs mx-auto mb-6">
                                        We couldn't find any flights matching your criteria. Try adjusting your dates or filters.
                                    </p>
                                    <Button onClick={() => setHasSearched(false)} variant="outline">
                                        Change search
                                    </Button>
                                </Card>
                            )}

                            {displayFlights.map((flight: any) => (
                                <Card key={flight.id || Math.random()} className="group overflow-hidden hover:shadow-xl transition-all duration-300 border-gray-100">
                                    <div className="flex flex-col md:flex-row">
                                        {/* Main Info */}
                                        <div className="flex-1 p-5 md:p-6">
                                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                                                {/* Airline */}
                                                <div className="flex items-center gap-4 w-full md:w-48">
                                                    <div className="w-12 h-12 md:w-14 md:h-14 bg-gray-50 rounded-xl p-2 flex items-center justify-center border border-gray-100 group-hover:border-brand-primary/20 transition-colors">
                                                        {flight.airlineLogo ? (
                                                            <img src={flight.airlineLogo} alt={flight.airline} className="max-w-full max-h-full object-contain" />
                                                        ) : (
                                                            <Plane className="w-6 h-6 text-gray-300" />
                                                        )}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <h3 className="font-bold text-gray-900 truncate">{flight.airline || 'Airline'}</h3>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs text-gray-500">{flight.flightNumber}</span>
                                                            <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                                                            <span className="text-xs font-medium text-brand-primary">{flight.cabinClass}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Route */}
                                                <div className="flex items-center justify-between flex-1 w-full max-w-md mx-auto">
                                                    <div className="text-left">
                                                        <div className="text-xl md:text-2xl font-bold text-gray-900">{flight.departureTime}</div>
                                                        <div className="text-xs font-bold text-gray-400 uppercase tracking-tighter">{fromCode}</div>
                                                    </div>

                                                    <div className="flex-1 px-4 flex flex-col items-center">
                                                        <div className="text-[10px] font-medium text-gray-400 mb-1 uppercase tracking-widest">{flight.duration}</div>
                                                        <div className="w-full h-[2px] bg-gray-100 relative">
                                                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-brand-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-2">
                                                                <Plane className="w-4 h-4 text-brand-primary/40 group-hover:text-brand-primary transition-colors rotate-90" />
                                                            </div>
                                                        </div>
                                                        <div className="text-[10px] font-bold text-brand-secondary mt-1 uppercase tracking-widest">{flight.stops}</div>
                                                    </div>

                                                    <div className="text-right">
                                                        <div className="text-xl md:text-2xl font-bold text-gray-900">{flight.arrivalTime}</div>
                                                        <div className="text-xs font-bold text-gray-400 uppercase tracking-tighter">{toCode}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Price Section */}
                                        <div className="md:w-56 bg-gray-50/50 border-t md:border-t-0 md:border-l border-gray-100 p-5 md:p-6 flex flex-row md:flex-col items-center md:items-center justify-between md:justify-center gap-4">
                                            <div className="text-left md:text-center">
                                                <div className="text-xs text-gray-500 mb-0.5">Price from</div>
                                                <div className="text-2xl md:text-3xl font-black text-brand-primary">{formatCurrency(flight.price?.amount || 0)}</div>
                                                <div className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">incl. taxes & fees</div>
                                            </div>
                                            <div className="flex flex-col gap-2 w-full max-w-[140px] md:max-w-none">
                                                <Button
                                                    onClick={() => handleBook(flight)}
                                                    className="w-full bg-brand-primary hover:bg-brand-dark text-white font-bold rounded-xl shadow-lg shadow-brand-primary/10 transition-all"
                                                >
                                                    Select
                                                </Button>
                                                <button
                                                    onClick={() => handleViewDetails(flight)}
                                                    className="text-xs font-bold text-gray-500 hover:text-brand-primary transition-colors py-1"
                                                >
                                                    View Details
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </div>
                </div>

                <FlightBookingModal
                    isOpen={isBookingOpen}
                    onClose={() => setIsBookingOpen(false)}
                    serviceName={selectedFlight ? `${selectedFlight.airline || 'Flight'} - ${fromCode} to ${toCode}` : 'Flight Booking'}
                    price={selectedFlight?.price?.amount || 0}
                    flightData={selectedFlight}
                    isLocal={isLocal}
                />

                {/* Flight Detail Modal - premium redesign */}
                {isDetailOpen && (
                    <div className="fixed inset-0 z-[10000] flex items-end md:items-center justify-center p-0 md:p-6 bg-brand-dark/60 backdrop-blur-sm transition-all">
                        <div className="w-full md:max-w-3xl bg-white rounded-t-3xl md:rounded-3xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-300">
                            <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50/50">
                                <div className="flex items-center gap-4">
                                    <div className="inline-flex rounded-xl bg-white border border-gray-200 p-1 shadow-sm">
                                        <button
                                            onClick={() => setShowSeatMap(false)}
                                            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${!showSeatMap ? 'bg-brand-primary text-white shadow-md' : 'text-gray-500 hover:text-brand-primary'}`}
                                        >
                                            Journey
                                        </button>
                                        <button
                                            onClick={() => setShowSeatMap(true)}
                                            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${showSeatMap ? 'bg-brand-primary text-white shadow-md' : 'text-gray-500 hover:text-brand-primary'}`}
                                        >
                                            Seat Map
                                        </button>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsDetailOpen(false)}
                                    className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-gray-200 text-gray-400 hover:text-gray-900 hover:border-gray-300 transition-all shadow-sm"
                                >
                                    ✕
                                </button>
                            </div>

                            <div className="p-6 overflow-y-auto custom-scrollbar">
                                {isDetailLoading && (
                                    <div className="flex flex-col items-center justify-center py-20 space-y-4">
                                        <div className="w-12 h-12 border-4 border-brand-primary/20 border-t-brand-primary rounded-full animate-spin"></div>
                                        <p className="text-gray-500 font-medium animate-pulse">Fetching latest flight info...</p>
                                    </div>
                                )}

                                {!isDetailLoading && !flightDetail ? (
                                    <div className="text-center py-16">
                                        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <Plane className="w-8 h-8 text-red-400 rotate-45" />
                                        </div>
                                        <h4 className="text-lg font-bold text-gray-900 mb-2">Details unavailable</h4>
                                        <p className="text-gray-500 max-w-xs mx-auto mb-6 text-sm">
                                            We couldn't retrieve the specific details for this flight right now. Please try again or select another flight.
                                        </p>
                                        <Button onClick={() => setIsDetailOpen(false)} variant="outline" size="sm">Close</Button>
                                    </div>
                                ) : null}

                                {!isDetailLoading && flightDetail && (
                                    <div className="space-y-8">
                                        {showSeatMap ? (
                                            <SeatMap
                                                offerToken={detailKey!}
                                                currencyCode={searchParams.currency || 'USD'}
                                            />
                                        ) : (
                                            <FlightDetails detail={flightDetail?.detail?.data || flightDetail?.detail} />
                                        )}
                                    </div>
                                )}
                            </div>

                            {!isDetailLoading && flightDetail && (
                                <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
                                    <div className="text-xs text-gray-500 max-w-[200px]">
                                        Prices and availability are subject to change until booking is confirmed.
                                    </div>
                                    <Button
                                        onClick={() => {
                                            setIsDetailOpen(false);
                                            handleBook(selectedFlight);
                                        }}
                                        className="bg-brand-primary hover:bg-brand-dark text-white font-bold rounded-xl px-8 shadow-lg shadow-brand-primary/20"
                                    >
                                        Book Now
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </AdContainer>
    );
}

export default function FlightsPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Preloader size="lg" /></div>}>
            <FlightsPageContent />
        </Suspense>
    );
}
