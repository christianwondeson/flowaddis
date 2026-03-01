"use client";

import React from 'react';
import { usePathname } from 'next/navigation';
import { Header } from '@/components/shared/header';
import { Footer } from '@/components/shared/footer';
import { BottomNav } from '@/components/shared/bottom-nav';
import { ErrorBoundary } from '@/components/shared/error-boundary';

export function PublicLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isAdmin = pathname?.startsWith('/admin');

    if (isAdmin) {
        return <>{children}</>;
    }

    const isMapPage = pathname === '/hotels/map';
    const showBottomNav = !isMapPage && pathname !== '/admin';

    return (
        <ErrorBoundary>
            <div className="min-h-screen flex flex-col">
                <React.Suspense fallback={<div className="h-16 bg-white/50 backdrop-blur-md" />}>
                    <Header />
                </React.Suspense>
                <main className="flex-grow pb-16 md:pb-0">
                    {children}
                </main>
                {!isMapPage && <Footer />}
                {showBottomNav && <BottomNav />}
            </div>
        </ErrorBoundary>
    );
}
