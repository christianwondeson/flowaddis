"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/providers/auth-provider';
import { canAccessAdmin, canAccessHotelPortal } from '@/lib/auth/admin-utils';
import { buildSignInHref } from '@/lib/auth/post-login-path';
import { useTranslations } from '@/components/providers/locale-provider';
import { clsx } from 'clsx';
import { LogOut, User, LayoutDashboard, Settings, Briefcase, Hotel, ShieldCheck } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface UserMenuProps {
    isHomePage: boolean;
    scrolled: boolean;
}

export const UserMenu: React.FC<UserMenuProps> = ({ isHomePage, scrolled }) => {
    const { user, logout, loading } = useAuth();
    const { t } = useTranslations();
    const [isOpen, setIsOpen] = useState(false);

    if (loading) {
        return <div className="h-8 w-20 bg-gray-100 dark:bg-slate-800 animate-pulse rounded-md" />;
    }

    if (!user) {
        const currentPath =
            typeof window !== 'undefined' ? window.location.pathname + window.location.search : '';

        return (
            <div className="flex items-center gap-3">
                <Link href={buildSignInHref(currentPath, '/signin')}>
                    <Button variant="ghost" size="sm" className={clsx(
                        isHomePage && !scrolled
                            ? "text-white hover:bg-white/20"
                            : "text-slate-900 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800"
                    )}>{t('common.signIn')}</Button>
                </Link>
                <Link href={buildSignInHref(currentPath, '/signup')}>
                    <Button size="sm" className={clsx(isHomePage && !scrolled ? "bg-white text-teal-600 hover:bg-gray-100" : "bg-teal-600 text-white hover:bg-teal-700")}>{t('common.register')}</Button>
                </Link>
            </div>
        );
    }

    const isAdmin = canAccessAdmin(user);
    const isHotelAdmin = user.role === 'hotel_admin' || canAccessHotelPortal(user);
    const isHotelStaff = user.role === 'hotel_staff';

    return (
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    className={clsx(
                        "flex items-center gap-2 px-2 hover:bg-transparent focus:ring-0",
                        isHomePage && !scrolled
                            ? "text-white hover:text-white/80"
                            : "text-slate-900 dark:text-slate-100 hover:text-slate-700 dark:hover:text-slate-200"
                    )}
                >
                    <div className="relative">
                        <div className={clsx(
                            "h-8 w-8 rounded-full flex items-center justify-center border font-bold text-sm",
                            isAdmin
                                ? "bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-700"
                                : isHotelAdmin
                                  ? "bg-teal-100 dark:bg-teal-900/50 text-teal-700 dark:text-teal-300 border-teal-300 dark:border-teal-700"
                                  : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700"
                        )}>
                            <span>{user.name?.[0]?.toUpperCase() || user.email[0].toUpperCase()}</span>
                        </div>
                        {isAdmin && (
                            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-purple-600 ring-2 ring-white dark:ring-slate-900" title="Super Admin" />
                        )}
                        {isHotelAdmin && !isAdmin && (
                            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-teal-600 ring-2 ring-white dark:ring-slate-900" title="Hotel Admin" />
                        )}
                    </div>
                    <div className="hidden md:block text-left">
                        <p className="text-sm font-medium leading-none text-inherit truncate max-w-[120px]">{user.name}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5 font-semibold">
                            {isAdmin ? 'Super Admin' : isHotelAdmin ? 'Hotel Admin' : isHotelStaff ? 'Hotel Staff' : 'Guest'}
                        </p>
                    </div>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
                align="end"
                className="z-[10020] w-60 rounded-xl border border-border bg-popover p-2 text-popover-foreground shadow-xl"
            >
                <DropdownMenuLabel className="font-normal px-3 py-2.5">
                    <div className="flex flex-col space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-bold text-popover-foreground truncate max-w-[130px]">{user.name || user.email.split('@')[0]}</p>
                            {isAdmin ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 px-2 py-0.5 text-[10px] font-bold text-purple-700 dark:text-purple-300 shrink-0">
                                    <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                                    Super Admin
                                </span>
                            ) : isHotelAdmin ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-teal-100 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 px-2 py-0.5 text-[10px] font-bold text-teal-700 dark:text-teal-300 shrink-0">
                                    <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                                    Hotel Admin
                                </span>
                            ) : isHotelStaff ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-sky-100 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800 px-2 py-0.5 text-[10px] font-bold text-sky-700 dark:text-sky-300 shrink-0">
                                    <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                                    Hotel Staff
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:text-slate-300 shrink-0">
                                    Guest
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                            {user.email}
                        </p>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="my-1" />

                {isAdmin && (
                    <DropdownMenuItem asChild className="cursor-pointer rounded-lg px-3 py-2 focus:bg-accent focus:text-accent-foreground">
                        <Link href="/admin" className="flex items-center w-full gap-2">
                            <ShieldCheck className="h-4 w-4 shrink-0 text-purple-600 dark:text-purple-400" />
                            <span className="font-semibold text-purple-700 dark:text-purple-300">{t('userMenu.adminDashboard')}</span>
                        </Link>
                    </DropdownMenuItem>
                )}

                {(isHotelAdmin || isHotelStaff) && (
                    <DropdownMenuItem asChild className="cursor-pointer rounded-lg px-3 py-2 focus:bg-accent focus:text-accent-foreground">
                        <Link href="/admin/hotel" className="flex items-center w-full gap-2">
                            <Hotel className="h-4 w-4 shrink-0 text-teal-600 dark:text-teal-400" />
                            <span className="font-semibold text-teal-700 dark:text-teal-300">Hotel Extranet Portal</span>
                        </Link>
                    </DropdownMenuItem>
                )}

                {/* For regular guests, show My Trips prominently */}
                {!isAdmin && !isHotelAdmin && (
                    <DropdownMenuItem asChild className="cursor-pointer rounded-lg px-3 py-2 focus:bg-accent focus:text-accent-foreground">
                        <Link href="/trips" className="flex items-center w-full gap-2">
                            <Briefcase className="h-4 w-4 shrink-0" />
                            <span>{t('userMenu.myTrips')}</span>
                        </Link>
                    </DropdownMenuItem>
                )}

                <DropdownMenuItem asChild className="cursor-pointer rounded-lg px-3 py-2 focus:bg-accent focus:text-accent-foreground">
                    <Link href="/profile" className="flex items-center w-full gap-2">
                        <User className="h-4 w-4 shrink-0" />
                        <span>{t('userMenu.profile')}</span>
                    </Link>
                </DropdownMenuItem>

                <DropdownMenuItem asChild className="cursor-pointer rounded-lg px-3 py-2 focus:bg-accent focus:text-accent-foreground">
                    <Link href="/settings" className="flex items-center w-full gap-2">
                        <Settings className="h-4 w-4 shrink-0" />
                        <span>{t('userMenu.settings')}</span>
                    </Link>
                </DropdownMenuItem>

                <DropdownMenuSeparator className="my-1" />

                <DropdownMenuItem
                    className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/40 rounded-lg px-3 py-2"
                    onClick={() => logout()}
                >
                    <LogOut className="mr-2 h-4 w-4 shrink-0" />
                    <span>{t('common.logOut')}</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};
