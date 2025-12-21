import { NextResponse } from 'next/server';
import { API_CONFIG, API_ENDPOINTS, getApiHeaders } from '@/lib/api-config';
import axios from 'axios';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const fromCode = searchParams.get('fromCode') || 'ADD'; // Default to Addis Ababa
    const toCode = searchParams.get('toCode') || 'DXB'; // Default to Dubai
    const departDate = searchParams.get('departDate') || new Date(Date.now() + 86400000).toISOString().split('T')[0];
    const returnDate = searchParams.get('returnDate');
    const adults = searchParams.get('adults') || '1';
    const children = searchParams.get('children') || '0';
    const page = searchParams.get('page') || '0';
    const currency = searchParams.get('currency') || 'USD';

    try {
        const options = {
            method: 'GET',
            url: `${API_CONFIG.BASE_URL}${API_ENDPOINTS.FLIGHTS.SEARCH}`,
            params: {
                from_code: fromCode,
                to_code: toCode,
                depart_date: departDate,
                return_date: returnDate,
                adults: adults,
                children_ages: children !== '0' ? Array(parseInt(children)).fill('10').join(',') : undefined, // Mock ages if children > 0
                page_number: page,
                flight_type: returnDate ? 'ROUNDTRIP' : 'ONEWAY',
                cabin_class: 'ECONOMY',
                order_by: 'BEST',
                locale: 'en-gb',
                currency,
            },
            headers: getApiHeaders(),
        };

        console.log('Fetching flights with params:', JSON.stringify(options.params, null, 2));

        const response = await axios.request(options);

        // Normalize RapidAPI response to the frontend schema: { flights: [...] }
        const data = response.data as any;
        const offers = Array.isArray(data?.flightOffers) ? data.flightOffers : [];

        const toTime = (iso?: string) => {
            if (!iso) return '';
            try {
                const d = new Date(iso);
                // Format as HH:MM in local time
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
                id: offer?.unifiedPriceBreakdown?.id || offer?.offerKeyToHighlight || String(idx + 1),
                airline,
                airlineLogo,
                flightNumber,
                departureTime,
                arrivalTime,
                duration,
                stops,
                price: { amount: Number(priceUnits) || 0, currency },
                cabinClass,
            };
        });

        const totalCount = (response.data?.aggregation?.filteredTotalCount ?? response.data?.aggregation?.totalCount ?? flights.length) as number;
        // Heuristic for hasNextPage: if current page items * (pageIndex+1) < totalCount
        const pageIndex = Number(page) || 0;
        const pageSize = flights.length || 0; // RapidAPI may vary; best-effort
        const hasNextPage = pageSize > 0 ? (pageSize * (pageIndex + 1) < totalCount) : false;
        return NextResponse.json({ flights, total: totalCount, hasNextPage });
    } catch (error: any) {
        console.error('Error fetching flights:', error.message);

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
            hasNextPage: false
        });
    }
}
