import type { AdConfig } from '@/lib/types/ads';

/**
 * Clean, low-noise sponsored units for listing pages.
 * Prefer soft copy + light imagery over dark “Ad · Sponsored” bars.
 */
export const HOTEL_ADS_LEFT: AdConfig[] = [
    {
        id: 'hotel-left-partner',
        sponsor: 'BookAddis Partner',
        title: 'List your property',
        subtitle: 'Reach guests searching Addis and beyond.',
        cta: 'Learn more',
        imageUrl: '/ads/partnership-mobile-ad.png',
        altText: 'List your property on BookAddis',
        linkUrl: '/contact',
        tone: 'teal',
    },
];

export const HOTEL_ADS_RIGHT: AdConfig[] = [
    {
        id: 'hotel-right-stay',
        sponsor: 'Featured',
        title: 'Stay in the city centre',
        subtitle: 'Hand-picked Direct hotels with flexible rates.',
        cta: 'Browse stays',
        imageUrl: '/ads/hotel-ad-sample.png',
        altText: 'Featured hotels in Addis Ababa',
        linkUrl: '/hotels',
        tone: 'sand',
    },
    {
        id: 'hotel-right-partner',
        sponsor: 'Advertise',
        title: 'Promote your brand',
        subtitle: 'Subtle placements beside search results.',
        cta: 'Contact sales',
        imageUrl: '/ads/partnership-mobile-ad.png',
        altText: 'Advertise on BookAddis',
        linkUrl: '/contact',
        tone: 'slate',
    },
];

export const FLIGHT_ADS_LEFT: AdConfig[] = [
    {
        id: 'flight-left-partner',
        sponsor: 'BookAddis Partner',
        title: 'Airline partnerships',
        subtitle: 'Put your routes in front of ready travellers.',
        cta: 'Partner with us',
        imageUrl: '/ads/partnership-mobile-ad.png',
        altText: 'Airline partnership opportunities',
        linkUrl: '/contact',
        tone: 'sky',
    },
];

export const FLIGHT_ADS_RIGHT: AdConfig[] = [
    {
        id: 'flight-right-airline',
        sponsor: 'Featured',
        title: 'Discover Ethiopia by air',
        subtitle: 'Compare routes and continue with secure checkout.',
        cta: 'Explore flights',
        imageUrl: '/ads/flight-ad-sample.png',
        altText: 'Discover Ethiopia by air',
        linkUrl: '/flights',
        tone: 'sky',
        targetBlank: false,
    },
    {
        id: 'flight-right-stay',
        sponsor: 'Add-on',
        title: 'Need a hotel too?',
        subtitle: 'Bundle your flight with a Direct stay.',
        cta: 'Find hotels',
        imageUrl: '/ads/hotel-ad-sample.png',
        altText: 'Hotels after your flight',
        linkUrl: '/hotels',
        tone: 'teal',
    },
];

export const CONFERENCE_ADS_LEFT: AdConfig[] = [
    {
        id: 'conf-left-partner',
        sponsor: 'Venues',
        title: 'Host with BookAddis',
        subtitle: 'Publish halls with capacity, photo, and hire price.',
        cta: 'Contact us',
        imageUrl: '/ads/partnership-mobile-ad.png',
        altText: 'Host conference venues',
        linkUrl: '/contact',
        tone: 'slate',
    },
];

export const CONFERENCE_ADS_RIGHT: AdConfig[] = [
    {
        id: 'conf-right-shuttle',
        sponsor: 'Tip',
        title: 'Airport transfers',
        subtitle: 'Add a hotel shuttle for arriving guests.',
        cta: 'View shuttles',
        imageUrl: '/ads/hotel-ad-sample.png',
        altText: 'Airport shuttles',
        linkUrl: '/shuttles',
        tone: 'sand',
    },
];

export const SHUTTLE_ADS_LEFT: AdConfig[] = [
    {
        id: 'shuttle-left-stay',
        sponsor: 'Stay',
        title: 'Book the hotel too',
        subtitle: 'Same properties that run these transfers.',
        cta: 'Browse hotels',
        imageUrl: '/ads/hotel-ad-sample.png',
        altText: 'Hotels with shuttles',
        linkUrl: '/hotels',
        tone: 'teal',
    },
];

export const SHUTTLE_ADS_RIGHT: AdConfig[] = [
    {
        id: 'shuttle-right-partner',
        sponsor: 'Fleet',
        title: 'Add your vehicles',
        subtitle: 'Hotel Admin → Shuttles  plate, price, photo.',
        cta: 'Get listed',
        imageUrl: '/ads/partnership-mobile-ad.png',
        altText: 'List hotel shuttles',
        linkUrl: '/contact',
        tone: 'sky',
    },
];
