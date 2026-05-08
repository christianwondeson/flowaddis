"use client";

import React from 'react';
import { Info, MapPin, Maximize, ParkingCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useTranslations } from '@/components/providers/locale-provider';

interface HotelDetailSidebarProps {
    hotel: any;
    reviews?: any[];
    loading?: boolean;
    onBook?: (price?: number, name?: string, id?: string) => void;
    detailMapHref: string;
}

export const HotelDetailSidebar: React.FC<HotelDetailSidebarProps> = ({ hotel, reviews = [], loading = false, onBook, detailMapHref }) => {
    const router = useRouter();
    const { t } = useTranslations();

    const ratingWord =
        hotel.rating >= 4
            ? t('hotelDetail.sidebar.exceptional')
            : hotel.rating >= 3.5
              ? t('hotelDetail.sidebar.excellent')
              : t('hotelDetail.sidebar.good');

    return (
        <div className="space-y-4">
            {/* Review Score Card */}
            <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
                {loading ? (
                    <div className="animate-pulse space-y-4">
                        <div className="flex justify-between items-center">
                            <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-24"></div>
                            <div className="h-10 w-10 bg-gray-200 dark:bg-slate-700 rounded-t-xl rounded-br-xl"></div>
                        </div>
                        <div className="h-12 bg-gray-100 dark:bg-slate-800 rounded w-full"></div>
                    </div>
                ) : reviews.length > 0 ? (
                    <>
                        <div className="flex items-center justify-between mb-4">
                            <div className="text-right">
                                <div className="font-bold text-foreground">
                                    {ratingWord}
                                </div>
                                <div className="text-[10px] text-muted-foreground">
                                    {t('hotelDetail.sidebar.reviewsShort', { count: hotel.reviews })}
                                </div>
                            </div>
                            <div className="w-10 h-10 bg-brand-primary text-white rounded-t-xl rounded-br-xl flex items-center justify-center font-bold text-lg shadow-sm shadow-brand-primary/20">
                                {Number(hotel.rating).toFixed(1)}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="text-[11px] text-muted-foreground italic leading-relaxed border-l-2 border-brand-primary/20 pl-3 line-clamp-3">
                                "{reviews[0].pros || reviews[0].title || t('hotelDetail.sidebar.noComment')}"
                            </div>

                            <div className="flex items-center gap-2">
                                {reviews[0].author?.avatar ? (
                                    <img src={reviews[0].author.avatar} alt={reviews[0].author.name} className="w-6 h-6 rounded-full object-cover" />
                                ) : (
                                    <div className="w-6 h-6 bg-brand-primary/10 text-brand-primary rounded-full flex items-center justify-center text-[10px] font-bold">
                                        {reviews[0].author?.name?.charAt(0) || 'G'}
                                    </div>
                                )}
                                <div className="text-[10px]">
                                    <span className="font-bold text-foreground">{reviews[0].author?.name || t('hotelDetail.sidebar.guest')}</span>
                                    <span className="text-muted-foreground ml-1">
                                        {reviews[0].author?.countrycode?.toUpperCase()}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="text-center py-4">
                        <div className="text-sm font-bold text-foreground mb-1">{t('hotelDetail.sidebar.noReviewsYet')}</div>
                        <div className="text-[10px] text-muted-foreground">{t('hotelDetail.sidebar.beFirstToReview')}</div>
                    </div>
                )}

                <div className="mt-6 pt-4 border-t border-border flex items-center justify-between">
                    <span className="text-xs font-bold text-foreground">{t('hotelDetail.sidebar.staff')}</span>
                    <span className="text-xs font-bold text-brand-primary border border-brand-primary/10 bg-brand-primary/5 px-1.5 py-0.5 rounded-md">9.0</span>
                </div>
            </div>

            {/* Map Card */}
            <div className="relative h-48 rounded-xl overflow-hidden border border-border group cursor-pointer shadow-sm">
                <img
                    src="https://images.unsplash.com/photo-1526772662000-3f88f10405ff?auto=format&fit=crop&w=800&q=80"
                    alt={t('hotelDetail.sidebar.mapAlt')}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
                    <Button
                        onClick={() => {
                            router.push(detailMapHref);
                        }}
                        className="bg-brand-primary hover:bg-brand-primary/90 text-white font-bold text-xs px-4 py-2 rounded-full shadow-lg shadow-brand-primary/20 transition-all hover:scale-105 active:scale-95"
                    >
                        {t('hotelDetail.sidebar.showOnMap')}
                    </Button>
                </div>
                <div className="absolute bottom-2 right-2 bg-white/90 dark:bg-slate-900/90 px-1.5 py-0.5 rounded-md text-[8px] text-gray-400 dark:text-slate-400">
                    {t('hotelDetail.sidebar.mapAttribution')}
                </div>
            </div>

            {/* Property Highlights */}
            <div className="bg-brand-primary/5 dark:bg-brand-primary/10 border border-brand-primary/10 dark:border-brand-primary/20 rounded-xl p-4 space-y-4">
                <h4 className="font-bold text-foreground text-sm">{t('hotelDetail.sidebar.propertyHighlights')}</h4>
                <div className="space-y-3">
                    <div className="flex gap-2">
                        <Info className="w-4 h-4 text-brand-primary shrink-0" />
                        <div>
                            <div className="text-[11px] font-bold text-foreground">{t('hotelDetail.sidebar.perfectStay')}</div>
                            <div className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                                <MapPin className="w-3 h-3 text-brand-primary" />
                                {t('hotelDetail.sidebar.topLocation')}
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Maximize className="w-4 h-4 text-brand-primary shrink-0" />
                        <div>
                            <div className="text-[11px] font-bold text-foreground">{t('hotelDetail.sidebar.apartmentsWith')}</div>
                            <div className="text-[10px] text-muted-foreground mt-0.5">{t('hotelDetail.sidebar.landmarkView')}</div>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <ParkingCircle className="w-4 h-4 text-brand-primary shrink-0" />
                        <div className="text-[10px] text-muted-foreground">{t('hotelDetail.sidebar.freeParking')}</div>
                    </div>
                </div>

                <Button onClick={() => onBook?.()} className="w-full bg-brand-primary hover:bg-brand-primary/90 text-white font-bold text-xs py-2 rounded-lg shadow-md shadow-brand-primary/10 transition-all active:scale-95">
                    {t('hotelDetail.bookNow')}
                </Button>
                <div className="text-center text-[10px] text-muted-foreground">{t('hotelDetail.sidebar.noChargeYet')}</div>
            </div>
        </div>
    );
};
