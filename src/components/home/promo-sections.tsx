"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowRight, Gift, Heart, ChevronRight, ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { useHotels } from '@/hooks/use-hotels';
import { useRouter } from 'next/navigation';
import { useTripStore } from '@/store/trip-store';
import { Popover } from '@/components/ui/popover';

export function SignInPromo() {
    return (
        <Card className="p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow bg-white overflow-hidden relative group">
            <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="flex-1 text-center md:text-left">
                    <h2 className="text-2xl font-bold text-brand-dark mb-2">Sign in, save money</h2>
                    <p className="text-gray-600 mb-6">
                        Save 10% or more at participating properties – just look for the blue Genius label
                    </p>
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                        <Button className="rounded-md px-6">Sign in</Button>
                        <Button variant="ghost" className="text-brand-primary font-bold hover:bg-brand-primary/5">
                            Register
                        </Button>
                    </div>
                </div>
                <div className="relative w-32 h-32 md:w-40 md:h-40 flex-shrink-0">
                    <div className="absolute inset-0 bg-blue-50 rounded-full scale-90 group-hover:scale-100 transition-transform duration-500" />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="relative">
                            <Gift className="w-16 h-16 text-brand-primary animate-bounce" />
                            <div className="absolute -top-2 -right-2 bg-yellow-400 text-[10px] font-bold px-1.5 py-0.5 rounded-full text-brand-dark">
                                Genius
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Card>
    );
}

const offers = [
    {
        title: 'Early 2026 Deals',
        description: 'Save on your next stay with Early 2026 Deals. Book now, stay until April 1, 2026.',
        discount: 'At least 15% off',
        image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=400',
        link: '/hotels',
        buttonText: 'Explore deals'
    },
    {
        title: 'Late Escape Deals',
        description: 'Squeeze out the last of the season with at least 15% off your next stay.',
        discount: 'Go for a good time, not a long time',
        image: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&q=80&w=400',
        link: '/hotels',
        buttonText: 'Find deals'
    }
];

export function OffersSection() {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-2xl md:text-3xl font-bold text-brand-dark mb-2">Offers</h2>
                    <p className="text-gray-500">Promotions, deals, and special offers for you</p>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {offers.map((offer, idx) => (
                    <Card key={idx} className="overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-all group">
                        <div className="flex flex-col sm:flex-row h-full">
                            <div className="p-6 flex-1 flex flex-col justify-between">
                                <div>
                                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{offer.title}</span>
                                    <h3 className="text-xl font-bold text-brand-dark mt-2 mb-2">{offer.discount}</h3>
                                    <p className="text-sm text-gray-600 mb-6">{offer.description}</p>
                                </div>
                                <Link href={offer.link}>
                                    <Button className="w-fit rounded-md px-6">{offer.buttonText}</Button>
                                </Link>
                            </div>
                            <div className="w-full sm:w-2/5 h-48 sm:h-auto relative overflow-hidden">
                                <img
                                    src={offer.image}
                                    alt={offer.title}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
}

const destinations = [
    { name: 'Nairobi', country: 'Kenya', flag: '🇰🇪', image: 'https://images.unsplash.com/photo-1585464231875-d9ef1f5ad396?auto=format&fit=crop&q=80&w=800' },
    { name: 'Dubai', country: 'UAE', flag: '🇦🇪', image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&q=80&w=800' },
    { name: 'Johannesburg', country: 'South Africa', flag: '🇿🇦', image: 'https://images.unsplash.com/photo-1549944850-84e00be4203b?auto=format&fit=crop&q=80&w=800' },
    { name: 'Addis Ababa', country: 'Ethiopia', flag: '🇪🇹', image: 'https://tse2.mm.bing.net/th/id/OIP.eirxq5q5BdeR1K1ETCuItgHaE4?cb=ucfimg2&ucfimg=1&rs=1&pid=ImgDetMain&o=7&rm=3' },
    { name: 'Cape Town', country: 'South Africa', flag: '🇿🇦', image: 'https://images.unsplash.com/photo-1580619305218-8423a7ef79b4?auto=format&fit=crop&q=80&w=800' },
];

export function TrendingDestinations() {
    const defaultParams = new URLSearchParams({
        checkIn: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        checkOut: new Date(Date.now() + 172800000).toISOString().split('T')[0],
        adults: '2',
        rooms: '1'
    });

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl md:text-3xl font-bold text-brand-dark mb-2">Trending destinations</h2>
                <p className="text-gray-500">Travelers searching for Ethiopia also booked these</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {destinations.slice(0, 2).map((dest, idx) => (
                    <Link href={`/hotels?query=${dest.name}&${defaultParams.toString()}`} key={idx} className="group relative h-64 rounded-xl overflow-hidden shadow-sm">
                        <img
                            src={dest.image}
                            alt={dest.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1544203331-360580971092?auto=format&fit=crop&q=80&w=800';
                            }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                        <div className="absolute top-4 left-4 text-white">
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-2xl">{dest.name}</span>
                                <span className="text-2xl">{dest.flag}</span>
                            </div>
                        </div>
                    </Link>
                ))}
                <div className="grid grid-cols-1 gap-4">
                    {destinations.slice(2).map((dest, idx) => (
                        <Link href={`/hotels?query=${dest.name}&${defaultParams.toString()}`} key={idx} className="group relative h-[120px] rounded-xl overflow-hidden shadow-sm">
                            <img
                                src={dest.image}
                                alt={dest.name}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                onError={(e) => {
                                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1544203331-360580971092?auto=format&fit=crop&q=80&w=800';
                                }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                            <div className="absolute top-3 left-3 text-white">
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-lg">{dest.name}</span>
                                    <span className="text-xl">{dest.flag}</span>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}

// Known local images for Ethiopian cities
const CITY_IMAGE_MAP: Record<string, string> = {
    'bahir dar': '/assets/images/wnchi-lake-crater.png',
    'hawassa': '/assets/images/sofomar-cave.png',
    'gondar': '/assets/images/benuna.jpg',
};

const imageForCity = (name: string, fallback?: string) => {
    const key = name.toLowerCase();
    return CITY_IMAGE_MAP[key] || fallback || '/assets/images/addis-ababa-night.jpg';
};

const MANUAL_CITIES = [
    { name: 'Addis Ababa', dest_id: '900040142', nr_hotels: 150, image: 'https://tse2.mm.bing.net/th/id/OIP.eirxq5q5BdeR1K1ETCuItgHaE4?cb=ucfimg2&ucfimg=1&rs=1&pid=ImgDetMain&o=7&rm=3' },
    { name: 'Bishoftu', dest_id: '900040143', nr_hotels: 12, image: 'https://th.bing.com/th/id/OIP.WXUWfYZOZa9vSodkaEp0wgHaDt?w=318&h=175&c=7&r=0&o=7&cb=ucfimg2&pid=1.7&rm=3&ucfimg=1' },
    { name: 'Debre Zeyt', dest_id: '900040149', nr_hotels: 10, image: 'https://th.bing.com/th/id/OIP.9hPKHWrnsOkiw48lmxszogHaE8?w=243&h=180&c=7&r=0&o=7&cb=ucfimg2&pid=1.7&rm=3&ucfimg=1' },
];

export function ExploreEthiopia() {
    const [cities, setCities] = React.useState<any[]>([]);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        const fetchNearby = async () => {
            try {
                // Addis Ababa coordinates
                const response = await fetch('/api/hotels/nearby-cities?latitude=9.0108&longitude=38.7613');
                const data = await response.json();

                // Merge API data with manual data, prioritizing manual data
                const apiCities = (data || []) as any[];
                const merged = [...MANUAL_CITIES];

                apiCities.forEach((apiCity: any) => {
                    const exists = merged.some(c => c.name.toLowerCase() === apiCity.name.toLowerCase());
                        if (!exists) {
                            merged.push({
                                ...apiCity,
                                image: imageForCity(apiCity.name, apiCity.image),
                            });
                        }
                    });

                // Normalize images for all merged entries
                const normalized = merged.map(c => ({
                    ...c,
                    image: imageForCity(c.name, c.image),
                }));

                setCities(normalized.slice(0, 6));
            } catch (error) {
                console.error('Error fetching nearby cities:', error);
                setCities(MANUAL_CITIES.slice(0, 6));
            } finally {
                setLoading(false);
            }
        };
        fetchNearby();
    }, []);

    const defaultParams = new URLSearchParams({
        checkIn: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        checkOut: new Date(Date.now() + 172800000).toISOString().split('T')[0],
        adults: '2',
        rooms: '1'
    });

    if (loading) return <div className="h-48 bg-gray-50 animate-pulse rounded-xl" />;

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl md:text-3xl font-bold text-brand-dark mb-2">Explore Ethiopia</h2>
                <p className="text-gray-500">These popular destinations have a lot to offer</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
                {cities.map((city, idx) => (
                    <Link
                        href={`/hotels?query=${city.name}&${defaultParams.toString()}`}
                        key={idx}
                        className="group"
                    >
                        <div className="aspect-square rounded-xl overflow-hidden mb-2 bg-gray-100">
                            <img
                                src={city.image || `https://cf.bstatic.com/xdata/images/city/square250/${city.dest_id}.jpg?k=...`}
                                alt={city.name}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                onError={(e) => {
                                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1518684079-3c830dcef090?auto=format&fit=crop&q=80&w=400';
                                }}
                            />
                        </div>
                        <h3 className="font-bold text-brand-dark text-sm">{city.name}</h3>
                        <p className="text-xs text-gray-500">{city.nr_hotels || 'Many'} properties</p>
                    </Link>
                ))}
            </div>
        </div>
    );
}

export function PropertyTypeSection() {
    const types = [
        { name: 'Hotels', count: '116 available', image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=400' },
        { name: 'Apartments', count: '21 available', image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&q=80&w=400' },
        { name: 'Resorts', count: '1 available', image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&q=80&w=400' },
        { name: 'Villas', count: '2 available', image: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&q=80&w=400' },
    ];

    const defaultParams = new URLSearchParams({
        checkIn: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        checkOut: new Date(Date.now() + 172800000).toISOString().split('T')[0],
        adults: '2',
        rooms: '1'
    });

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl md:text-3xl font-bold text-brand-dark mb-2">Browse by property type in Addis Ababa</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {types.map((type, idx) => (
                    <Link href={`/hotels?query=Addis Ababa&type=${type.name}&${defaultParams.toString()}`} key={idx} className="group">
                        <div className="aspect-[4/3] rounded-xl overflow-hidden mb-2 bg-gray-100">
                            <img
                                src={type.image}
                                alt={type.name}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                onError={(e) => {
                                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=400';
                                }}
                            />
                        </div>
                        <h3 className="font-bold text-brand-dark text-sm">{type.name}</h3>
                        <p className="text-xs text-gray-500">Jan 1-Jan 2, 4 adults</p>
                        <p className="text-xs text-gray-500">{type.count}</p>
                    </Link>
                ))}
            </div>
        </div>
    );
}

export function PerfectStaySection() {
    const router = useRouter();
    const { addToTrip, currentTrip, removeFromTrip } = useTripStore();
    const { data, isLoading } = useHotels({ query: 'Addis Ababa', filters: { sortOrder: 'popularity' } });
    const hotels = data?.hotels.slice(0, 4) || [];
    const [savedHotelId, setSavedHotelId] = React.useState<string | null>(null);

    const defaultParams = new URLSearchParams({
        checkIn: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        checkOut: new Date(Date.now() + 172800000).toISOString().split('T')[0],
        adults: '2',
        rooms: '1'
    });

    const handleBook = (hotelId: string) => {
        router.push(`/hotels/${hotelId}?${defaultParams.toString()}`);
    };

    const handleHeartClick = (e: React.MouseEvent, hotel: any) => {
        e.stopPropagation();
        const isSaved = currentTrip.some(item => item.details?.id === hotel.id);

        if (isSaved) {
            const tripItem = currentTrip.find(item => item.details?.id === hotel.id);
            if (tripItem) removeFromTrip(tripItem.id);
            setSavedHotelId(null);
        } else {
            addToTrip({
                type: 'hotel',
                details: hotel,
                price: hotel.price
            });
            setSavedHotelId(hotel.id);
            setTimeout(() => setSavedHotelId(null), 3000);
        }
    };

    if (isLoading) return <div className="h-64 bg-gray-50 animate-pulse rounded-xl" />;

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl md:text-3xl font-bold text-brand-dark mb-2">Looking for the perfect stay?</h2>
                <p className="text-gray-500">Travelers with similar searches booked these properties</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {hotels.map((hotel) => {
                    const isSaved = currentTrip.some(item => item.details?.id === hotel.id);
                    return (
                        <div key={hotel.id} className="group cursor-pointer flex flex-col h-full bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden" onClick={() => handleBook(hotel.id)}>
                            <div className="relative aspect-square overflow-hidden bg-gray-100">
                                <img
                                    src={hotel.image}
                                    alt={hotel.name}
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=400';
                                    }}
                                />
                                <div className="absolute top-3 right-3">
                                    <Popover
                                        isOpen={savedHotelId === hotel.id}
                                        onOpenChange={(open) => !open && setSavedHotelId(null)}
                                        trigger={
                                            <button
                                                onClick={(e) => handleHeartClick(e, hotel)}
                                                className={`p-2 backdrop-blur-sm rounded-full transition-all ${isSaved ? 'bg-red-50 text-red-500' : 'bg-white/80 text-gray-600 hover:text-red-500'
                                                    }`}
                                            >
                                                <Heart className={`w-5 h-5 ${isSaved ? 'fill-current' : ''}`} />
                                            </button>
                                        }
                                        content={<SavedToTripPopover hotel={hotel} isOpen={savedHotelId === hotel.id} onClose={() => setSavedHotelId(null)} />}
                                        placement="bottom"
                                        align="right"
                                    />
                                </div>
                            </div>
                            <div className="p-3 flex flex-col flex-1">
                                <h3 className="font-bold text-brand-dark text-sm line-clamp-1 mb-1">{hotel.name}</h3>
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="bg-brand-primary text-white text-[10px] font-bold px-1 py-0.5 rounded">
                                        {hotel.rating.toFixed(1)}
                                    </div>
                                    <div className="text-[10px]">
                                        <span className="font-bold text-gray-900">{hotel.reviewWord || 'Excellent'}</span>
                                        <span className="text-gray-500 ml-1">· {hotel.reviews} reviews</span>
                                    </div>
                                </div>
                                <div className="mt-auto flex flex-col items-end">
                                    <span className="text-[10px] text-gray-500">Starting from</span>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-[10px] font-bold text-gray-900">US$</span>
                                        <span className="text-lg font-bold text-gray-900">{Math.round(hotel.price)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function SavedToTripPopover({ hotel, isOpen, onClose }: { hotel: any, isOpen: boolean, onClose: () => void }) {
    return (
        <div className="p-4 bg-white rounded-xl shadow-2xl border border-gray-100 min-w-[240px] animate-in fade-in zoom-in duration-200 relative z-[10010]">
            <div className="flex flex-col gap-4">
                <div>
                    <p className="text-sm text-gray-600 mb-1 flex items-center gap-1">
                        Saved to:
                        <Link href="/trips" className="text-brand-primary font-bold hover:underline">
                            My next trip
                        </Link>
                    </p>
                </div>
                <div className="h-px bg-gray-100" />
                <label className="flex items-center gap-3 cursor-pointer group">
                    <div className="w-5 h-5 rounded-full border-2 border-brand-primary flex items-center justify-center">
                        <div className="w-2.5 h-2.5 rounded-full bg-brand-primary" />
                    </div>
                    <span className="text-sm font-medium text-gray-900">My next trip</span>
                </label>
            </div>
        </div>
    );
}

export function HomesGuestsLoveSection() {
    const router = useRouter();
    const { addToTrip, currentTrip, removeFromTrip } = useTripStore();
    const { data, isLoading } = useHotels({ query: 'Ethiopia', filters: { sortOrder: 'popularity' } });
    const hotels = data?.hotels.slice(4, 12) || []; // More for carousel
    const [savedHotelId, setSavedHotelId] = React.useState<string | null>(null);
    const [scrollIndex, setScrollIndex] = React.useState(0);

    const defaultParams = new URLSearchParams({
        checkIn: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        checkOut: new Date(Date.now() + 172800000).toISOString().split('T')[0],
        adults: '2',
        rooms: '1'
    });

    const handleBook = (hotelId: string) => {
        router.push(`/hotels/${hotelId}?${defaultParams.toString()}`);
    };

    const handleHeartClick = (e: React.MouseEvent, hotel: any) => {
        e.stopPropagation();
        const isSaved = currentTrip.some(item => item.details?.id === hotel.id);

        if (isSaved) {
            const tripItem = currentTrip.find(item => item.details?.id === hotel.id);
            if (tripItem) removeFromTrip(tripItem.id);
            setSavedHotelId(null);
        } else {
            addToTrip({
                type: 'hotel',
                details: hotel,
                price: hotel.price
            });
            setSavedHotelId(hotel.id);
            // Hide popover after 3 seconds
            setTimeout(() => setSavedHotelId(null), 3000);
        }
    };

    const next = () => {
        if (scrollIndex < hotels.length - 4) setScrollIndex(prev => prev + 1);
    };

    const prev = () => {
        if (scrollIndex > 0) setScrollIndex(prev => prev - 1);
    };

    if (isLoading) return <div className="h-64 bg-gray-50 animate-pulse rounded-xl" />;

    return (
        <div className="space-y-6 relative">
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-2xl md:text-3xl font-bold text-brand-dark mb-2">Homes guests love</h2>
                </div>
                <div className="flex items-center gap-4">
                    <Link href={`/hotels?${defaultParams.toString()}`} className="text-brand-primary text-sm font-medium hover:underline hidden sm:block">Discover homes</Link>
                    <div className="flex gap-2">
                        <button
                            onClick={prev}
                            disabled={scrollIndex === 0}
                            className="p-2 rounded-full border border-gray-200 hover:bg-gray-50 disabled:opacity-30 transition-all"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button
                            onClick={next}
                            disabled={scrollIndex >= hotels.length - 4}
                            className="p-2 rounded-full border border-gray-200 hover:bg-gray-50 disabled:opacity-30 transition-all"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>

            <div className="overflow-hidden">
                <motion.div
                    className="flex gap-4"
                    animate={{ x: `calc(-${scrollIndex * 25}% - ${scrollIndex * 12}px)` }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                >
                    {hotels.map((hotel) => {
                        const isSaved = currentTrip.some(item => item.details?.id === hotel.id);
                        return (
                            <div
                                key={hotel.id}
                                className="min-w-[calc(100%-16px)] sm:min-w-[calc(50%-12px)] lg:min-w-[calc(25%-12px)] group cursor-pointer flex flex-col h-full bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden"
                                onClick={() => handleBook(hotel.id)}
                            >
                                <div className="relative aspect-square overflow-hidden bg-gray-100">
                                    <img
                                        src={hotel.image}
                                        alt={hotel.name}
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=400';
                                        }}
                                    />
                                    <div className="absolute top-3 right-3">
                                        <Popover
                                            isOpen={savedHotelId === hotel.id}
                                            onOpenChange={(open) => !open && setSavedHotelId(null)}
                                            trigger={
                                                <button
                                                    onClick={(e) => handleHeartClick(e, hotel)}
                                                    className={`p-2 backdrop-blur-sm rounded-full transition-all ${isSaved ? 'bg-red-50 text-red-500' : 'bg-white/80 text-gray-600 hover:text-red-500'
                                                        }`}
                                                >
                                                    <Heart className={`w-5 h-5 ${isSaved ? 'fill-current' : ''}`} />
                                                </button>
                                            }
                                            content={<SavedToTripPopover hotel={hotel} isOpen={savedHotelId === hotel.id} onClose={() => setSavedHotelId(null)} />}
                                            placement="bottom"
                                            align="right"
                                        />
                                    </div>
                                </div>
                                <div className="p-3 flex flex-col flex-1">
                                    <h3 className="font-bold text-brand-dark text-sm line-clamp-1 mb-1">{hotel.name}</h3>
                                    <p className="text-xs text-gray-500 mb-2">{hotel.location.split(',').slice(-2).join(', ')}</p>
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="bg-brand-primary text-white text-[10px] font-bold px-1 py-0.5 rounded">
                                            {hotel.rating.toFixed(1)}
                                        </div>
                                        <div className="text-[10px]">
                                            <span className="font-bold text-gray-900">{hotel.reviewWord || 'Excellent'}</span>
                                            <span className="text-gray-500 ml-1">· {hotel.reviews} reviews</span>
                                        </div>
                                    </div>
                                    <div className="mt-auto flex flex-col items-end">
                                        <span className="text-[10px] text-gray-500">Starting from</span>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-[10px] font-bold text-gray-900">US$</span>
                                            <span className="text-lg font-bold text-gray-900">{Math.round(hotel.price)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </motion.div>
            </div>
        </div>
    );
}
