'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { AdminSidebar } from '@/components/admin/admin-sidebar';
import { useAuth } from '@/components/providers/auth-provider';
import { useRouter, usePathname } from 'next/navigation';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import {
    canAccessHotelPortal,
    canAccessSuperAdmin,
} from '@/lib/auth-helpers';
import { useHotelPortalAuth } from '@/hooks/use-hotel-portal-auth';
import { toast } from 'sonner';
import { Preloader } from '@/components/ui/preloader';
import { clsx } from 'clsx';

function isHotelPortalPath(pathname: string): boolean {
    return pathname === '/admin/hotel' || pathname.startsWith('/admin/hotel/');
}

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, loading } = useAuth();
    const { canAccessPortal } = useHotelPortalAuth();
    const router = useRouter();
    const pathname = usePathname();
    const hotelPath = isHotelPortalPath(pathname);
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const [loadingTimeout, setLoadingTimeout] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    useEffect(() => {
        try {
            const saved = localStorage.getItem('bookaddis-admin-sidebar-collapsed');
            if (saved === 'true') {
                setSidebarCollapsed(true);
            }
        } catch {
            /* localStorage unavailable */
        }
    }, []);

    const toggleSidebarCollapse = () => {
        setSidebarCollapsed((prev) => {
            const next = !prev;
            try {
                localStorage.setItem('bookaddis-admin-sidebar-collapsed', String(next));
            } catch {
                /* noop */
            }
            return next;
        });
    };

    // Compute gate synchronously on mount so pre-authenticated admins never see a verifying flash
    const computeInitialGate = (): 'checking' | 'ready' | 'blocked' => {
        if (user && canAccessSuperAdmin(user) && !hotelPath) return 'ready';
        if (user && hotelPath && canAccessPortal) return 'ready';
        if (loading) return 'checking';
        if (!user) return 'blocked';
        if (hotelPath) {
            if (canAccessSuperAdmin(user)) return 'blocked';
            if (!canAccessPortal) return 'blocked';
            return 'ready';
        }
        if (!canAccessSuperAdmin(user)) return 'blocked';
        return 'ready';
    };

    const [gate, setGate] = useState<'checking' | 'ready' | 'blocked'>(computeInitialGate);

    useEffect(() => {
        if (loading) {
            const timeoutId = setTimeout(() => {
                setLoadingTimeout(true);
            }, 10000);
            return () => clearTimeout(timeoutId);
        }
        setLoadingTimeout(false);
    }, [loading]);

    useEffect(() => {
        if (user && canAccessSuperAdmin(user) && !hotelPath) {
            setGate('ready');
            return;
        }
        if (user && hotelPath && canAccessPortal) {
            setGate('ready');
            return;
        }

        if (loading && !loadingTimeout) {
            setGate('checking');
            return;
        }

        if (!user) {
            setGate('blocked');
            if (loadingTimeout) {
                toast.error('Authentication timeout. Please sign in again.');
            }
            router.replace(
                '/signin?redirect=' + encodeURIComponent(pathname),
            );
            return;
        }

        if (hotelPath) {
            // Super Admin manages hotels in company console  not Hotel Portal.
            if (canAccessSuperAdmin(user)) {
                setGate('blocked');
                const dest =
                    pathname === '/admin/hotel' || pathname === '/admin/hotel/'
                        ? '/admin/partners?tab=hotels'
                        : pathname.replace(
                              /^\/admin\/hotel/,
                              '/admin/inventory',
                          );
                router.replace(dest);
                return;
            }
            if (!canAccessPortal) {
                setGate('blocked');
                toast.error(
                    'You do not have permission to access the hotel portal.',
                );
                router.replace('/');
                return;
            }
            setGate('ready');
            return;
        }

        if (!canAccessSuperAdmin(user)) {
            setGate('blocked');
            if (canAccessPortal || canAccessHotelPortal(user)) {
                router.replace('/admin/hotel');
                return;
            }
            toast.error('You do not have permission to access the admin area.');
            router.replace('/');
            return;
        }

        setGate('ready');
    }, [loading, loadingTimeout, user, hotelPath, pathname, router, canAccessPortal]);

    // Hotel extranet uses its own layout under /admin/hotel/**
    if (hotelPath) {
        return <>{children}</>;
    }

    if (gate !== 'ready' || !user || !canAccessSuperAdmin(user)) {
        return (
            <Preloader
                fullScreen
                size="lg"
                label={
                    !user
                        ? 'Redirecting to sign in…'
                        : !canAccessSuperAdmin(user)
                          ? 'Redirecting…'
                          : 'Verifying admin access…'
                }
            />
        );
    }

    return (
        <div className="min-h-screen bg-brand-gray flex">
            <AdminSidebar
                className="hidden lg:flex fixed h-full left-0 top-0"
                collapsed={sidebarCollapsed}
                onToggleCollapse={toggleSidebarCollapse}
            />

            <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
                <SheetContent side="left" className="p-0 w-64 border-r-0">
                    <SheetTitle className="sr-only">Admin Navigation Menu</SheetTitle>
                    <AdminSidebar
                        className="h-full w-full"
                        onNavigate={() => setIsMobileOpen(false)}
                    />
                </SheetContent>
            </Sheet>

            <div
                className={clsx(
                    "flex-1 flex flex-col h-screen w-full transition-all duration-300",
                    sidebarCollapsed ? "lg:ml-20" : "lg:ml-64"
                )}
            >
                <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-4 sm:px-8 sticky top-0 z-40">
                    <div className="flex items-center gap-4">
                        <Sheet>
                            <SheetTrigger
                                asChild
                                onClick={() => setIsMobileOpen(true)}
                            >
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="lg:hidden"
                                >
                                    <Menu className="h-5 w-5" />
                                </Button>
                            </SheetTrigger>
                        </Sheet>
                        <h1 className="text-xl font-extrabold text-brand-dark">
                            Super Admin
                        </h1>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="text-right hidden sm:block">
                            <div className="text-sm font-extrabold text-brand-dark">
                                {user.name || 'Admin User'}
                            </div>
                            <div className="text-xs text-gray-500">
                                {user.email}
                            </div>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary font-bold">
                            {user.name ? user.name[0].toUpperCase() : 'A'}
                        </div>
                    </div>
                </header>

                <main className="flex-1 p-4 sm:p-8 overflow-y-auto">
                    <div className="max-w-[1600px] mx-auto w-full">{children}</div>
                </main>
            </div>
        </div>
    );
}
