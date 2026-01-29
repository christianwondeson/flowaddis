import { NextResponse } from 'next/server';
import { API_CONFIG, API_ENDPOINTS, getApiHeaders } from '@/lib/api-config';
import axios from 'axios';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);

    // Accept both our app's params and RapidAPI spec. Prefer RapidAPI names if present.
    const fromId = searchParams.get('fromId') || searchParams.get('fromCode') || 'ADD.AIRPORT';
    const toId = searchParams.get('toId') || searchParams.get('toCode') || 'DXB.AIRPORT';

    const departureDate = searchParams.get('departureDate') || searchParams.get('departDate') || new Date(Date.now() + 86400000).toISOString().split('T')[0];
    const returnDate = searchParams.get('returnDate') || searchParams.get('return_date') || undefined;

    const adults = searchParams.get('adults') || '1';
    // children and infants: allow count or ages. If a plain integer, synthesize ages of 10 years.
    const rawChildren = searchParams.get('children') || undefined;
    const rawInfants = searchParams.get('infants') || undefined;
    const toAges = (v?: string) => {
        if (!v) return undefined;
        if (v.includes(',')) return v; // already ages list
        const n = parseInt(v, 10);
        if (Number.isFinite(n) && n > 0) {
            return Array(n).fill('10').join(',');
        }
        return undefined;
    };
    const childrenAges = toAges(rawChildren);
    const infantsAges = toAges(rawInfants);

    const page = searchParams.get('page') || '1';
    const currency = searchParams.get('currency') || 'USD';
    const flightType = (searchParams.get('flightType') || (returnDate ? 'ROUNDTRIP' : 'ONEWAY')).toUpperCase();
    const cabinClass = searchParams.get('cabinClass') || 'ECONOMY';
    const orderBy = searchParams.get('orderBy') || 'BEST';
    const nonstopFlightsOnly = searchParams.get('nonstopFlightsOnly') || undefined;
    const numberOfStops = searchParams.get('numberOfStops') || undefined; // e.g., nonstop_flights | maximum_one_stop | all
    const priceRange = searchParams.get('priceRange') || undefined; // e.g., "min,max"
    const airlines = searchParams.get('airlines') || undefined; // e.g., "LH,NK"
    const timeGo = searchParams.get('timeGo') || undefined; // e.g., "departure,02:00,15:30"
    const timeReturn = searchParams.get('timeReturn') || undefined;
    const travelTime = searchParams.get('travelTime') || undefined; // e.g., "min,max" minutes
    const rawSegments = searchParams.get('segments') || undefined;
    const segments = rawSegments ? JSON.parse(rawSegments) : undefined;

    try {
        const FLIGHTS_HOST = API_CONFIG.FLIGHTS_HOST;
        const FLIGHTS_BASE = API_CONFIG.FLIGHTS_BASE_URL;
        const isRoundTrip = flightType === 'ROUNDTRIP' && !!departureDate && !!returnDate;
        const isMultiStop = flightType === 'MULTISTOP' && Array.isArray(segments) && segments.length > 0;

        // The new API uses /searchFlights for both one-way and round-trip, and /searchFlightsMultiStops for multi-stop
        const endpoint = isMultiStop ? API_ENDPOINTS.FLIGHTS.SEARCH_MULTI_STOP : API_ENDPOINTS.FLIGHTS.SEARCH;
        const url = `${FLIGHTS_BASE}${endpoint}`;

        // Build params per new API spec
        let params: Record<string, string | undefined> = {
            pageNo: Math.max(1, Number(page)).toString(),
            cabinClass,
            adults,
            children: childrenAges,
            sort: orderBy,
            currency_code: currency,
        };

        if (isMultiStop) {
            // Multi-stop requires 'legs' parameter
            const legs = segments.map((seg: any) => ({
                fromId: seg.from,
                toId: seg.to,
                date: seg.date
            }));
            params.legs = JSON.stringify(legs);
        } else {
            params.fromId = fromId;
            params.toId = toId;
            params.departDate = departureDate;
            if (isRoundTrip) {
                params.returnDate = returnDate;
            }
            params.stops = nonstopFlightsOnly ? 'none' : (numberOfStops === 'nonstop_flights' ? 'none' : (numberOfStops === 'maximum_one_stop' ? '1' : undefined));
        }

        // Remove undefined entries
        Object.keys(params).forEach((k) => (params[k] === undefined ? delete params[k] : null));

        const options = {
            method: 'GET',
            url,
            params,
            headers: getApiHeaders(FLIGHTS_HOST),
        } as const;

        console.log('Searching flights:', params, 'URL:', url);
        const response = await axios.request(options);
        console.log('Flights API Response status:', response.status, 'Full Data:', JSON.stringify(response.data).slice(0, 1000));

        // Normalize new API response: { status: true, message: "Success", data: { flightOffers: [...] } }
        const data = response.data?.data || {};
        const offers = Array.isArray(data?.flightOffers) ? data.flightOffers : [];

        const toTime = (iso?: string) => {
            if (!iso) return '';
            try {
                const d = new Date(iso);
                return d.toISOString().slice(11, 16);
            } catch {
                return iso;
            }
        };

        const toDuration = (seconds?: number) => {
            if (!seconds || seconds <= 0) return '';
            const hrs = Math.floor(seconds / 3600);
            const mins = Math.round((seconds % 3600) / 60);
            return `${hrs}h ${mins.toString().padStart(2, '0')}m`;
        };

        const flights = offers.map((offer: any, idx: number) => {
            // Use the first segment for basic info
            const seg = offer?.segments?.[0];
            const legs = Array.isArray(seg?.legs) ? seg.legs : [];
            const firstLeg = legs[0] || {};
            const lastLeg = legs[legs.length - 1] || {};

            const carrier = firstLeg?.carriersData?.[0] || {};
            const airline = carrier?.name || offer?.airline || 'Airline';
            const airlineLogo = carrier?.logo;
            const carrierCode = carrier?.code || '';
            const flightNumber = firstLeg?.flightInfo?.flightNumber
                ? `${carrierCode} ${firstLeg.flightInfo.flightNumber}`
                : offer?.offerKeyToHighlight || '';

            const departureTime = toTime(firstLeg?.departureTime);
            const arrivalTime = toTime(lastLeg?.arrivalTime);
            const duration = toDuration(seg?.totalTime);
            const stopsCount = Math.max(0, (legs.length || 1) - 1);
            const stops = stopsCount === 0 ? 'Non-stop' : `${stopsCount} Stop${stopsCount > 1 ? 's' : ''}`;

            const priceUnits = offer?.priceBreakdown?.total?.units ?? 0;
            const cabinClass = (firstLeg?.cabinClass || offer?.brandedFareInfo?.cabinClass || 'ECONOMY') as string;

            return {
                id: offer?.token || offer?.offerKeyToHighlight || String(idx + 1),
                airline,
                airlineLogo,
                flightNumber,
                departureTime,
                arrivalTime,
                duration,
                stops,
                price: { amount: Number(priceUnits) || 0, currency },
                cabinClass,
                selectionKey: offer?.token || offer?.selectionKey,
            };
        });

        // Basic totals fallbacks
        const totalCount = (data?.aggregation?.filteredTotalCount ?? data?.aggregation?.totalCount ?? flights.length) as number;
        // Heuristic for hasNextPage
        const pageIndex = Number(page) || 0;
        const pageSize = flights.length || 0;
        const hasNextPage = pageSize > 0 ? (pageSize * (pageIndex + 1) < totalCount) : false;
        const searchPath = (data?.searchPath || data?.resultSetMetaData?.searchPath) as string | undefined;
        return NextResponse.json({ flights, total: totalCount, hasNextPage, searchPath, mock: false, rawData: response.data });
    } catch (error: any) {
        const status = error?.response?.status;
        const data = error?.response?.data;
        console.error('Error fetching flights:', status, error.message, data);

        // Mock Fallback for Flights
        const mockFlights = [
            {
                id: '1',
                airline: 'Ethiopian Airlines',
                airlineLogo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/77/Ethiopian_Airlines_Logo.svg/1200px-Ethiopian_Airlines_Logo.svg.png',
                flightNumber: 'ET 701',
                departureTime: '08:00',
                arrivalTime: '16:00',
                duration: '8h 00m',
                stops: 'Non-stop',
                price: { amount: 850, currency: 'USD' },
                cabinClass: 'Economy'
            },
            {
                id: '2',
                airline: 'Emirates',
                airlineLogo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d0/Emirates_logo.svg/1200px-Emirates_logo.svg.png',
                flightNumber: 'EK 405',
                departureTime: '10:30',
                arrivalTime: '20:45',
                duration: '10h 15m',
                stops: '1 Stop',
                price: { amount: 920, currency: 'USD' },
                cabinClass: 'Economy'
            },
            {
                id: '3',
                airline: 'Lufthansa',
                airlineLogo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b8/Lufthansa_Logo_2018.svg/1200px-Lufthansa_Logo_2018.svg.png',
                flightNumber: 'LH 590',
                departureTime: '14:15',
                arrivalTime: '23:30',
                duration: '9h 15m',
                stops: '1 Stop',
                price: { amount: 880, currency: 'USD' },
                cabinClass: 'Economy'
            },
            {
                id: '4',
                airline: 'Qatar Airways',
                airlineLogo: 'https://upload.wikimedia.org/wikipedia/en/thumb/9/9b/Qatar_Airways_Logo.svg/1200px-Qatar_Airways_Logo.svg.png',
                flightNumber: 'QR 1428',
                departureTime: '18:00',
                arrivalTime: '02:00',
                duration: '8h 00m',
                stops: '1 Stop',
                price: { amount: 950, currency: 'USD' },
                cabinClass: 'Economy'
            }
        ];

        return NextResponse.json({
            flights: mockFlights,
            total: mockFlights.length,
            hasNextPage: false,
            mock: true,
            error: status || 'mock-fallback'
        });
    }
}
