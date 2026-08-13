'use client';

import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const LINKS = [
    { suffix: '', label: 'Overview' },
    { suffix: '/rooms', label: 'Rooms & rates' },
    { suffix: '/calendar', label: 'Rates & calendar' },
    { suffix: '/property', label: 'Property' },
] as const;

/** Sub-nav for Super Admin hotel inventory (not Hotel Portal). */
export function InventoryHotelNav({ hotelName }: { hotelName?: string }) {
    const params = useParams();
    const pathname = usePathname();
    const hotelId = String(params.hotelId || '');
    const base = `/admin/inventory/${hotelId}`;

    return (
        <div className="mb-6 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Super Admin · Direct inventory
                    </p>
                    <h1 className="text-2xl font-extrabold text-brand-dark tracking-tight">
                        {hotelName || 'Hotel'}
                    </h1>
                </div>
                <Link
                    href="/admin/partners?tab=hotels"
                    className="text-sm font-semibold text-brand-primary hover:underline"
                >
                    ← Hotels
                </Link>
            </div>
            <nav className="flex flex-wrap gap-1 border-b border-slate-200 pb-px">
                {LINKS.map((l) => {
                    const href = `${base}${l.suffix}`;
                    const active =
                        l.suffix === ''
                            ? pathname === base || pathname === `${base}/`
                            : pathname.startsWith(href);
                    return (
                        <Link
                            key={l.suffix || 'overview'}
                            href={href}
                            className={cn(
                                'px-3 py-2 text-sm font-semibold rounded-t-lg border-b-2 -mb-px transition-colors',
                                active
                                    ? 'border-brand-primary text-brand-primary'
                                    : 'border-transparent text-slate-500 hover:text-brand-dark',
                            )}
                        >
                            {l.label}
                        </Link>
                    );
                })}
            </nav>
        </div>
    );
}
