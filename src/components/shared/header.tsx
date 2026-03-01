"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Menu, X, Plane, Hotel, Users, Bus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/shared/logo';
import { clsx } from 'clsx';
import { useAuth } from '@/components/providers/auth-provider';
import { UserMenu } from '@/components/shared/user-menu';
import { motion, AnimatePresence } from 'framer-motion';

export const Header: React.FC = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const { user, logout, loading } = useAuth();

    const currentPath = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : '');
    const redirectQuery = `redirect=${encodeURIComponent(currentPath)}`;

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const navItems = [
        { name: 'Flights', path: '/flights', icon: Plane },
        { name: 'Hotels', path: '/hotels', icon: Hotel },
        { name: 'Conferences', path: '/conferences', icon: Users },
        { name: 'Shuttles', path: '/shuttles', icon: Bus },
    ];

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
                    : 'bg-white shadow-md py-2 md:py-2'
            )}
            style={!(isTransparentPage && !showSolidHeader) ? { backgroundColor: 'white' } : undefined}
        >
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2">
                        <Logo light={isTransparentPage && !showSolidHeader} />
                    </Link>

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
                                        : 'text-slate-900 hover:text-teal-600',
                                        active && "after:content-[''] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-teal-600 after:rounded-full"
                                    )}
                                >
                                    <item.icon className="w-4 h-4" />
                                    {item.name}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Auth Buttons / User Menu - always visible */}
                    <div className="hidden md:flex items-center gap-3">
                        <UserMenu isHomePage={isTransparentPage} scrolled={showSolidHeader} />
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        className={clsx(
                            'md:hidden p-2 rounded-full transition-colors',
                            isTransparentPage && !showSolidHeader
                                ? 'text-white hover:bg-white/20'
                                : 'text-brand-dark hover:bg-gray-100'
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
                        className="md:hidden bg-white border-t border-gray-100 py-4 px-4 shadow-lg absolute w-full z-[70] overflow-hidden"
                    >
                        <nav className="flex flex-col gap-2">
                            {navItems.map((item) => (
                                <Link
                                    key={item.name}
                                    href={item.path}
                                    className={clsx(
                                        'flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-medium',
                                        isActive(item.path)
                                            ? 'bg-teal-100 text-teal-600'
                                            : 'text-gray-600 hover:bg-gray-50'
                                    )}
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    <item.icon className="w-5 h-5" />
                                    {item.name}
                                </Link>
                            ))}
                            <div className="flex flex-col gap-3 mt-4 pt-4 border-t border-gray-100">
                                {user ? (
                                    <>
                                        <div className="px-4 py-2 text-sm font-medium text-brand-dark">Hi, {user.name}</div>
                                        <Link href="/profile" className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 hover:bg-gray-50 font-medium" onClick={() => setIsMenuOpen(false)}>
                                            Profile
                                        </Link>
                                        <Link href="/settings" className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 hover:bg-gray-50 font-medium" onClick={() => setIsMenuOpen(false)}>
                                            Settings
                                        </Link>
                                        {user.role === 'admin' && (
                                            <Link href="/admin" onClick={() => setIsMenuOpen(false)}>
                                                <Button variant="outline" className="w-full justify-center">Dashboard</Button>
                                            </Link>
                                        )}
                                        <Button variant="ghost" className="w-full justify-center text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => { logout(); setIsMenuOpen(false); }}>Sign Out</Button>
                                    </>
                                ) : (
                                    <>
                                        <Link href={`/signin?${redirectQuery}`} onClick={() => setIsMenuOpen(false)}>
                                            <Button variant="outline" className="w-full justify-center">Sign In</Button>
                                        </Link>
                                        <Link href={`/signup?${redirectQuery}`} onClick={() => setIsMenuOpen(false)}>
                                            <Button className="w-full justify-center">Sign Up</Button>
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
