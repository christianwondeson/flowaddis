"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    Plane,
    LogOut,
    Users,
    CreditCard,
    LifeBuoy,
    Hotel,
    MessageSquare,
    Wallet,
    BookOpen,
    FileText,
    ChevronLeft,
    ChevronRight,
    type LucideIcon,
} from 'lucide-react';
import { Logo } from '@/components/shared/logo';
import { clsx } from 'clsx';
import { useAuth } from '@/components/providers/auth-provider';

export interface AdminNavGroup {
    title: string;
    items: {
        name: string;
        path: string;
        icon: LucideIcon;
    }[];
}

export const SUPER_ADMIN_GROUPS: AdminNavGroup[] = [
    {
        title: 'Overview',
        items: [
            { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
        ],
    },
    {
        title: 'Catalog & Inventory',
        items: [
            { name: 'Hotels & Partners', path: '/admin/partners', icon: Hotel },
            { name: 'Manage Flights', path: '/admin/flights', icon: Plane },
        ],
    },
    {
        title: 'Bookings & Operations',
        items: [
            { name: 'Reservations', path: '/admin/reservations', icon: BookOpen },
            { name: 'Hotel Messages', path: '/admin/messages', icon: MessageSquare },
            { name: 'Support & Disputes', path: '/admin/support', icon: LifeBuoy },
        ],
    },
    {
        title: 'Finance & Invoicing',
        items: [
            { name: 'Billing & Invoices', path: '/admin/finance', icon: Wallet },
            { name: 'Statement', path: '/admin/statement', icon: FileText },
            { name: 'Transactions', path: '/admin/transactions', icon: CreditCard },
        ],
    },
    {
        title: 'Administration',
        items: [
            { name: 'User Management', path: '/admin/users', icon: Users },
        ],
    },
];

interface AdminSidebarProps {
    className?: string;
    onNavigate?: () => void;
    collapsed?: boolean;
    onToggleCollapse?: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
    className,
    onNavigate,
    collapsed = false,
    onToggleCollapse,
}) => {
    const pathname = usePathname();
    const { logout } = useAuth();
    const [signingOut, setSigningOut] = useState(false);

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

    const isActive = (path: string) => {
        if (path === '/admin') return pathname === '/admin' || pathname === '/admin/';
        if (path === '/admin/partners') {
            return (
                pathname === '/admin/partners' ||
                pathname.startsWith('/admin/partners/') ||
                pathname === '/admin/inventory' ||
                pathname.startsWith('/admin/inventory/')
            );
        }
        if (path === '/admin/support') {
            return (
                pathname === '/admin/support' ||
                pathname.startsWith('/admin/support/') ||
                pathname === '/admin/reviews' ||
                pathname.startsWith('/admin/reviews/')
            );
        }
        if (path !== '/admin' && pathname.startsWith(path)) return true;
        return false;
    };

    return (
        <aside
            className={clsx(
                "bg-brand-dark text-white flex flex-col transition-all duration-300 select-none z-30",
                collapsed ? "w-20" : "w-64",
                className
            )}
        >
            {/* Header & Logo with Collapse/Expand Toggle */}
            <div
                className={clsx(
                    "border-b border-white/10 flex items-center transition-all duration-300",
                    collapsed ? "p-4 justify-center flex-col gap-2" : "p-5 justify-between"
                )}
            >
                {!collapsed ? (
                    <div className="flex flex-col min-w-0">
                        <Logo light={false} />
                        <span className="text-[10px] uppercase font-bold tracking-widest text-teal-400 mt-1">
                            Super Admin
                        </span>
                    </div>
                ) : (
                    <div
                        className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-500/30 flex items-center justify-center font-black text-teal-400 text-lg shadow-sm"
                        title="BookAddis Super Admin"
                    >
                        BA
                    </div>
                )}

                {onToggleCollapse && (
                    <button
                        type="button"
                        onClick={onToggleCollapse}
                        title={collapsed ? "Expand sidebar (Maximize)" : "Collapse sidebar (Minimize)"}
                        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
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

            {/* Nav Groups */}
            <nav className="flex-1 p-3 space-y-4 overflow-y-auto overscroll-contain scrollbar-hide">
                {SUPER_ADMIN_GROUPS.map((group, groupIdx) => (
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
                                const active = isActive(item.path);
                                const Icon = item.icon;
                                return (
                                    <div key={item.name} className="relative group">
                                        <Link
                                            href={item.path}
                                            onClick={onNavigate}
                                            className={clsx(
                                                'flex items-center rounded-xl transition-all duration-200 font-medium',
                                                collapsed
                                                    ? 'justify-center p-3'
                                                    : 'gap-3 px-3.5 py-2.5 text-sm',
                                                active
                                                    ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/25 font-bold'
                                                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                                            )}
                                        >
                                            <Icon className={clsx("shrink-0", collapsed ? "w-5 h-5" : "w-4 h-4")} />
                                            {!collapsed && (
                                                <span className="truncate">{item.name}</span>
                                            )}
                                        </Link>

                                        {/* Tooltip in collapsed mode */}
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
                ))}
            </nav>

            {/* Footer Sign Out */}
            <div className="p-3 border-t border-white/10">
                <div className="relative group">
                    <button
                        type="button"
                        disabled={signingOut}
                        onClick={() => void onSignOut()}
                        className={clsx(
                            "flex items-center rounded-xl text-gray-400 hover:bg-red-500/10 hover:text-red-400 w-full transition-colors disabled:opacity-60",
                            collapsed ? "justify-center p-3" : "gap-3 px-3.5 py-2.5 text-sm font-medium"
                        )}
                    >
                        <LogOut className={clsx("shrink-0", collapsed ? "w-5 h-5" : "w-4 h-4")} />
                        {!collapsed && (
                            <span className="truncate">{signingOut ? 'Signing out…' : 'Sign Out'}</span>
                        )}
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
};
