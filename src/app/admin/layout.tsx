"use client";

import React, { useEffect, useState } from 'react';
import { AdminSidebar } from '@/components/admin/admin-sidebar';
import { useAuth } from '@/components/providers/auth-provider';
import { useRouter, usePathname } from 'next/navigation';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, loading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    useEffect(() => {
        if (loading) return;
        if (!user) {
            router.replace(`/signin?redirect=${encodeURIComponent(pathname)}`);
            return;
        }
        if (user.role !== 'admin') {
            router.replace('/');
        }
    }, [user, loading, router, pathname]);

    if (loading || !user || user.role !== 'admin') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-brand-gray">
                <div className="text-sm text-gray-500">Checking admin access…</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-brand-gray flex">
            {/* Desktop Sidebar */}
            <AdminSidebar className="hidden lg:flex fixed h-full left-0 top-0" />

            {/* Mobile Sidebar (Sheet) */}
            <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
                <SheetContent side="left" className="p-0 w-64 border-r-0">
                    <AdminSidebar className="h-full w-full" onNavigate={() => setIsMobileOpen(false)} />
                </SheetContent>
            </Sheet>

            <div className="flex-1 lg:ml-64 flex flex-col h-screen w-full">
                {/* Sticky Admin Topbar */}
                <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-4 sm:px-8 sticky top-0 z-40">
                    <div className="flex items-center gap-4">
                        <Sheet>
                            <SheetTrigger asChild onClick={() => setIsMobileOpen(true)}>
                                <Button variant="ghost" size="icon" className="lg:hidden">
                                    <Menu className="h-5 w-5" />
                                </Button>
                            </SheetTrigger>
                        </Sheet>
                        <h1 className="text-xl font-bold text-gray-800">Admin Dashboard</h1>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="text-right hidden sm:block">
                            <div className="text-sm font-bold text-gray-900">{user.name || 'Admin User'}</div>
                            <div className="text-xs text-gray-500">{user.email}</div>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary font-bold">
                            {user.name ? user.name[0].toUpperCase() : 'A'}
                        </div>
                    </div>
                </header>

                {/* Scrollable Main Content */}
                <main className="flex-1 p-4 sm:p-8 overflow-y-auto">
                    <div className="max-w-7xl mx-auto">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
