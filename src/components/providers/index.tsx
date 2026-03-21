"use client";

import { ReactQueryProvider } from "./react-query-provider";
import { Toaster } from "sonner";
import { ReactNode } from "react";
import { AuthProvider } from "@/components/providers/auth-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";

export function Providers({ children }: { children: ReactNode }) {
    return (
        <ReactQueryProvider>
            <ThemeProvider>
                <AuthProvider>
                    <Toaster position="top-center" richColors />
                    {children}
                </AuthProvider>
            </ThemeProvider>
        </ReactQueryProvider>
    );
}
