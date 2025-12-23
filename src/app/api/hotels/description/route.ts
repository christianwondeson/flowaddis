import { NextResponse } from 'next/server';
import { API_CONFIG, API_ENDPOINTS, getApiHeaders } from '@/lib/api-config';
import axios from 'axios';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const hotelId = searchParams.get('hotelId');
  const locale = searchParams.get('locale') || 'en-gb';

  if (!hotelId) {
    return NextResponse.json({ error: 'Hotel ID is required' }, { status: 400 });
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
