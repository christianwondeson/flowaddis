"use client";

import React from 'react';
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
} from 'lucide-react';
import { Logo } from '@/components/shared/logo';
import { clsx } from 'clsx';
import { useAuth } from '@/components/providers/auth-provider';

interface AdminSidebarProps {
    className?: string;
    onNavigate?: () => void;
}

/**
 * Platform Super Admin nav.
 * Partners + Direct inventory live under Hotels; partners use Hotel Portal separately.
 */
export const AdminSidebar: React.FC<AdminSidebarProps> = ({ className, onNavigate }) => {
    const pathname = usePathname();
    const { logout } = useAuth();

    const navItems = [
        { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
        { name: 'Hotels', path: '/admin/partners', icon: Hotel },
        { name: 'Manage Flights', path: '/admin/flights', icon: Plane },
        { name: 'Support & Disputes', path: '/admin/support', icon: LifeBuoy },
        { name: 'Hotel messages', path: '/admin/messages', icon: MessageSquare },
        { name: 'User Management', path: '/admin/users', icon: Users },
        { name: 'Transactions', path: '/admin/transactions', icon: CreditCard },
    ];

    const isActive = (path: string) => {
        if (path === '/admin' && pathname === '/admin') return true;
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
        <aside className={clsx("w-64 bg-brand-dark text-white flex flex-col", className)}>
            <div className="p-6 border-b border-white/10">
                <Logo light={false} />
            </div>

            <nav className="flex-1 p-4 space-y-2">
                {navItems.map((item) => (
                    <Link
                        key={item.name}
                        href={item.path}
                        onClick={onNavigate}
                        className={clsx(
                            'flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium',
                            isActive(item.path)
                                ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/20'
                                : 'text-gray-400 hover:bg-white/5 hover:text-white'
                        )}
                    >
                        <item.icon className="w-5 h-5" />
                        {item.name}
                    </Link>
                ))}
            </nav>

            <div className="p-4 border-t border-white/10">
                <button
                    onClick={logout}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:bg-red-500/10 hover:text-red-500 w-full transition-colors"
                >
                    <LogOut className="w-5 h-5" />
                    Sign Out
                </button>
            </div>
        </aside>
    );
};
