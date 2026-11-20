'use client';

import React, { useState } from 'react';
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
    FileText,
    Star,
    Percent,
    ConciergeBell,
    Bus,
    Presentation,
    Wallet,
    ChevronLeft,
    ChevronRight,
    type LucideIcon,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useAuth } from '@/components/providers/auth-provider';
import { Logo } from '@/components/shared/logo';

export interface HotelNavGroup {
    title: string;
    items: {
        name: string;
        segment: string;
        icon: LucideIcon;
    }[];
}

export const HOTEL_ADMIN_GROUPS: HotelNavGroup[] = [
    {
        title: 'Overview',
        items: [
            { name: 'Dashboard', segment: '', icon: LayoutDashboard },
        ],
    },
    {
        title: 'Front Desk & Guests',
        items: [
            { name: 'Reservations', segment: 'reservations', icon: BookOpen },
            { name: 'Messages', segment: 'messages', icon: MessageSquare },
            { name: 'Guest Reviews', segment: 'reviews', icon: Star },
        ],
    },
    {
        title: 'Rates & Inventory',
        items: [
            { name: 'Rooms & Rates', segment: 'rooms', icon: BedDouble },
            { name: 'Daily Prices', segment: 'calendar', icon: CalendarDays },
            { name: 'Promotions', segment: 'promotions', icon: Percent },
        ],
    },
    {
        title: 'Services & Extras',
        items: [
            { name: 'Facilities', segment: 'facilities', icon: Sparkles },
            { name: 'Photos & Media', segment: 'photos', icon: Images },
            { name: 'Stay Extras', segment: 'extras', icon: ConciergeBell },
            { name: 'Shuttles', segment: 'shuttles', icon: Bus },
            { name: 'Conferences', segment: 'conferences', icon: Presentation },
        ],
    },
    {
        title: 'Finance & Profile',
        items: [
            { name: 'Billing & Invoices', segment: 'billing', icon: Wallet },
            { name: 'Statement', segment: 'statement', icon: FileText },
            { name: 'Transactions', segment: 'transactions', icon: CreditCard },
            { name: 'Property Profile', segment: 'property', icon: Building2 },
        ],
    },
];

type Props = {
    /** When set, show per-property nav. When empty, property-picker home. */
    hotelId?: string;
    hotelName?: string;
    className?: string;
    onNavigate?: () => void;
    collapsed?: boolean;
    onToggleCollapse?: () => void;
};

export function HotelPortalSidebar({
    hotelId,
    hotelName,
    className,
    onNavigate,
    collapsed = false,
    onToggleCollapse,
}: Props) {
    const pathname = usePathname();
    const { logout } = useAuth();
    const [signingOut, setSigningOut] = useState(false);
    const base = hotelId ? `/admin/hotel/${hotelId}` : '/admin/hotel';

    const onSignOut = async () => {
        if (signingOut) return;
        setSigningOut(true);
        try {
            await logout();
        } catch (e) {
            console.error(e);
            setSigningOut(false);
        }
    };

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
                'bg-brand-dark text-white flex flex-col transition-all duration-300 select-none z-30',
                collapsed ? 'w-20' : 'w-64',
                className,
            )}
        >
            {/* Header & Property Info with Collapse/Expand Toggle */}
            <div
                className={clsx(
                    'border-b border-white/10 flex items-center transition-all duration-300',
                    collapsed ? 'p-4 justify-center flex-col gap-2' : 'p-5 justify-between',
                )}
            >
                {!collapsed ? (
                    <div className="flex flex-col min-w-0 pr-2">
                        <Logo light={false} />
                        <div className="mt-2 min-w-0">
                            <p className="text-[10px] uppercase tracking-wider text-teal-400 font-bold">
                                Hotel Admin Extranet
                            </p>
                            <p className="text-xs font-semibold text-gray-200 truncate">
                                {hotelName || 'Your properties'}
                            </p>
                        </div>
                    </div>
                ) : (
                    <div
                        className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-500/30 flex items-center justify-center font-black text-teal-400 text-lg shadow-sm"
                        title={hotelName || 'Hotel Admin'}
                    >
                        {(hotelName || 'H')[0]?.toUpperCase()}
                    </div>
                )}

                {onToggleCollapse && (
                    <button
                        type="button"
                        onClick={onToggleCollapse}
                        title={collapsed ? 'Expand sidebar (Maximize)' : 'Collapse sidebar (Minimize)'}
                        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors shrink-0"
                    >
                        {collapsed ? (
                            <ChevronRight className="w-5 h-5" />
                        ) : (
                            <ChevronLeft className="w-5 h-5" />
                        )}
                    </button>
                )}
            </div>

            {/* Nav Groups or Property Picker */}
            <nav className="flex-1 p-3 space-y-4 overflow-y-auto overscroll-contain scrollbar-hide">
                {!hotelId ? (
                    <div className="relative group">
                        <Link
                            href="/admin/hotel"
                            onClick={onNavigate}
                            className={clsx(
                                'flex items-center rounded-xl transition-all duration-200 font-medium',
                                collapsed ? 'justify-center p-3' : 'gap-3 px-3.5 py-2.5 text-sm',
                                isActive('')
                                    ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/20 font-bold'
                                    : 'text-gray-400 hover:bg-white/5 hover:text-white',
                            )}
                        >
                            <Hotel className={clsx('shrink-0', collapsed ? 'w-5 h-5' : 'w-4 h-4')} />
                            {!collapsed && <span>Properties</span>}
                        </Link>
                        {collapsed && (
                            <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-lg shadow-2xl border border-white/10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap">
                                Properties
                            </div>
                        )}
                    </div>
                ) : (
                    HOTEL_ADMIN_GROUPS.map((group, groupIdx) => (
                        <div key={group.title} className="space-y-1">
                            {!collapsed ? (
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-3 pt-2 pb-1">
                                    {group.title}
                                </p>
                            ) : groupIdx > 0 ? (
                                <div className="border-t border-white/10 my-2" />
                            ) : null}

                            <div className="space-y-1">
                                {group.items.map((item) => {
                                    const href = item.segment ? `${base}/${item.segment}` : base;
                                    const active = isActive(item.segment);
                                    const Icon = item.icon;
                                    return (
                                        <div key={item.name} className="relative group">
                                            <Link
                                                href={href}
                                                onClick={onNavigate}
                                                className={clsx(
                                                    'flex items-center rounded-xl transition-all duration-200 font-medium',
                                                    collapsed
                                                        ? 'justify-center p-3'
                                                        : 'gap-3 px-3.5 py-2.5 text-sm',
                                                    active
                                                        ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/25 font-bold'
                                                        : 'text-gray-400 hover:bg-white/5 hover:text-white',
                                                )}
                                            >
                                                <Icon
                                                    className={clsx(
                                                        'shrink-0',
                                                        collapsed ? 'w-5 h-5' : 'w-4 h-4',
                                                    )}
                                                />
                                                {!collapsed && (
                                                    <span className="truncate">{item.name}</span>
                                                )}
                                            </Link>

                                            {collapsed && (
                                                <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-lg shadow-2xl border border-white/10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap">
                                                    <div className="text-[10px] uppercase font-bold text-teal-400">
                                                        {group.title}
                                                    </div>
                                                    <div>{item.name}</div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))
                )}
            </nav>

            {/* Footer: Switch property & Sign Out */}
            <div className="p-3 border-t border-white/10 space-y-1">
                {hotelId ? (
                    <div className="relative group">
                        <Link
                            href="/admin/hotel"
                            onClick={onNavigate}
                            className={clsx(
                                'flex items-center rounded-xl text-gray-400 hover:bg-white/5 hover:text-white transition-colors font-medium',
                                collapsed ? 'justify-center p-3' : 'gap-3 px-3.5 py-2 text-xs',
                            )}
                        >
                            <ArrowLeftRight className={clsx('shrink-0', collapsed ? 'w-5 h-5' : 'w-4 h-4')} />
                            {!collapsed && <span>Switch property</span>}
                        </Link>
                        {collapsed && (
                            <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-lg shadow-2xl border border-white/10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap">
                                Switch property
                            </div>
                        )}
                    </div>
                ) : null}

                <div className="relative group">
                    <button
                        type="button"
                        disabled={signingOut}
                        onClick={() => void onSignOut()}
                        className={clsx(
                            'flex items-center rounded-xl text-gray-400 hover:bg-red-500/10 hover:text-red-400 w-full transition-colors font-medium disabled:opacity-60',
                            collapsed ? 'justify-center p-3' : 'gap-3 px-3.5 py-2 text-xs',
                        )}
                    >
                        <LogOut className={clsx('shrink-0', collapsed ? 'w-5 h-5' : 'w-4 h-4')} />
                        {!collapsed && <span>{signingOut ? 'Signing out…' : 'Sign Out'}</span>}
                    </button>
                    {collapsed && (
                        <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-1.5 bg-slate-900 text-red-400 text-xs font-semibold rounded-lg shadow-2xl border border-white/10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap">
                            {signingOut ? 'Signing out…' : 'Sign Out'}
                        </div>
                    )}
                </div>
            </div>
        </aside>
    );
}
