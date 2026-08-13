'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { clsx } from 'clsx';

export type SecondaryNavItem = {
    id: string;
    label: string;
    href: string;
    hint?: string;
};

type Props = {
    title: string;
    description?: string;
    items: SecondaryNavItem[];
    children: React.ReactNode;
    /** Query param used for active section (default: section) */
    paramKey?: string;
};

/**
 * Booking.com / Expedia-style second column nav + main content.
 * Collapses to horizontal chips on small screens.
 */
export function HotelSectionShell({
    title,
    description,
    items,
    children,
    paramKey = 'section',
}: Props) {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const active =
        searchParams.get(paramKey) ||
        items[0]?.id ||
        '';

    return (
        <div className="space-y-4">
            <div>
                <h1 className="text-xl sm:text-2xl font-extrabold text-brand-dark tracking-tight">
                    {title}
                </h1>
                {description ? (
                    <p className="text-sm text-slate-600 mt-1 max-w-2xl">{description}</p>
                ) : null}
            </div>

            <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 items-start">
                {items.length > 0 ? (
                    <>
                        {/* Mobile: horizontal section chips */}
                        <nav
                            className="lg:hidden w-full overflow-x-auto -mx-1 px-1"
                            aria-label="Section"
                        >
                            <ul className="flex gap-2 min-w-max pb-1">
                                {items.map((item) => {
                                    const isOn = item.id === active;
                                    return (
                                        <li key={item.id}>
                                            <Link
                                                href={item.href}
                                                className={clsx(
                                                    'inline-flex rounded-full px-3.5 py-2 text-sm font-semibold border transition-colors',
                                                    isOn
                                                        ? 'bg-brand-primary text-white border-brand-primary'
                                                        : 'bg-white text-slate-700 border-slate-200',
                                                )}
                                            >
                                                {item.label}
                                            </Link>
                                        </li>
                                    );
                                })}
                            </ul>
                        </nav>

                        {/* Desktop: secondary sidebar */}
                        <aside className="hidden lg:block w-56 shrink-0 sticky top-20">
                            <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                                <div className="px-3 py-2.5 border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                                    Sections
                                </div>
                                <ul className="p-1.5 space-y-0.5">
                                    {items.map((item) => {
                                        const isOn = item.id === active;
                                        return (
                                            <li key={item.id}>
                                                <Link
                                                    href={item.href}
                                                    className={clsx(
                                                        'block rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                                                        isOn
                                                            ? 'bg-brand-primary/10 text-brand-primary'
                                                            : 'text-slate-700 hover:bg-slate-50',
                                                    )}
                                                >
                                                    {item.label}
                                                    {item.hint ? (
                                                        <span className="block text-[11px] font-normal text-slate-500 mt-0.5">
                                                            {item.hint}
                                                        </span>
                                                    ) : null}
                                                </Link>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </div>
                            <p className="mt-2 text-[11px] text-slate-400 px-1">
                                {pathname.includes('/photos')
                                    ? 'Tip: add exterior and room photos first.'
                                    : 'Complete each section clearly for guests.'}
                            </p>
                        </aside>
                    </>
                ) : null}

                <div className="flex-1 min-w-0 w-full">{children}</div>
            </div>
        </div>
    );
}
