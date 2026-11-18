'use client';

import React, { useState } from 'react';
import {
    Phone,
    ExternalLink,
    Smartphone,
    Clock,
    ShieldCheck,
    Car,
    Navigation,
    Info,
    CheckCircle2,
    Sparkles,
} from 'lucide-react';
import { RideLogo, FeresLogo, YangoLogo, MeterTaxiLogo } from './ride-partner-logos';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export type RidePartner = {
    id: 'ride' | 'feres' | 'yango' | 'meter_taxi';
    name: string;
    amharicName: string;
    tagline: string;
    description: string;
    phone?: string;
    displayPhone?: string;
    appStoreUrl?: string;
    playStoreUrl?: string;
    webUrl: string;
    averageEta: string;
    airportFareRange: string;
    popularPickups: string;
    features: string[];
    accentColor: string;
    badgeBg: string;
    badgeText: string;
};

export const RIDE_PARTNERS: RidePartner[] = [
    {
        id: 'ride',
        name: 'RIDE Ethiopia',
        amharicName: 'ራይድ ኢትዮጵያ',
        tagline: 'Ethiopia’s pioneer ride-hailing & dispatch network',
        description:
            'Addis Ababa’s most recognized dispatch service. Call 8294 from any Ethiopian mobile or book through the RIDE Passenger app for instant pickups.',
        phone: 'tel:8294',
        displayPhone: '8294',
        appStoreUrl: 'https://apps.apple.com/app/ride-passenger-et/id1455243305',
        playStoreUrl: 'https://play.google.com/store/apps/details?id=com.multichoice.ridepassenger',
        webUrl: 'https://ride8294.com',
        averageEta: '3–6 mins',
        airportFareRange: '400 – 800 ETB',
        popularPickups: 'Bole Terminal 1 & 2, Kazanchis, Piazza',
        features: [
            'Direct dial hotline 8294',
            'Sedan, Van & VIP classes',
            'Pay via Telebirr, CBE Birr or Cash',
            'Stationed 24/7 at Bole Airport',
        ],
        accentColor: 'border-amber-400 bg-amber-50/40 dark:bg-amber-950/20',
        badgeBg: 'bg-[#FFC80A]',
        badgeText: 'text-[#006837]',
    },
    {
        id: 'feres',
        name: 'FERES (ፈረስ)',
        amharicName: 'ፈረስ ታክሲ',
        tagline: 'Fastest city rides & Feres Miles loyalty rewards',
        description:
            'A fleet of tens of thousands of certified drivers across Addis Ababa. Dial 6090 or use the Feres app with built-in cashback on every kilometer.',
        phone: 'tel:6090',
        displayPhone: '6090',
        appStoreUrl: 'https://apps.apple.com/app/feres-user/id1524376872',
        playStoreUrl: 'https://play.google.com/store/apps/details?id=com.feres.user',
        webUrl: 'https://feres.co',
        averageEta: '2–5 mins',
        airportFareRange: '380 – 750 ETB',
        popularPickups: 'Bole Airport, Sarbet, Bole Medhanialem',
        features: [
            'Toll-free / dispatch line 6090',
            'Feres Miles cashback rewards',
            'Instant in-app driver tracking',
            'Available 24/7 in all 11 sub-cities',
        ],
        accentColor: 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20',
        badgeBg: 'bg-[#00A859]',
        badgeText: 'text-white',
    },
    {
        id: 'yango',
        name: 'Yango Ethiopia',
        amharicName: 'ያንጎ ኢትዮጵያ',
        tagline: 'Live GPS navigation, upfront fixed pricing',
        description:
            'Global mobility tech tailored for Addis Ababa. Book via the Yango app to see your exact price upfront before you ride, with live route updates.',
        appStoreUrl: 'https://apps.apple.com/app/yango-taxi-ride-delivery/id1437157286',
        playStoreUrl: 'https://play.google.com/store/apps/details?id=com.yandex.yango',
        webUrl: 'https://yango.com/en_et/',
        averageEta: '3–7 mins',
        airportFareRange: '420 – 850 ETB',
        popularPickups: 'Bole Terminal 2, Bole Atlas, CMC',
        features: [
            'Upfront guaranteed price',
            'Economy & Comfort options',
            'Live GPS route sharing',
            'Multiple payment options',
        ],
        accentColor: 'border-rose-400 bg-rose-50/40 dark:bg-rose-950/20',
        badgeBg: 'bg-[#EB1537]',
        badgeText: 'text-white',
    },
    {
        id: 'meter_taxi',
        name: 'Addis Meter Taxi',
        amharicName: 'የአዲስ አበባ ሜትር ታክሲ',
        tagline: 'Official city-certified metered taxis & airport cabs',
        description:
            'The official yellow and green meter taxi fleet operated under the Addis Ababa Transport Bureau regulations. Regulated rates per kilometer and minute.',
        phone: 'tel:6303',
        displayPhone: '6303',
        webUrl: 'tel:6303',
        averageEta: '5–10 mins',
        airportFareRange: '350 – 700 ETB',
        popularPickups: 'Bole Airport Taxi Terminal, Meskel Square, Piazza',
        features: [
            'Official metered fares',
            'Stationed at Bole Arrival exits',
            'Traditional yellow top identification',
            'Cash & Telebirr accepted',
        ],
        accentColor: 'border-sky-400 bg-sky-50/40 dark:bg-sky-950/20',
        badgeBg: 'bg-[#FFCC00]',
        badgeText: 'text-[#003366]',
    },
];

const AIRPORT_ESTIMATES = [
    { destination: 'Bole Medhanialem / Atlas', distance: '3.5 km', duration: '10–15 min', estEtb: '350 – 500 ETB' },
    { destination: 'Kazanchis / ECA / UN Hub', distance: '6.5 km', duration: '15–22 min', estEtb: '450 – 650 ETB' },
    { destination: 'Sarbet / Old Airport / AU', distance: '8.2 km', duration: '18–28 min', estEtb: '500 – 720 ETB' },
    { destination: 'Piazza / Churchill / 4 Kilo', distance: '10.5 km', duration: '25–35 min', estEtb: '550 – 780 ETB' },
    { destination: 'Bishoftu (Resorts & Crater Lakes)', distance: '45 km', duration: '45–60 min', estEtb: '2,400 – 3,500 ETB' },
];

export function RidePartnersSection({
    className,
}: {
    className?: string;
}) {
    const [activeTab, setActiveTab] = useState<'cards' | 'estimator' | 'airportGuide'>('cards');

    return (
        <section className={cn('space-y-4 sm:space-y-6', className)}>
            {/* Header & Subtitle */}
            <div className="flex flex-col gap-3">
                <div className="space-y-1">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand-primary/10 text-brand-primary text-[11px] sm:text-xs font-bold uppercase tracking-wider">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Instant Transit Network</span>
                    </div>
                    <h2 className="text-lg sm:text-2xl font-black text-brand-dark dark:text-slate-100 tracking-tight">
                        Meter Taxi & On-Demand Ride Partners
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-2xl">
                        Need an immediate ride right now? Connect with Addis Ababa’s trusted transport networks: <strong>RIDE</strong>, <strong>FERES</strong>, <strong>Yango</strong>, and certified <strong>Meter Taxis</strong>.
                    </p>
                </div>

                {/* Responsive Navigation Pill Switcher */}
                <div className="w-full sm:w-auto self-start grid grid-cols-3 p-1 rounded-xl bg-slate-200/80 dark:bg-slate-800 text-xs font-semibold">
                    <button
                        type="button"
                        onClick={() => setActiveTab('cards')}
                        className={cn(
                            'py-2 px-1 text-center rounded-lg transition-all truncate',
                            activeTab === 'cards'
                                ? 'bg-white dark:bg-slate-900 text-brand-dark dark:text-slate-100 shadow-xs font-bold'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900',
                        )}
                    >
                        Taxi Options
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('estimator')}
                        className={cn(
                            'py-2 px-1 text-center rounded-lg transition-all truncate',
                            activeTab === 'estimator'
                                ? 'bg-white dark:bg-slate-900 text-brand-dark dark:text-slate-100 shadow-xs font-bold'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900',
                        )}
                    >
                        Fare Guide
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('airportGuide')}
                        className={cn(
                            'py-2 px-1 text-center rounded-lg transition-all truncate',
                            activeTab === 'airportGuide'
                                ? 'bg-white dark:bg-slate-900 text-brand-dark dark:text-slate-100 shadow-xs font-bold'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900',
                        )}
                    >
                        Bole Pickup Tips
                    </button>
                </div>
            </div>

            {/* TAB 1: RIDE, FERES, YANGO & METER TAXI CARDS */}
            {activeTab === 'cards' && (
                <div className="grid gap-4 sm:gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                    {RIDE_PARTNERS.map((partner) => (
                        <Card
                            key={partner.id}
                            className={cn(
                                'relative overflow-hidden rounded-2xl border transition-all duration-200 hover:shadow-md flex flex-col p-4 sm:p-5 bg-white dark:bg-slate-900',
                                partner.accentColor,
                            )}
                        >
                            {/* Brand Header */}
                            <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                                <div>
                                    {partner.id === 'ride' && <RideLogo className="h-8 sm:h-9 w-auto" />}
                                    {partner.id === 'feres' && <FeresLogo className="h-8 sm:h-9 w-auto" />}
                                    {partner.id === 'yango' && <YangoLogo className="h-8 sm:h-9 w-auto" />}
                                    {partner.id === 'meter_taxi' && <MeterTaxiLogo className="h-8 sm:h-9 w-auto" />}
                                </div>
                                <div className="text-right shrink-0">
                                    <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200/60">
                                        <Clock className="w-2.5 h-2.5" /> {partner.averageEta}
                                    </span>
                                    <p className="text-[9px] text-slate-500 mt-0.5">Average ETA</p>
                                </div>
                            </div>

                            {/* Tagline & Description */}
                            <div className="pt-2.5 pb-2 flex-1 space-y-1.5">
                                <div className="flex items-baseline justify-between gap-1">
                                    <h3 className="font-extrabold text-sm sm:text-base text-brand-dark dark:text-slate-100 truncate">
                                        {partner.name}
                                    </h3>
                                    <span className="text-[10px] font-medium text-slate-500 font-ethiopic shrink-0">
                                        {partner.amharicName}
                                    </span>
                                </div>
                                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-3 sm:line-clamp-none">
                                    {partner.description}
                                </p>

                                {/* Features Pill List */}
                                <div className="space-y-1 pt-1.5">
                                    {partner.features.slice(0, 3).map((feat, idx) => (
                                        <div
                                            key={idx}
                                            className="flex items-center gap-1.5 text-[11px] sm:text-xs text-slate-700 dark:text-slate-200"
                                        >
                                            <CheckCircle2 className="w-3.5 h-3.5 text-brand-primary shrink-0" />
                                            <span className="truncate">{feat}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Airport Fare Estimate Pill */}
                            <div className="my-2 p-2 rounded-xl bg-slate-100/90 dark:bg-slate-800/80 flex items-center justify-between text-[11px] sm:text-xs">
                                <span className="text-slate-500 font-medium">Bole Airport:</span>
                                <span className="font-extrabold text-brand-dark dark:text-slate-100">
                                    {partner.airportFareRange}
                                </span>
                            </div>

                            {/* Responsive Action Buttons (touch friendly, 44px+ on mobile) */}
                            <div className="pt-2 flex flex-col gap-1.5">
                                {partner.phone ? (
                                    <a
                                        href={partner.phone}
                                        className="w-full inline-flex items-center justify-center gap-1.5 min-h-[42px] px-3 py-2 rounded-xl font-bold text-xs sm:text-sm bg-brand-primary hover:bg-teal-700 text-white shadow-xs transition-all active:scale-98"
                                    >
                                        <Phone className="w-3.5 h-3.5 shrink-0" />
                                        <span>Call {partner.displayPhone}</span>
                                    </a>
                                ) : (
                                    <a
                                        href={partner.webUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-full inline-flex items-center justify-center gap-1.5 min-h-[42px] px-3 py-2 rounded-xl font-bold text-xs sm:text-sm bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition-all active:scale-98"
                                    >
                                        <Smartphone className="w-3.5 h-3.5 shrink-0" />
                                        <span>Open Yango App</span>
                                    </a>
                                )}

                                <a
                                    href={partner.webUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full inline-flex items-center justify-center gap-1 py-1.5 text-[11px] font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
                                >
                                    <span>Official Details & App</span>
                                    <ExternalLink className="w-2.5 h-2.5" />
                                </a>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {/* TAB 2: AIRPORT FARE ESTIMATOR (Mobile card view + Desktop table) */}
            {activeTab === 'estimator' && (
                <Card className="p-4 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                        <div>
                            <h3 className="text-sm sm:text-base font-bold text-brand-dark dark:text-slate-100 flex items-center gap-1.5">
                                <Car className="w-4 h-4 text-brand-primary" />
                                <span>Bole Airport (ADD) ⇄ City Fare Guide</span>
                            </h3>
                            <p className="text-xs text-slate-500 mt-0.5">
                                Regulated & app-estimated rates across Addis Ababa. Actual fare may vary with traffic.
                            </p>
                        </div>
                        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
                            <RideLogo className="h-6 w-auto shrink-0" />
                            <FeresLogo className="h-6 w-auto shrink-0" />
                            <YangoLogo className="h-6 w-auto shrink-0" />
                            <MeterTaxiLogo className="h-6 w-auto shrink-0" />
                        </div>
                    </div>

                    {/* Mobile Card Rows */}
                    <div className="sm:hidden space-y-2.5">
                        {AIRPORT_ESTIMATES.map((route, i) => (
                            <div
                                key={i}
                                className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs"
                            >
                                <div className="space-y-0.5">
                                    <span className="font-bold text-brand-dark dark:text-slate-100 block">
                                        {route.destination}
                                    </span>
                                    <span className="text-[11px] text-slate-500">
                                        {route.distance} · {route.duration}
                                    </span>
                                </div>
                                <span className="font-extrabold text-brand-primary text-sm shrink-0">
                                    {route.estEtb}
                                </span>
                            </div>
                        ))}
                    </div>

                    {/* Desktop Table View */}
                    <div className="hidden sm:block overflow-x-auto">
                        <table className="w-full text-left text-xs sm:text-sm">
                            <thead>
                                <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-500 font-semibold uppercase text-[11px]">
                                    <th className="pb-2.5">Destination</th>
                                    <th className="pb-2.5">Est. Distance</th>
                                    <th className="pb-2.5">Est. Drive Time</th>
                                    <th className="pb-2.5 text-right">Est. Fare Range (ETB)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {AIRPORT_ESTIMATES.map((route, i) => (
                                    <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                        <td className="py-2.5 font-bold text-brand-dark dark:text-slate-200">
                                            {route.destination}
                                        </td>
                                        <td className="py-2.5 text-slate-600 dark:text-slate-400">{route.distance}</td>
                                        <td className="py-2.5 text-slate-600 dark:text-slate-400">
                                            <span className="inline-flex items-center gap-1">
                                                <Clock className="w-3 h-3 text-slate-400" />
                                                {route.duration}
                                            </span>
                                        </td>
                                        <td className="py-2.5 text-right font-extrabold text-brand-primary">
                                            {route.estEtb}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-[11px] sm:text-xs text-slate-500">
                        <span>💡 Pre-booked hotel shuttles include personalized name board meet-and-greet at exit gate.</span>
                        <div className="flex items-center gap-2">
                            <a href="tel:8294" className="font-bold text-[#006837] hover:underline">
                                RIDE (8294)
                            </a>
                            <span>·</span>
                            <a href="tel:6090" className="font-bold text-[#00A859] hover:underline">
                                FERES (6090)
                            </a>
                            <span>·</span>
                            <a href="tel:6303" className="font-bold text-[#003366] hover:underline">
                                Meter Taxi (6303)
                            </a>
                        </div>
                    </div>
                </Card>
            )}

            {/* TAB 3: BOLE AIRPORT PICKUP TIPS */}
            {activeTab === 'airportGuide' && (
                <Card className="p-4 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 space-y-3">
                    <h3 className="text-sm sm:text-base font-bold text-brand-dark dark:text-slate-100 flex items-center gap-2">
                        <Navigation className="w-4 h-4 text-brand-primary" />
                        <span>Arriving at Bole Airport (ADD)? Here’s how to meet your ride</span>
                    </h3>

                    <div className="grid gap-3 sm:grid-cols-3 text-xs leading-relaxed">
                        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 space-y-1.5">
                            <h4 className="font-bold text-xs sm:text-sm text-brand-dark dark:text-slate-100 flex items-center gap-1.5">
                                <ShieldCheck className="w-4 h-4 text-brand-primary" />
                                <span>Hotel Fleet Shuttles</span>
                            </h4>
                            <p className="text-slate-600 dark:text-slate-300">
                                If you reserved a shuttle below, your driver waits outside the baggage claim international/domestic exit holding a sign with your name or hotel.
                            </p>
                            <span className="inline-block text-[10px] font-semibold text-brand-primary">
                                Guaranteed meet & greet included
                            </span>
                        </div>

                        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 space-y-1.5">
                            <h4 className="font-bold text-xs sm:text-sm text-brand-dark dark:text-slate-100 flex items-center gap-1.5">
                                <Car className="w-4 h-4 text-emerald-600" />
                                <span>RIDE, FERES & Meter Taxi</span>
                            </h4>
                            <p className="text-slate-600 dark:text-slate-300">
                                Dial <strong>8294</strong> (RIDE), <strong>6090</strong> (FERES), or <strong>6303</strong> (Meter Taxi) once you collect luggage. Vehicles meet at the arrival parking lanes outside Terminal 2.
                            </p>
                            <span className="inline-block text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                                Fast dispatch (typically 3–5 min)
                            </span>
                        </div>

                        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 space-y-1.5">
                            <h4 className="font-bold text-xs sm:text-sm text-brand-dark dark:text-slate-100 flex items-center gap-1.5">
                                <Smartphone className="w-4 h-4 text-rose-600" />
                                <span>Yango App Pickups</span>
                            </h4>
                            <p className="text-slate-600 dark:text-slate-300">
                                Connect to free Bole Airport Wi-Fi, open the Yango app, and select Terminal 1 or 2 as your pickup pin. Live GPS maps guide your driver straight to your exit door.
                            </p>
                            <span className="inline-block text-[10px] font-semibold text-rose-600 dark:text-rose-400">
                                Upfront price shown in app
                            </span>
                        </div>
                    </div>
                </Card>
            )}
        </section>
    );
}
