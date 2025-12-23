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

const MANUAL_CITIES = [
    { name: 'Addis Ababa', dest_id: '900040142', nr_hotels: 150, image: 'https://tse2.mm.bing.net/th/id/OIP.eirxq5q5BdeR1K1ETCuItgHaE4?cb=ucfimg2&ucfimg=1&rs=1&pid=ImgDetMain&o=7&rm=3' },
    { name: 'Bishoftu', dest_id: '900040143', nr_hotels: 12, image: 'https://th.bing.com/th/id/OIP.WXUWfYZOZa9vSodkaEp0wgHaDt?w=318&h=175&c=7&r=0&o=7&cb=ucfimg2&pid=1.7&rm=3&ucfimg=1' },
    { name: 'Debre Zeyt', dest_id: '900040149', nr_hotels: 10, image: 'https://th.bing.com/th/id/OIP.9hPKHWrnsOkiw48lmxszogHaE8?w=243&h=180&c=7&r=0&o=7&cb=ucfimg2&pid=1.7&rm=3&ucfimg=1' },
    { name: 'Sululta', dest_id: '900040150', nr_hotels: 5, image: 'data:image/webp;base64,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' },
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
                const apiCities = data || [];
                const merged = [...MANUAL_CITIES];

                apiCities.forEach((apiCity: any) => {
                    const exists = merged.some(c => c.name.toLowerCase() === apiCity.name.toLowerCase());
                    if (!exists) {
                        merged.push(apiCity);
                    }
                });

                setCities(merged.slice(0, 6));
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
