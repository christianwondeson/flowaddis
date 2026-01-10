"use client";

import React from 'react';
import { usePathname } from 'next/navigation';
import { Header } from '@/components/shared/header';
import { Footer } from '@/components/shared/footer';
import { ErrorBoundary } from '@/components/shared/error-boundary';

export function PublicLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isAdmin = pathname?.startsWith('/admin');

    if (isAdmin) {
        return <>{children}</>;
    }

    const isMapPage = pathname === '/hotels/map';

    return (
        <ErrorBoundary>
            <div className="min-h-screen flex flex-col">
                <React.Suspense fallback={<div className="h-16 bg-white/50 backdrop-blur-md" />}>
                    <Header />
                </React.Suspense>
                <main className="flex-grow">
                    {children}
                </main>
                {!isMapPage && <Footer />}
            </div>
        </ErrorBoundary>
    );
}
