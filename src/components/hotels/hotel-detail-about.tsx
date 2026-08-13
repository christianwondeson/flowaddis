'use client';

import React from 'react';
import { Check, Info } from 'lucide-react';
import { useTranslations } from '@/components/providers/locale-provider';

interface HotelDetailAboutProps {
    hotel: any;
    facilities?: any[];
    loading?: boolean;
    /** When false, only description + check-in (no facilities list). */
    showFacilities?: boolean;
}

/**
 * Single source for property description + facilities.
 * Check-in/out shown once here; child policy lives in #policies.
 */
export const HotelDetailAbout: React.FC<HotelDetailAboutProps> = ({
    hotel,
    facilities = [],
    loading = false,
    showFacilities = true,
}) => {
    const { t } = useTranslations();

    return (
        <div className="space-y-8">
            {(hotel?.checkin || hotel?.checkout) && (
                <div className="grid grid-cols-2 gap-3 rounded-2xl border border-border bg-muted/40 px-4 py-4">
                    <div>
                        <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                            {t('hotelDetail.checkIn')}
                        </p>
                        <p className="text-base font-extrabold text-foreground mt-0.5">
                            {hotel.checkin || t('hotelDetail.defaultCheckIn')}
                        </p>
                    </div>
                    <div>
                        <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                            {t('hotelDetail.checkOut')}
                        </p>
                        <p className="text-base font-extrabold text-foreground mt-0.5">
                            {hotel.checkout || t('hotelDetail.defaultCheckOut')}
                        </p>
                    </div>
                </div>
            )}

            <div className="space-y-4">
                <h3 className="text-lg font-bold text-foreground pt-1">
                    {t('hotelDetail.about.aboutTitle')}
                </h3>
                {hotel?.description ? (
                    <div className="space-y-2 text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                        {hotel.description}
                    </div>
                ) : (
                    <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
                        <p>
                            {t('hotelDetail.about.fallbackP1', {
                                name: hotel.name ?? '',
                                location: hotel.location ?? '',
                            })}
                        </p>
                        <p>{t('hotelDetail.about.fallbackP2')}</p>
                    </div>
                )}
            </div>

            {showFacilities ? (
                <div id="facilities" className="pt-2 scroll-mt-28">
                    <h3 className="text-base font-bold text-foreground mb-6">
                        {t('hotelDetail.about.facilitiesTitle')}
                    </h3>

                    {loading ? (
                        <div className="flex items-center gap-2 text-brand-primary animate-pulse">
                            <Info className="w-4 h-4" />
                            <span className="text-sm">
                                {t('hotelDetail.about.loadingFacilities')}
                            </span>
                        </div>
                    ) : facilities.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {facilities.map((group: any, idx: number) => (
                                <div
                                    key={group.facility_type_name || idx}
                                    className="space-y-3"
                                >
                                    <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 bg-brand-primary rounded-full" />
                                        {group.facility_type_name}
                                    </h4>
                                    <div className="space-y-2 pl-3.5">
                                        {(group.facilities || []).map(
                                            (facility: any, fIdx: number) => (
                                                <div
                                                    key={`${facility.facility_name}-${fIdx}`}
                                                    className="flex items-center gap-2 text-xs text-muted-foreground"
                                                >
                                                    <Check className="w-3.5 h-3.5 text-brand-primary/60 shrink-0" />
                                                    <span>
                                                        {facility.facility_name}
                                                    </span>
                                                </div>
                                            ),
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : Array.isArray(hotel?.amenities) &&
                      hotel.amenities.length > 0 ? (
                        <div className="flex flex-wrap gap-x-6 gap-y-3">
                            {hotel.amenities.map((label: string) => (
                                <div
                                    key={label}
                                    className="flex items-center gap-2 text-xs font-medium text-foreground"
                                >
                                    <Check className="w-4 h-4 text-brand-primary" />
                                    <span>{label}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground">
                            Facilities will appear here once the hotel admin adds
                            them.
                        </p>
                    )}
                </div>
            ) : null}
        </div>
    );
};
