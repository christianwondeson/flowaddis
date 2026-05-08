"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/react-query";
import { Toaster } from "sonner";
import { ReactNode } from "react";
import { AuthProvider } from "@/components/providers/auth-provider";
import { LocaleProvider } from "@/components/providers/locale-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { TripCartSessionBridge } from "@/components/providers/trip-cart-session-bridge";
import type { AppLocale } from "@/lib/i18n/config";

export function Providers({
    children,
    initialLocale,
}: {
    children: ReactNode;
    initialLocale: AppLocale;
}) {
    return (
        <QueryClientProvider client={queryClient}>
            <LocaleProvider initialLocale={initialLocale}>
                <ThemeProvider>
                    <AuthProvider>
                        <TripCartSessionBridge />
                        <Toaster position="top-center" richColors />
                        {children}
                    </AuthProvider>
                </ThemeProvider>
            </LocaleProvider>
        </QueryClientProvider>
    );
}
