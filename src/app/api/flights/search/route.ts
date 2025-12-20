import { NextResponse } from 'next/server';
import { API_CONFIG, API_ENDPOINTS, getApiHeaders } from '@/lib/api-config';
import axios from 'axios';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const fromCode = searchParams.get('fromCode');
    const toCode = searchParams.get('toCode');
    const departDate = searchParams.get('departDate');
    const returnDate = searchParams.get('returnDate');
    const adults = searchParams.get('adults') || '1';
    const page = searchParams.get('page') || '0';

    if (!fromCode || !toCode || !departDate) {
        return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

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
                page_number: page,
                flight_type: returnDate ? 'ROUNDTRIP' : 'ONEWAY',
                cabin_class: 'ECONOMY',
                order_by: 'BEST',
                locale: 'en-gb',
                currency: 'USD',
                children_ages: '0',
            },
            headers: getApiHeaders(),
        };

        const response = await axios.request(options);
        return NextResponse.json(response.data);
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
            }
        ];

        return NextResponse.json({
            data: { flights: mockFlights },
            fromMock: true
        });
    }
}
