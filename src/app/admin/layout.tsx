import React from 'react';
import { AdminSidebar } from '@/components/admin/admin-sidebar';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
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
