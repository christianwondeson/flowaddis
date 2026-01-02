"use client";
import React, { useEffect } from 'react';
import { AdminSidebar } from '@/components/admin/admin-sidebar';
import { useAuth } from '@/components/providers/auth-provider';
import { useRouter, usePathname } from 'next/navigation';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, loading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

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
            <AdminSidebar />
            <div className="flex-1 ml-64 flex flex-col h-screen">
                {/* Sticky Admin Topbar */}
                <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-8 sticky top-0 z-40">
                    <h1 className="text-xl font-bold text-gray-800">Admin Dashboard</h1>
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
                <main className="flex-1 p-8 overflow-y-auto">
                    <div className="max-w-7xl mx-auto">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
