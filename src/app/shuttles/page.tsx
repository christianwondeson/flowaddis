'use client';

import React, { Suspense, useCallback, useEffect, useState } from 'react';
import {
    MapPin,
    Users,
    Bus,
    Shield,
    Baby,
    Navigation,
} from 'lucide-react';
import { useSearchParams } from 'next/navigation';
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

function ShuttlesPageContent() {
    const { t } = useTranslations();
    const searchParams = useSearchParams();
    const [items, setItems] = useState<ShuttleProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const [city, setCity] = useState('');
    const [minCapacity, setMinCapacity] = useState('');
    const [pickupDate, setPickupDate] = useState(() =>
        formatDateLocal(new Date()),
    );
    const [selected, setSelected] = useState<ShuttleProduct | null>(null);

    useEffect(() => {
        const cityParam = searchParams.get('city') || searchParams.get('pickup');
        const dateParam = searchParams.get('date');
        if (cityParam) setCity(cityParam);
        if (dateParam) setPickupDate(dateParam);
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
                <div className="mb-6 grid gap-3 sm:grid-cols-3">
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium">City</label>
                        <Input
                            placeholder="e.g. Addis"
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                            className="h-11 rounded-xl"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium">Min passengers</label>
                        <Input
                            type="number"
                            min={1}
                            placeholder="Passengers"
                            value={minCapacity}
                            onChange={(e) => setMinCapacity(e.target.value)}
                            className="h-11 rounded-xl"
                        />
                    </div>
                    <DateField
                        label={t('shuttles.pickupDate')}
                        value={pickupDate}
                        onChange={setPickupDate}
                        minDate={new Date()}
                        placeholder={t('shuttles.selectDate')}
                    />
                </div>

                <h2 className="text-lg font-extrabold text-brand-dark mb-4">
                    {t('shuttles.availableTitle')}
                </h2>

                {loading ? (
                    <AdminLoader label="Loading shuttles…" />
                ) : items.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-12 text-center">
                        <p className="text-sm text-slate-600 max-w-md mx-auto">
                            No shuttles match your filters.
                        </p>
                    </div>
                ) : (
                    <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                        {items.map((s) => (
                            <Card
                                key={`${s.hotel_id}-${s.id}`}
                                className="overflow-hidden border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col"
                            >
                                <div className="relative aspect-[16/10] bg-slate-100">
                                    {s.image_url ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                            src={s.image_url}
                                            alt={s.name}
                                            className="absolute inset-0 w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="absolute inset-0 flex items-center justify-center text-slate-400">
                                            <Bus className="w-10 h-10" />
                                        </div>
                                    )}
                                </div>
                                <div className="p-5 flex flex-col flex-1 gap-2">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        {s.hotel_name}
                                    </p>
                                    <h3 className="text-lg font-extrabold text-brand-dark">
                                        {s.name}
                                    </h3>
                                    <p className="text-sm text-slate-600 flex items-start gap-1.5">
                                        <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                                        <span>
                                            {s.from} → {s.to}
                                        </span>
                                    </p>
                                    <p className="text-sm text-slate-700 inline-flex items-center gap-1.5">
                                        <Users className="w-4 h-4 text-brand-primary" />
                                        {t('shuttles.upToPassengers', {
                                            count: s.capacity,
                                        })}
                                        {s.vehicle_type ? ` · ${s.vehicle_type}` : ''}
                                    </p>
                                    <div className="flex flex-wrap gap-2 text-[11px] text-slate-600">
                                        {s.meet_and_greet ? (
                                            <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 border px-2 py-0.5">
                                                <Shield className="w-3 h-3" /> Meet &
                                                greet
                                            </span>
                                        ) : null}
                                        {s.child_seat ? (
                                            <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 border px-2 py-0.5">
                                                <Baby className="w-3 h-3" /> Child seat
                                            </span>
                                        ) : null}
                                        {s.gps_tracked ? (
                                            <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 border px-2 py-0.5">
                                                <Navigation className="w-3 h-3" /> GPS
                                            </span>
                                        ) : null}
                                    </div>
                                    <div className="mt-auto pt-3 flex items-end justify-between gap-3">
                                        <div>
                                            <p className="text-[11px] font-semibold uppercase text-slate-500">
                                                {t('shuttles.startingFrom')}
                                            </p>
                                            <p className="text-lg font-extrabold text-brand-dark">
                                                {formatCurrency(s.price, s.currency)}
                                            </p>
                                            <p className="text-[11px] text-slate-500">
                                                {t('shuttles.perTrip')}
                                            </p>
                                        </div>
                                        <Button
                                            type="button"
                                            className="rounded-xl font-bold"
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

                <BookingModal
                    isOpen={Boolean(selected)}
                    onClose={() => setSelected(null)}
                    serviceName={
                        selected
                            ? `${selected.hotel_name} · ${selected.name}`
                            : 'Shuttle'
                    }
                    price={selected?.price || 0}
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
