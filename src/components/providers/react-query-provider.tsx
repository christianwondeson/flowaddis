"use client";

import { ReactNode, useEffect } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { queryClient } from "@/lib/react-query";

// Client-only provider to wrap the app with TanStack Query
export function ReactQueryProvider({ children }: { children: ReactNode }) {
  // Expose the client for the TanStack Query Devtools browser extension
  useEffect(() => {
    if (typeof window !== "undefined") {
      // @ts-expect-error - augmenting window for the devtools extension
      window.__TANSTACK_QUERY_CLIENT__ = queryClient;
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
