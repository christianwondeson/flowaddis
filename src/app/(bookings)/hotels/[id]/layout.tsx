import type { Metadata } from 'next';
import React from 'react';
import { HotelJsonLd } from '@/components/seo/json-ld';
import { getHotelCoverUrl } from '@/lib/hotel-brand';

type Props = {
    params: Promise<{ id: string }>;
    children: React.ReactNode;
};

async function fetchHotelMeta(id: string) {
    try {
        const backend = process.env.BACKEND_URL || 'https://api-prod.bookaddis.com';
        const res = await fetch(`${backend}/api/v1/hotels/${encodeURIComponent(id)}`, {
            next: { revalidate: 3600 },
            signal: AbortSignal.timeout(3000),
        }).catch(() => null);
        if (!res?.ok) return null;
        return await res.json().catch(() => null);
    } catch {
        return null;
    }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { id } = await params;
    const hotel = await fetchHotelMeta(id);

    const name = hotel?.name || 'Hotel in Addis Ababa';
    const city = hotel?.city || 'Addis Ababa';
    const desc = hotel?.description
        ? String(hotel.description).slice(0, 160)
        : `Book your stay at ${name} in ${city}, Ethiopia on BookAddis. Verified rates, amenities, and instant reservation.`;
    const cover = getHotelCoverUrl(hotel?.media) || '/assets/images/addis-view.webp';

    return {
        title: `${name} – ${city}, Ethiopia`,
        description: desc,
        alternates: {
            canonical: `/hotels/${id}`,
        },
        openGraph: {
            title: `${name} – ${city}, Ethiopia | BookAddis`,
            description: desc,
            url: `https://bookaddis.com/hotels/${id}`,
            images: [
                {
                    url: cover,
                    alt: name,
                },
            ],
            type: 'website',
        },
        twitter: {
            card: 'summary_large_image',
            title: `${name} | BookAddis`,
            description: desc,
            images: [cover],
        },
        other: {
            'geo.region': 'ET-AA',
            'geo.placename': city,
            ...(hotel?.latitude && hotel?.longitude
                ? { 'geo.position': `${hotel.latitude};${hotel.longitude}`, ICBM: `${hotel.latitude}, ${hotel.longitude}` }
                : { 'geo.position': '9.005401;38.763611', ICBM: '9.005401, 38.763611' }),
        },
    };
}

export default async function HotelDetailLayout({ params, children }: Props) {
    const { id } = await params;
    const hotel = await fetchHotelMeta(id);

    return (
        <>
            {hotel?.name ? (
                <HotelJsonLd
                    name={hotel.name}
                    description={hotel.description}
                    image={getHotelCoverUrl(hotel.media)}
                    city={hotel.city || 'Addis Ababa'}
                    address={hotel.location || hotel.address}
                    starRating={hotel.star_rating}
                    latitude={hotel.latitude ? Number(hotel.latitude) : undefined}
                    longitude={hotel.longitude ? Number(hotel.longitude) : undefined}
                />
            ) : null}
            {children}
        </>
    );
}
