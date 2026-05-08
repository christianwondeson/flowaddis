"use client";

import React from 'react';
import { Home, Maximize, Wind, ParkingCircle, Wifi, Waves, Users, Languages, Ban, Check, Info } from 'lucide-react';
import { useTranslations } from '@/components/providers/locale-provider';

interface HotelDetailAboutProps {
    hotel: any;
    facilities?: any[];
    loading?: boolean;
}

export const HotelDetailAbout: React.FC<HotelDetailAboutProps> = ({ hotel, facilities = [], loading = false }) => {
    const { t } = useTranslations();

    const highlights = [
        { icon: <Home className="w-5 h-5" />, label: t('hotelDetail.about.entirePlace') },
        { icon: <Maximize className="w-5 h-5" />, label: t('hotelDetail.about.spaciousRooms') },
        { icon: <Wind className="w-5 h-5" />, label: t('hotelDetail.about.airConditioning') },
        { icon: <ParkingCircle className="w-5 h-5" />, label: t('hotelDetail.about.freeParkingShort') },
        { icon: <Wifi className="w-5 h-5" />, label: t('hotelDetail.about.freeWifi') },
        { icon: <Waves className="w-5 h-5" />, label: t('hotelDetail.about.swimmingPool') },
        { icon: <Users className="w-5 h-5" />, label: t('hotelDetail.about.familyRooms') },
        { icon: <Languages className="w-5 h-5" />, label: t('hotelDetail.about.multilingualStaff') },
        { icon: <Check className="w-5 h-5" />, label: t('hotelDetail.about.privateBathroom') },
        { icon: <Ban className="w-5 h-5" />, label: t('hotelDetail.about.nonSmokingRooms') },
    ];

    const amenitiesFromHotel: string[] = Array.isArray(hotel?.amenities) ? hotel.amenities : [];
    const fallbackAmenityLabels = [
        t('hotelDetail.about.freeWifi'),
        t('hotelDetail.about.freeParkingShort'),
        t('hotelDetail.about.familyRooms'),
        t('hotelDetail.about.airConditioning'),
    ];

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {highlights.map((item, idx) => (
                    <div
                        key={idx}
                        className="flex flex-col items-center justify-center p-4 border border-border rounded-xl text-center gap-2 hover:bg-muted/50 dark:hover:bg-slate-800/50 hover:border-brand-primary/20 hover:shadow-sm transition-all duration-300"
                    >
                        <div className="text-brand-primary">{item.icon}</div>
                        <span className="text-[10px] font-bold text-foreground">{item.label}</span>
                    </div>
                ))}
            </div>

            <div className="space-y-4">
                <h3 className="text-lg font-bold text-foreground pt-1">{t('hotelDetail.about.aboutTitle')}</h3>
                {hotel?.description ? (
                    <div className="space-y-2 text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{hotel.description}</div>
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

            <div className="pt-6 border-t border-border">
                <h3 className="text-base font-bold text-foreground mb-6">{t('hotelDetail.about.facilitiesTitle')}</h3>

                {loading ? (
                    <div className="flex items-center gap-2 text-brand-primary animate-pulse">
                        <Info className="w-4 h-4" />
                        <span className="text-sm">{t('hotelDetail.about.loadingFacilities')}</span>
                    </div>
                ) : facilities.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {facilities.slice(0, 6).map((group: any, idx: number) => (
                            <div key={idx} className="space-y-3">
                                <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 bg-brand-primary rounded-full" />
                                    {group.facility_type_name}
                                </h4>
                                <div className="space-y-2 pl-3.5">
                                    {group.facilities.slice(0, 5).map((facility: any, fIdx: number) => (
                                        <div key={fIdx} className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <Check className="w-3.5 h-3.5 text-brand-primary/60" />
                                            <span>{facility.facility_name}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-wrap gap-x-6 gap-y-3">
                        {(amenitiesFromHotel.length > 0 ? amenitiesFromHotel.slice(0, 12) : fallbackAmenityLabels).map((label: string, idx: number) => (
                            <div key={idx} className="flex items-center gap-2 text-xs font-medium text-foreground">
                                <Check className="w-4 h-4 text-brand-primary" />
                                <span>{label}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
