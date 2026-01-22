"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/providers/auth-provider';
import { clsx } from 'clsx';
import { LogOut, User, LayoutDashboard, Settings } from 'lucide-react';
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
    const [isOpen, setIsOpen] = useState(false);

    if (loading) {
        return <div className="h-8 w-20 bg-gray-100 animate-pulse rounded-md"></div>;
    }

    if (!user) {
        const currentPath = typeof window !== 'undefined' ? window.location.pathname + window.location.search : '';
        const redirectQuery = `redirect=${encodeURIComponent(currentPath)}`;

        return (
            <div className="flex items-center gap-3">
                <Link href={`/signin?${redirectQuery}`}>
                    <Button variant="ghost" size="sm" className={clsx(
                        isHomePage && !scrolled ? "text-white hover:bg-white/20" : "text-brand-dark hover:bg-white/50"
                    )}>Sign In</Button>
                </Link>
                <Link href={`/signup?${redirectQuery}`}>
                    <Button size="sm" className={clsx(isHomePage && !scrolled ? "bg-white text-brand-primary hover:bg-gray-100" : "")}>Sign Up</Button>
                </Link>
            </div>
        );
    }

    return (
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    className={clsx(
                        "flex items-center gap-2 px-2 hover:bg-transparent focus:ring-0",
                        isHomePage && !scrolled ? "text-white hover:text-white/80" : "text-brand-dark"
                    )}
                >
                    <div className="h-8 w-8 rounded-full bg-brand-primary/10 flex items-center justify-center border border-brand-primary/20">
                        <span className="text-sm font-bold text-brand-primary">
                            {user.name?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
                        </span>
                    </div>
                    <div className="hidden md:block text-left">
                        <p className="text-sm font-medium leading-none">{user.name}</p>
                    </div>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 rounded-xl shadow-lg border-gray-100 p-2 bg-white">
                <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{user.name}</p>
                        <p className="text-xs leading-none text-muted-foreground">
                            {user.email}
                        </p>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />

                {user.role === 'admin' && (
                    <DropdownMenuItem asChild className="cursor-pointer rounded-lg focus:bg-gray-50">
                        <Link href="/admin" className="flex items-center w-full">
                            <LayoutDashboard className="mr-2 h-4 w-4" />
                            <span>Admin Dashboard</span>
                        </Link>
                    </DropdownMenuItem>
                )}

                <DropdownMenuItem asChild className="cursor-pointer rounded-lg focus:bg-gray-50">
                    <Link href="/profile" className="flex items-center w-full">
                        <User className="mr-2 h-4 w-4" />
                        <span>Profile</span>
                    </Link>
                </DropdownMenuItem>

                <DropdownMenuItem asChild className="cursor-pointer rounded-lg focus:bg-gray-50">
                    <Link href="/settings" className="flex items-center w-full">
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Settings</span>
                    </Link>
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                    className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50 rounded-lg"
                    onClick={() => logout()}
                >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};
