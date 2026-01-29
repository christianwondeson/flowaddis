import { NextResponse } from 'next/server';
import { API_CONFIG, getApiHeaders } from '@/lib/api-config';
import axios from 'axios';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const selectionKey = searchParams.get('selectionKey');
  const searchPath = searchParams.get('searchPath');

  if (!selectionKey || !searchPath) {
    return NextResponse.json({ error: 'selectionKey and searchPath are required' }, { status: 400 });
  }

  try {
    const url = `${API_CONFIG.FLIGHTS_BASE_URL}/getFlightDetails`;
    const response = await axios.get(url, {
      params: { selectionKey, searchPath },
      headers: getApiHeaders(API_CONFIG.FLIGHTS_HOST),
    });

    // Pass-through response, but ensure consistent shape
    const data = response.data;
    return NextResponse.json({ detail: data, mock: false });
  } catch (error: any) {
    const status = error?.response?.status || 500;
    const data = error?.response?.data;
    console.error('Error fetching flight detail:', status, error?.message, data);

    return NextResponse.json({
      detail: null,
      mock: true,
      error: status,
      message: 'Falling back due to upstream error',
    }, { status: 200 });
  }
}
