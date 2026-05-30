"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Menu, X, Plane, Hotel, Users, Bus, Home, Briefcase, User, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/shared/logo';
import { clsx } from 'clsx';
import { useAuth } from '@/components/providers/auth-provider';
import { canAccessAdmin } from '@/lib/auth/admin-utils';
import { buildSignInHref } from '@/lib/auth/post-login-path';
import { UserMenu } from '@/components/shared/user-menu';
import { HeaderLanguageSwitch } from '@/components/shared/header-language-switch';
import { useTranslations } from '@/components/providers/locale-provider';
import { motion, AnimatePresence } from 'framer-motion';

export const Header: React.FC = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const { user, logout } = useAuth();
    const { t } = useTranslations();

    const currentPath = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : '');

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const navItems = useMemo(
        () => [
            { name: t('nav.flights'), path: '/flights', icon: Plane },
            { name: t('nav.hotels'), path: '/hotels', icon: Hotel },
            { name: t('nav.conferences'), path: '/conferences', icon: Users },
            { name: t('nav.shuttles'), path: '/shuttles', icon: Bus },
        ],
        [t],
    );

    const isActive = (path: string) => pathname === path;
    const isTransparentPage = pathname === '/' || ['/flights', '/hotels', '/conferences', '/shuttles'].includes(pathname);
    // On mobile, always use solid header when on booking pages (with ads) so logo stays visible
    const isBookingPage = ['/flights', '/hotels', '/conferences', '/shuttles'].includes(pathname);
    const useSolidOnMobile = isBookingPage;
    // On booking pages with colored hero, use solid header when scrolled so sign buttons stay visible
    const showSolidHeader = scrolled || useSolidOnMobile;

    return (
        <header
            className={clsx(
                'fixed top-0 left-0 right-0 z-[60] transition-all duration-300',
                'pt-[env(safe-area-inset-top,0px)]',
                isTransparentPage && !showSolidHeader
                    ? 'bg-transparent py-3 md:py-4'
                    : 'bg-white dark:bg-slate-950 shadow-md dark:shadow-slate-900/50 py-2 md:py-2 border-b border-transparent dark:border-slate-800'
            )}
        >
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center">
                    {/* Logo - hidden on home page only. Use dark logo on white header (signin/signup/detail pages). */}
                    {pathname !== '/' && (
                        <Link href="/" className="flex items-center gap-2 relative z-[61]">
                            <Logo light={isTransparentPage && !showSolidHeader} />
                        </Link>
                    )}

                    {/* Desktop Navigation - modern active tab: subtle teal underline */}
                    <nav className="hidden md:flex items-center gap-6">
                        {navItems.map((item) => {
                            const active = isActive(item.path);
                            return (
                                <Link
                                    key={item.name}
                                    href={item.path}
                                    className={clsx(
                                        'relative flex items-center gap-2 text-sm font-bold transition-colors cursor-pointer pb-1',
                                    isTransparentPage && !showSolidHeader
                                        ? 'text-white hover:text-white/80'
                                        : 'text-slate-900 dark:text-slate-100 hover:text-teal-600 dark:hover:text-teal-400',
                                        active && "after:content-[''] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-teal-600 after:rounded-full"
                                    )}
                                >
                                    <item.icon className="w-4 h-4" />
                                    {item.name}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Auth / locale — desktop */}
                    <div className="hidden md:flex items-center gap-2">
                        <HeaderLanguageSwitch transparentLight={isTransparentPage && !showSolidHeader} />
                        <UserMenu isHomePage={isTransparentPage} scrolled={showSolidHeader} />
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        className={clsx(
                            'md:hidden p-2 rounded-full transition-colors',
                            isTransparentPage && !showSolidHeader
                                ? 'text-white hover:bg-white/20'
                                : 'text-brand-dark dark:text-slate-100 hover:bg-gray-100 dark:hover:bg-slate-800'
                        )}
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                    >
                        {isMenuOpen ? <X /> : <Menu />}
                    </button>
                </div >
            </div >

            {/* Mobile Menu - animated expand/collapse */}
            <AnimatePresence>
                {isMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.25, ease: 'easeInOut' }}
                        className="md:hidden bg-white dark:bg-slate-950 border-t border-gray-100 dark:border-slate-800 py-4 px-4 shadow-lg absolute w-full z-[70] overflow-hidden"
                    >
                        <div className="md:hidden pb-3 mb-3 border-b border-gray-100 dark:border-slate-800">
                            <HeaderLanguageSwitch transparentLight={false} />
                        </div>
                        <nav className="flex flex-col gap-2">
                            <Link
                                href="/"
                                className={clsx(
                                    'flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-medium',
                                    pathname === '/'
                                        ? 'bg-teal-100 text-teal-600'
                                        : 'text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800'
                                )}
                                onClick={() => setIsMenuOpen(false)}
                            >
                                <Home className="w-5 h-5" />
                                {t('nav.home')}
                            </Link>
                            {navItems.map((item) => (
                                <Link
                                    key={item.name}
                                    href={item.path}
                                    className={clsx(
                                        'flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-medium',
                                        isActive(item.path)
                                            ? 'bg-teal-100 text-teal-600'
                                            : 'text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800'
                                    )}
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    <item.icon className="w-5 h-5" />
                                    {item.name}
                                </Link>
                            ))}
                            <Link
                                href="/trips"
                                className={clsx(
                                    'flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-medium',
                                    pathname === '/trips' || pathname === '/dashboard' || pathname?.startsWith('/dashboard/')
                                        ? 'bg-teal-100 text-teal-600'
                                        : 'text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800'
                                )}
                                onClick={() => setIsMenuOpen(false)}
                            >
                                <Briefcase className="w-5 h-5" />
                                {t('nav.myTrips')}
                            </Link>
                            <div className="flex flex-col gap-3 mt-4 pt-4 border-t border-gray-100 dark:border-slate-800">
                                {user ? (
                                    <>
                                        <div className="px-4 py-2 text-sm font-medium text-brand-dark dark:text-slate-100">{t('header.hi')}, {user.name}</div>
                                        <Link href="/profile" className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 font-medium" onClick={() => setIsMenuOpen(false)}>
                                            <User className="w-5 h-5 shrink-0" />
                                            {t('nav.profile')}
                                        </Link>
                                        <Link href="/settings" className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 font-medium" onClick={() => setIsMenuOpen(false)}>
                                            <Settings className="w-5 h-5 shrink-0" />
                                            {t('nav.settings')}
                                        </Link>
                                        {canAccessAdmin(user) && (
                                            <Link href="/admin" onClick={() => setIsMenuOpen(false)}>
                                                <Button variant="outline" className="w-full justify-center">{t('nav.dashboard')}</Button>
                                            </Link>
                                        )}
                                        <Button variant="ghost" className="w-full justify-center text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => { logout(); setIsMenuOpen(false); }}>{t('common.signOut')}</Button>
                                    </>
                                ) : (
                                    <>
                                        <Link
                                            href="/profile"
                                            className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 font-medium"
                                            onClick={() => setIsMenuOpen(false)}
                                        >
                                            <User className="w-5 h-5 shrink-0" />
                                            {t('nav.profile')}
                                        </Link>
                                        <Link href={buildSignInHref(currentPath, '/signin')} onClick={() => setIsMenuOpen(false)}>
                                            <Button variant="outline" className="w-full justify-center">{t('common.signIn')}</Button>
                                        </Link>
                                        <Link href={buildSignInHref(currentPath, '/signup')} onClick={() => setIsMenuOpen(false)}>
                                            <Button className="w-full justify-center">{t('common.signUp')}</Button>
                                        </Link>
                                    </>
                                )}
                            </div>
                        </nav>
                    </motion.div>
                )}
            </AnimatePresence>
        </header >
    );
};
