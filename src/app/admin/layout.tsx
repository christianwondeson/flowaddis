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
            <main className="flex-1 ml-64 p-8 overflow-y-auto h-screen">
                <div className="max-w-7xl mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}
