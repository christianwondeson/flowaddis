'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Hotel, Plane, Globe, Luggage } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface AuthLayoutProps {
    title: string;
    subtitle?: string;
    /** Wider card for multi-step signup / KYC */
    wide?: boolean;
    children: React.ReactNode;
    footerLink?: {
        text: string;
        href: string;
        linkText: string;
    };
    /** Override or hide mode tabs ('signin' | 'signup' | 'none') */
    mode?: 'signin' | 'signup' | 'none';
}

const HERO_BENEFITS = [
    { icon: Hotel, text: 'Handpicked hotels across Ethiopia' },
    { icon: Plane, text: 'Flights & airport shuttles in one place' },
    { icon: Globe, text: 'Curated destinations, local expertise' },
];

export function AuthLayout({
    title,
    subtitle,
    wide = false,
    children,
    footerLink,
    mode,
}: AuthLayoutProps) {
    const pathname = usePathname();

    const activeMode: 'signin' | 'signup' | 'none' =
        mode ??
        (pathname.startsWith('/signin') || pathname.startsWith('/login')
            ? 'signin'
            : pathname.startsWith('/signup')
              ? 'signup'
              : 'none');

    const showModeTabs = activeMode === 'signin' || activeMode === 'signup';
    const cardMaxWidth = wide ? 'max-w-2xl xl:max-w-3xl' : 'max-w-md';

    return (
        <div className="flex min-h-screen bg-white dark:bg-slate-950">
            {/* Desktop Hero Panel */}
            <aside className="relative hidden w-[44%] xl:w-[46%] 2xl:w-[48%] lg:flex flex-col justify-between overflow-hidden bg-slate-950 p-10 xl:p-14 select-none">
                <Image
                    src="/assets/images/addis-ababa-night.webp"
                    alt="Addis Ababa, Ethiopia"
                    fill
                    priority
                    sizes="(max-width: 1024px) 0vw, 48vw"
                    className="animate-ken-burns object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/60 to-slate-900/40 backdrop-blur-[0.5px] z-10" />

                {/* Top spacer to balance vertical flex layout */}
                <div className="relative z-20 h-6" />

                {/* Main Headline & Value Props */}
                <div className="relative z-20 my-auto py-8 space-y-6">
                    <h1 className="animate-fade-up text-3xl xl:text-4xl 2xl:text-5xl font-extrabold leading-[1.18] text-white tracking-tight max-w-lg">
                        Your premium gateway to{' '}
                        <span className="bg-gradient-to-r from-teal-300 via-emerald-300 to-teal-200 bg-clip-text text-transparent">
                            Ethiopia
                        </span>
                    </h1>

                    <p className="animate-fade-up max-w-md text-sm xl:text-[15px] leading-relaxed text-slate-200/90">
                        Experience seamless booking for handpicked hotels, domestic flights, airport shuttles, and conference spaces across Ethiopia.
                    </p>

                    <ul className="space-y-3.5 pt-2">
                        {HERO_BENEFITS.map(({ icon: Icon, text }, i) => (
                            <li
                                key={text}
                                className="animate-fade-up flex items-center gap-3 text-sm text-slate-100"
                                style={{ animationDelay: `${(i + 1) * 120}ms` }}
                            >
                                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/10 backdrop-blur-sm ring-1 ring-white/20">
                                    <Icon className="h-4 w-4 text-teal-300" />
                                </span>
                                <span className="font-medium text-slate-200">{text}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Footer Copyright & Links */}
                <div className="relative z-20 flex items-center justify-between text-xs text-slate-400 pt-6 border-t border-white/10">
                    <span>© 2026 BookAddis. All rights reserved.</span>
                    <div className="flex items-center gap-4 text-slate-400">
                        <Link href="/privacy" className="hover:text-slate-200 transition-colors">
                            Privacy
                        </Link>
                        <span>•</span>
                        <Link href="/terms" className="hover:text-slate-200 transition-colors">
                            Terms
                        </Link>
                    </div>
                </div>
            </aside>

            {/* Form Content Panel */}
            <main className="flex-1 flex flex-col justify-center px-5 py-8 sm:px-10 lg:px-12 xl:px-16 min-h-screen bg-slate-50/70 dark:bg-slate-950 overflow-y-auto">
                {/* Mobile Top Logo */}
                <div className="lg:hidden mb-6 flex justify-center">
                    <Link href="/" className="inline-flex items-center gap-2.5">
                        <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 shadow-lg shadow-teal-500/30">
                            <Luggage className="h-5 w-5 text-white" />
                        </span>
                        <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                            Book<span className="text-teal-600 dark:text-teal-400">Addis</span>
                        </span>
                    </Link>
                </div>

                <div className={cn('w-full mx-auto', cardMaxWidth)}>
                    {/* Top Switcher Tab (Sign in vs Create account) */}
                    {showModeTabs && (
                        <div className="animate-fade-up mb-6 grid grid-cols-2 gap-1 rounded-2xl bg-slate-200/70 dark:bg-slate-900 p-1.5 shadow-inner">
                            <Link
                                href="/signin"
                                className={cn(
                                    'rounded-xl py-2.5 text-center text-sm font-semibold transition-all duration-300',
                                    activeMode === 'signin'
                                        ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-md shadow-slate-200/50'
                                        : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200',
                                )}
                            >
                                Sign in
                            </Link>
                            <Link
                                href="/signup"
                                className={cn(
                                    'rounded-xl py-2.5 text-center text-sm font-semibold transition-all duration-300',
                                    activeMode === 'signup'
                                        ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-md shadow-slate-200/50'
                                        : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200',
                                )}
                            >
                                Create account
                            </Link>
                        </div>
                    )}

                    {/* Card Surface */}
                    <div className="rounded-2xl border border-slate-200/90 bg-white dark:bg-slate-900 dark:border-slate-800 p-6 sm:p-8 shadow-xl shadow-slate-200/50 dark:shadow-none animate-slide-in-right">
                        <div className="mb-6">
                            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                                {title}
                            </h2>
                            {subtitle && (
                                <p className="mt-1.5 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                                    {subtitle}
                                </p>
                            )}
                        </div>

                        {children}

                        {footerLink && (
                            <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 text-center text-sm text-slate-500 dark:text-slate-400">
                                {footerLink.text}{' '}
                                <Link
                                    href={footerLink.href}
                                    className="font-semibold text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300 transition-colors"
                                >
                                    {footerLink.linkText}
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
