import { NextResponse } from 'next/server';
import { API_CONFIG, API_ENDPOINTS, getApiHeaders } from '@/lib/api-config';
import { useHotelbedsInventory, nestHotelbedsBackendUrl, hotelbedsLanguageFromLocale } from '@/lib/hotel-inventory';
import axios from 'axios';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const hotelId = searchParams.get('hotelId');
  const locale = searchParams.get('locale') || 'en-gb';

  if (!hotelId) {
    return NextResponse.json({ error: 'Hotel ID is required' }, { status: 400 });
  }

  if (useHotelbedsInventory()) {
    const backendUrl = nestHotelbedsBackendUrl() || (process.env.BACKEND_URL || 'http://localhost:4000').replace(/\/$/, '');
    const lang = hotelbedsLanguageFromLocale(locale);
    try {
      const res = await fetch(
        `${backendUrl}/api/v1/hotelbeds/content/description?hotelId=${encodeURIComponent(hotelId)}&language=${encodeURIComponent(lang)}`,
        { headers: { Accept: 'application/json' }, next: { revalidate: 0 } },
      );
      const data = await res.json();
      if (!res.ok) {
        return NextResponse.json({ error: 'Failed to fetch description from backend' }, { status: res.status });
      }
      return NextResponse.json(data);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      console.error('Hotelbeds description proxy:', msg);
      return NextResponse.json({ error: 'Failed to fetch description' }, { status: 500 });
    }
  }

  try {
    const options = {
      method: 'GET',
      url: `https://${API_CONFIG.RAPIDAPI_HOST}${API_ENDPOINTS.HOTELS.DESCRIPTION}`,
      params: {
        hotel_id: hotelId,
        locale,
      },
      headers: getApiHeaders(),
    } as const;

    const response = await axios.request(options);
    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error('Error fetching hotel description:', error.message);
    return NextResponse.json({ error: 'Failed to fetch description' }, { status: 500 });
  }
}
