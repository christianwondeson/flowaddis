'use client';

import React, { useState } from 'react';
import {
    Compass,
    MapPin,
    Star,
    ExternalLink,
    Coffee,
    Camera,
    Info,
    Calendar,
    Phone,
    MessageCircle,
    CheckCircle2,
    Sparkles,
    ShieldCheck,
    Globe,
    ChevronRight,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface TripAdvisorExperience {
    id: string;
    title: string;
    amharicTitle?: string;
    category: 'culture' | 'nature' | 'heritage' | 'food';
    rating: number;
    reviewsCount: number;
    duration: string;
    location: string;
    description: string;
    imageUrl: string;
    tripAdvisorUrl: string;
    badge?: string;
}

export interface LocalTripAdvisor {
    id: string;
    name: string;
    title: string;
    experienceYears: number;
    languages: string[];
    specialty: string;
    phone: string;
    whatsapp: string;
    verified: boolean;
    rating: number;
}

const EXPERIENCES: TripAdvisorExperience[] = [
    {
        id: 'national-museum-lucy',
        title: 'National Museum of Ethiopia & Lucy (Dinkinesh)',
        amharicTitle: 'የኢትዮጵያ ብሔራዊ ሙዚየም',
        category: 'heritage',
        rating: 4.8,
        reviewsCount: 1840,
        duration: '2–3 hours',
        location: 'King George VI St, Addis Ababa',
        description:
            'Home of the famous 3.2-million-year-old fossilized skeleton of Lucy (Dinkinesh), royal regalia of Emperor Haile Selassie, and ancient Aksumite artifacts.',
        imageUrl:
            'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&auto=format&fit=crop',
        tripAdvisorUrl:
            'https://www.tripadvisor.com/Attraction_Review-g293791-d317805-Reviews-National_Museum_of_Ethiopia-Addis_Ababa.html',
        badge: 'TripAdvisor #1 Landmark',
    },
    {
        id: 'entoto-park',
        title: 'Mount Entoto & Entoto Natural Park',
        amharicTitle: 'እንጦጦ ፓርክ',
        category: 'nature',
        rating: 4.9,
        reviewsCount: 1420,
        duration: 'Half day',
        location: 'Northern Addis Ababa (3,200m elevation)',
        description:
            'Breathtaking panoramic viewpoints over Addis Ababa, eucalyptus trails, zipline adventure, historical Menelik II Palace, and modern eco-cafes.',
        imageUrl:
            'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop',
        tripAdvisorUrl:
            'https://www.tripadvisor.com/Attraction_Review-g293791-d479133-Reviews-Mount_Entoto-Addis_Ababa.html',
        badge: 'Top Scenic View',
    },
    {
        id: 'coffee-ceremony',
        title: 'Traditional Ethiopian Coffee Roasting Ceremony',
        amharicTitle: 'ባህላዊ የቡና አፈላል',
        category: 'food',
        rating: 4.9,
        reviewsCount: 960,
        duration: '1–2 hours',
        location: 'Piazza & Bole, Addis Ababa',
        description:
            'Experience Ethiopia as the birthplace of Arabica coffee. Fresh green beans roasted over hot coals, ground by mortar, and served in clay Jebena pots with popcorn.',
        imageUrl:
            'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&auto=format&fit=crop',
        tripAdvisorUrl:
            'https://www.tripadvisor.com/Attractions-g293791-Activities-c36-t132-Addis_Ababa.html',
        badge: 'Cultural Must-Do',
    },
    {
        id: 'holy-trinity-cathedral',
        title: 'Holy Trinity Cathedral (Kidist Selassie)',
        amharicTitle: 'ቅድስት ሥላሴ ካቴድራል',
        category: 'heritage',
        rating: 4.7,
        reviewsCount: 1180,
        duration: '1.5 hours',
        location: 'Arat Kilo, Addis Ababa',
        description:
            'The highest-ranking Ethiopian Orthodox cathedral in Addis Ababa. Houses the granite tombs of Emperor Haile Selassie and Empress Menen Asfaw.',
        imageUrl:
            'https://images.unsplash.com/photo-1548625361-1200fa447d6e?w=800&auto=format&fit=crop',
        tripAdvisorUrl:
            'https://www.tripadvisor.com/Attraction_Review-g293791-d479134-Reviews-Holy_Trinity_Cathedral-Addis_Ababa.html',
    },
    {
        id: 'bishoftu-crater-lakes',
        title: 'Bishoftu (Debre Zeyit) Volcanic Crater Lakes',
        amharicTitle: 'የቢሾፍቱ ሐይቆች',
        category: 'nature',
        rating: 4.8,
        reviewsCount: 780,
        duration: 'Full Day Excursion',
        location: '45 km South of Addis Ababa',
        description:
            'Five picturesque volcanic caldera lakes (Babogaya, Bishoftu, Kuriftu, Hora, Kilole). Luxury eco-lodges, boat kayaking, and fresh tilapia fish dining.',
        imageUrl:
            'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop',
        tripAdvisorUrl:
            'https://www.tripadvisor.com/Attractions-g659546-Activities-Debre_Zeyit_Oromiya_Region.html',
        badge: 'Best Day Trip',
    },
];

const LOCAL_ADVISORS: LocalTripAdvisor[] = [
    {
        id: 'dawit-tours',
        name: 'Dawit Bekele',
        title: 'Senior Cultural & Historical Tour Guide',
        experienceYears: 12,
        languages: ['English', 'Amharic', 'French'],
        specialty: 'Addis City, UNESCO Heritage & Church History',
        phone: '+251911234567',
        whatsapp: '251911234567',
        verified: true,
        rating: 4.9,
    },
    {
        id: 'selam-nature',
        name: 'Selamawit Tadesse',
        title: 'Nature, Coffee & Diaspora Excursion Advisor',
        experienceYears: 8,
        languages: ['English', 'Amharic', 'German'],
        specialty: 'Entoto Treks, Bishoftu Resorts & Food Walks',
        phone: '+251912345678',
        whatsapp: '251912345678',
        verified: true,
        rating: 5.0,
    },
];

export function EthiopiaTripAdvisorSection({ className }: { className?: string }) {
    const [filterCategory, setFilterCategory] = useState<'all' | 'heritage' | 'nature' | 'food'>('all');

    const filtered = EXPERIENCES.filter(
        (e) => filterCategory === 'all' || e.category === filterCategory,
    );

    return (
        <section className={cn('space-y-6', className)}>
            {/* Header with TripAdvisor Co-Branding */}
            <div className="rounded-2xl border border-emerald-200 dark:border-emerald-900 bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 dark:from-slate-900 dark:via-emerald-950/30 dark:to-slate-900 p-4 sm:p-6 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            {/* TripAdvisor Owl Icon */}
                            <span className="p-1.5 rounded-lg bg-[#00AA6C] text-white">
                                <Compass className="w-5 h-5" />
                            </span>
                            <span className="text-xs font-bold uppercase tracking-wider text-[#00AA6C] dark:text-emerald-400">
                                Curated Travel Companion · Ethiopia
                            </span>
                        </div>
                        <h2 className="text-lg sm:text-2xl font-black text-brand-dark dark:text-slate-100">
                            Ethiopia Trip Advisor & Local Travel Guide
                        </h2>
                        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-2xl">
                            Make the most of your journey. Explore TripAdvisor top-ranked attractions, cultural ceremonies, and certified Ethiopian local tour advisors.
                        </p>
                    </div>

                    <a
                        href="https://www.tripadvisor.com/Attractions-g293791-Activities-Addis_Ababa.html"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-[#00AA6C] hover:bg-[#008f5a] text-white shadow-xs transition-all shrink-0 active:scale-98"
                    >
                        <span>View on TripAdvisor</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                </div>

                {/* Filter Chips */}
                <div className="mt-4 pt-3 border-t border-emerald-200/60 dark:border-emerald-900/60 flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
                    <button
                        type="button"
                        onClick={() => setFilterCategory('all')}
                        className={cn(
                            'px-3 py-1.5 rounded-full text-xs font-semibold transition-colors shrink-0',
                            filterCategory === 'all'
                                ? 'bg-brand-primary text-white'
                                : 'bg-white/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-white',
                        )}
                    >
                        All Experiences ({EXPERIENCES.length})
                    </button>
                    <button
                        type="button"
                        onClick={() => setFilterCategory('heritage')}
                        className={cn(
                            'px-3 py-1.5 rounded-full text-xs font-semibold transition-colors shrink-0',
                            filterCategory === 'heritage'
                                ? 'bg-brand-primary text-white'
                                : 'bg-white/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-white',
                        )}
                    >
                        🏛️ Heritage & Museums
                    </button>
                    <button
                        type="button"
                        onClick={() => setFilterCategory('nature')}
                        className={cn(
                            'px-3 py-1.5 rounded-full text-xs font-semibold transition-colors shrink-0',
                            filterCategory === 'nature'
                                ? 'bg-brand-primary text-white'
                                : 'bg-white/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-white',
                        )}
                    >
                        🌄 Nature & Viewpoints
                    </button>
                    <button
                        type="button"
                        onClick={() => setFilterCategory('food')}
                        className={cn(
                            'px-3 py-1.5 rounded-full text-xs font-semibold transition-colors shrink-0',
                            filterCategory === 'food'
                                ? 'bg-brand-primary text-white'
                                : 'bg-white/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-white',
                        )}
                    >
                        ☕ Coffee & Cuisine
                    </button>
                </div>
            </div>

            {/* Experiences Grid */}
            <div className="grid gap-4 sm:gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {filtered.map((exp) => (
                    <Card
                        key={exp.id}
                        className="overflow-hidden rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs hover:shadow-md transition-all flex flex-col group"
                    >
                        <div className="relative aspect-[16/10] bg-slate-100 dark:bg-slate-800 overflow-hidden">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={exp.imageUrl}
                                alt={exp.title}
                                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            {exp.badge && (
                                <div className="absolute top-2.5 left-2.5">
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-black/65 backdrop-blur-md text-white text-[10px] sm:text-[11px] font-bold">
                                        <Sparkles className="w-3 h-3 text-amber-400" />
                                        {exp.badge}
                                    </span>
                                </div>
                            )}
                            <div className="absolute top-2.5 right-2.5">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#00AA6C] text-white text-[10px] font-bold">
                                    <Star className="w-3 h-3 fill-white" />
                                    {exp.rating.toFixed(1)}
                                </span>
                            </div>
                        </div>

                        <div className="p-4 sm:p-5 flex flex-col flex-1 gap-2">
                            <div>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-brand-primary">
                                    {exp.duration} · {exp.category}
                                </span>
                                <h3 className="text-sm sm:text-base font-bold text-brand-dark dark:text-slate-100 leading-snug">
                                    {exp.title}
                                </h3>
                                {exp.amharicTitle && (
                                    <p className="text-[11px] text-slate-500 font-ethiopic">
                                        {exp.amharicTitle}
                                    </p>
                                )}
                            </div>

                            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-3">
                                {exp.description}
                            </p>

                            <div className="flex items-center gap-1.5 text-xs text-slate-500 pt-1">
                                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <span className="truncate">{exp.location}</span>
                            </div>

                            <div className="mt-auto pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                <span className="text-[11px] text-slate-500">
                                    {exp.reviewsCount.toLocaleString()} TripAdvisor reviews
                                </span>
                                <a
                                    href={exp.tripAdvisorUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-xs font-bold text-[#00AA6C] hover:underline"
                                >
                                    <span>Reviews</span>
                                    <ExternalLink className="w-3 h-3" />
                                </a>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            {/* Local Tour Advisors Strip */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-6 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                    <div>
                        <h3 className="text-sm sm:text-base font-extrabold text-brand-dark dark:text-slate-100 flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-brand-primary" />
                            <span>Certified Ethiopian Tour Advisors & Guides</span>
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Connect with verified local trip planners and city guides for personalized tours across Ethiopia.
                        </p>
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 self-start sm:self-auto">
                        Official Tourism Ethiopia Network
                    </span>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                    {LOCAL_ADVISORS.map((advisor) => (
                        <div
                            key={advisor.id}
                            className="p-3.5 sm:p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                        >
                            <div className="space-y-1">
                                <div className="flex items-center gap-1.5">
                                    <span className="font-bold text-sm text-brand-dark dark:text-slate-100">
                                        {advisor.name}
                                    </span>
                                    <span className="inline-flex items-center text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded-full">
                                        ✓ Verified
                                    </span>
                                </div>
                                <p className="text-xs text-brand-primary font-medium">{advisor.title}</p>
                                <p className="text-[11px] text-slate-500">
                                    Specialty: {advisor.specialty} · {advisor.experienceYears}+ years exp.
                                </p>
                                <p className="text-[11px] text-slate-500">
                                    Languages: {advisor.languages.join(', ')}
                                </p>
                            </div>

                            <div className="flex sm:flex-col gap-2 shrink-0">
                                <a
                                    href={`tel:${advisor.phone}`}
                                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-brand-primary text-white hover:bg-teal-700 transition-colors shadow-xs"
                                >
                                    <Phone className="w-3 h-3" />
                                    <span>Call Guide</span>
                                </a>
                                <a
                                    href={`https://wa.me/${advisor.whatsapp}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                                >
                                    <MessageCircle className="w-3 h-3 text-emerald-600" />
                                    <span>WhatsApp</span>
                                </a>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Smart Ethiopia Travel Tips Card */}
            <Card className="p-4 sm:p-5 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border-amber-200/80 dark:border-amber-900/60">
                <h4 className="text-xs sm:text-sm font-bold text-amber-950 dark:text-amber-200 flex items-center gap-1.5 mb-2">
                    <Info className="w-4 h-4 text-amber-700 dark:text-amber-400" />
                    <span>Essential Trip Advisor Smart Tips for Visitors to Ethiopia</span>
                </h4>
                <div className="grid gap-3 sm:grid-cols-3 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                    <div className="p-2.5 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-amber-200/40">
                        <strong className="block text-brand-dark dark:text-slate-100 mb-0.5">1. Currency & Forex</strong>
                        <span>ATMs (CBE, Dashen) accept international Visa/Mastercard for ETB cash. Forex bureaus are stationed at Bole Terminal 2 arrivals.</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-amber-200/40">
                        <strong className="block text-brand-dark dark:text-slate-100 mb-0.5">2. Airport SIM Cards</strong>
                        <span>Purchase an Ethio telecom or Safaricom 4G/5G Tourist SIM card right at the Bole Airport arrivals exit hall (takes ~5 minutes).</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-amber-200/40">
                        <strong className="block text-brand-dark dark:text-slate-100 mb-0.5">3. Local City Transit</strong>
                        <span>Book hotel shuttles via BookAddis or dial RIDE (8294), FERES (6090), or Meter Taxi (6303) for rapid point-to-point dispatch.</span>
                    </div>
                </div>
            </Card>
        </section>
    );
}

