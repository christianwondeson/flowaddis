"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/react-query";
import { Toaster } from "sonner";
import { ReactNode } from "react";
import { AuthProvider } from "@/components/providers/auth-provider";

// Placeholder for AuthProvider and TripProvider
// import { TripProvider } from "@/context/TripContext";

export function Providers({ children }: { children: ReactNode }) {
    return (
        <QueryClientProvider client={queryClient}>
            <AuthProvider>
                {/* <TripProvider> */}
                <Toaster position="top-center" richColors />
                {children}
                {/* </TripProvider> */}
            </AuthProvider>
        </QueryClientProvider>
    );
}
