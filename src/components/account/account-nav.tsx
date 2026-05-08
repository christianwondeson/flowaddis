"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Briefcase, User } from "lucide-react";
import { clsx } from "clsx";

const links = [
    { href: "/dashboard", label: "Overview", icon: LayoutDashboard, match: (p: string) => p === "/dashboard" },
    { href: "/trips", label: "Trips", icon: Briefcase, match: (p: string) => p === "/trips" || p.startsWith("/trips/") },
    { href: "/profile", label: "Profile", icon: User, match: (p: string) => p === "/profile" || p.startsWith("/profile/") },
] as const;

/**
 * Sticky sub-navigation for the account area (web + mobile-friendly horizontal scroll).
 */
export function AccountNav() {
    const pathname = usePathname() || "";

    return (
        <nav
            className="sticky top-16 z-30 border-b border-border/80 bg-background/90 backdrop-blur-md"
            style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
            aria-label="Account sections"
        >
            <div className="container mx-auto max-w-3xl px-4 sm:px-6">
                <div className="flex gap-1.5 overflow-x-auto py-2.5 md:py-3 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                    {links.map(({ href, label, icon: Icon, match }) => {
                        const active = match(pathname);
                        return (
                            <Link
                                key={href}
                                href={href}
                                className={clsx(
                                    "flex shrink-0 items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition-colors min-h-[44px] touch-manipulation",
                                    active
                                        ? "bg-brand-primary text-white shadow-md shadow-brand-primary/20"
                                        : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground dark:bg-slate-800/80 dark:hover:bg-slate-800",
                                )}
                            >
                                <Icon className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
                                {label}
                            </Link>
                        );
                    })}
                </div>
            </div>
        </nav>
    );
}
