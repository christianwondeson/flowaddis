'use client';

import Link from 'next/link';
import { useHotelPortal } from '@/components/hotel-portal/hotel-portal-context';
import { useAuth } from '@/components/providers/auth-provider';
import { getHotelBrandLabel, getHotelCoverUrl } from '@/lib/hotel-brand';
import { Building2, ChevronRight } from 'lucide-react';

/** Property picker  enter extranet for an assigned hotel. */
export default function HotelPortalHomePage() {
    const { hotels, loading, error, refresh } = useHotelPortal();
    const { user } = useAuth();
    const pending = user?.hotelPartnerStatus === 'pending';
    const approvedRole =
        user?.role === 'hotel_admin' || user?.role === 'hotel_staff';

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-extrabold text-brand-dark tracking-tight">
                    Your properties
                </h1>
                <p className="text-sm text-slate-600 mt-1">
                    Select a hotel to manage reservations, rooms, rates, and photos  same flow as
                    Booking.com / Agoda partner extranet.
                </p>
            </div>

            {loading && (
                <p className="text-sm text-slate-500">Loading properties…</p>
            )}
            {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                    {error}{' '}
                    <button type="button" className="underline" onClick={() => void refresh()}>
                        Retry
                    </button>
                </div>
            )}

            {!loading && !error && hotels.length === 0 && (
                <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
                    <Building2 className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                    {pending ? (
                        <>
                            <p className="font-semibold text-brand-dark">Partner request pending</p>
                            <p className="text-sm text-slate-600 mt-2 max-w-md mx-auto">
                                {user?.hotelPartnerRequest?.hotelName
                                    ? `“${user.hotelPartnerRequest.hotelName}”`
                                    : 'Your hotel'}{' '}
                                is waiting for BookAddis Super Admin approval. After they assign the
                                property, it appears here.
                            </p>
                        </>
                    ) : approvedRole ? (
                        <>
                            <p className="font-semibold text-brand-dark">No hotel assigned yet</p>
                            <p className="text-sm text-slate-600 mt-2 max-w-md mx-auto">
                                Your account has a hotel role, but no active property membership.
                                Ask Super Admin to open Hotel Partners (or Users → Assign hotel
                                access) and link your hotel.
                            </p>
                        </>
                    ) : (
                        <>
                            <p className="font-semibold text-brand-dark">Become a hotel partner</p>
                            <p className="text-sm text-slate-600 mt-2 max-w-md mx-auto">
                                Apply from your profile (or sign up as “List my hotel”). Super Admin
                                approves and assigns the property  then you get this dashboard.
                            </p>
                            <Link
                                href="/profile"
                                className="inline-block mt-4 text-sm font-semibold text-brand-primary hover:underline"
                            >
                                Go to profile
                            </Link>
                        </>
                    )}
                </div>
            )}

            <ul className="grid gap-3 sm:grid-cols-2">
                {hotels.map((h) => {
                    const cover = getHotelCoverUrl(h.media);
                    const brand = getHotelBrandLabel(h);
                    return (
                        <li key={h.id}>
                            <Link
                                href={`/admin/hotel/${h.id}`}
                                className="group flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-4 shadow-sm hover:border-brand-primary/40 hover:shadow-md transition-all"
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-brand-primary/10 border border-slate-100">
                                        {cover ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img
                                                src={cover}
                                                alt=""
                                                className="h-full w-full object-cover"
                                            />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center font-bold text-brand-primary">
                                                {(h.name || 'H')[0]?.toUpperCase()}
                                            </div>
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <div className="font-bold text-brand-dark group-hover:text-brand-primary truncate">
                                            {h.name}
                                        </div>
                                        <div className="text-xs text-slate-500 mt-0.5 truncate">
                                            {[brand || 'BookAddis Partner', h.city, h.status]
                                                .filter(Boolean)
                                                .join(' · ')}
                                        </div>
                                    </div>
                                </div>
                                <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-brand-primary shrink-0" />
                            </Link>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}
