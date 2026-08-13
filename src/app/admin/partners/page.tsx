'use client';

import React, { Suspense, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { HotelPartnerRequests } from '@/components/admin/hotel-partner-requests';
import { DirectHotelsPanel } from '@/components/admin/direct-hotels-panel';
import { AdminRequests } from '@/components/admin/admin-requests';
import { AdminLoader } from '@/components/ui/admin-loader';
import { Building2, CheckCircle2, Hotel, Users } from 'lucide-react';
import { clsx } from 'clsx';

type TabKey = 'approvals' | 'hotels';

/**
 * Unified Super Admin Hotels workspace:
 * partner KYC + Direct inventory (formerly separate "Manage hotels").
 */
function AdminHotelsWorkspace() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const tabParam = searchParams.get('tab');
    const tab: TabKey = tabParam === 'hotels' ? 'hotels' : 'approvals';

    const setTab = useCallback(
        (next: TabKey) => {
            const qs = next === 'approvals' ? '' : `?tab=${next}`;
            router.replace(`/admin/partners${qs}`, { scroll: false });
        },
        [router],
    );

    return (
        <div className="space-y-8 max-w-5xl">
            <div>
                <h1 className="text-3xl font-extrabold text-brand-dark tracking-tight">Hotels</h1>
                <p className="text-gray-500 mt-1 max-w-2xl">
                    One Super Admin workspace: approve partners, register Direct hotels with
                    verification docs, assign staff, and publish to guest search. Hotel partners
                    then use the Hotel Portal  you stay here.
                </p>
            </div>

            <ol className="grid gap-3 sm:grid-cols-3">
                {[
                    {
                        icon: Users,
                        title: '1. Review partner KYC',
                        body: 'Check logo, business license, tax certificate, and owner ID. Approve and assign Hotel Admin / Staff.',
                    },
                    {
                        icon: Building2,
                        title: '2. Register or link hotel',
                        body: 'Use Register hotel wizard (docs required) or create from the partner request  KYC is stored on the property.',
                    },
                    {
                        icon: Hotel,
                        title: '3. Rooms → publish',
                        body: 'Partner sets rooms and daily prices. Publish only when verification is complete (API-enforced).',
                    },
                ].map((s) => (
                    <li
                        key={s.title}
                        className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                    >
                        <s.icon className="w-5 h-5 text-brand-primary mb-2" />
                        <h2 className="font-bold text-brand-dark text-sm">{s.title}</h2>
                        <p className="text-xs text-slate-600 mt-1 leading-relaxed">{s.body}</p>
                    </li>
                ))}
            </ol>

            <div className="rounded-xl border border-sky-100 bg-sky-50/70 px-4 py-3 text-sm text-sky-950 flex gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-sky-700" />
                <p>
                    <strong>BookAddis staff (Super Admin)</strong> are approved under Approvals  
                    that is platform access, not hotel extranet. <strong>Hotel partners</strong>{' '}
                    use Partner requests + membership. After assign, <em>they</em> use the Hotel
                    Portal. You manage inventory under the Hotels tab here.
                </p>
            </div>

            <div className="flex flex-wrap gap-1 border-b border-slate-200 pb-px">
                {(
                    [
                        { key: 'approvals' as const, label: 'Approvals & partners' },
                        { key: 'hotels' as const, label: 'Direct hotels' },
                    ] as const
                ).map((t) => (
                    <button
                        key={t.key}
                        type="button"
                        onClick={() => setTab(t.key)}
                        className={clsx(
                            'px-4 py-2.5 text-sm font-semibold rounded-t-lg transition-colors',
                            tab === t.key
                                ? 'bg-white text-brand-primary border border-b-white border-slate-200 -mb-px'
                                : 'text-slate-500 hover:text-brand-dark',
                        )}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            {tab === 'approvals' ? (
                <div className="space-y-8">
                    <section className="space-y-3">
                        <h2 className="text-lg font-bold text-brand-dark">
                            Platform Super Admin requests
                        </h2>
                        <AdminRequests />
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-lg font-bold text-brand-dark">
                            Hotel partner / agent requests
                        </h2>
                        <HotelPartnerRequests />
                    </section>
                </div>
            ) : (
                <section className="space-y-3">
                    <h2 className="text-lg font-bold text-brand-dark">
                        Direct hotels  inventory & publish
                    </h2>
                    <DirectHotelsPanel />
                </section>
            )}

            <p className="text-sm text-gray-500">
                Need to grant access without a request? Open{' '}
                <Link
                    href="/admin/users"
                    className="text-brand-primary font-semibold underline"
                >
                    User Management
                </Link>{' '}
                → Actions → <em>Assign hotel access</em>, then publish the hotel under Direct
                hotels.
            </p>
        </div>
    );
}

export default function AdminPartnersPage() {
    return (
        <Suspense fallback={<AdminLoader label="Loading Hotels…" />}>
            <AdminHotelsWorkspace />
        </Suspense>
    );
}
