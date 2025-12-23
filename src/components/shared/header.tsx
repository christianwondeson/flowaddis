"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, Plane, Hotel, Users, Bus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/shared/logo';
import { clsx } from 'clsx';
import { useAuth } from '@/components/providers/auth-provider';

export const Header: React.FC = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const pathname = usePathname();
    const { user, logout } = useAuth();

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
    const isHomePage = pathname === '/';

    return (
        <header
            className={clsx(
                'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
                isHomePage
                    ? (scrolled ? 'bg-white/90 backdrop-blur-md shadow-sm py-2' : 'bg-transparent py-4')
                    : 'bg-white/90 backdrop-blur-md shadow-sm py-2'
            )}
        >
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2">
                        <Logo />
                    </Link>

                    {/* Desktop Navigation */}
                    <nav
                        className={clsx(
                            'hidden md:flex items-center gap-1 px-2 py-1 rounded-full',
                            isHomePage && !scrolled
                                ? 'bg-transparent border-transparent'
                                : 'bg-white/50 backdrop-blur-sm border border-white/20'
                        )}
                    >
                        {navItems.map((item) => (
                            <Link
                                key={item.name}
                                href={item.path}
                                className={clsx(
                                    'flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all',
                                    isActive(item.path)
                                        ? 'bg-brand-primary text-white shadow-md'
                                        : (isHomePage && !scrolled
                                            ? 'text-white hover:bg-white/20'
                                            : 'text-brand-dark hover:bg-white hover:text-brand-primary')
                                )}
                            >
                                <item.icon className="w-4 h-4" />
                                {item.name}
                            </Link>
                        ))}
                    </nav>

                    {/* Auth Buttons */}
                    <div className="hidden md:flex items-center gap-3">
                        {user ? (
                            <div className="flex items-center gap-3">
                                <span className={clsx("text-sm font-medium", isHomePage && !scrolled ? "text-white" : "text-brand-dark")}>
                                    Hi, {user.name}
                                </span>
                                {user.role === 'admin' && (
                                    <Link href="/admin">
                                        <Button size="sm" variant="outline" className={clsx(isHomePage && !scrolled ? "border-white text-white hover:bg-white hover:text-brand-dark" : "")}>Admin</Button>
                                    </Link>
                                )}
                                <Button size="sm" variant="ghost" onClick={logout} className={clsx(isHomePage && !scrolled ? "text-white hover:bg-white/20" : "")}>Sign Out</Button>
                            </div>
                        ) : (
                            <>
                                <Link href="/signin">
                                    <Button variant="ghost" size="sm" className={clsx(
                                        isHomePage && !scrolled ? "text-white hover:bg-white/20" : "text-brand-dark hover:bg-white/50"
                                    )}>Sign In</Button>
                                </Link>
                                <Link href="/signup">
                                    <Button size="sm" className={clsx(isHomePage && !scrolled ? "bg-white text-brand-primary hover:bg-gray-100" : "")}>Sign Up</Button>
                                </Link>
                            </>
                        )}
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        className={clsx(
                            'md:hidden p-2 rounded-full',
                            isHomePage && !scrolled
                                ? 'text-white bg-white/10 hover:bg-white/20'
                                : 'text-brand-dark bg-white/70 backdrop-blur-sm'
                        )}
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                    >
                        {isMenuOpen ? <X /> : <Menu />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            {isMenuOpen && (
                <div className="md:hidden bg-white border-t border-gray-100 py-4 px-4 shadow-lg absolute w-full">
                    <nav className="flex flex-col gap-2">
                        {navItems.map((item) => (
                            <Link
                                key={item.name}
                                href={item.path}
                                className={clsx(
                                    'flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-medium',
                                    isActive(item.path)
                                        ? 'bg-brand-primary/10 text-brand-primary'
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
                                    {user.role === 'admin' && (
                                        <Link href="/admin" onClick={() => setIsMenuOpen(false)}>
                                            <Button variant="outline" className="w-full justify-center">Admin Dashboard</Button>
                                        </Link>
                                    )}
                                    <Button variant="ghost" className="w-full justify-center" onClick={() => { logout(); setIsMenuOpen(false); }}>Sign Out</Button>
                                </>
                            ) : (
                                <>
                                    <Link href="/signin" onClick={() => setIsMenuOpen(false)}>
                                        <Button variant="outline" className="w-full justify-center">Sign In</Button>
                                    </Link>
                                    <Link href="/signup" onClick={() => setIsMenuOpen(false)}>
                                        <Button className="w-full justify-center">Sign Up</Button>
                                    </Link>
                                </>
                            )}
                        </div>
                    </nav>
                </div>
            )}
        </header>
    );
};
