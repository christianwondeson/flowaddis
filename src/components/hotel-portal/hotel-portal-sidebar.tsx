'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    BedDouble,
    CalendarDays,
    BookOpen,
    Sparkles,
    Images,
    CreditCard,
    Building2,
    MessageSquare,
    LogOut,
    ArrowLeftRight,
    Hotel,
    Star,
    Percent,
    ConciergeBell,
    Bus,
    Presentation,
    Wallet,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useAuth } from '@/components/providers/auth-provider';
import { canAccessSuperAdmin } from '@/lib/auth/admin-utils';
import { Logo } from '@/components/shared/logo';

/** Same chrome as Super Admin sidebar  Sign Out + brand-dark. */
const PROPERTY_NAV = [
    { name: 'Dashboard', segment: '', icon: LayoutDashboard },
    { name: 'Reservations', segment: 'reservations', icon: BookOpen },
    { name: 'Rooms & rates', segment: 'rooms', icon: BedDouble },
    { name: 'Daily prices', segment: 'calendar', icon: CalendarDays },
    { name: 'Promotions', segment: 'promotions', icon: Percent },
    { name: 'Stay extras', segment: 'extras', icon: ConciergeBell },
    { name: 'Shuttles', segment: 'shuttles', icon: Bus },
    { name: 'Conferences', segment: 'conferences', icon: Presentation },
    { name: 'Facilities', segment: 'facilities', icon: Sparkles },
    { name: 'Reviews', segment: 'reviews', icon: Star },
    { name: 'Photos', segment: 'photos', icon: Images },
    { name: 'Messages', segment: 'messages', icon: MessageSquare },
    { name: 'Transactions', segment: 'transactions', icon: CreditCard },
    { name: 'Billing', segment: 'billing', icon: Wallet },
    { name: 'Property', segment: 'property', icon: Building2 },
] as const;

type Props = {
    /** When set, show per-property nav. When empty, property-picker home. */
    hotelId?: string;
    hotelName?: string;
    className?: string;
    onNavigate?: () => void;
};

export function HotelPortalSidebar({
    hotelId,
    hotelName,
    className,
    onNavigate,
}: Props) {
    const pathname = usePathname();
    const { logout, user } = useAuth();
    const base = hotelId ? `/admin/hotel/${hotelId}` : '/admin/hotel';

    const isActive = (segment: string) => {
        if (!hotelId) {
            return pathname === '/admin/hotel' || pathname === '/admin/hotel/';
        }
        const href = segment ? `${base}/${segment}` : base;
        if (!segment) return pathname === base;
        return pathname === href || pathname.startsWith(`${href}/`);
    };

    return (
        <aside
            className={clsx(
                'w-64 bg-brand-dark text-white flex flex-col',
                className,
            )}
        >
            <div className="p-6 border-b border-white/10 space-y-3">
                <Logo light={false} />
                <div>
                    <p className="text-[10px] uppercase tracking-[0.14em] text-gray-500 font-semibold">
                        Hotel Admin
                    </p>
                    <p className="text-sm font-semibold text-white truncate mt-0.5">
                        {hotelName || 'Your properties'}
                    </p>
                </div>
            </div>

            <nav className="flex-1 p-4 space-y-2 overflow-y-auto scrollbar-hide">
                {!hotelId ? (
                    <Link
                        href="/admin/hotel"
                        onClick={onNavigate}
                        className={clsx(
                            'flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium',
                            isActive('')
                                ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/20'
                                : 'text-gray-400 hover:bg-white/5 hover:text-white',
                        )}
                    >
                        <Hotel className="w-5 h-5" />
                        Properties
                    </Link>
                ) : (
                    PROPERTY_NAV.map((item) => {
                        const href = item.segment ? `${base}/${item.segment}` : base;
                        const active = isActive(item.segment);
                        return (
                            <Link
                                key={item.name}
                                href={href}
                                onClick={onNavigate}
                                className={clsx(
                                    'flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium',
                                    active
                                        ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/20'
                                        : 'text-gray-400 hover:bg-white/5 hover:text-white',
                                )}
                            >
                                <item.icon className="w-5 h-5" />
                                {item.name}
                            </Link>
                        );
                    })
                )}
            </nav>

            <div className="p-4 border-t border-white/10 space-y-2">
                {hotelId ? (
                    <Link
                        href="/admin/hotel"
                        onClick={onNavigate}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:bg-white/5 hover:text-white w-full transition-colors font-medium"
                    >
                        <ArrowLeftRight className="w-5 h-5" />
                        Switch property
                    </Link>
                ) : null}
                {canAccessSuperAdmin(user) && (
                    <Link
                        href="/admin"
                        onClick={onNavigate}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:bg-white/5 hover:text-white w-full transition-colors font-medium"
                    >
                        <LayoutDashboard className="w-5 h-5" />
                        Super Admin
                    </Link>
                )}
                <button
                    type="button"
                    onClick={logout}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:bg-red-500/10 hover:text-red-500 w-full transition-colors font-medium"
                >
                    <LogOut className="w-5 h-5" />
                    Sign Out
                </button>
            </div>
        </aside>
    );
}
