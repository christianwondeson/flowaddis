'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Briefcase } from 'lucide-react';
import { ServicePageWrapper } from '@/components/layout/service-page-wrapper';
import {
    VenueCard,
    type ConferenceVenue,
} from '@/components/conferences/venue-card';
import { AdContainer } from '@/components/ads/ad-container';
import {
    CONFERENCE_ADS_LEFT,
    CONFERENCE_ADS_RIGHT,
} from '@/lib/ads/service-ads';
import { useTranslations } from '@/components/providers/locale-provider';
import { BookingModal } from '@/components/booking/booking-modal';
import { AdminLoader } from '@/components/ui/admin-loader';
import { Input } from '@/components/ui/input';
import { DateField } from '@/components/ui/date-field';
import { formatDateLocal } from '@/lib/date-utils';

type ApiItem = {
    id: string;
    hotel_id: string;
    hotel_name: string;
    hotel_city?: string | null;
    hotel_location?: string | null;
    name: string;
    capacity: number;
    price: number;
    currency: string;
    image_url?: string | null;
    features?: string[];
    description?: string | null;
};

export default function ConferencesPage() {
    const { t } = useTranslations();
    const [items, setItems] = useState<ConferenceVenue[]>([]);
    const [loading, setLoading] = useState(true);
    const [city, setCity] = useState('');
    const [minCapacity, setMinCapacity] = useState('');
    const [booking, setBooking] = useState<ConferenceVenue | null>(null);
    const [eventDate, setEventDate] = useState(() => formatDateLocal(new Date()));

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const url = new URL('/api/guest/conferences', window.location.origin);
            if (city.trim()) url.searchParams.set('city', city.trim());
            if (minCapacity.trim()) {
                url.searchParams.set('minCapacity', minCapacity.trim());
            }
            const res = await fetch(url.toString(), { cache: 'no-store' });
            const data = await res.json().catch(() => ({}));
            const rows = (data.items || []) as ApiItem[];
            setItems(
                rows.map((r) => ({
                    id: r.id,
                    hotel_id: r.hotel_id,
                    hotel_name: r.hotel_name,
                    name: r.name,
                    location: r.hotel_location || r.hotel_city || 'Addis Ababa',
                    capacity: r.capacity,
                    price: r.price,
                    currency: r.currency || 'ETB',
                    features: Array.isArray(r.features) ? r.features : [],
                    image: r.image_url,
                    description: r.description,
                })),
            );
        } catch {
            setItems([]);
        } finally {
            setLoading(false);
        }
    }, [city, minCapacity]);

    useEffect(() => {
        void load();
    }, [load]);

    const tomorrow = useMemo(() => {
        const d = new Date();
        d.setDate(d.getDate() + 1);
        return formatDateLocal(d);
    }, []);

    return (
        <ServicePageWrapper
            title={t('conferences.title')}
            description={t('conferences.description')}
            icon={Briefcase}
        >
            <AdContainer
                leftAds={CONFERENCE_ADS_LEFT}
                rightAds={CONFERENCE_ADS_RIGHT}
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
                        <label className="text-sm font-medium">Min capacity</label>
                        <Input
                            type="number"
                            min={1}
                            placeholder="Guests"
                            value={minCapacity}
                            onChange={(e) => setMinCapacity(e.target.value)}
                            className="h-11 rounded-xl"
                        />
                    </div>
                    <DateField
                        label="Event date"
                        value={eventDate}
                        onChange={setEventDate}
                        minDate={new Date()}
                    />
                </div>

                {loading ? (
                    <AdminLoader label="Loading conference halls…" />
                ) : items.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-12 text-center">
                        <p className="text-sm text-slate-600 max-w-md mx-auto">
                            No conference halls match your filters.
                        </p>
                    </div>
                ) : (
                    <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                        {items.map((venue) => (
                            <VenueCard
                                key={`${venue.hotel_id}-${venue.id}`}
                                venue={venue}
                                onBook={setBooking}
                            />
                        ))}
                    </div>
                )}

                <BookingModal
                    isOpen={Boolean(booking)}
                    onClose={() => setBooking(null)}
                    serviceName={
                        booking
                            ? `${booking.hotel_name} · ${booking.name}`
                            : 'Conference'
                    }
                    price={booking?.price || 0}
                    type="conference"
                    productId={booking?.id}
                    externalItemId={booking?.hotel_id || ''}
                    inventorySource="bookaddis_direct"
                    isLocal={(booking?.currency || 'ETB').toUpperCase() === 'ETB'}
                    initialCheckIn={eventDate || tomorrow}
                    initialCheckOut={eventDate || tomorrow}
                    preferredPaymentTiming="pay_now"
                />
            </AdContainer>
        </ServicePageWrapper>
    );
}
