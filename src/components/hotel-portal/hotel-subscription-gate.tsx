'use client';

import { useEffect, useState } from 'react';
import { useParams, usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { CreditCard } from 'lucide-react';
import { hotelAdminFetch } from '@/lib/hotel-admin-api';
import { Preloader } from '@/components/ui/preloader';
import { Button } from '@/components/ui/button';

type Access = {
    allowed: boolean;
    reason: string;
    status: string;
};

/**
 * Hard paywall: hotel portal pages (except Billing) require active or trial access.
 * After Super Admin approval, trial starts automatically; otherwise pay with CBE Birr.
 */
export function HotelSubscriptionGate({
    children,
}: {
    children: React.ReactNode;
}) {
    const params = useParams();
    const pathname = usePathname();
    const router = useRouter();
    const hotelId = typeof params?.hotelId === 'string' ? params.hotelId : '';
    const isPicker = pathname === '/admin/hotel' || pathname === '/admin/hotel/';
    const isBilling =
        Boolean(hotelId) && pathname.includes(`/admin/hotel/${hotelId}/billing`);

    const [access, setAccess] = useState<Access | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!hotelId || isPicker || isBilling) {
            setAccess(null);
            setLoading(false);
            setError(null);
            return;
        }
        let cancelled = false;
        setLoading(true);
        setError(null);
        void hotelAdminFetch<{ access: Access }>(`hotels/${hotelId}/billing`)
            .then((ov) => {
                if (cancelled) return;
                setAccess(ov.access);
                if (ov.access && !ov.access.allowed) {
                    router.replace(`/admin/hotel/${hotelId}/billing`);
                }
            })
            .catch((e) => {
                if (!cancelled) {
                    setError(
                        e instanceof Error
                            ? e.message
                            : 'Could not verify subscription',
                    );
                }
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [hotelId, isPicker, isBilling, router, pathname]);

    if (isPicker || isBilling || !hotelId) {
        return <>{children}</>;
    }

    if (loading && !access) {
        return (
            <Preloader
                fullScreen={false}
                size="lg"
                label="Checking subscription…"
                className="py-24"
            />
        );
    }

    if (error) {
        return (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-6 py-10 text-center max-w-lg mx-auto">
                <p className="font-semibold text-amber-950">Billing check failed</p>
                <p className="text-sm text-amber-900/90 mt-2">{error}</p>
                <Button asChild className="mt-4 rounded-xl">
                    <Link href={`/admin/hotel/${hotelId}/billing`}>Open Billing</Link>
                </Button>
            </div>
        );
    }

    if (access && !access.allowed) {
        return (
            <div className="rounded-2xl border border-slate-200 bg-white px-6 py-12 text-center max-w-lg mx-auto shadow-sm">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-brand-primary/10">
                    <CreditCard className="h-6 w-6 text-brand-primary" />
                </div>
                <h2 className="text-lg font-extrabold text-brand-dark">
                    Activate your subscription
                </h2>
                <p className="text-sm text-slate-600 mt-2">{access.reason}</p>
                <p className="text-sm text-slate-500 mt-2">
                    Use a free trial (started after Super Admin approval) or pay with{' '}
                    <strong>CBE Birr</strong> on Billing to open the dashboard.
                </p>
                <Button asChild className="mt-6 rounded-xl bg-brand-primary hover:bg-teal-700">
                    <Link href={`/admin/hotel/${hotelId}/billing`}>
                        Go to Billing
                    </Link>
                </Button>
            </div>
        );
    }

    return <>{children}</>;
}
