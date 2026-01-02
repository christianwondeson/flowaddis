"use client";

import { ReactQueryProvider } from "./react-query-provider";
import { Toaster } from "sonner";
import { ReactNode } from "react";
import { AuthProvider } from "@/components/providers/auth-provider";

export function Providers({ children }: { children: ReactNode }) {
    return (
        <ReactQueryProvider>
            <AuthProvider>
                <Toaster position="top-center" richColors />
                {children}
            </AuthProvider>
        </ReactQueryProvider>
    );
}
