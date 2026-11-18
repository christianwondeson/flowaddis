import React from 'react';

/**
 * Global Schema.org JSON-LD for BookAddis.
 * Provides TravelAgency and WebSite structured data with Geo coordinates for Addis Ababa, Ethiopia.
 */
export function RootJsonLd() {
    const origin = process.env.NEXT_PUBLIC_APP_URL || 'https://bookaddis.com';

    const organizationSchema = {
        '@context': 'https://schema.org',
        '@type': 'TravelAgency',
        name: 'BookAddis',
        alternateName: ['BookAddis Ethiopia', 'Book Addis'],
        url: origin,
        logo: `${origin}/assets/images/logo-192.png`,
        image: `${origin}/assets/images/addis-ababa-night.webp`,
        description:
            'Book verified hotels, airport shuttles, and conference venues across Addis Ababa and Ethiopia. Pay with CBE Birr, Telebirr, or Mastercard / Visa.',
        address: {
            '@type': 'PostalAddress',
            streetAddress: 'Bole Road',
            addressLocality: 'Addis Ababa',
            addressRegion: 'Addis Ababa',
            addressCountry: 'ET',
        },
        geo: {
            '@type': 'GeoCoordinates',
            latitude: 9.005401,
            longitude: 38.763611,
        },
        areaServed: {
            '@type': 'Country',
            name: 'Ethiopia',
        },
        currenciesAccepted: 'ETB, USD, EUR, GBP',
        paymentAccepted:
            'Cash on Arrival, CBE Birr, Telebirr, Credit Card, Mastercard, Visa',
        priceRange: '$$',
        sameAs: [],
    };

    const websiteSchema = {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'BookAddis',
        url: origin,
        potentialAction: {
            '@type': 'SearchAction',
            target: `${origin}/?destination={search_term_string}`,
            'query-input': 'required name=search_term_string',
        },
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify(organizationSchema),
                }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify(websiteSchema),
                }}
            />
        </>
    );
}

/**
 * Hotel detail Schema.org JSON-LD.
 */
export function HotelJsonLd({
    name,
    description,
    image,
    city,
    address,
    starRating,
    priceRange,
    latitude,
    longitude,
}: {
    name: string;
    description?: string;
    image?: string | null;
    city?: string | null;
    address?: string | null;
    starRating?: number | string | null;
    priceRange?: string | null;
    latitude?: number | null;
    longitude?: number | null;
}) {
    const origin = process.env.NEXT_PUBLIC_APP_URL || 'https://bookaddis.com';

    const hotelSchema = {
        '@context': 'https://schema.org',
        '@type': 'Hotel',
        name,
        description: description || `${name} in ${city || 'Addis Ababa'}, Ethiopia.`,
        image: image || `${origin}/assets/images/addis-view.webp`,
        address: {
            '@type': 'PostalAddress',
            streetAddress: address || 'Addis Ababa',
            addressLocality: city || 'Addis Ababa',
            addressRegion: city || 'Addis Ababa',
            addressCountry: 'ET',
        },
        ...(latitude && longitude
            ? {
                  geo: {
                      '@type': 'GeoCoordinates',
                      latitude,
                      longitude,
                  },
              }
            : {}),
        ...(starRating
            ? {
                  starRating: {
                      '@type': 'Rating',
                      ratingValue: String(starRating),
                  },
              }
            : {}),
        priceRange: priceRange || 'ETB',
    };

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
                __html: JSON.stringify(hotelSchema),
            }}
        />
    );
}
