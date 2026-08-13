'use client';

import React from 'react';
import { MapPin, Users, CheckCircle, Building2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/currency';
import { useTranslations } from '@/components/providers/locale-provider';

export type ConferenceVenue = {
    id: string;
    hotel_id: string;
    hotel_name: string;
    name: string;
    location: string;
    capacity: number;
    price: number;
    currency: string;
    features: string[];
    image?: string | null;
    description?: string | null;
};

type Props = {
    venue: ConferenceVenue;
    onBook: (venue: ConferenceVenue) => void;
};

export function VenueCard({ venue, onBook }: Props) {
    const { t } = useTranslations();

    return (
        <Card className="overflow-hidden border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col h-full">
            <div className="relative aspect-[16/10] bg-slate-100">
                {venue.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={venue.image}
                        alt={venue.name}
                        className="absolute inset-0 w-full h-full object-cover"
                    />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-slate-400">
                        <Building2 className="w-10 h-10" />
                    </div>
                )}
            </div>
            <div className="p-5 flex flex-col flex-1 gap-3">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        {venue.hotel_name}
                    </p>
                    <h3 className="text-lg font-extrabold text-brand-dark mt-0.5">
                        {venue.name}
                    </h3>
                    <p className="text-sm text-slate-600 flex items-center gap-1.5 mt-1">
                        <MapPin className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{venue.location}</span>
                    </p>
                </div>
                <p className="text-sm text-slate-700 inline-flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-brand-primary" />
                    {t('conferences.venueCapacity', { count: venue.capacity })}
                </p>
                {venue.features.length > 0 ? (
                    <ul className="space-y-1">
                        {venue.features.slice(0, 4).map((f) => (
                            <li
                                key={f}
                                className="text-xs text-slate-600 flex items-start gap-1.5"
                            >
                                <CheckCircle className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                                {f}
                            </li>
                        ))}
                    </ul>
                ) : null}
                <div className="mt-auto pt-2 flex items-end justify-between gap-3">
                    <div>
                        <p className="text-[11px] font-semibold uppercase text-slate-500">
                            {t('conferences.startingFrom')}
                        </p>
                        <p className="text-lg font-extrabold text-brand-dark">
                            {formatCurrency(venue.price, venue.currency)}
                        </p>
                    </div>
                    <Button
                        type="button"
                        className="rounded-xl font-bold"
                        onClick={() => onBook(venue)}
                    >
                        {t('conferences.bookVenue')}
                    </Button>
                </div>
            </div>
        </Card>
    );
}
