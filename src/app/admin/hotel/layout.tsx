'use client';

import React, { useEffect, useState } from 'react';
import { useParams, usePathname } from 'next/navigation';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { HotelPortalProvider, useHotelPortal } from '@/components/hotel-portal/hotel-portal-context';
import { HotelPortalSidebar } from '@/components/hotel-portal/hotel-portal-sidebar';
import { HotelAccessGate } from '@/components/hotel-portal/hotel-access-gate';
import { HotelBillingBanner } from '@/components/hotel-portal/hotel-billing-banner';
import { useAuth } from '@/components/providers/auth-provider';
import { getHotelBrandLabel, getHotelCoverUrl } from '@/lib/hotel-brand';
import { clsx } from 'clsx';

/**
 * Same shell as Super Admin: sidebar (Sign Out) + topbar with property brand.
 */
function HotelExtranetChrome({ children }: { children: React.ReactNode }) {
    const params = useParams();
    const pathname = usePathname();
    const { user } = useAuth();
    const { hotels } = useHotelPortal();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [collapsed, setCollapsed] = useState(false);

    useEffect(() => {
        try {
            const saved = localStorage.getItem('bookaddis-hotel-sidebar-collapsed');
            if (saved === 'true') {
                setCollapsed(true);
            }
        } catch {
            /* noop */
        }
    }, []);

    const toggleCollapse = () => {
        setCollapsed((prev) => {
            const next = !prev;
            try {
                localStorage.setItem('bookaddis-hotel-sidebar-collapsed', String(next));
            } catch {
                /* noop */
            }
            return next;
        });
    };

    const hotelId = typeof params?.hotelId === 'string' ? params.hotelId : '';
    const hotel = hotels.find((h) => h.id === hotelId);
    const isPicker = pathname === '/admin/hotel' || pathname === '/admin/hotel/';
    const brand = getHotelBrandLabel(hotel);
    const cover = getHotelCoverUrl(hotel?.media);

    return (
        <div className="min-h-screen bg-brand-gray flex">
            <HotelPortalSidebar
                hotelId={isPicker ? undefined : hotelId || undefined}
                hotelName={isPicker ? undefined : hotel?.name}
                className="hidden lg:flex fixed h-full left-0 top-0 z-30"
                collapsed={collapsed}
                onToggleCollapse={toggleCollapse}
            />

            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <SheetContent side="left" className="p-0 w-64 border-r-0">
                    <SheetTitle className="sr-only">Hotel Admin Navigation</SheetTitle>
                    <HotelPortalSidebar
                        hotelId={isPicker ? undefined : hotelId || undefined}
                        hotelName={isPicker ? undefined : hotel?.name}
                        className="h-full w-full"
                        onNavigate={() => setMobileOpen(false)}
                    />
                </SheetContent>
            </Sheet>

            <div
                className={clsx(
                    'flex-1 flex flex-col h-screen w-full transition-all duration-300',
                    collapsed ? 'lg:ml-20' : 'lg:ml-64',
                )}
            >
                <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-4 sm:px-8 sticky top-0 z-40">
                    <div className="flex items-center gap-3 min-w-0">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="lg:hidden shrink-0"
                            onClick={() => setMobileOpen(true)}
                        >
                            <Menu className="h-5 w-5" />
                        </Button>
                        {isPicker ? (
                            <div className="min-w-0">
                                <h1 className="text-xl font-extrabold text-brand-dark truncate">
                                    Hotel Partner Portal
                                </h1>
                                <p className="text-xs text-gray-500 truncate">BookAddis extranet</p>
                            </div>
                        ) : (
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-brand-primary/10 border border-slate-200">
                                    {cover ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                            src={cover}
                                            alt=""
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        <div className="flex h-full w-full items-center justify-center text-sm font-bold text-brand-primary">
                                            {(hotel?.name || 'H')[0]?.toUpperCase()}
                                        </div>
                                    )}
                                </div>
                                <div className="min-w-0">
                                    <h1 className="text-lg sm:text-xl font-extrabold text-brand-dark truncate">
                                        {hotel?.name || 'Hotel Admin'}
                                    </h1>
                                    <p className="text-xs text-gray-500 truncate">
                                        {[brand || 'BookAddis Partner', hotel?.city]
                                            .filter(Boolean)
                                            .join(' · ')}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                        <div className="text-right hidden sm:block">
                            <div className="text-sm font-extrabold text-brand-dark">
                                {user?.name || 'Hotel Admin'}
                            </div>
                            <div className="text-xs text-gray-500">{user?.email}</div>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary font-bold">
                            {user?.name ? user.name[0].toUpperCase() : 'H'}
                        </div>
                    </div>
                </header>

                <main className="flex-1 p-4 sm:p-8 overflow-y-auto scrollbar-hide">
                    <div className={isPicker ? 'max-w-5xl mx-auto w-full' : 'max-w-[1600px] mx-auto w-full'}>
                        <HotelAccessGate>
                            {!isPicker && hotelId ? (
                                <HotelBillingBanner hotelId={hotelId} />
                            ) : null}
                            {children}
                        </HotelAccessGate>
                    </div>
                </main>
            </div>
        </div>
    );
}

export default function HotelPortalLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <HotelPortalProvider>
            <HotelExtranetChrome>{children}</HotelExtranetChrome>
        </HotelPortalProvider>
    );
}
