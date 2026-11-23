'use client';

import React, { Suspense, useCallback, useEffect, useState } from 'react';
import {
    MapPin,
    Users,
    Bus,
    Shield,
    Baby,
    Navigation,
    Car,
    Phone,
    Sparkles,
    Luggage,
    RotateCcw,
    CheckCircle2,
    ArrowRight,
} from 'lucide-react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { formatCurrency } from '@/lib/currency';
import { AdContainer } from '@/components/ads/ad-container';
import { SHUTTLE_ADS_LEFT, SHUTTLE_ADS_RIGHT } from '@/lib/ads/service-ads';
import { useTranslations } from '@/components/providers/locale-provider';
import { BookingModal } from '@/components/booking/booking-modal';
import { AdminLoader } from '@/components/ui/admin-loader';
import { DateField } from '@/components/ui/date-field';
import { formatDateLocal } from '@/lib/date-utils';
import { ServicePageWrapper } from '@/components/layout/service-page-wrapper';
import {
    RidePartnerBadges,
    RideLogo,
    FeresLogo,
    YangoLogo,
} from '@/components/shuttles/ride-partner-logos';
import { RidePartnersSection } from '@/components/shuttles/ride-partners-section';
import { cn } from '@/lib/utils';

type ShuttleProduct = {
    id: string;
    hotel_id: string;
    hotel_name: string;
    hotel_city?: string | null;
    hotel_location?: string | null;
    name: string;
    from: string;
    to: string;
    price: number;
    currency: string;
    vehicle_type?: string | null;
    capacity: number;
    image_url?: string | null;
    meet_and_greet?: boolean;
    child_seat?: boolean;
    gps_tracked?: boolean;
};

type ViewMode = 'all' | 'shuttles' | 'rides';

const POPULAR_DESTINATIONS = [
    { label: 'All areas', value: '' },
    { label: 'Bole Airport (ADD)', value: 'Bole International Airport' },
    { label: 'Bole Medhanialem', value: 'Bole' },
    { label: 'Kazanchis', value: 'Kazanchis' },
    { label: 'Piazza / 4 Kilo', value: 'Piazza' },
    { label: 'Sarbet / AU', value: 'Sarbet' },
    { label: 'Bishoftu', value: 'Bishoftu' },
];

function ShuttlesPageContent() {
    const { t } = useTranslations();
    const searchParams = useSearchParams();
    const router = useRouter();

    const [items, setItems] = useState<ShuttleProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const [city, setCity] = useState('');
    const [minCapacity, setMinCapacity] = useState('');
    const [pickupDate, setPickupDate] = useState(() =>
        formatDateLocal(new Date()),
    );
    const [selected, setSelected] = useState<ShuttleProduct | null>(null);
    const [viewMode, setViewMode] = useState<ViewMode>('all');

    useEffect(() => {
        const cityParam = searchParams.get('city') || searchParams.get('pickup');
        const dateParam = searchParams.get('date');
        const modeParam = searchParams.get('mode');

        if (cityParam) setCity(cityParam);
        if (dateParam) setPickupDate(dateParam);
        if (modeParam === 'rides') setViewMode('rides');
        else if (modeParam === 'shuttles') setViewMode('shuttles');
    }, [searchParams]);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const url = new URL('/api/guest/shuttles', window.location.origin);
            if (city.trim()) url.searchParams.set('city', city.trim());
            if (minCapacity.trim()) {
                url.searchParams.set('minCapacity', minCapacity.trim());
            }
            const res = await fetch(url.toString(), { cache: 'no-store' });
            const data = await res.json().catch(() => ({}));
            setItems((data.items || []) as ShuttleProduct[]);
        } catch {
            setItems([]);
        } finally {
            setLoading(false);
        }
    }, [city, minCapacity]);

    useEffect(() => {
        void load();
    }, [load]);

    const handleClearFilters = () => {
        setCity('');
        setMinCapacity('');
    };

    const hasActiveFilters = Boolean(city.trim() || minCapacity.trim());

    return (
        <ServicePageWrapper
            title={t('shuttles.heroTitle')}
            description={t('shuttles.heroSubtitle')}
            icon={Bus}
        >
            <AdContainer
                leftAds={SHUTTLE_ADS_LEFT}
                rightAds={SHUTTLE_ADS_RIGHT}
                clearFixedHeader={false}
            >
                {/* 1. TOP TRUST BADGE STRIP WITH RIDE, FERES, YANGO & METER TAXI */}
                <div className="mb-4 sm:mb-6 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 p-3.5 sm:p-5 shadow-xs">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-brand-primary/10 text-brand-primary text-xs font-bold shrink-0">
                                    ✓
                                </span>
                                <h2 className="text-xs sm:text-base font-extrabold text-brand-dark dark:text-slate-100">
                                    Addis Ababa Airport & City Ride Network
                                </h2>
                            </div>
                            <p className="text-[11px] sm:text-xs text-slate-600 dark:text-slate-300">
                                Pre-book verified <strong>Hotel Shuttles</strong> or connect with Ethiopia’s top ride-hailing networks: <strong>RIDE (8294)</strong>, <strong>FERES (6090)</strong>, and <strong>Yango</strong>.
                            </p>
                        </div>

                        {/* Partner Logo Pills (Horizontally scrollable on small mobile screens) */}
                        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 shrink-0">
                            <div className="transition-transform hover:scale-105 shrink-0" title="RIDE - Dial 8294">
                                <RideLogo className="h-7 sm:h-8 w-auto drop-shadow-xs" />
                            </div>
                            <div className="transition-transform hover:scale-105 shrink-0" title="FERES - Dial 6090">
                                <FeresLogo className="h-7 sm:h-8 w-auto drop-shadow-xs" />
                            </div>
                            <div className="transition-transform hover:scale-105 shrink-0" title="Yango - Book via App">
                                <YangoLogo className="h-6 sm:h-7 w-auto drop-shadow-xs" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. REWORKED MOBILE-FRIENDLY SEGMENTED TABS */}
                <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-slate-200 dark:border-slate-800 pb-3">
                    <div className="w-full sm:w-auto grid grid-cols-3 p-1 rounded-xl bg-slate-200/80 dark:bg-slate-800 text-xs font-semibold">
                        <button
                            type="button"
                            onClick={() => setViewMode('all')}
                            className={cn(
                                'flex items-center justify-center gap-1.5 py-2 px-2 text-center rounded-lg transition-all',
                                viewMode === 'all'
                                    ? 'bg-white dark:bg-slate-900 text-brand-dark dark:text-slate-100 shadow-xs font-bold'
                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900',
                            )}
                        >
                            <Sparkles className="w-3.5 h-3.5 text-brand-primary shrink-0" />
                            <span className="truncate">All Transit</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setViewMode('shuttles')}
                            className={cn(
                                'flex items-center justify-center gap-1.5 py-2 px-2 text-center rounded-lg transition-all',
                                viewMode === 'shuttles'
                                    ? 'bg-white dark:bg-slate-900 text-brand-dark dark:text-slate-100 shadow-xs font-bold'
                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900',
                            )}
                        >
                            <Bus className="w-3.5 h-3.5 text-brand-primary shrink-0" />
                            <span className="truncate">Hotel Fleets ({items.length})</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setViewMode('rides')}
                            className={cn(
                                'flex items-center justify-center gap-1.5 py-2 px-2 text-center rounded-lg transition-all',
                                viewMode === 'rides'
                                    ? 'bg-white dark:bg-slate-900 text-brand-dark dark:text-slate-100 shadow-xs font-bold'
                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900',
                            )}
                        >
                            <Car className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span className="truncate">Taxi & Rides</span>
                        </button>
                    </div>

                    <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500">
                        <MapPin className="w-3.5 h-3.5 text-brand-primary" />
                        <span>Bole International Airport & Addis Ababa Hub</span>
                    </div>
                </div>

                {/* 3. REWORKED SEARCH & FILTER CARD */}
                {viewMode !== 'rides' && (
                    <div className="mb-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-3.5 sm:p-5 shadow-xs space-y-3.5">
                        {/* Quick destination chips - Smooth horizontal scroll on mobile */}
                        <div className="space-y-1.5">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                                Quick Areas / Destinations:
                            </span>
                            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
                                {POPULAR_DESTINATIONS.map((d) => {
                                    const active = city.toLowerCase() === d.value.toLowerCase();
                                    return (
                                        <button
                                            key={d.label}
                                            type="button"
                                            onClick={() => setCity(d.value)}
                                            className={cn(
                                                'px-3 py-1.5 rounded-full text-xs font-medium transition-colors border shrink-0',
                                                active
                                                    ? 'bg-brand-primary text-white border-brand-primary shadow-xs'
                                                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100',
                                            )}
                                        >
                                            {d.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Input Row */}
                        <div className="grid gap-3 grid-cols-1 sm:grid-cols-3">
                            <div className="space-y-1">
                                <label className="text-[11px] font-bold uppercase tracking-wide text-slate-600 dark:text-slate-300">
                                    Pickup / Destination
                                </label>
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                                    <Input
                                        placeholder="e.g. Bole Airport, Kazanchis..."
                                        value={city}
                                        onChange={(e) => setCity(e.target.value)}
                                        className="h-10 text-xs sm:text-sm rounded-xl pl-9"
                                    />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[11px] font-bold uppercase tracking-wide text-slate-600 dark:text-slate-300">
                                    Min Passengers
                                </label>
                                <div className="relative">
                                    <Users className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                                    <Input
                                        type="number"
                                        min={1}
                                        placeholder="Passengers"
                                        value={minCapacity}
                                        onChange={(e) => setMinCapacity(e.target.value)}
                                        className="h-10 text-xs sm:text-sm rounded-xl pl-9"
                                    />
                                </div>
                            </div>
                            <DateField
                                label={t('shuttles.pickupDate')}
                                value={pickupDate}
                                onChange={setPickupDate}
                                minDate={new Date()}
                                placeholder={t('shuttles.selectDate')}
                            />
                        </div>

                        {hasActiveFilters && (
                            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                                <span className="text-slate-500 truncate">
                                    Filter: {city || 'All areas'} {minCapacity ? `· ≥ ${minCapacity} pax` : ''}
                                </span>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleClearFilters}
                                    className="h-7 text-xs text-brand-primary hover:text-teal-700"
                                >
                                    <RotateCcw className="w-3 h-3 mr-1" />
                                    {t('shuttles.clearFilters')}
                                </Button>
                            </div>
                        )}
                    </div>
                )}

                {/* 4. ON-DEMAND METER TAXI & RIDE PARTNERS */}
                {(viewMode === 'all' || viewMode === 'rides') && (
                    <div className="mb-8">
                        <RidePartnersSection />
                    </div>
                )}

                {/* 5. HOTEL FLEET SHUTTLES LIST (Reworked for Mobile) */}
                {(viewMode === 'all' || viewMode === 'shuttles') && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-base sm:text-xl font-extrabold text-brand-dark dark:text-slate-100">
                                    {t('shuttles.availableTitle')}
                                </h2>
                                <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
                                    Dedicated hotel minivans & sedans with direct airport meet & greet.
                                </p>
                            </div>
                            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 shrink-0">
                                {items.length} {items.length === 1 ? 'vehicle' : 'vehicles'}
                            </span>
                        </div>

                        {loading ? (
                            <AdminLoader label="Loading shuttles…" />
                        ) : items.length === 0 ? (
                            <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 text-center space-y-4">
                                <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                                    <Bus className="w-6 h-6" />
                                </div>
                                <div className="space-y-1">
                                    <h3 className="font-bold text-sm sm:text-base text-brand-dark dark:text-slate-100">
                                        {t('shuttles.noMatchTitle')}
                                    </h3>
                                    <p className="text-xs text-slate-600 dark:text-slate-400 max-w-md mx-auto">
                                        {t('shuttles.noMatchSubtitle')}
                                    </p>
                                </div>
                                <div className="pt-2 flex flex-wrap items-center justify-center gap-2">
                                    <a
                                        href="tel:8294"
                                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-400 hover:bg-amber-500 text-emerald-950 font-bold text-xs shadow-xs"
                                    >
                                        <Phone className="w-3.5 h-3.5" /> Call RIDE (8294)
                                    </a>
                                    <a
                                        href="tel:6090"
                                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs"
                                    >
                                        <Phone className="w-3.5 h-3.5" /> Call FERES (6090)
                                    </a>
                                    <a
                                        href="https://yango.com/en_et/"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs"
                                    >
                                        <Car className="w-3.5 h-3.5" /> Yango App
                                    </a>
                                </div>
                            </div>
                        ) : (
                            <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
                                {items.map((s) => (
                                    <Card
                                        key={`${s.hotel_id}-${s.id}`}
                                        className="overflow-hidden border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs hover:shadow-md transition-all flex flex-col group rounded-2xl"
                                    >
                                        {/* Image Box */}
                                        <div className="relative aspect-[16/10] bg-slate-100 dark:bg-slate-800 overflow-hidden">
                                            {s.image_url ? (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img
                                                    src={s.image_url}
                                                    alt={s.name}
                                                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                />
                                            ) : (
                                                <div className="absolute inset-0 flex items-center justify-center text-slate-400">
                                                    <Bus className="w-10 h-10" />
                                                </div>
                                            )}

                                            {/* Vehicle class tag */}
                                            <div className="absolute top-2.5 left-2.5">
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-black/65 backdrop-blur-md text-white text-[10px] sm:text-[11px] font-bold">
                                                    <Bus className="w-3 h-3 text-brand-primary" />
                                                    {s.vehicle_type || 'Fleet Shuttle'}
                                                </span>
                                            </div>

                                            {/* Verified fleet tag */}
                                            <div className="absolute top-2.5 right-2.5">
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[9px] sm:text-[10px] font-bold">
                                                    Verified Fleet
                                                </span>
                                            </div>
                                        </div>

                                        {/* Card Content */}
                                        <div className="p-4 sm:p-5 flex flex-col flex-1 gap-2.5">
                                            <div>
                                                <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-brand-primary truncate">
                                                    {s.hotel_name}
                                                </p>
                                                <h3 className="text-sm sm:text-base font-black text-brand-dark dark:text-slate-100 leading-snug">
                                                    {s.name}
                                                </h3>
                                            </div>

                                            {/* Route */}
                                            <div className="p-2 sm:p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 text-xs text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                                <MapPin className="w-3.5 h-3.5 text-brand-primary shrink-0" />
                                                <span className="font-semibold truncate">
                                                    {s.from}
                                                </span>
                                                <span className="text-slate-400">→</span>
                                                <span className="font-semibold truncate">
                                                    {s.to}
                                                </span>
                                            </div>

                                            {/* Capacity & Luggage */}
                                            <div className="flex flex-wrap items-center gap-2 text-[11px] sm:text-xs text-slate-600 dark:text-slate-300">
                                                <span className="inline-flex items-center gap-1 font-medium">
                                                    <Users className="w-3.5 h-3.5 text-brand-primary" />
                                                    {t('shuttles.upToPassengers', { count: s.capacity })}
                                                </span>
                                                <span>·</span>
                                                <span className="inline-flex items-center gap-1 font-medium">
                                                    <Luggage className="w-3.5 h-3.5 text-slate-400" />
                                                    Luggage friendly
                                                </span>
                                            </div>

                                            {/* Feature Badges */}
                                            <div className="flex flex-wrap gap-1 text-[10px] sm:text-[11px] text-slate-600 dark:text-slate-300 pt-0.5">
                                                {s.meet_and_greet ? (
                                                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 px-2 py-0.5 text-emerald-800 dark:text-emerald-300">
                                                        <Shield className="w-3 h-3" /> Meet & greet
                                                    </span>
                                                ) : null}
                                                {s.child_seat ? (
                                                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 dark:bg-slate-800 border px-2 py-0.5">
                                                        <Baby className="w-3 h-3" /> Child seat
                                                    </span>
                                                ) : null}
                                                {s.gps_tracked ? (
                                                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 dark:bg-slate-800 border px-2 py-0.5">
                                                        <Navigation className="w-3 h-3" /> GPS
                                                    </span>
                                                ) : null}
                                            </div>

                                            {/* Price & Book Button (Touch-friendly on mobile) */}
                                            <div className="mt-auto pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
                                                <div className="min-w-0">
                                                    <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                                        {t('shuttles.startingFrom')}
                                                    </p>
                                                    <p className="text-lg sm:text-xl font-black text-brand-dark dark:text-slate-100 truncate">
                                                        {formatCurrency(s.price, s.currency)}
                                                    </p>
                                                    <p className="text-[9px] sm:text-[10px] text-slate-500 truncate">
                                                        {t('shuttles.perTrip')} · All fees inc.
                                                    </p>
                                                </div>
                                                <Button
                                                    type="button"
                                                    className="rounded-xl font-bold min-h-[42px] px-4 bg-brand-primary hover:bg-teal-700 text-white shadow-xs shrink-0 active:scale-98"
                                                    onClick={() => setSelected(s)}
                                                >
                                                    {t('shuttles.bookNow')}
                                                </Button>
                                            </div>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                <BookingModal
                    isOpen={Boolean(selected)}
                    onClose={() => setSelected(null)}
                    serviceName={
                        selected
                            ? `${selected.hotel_name} · ${selected.name}`
                            : 'Shuttle'
                    }
                    price={selected?.price || 0}
                    currencyCode={selected?.currency || 'ETB'}
                    type="shuttle"
                    productId={selected?.id}
                    externalItemId={selected?.hotel_id || ''}
                    inventorySource="bookaddis_direct"
                    isLocal={(selected?.currency || 'ETB').toUpperCase() === 'ETB'}
                    initialCheckIn={pickupDate}
                    initialCheckOut={pickupDate}
                    preferredPaymentTiming="pay_now"
                />
            </AdContainer>
        </ServicePageWrapper>
    );
}

export default function ShuttlesPage() {
    return (
        <Suspense fallback={<AdminLoader label="Loading shuttles…" />}>
            <ShuttlesPageContent />
        </Suspense>
    );
}
